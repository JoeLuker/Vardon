import { updateQueue } from '$lib/utils/updateQueue.svelte';

export interface UpdateState {
    status: 'idle' | 'syncing' | 'error';
    error: Error | null;
}

export function createUpdateState() {
    return $state<UpdateState>({
        status: 'idle',
        error: null
    });
}

export async function executeUpdate<T>({ 
    key,
    state,
    operation,
    optimisticUpdate,
    rollback 
}: {
    key: string;
    state: UpdateState;
    operation: () => Promise<T>;
    optimisticUpdate: () => void;
    rollback: () => void;
}) {
    try {
        await updateQueue.enqueue({
            key,
            execute: async () => {
                state.status = 'syncing';
                await operation();
                state.status = 'idle';
            },
            optimisticUpdate,
            rollback: () => {
                rollback();
                state.error = new Error('Failed to update');
                state.status = 'error';
            }
        });
        
        state.error = null;
    } catch (e) {
        // Error handling is done in rollback
    }
}
