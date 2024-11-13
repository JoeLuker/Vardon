<!-- src/lib/components/ErrorBoundary.svelte -->
<script lang="ts">
	interface Props {
		error: Error;
		reset: () => void;
	}

	let { error, reset }: Props = $props();
</script>

<div class="rounded border border-red-400 bg-red-100 p-4 text-red-700">
	<h2 class="text-lg font-bold">Something went wrong!</h2>
	<p>{error.message}</p>
	<button onclick={reset} class="btn btn-secondary mt-2"> Try Again </button>
</div>
