<script lang="ts">
	let { isLoading = false, showDelay = 500 } = $props<{
		isLoading?: boolean;
		showDelay?: number;
	}>();

	let shouldShow = $state(false);
	let timeout = $state<ReturnType<typeof setTimeout> | undefined>(undefined);

	$effect.pre(() => {
		if (isLoading) {
			timeout = setTimeout(() => {
				shouldShow = true;
			}, showDelay);
		} else {
			if (timeout) {
				clearTimeout(timeout);
				timeout = undefined;
			}
			shouldShow = false;
		}

		return () => {
			if (timeout) {
				clearTimeout(timeout);
				timeout = undefined;
			}
		};
	});
</script>

{#if shouldShow}
	<div
		class="fixed bottom-4 right-4 z-50 rounded-lg bg-white/90 px-4 py-2 shadow-lg backdrop-blur-sm"
		role="status"
	>
		<div class="flex items-center gap-2">
			<div class="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" ></div>
			<span class="text-sm text-gray-600">Saving...</span>
		</div>
	</div>
{/if}