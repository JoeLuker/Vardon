<script lang="ts">
    import { updateQueue } from '../utils/updateQueue.svelte';
    import type { UpdateStatus } from '../utils/updateQueue.svelte';
    
    let status = $state<UpdateStatus>('idle');
    let stats = $state({
        pending: 0,
        status: 'idle' as UpdateStatus
    });
    let showProcessing = $state(false);
    let processingTimer: number | undefined;

    // Subscribe to status updates
    $effect(() => {
        return updateQueue.subscribe((newStatus) => {
            // Clear any existing timer
            if (processingTimer) {
                clearTimeout(processingTimer);
                processingTimer = undefined;
            }

            // For processing status, set a timer before showing
            if (newStatus === 'processing') {
                processingTimer = setTimeout(() => {
                    showProcessing = true;
                }, 1000) as unknown as number;
            } else {
                showProcessing = false;
            }

            status = newStatus;
            stats = updateQueue.getStats();
        });
    });

    // Get appropriate status message and style
    let statusConfig = $derived({
        message: getStatusMessage(),
        class: getStatusClass()
    });

    function getStatusMessage(): string {
        switch (status) {
            case 'pending':
                return `${stats.pending} updates pending...`;
            case 'processing':
                return showProcessing ? 'Processing updates...' : '';
            case 'success':
                return 'All changes saved';
            case 'error':
                return 'Error saving changes';
            case 'offline':
                return `${stats.pending} changes pending sync`;
            default:
                return '';
        }
    }

    function getStatusClass(): string {
        switch (status) {
            case 'pending':
                return 'bg-yellow-500';
            case 'processing':
                return 'bg-blue-500';
            case 'success':
                return 'bg-green-500';
            case 'error':
                return 'bg-red-500';
            case 'offline':
                return 'bg-gray-500';
            default:
                return 'bg-gray-500';
        }
    }
</script>

{#if (status !== 'idle' && status !== 'processing') || 
      (status === 'processing' && showProcessing) || 
      stats.pending > 0}
    <div
        class="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-2 text-white shadow-lg transition-all duration-300 {statusConfig.class}"
        role="status"
        aria-live="polite"
    >
        {#if (status === 'processing' && showProcessing) || status === 'pending'}
            <div class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
        {/if}
        <span class="text-sm">{statusConfig.message}</span>
    </div>
{/if}