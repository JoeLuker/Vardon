<!-- FILE: src/routes/characters/[id]/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import {
		characterStore,
		loadCharacter,
		initCharacterWatchers,
		cleanupCharacterWatchers
	} from '$lib/state/characterStore';
	import type { PageData } from './$types';
	import CharacterHeader from '$lib/ui/CharacterHeader.svelte';
	import HPTracker from '$lib/ui/HPTracker.svelte';
	import Attributes from '$lib/ui/Attributes.svelte';
	const { data } = $props<{ data: PageData }>();
	const characterId = data.id;

	onMount(() => {
		initCharacterWatchers();

		// Add async/await to wait for the character to load
		loadCharacter(characterId).then(() => {
			console.log('Character loaded:', JSON.stringify($characterStore, null, 2));
		});

		return () => {
			cleanupCharacterWatchers();
		};
	});
</script>

<!-- Check if the store is loaded or not -->
{#if $characterStore === null}
	<p>Loading or no data found...</p>
{:else}
	<!-- Example usage of child component -->
	<CharacterHeader />
	<HPTracker />
	<Attributes />

	<!-- Possibly more child components, like HPTracker, Skills, Feats, etc. -->
	<!--
	<HPTracker />
	<Skills />
	<Feats />
	... 
	-->
{/if}
