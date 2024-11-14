// src/lib/utils/updateQueue.svelte.ts
import { browser } from '$app/environment';

export type UpdateStatus = 'idle' | 'processing' | 'error' | 'offline' | 'pending' | 'success';

export interface QueueUpdate<T = unknown> {
    key: string;
    execute: () => Promise<T>;
    optimisticUpdate: () => void;
    rollback: () => void;
}

export class UpdateQueue {
    private status = $state<UpdateStatus>('idle');
    private subscribers = new Set<(status: UpdateStatus) => void>();
    private pendingUpdates = new Map<string, {
        timer: NodeJS.Timeout;
        execute: () => Promise<any>;
    }>();

    constructor() {
        if (browser) {
            window.addEventListener('offline', () => {
                this.status = 'offline';
                this.subscribers.forEach(fn => fn('offline'));
            });
        }
    }

    getStats() {
        return {
            pending: this.pendingUpdates.size,
            status: this.status
        };
    }

    subscribe(callback: (status: UpdateStatus) => void) {
        this.subscribers.add(callback);
        callback(this.status);
        return () => this.subscribers.delete(callback);
    }
  
    async enqueue<T>({ key, execute, optimisticUpdate, rollback }: QueueUpdate<T>): Promise<T> {
        // Apply optimistic update immediately
        optimisticUpdate();

        // If there's a pending update for this key, cancel it
        const pending = this.pendingUpdates.get(key);
        if (pending) {
            clearTimeout(pending.timer);
            this.pendingUpdates.delete(key);
        }

        try {
            // Set up debounced execution
            await new Promise(resolve => {
                const timer = setTimeout(resolve, 250);
                this.pendingUpdates.set(key, { timer, execute });
            });

            // Execute the update
            this.status = 'processing';
            const result = await execute();
            this.status = 'idle';
            
            return result;
        } catch (error) {
            rollback();
            this.status = navigator.onLine ? 'error' : 'offline';
            throw error;
        } finally {
            this.pendingUpdates.delete(key);
        }
    }

    destroy() {
        this.pendingUpdates.forEach(({ timer }) => clearTimeout(timer));
        this.pendingUpdates.clear();
    }
}

export const updateQueue = new UpdateQueue();