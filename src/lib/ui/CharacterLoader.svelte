<script lang="ts">
	// Character Loader component
	// This component loads a character using the application architecture
	
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import type { PageData } from '../../routes/characters/[id]/$types';
	import type { AssembledCharacter } from '$lib/domain/character/characterTypes';
	import type { CompleteCharacter } from '$lib/db/gameRules.api';
	import { UIAdapter } from '$lib/ui/adapters/UIAdapter';
	import { GameRulesAPI } from '$lib/db/gameRules.api';
	import { supabase } from '$lib/db/supabaseClient';
	
	// Props
	let { data } = $props<{ data: PageData }>();
	
	// State
	let character = $state<AssembledCharacter | null>(null);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let diagnosticInfo = $state<Record<string, any>>({});
	
	// Create event dispatchers
	const dispatch = createEventDispatcher<{
		loaded: AssembledCharacter;
		error: string;
		loading: boolean;
	}>();
	
	// Helper function for timestamps in logs
	function getTimestamp() {
		const now = new Date();
		return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
	}
	
	// Get UI adapter instance
	const uiAdapter = UIAdapter.getInstance();
	
	// Initialize on component mount
	onMount(async () => {
		console.log(`${getTimestamp()} - Character Loader mounted with ID: ${data?.id}`);
		
		// Initialize client-side GameRulesAPI
		try {
			console.log(`${getTimestamp()} - Initializing client-side GameRulesAPI`);
			// Create a new GameRulesAPI instance
			const gameAPI = new GameRulesAPI(supabase);
			
			if (!gameAPI) {
				throw new Error('Failed to initialize GameRulesAPI');
			}
			
			console.log(`${getTimestamp()} - GameRulesAPI initialized successfully`);
			
			// Initialize UI adapter
			await uiAdapter.initialize({ gameData: { gameAPI }, debug: true });
		} catch (apiError) {
			console.error(`${getTimestamp()} - Failed to initialize API:`, apiError);
			error = apiError instanceof Error ? 
				`Failed to initialize API: ${apiError.message}` : 
				'Failed to initialize API';
			isLoading = false;
			dispatch('error', error);
			return;
		}
		
		if (data?.id) {
			console.log(`${getTimestamp()} - Loading character with ID: ${data.id}`);
			dispatch('loading', true);
			
			try {
				// Load character with UI adapter
				character = await uiAdapter.loadCharacter(data.id);
				
				// Log character basics after successful loading
				if (character) {
					console.log(`${getTimestamp()} - Character loaded successfully:`, {
						id: character.id,
						name: character.name,
						classes: character.game_character_class?.map(c => c.class?.name) || [],
						ancestry: character.game_character_ancestry?.[0]?.ancestry?.name,
						level: character.totalLevel
					});
					
					// Dispatch loaded event
					dispatch('loaded', character);
				}
				
				isLoading = false;
			} catch (loadError) {
				console.error(`${getTimestamp()} - Failed to load character:`, loadError);
				error = loadError instanceof Error ? loadError.message : 'Failed to load character data';
				isLoading = false;
				dispatch('error', error);
			}
		} else {
			console.warn(`${getTimestamp()} - No character ID received`);
			error = 'No character ID received';
			isLoading = false;
			dispatch('error', error);
		}
	});
	
	// Clean up resources on component destruction
	onDestroy(() => {
		// Optional: Shutdown the adapter if we want to free resources
		// Uncomment if needed
		// uiAdapter.shutdown();
	});
</script>

{#if isLoading}
	<div class="flex items-center justify-center">
		<div class="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary"></div>
		<p class="ml-2">Loading character...</p>
	</div>
{:else if error}
	<div class="bg-red-100 text-red-800 p-4 rounded-md">
		<p class="font-semibold">Error loading character</p>
		<p>{error}</p>
		
		{#if Object.keys(diagnosticInfo).length > 0}
		<details class="mt-4">
			<summary class="cursor-pointer font-medium">Diagnostic Information</summary>
			<pre class="mt-2 bg-red-50 p-2 rounded text-xs overflow-auto">
{JSON.stringify(diagnosticInfo, null, 2)}
			</pre>
		</details>
		{/if}
	</div>
{:else if character}
	<slot character={character} />
{:else}
	<div>
		<p>No character data available</p>
	</div>
{/if}