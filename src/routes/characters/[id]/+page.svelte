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

	const { data } = $props<{ data: PageData }>();
	const characterId = data.id;

	onMount(() => {
		// 1) Start watchers for real-time bridging changes
		initCharacterWatchers();

		// 2) Load the single character
		loadCharacter(characterId);

		// 3) On unmount, optionally clean watchers
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
	<CharacterHeader {characterId} />
	<HPTracker {characterId} />

	<!-- Possibly more child components, like HPTracker, Skills, Feats, etc. -->
	<!--
	<HPTracker />
	<Skills />
	<Feats />
	... 
	-->
{/if}
