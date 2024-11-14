// src/lib/utils/updateQueue.svelte.ts
import { browser } from '$app/environment';

export type UpdateStatus = 'success' | 'processing' | 'error' | 'offline' | 'pending';

export type QueuedUpdate<T> = {
    key?: string;
    execute: () => Promise<T>;
    optimisticUpdate: () => void;
    rollback: () => void;
};

export class UpdateQueue {
    private queue = $state<QueuedUpdate<any>[]>([]);
    private processing = $state(false);
    private status = $state<UpdateStatus>('success');
    private subscribers = new Set<(status: UpdateStatus) => void>();
  
    constructor() {
        if (browser) {
            window.addEventListener('online', () => this.processQueue());
            window.addEventListener('offline', () => this.setStatus('offline'));
        }
    }

    private setStatus(newStatus: UpdateStatus) {
        this.status = newStatus;
        this.subscribers.forEach(fn => fn(newStatus));
    }

    subscribe(callback: (status: UpdateStatus) => void) {
        this.subscribers.add(callback);
        callback(this.status); // Initial call
        
        return () => {
            this.subscribers.delete(callback);
        };
    }
  
    async enqueue<T>({
        key,
        execute,
        optimisticUpdate,
        rollback
    }: QueuedUpdate<T>): Promise<T> {
        optimisticUpdate();
  
        if (key) {
            this.queue = this.queue.filter(u => u.key !== key);
        }
  
        try {
            this.setStatus('processing');
            const result = await execute();
            this.setStatus('success');
            return result;
        } catch (error) {
            if (navigator.onLine) {
                rollback();
                this.setStatus('error');
            } else {
                this.queue = [...this.queue, { key, execute, optimisticUpdate, rollback }];
                this.setStatus('offline');
            }
            throw error;
        }
    }
  
    private async processQueue() {
        if (this.processing || this.queue.length === 0) return;
        
        this.processing = true;
        this.setStatus('processing');
  
        const updates = [...this.queue];
        this.queue = [];
  
        for (const update of updates) {
            try {
                await update.execute();
            } catch (error) {
                update.rollback();
                this.setStatus('error');
            }
        }
  
        this.processing = false;
        if (this.status !== 'error') {
            this.setStatus('success');
        }
    }
  
    getStatus(): UpdateStatus {
        return this.status;
    }
  
    getStats() {
        return {
            pending: this.queue.length,
            status: this.status
        };
    }
}

// Create and export a single instance
export const updateQueue = new UpdateQueue();