<!-- FILE: src/lib/ui/CharacterSheet.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { GameKernel } from '$lib/domain/kernel/GameKernel';
	import type { AssembledCharacter, ValueWithBreakdown } from '$lib/domain/character/characterTypes';
	
	// Import UI components
	import AbilityScores from './AbilityScores.svelte';
	import HPTracker from './HPTracker.svelte';
	import Saves from './Saves.svelte';
	import ACStats from './ACStats.svelte';
	import Skills from './Skills.svelte';
	
	// Constants
	const KERNEL_FILE = '/dev/kernel';
	const OpenMode = {
		READ: 0x01,
		WRITE: 0x02,
		READ_WRITE: 0x03
	};
	
	/**
	 * Props:
	 * - character: Character data from the loader
	 * - kernel: Optional kernel instance (will be loaded if not provided)
	 */
	let { 
		character = null,
		kernel = null 
	} = $props<{
		character: AssembledCharacter | null;
		kernel?: GameKernel | null;
	}>();
	
	// Local state
	let isKernelLoading = $state(true);
	let kernelError = $state<string | null>(null);
	let selectedValue = $state<ValueWithBreakdown | null>(null);
	let isBreakdownOpen = $state(false);
	
	// Initialize kernel on component mount if not provided
	onMount(async () => {
		if (!kernel) {
			try {
				isKernelLoading = true;
				// Dynamic import to prevent circular dependencies
				const { GameKernel } = await import('$lib/domain/kernel/GameKernel');
				
				// Create new kernel instance
				kernel = new GameKernel();
				
				// Initialize kernel
				await kernel.mount();
				
				isKernelLoading = false;
			} catch (err) {
				console.error('Failed to initialize kernel:', err);
				kernelError = err instanceof Error ? err.message : 'Failed to initialize kernel';
				isKernelLoading = false;
			}
		} else {
			isKernelLoading = false;
		}
	});
	
	// Handle selecting a value to view its breakdown
	function handleSelectValue(value: ValueWithBreakdown) {
		selectedValue = value;
		isBreakdownOpen = true;
	}
	
	// Note: HP updates are now handled directly by the HPTracker component
</script>

{#if isKernelLoading}
	<div class="flex items-center justify-center p-8">
		<div class="h-6 w-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary"></div>
		<p class="ml-2">Initializing system...</p>
	</div>
{:else if kernelError}
	<div class="bg-red-100 text-red-800 p-4 rounded-md">
		<p class="font-semibold">Failed to initialize system</p>
		<p>{kernelError}</p>
		<p class="mt-4">System could not be initialized.</p>
	</div>
{:else}
	<!-- Character header -->
	<div class="mb-4 bg-card p-4 rounded-md border">
		<h1 class="text-2xl font-bold">{character?.name ?? 'Unknown Character'}</h1>
		<div class="text-muted-foreground">
			{character?.game_character_ancestry?.[0]?.ancestry?.name ?? 'Unknown Ancestry'}
			{#if character?.game_character_class?.length}
				- 
				{#each character.game_character_class as cls, i}
					{cls.class?.name ?? 'Unknown Class'} {cls.level ?? '?'}
					{#if i < character.game_character_class.length - 1}, {/if}
				{/each}
			{/if}
		</div>
	</div>
	
	<!-- Main character sheet layout -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<!-- Left column -->
		<div class="space-y-4">
			<!-- Ability Scores -->
			<div class="card">
				<h2 class="card-title">Ability Scores</h2>
				<AbilityScores {character} {kernel} onSelectValue={handleSelectValue} />
			</div>
			
			<!-- HP Tracker -->
			<div class="card">
				<HPTracker {character} {kernel} />
			</div>
			
			<!-- Saves -->
			<div class="card">
				<h2 class="card-title">Saving Throws</h2>
				<Saves {character} {kernel} onSelectValue={handleSelectValue} />
			</div>
		</div>
		
		<!-- Right column -->
		<div class="space-y-4">
			<!-- AC Stats -->
			<div class="card">
				<h2 class="card-title">Armor Class</h2>
				<ACStats {character} {kernel} onSelectValue={handleSelectValue} />
			</div>
			
			<!-- Skills Component -->
			<div class="card">
				<h2 class="card-title">Skills</h2>
				<Skills {character} {kernel} onSelectValue={handleSelectValue} />
			</div>
			
			<div class="card p-4 bg-muted/30">
				<h2 class="card-title">Feats</h2>
				<p class="text-muted-foreground">Feats component will be implemented soon</p>
			</div>
		</div>
	</div>
	
	<!-- Value breakdown dialog -->
	{#if isBreakdownOpen && selectedValue}
		<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onclick={() => (isBreakdownOpen = false)}>
			<div class="bg-card p-6 rounded-lg shadow-lg max-w-md w-full m-4" onclick={(e) => e.stopPropagation()}>
				<h3 class="text-xl font-bold mb-4">{selectedValue.label} Breakdown</h3>
				
				<!-- Total value -->
				<div class="text-2xl font-bold mb-4 text-center">
					{selectedValue.total >= 0 ? '+' : ''}{selectedValue.total}
				</div>
				
				<!-- Modifiers list -->
				<div class="space-y-2">
					{#each selectedValue.modifiers || [] as mod}
						<div class="flex justify-between items-center p-2 rounded bg-muted/30">
							<span>{mod.source}</span>
							<span class="font-semibold">{mod.value >= 0 ? '+' : ''}{mod.value}</span>
						</div>
					{/each}
				</div>
				
				<button class="mt-4 w-full p-2 bg-primary text-primary-foreground rounded-md" onclick={() => (isBreakdownOpen = false)}>
					Close
				</button>
			</div>
		</div>
	{/if}
{/if}

<style lang="postcss">
	.card {
		@apply bg-card p-4 rounded-md border shadow-sm;
	}
	
	.card-title {
		@apply text-lg font-semibold mb-4 pb-2 border-b;
	}
</style>