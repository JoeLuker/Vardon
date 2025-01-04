<!-- FILE: src/routes/landing/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	// Import from your multiCharacterStore
	import {
		characterList as multiCharStore,
		initMultiCharWatchers,
		loadAllCharacters
	} from '$lib/state/multiCharacterStore';

	onMount(() => {
		// Optionally start watchers for realtime changes
		initMultiCharWatchers();

		// Then load/reload the entire list
		loadAllCharacters();


	});
</script>

<div class="space-y-6 py-8">
	<h1 class="text-3xl font-bold text-parchment-100">Character Selection</h1>

	<!-- Now we iterate over $multiCharStore instead of a local variable -->
	{#if $multiCharStore?.length}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each $multiCharStore as character}
				<a
					href="/characters/{character.id}"
					class="card transition-colors hover:bg-parchment-300/95"
				>
					<div class="space-y-2">
						<h2 class="text-xl font-bold">
							{character.name}
						</h2>
						<div class="text-ink/80 text-sm">
							<span>{character.ancestry?.name ?? ''}</span>
							<span class="mx-2">•</span>
							<span>
								{character.classes
									.map(
										(rpgClass) =>
											`${rpgClass?.archetype ?? ''} ${rpgClass?.name ?? ''} ${rpgClass?.level ?? ''}`
									)
									.join(', ')}
							</span>
						</div>
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<p>No characters found or loading...</p>
	{/if}
</div>
