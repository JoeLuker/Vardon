<!-- src/lib/components/NetworkStatusIndicator.svelte -->
<script lang="ts">
    import { updateQueue } from '$lib/utils/updateQueue.svelte';
    import type { UpdateStatus } from '$lib/utils/updateQueue.svelte';
    
    let status = $state<UpdateStatus>('success');
    let stats = $state({
        pending: 0,
        status: 'success' as UpdateStatus
    });

    // Subscribe to status updates
    $effect(() => {
        return updateQueue.subscribe((newStatus) => {
            status = newStatus;
            stats = updateQueue.getStats();
        });
    });

    // Get appropriate status message and style
    let statusConfig = $derived(() => {
        switch (status) {
            case 'pending':
                return {
                    message: `${stats.pending} updates pending...`,
                    class: 'bg-yellow-500'
                };
            case 'processing':
                return {
                    message: 'Processing updates...',
                    class: 'bg-blue-500'
                };
            case 'success':
                return {
                    message: 'All changes saved',
                    class: 'bg-green-500'
                };
            case 'error':
                return {
                    message: 'Error saving changes',
                    class: 'bg-red-500'
                };
            case 'offline':
                return {
                    message: `${stats.pending} changes pending sync`,
                    class: 'bg-gray-500'
                };
            default:
                return {
                    message: '',
                    class: 'bg-gray-500'
                };
        }
    });
</script>

{#if status !== 'success' || stats.pending > 0}
    <div
        class="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-2 text-white shadow-lg transition-all duration-300 {statusConfig.class}"
        role="status"
        aria-live="polite"
    >
        {#if status === 'processing' || status === 'pending'}
            <div class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
        {/if}
        <span class="text-sm">{statusConfig.message}</span>
    </div>
{/if}