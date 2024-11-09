<script lang="ts">
	import type { ResourceTrackerProps } from '$lib/types/components';

	export let label: ResourceTrackerProps['label'] = '';
	export let total: ResourceTrackerProps['total'] = 0;
	export let used: ResourceTrackerProps['used'] = 0;
	export let onToggle: ResourceTrackerProps['onToggle'] = () => {};

	$: remaining = total - used;
	$: squares = Array(total).fill(null);

	function handleClick(index: number) {
		const newRemaining = total - (index + 1);
		if (newRemaining !== remaining) {
			onToggle(newRemaining);
		}
	}
</script>

<div class="resource-tracker">
	<div class="mb-1 flex items-center justify-between">
		<span class="font-semibold text-[#c19a6b]">{label}</span>
		<span class="text-sm text-[#c19a6b]">{remaining} remaining</span>
	</div>
	<div class="flex flex-wrap gap-1">
		{#each squares as _, i}
			<button
				type="button"
				class="h-8 w-8 rounded border-2 border-[#c19a6b] transition-colors"
				class:bg-[#c19a6b]={i < used}
				on:click={() => handleClick(i)}
				aria-label={i < used
					? `Toggle ${label} resource at position ${i + 1} (currently used)`
					: `Toggle ${label} resource at position ${i + 1} (currently available)`}>
			</button>
		{/each}
	</div>
</div>

<style lang="postcss">
	.resource-tracker {
		@apply mb-4 rounded-lg bg-[#fffef0] p-2 shadow-sm;
	}

	button {
		@apply hover:border-[#8b6d4b] active:scale-95;
	}

	button:focus-visible {
		@apply outline-none ring-2 ring-[#c19a6b] ring-offset-2;
	}

	@media (max-width: 640px) {
		button {
			@apply h-6 w-6;
		}
	}
</style>