<script lang="ts">

	let status = $state<UpdateState>({
		status: 'idle',
		error: null
	});

	// Get appropriate status message and style
	let statusConfig = $derived({
		message: getStatusMessage(),
		class: getStatusClass()
	});

	function getStatusMessage(): string {
		switch (status.status) {
			case 'syncing':
				return 'Processing updates...';
			case 'error':
				return 'Error saving changes';
			case 'idle':
			default:
				return '';
		}
	}

	function getStatusClass(): string {
		switch (status.status) {
			case 'syncing':
				return 'bg-blue-500';
			case 'error':
				return 'bg-red-500';
			case 'idle':
			default:
				return 'bg-gray-500';
		}
	}
</script>

{#if status.status !== 'idle'}
	<div
		class="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-2 text-white shadow-lg transition-all duration-300 {statusConfig.class}"
		role="status"
		aria-live="polite"
	>
		<span class="text-sm">{statusConfig.message}</span>
	</div>
{/if}
