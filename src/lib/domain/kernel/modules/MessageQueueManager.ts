import { MessageQueue, type MessageQueueAttributes } from '../MessageQueue';
import { VIRTUAL_PATHS } from '../PathConstants';

/**
 * Manages message queues (Unix-style named pipes)
 */
export class MessageQueueManager {
	private readonly messageQueues: Map<string, MessageQueue> = new Map();
	private readonly debug: boolean;

	constructor(debug: boolean = false) {
		this.debug = debug;
		this.initializeMessageQueues();
	}

	/**
	 * Initialize standard message queues
	 */
	private initializeMessageQueues(): void {
		// Create standard message queues
		this.createQueue(VIRTUAL_PATHS.PIPES_SYSTEM, { debug: this.debug });
		this.createQueue(VIRTUAL_PATHS.PIPES_GAME_EVENTS, { debug: this.debug });
		this.createQueue(VIRTUAL_PATHS.PIPES_ENTITY_EVENTS, { debug: this.debug });
		this.createQueue(VIRTUAL_PATHS.PIPES_FEATURE_EVENTS, { debug: this.debug });

		if (this.debug) {
			console.log('[MessageQueueManager] Message queues initialized');
		}
	}

	/**
	 * Create a message queue
	 */
	createQueue(path: string, attributes?: MessageQueueAttributes): MessageQueue {
		if (this.messageQueues.has(path)) {
			return this.messageQueues.get(path)!;
		}

		const queue = new MessageQueue(path, attributes);
		this.messageQueues.set(path, queue);

		if (this.debug) {
			console.log(`[MessageQueueManager] Created message queue: ${path}`);
		}

		return queue;
	}

	/**
	 * Get a message queue
	 */
	getQueue(path: string): MessageQueue | undefined {
		return this.messageQueues.get(path);
	}

	/**
	 * Delete a message queue
	 */
	deleteQueue(path: string): boolean {
		const queue = this.messageQueues.get(path);
		if (!queue) {
			return false;
		}

		queue.close();
		this.messageQueues.delete(path);

		if (this.debug) {
			console.log(`[MessageQueueManager] Deleted message queue: ${path}`);
		}

		return true;
	}

	/**
	 * Get all message queues
	 */
	getAllQueues(): Map<string, MessageQueue> {
		return new Map(this.messageQueues);
	}

	/**
	 * Close all message queues
	 */
	closeAll(): void {
		for (const [path, queue] of this.messageQueues) {
			queue.close();
			if (this.debug) {
				console.log(`[MessageQueueManager] Closed message queue: ${path}`);
			}
		}
		this.messageQueues.clear();
	}
}
