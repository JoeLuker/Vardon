<script lang="ts">
	import { onMount } from 'svelte';
	import { initializeApp } from '$lib/services/root';
	import { rootStore } from '$lib/stores/base/root';
	import LoadingOverlay from '$lib/components/LoadingOverlay.svelte';
	import Nav from '$lib/components/Nav.svelte';
	import Stats from '$lib/components/Stats.svelte';
	import Combat from '$lib/components/Combat.svelte';
	import Equipment from '$lib/components/Equipment.svelte';
	import Spells from '$lib/components/Spells.svelte';
	import ClassTable from '$lib/components/ClassTable.svelte';
	import Discoveries from '$lib/components/Discoveries.svelte';
	import Feats from '$lib/components/Feats.svelte';
	import Skills from '$lib/components/Skills.svelte';

	let mobileMenuOpen = false;
	let loadingMessage = 'Loading character data...';
	let loadingProgress: number | null = null;



	onMount(async () => {
		try {
			loadingMessage = 'Initializing application...';
			loadingProgress = 0;

			const updateProgress = (progress: number) => {
				loadingProgress = progress;
				if (progress < 90) {
					setTimeout(() => updateProgress(progress + 10), 200);
				}
			};

			updateProgress(0);
			await initializeApp();
			loadingProgress = 100;
		} catch (error) {
			console.error('Failed to initialize app:', error);
			rootStore.addError(error instanceof Error ? error.message : 'Unknown error');
		}
	});
</script>

<div class="pt-20">
	<LoadingOverlay 
		isLoading={$rootStore.isLoading} 
		message={loadingMessage} 
		progress={loadingProgress} 
	/>

	{#if $rootStore.errors.length > 0}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-red-500/30">
			<div class="rounded-lg bg-white px-4 py-2 text-red-500 shadow-lg">
				{#each $rootStore.errors as error}
					<p>{error}</p>
				{/each}
			</div>
		</div>
	{:else}
		<Nav bind:mobileMenuOpen />

		<main class="content-container">
			<header class="mb-8 text-center">
				<h1 class="text-4xl text-[#c19a6b]">Vardon Salvador</h1>
				<p class="mt-2 text-xl text-[#c19a6b]">Magaambayan Mindchemist</p>
				<p class="mt-1 text-[#c19a6b]">Level 5 Alchemist | Tengu</p>
				<p class="mt-2 text-[#c19a6b]"><strong>Player:</strong> Aaron</p>
			</header>

			<Stats />
			<Skills />
			<Combat />
			<Equipment />
			<Spells />
			<ClassTable />
			<Discoveries />
			<Feats />
		</main>
	{/if}
</div>