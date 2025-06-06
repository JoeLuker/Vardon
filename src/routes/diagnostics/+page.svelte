<script lang="ts">
	// Diagnostics Page
	import { onMount } from 'svelte';
	import type { GameKernel } from '$lib/domain/kernel/GameKernel';
	import type { SupabaseDatabaseDriver } from '$lib/domain/capabilities/database/SupabaseDatabaseDriver';
	import { CharacterCapability } from '$lib/domain/capabilities/character/CharacterCapability';
	import { OpenMode } from '$lib/domain/kernel/types';

	// State variables
	let kernel: GameKernel | null = null;
	let databaseDriver: SupabaseDatabaseDriver | null = null;
	let characterCapability: CharacterCapability | null = null;
	let diagnosticResults: any[] = [];
	let selectedCharacterId = 1;
	let showConsole = false;
	let consoleLines: string[] = [];

	// Initialize devices Map if undefined
	if (kernel && !kernel.devices) {
		kernel.devices = new Map();
	}

	// Intercept console logs for debugging
	const originalConsoleLog = console.log;
	const originalConsoleError = console.error;
	const originalConsoleWarn = console.warn;

	function interceptConsole() {
		console.log = function (...args) {
			originalConsoleLog.apply(console, args);
			consoleLines = [
				...consoleLines,
				`LOG: ${args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ')}`
			];
		};

		console.error = function (...args) {
			originalConsoleError.apply(console, args);
			consoleLines = [
				...consoleLines,
				`ERROR: ${args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ')}`
			];
		};

		console.warn = function (...args) {
			originalConsoleWarn.apply(console, args);
			consoleLines = [
				...consoleLines,
				`WARN: ${args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ')}`
			];
		};
	}

	function restoreConsole() {
		console.log = originalConsoleLog;
		console.error = originalConsoleError;
		console.warn = originalConsoleWarn;
	}

	// Log function for diagnostics
	function logDiagnostic(label: string, success: boolean, details: any = null) {
		// Find any existing result with the same label and remove it
		const filteredResults = diagnosticResults.filter(
			(r) => !r.label.startsWith(label.split(' ')[0])
		);

		// Add the new result
		diagnosticResults = [
			...filteredResults,
			{
				label,
				success,
				details,
				timestamp: new Date().toISOString()
			}
		];
	}

	// Initialize the kernel and components
	async function initializeSystem() {
		try {
			// Start capturing console
			interceptConsole();

			// Step 1: Create kernel
			logDiagnostic('Creating kernel...', false);
			const kernelModule = await import('$lib/domain/kernel/GameKernel');
			const eventModule = await import('$lib/domain/kernel/EventBus');
			kernel = new kernelModule.GameKernel({
				debug: true,
				eventEmitter: new eventModule.EventBus(true)
			});
			logDiagnostic('Kernel initialization', true, { kernelVersion: '1.0', initialized: true });

			// Step 2: Create required directories
			logDiagnostic('Creating directories...', false);
			if (!kernel.exists('/v_proc')) {
				const procResult = kernel.mkdir('/v_proc');
				if (typeof procResult === 'number' && procResult !== 0) {
					logDiagnostic('Directory creation', false, {
						errorCode: procResult,
						details: 'Failed to create /proc directory'
					});
					return;
				}
			}

			if (!kernel.exists('/v_proc/character')) {
				const charDirResult = kernel.mkdir('/v_proc/character');
				if (typeof charDirResult === 'number' && charDirResult !== 0) {
					logDiagnostic('Directory creation', false, {
						errorCode: charDirResult,
						details: 'Failed to create /proc/character directory'
					});
					return;
				}
			}

			if (!kernel.exists('/v_entity')) {
				const entityDirResult = kernel.mkdir('/v_entity');
				if (typeof entityDirResult === 'number' && entityDirResult !== 0) {
					logDiagnostic('Directory creation', false, {
						errorCode: entityDirResult,
						details: 'Failed to create /entity directory'
					});
					return;
				}
			}
			logDiagnostic('Directory creation', true, {
				created: ['/v_proc', '/v_proc/character', '/v_entity']
			});

			// Step 3: Create capabilities
			logDiagnostic('Creating capabilities...', false);
			const { createBonusCapability } = await import('$lib/domain/capabilities/bonus');
			const { createAbilityCapability } = await import('$lib/domain/capabilities/ability');
			const { createSkillCapability } = await import('$lib/domain/capabilities/skill');
			const { createCombatCapability } = await import('$lib/domain/capabilities/combat');

			// Create capabilities with Unix-style composition
			const bonusCapability = createBonusCapability({ debug: true });
			const abilityCapability = createAbilityCapability(bonusCapability, { debug: true });
			const skillCapability = createSkillCapability(abilityCapability, bonusCapability, {
				debug: true
			});
			const combatCapability = createCombatCapability(abilityCapability, bonusCapability, {
				debug: true
			});

			// Create character capability
			characterCapability = new CharacterCapability();
			logDiagnostic('Capability creation', true, {
				capabilities: ['bonus', 'ability', 'skill', 'combat', 'character']
			});

			// Step 4: Mount capabilities as device files
			logDiagnostic('Mounting capabilities...', false);
			kernel.mount('/v_dev/bonus', bonusCapability);
			kernel.mount('/v_dev/ability', abilityCapability);
			kernel.mount('/v_dev/skill', skillCapability);
			kernel.mount('/v_dev/combat', combatCapability);
			kernel.mount('/v_dev/character', characterCapability);

			// List all mounted devices to verify
			const mountedDevices = Array.from(kernel.devices.keys());
			logDiagnostic('Capability mounting', true, { mountedDevices });

			// Step 5: Create database driver
			logDiagnostic('Creating database driver...', false);
			const { SupabaseDatabaseDriver } = await import(
				'$lib/domain/capabilities/database/SupabaseDatabaseDriver'
			);

			// Create database driver (now using Unix-style initialization without direct client)
			databaseDriver = new SupabaseDatabaseDriver(null, kernel, true);

			// Mount database driver as device
			kernel.mount('/v_dev/db', databaseDriver);

			// Update CharacterCapability with the database driver
			characterCapability.databaseDriver = databaseDriver;
			logDiagnostic('Database driver setup', true, {
				driver: databaseDriver.constructor?.name || 'SupabaseDatabaseDriver',
				mounted: true,
				connectedToCharCapability: !!characterCapability.databaseDriver
			});

			// Step 6: Verify database connection
			logDiagnostic('Testing database connection...', false);
			try {
				// Use unix-style file operations to test database access
				const characterListFd = kernel.open('/v_proc/character/list', OpenMode.READ);
				if (characterListFd < 0) {
					logDiagnostic('Database connection', false, { error: 'Failed to open character list' });
					return;
				}

				// Read characters list
				const buffer: any = {};
				const [result] = kernel.read(characterListFd, buffer);
				kernel.close(characterListFd);

				if (result !== 0) {
					logDiagnostic('Database connection', false, { error: `Read error: ${result}` });
					return;
				}

				const characters = buffer.characters || [];
				logDiagnostic('Database connection', true, {
					characterCount: characters.length,
					characters: characters.map((c: any) => ({ id: c.id, name: c.name }))
				});
			} catch (dbError) {
				logDiagnostic('Database connection', false, { error: dbError });
				return;
			}

			// Everything is initialized
			logDiagnostic('System initialization', true, {
				status: 'complete',
				timestamp: new Date().toISOString()
			});
		} catch (error) {
			logDiagnostic('System initialization', false, {
				error: error.message,
				stack: error.stack,
				timestamp: new Date().toISOString()
			});
		}
	}

	// Test character loading for a specific ID
	async function testCharacterLoading() {
		try {
			if (!kernel || !characterCapability) {
				logDiagnostic(
					'Cannot test character loading - kernel or characterCapability not initialized',
					false
				);
				return;
			}

			const characterId = selectedCharacterId;
			logDiagnostic(`Character loading (ID ${characterId})`, false, {
				status: 'starting',
				characterId
			});

			// Create character path
			const characterPath = `/v_proc/character/${characterId}`;

			// Check if the character device is mounted
			if (!kernel.devices.has('/v_dev/character')) {
				logDiagnostic('Character loading', false, {
					error: 'Character device not mounted',
					characterId
				});
				return;
			}

			// Open character device
			const deviceFd = kernel.open('/v_dev/character', OpenMode.READ);

			if (deviceFd < 0) {
				logDiagnostic('Character loading', false, {
					error: 'Failed to open character device',
					errorCode: deviceFd,
					characterId
				});
				return;
			}

			try {
				// Prepare ioctl buffer
				const buffer: any = {
					operation: 'getCharacter',
					entityPath: characterPath,
					characterId
				};

				// Call ioctl
				const result = await kernel.ioctl(deviceFd, 1001, buffer); // 1001 = GET_CHARACTER

				if (result !== 0) {
					logDiagnostic('Character loading', false, {
						error: 'ioctl failed',
						result,
						errorCode: result,
						characterId,
						errorDetails: buffer.errorDetails || 'No error details available'
					});
					return;
				}

				// Check character data
				if (!buffer.character || !buffer.character.id) {
					logDiagnostic('Character loading', false, {
						error: 'Invalid character data received',
						characterId,
						bufferKeys: Object.keys(buffer)
					});
					return;
				}

				// Log character details
				const character = buffer.character;
				logDiagnostic('Character loading', true, {
					id: character.id,
					name: character.name,
					classes: character.game_character_class?.map((c) => c.class?.name) || [],
					ancestry: character.game_character_ancestry?.[0]?.ancestry?.name || 'Unknown',
					abilities:
						character.game_character_ability?.map((a) => ({
							name: a.ability?.label,
							value: a.value
						})) || []
				});

				// Try to create character file if it doesn't exist
				if (!kernel.exists(characterPath)) {
					const createResult = kernel.create(characterPath, character);
					if (!createResult.success) {
						logDiagnostic('Character file creation', false, {
							error: createResult.errorMessage,
							path: characterPath
						});
					} else {
						logDiagnostic('Character file creation', true, {
							path: characterPath,
							created: true
						});
					}
				}
			} finally {
				// Close file descriptor
				kernel.close(deviceFd);
			}
		} catch (error) {
			logDiagnostic('Character loading', false, {
				error: error.message,
				stack: error.stack,
				characterId
			});
		}
	}

	// Initialize on component mount
	onMount(() => {
		initializeSystem();

		// Cleanup on destroy
		return () => {
			restoreConsole();
		};
	});
</script>

<div class="mx-auto max-w-4xl p-4">
	<h1 class="mb-4 text-2xl font-bold">System Diagnostics</h1>

	<div class="mb-4 rounded border border-blue-200 bg-blue-50 p-4">
		<p class="text-blue-800">
			This page helps diagnose character loading issues by testing each component individually.
		</p>
	</div>

	<div class="mb-6">
		<h2 class="mb-2 text-xl font-semibold">System Initialization</h2>
		<div class="space-y-1">
			{#each diagnosticResults.filter((r) => !r.label
						.toLowerCase()
						.includes('character loading') && !r.label
						.toLowerCase()
						.includes('file creation')) as result}
				<div
					class="rounded border p-2 {result.success
						? 'border-green-200 bg-green-50'
						: 'border-red-200 bg-red-50'}"
				>
					<div class="flex justify-between">
						<span class="font-medium">{result.label}</span>
						<span class={result.success ? 'text-green-600' : 'text-red-600'}
							>{result.success ? '✓ Success' : '✗ Failed'}</span
						>
					</div>
					{#if result.details}
						<details class="mt-1">
							<summary class="cursor-pointer text-sm text-gray-600">Details</summary>
							<pre
								class="mt-1 overflow-auto rounded bg-gray-800 p-2 text-xs text-white">{JSON.stringify(
									result.details,
									null,
									2
								)}</pre>
						</details>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<div class="mb-6">
		<h2 class="mb-2 text-xl font-semibold">Character Loading Test</h2>
		<div class="mb-4 flex gap-2">
			<input
				type="number"
				bind:value={selectedCharacterId}
				min="1"
				class="w-20 rounded border p-2"
			/>
			<button
				on:click={testCharacterLoading}
				class="rounded bg-blue-500 px-4 py-2 text-white"
				disabled={!kernel || !characterCapability}
			>
				Test Loading
			</button>
		</div>

		<div class="space-y-1">
			{#each diagnosticResults.filter((r) => r.label
						.toLowerCase()
						.includes('character loading') || r.label
						.toLowerCase()
						.includes('file creation')) as result}
				<div
					class="rounded border p-2 {result.success
						? 'border-green-200 bg-green-50'
						: 'border-red-200 bg-red-50'}"
				>
					<div class="flex justify-between">
						<span class="font-medium">{result.label}</span>
						<span class={result.success ? 'text-green-600' : 'text-red-600'}
							>{result.success ? '✓ Success' : '✗ Failed'}</span
						>
					</div>
					{#if result.details}
						<details class="mt-1">
							<summary class="cursor-pointer text-sm text-gray-600">Details</summary>
							<pre
								class="mt-1 overflow-auto rounded bg-gray-800 p-2 text-xs text-white">{JSON.stringify(
									result.details,
									null,
									2
								)}</pre>
						</details>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<div class="mb-4">
		<button
			on:click={() => (showConsole = !showConsole)}
			class="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
		>
			{showConsole ? 'Hide Console' : 'Show Console'}
		</button>
	</div>

	{#if showConsole}
		<div class="mb-6">
			<h2 class="mb-2 text-xl font-semibold">Console Output</h2>
			<div class="h-64 overflow-auto rounded bg-black p-4 font-mono text-sm text-green-400">
				{#each consoleLines as line}
					<div>{line}</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
