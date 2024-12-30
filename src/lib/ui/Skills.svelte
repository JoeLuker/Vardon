<!-- src/lib/ui/Skills.svelte -->
<script lang="ts">
	import SkillAllocator from './SkillAllocator.svelte';
	import { getCharacter, fetchSkillData } from '$lib/state/characterStore.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { fade } from 'svelte/transition';
	type SkillData = CalculatedStats['skills']['byName'][string];

	let { characterId } = $props<{ characterId: number }>();

	let showSkillAllocator = $state(false);
	let updateState = $state<UpdateState>({
		status: 'idle',
		error: null
	});
	let isLoading = $state(true);

	let character = $derived(getCharacter(characterId));
	let stats = $derived.by(() => calculateCharacterStats(character));

	onMount(() => {
		fetchSkillData(characterId)
			.catch((error) => {
				console.error('Failed to load skill data:', error);
				updateState.error = error instanceof Error ? error : new Error('Failed to load skills');
			})
			.finally(() => {
				isLoading = false;
			});
	});
</script>

<section class="card p-4" transition:fade>
	<div class="mb-4 flex items-center justify-between">
		<h2 class="text-lg font-bold">Skills</h2>
		<button
			class="btn flex items-center px-3 py-1 text-sm disabled:opacity-50"
			onclick={() => (showSkillAllocator = true)}
			type="button"
			disabled={updateState.status === 'syncing' || isLoading}
		>
			{#if updateState.status === 'syncing'}
				<div
					class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
				></div>
			{/if}
			Manage
		</button>
	</div>

	{#if isLoading}
		<div class="flex justify-center py-8">
			<div
				class="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"
			></div>
		</div>
	{:else}
		<!-- A pseudo-table layout using a simple list -->
		<div class="space-y-1">
			{#each Object.entries(stats.skills.byName) as [name, skill]}
				{@const typedSkill = skill as SkillData}
				<!-- One line per skill, tightly packed -->
				<div
					class="flex flex-wrap items-center justify-between rounded bg-gray-50 px-2 py-1 text-sm hover:bg-gray-100"
				>
					<!-- Left side: name, ability, class indicator, ranks -->
					<div class="flex flex-wrap items-center space-x-2">
						<span class="font-medium">{name}</span>
						<span class="text-xs text-gray-500">({typedSkill.ability})</span>
						{#if typedSkill.classSkill}
							<span class="rounded bg-primary/10 px-1 text-xs text-primary">Class</span>
						{/if}
						{#if typedSkill.ranks.total > 0}
							<span class="text-xs text-gray-500">{typedSkill.ranks.total}r</span>
						{/if}
					</div>
					<!-- Right side: total bonus -->
					<div class="text-right font-bold">
						{typedSkill.total >= 0 ? '+' : ''}{typedSkill.total}
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if updateState.error}
		<div class="bg-accent/10 text-accent mt-2 rounded-md p-2 text-xs">
			Failed to update skills. Please try again.
		</div>
	{/if}
</section>

{#if showSkillAllocator}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2"
		role="dialog"
		aria-labelledby="skill-allocator-title"
	>
		<button
			class="absolute inset-0 h-full w-full"
			onclick={() => (showSkillAllocator = false)}
			onkeydown={(e) => e.key === 'Escape' && (showSkillAllocator = false)}
			aria-label="Close skill allocator"
		></button>
		<div class="card relative max-h-[90vh] w-full max-w-md overflow-auto">
			<SkillAllocator
				characterId={parseInt($page.params.id)}
				onClose={() => (showSkillAllocator = false)}
			/>
		</div>
	</div>
{/if}
