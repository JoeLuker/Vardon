<!-- FILE: src/lib/ui/CharacterPage.svelte -->
<script lang="ts">
	// Core imports
	import { onMount } from 'svelte';

	// Types
	import type { PageData } from '../../routes/characters/[id]/$types';
	import type { AssembledCharacter } from '$lib/domain/character/characterTypes';
	import type { GameKernel } from '$lib/domain/kernel/GameKernel';

	// Component imports
	import CharacterLoader from '$lib/ui/CharacterLoader.svelte';
	import CharacterSheet from '$lib/ui/CharacterSheet.svelte';

	// Diagnostic tools
	import DiagnosticTool from '$lib/utils/DiagnosticTool';

	// Props from the load function
	let { data } = $props<{ data: PageData }>();

	// State
	let character = $state<AssembledCharacter | null>(null);
	let kernel = $state<GameKernel | null>(null);
	let isLoading = $state(true);
	let error = $state<string | null>(null);

	// Helper function for timestamps in logs
	function getTimestamp() {
		const now = new Date();
		return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
	}

	// Initialize kernel on component mount
	onMount(async () => {
		try {
			// Dynamic import to avoid circular dependencies
			const kernelModule = await import('$lib/domain/kernel/GameKernel');
			const eventModule = await import('$lib/domain/kernel/EventBus');
			const { createBonusCapability } = await import('$lib/domain/capabilities/bonus');
			const { createAbilityCapability } = await import('$lib/domain/capabilities/ability');
			const { createSkillCapability } = await import('$lib/domain/capabilities/skill');
			const { createCombatCapability } = await import('$lib/domain/capabilities/combat');

			// Create and initialize kernel with EventBus
			kernel = new kernelModule.GameKernel({
				debug: true,
				eventEmitter: new eventModule.EventBus(true)
			});

			// Create required directories - MUST BE CREATED BEFORE REGISTERING CAPABILITIES
			// First check if /v_proc exists
			if (!kernel.exists('/v_proc')) {
				const procResult = kernel.mkdir('/v_proc');
				if (typeof procResult === 'number' && procResult !== 0) {
					console.error(`Failed to create /v_proc directory: ${procResult}`);
				}
			}

			// Then create /v_proc/character
			if (!kernel.exists('/v_proc/character')) {
				const charDirResult = kernel.mkdir('/v_proc/character');
				if (typeof charDirResult === 'number' && charDirResult !== 0) {
					console.error(`Failed to create /v_proc/character directory: ${charDirResult}`);
				}
			}

			// Create entity directory if it doesn"t exist
			if (!kernel.exists('/v_entity')) {
				const entityDirResult = kernel.mkdir('/v_entity');
				if (typeof entityDirResult === 'number' && entityDirResult !== 0) {
					console.error(`Failed to create /entity directory: ${entityDirResult}`);
				}
			}

			// Register capabilities
			// Create capabilities with Unix-style composition
			const bonusCapability = createBonusCapability({ debug: true });
			const abilityCapability = createAbilityCapability(bonusCapability, { debug: true });
			const skillCapability = createSkillCapability(abilityCapability, bonusCapability, {
				debug: true
			});
			const combatCapability = createCombatCapability(abilityCapability, bonusCapability, {
				debug: true
			});

			// Import and create the CharacterCapability
			const { CharacterCapability } = await import(
				'$lib/domain/capabilities/character/CharacterCapability'
			);
			const characterCapability = new CharacterCapability();

			// Mount capabilities as device files
			kernel.mount('/v_dev/bonus', bonusCapability);
			kernel.mount('/v_dev/ability', abilityCapability);
			kernel.mount('/v_dev/skill', skillCapability);
			kernel.mount('/v_dev/combat', combatCapability);
			kernel.mount('/v_dev/character', characterCapability);

			// Import Supabase client and setup database capability
			const { supabaseClient } = await import('$lib/db/supabaseClient');
			const { SupabaseDatabaseDriver } = await import(
				'$lib/domain/capabilities/database/SupabaseDatabaseDriver'
			);

			// Create database driver with Supabase client
			const dbDriver = new SupabaseDatabaseDriver(supabaseClient, kernel, true);

			// Mount database driver as device
			const mountResult = kernel.mount('/v_dev/db', dbDriver);
			console.log(`${getTimestamp()} - Database mount result:`, mountResult);

			// Get character capability from kernel
			const characterDevice =
				kernel.mountPoints?.get('/v_dev/character') || kernel.devices?.get('/v_dev/character');

			if (!characterDevice) {
				console.error(
					`${getTimestamp()} - Character device not found in kernel.devices or kernel.mountPoints`
				);
			} else {
				console.log(`${getTimestamp()} - Character device found, updating with database driver`);
				// Update CharacterCapability with the database driver so it can access character data
				(characterDevice as CharacterCapability).databaseDriver = dbDriver;
				characterCapability.databaseDriver = dbDriver;

				// Verify the database driver is set properly
				console.log(`${getTimestamp()} - Verified database driver connection:`, {
					deviceHasDriver: !!(characterDevice as CharacterCapability).databaseDriver,
					capabilityHasDriver: !!characterCapability.databaseDriver
				});
			}

			console.log(`${getTimestamp()} - Kernel initialized successfully`);

			// Initialize diagnostic tools
			console.log(`${getTimestamp()} - Setting up auto-diagnostics`);
			DiagnosticTool.setupAutoDiagnostics();

			// Make diagnostic tools available in browser console
			console.log(`${getTimestamp()} - Diagnostic tools available: window.vardonDiagnostics`);
			console.log(
				'Use vardonDiagnostics.analyze() to run diagnostics or vardonDiagnostics.downloadLogs() to download logs'
			);
		} catch (err) {
			console.error(`${getTimestamp()} - Failed to initialize kernel:`, err);
			error = err instanceof Error ? err.message : 'Failed to initialize kernel';
		}
	});

	// Handle character loading events
	function handleCharacterLoaded(event: CustomEvent<AssembledCharacter>) {
		character = event.detail;
		isLoading = false;
		error = null;

		console.log(`${getTimestamp()} - Character loaded successfully:`, {
			id: character.id,
			name: character.name,
			classes: character.game_character_class?.map((c) => c.class?.name) || [],
			ancestry: character.game_character_ancestry?.[0]?.ancestry?.name,
			level: character.totalLevel
		});
	}

	function handleCharacterError(event: CustomEvent<string>) {
		error = event.detail;
		isLoading = false;
		console.error(`${getTimestamp()} - Error loading character:`, error);
	}
</script>

<div class="min-h-screen bg-background text-foreground">
	<!-- Header with system status -->
	<div
		class="border-b border-primary/20 bg-primary/10 p-2 text-center text-sm text-primary-foreground"
	>
		<span class="font-mono">File-based Architecture</span>
		<span class="mx-2">|</span>
		<span>System Status: {kernel ? 'Online' : 'Initializing...'}</span>
	</div>

	<!-- Body with character sheet -->
	<div class="container mx-auto px-4 py-4 md:px-6">
		{#if error}
			<div class="mb-4 rounded-md bg-red-100 p-4 text-red-800">
				<p class="font-semibold">System Error</p>
				<p>{error}</p>
				<div class="mt-4">
					<button class="text-primary hover:underline" onclick={() => window.location.reload()}>
						Restart System
					</button>
				</div>
			</div>
		{/if}

		<CharacterLoader
			{data}
			{kernel}
			on:loaded={handleCharacterLoaded}
			on:error={handleCharacterError}
		>
			{#if character}
				<CharacterSheet {character} {kernel} />
			{:else}
				<div class="p-8 text-center text-muted-foreground">
					<p>No character data available.</p>
				</div>
			{/if}
		</CharacterLoader>
	</div>

	<!-- Footer -->
	<div class="mt-8 border-t bg-muted/20 p-2 text-center text-sm text-muted-foreground">
		<span>Vardon Character System v1.0</span>
		<span class="mx-2">|</span>
		<span class="font-mono">PID: {Math.floor(Math.random() * 10000)}</span>
		<span class="mx-2">|</span>
		<span>Up: {new Date().toLocaleTimeString()}</span>
	</div>
</div>
