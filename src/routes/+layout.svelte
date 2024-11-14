<script lang="ts">
	import '../app.css';
	import NetworkStatusIndicator from '$lib/components/NetworkStatusIndicator.svelte';
	import type { Snippet } from 'svelte';

	let { children } = $props<{
		children?: Snippet | undefined; // Fixed to include undefined
	}>();
</script>

<svg class="hidden">
	<filter id="paper-texture">
		<feTurbulence type="fractalNoise" baseFrequency="0.04" result="noise" />
		<feDiffuseLighting in="noise" lighting-color="#fff" surfaceScale="1">
			<feDistantLight azimuth="45" elevation="35" />
		</feDiffuseLighting>
	</filter>
</svg>

<div class="min-h-screen bg-parchment text-gray-800">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		{@render children?.()}
	</div>
	<NetworkStatusIndicator />
</div>

<style lang="postcss">
	:global(body) {
		@apply bg-parchment font-serif antialiased;
	}

	:global(:root) {
		@apply text-gray-800;
	}
</style>
