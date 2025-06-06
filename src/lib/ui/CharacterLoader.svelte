<!-- FILE: src/lib/ui/CharacterLoader.svelte -->
<script lang="ts">
	// Character Loader component
	// This component loads a character using file operations

	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import type { PageData } from '../../routes/characters/[id]/$types';
	import type { AssembledCharacter } from '$lib/domain/character/characterTypes';
	import type { CompleteCharacter } from '$lib/domain/exports';
	import type { GameKernel } from '$lib/domain/kernel/GameKernel';
	import { ErrorCode } from '$lib/domain/kernel/ErrorHandler';
	import { OpenMode } from '$lib/domain/kernel/types';

	// Constants for file paths
	const PATHS = {
		PROC_CHARACTER: '/v_proc/character',
		DEV_CHARACTER: '/v_dev/character',
		SYS_CLASSES: '/sys/class'
	};

	// Accept parent-managed components
	let { data = null, kernel = null } = $props<{
		data?: PageData | null;
		kernel?: GameKernel | null;
	}>();

	// Track file descriptors for cleanup
	let openFileDescriptors = $state<number[]>([]);

	// Local state
	let character = $state<AssembledCharacter | null>(null);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let diagnosticInfo = $state<Record<string, any>>({});

	// Store event subscription IDs for cleanup
	let subscriptions: string[] = [];

	// Add safety timer to prevent getting stuck in "waiting for device" state
	let deviceCheckTimer: any = null;

	// Create event dispatcher
	const dispatch = createEventDispatcher<{
		loading: boolean;
		loaded: AssembledCharacter;
		error: string;
	}>();

	// Helper function to get timestamps for logs
	function getTimestamp() {
		const now = new Date();
		return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
	}

	// Helper function to track file descriptors
	function registerFd(fd: number) {
		if (fd > 0) {
			openFileDescriptors = [...openFileDescriptors, fd];
		}
		return fd;
	}

	// Helper to close a file descriptor and remove from tracking
	function closeFd(fd: number) {
		if (fd > 0 && kernel) {
			try {
				kernel.close(fd);
			} catch (e) {
				console.error(`Error closing fd ${fd}:`, e);
			}
			openFileDescriptors = openFileDescriptors.filter((openFd) => openFd !== fd);
		}
	}

	// Load character using unix-style file operations
	async function loadCharacterUnix(
		characterId: string | number,
		forceRefresh: boolean = false,
		preloadedData: any = null
	): Promise<AssembledCharacter> {
		console.log(`[DEBUG] loadCharacterUnix starting for character ${characterId}`);
		if (!kernel) {
			throw new Error('Kernel not available, cannot load character');
		}

		// Create character entity path
		// Characters are FILES, not directories
		const characterPath = `${PATHS.PROC_CHARACTER}/${characterId}`;

		// Check if path exists as a directory (would be an error)
		const stats = kernel.stat(characterPath);
		if (stats?.isDirectory) {
			console.error(
				`Found a directory at ${characterPath} when it should be a file. This will cause errors.`
			);
		}

		// Check if the character device is mounted and available
		// Ensure devices map exists
		if (!kernel.devices) {
			console.error('Device map is undefined, creating empty map');
			kernel.devices = new Map();
		}

		// Check for character device mount
		if (!kernel.devices.has(PATHS.DEV_CHARACTER)) {
			console.error(
				`Character device not found in devices map. Available devices:`,
				Array.from(kernel.devices.keys())
			);
			throw new Error(
				`Character device not mounted at ${PATHS.DEV_CHARACTER}: ${ErrorCode.EDEVNOTREADY}`
			);
		}

		// Open character device to use its API
		const deviceFd = registerFd(kernel.open(PATHS.DEV_CHARACTER, OpenMode.READ));

		if (deviceFd < 0) {
			throw new Error(`Failed to open character device: ${ErrorCode[-deviceFd]}`);
		}

		try {
			// Use device to get character data through the ioctl interface
			// This is similar to how Unix device drivers work
			const buffer: any = {
				operation: 'getCharacter',
				entityPath: characterPath,
				characterId
			};
			console.log(
				`[CharacterLoader] Calling ioctl with request code 1001 (GET_CHARACTER) and buffer:`,
				buffer
			);
			// Note: ioctl is now an async function
			const result = await kernel.ioctl(deviceFd, 1001, buffer);
			console.log(`[CharacterLoader] ioctl result: ${result}, buffer now:`, {
				id: buffer.character?.id,
				name: buffer.character?.name,
				errorDetails: buffer.errorDetails
			});

			if (result !== 0) {
				console.error(
					`[CharacterLoader] Failed ioctl call with error code: ${result}`,
					buffer.errorDetails || 'No error details'
				);
				throw new Error(`Failed to get character data: ${ErrorCode[result]}`);
			}

			// Validate character data
			const loadedCharacter = buffer.character as AssembledCharacter;
			if (!loadedCharacter?.id) {
				// Check if there are error details to include
				const errorDetails = buffer.errorDetails
					? `Error details: ${JSON.stringify(buffer.errorDetails)}`
					: '';

				// Log the error with more details for debugging
				console.error(
					`[CharacterLoader] Invalid character data received from device. Buffer:`,
					buffer
				);

				throw new Error(`Invalid character data received from device. ${errorDetails}`);
			}

			// Calculate totalLevel from class levels
			const totalLevel = loadedCharacter.game_character_class?.reduce(
				(sum, classEntry) => sum + (classEntry.level || 0),
				0
			) || 0;
			
			// Add totalLevel to the character data
			loadedCharacter.totalLevel = totalLevel;
			
			// Log successful character data for debugging
			console.log(`[CharacterLoader] Loaded character successfully:`, {
				id: loadedCharacter.id,
				name: loadedCharacter.name,
				classes: loadedCharacter.game_character_class?.map((c) => `${c.class?.name} ${c.level}`).join(', ') || [],
				totalLevel: loadedCharacter.totalLevel
			});

			// Add preloaded data if available
			if (preloadedData && typeof preloadedData === 'object') {
				console.log(`Merging preloaded data with device data`);
				Object.assign(loadedCharacter, preloadedData);
			}

			// Store character data in proc file if it doesn't exist
			// If path is a directory, try to fix it
			if (stats?.isDirectory) {
				// Try to remove the directory
				console.log(`Attempting to remove directory at ${characterPath}`);
				kernel.unlink(characterPath);
			}

			// Make sure parent directories exist before creating character file
			if (!kernel.exists('/v_proc')) {
				console.log('Creating /proc directory');
				kernel.mkdir('/v_proc');
			}

			if (!kernel.exists('/v_proc/character')) {
				console.log('Creating /proc/character directory');
				kernel.mkdir('/v_proc/character');
			}

			// Create/update file if it doesn't exist or was a directory
			if (!kernel.exists(characterPath) || stats?.isDirectory) {
				// Create the file with data from the device
				console.log(`Creating character file at ${characterPath}`);
				const createResult = kernel.create(characterPath, loadedCharacter);
				if (!createResult.success) {
					console.warn(
						`Failed to create character file: ${createResult.errorMessage || 'Unknown error'}`
					);
				}
			}

			// Record diagnostic info
			diagnosticInfo = {
				characterId: loadedCharacter.id,
				loadTime: new Date().toISOString(),
				source: 'device',
				ancestryId: loadedCharacter.game_character_ancestry?.[0]?.ancestry_id,
				ancestry: loadedCharacter.game_character_ancestry?.[0]?.ancestry?.name,
				classes: loadedCharacter.game_character_class?.map((c) => c.class?.name),
				level: loadedCharacter.totalLevel,
				wasDirectory: stats?.isDirectory || false
			};

			return loadedCharacter;
		} finally {
			closeFd(deviceFd);
		}
	}

	// State machine states
	const LoaderState = {
		INITIAL: 'initial',
		WAITING_FOR_RESOURCES: 'waiting_for_resources',
		LOADING: 'loading',
		LOADED: 'loaded',
		ERROR: 'error'
	} as const;

	type LoaderStateType = typeof LoaderState[keyof typeof LoaderState];

	// State machine
	let currentState = $state<LoaderStateType>(LoaderState.INITIAL);
	let loadingAttempts = 0;
	const MAX_LOADING_ATTEMPTS = 3;

	// Check if all required resources are available
	function checkResourcesAvailable(): boolean {
		if (!kernel) return false;

		// Ensure devices map exists
		if (!kernel.devices) {
			kernel.devices = new Map();
		}

		const hasCharDevice = kernel.devices.has(PATHS.DEV_CHARACTER);
		const hasDbDevice = kernel.devices.has('/v_dev/db');
		const dbDirsReady = kernel.exists('/v_etc/db_dirs_ready');

		return hasCharDevice && hasDbDevice && dbDirsReady;
	}

	// State transition functions
	async function transitionToWaitingForResources() {
		console.log(`${getTimestamp()} - Transitioning to WAITING_FOR_RESOURCES state`);
		currentState = LoaderState.WAITING_FOR_RESOURCES;

		// Set up event listeners for resource availability
		setupResourceListeners();

		// Start safety timer
		startSafetyTimer();
	}

	async function transitionToLoading() {
		console.log(`${getTimestamp()} - Transitioning to LOADING state`);
		currentState = LoaderState.LOADING;
		isLoading = true;
		error = null;
		dispatch('loading', true);

		try {
			if (!kernel || !data?.id) {
				throw new Error('Missing kernel or character ID');
			}

			// Load character
			const loadedCharacter = await loadCharacterUnix(
				data.id,
				false,
				data.initialCharacter
			);

			// Success - transition to loaded state
			character = loadedCharacter;
			transitionToLoaded();
		} catch (loadError) {
			transitionToError(loadError);
		}
	}

	function transitionToLoaded() {
		console.log(`${getTimestamp()} - Transitioning to LOADED state`);
		currentState = LoaderState.LOADED;
		isLoading = false;
		loadingAttempts = 0;

		if (character) {
			console.log(`${getTimestamp()} - Character loaded successfully:`, {
				id: character.id,
				name: character.name,
				classes: character.game_character_class?.map((c) => `${c.class?.name} ${c.level}`).join(', ') || [],
				ancestry: character.game_character_ancestry?.[0]?.ancestry?.name,
				totalLevel: character.totalLevel
			});

			dispatch('loaded', character);
		}
	}

	function transitionToError(loadError: any) {
		console.error(`${getTimestamp()} - Failed to load character:`, loadError);
		currentState = LoaderState.ERROR;
		isLoading = false;
		loadingAttempts++;

		// Create informative error message
		let errorMessage = loadError instanceof Error ? loadError.message : 'Failed to load character data';

		// Add specific information for known error types
		if (loadError instanceof Error) {
			if (
				loadError.message.includes('Database error') ||
				loadError.message.includes('Character not found')
			) {
				errorMessage = `Database error: ${loadError.message}. Please check if this character ID exists in the database.`;
				diagnosticInfo.errorType = 'database';
			} else if (
				loadError.message.includes('Character device not mounted') ||
				loadError.message.includes('EDEVNOTREADY')
			) {
				errorMessage = `Device not ready: ${loadError.message}. The system is still initializing.`;
				diagnosticInfo.errorType = 'device';

				// If it's a device error and we haven't exceeded max attempts, wait for resources
				if (loadingAttempts < MAX_LOADING_ATTEMPTS) {
					transitionToWaitingForResources();
					return;
				}
			} else if (loadError.message.includes('ENOSYS')) {
				errorMessage = 'System error: Database capability not available';
				diagnosticInfo.errorType = 'capability';
			} else if (loadError.message.includes('EIO')) {
				errorMessage = 'I/O error: Failed to read from database';
				diagnosticInfo.errorType = 'io';
			}
		}

		error = errorMessage;
		dispatch('error', error);

		// Update diagnostic info
		diagnosticInfo = {
			...diagnosticInfo,
			characterId: data?.id,
			errorTime: new Date().toISOString(),
			errorMessage: errorMessage,
			originalError: loadError instanceof Error ? loadError.message : String(loadError),
			attemptNumber: loadingAttempts
		};
	}

	// Set up event listeners for resource availability
	function setupResourceListeners() {
		if (!kernel || !kernel.events) return;

		// Clear existing subscriptions
		clearSubscriptions();

		// Listen for mount events
		const mountSub = kernel.events.on('fs:mount', handleMountEvent);
		if (mountSub) subscriptions.push(mountSub);

		// Listen for device ready events
		const charReadySub = kernel.events.on('character:device_ready', handleDeviceReady);
		if (charReadySub) subscriptions.push(charReadySub);

		const dbReadySub = kernel.events.on('database:ready', handleDatabaseReady);
		if (dbReadySub) subscriptions.push(dbReadySub);

		const dbRecoveredSub = kernel.events.on('database:recovered', handleDatabaseRecovered);
		if (dbRecoveredSub) subscriptions.push(dbRecoveredSub);
	}

	// Event handlers
	function handleMountEvent(event: any) {
		console.log(`${getTimestamp()} - Mount event received:`, event);

		if (currentState === LoaderState.WAITING_FOR_RESOURCES) {
			if (checkResourcesAvailable()) {
				console.log(`${getTimestamp()} - All resources now available after mount`);
				transitionToLoading();
			}
		}
	}

	function handleDeviceReady(event: any) {
		console.log(`${getTimestamp()} - Character device ready event received:`, event);

		if (currentState === LoaderState.WAITING_FOR_RESOURCES) {
			if (checkResourcesAvailable()) {
				transitionToLoading();
			}
		}
	}

	function handleDatabaseReady(event: any) {
		console.log(`${getTimestamp()} - Database ready event received:`, event);

		if (currentState === LoaderState.WAITING_FOR_RESOURCES) {
			if (checkResourcesAvailable()) {
				transitionToLoading();
			}
		}
	}

	function handleDatabaseRecovered(event: any) {
		console.log(`${getTimestamp()} - Database recovered event received:`, event);

		if (event.characterId === data?.id && currentState === LoaderState.WAITING_FOR_RESOURCES) {
			if (checkResourcesAvailable()) {
				transitionToLoading();
			}
		}
	}

	// Safety timer to periodically check resource availability
	function startSafetyTimer() {
		clearInterval(deviceCheckTimer);

		deviceCheckTimer = setInterval(() => {
			if (currentState === LoaderState.WAITING_FOR_RESOURCES) {
				console.log(`${getTimestamp()} - Safety timer checking resource availability`);

				if (kernel && checkResourcesAvailable()) {
					console.log(`${getTimestamp()} - Resources available via safety timer`);
					transitionToLoading();
				} else if (kernel) {
					// Try to create missing sentinel file if devices are ready
					tryCreateSentinelFile();
				}
			}
		}, 1000);
	}

	// Try to create the sentinel file if devices are ready but file is missing
	function tryCreateSentinelFile() {
		if (!kernel || !kernel.devices) return;

		const hasCharDevice = kernel.devices.has(PATHS.DEV_CHARACTER);
		const hasDbDevice = kernel.devices.has('/v_dev/db');
		const sentinelExists = kernel.exists('/v_etc/db_dirs_ready');

		if (hasCharDevice && hasDbDevice && !sentinelExists) {
			console.log(`${getTimestamp()} - Both devices available but missing sentinel file, creating it`);

			// Ensure /etc directory exists
			if (!kernel.exists('/v_etc')) {
				kernel.mkdir('/v_etc');
			}

			// Create the sentinel file
			try {
				const createResult = kernel.create('/v_etc/db_dirs_ready', {
					timestamp: Date.now(),
					status: 'ready',
					createdBy: 'CharacterLoader safety timer'
				});

				if (createResult.success) {
					console.log(`${getTimestamp()} - Successfully created sentinel file`);
				} else {
					console.error(`${getTimestamp()} - Failed to create sentinel file: ${createResult.errorMessage}`);
				}
			} catch (sentinelError) {
				console.error(`${getTimestamp()} - Error creating sentinel file:`, sentinelError);
			}
		}
	}

	// Clear event subscriptions
	function clearSubscriptions() {
		if (kernel && kernel.events) {
			subscriptions.forEach((id) => {
				kernel.events.off(id);
			});
		}
		subscriptions = [];
	}

	// Initialize loading when kernel and data are available
	function initializeLoading() {
		if (!kernel || !data?.id) {
			if (!data?.id) {
				console.warn(`${getTimestamp()} - No character ID received`);
				error = 'No character ID received';
				isLoading = false;
				currentState = LoaderState.ERROR;
				dispatch('error', error);
			}
			return;
		}

		console.log(`${getTimestamp()} - Initializing character load for ID: ${data.id}`);

		// Check if resources are available
		if (checkResourcesAvailable()) {
			transitionToLoading();
		} else {
			transitionToWaitingForResources();
		}
	}

	// React to kernel changes
	$effect(() => {
		// Only react to kernel becoming available when in initial state
		if (kernel && currentState === LoaderState.INITIAL) {
			initializeLoading();
		}
	});

	// Component lifecycle
	onMount(() => {
		console.log(`${getTimestamp()} - Unix Character Loader mounted with ID: ${data?.id}`);
		
		// Initialize if kernel is already available
		if (kernel && currentState === LoaderState.INITIAL) {
			initializeLoading();
		}
	});

	onDestroy(() => {
		// Clean up resources
		clearSubscriptions();

		// Close all open file descriptors
		if (kernel) {
			openFileDescriptors.forEach((fd) => {
				try {
					kernel.close(fd);
				} catch (e) {
					console.error(`Error closing fd ${fd} during cleanup:`, e);
				}
			});
		}

		// Clear the safety timer
		if (deviceCheckTimer) {
			clearInterval(deviceCheckTimer);
			deviceCheckTimer = null;
		}

		// Clear waiting time storage
		try {
			localStorage.removeItem('waitingStartTime');
		} catch (e) {
			// Ignore errors with localStorage
		}
	});

	// Public methods for parent components
	export function retryLoading() {
		if (currentState === LoaderState.ERROR) {
			loadingAttempts = 0;
			initializeLoading();
		}
	}

	export function forceReconnectDrivers() {
		if (!kernel) {
			alert('Kernel not available. Try reloading the page.');
			return;
		}

		console.log('Forcing database driver reconnection');

		// Find the database driver
		const dbDevice = kernel.mountPoints?.get('/v_dev/db') || kernel.devices?.get('/v_dev/db');

		// Find the character device
		const charDevice = kernel.mountPoints?.get('/v_dev/character') || kernel.devices?.get('/v_dev/character');

		if (dbDevice && charDevice) {
			// Force connect database driver to character capability
			console.log('Found both devices, connecting them');

			// Try to get the actual driver from the device
			const dbDriver = dbDevice.driver || dbDevice;

			// Connect the driver to the character device
			(charDevice as any).databaseDriver = dbDriver;

			// Signal that db connection has been repaired
			if (kernel.events) {
				kernel.events.emit('database:connection_repaired', {
					timestamp: Date.now(),
					source: 'manual_reconnect',
					characterId: data?.id
				});
			}

			// Retry loading
			loadingAttempts = 0;
			initializeLoading();
		} else {
			alert(
				`Could not find required devices. Missing: ${!dbDevice ? 'Database' : ''} ${!charDevice ? 'Character' : ''}\nCheck console for details. Try reloading the page.`
			);
		}
	}
</script>

{#if isLoading}
	<div class="flex items-center justify-center">
		<div
			class="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary"
		></div>
		<p class="ml-2">Loading character{currentState === LoaderState.WAITING_FOR_RESOURCES ? ' (waiting for resources)' : ''}...</p>
	</div>
{:else if error}
	<div class="rounded-md bg-red-100 p-4 text-red-800">
		<p class="font-semibold">Error loading character</p>
		<p>{error}</p>

		<div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
			<div>
				<h3 class="mb-2 font-medium">Suggestions:</h3>
				<ul class="list-disc space-y-1 pl-5">
					<li>Check if Supabase is running: <code>docker ps | grep supabase</code></li>
					<li>
						Visit the <a href="/diagnostics" class="text-blue-600 hover:underline"
							>diagnostics page</a
						> for detailed testing
					</li>
					<li>Verify character exists in database</li>
					<li>Ensure all devices are mounted correctly</li>
				</ul>
			</div>

			<div>
				<h3 class="mb-2 font-medium">Common Solutions:</h3>
				<ul class="list-disc space-y-1 pl-5">
					<li>Restart Supabase: <code>supabase stop && supabase start</code></li>
					<li>Check environment variables in <code>.env</code> file</li>
					<li>Clear browser cache and reload</li>
				</ul>
			</div>
		</div>

		{#if Object.keys(diagnosticInfo).length > 0}
			<details class="mt-4">
				<summary class="cursor-pointer font-medium">Diagnostic Information</summary>
				<pre class="mt-2 overflow-auto rounded bg-red-50 p-2 text-xs">
{JSON.stringify(diagnosticInfo, null, 2)}</pre>
			</details>
		{/if}

		<div class="mt-4 flex flex-wrap gap-2">
			<button
				class="rounded bg-primary px-4 py-2 text-white"
				onclick={() => retryLoading()}
			>
				Retry Loading
			</button>
			<a href="/diagnostics" class="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300">
				Run Diagnostics
			</a>
			<button
				class="rounded bg-orange-500 px-4 py-2 text-white"
				onclick={() => forceReconnectDrivers()}
			>
				Force Reconnect Drivers
			</button>
		</div>
	</div>
{:else if character}
	<!-- svelte-ignore slot_element_deprecated -->
	<slot></slot>
{:else}
	<div class="rounded-md bg-yellow-100 p-4 text-yellow-800">
		<p>No character data available.</p>
	</div>
{/if}