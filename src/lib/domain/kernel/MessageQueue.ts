/**
 * MessageQueue - A Unix-style message queue implementation
 *
 * This follows Unix/Linux message queue (mq_*) API design but adapted for JS/TS:
 * - Each queue has a name (path)
 * - Messages are FIFO (first in, first out)
 * - Supports non-blocking reads and writes
 * - Supports message priorities
 * - Message selectors to filter by type
 * - Max queue length to prevent memory issues
 */

// Message priority levels (higher number = higher priority)
export enum MessagePriority {
	LOW = 0,
	NORMAL = 5,
	HIGH = 10,
	URGENT = 20
}

// Message structure
export interface Message {
	// Message type for filtering
	type: string;

	// Message payload
	payload: any;

	// Message priority (controls ordering)
	priority: MessagePriority;

	// Message ID (generated on enqueue)
	id: string;

	// Timestamp when message was created
	timestamp: number;

	// Source component that sent the message
	source?: string;

	// Target component to receive the message (optional)
	target?: string;

	// Time to live in milliseconds (0 = forever)
	ttl?: number;
}

// Message queue attributes
export interface MessageQueueAttributes {
	// Maximum number of messages in the queue
	maxMessages: number;

	// Whether to reject messages when the queue is full
	rejectWhenFull: boolean;

	// Default time to live for messages (in milliseconds)
	defaultTTL: number;

	// Whether to log operations
	debug: boolean;
}

// Default queue attributes
const DEFAULT_ATTRIBUTES: MessageQueueAttributes = {
	maxMessages: 1000,
	rejectWhenFull: true,
	defaultTTL: 0, // 0 means messages don't expire
	debug: false
};

// Message selector for filtering messages
export type MessageSelector = (message: Message) => boolean;

// Message queue statistics
export interface QueueStats {
	// Queue name
	name: string;

	// Current number of messages
	size: number;

	// Maximum allowed messages
	maxSize: number;

	// Number of messages enqueued
	enqueued: number;

	// Number of messages dequeued
	dequeued: number;

	// Number of messages that expired
	expired: number;

	// Number of messages dropped due to queue full
	dropped: number;
}

/**
 * Message Queue implementation
 * Following the Unix philosophy of doing one thing well
 */
export class MessageQueue {
	private name: string;
	private queue: Message[] = [];
	private attributes: MessageQueueAttributes;

	// Stats
	private enqueueCount: number = 0;
	private dequeueCount: number = 0;
	private expiredCount: number = 0;
	private droppedCount: number = 0;

	// Readers waiting for messages
	private waitingReaders: Array<{
		resolve: (message: Message) => void;
		reject: (error: Error) => void;
		selector?: MessageSelector;
		timer?: NodeJS.Timeout;
	}> = [];

	constructor(name: string, attributes: Partial<MessageQueueAttributes> = {}) {
		this.name = name;
		this.attributes = { ...DEFAULT_ATTRIBUTES, ...attributes };

		this.log(`Created message queue "${name}"`);
	}

	/**
	 * Get the name of the queue
	 */
	public getName(): string {
		return this.name;
	}

	/**
	 * Get the current size of the queue
	 */
	public size(): number {
		return this.queue.length;
	}

	/**
	 * Get queue statistics
	 */
	public getStats(): QueueStats {
		return {
			name: this.name,
			size: this.queue.length,
			maxSize: this.attributes.maxMessages,
			enqueued: this.enqueueCount,
			dequeued: this.dequeueCount,
			expired: this.expiredCount,
			dropped: this.droppedCount
		};
	}

	/**
	 * Purge expired messages from the queue
	 * @returns Number of messages purged
	 */
	public purgeExpired(): number {
		const now = Date.now();
		const startSize = this.queue.length;

		// Filter out expired messages
		this.queue = this.queue.filter((message) => {
			const isExpired = message.ttl && message.ttl > 0 && now - message.timestamp > message.ttl;

			if (isExpired) {
				this.expiredCount++;
			}

			return !isExpired;
		});

		const purged = startSize - this.queue.length;
		if (purged > 0) {
			this.log(`Purged ${purged} expired messages from queue "${this.name}"`);
		}

		return purged;
	}

	/**
	 * Enqueue a message
	 * @param type Message type
	 * @param payload Message payload
	 * @param options Message options
	 * @returns Message ID if successful, null if rejected
	 */
	public enqueue(
		type: string,
		payload: any,
		options: {
			priority?: MessagePriority;
			source?: string;
			target?: string;
			ttl?: number;
		} = {}
	): string | null {
		// Purge expired messages first
		this.purgeExpired();

		// Check if queue is full
		if (this.queue.length >= this.attributes.maxMessages) {
			if (this.attributes.rejectWhenFull) {
				this.log(`Rejected message of type "${type}" because queue "${this.name}" is full`);
				this.droppedCount++;
				return null;
			} else {
				// Remove oldest, lowest priority message
				this.queue.sort((a, b) => {
					// First by priority (ascending)
					const priorityDiff = a.priority - b.priority;
					if (priorityDiff !== 0) return priorityDiff;

					// Then by timestamp (descending - oldest first)
					return a.timestamp - b.timestamp;
				});

				const removed = this.queue.shift();
				if (removed) {
					this.log(
						`Dropped oldest message of type "${removed.type}" to make room in queue "${this.name}"`
					);
					this.droppedCount++;
				}
			}
		}

		// Create the message
		const messageId = `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
		const message: Message = {
			type,
			payload,
			priority: options.priority ?? MessagePriority.NORMAL,
			id: messageId,
			timestamp: Date.now(),
			source: options.source,
			target: options.target,
			ttl: options.ttl ?? this.attributes.defaultTTL
		};

		// Add to queue
		this.queue.push(message);
		this.enqueueCount++;

		// Sort by priority (higher numbers first)
		this.queue.sort((a, b) => b.priority - a.priority);

		this.log(`Enqueued message of type "${type}" with id "${messageId}" to queue "${this.name}"`);

		// Check if there are any waiting readers
		this.notifyWaitingReaders();

		return messageId;
	}

	/**
	 * Dequeue a message
	 * @param selector Optional function to select which message to dequeue
	 * @returns The message, or null if none available
	 */
	public dequeue(selector?: MessageSelector): Message | null {
		// Purge expired messages first
		this.purgeExpired();

		if (this.queue.length === 0) {
			return null;
		}

		let messageIndex = -1;

		if (selector) {
			// Find the first message that matches the selector
			messageIndex = this.queue.findIndex(selector);
			if (messageIndex === -1) {
				return null;
			}
		} else {
			// Take the first message (which will be highest priority due to sorting)
			messageIndex = 0;
		}

		// Remove the message from the queue
		const message = this.queue.splice(messageIndex, 1)[0];
		this.dequeueCount++;

		this.log(
			`Dequeued message of type "${message.type}" with id "${message.id}" from queue "${this.name}"`
		);

		return message;
	}

	/**
	 * Peek at the next message without removing it
	 * @param selector Optional function to select which message to peek
	 * @returns The message, or null if none available
	 */
	public peek(selector?: MessageSelector): Message | null {
		// Purge expired messages first
		this.purgeExpired();

		if (this.queue.length === 0) {
			return null;
		}

		if (selector) {
			// Find the first message that matches the selector
			const message = this.queue.find(selector);
			return message || null;
		} else {
			// Return the first message (which will be highest priority due to sorting)
			return this.queue[0];
		}
	}

	/**
	 * Wait for a message to be available
	 * @param selector Optional function to select which message to wait for
	 * @param timeout Optional timeout in milliseconds (0 = wait forever)
	 * @returns Promise that resolves with the message
	 */
	public async waitForMessage(selector?: MessageSelector, timeout: number = 0): Promise<Message> {
		// Check if there's already a message available
		const message = this.dequeue(selector);
		if (message) {
			return message;
		}

		// No message available, create a promise that will be resolved when a message arrives
		return new Promise<Message>((resolve, reject) => {
			const waiter = {
				resolve,
				reject,
				selector
			};

			// Add timeout if requested
			if (timeout > 0) {
				waiter.timer = setTimeout(() => {
					// Remove this waiter from the list
					const index = this.waitingReaders.indexOf(waiter);
					if (index !== -1) {
						this.waitingReaders.splice(index, 1);
					}

					reject(new Error(`Timeout waiting for message on queue "${this.name}"`));
				}, timeout);
			}

			this.waitingReaders.push(waiter);
			this.log(`Added waiting reader for queue "${this.name}"`);
		});
	}

	/**
	 * Clear all messages from the queue
	 * @returns Number of messages cleared
	 */
	public clear(): number {
		const count = this.queue.length;
		this.queue = [];

		// Reject any waiting readers
		for (const waiter of this.waitingReaders) {
			if (waiter.timer) {
				clearTimeout(waiter.timer);
			}
			waiter.reject(new Error(`Queue "${this.name}" was cleared`));
		}
		this.waitingReaders = [];

		this.log(`Cleared ${count} messages from queue "${this.name}"`);
		return count;
	}

	/**
	 * Browse all messages in the queue without removing them
	 * @param selector Optional function to filter messages
	 * @returns Array of messages
	 */
	public browse(selector?: MessageSelector): Message[] {
		// Purge expired messages first
		this.purgeExpired();

		if (selector) {
			return this.queue.filter(selector);
		} else {
			// Return a copy to prevent external modification
			return [...this.queue];
		}
	}

	/**
	 * Log a message if debugging is enabled
	 */
	private log(message: string): void {
		if (this.attributes.debug) {
			console.log(`[MessageQueue] ${message}`);
		}
	}

	/**
	 * Notify any waiting readers that a message is available
	 */
	private notifyWaitingReaders(): void {
		if (this.waitingReaders.length === 0 || this.queue.length === 0) {
			return;
		}

		// Process each waiting reader
		for (let i = this.waitingReaders.length - 1; i >= 0; i--) {
			const waiter = this.waitingReaders[i];

			// Find an appropriate message
			const message = this.dequeue(waiter.selector);
			if (message) {
				// Cancel any timeout
				if (waiter.timer) {
					clearTimeout(waiter.timer);
				}

				// Remove from waiting list
				this.waitingReaders.splice(i, 1);

				// Resolve the promise
				waiter.resolve(message);

				this.log(`Notified waiting reader for queue "${this.name}"`);
			}
		}
	}
}
