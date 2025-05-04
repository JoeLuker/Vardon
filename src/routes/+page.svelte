<!-- FILE: src/routes/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { GameRulesAPI } from '$lib/db';
	import { supabase } from '$lib/db/supabaseClient';
	import type { CompleteCharacter } from '$lib/db/gameRules.api';
	
	// State for character data
	let characters = $state<CompleteCharacter[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	
	// Initialize GameRulesAPI
	const gameRules = new GameRulesAPI(supabase);
	
	function formatCharacterClass(character: any) {
		const archetype = character.game_character_archetype?.[0]?.archetype?.label || '';
		return character.game_character_class?.map((classEntry: any) => {
			const className = classEntry?.class?.label || '';
			const level = classEntry?.level || '';
			return `${archetype} ${className} ${level}`.trim();
		}).join(', ') || '';
	}
	
	// Helper function for logging with timestamps
	function getTimestamp() {
		const now = new Date();
		return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
	}
	
	// Load all characters
	async function loadCharacters() {
		try {
			isLoading = true;
			
			// Get basic character list
			console.log(`[${getTimestamp()}] Fetching character list`);
			const basicCharacters = await gameRules.getAllGameCharacter();
			
			if (!basicCharacters || basicCharacters.length === 0) {
				console.log(`[${getTimestamp()}] No characters found`);
				characters = [];
				isLoading = false;
				return;
			}
			
			// Get detailed character data
			console.log(`[${getTimestamp()}] Fetching detailed data for ${basicCharacters.length} characters`);
			const characterIds = basicCharacters.map(char => char.id);
			const detailedCharacters = await Promise.all(
				characterIds.map(id => gameRules.getCompleteCharacterData(id))
			);
			
			// Filter out null results
			characters = detailedCharacters.filter((char): char is CompleteCharacter => char !== null);
			console.log(`[${getTimestamp()}] Successfully loaded ${characters.length} characters`);
		} catch (err) {
			console.error(`[${getTimestamp()}] Error loading characters:`, err);
			error = err instanceof Error ? err.message : String(err);
		} finally {
			isLoading = false;
		}
	}
	
	onMount(() => {
		loadCharacters();
	});
</script>

<!-- Page container with spacing -->
<div class="space-y-6 py-8">
	<!-- Heading now uses text-foreground (from your config) -->
	<h1 class="text-3xl font-bold text-foreground">Character Selection</h1>

	{#if isLoading}
		<div class="flex min-h-[200px] items-center justify-center">
			<div class="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent"></div>
		</div>
	{:else if error}
		<div class="rounded-md bg-destructive/20 p-4 text-destructive">
			<h2 class="text-lg font-bold">Error</h2>
			<p>{error}</p>
		</div>
	{:else if characters?.length}
		<!-- Simple grid layout -->
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each characters as character}
				<a
					href="/characters/{character.id}"
					class="
			  rounded-lg
			  bg-card
			  p-4
			  text-card-foreground
			  transition-colors
			  hover:bg-card/80
			"
				>
					<div class="space-y-2">
						<h2 class="text-xl font-bold">
							{character.label}
						</h2>
						<!-- Use text-muted-foreground from config -->
						<div class="text-sm text-muted-foreground">
							<span>{character.game_character_ancestry?.[0]?.ancestry?.label || ''}</span>
							<span class="mx-2">•</span>
							<span>{formatCharacterClass(character)}</span>
						</div>
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<p>No characters found</p>
	{/if}
</div>
