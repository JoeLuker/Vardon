<script lang="ts">
	let { text, children } = $props<{
		text: string;
		children?: () => unknown;
	}>();
</script>

<div class="group relative">
	{#if children}
		{@render children()}
	{/if}
	<div
		class="invisible absolute -top-2 left-1/2 z-10 w-64 -translate-x-1/2
                transform rounded bg-gray-800 px-3 py-2 text-sm text-white
                opacity-0 transition-all group-hover:visible group-hover:opacity-100"
	>
		{text}
	</div>
</div>
