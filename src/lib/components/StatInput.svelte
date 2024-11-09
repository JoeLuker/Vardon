<script lang="ts">
	import type { StatInputProps } from '$lib/types/components';

	export let value: StatInputProps['value'];
	export let label: StatInputProps['label'] = '';
	export let min: StatInputProps['min'] = 0;
	export let max: StatInputProps['max'] = undefined;
	export let className: StatInputProps['className'] = '';
</script>

<div class="inline-flex items-center">
	{#if label}
		<span class="mr-2">{label}</span>
	{/if}
	<input type="number" {min} {max} bind:value class={`stat-input ${className}`} />
</div>

<style>
	.stat-input {
		@apply w-20 rounded border border-yellow-300 bg-yellow-100 p-1 text-center;
	}

	.stat-input:focus {
		@apply border-yellow-400 outline-none ring-2 ring-yellow-300 ring-offset-2;
	}
</style>
