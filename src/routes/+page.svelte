<!-- FILE: src/routes/landing/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	// Import from your multiCharacterStore
	import {
		characterList as multiCharStore,
		initMultiCharWatchers,
		loadAllCharacters
	} from '$lib/state/multiCharacterStore';

	onMount(async () => {
		// Optionally start watchers for realtime changes
		initMultiCharWatchers();

		// Then load/reload the entire list
		await loadAllCharacters().then(() => {
			if ($multiCharStore.length > 0) {
				// console.log(JSON.stringify($multiCharStore, null, 2));
				console.log($multiCharStore);
			}
		});
	});
</script>

<!-- Page container with spacing -->
<div class="space-y-6 py-8">
	<!-- Heading now uses text-foreground (from your config) -->
	<h1 class="text-3xl font-bold text-foreground">Character Selection</h1>

	{#if $multiCharStore?.length}
		<!-- Simple grid layout -->
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each $multiCharStore as character}
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
							{character.name}
						</h2>
						<!-- Use text-muted-foreground from config -->
						<div class="text-sm text-muted-foreground">
							<span>{character.ancestries[0]?.base?.label ?? ''}</span>
							<span class="mx-2">•</span>
							<span>
								{character.classes
									.map((rpgClass) => `${rpgClass?.base?.label ?? ''} ${rpgClass?.level ?? ''}`)
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
