/**
 * PipeEventSystem
 *
 * A Unix-inspired event system that uses message queues (pipes) for communication.
 * This replaces the traditional EventBus with a more Unix-like approach:
 * - Events flow through named pipes
 * - Components can "subscribe" by reading from pipes
 * - Components can "publish" by writing to pipes
 * - Multiple readers can receive the same event (multicast)
 */

import type { EventEmitter, EventListener } from './types';
import type { GameKernel } from './GameKernel';
import { MessagePriority } from './MessageQueue';

// Standard queue paths
const DEFAULT_QUEUE = '/pipes/system';

/**
 * PipeEventSystem implements EventEmitter using Unix-style named pipes
 */
export class PipeEventSystem implements EventEmitter {
	private kernel: GameKernel;
	private debug: boolean;
	private subscriptions: Map<string, { queue: string; event: string; listener: EventListener }> =
		new Map();

	// Lookup tables to make event handling more efficient
	private eventListeners: Map<string, Set<string>> = new Map();
	private queueListeners: Map<string, Set<string>> = new Map();

	// Event receiver running state
	private isReceiving: Map<string, boolean> = new Map();
	private stopRequested: Set<string> = new Set();

	/**
	 * Create a new pipe-based event system
	 * @param kernel Kernel instance
	 * @param debug Whether to show debug logs
	 */
	constructor(kernel: GameKernel, debug: boolean = false) {
		this.kernel = kernel;
		this.debug = debug;

		// Start event receivers for standard queues
		this.ensureQueueExists(DEFAULT_QUEUE);

		if (this.debug) {
			console.log(`[PipeEventSystem] Initialized`);
		}
	}

	/**
	 * Emit an event
	 * @param event Event name
	 * @param data Event data
	 */
	emit(event: string, data: any): void {
		if (this.debug) {
			console.log(`[PipeEventSystem] Emitting event: ${event}`, data);
		}

		// Determine which queues receive this event
		const queues = this.getQueuesForEvent(event);
		if (queues.size === 0) {
			if (this.debug) {
				console.log(`[PipeEventSystem] No listeners for event: ${event}`);
			}
			return;
		}

		// Send to all relevant queues
		for (const queue of queues) {
			this.kernel.sendMessage(queue, event, data, {
				priority: MessagePriority.NORMAL,
				source: 'event_system'
			});
		}
	}

	/**
	 * Subscribe to an event
	 * @param event Event name
	 * @param listener Listener function
	 * @returns Subscription ID
	 */
	on(event: string, listener: EventListener, queue: string = DEFAULT_QUEUE): string {
		// Ensure the queue exists
		this.ensureQueueExists(queue);

		// Create a subscription ID
		const id = `${event}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

		// Store subscription
		this.subscriptions.set(id, { queue, event, listener });

		// Update lookup tables
		this.addToEventListeners(event, id);
		this.addToQueueListeners(queue, id);

		// Start event receiver for the queue if not already running
		this.startEventReceiver(queue);

		if (this.debug) {
			console.log(
				`[PipeEventSystem] Added listener for event: ${event} on queue: ${queue}, id: ${id}`
			);
		}

		return id;
	}

	/**
	 * Unsubscribe from an event
	 * @param id Subscription ID
	 */
	off(id: string): void {
		const subscription = this.subscriptions.get(id);
		if (!subscription) {
			return;
		}

		const { queue, event } = subscription;

		// Remove from lookup tables
		this.removeFromEventListeners(event, id);
		this.removeFromQueueListeners(queue, id);

		// Remove subscription
		this.subscriptions.delete(id);

		if (this.debug) {
			console.log(`[PipeEventSystem] Removed listener for event: ${event}, id: ${id}`);
		}

		// Stop event receiver if no more listeners for this queue
		const queueListeners = this.queueListeners.get(queue);
		if (!queueListeners || queueListeners.size === 0) {
			this.stopEventReceiver(queue);
		}
	}

	/**
	 * Remove all event listeners
	 */
	removeAllListeners(): void {
		// Clear all subscriptions
		this.subscriptions.clear();
		this.eventListeners.clear();

		// Stop all event receivers
		for (const queue of this.queueListeners.keys()) {
			this.stopEventReceiver(queue);
		}

		this.queueListeners.clear();

		if (this.debug) {
			console.log(`[PipeEventSystem] Removed all listeners`);
		}
	}

	/**
	 * Ensure the queue exists, creating it if needed
	 * @param queue Queue path
	 */
	private ensureQueueExists(queue: string): void {
		if (!this.kernel.getMessageQueue(queue)) {
			this.kernel.createMessageQueue(queue, { debug: this.debug });
		}
	}

	/**
	 * Add a subscription ID to the event listeners map
	 * @param event Event name
	 * @param id Subscription ID
	 */
	private addToEventListeners(event: string, id: string): void {
		if (!this.eventListeners.has(event)) {
			this.eventListeners.set(event, new Set());
		}
		this.eventListeners.get(event)!.add(id);
	}

	/**
	 * Remove a subscription ID from the event listeners map
	 * @param event Event name
	 * @param id Subscription ID
	 */
	private removeFromEventListeners(event: string, id: string): void {
		const listeners = this.eventListeners.get(event);
		if (listeners) {
			listeners.delete(id);
			if (listeners.size === 0) {
				this.eventListeners.delete(event);
			}
		}
	}

	/**
	 * Add a subscription ID to the queue listeners map
	 * @param queue Queue path
	 * @param id Subscription ID
	 */
	private addToQueueListeners(queue: string, id: string): void {
		if (!this.queueListeners.has(queue)) {
			this.queueListeners.set(queue, new Set());
		}
		this.queueListeners.get(queue)!.add(id);
	}

	/**
	 * Remove a subscription ID from the queue listeners map
	 * @param queue Queue path
	 * @param id Subscription ID
	 */
	private removeFromQueueListeners(queue: string, id: string): void {
		const listeners = this.queueListeners.get(queue);
		if (listeners) {
			listeners.delete(id);
			if (listeners.size === 0) {
				this.queueListeners.delete(queue);
			}
		}
	}

	/**
	 * Get all queues that need to receive an event
	 * @param event Event name
	 * @returns Set of queue paths
	 */
	private getQueuesForEvent(event: string): Set<string> {
		const queues = new Set<string>();

		// Find all subscriptions for this event
		const subscriptionIds = this.eventListeners.get(event);
		if (subscriptionIds) {
			for (const id of subscriptionIds) {
				const subscription = this.subscriptions.get(id);
				if (subscription) {
					queues.add(subscription.queue);
				}
			}
		}

		return queues;
	}

	/**
	 * Start an event receiver for a queue
	 * @param queue Queue path
	 */
	private startEventReceiver(queue: string): void {
		if (this.isReceiving.get(queue)) {
			return; // Already running
		}

		this.isReceiving.set(queue, true);
		this.stopRequested.delete(queue);

		// Start receiving in the background
		this.receiveEvents(queue);

		if (this.debug) {
			console.log(`[PipeEventSystem] Started event receiver for queue: ${queue}`);
		}
	}

	/**
	 * Stop an event receiver for a queue
	 * @param queue Queue path
	 */
	private stopEventReceiver(queue: string): void {
		if (!this.isReceiving.get(queue)) {
			return; // Not running
		}

		this.stopRequested.add(queue);
		this.isReceiving.set(queue, false);

		if (this.debug) {
			console.log(`[PipeEventSystem] Stopping event receiver for queue: ${queue}`);
		}
	}

	/**
	 * Receive events from a queue in the background
	 * @param queue Queue path
	 */
	private async receiveEvents(queue: string): Promise<void> {
		if (this.debug) {
			console.log(`[PipeEventSystem] Receiving events from queue: ${queue}`);
		}

		while (!this.stopRequested.has(queue)) {
			try {
				// Wait for a message with a timeout
				const message = await this.kernel.waitForMessage(queue, undefined, 1000);

				// Process the message
				const event = message.type;
				const data = message.payload;

				// Find all listeners for this event
				const listenerIds = this.eventListeners.get(event);
				if (listenerIds) {
					for (const id of listenerIds) {
						const subscription = this.subscriptions.get(id);
						if (subscription && subscription.queue === queue) {
							try {
								// Call the listener
								subscription.listener(data);
							} catch (error) {
								console.error(`[PipeEventSystem] Error in listener for event ${event}:`, error);
							}
						}
					}
				}
			} catch (error) {
				// Ignore timeout errors
				if (!(error instanceof Error && error.message.includes('Timeout'))) {
					console.error(`[PipeEventSystem] Error receiving from queue ${queue}:`, error);
				}
			}

			// Small delay to prevent busy waiting
			await new Promise((resolve) => setTimeout(resolve, 10));
		}

		if (this.debug) {
			console.log(`[PipeEventSystem] Event receiver stopped for queue: ${queue}`);
		}
	}
}
