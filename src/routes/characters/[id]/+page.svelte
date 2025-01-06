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
	import Skills from '$lib/ui/Skills.svelte';
	import Saves from '$lib/ui/Saves.svelte';

	const { data } = $props<{ data: PageData }>();

	let isLoading = $state(true);
	let error = $state<string | null>(null);

	// Initialize watchers once
	onMount(() => {
		initCharacterWatchers();
		return () => {
			cleanupCharacterWatchers();
		};
	});

	// Watch for changes to data.id and reload character
	$effect(() => {
		isLoading = true;
		error = null;
		
		loadCharacter(data.id)
			.then(() => {
				isLoading = false;
				console.log('Character loaded:', JSON.stringify($characterStore, null, 2));
			})
			.catch((err) => {
				console.error('Failed to load character:', err);
				error = 'Failed to load character data';
				isLoading = false;
			});
	});
</script>

{#if isLoading}
	<div class="flex justify-center items-center min-h-[200px]">
		<div class="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" ></div>
	</div>
{:else if error}
	<div class="p-4 border border-destructive/50 bg-destructive/10 rounded-md text-destructive">
		{error}
	</div>
{:else if $characterStore === null}
	<div class="p-4 border border-muted rounded-md">
		<p class="text-muted-foreground">No character data found</p>
	</div>
{:else}
	<div class="space-y-8">
		<CharacterHeader />
		<HPTracker />
		<Attributes />
		<Saves />
		<Skills />
	</div>
{/if}
