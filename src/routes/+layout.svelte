<script lang="ts">
	import '../app.css';
	import NetworkStatusIndicator from '$lib/ui/NetworkStatusIndicator.svelte';
	import type { Snippet } from 'svelte';

	let { children } = $props<{
		children?: Snippet | undefined;
	}>();
</script>

<div class="bg-woodgrain text-ink min-h-screen">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		{@render children?.()}
	</div>
	<NetworkStatusIndicator />
</div>

<style lang="postcss">
	/* Base styles */
	:global(body) {
		@apply bg-[#4a1f10] font-serif antialiased;
	}

	/* Card styles */
	:global(.card) {
		@apply relative rounded-lg border border-primary-300/10 bg-parchment-200/95 p-4 shadow-lg;
	}
</style>
