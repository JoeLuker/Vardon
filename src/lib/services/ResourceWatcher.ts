import type { GameKernel, WebKernel } from '$lib/domain/kernel';
import { logger } from '$lib/utils/Logger';

export interface ResourceWatcherOptions {
	checkInterval?: number;
	maxWaitTime?: number;
	debug?: boolean;
}

/**
 * Service responsible for monitoring resource availability
 */
export class ResourceWatcher {
	private readonly kernel: GameKernel | WebKernel;
	private readonly checkInterval: number;
	private readonly maxWaitTime: number;
	private readonly debug: boolean;
	private checkTimer?: number;
	private safetyTimer?: number;
	private eventUnsubscribers: Array<() => void> = [];

	constructor(kernel: GameKernel | WebKernel, options: ResourceWatcherOptions = {}) {
		this.kernel = kernel;
		this.checkInterval = options.checkInterval || 500;
		this.maxWaitTime = options.maxWaitTime || 10000;
		this.debug = options.debug || false;
	}

	/**
	 * Wait for all required resources to be available
	 */
	async waitForResources(): Promise<void> {
		return new Promise((resolve, reject) => {
			// Check if resources are already available
			if (this.checkResourcesAvailable()) {
				resolve();
				return;
			}

			// Set up monitoring
			this.setupResourceListeners(resolve);
			this.startSafetyTimer(reject);
			this.startCheckTimer();
		});
	}

	/**
	 * Check if all required resources are available
	 */
	checkResourcesAvailable(): boolean {
		if (!this.kernel) return false;

		// Ensure devices map exists
		if (!this.kernel.devices) {
			this.kernel.devices = new Map();
		}

		const hasCharDevice = this.kernel.devices.has('/v_dev/character');
		const hasDbDevice = this.kernel.devices.has('/v_dev/db');
		const dbDirsReady = this.kernel.exists('/v_etc/db_dirs_ready');

		if (this.debug) {
			logger.debug('ResourceWatcher', 'checkResourcesAvailable', 'Resource status', {
				hasCharDevice,
				hasDbDevice,
				dbDirsReady,
				deviceCount: this.kernel.devices.size
			});
		}

		return hasCharDevice && hasDbDevice && dbDirsReady;
	}

	/**
	 * Clean up watchers and timers
	 */
	cleanup(): void {
		this.clearTimers();
		this.unsubscribeEvents();
	}

	/**
	 * Set up event listeners for resource availability
	 */
	private setupResourceListeners(onReady: () => void): void {
		const checkAndResolve = () => {
			if (this.checkResourcesAvailable()) {
				logger.info('ResourceWatcher', 'setupResourceListeners', 'Resources became available');
				this.cleanup();
				onReady();
			}
		};

		// Listen for mount events
		const mountUnsub = this.kernel.events.on('fs:mount', (event) => {
			logger.debug('ResourceWatcher', 'setupResourceListeners', 'Mount event', event);
			checkAndResolve();
		});

		// Listen for file creation events (for db_dirs_ready flag)
		const createUnsub = this.kernel.events.on('fs:create', (event) => {
			if (event.path === '/v_etc/db_dirs_ready') {
				logger.debug('ResourceWatcher', 'setupResourceListeners', 'DB dirs ready');
				checkAndResolve();
			}
		});

		// Listen for boot ready event (if using WebKernel)
		const bootUnsub = this.kernel.events.on('boot:ready', () => {
			logger.debug('ResourceWatcher', 'setupResourceListeners', 'Boot ready');
			checkAndResolve();
		});

		this.eventUnsubscribers = [mountUnsub, createUnsub, bootUnsub];
	}

	/**
	 * Start periodic resource checking
	 */
	private startCheckTimer(): void {
		this.checkTimer = window.setInterval(() => {
			if (this.checkResourcesAvailable()) {
				logger.info('ResourceWatcher', 'startCheckTimer', 'Resources available via polling');
				this.cleanup();
			}
		}, this.checkInterval);
	}

	/**
	 * Start safety timer to prevent infinite waiting
	 */
	private startSafetyTimer(onTimeout: (error: Error) => void): void {
		this.safetyTimer = window.setTimeout(() => {
			logger.error('ResourceWatcher', 'startSafetyTimer', 'Timeout waiting for resources', {
				maxWaitTime: this.maxWaitTime
			});
			this.cleanup();
			onTimeout(new Error(`Resources not available after ${this.maxWaitTime}ms`));
		}, this.maxWaitTime);
	}

	/**
	 * Clear all timers
	 */
	private clearTimers(): void {
		if (this.checkTimer) {
			clearInterval(this.checkTimer);
			this.checkTimer = undefined;
		}
		if (this.safetyTimer) {
			clearTimeout(this.safetyTimer);
			this.safetyTimer = undefined;
		}
	}

	/**
	 * Unsubscribe from all events
	 */
	private unsubscribeEvents(): void {
		for (const unsub of this.eventUnsubscribers) {
			if (typeof unsub === 'function') {
				unsub();
			}
		}
		this.eventUnsubscribers = [];
	}
}
