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
				// First check if /proc exists
				if (!kernel.exists("/proc")) {
					const procResult = kernel.mkdir("/proc");
					if (typeof procResult === 'number' && procResult !== 0) {
						console.error(`Failed to create /proc directory: ${procResult}`);
					}
				}
				
				// Then create /proc/character
				if (!kernel.exists("/proc/character")) {
					const charDirResult = kernel.mkdir("/proc/character");
					if (typeof charDirResult === 'number' && charDirResult !== 0) {
						console.error(`Failed to create /proc/character directory: ${charDirResult}`);
					}
				}
				
				// Create entity directory if it doesn"t exist
				if (!kernel.exists("/entity")) {
					const entityDirResult = kernel.mkdir("/entity");
					if (typeof entityDirResult === 'number' && entityDirResult !== 0) {
						console.error(`Failed to create /entity directory: ${entityDirResult}`);
					}
				}
				
				// Register capabilities
			// Create capabilities with Unix-style composition
			const bonusCapability = createBonusCapability({ debug: true });
			const abilityCapability = createAbilityCapability(bonusCapability, { debug: true });
			const skillCapability = createSkillCapability(abilityCapability, bonusCapability, { debug: true });
			const combatCapability = createCombatCapability(abilityCapability, bonusCapability, { debug: true });

			// Import and create the CharacterCapability
			const { CharacterCapability } = await import('$lib/domain/capabilities/character/CharacterCapability');
			const characterCapability = new CharacterCapability();

			// Mount capabilities as device files
			kernel.mount('/dev/bonus', bonusCapability);
			kernel.mount('/dev/ability', abilityCapability);
			kernel.mount('/dev/skill', skillCapability);
			kernel.mount('/dev/combat', combatCapability);
			kernel.mount('/dev/character', characterCapability);

			// Import Supabase client and setup database capability
			const { supabaseClient } = await import('$lib/db/supabaseClient');
			const { SupabaseDatabaseDriver } = await import('$lib/domain/capabilities/database/SupabaseDatabaseDriver');

			// Create database driver with Supabase client
			const dbDriver = new SupabaseDatabaseDriver(supabaseClient, kernel, true);

			// Mount database driver as device
			const mountResult = kernel.mount('/dev/db', dbDriver);
			console.log(`${getTimestamp()} - Database mount result:`, mountResult);

			// Get character capability from kernel
			const characterDevice = kernel.mountPoints?.get('/dev/character') ||
			                        kernel.devices?.get('/dev/character');

			if (!characterDevice) {
				console.error(`${getTimestamp()} - Character device not found in kernel.devices or kernel.mountPoints`);
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
			classes: character.game_character_class?.map(c => c.class?.name) || [],
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

<div class="bg-background text-foreground min-h-screen">
	<!-- Header with system status -->
	<div class="bg-primary/10 border-b border-primary/20 p-2 text-sm text-center text-primary-foreground">
		<span class="font-mono">File-based Architecture</span>
		<span class="mx-2">|</span>
		<span>System Status: {kernel ? 'Online' : 'Initializing...'}</span>
	</div>

	<!-- Body with character sheet -->
	<div class="container mx-auto py-4 px-4 md:px-6">
		{#if error}
			<div class="bg-red-100 text-red-800 p-4 rounded-md mb-4">
				<p class="font-semibold">System Error</p>
				<p>{error}</p>
				<div class="mt-4">
					<button class="text-primary hover:underline" onclick={() => window.location.reload()}>
						Restart System
					</button>
				</div>
			</div>
		{/if}
		
		<CharacterLoader {data} {kernel}
			on:loaded={handleCharacterLoaded}
			on:error={handleCharacterError}
		>
			{#if character}
				<CharacterSheet {character} {kernel} />
			{:else}
				<div class="text-center p-8 text-muted-foreground">
					<p>No character data available.</p>
				</div>
			{/if}
		</CharacterLoader>
	</div>
	
	<!-- Footer -->
	<div class="bg-muted/20 border-t p-2 text-sm text-center text-muted-foreground mt-8">
		<span>Vardon Character System v1.0</span>
		<span class="mx-2">|</span>
		<span class="font-mono">PID: {Math.floor(Math.random() * 10000)}</span>
		<span class="mx-2">|</span>
		<span>Up: {new Date().toLocaleTimeString()}</span>
	</div>
</div>