/**
 * WebKernel.ts - Browser-Specific Kernel Implementation
 *
 * This extends the base Kernel class with browser-specific functionality.
 * It handles initialization and provides a clean boot sequence for web applications.
 */

import { Kernel } from './Kernel';
import { FileSystem } from './FileSystem';
import { BrowserStorage } from './BrowserStorage';
import type { KernelOptions, Capability } from './types';
import { EventBus } from './EventBus';

/**
 * Web-specific kernel options
 */
export interface WebKernelOptions extends KernelOptions {
	/**
	 * Auto-initialize capabilities on boot
	 */
	autoInitCapabilities?: boolean;

	/**
	 * Time in ms to wait between initialization steps
	 */
	initStepDelay?: number;

	/**
	 * Whether to start the boot process automatically
	 */
	autoStart?: boolean;

	/**
	 * Storage key prefix for browser storage
	 */
	storagePrefix?: string;
}

/**
 * Boot status and process
 */
export enum BootStatus {
	NOT_STARTED = 'NOT_STARTED',
	INITIALIZING = 'INITIALIZING',
	MOUNTING_FILESYSTEM = 'MOUNTING_FILESYSTEM',
	CREATING_DIRECTORIES = 'CREATING_DIRECTORIES',
	REGISTERING_CAPABILITIES = 'REGISTERING_CAPABILITIES',
	LOADING_ENTITIES = 'LOADING_ENTITIES',
	READY = 'READY',
	FAILED = 'FAILED'
}

/**
 * WebKernel extends the base Kernel class with browser-specific
 * functionality and boot sequence management.
 */
export class WebKernel extends Kernel {
	/**
	 * Boot status tracking
	 */
	private bootStatus: BootStatus = BootStatus.NOT_STARTED;

	/**
	 * Progress tracking (0-100)
	 */
	private bootProgress: number = 0;

	/**
	 * Error from boot process
	 */
	private bootError: Error | null = null;

	/**
	 * Callback for boot status changes
	 */
	private bootStatusCallback: ((status: BootStatus, progress: number) => void) | null = null;

	/**
	 * Web-specific options
	 */
	private readonly webOptions: WebKernelOptions;

	/**
	 * Capabilities to register during boot
	 */
	private pendingCapabilities: Map<string, Capability> = new Map();

	constructor(options: WebKernelOptions = {}) {
		// Create filesystem with browser storage
		const storage = new BrowserStorage();
		const fs = new FileSystem({
			storage,
			debug: options.debug || false,
			skipMount: true // We'll mount as part of boot sequence
		});

		// Create event bus
		const eventBus = options.eventEmitter || new EventBus(options.debug || false);

		// Create base kernel
		super({
			...options,
			fs,
			eventEmitter: eventBus
		});

		// Store web-specific options
		this.webOptions = {
			autoInitCapabilities: true,
			initStepDelay: 10,
			autoStart: true,
			...options
		};

		// Start boot process if auto-start is enabled
		if (this.webOptions.autoStart) {
			this.boot().catch((error) => {
				console.error('[WebKernel] Boot process failed:', error);
				this.bootStatus = BootStatus.FAILED;
				this.bootError = error instanceof Error ? error : new Error(String(error));
			});
		}
	}

	/**
	 * Get the current boot status
	 * @returns Current boot status
	 */
	getBootStatus(): BootStatus {
		return this.bootStatus;
	}

	/**
	 * Get the current boot progress (0-100)
	 * @returns Boot progress percentage
	 */
	getBootProgress(): number {
		return this.bootProgress;
	}

	/**
	 * Get boot error if any
	 * @returns Boot error or null if none
	 */
	getBootError(): Error | null {
		return this.bootError;
	}

	/**
	 * Register a callback for boot status changes
	 * @param callback Function to call when boot status changes
	 */
	onBootStatusChange(callback: (status: BootStatus, progress: number) => void): void {
		this.bootStatusCallback = callback;

		// Immediately call with current status
		callback(this.bootStatus, this.bootProgress);
	}

	/**
	 * Update boot status and progress
	 * @param status New boot status
	 * @param progress New boot progress (0-100)
	 */
	private updateBootStatus(status: BootStatus, progress: number): void {
		this.bootStatus = status;
		this.bootProgress = progress;

		if (this.bootStatusCallback) {
			this.bootStatusCallback(status, progress);
		}

		if (this.debug) {
			console.log(`[WebKernel] Boot status: ${status} (${progress}%)`);
		}
	}

	/**
	 * Wait for a short delay between initialization steps
	 * This gives the browser time to update the UI if needed
	 */
	private async waitStep(): Promise<void> {
		if (this.webOptions.initStepDelay && this.webOptions.initStepDelay > 0) {
			return new Promise((resolve) => setTimeout(resolve, this.webOptions.initStepDelay));
		}
	}

	/**
	 * Start the boot process
	 * @returns Promise that resolves when boot is complete
	 */
	async boot(): Promise<void> {
		// Don't boot more than once
		if (this.bootStatus !== BootStatus.NOT_STARTED && this.bootStatus !== BootStatus.FAILED) {
			return;
		}

		try {
			this.updateBootStatus(BootStatus.INITIALIZING, 0);

			// Mount the filesystem
			this.updateBootStatus(BootStatus.MOUNTING_FILESYSTEM, 10);
			await this.fs.mount();
			await this.waitStep();

			// Run initialization sequence
			this.updateBootStatus(BootStatus.CREATING_DIRECTORIES, 30);
			await this.initializeStandardDirectories();
			await this.waitStep();

			// Initialize message queues
			await this.initializeMessageQueues();
			await this.waitStep();

			// Register capabilities if auto-init is enabled
			if (this.webOptions.autoInitCapabilities) {
				this.updateBootStatus(BootStatus.REGISTERING_CAPABILITIES, 60);
				await this.initializeCapabilities();
				await this.waitStep();
			}

			// Load entities
			this.updateBootStatus(BootStatus.LOADING_ENTITIES, 80);
			// (This step is application-specific, will be implemented by application code)
			await this.waitStep();

			// Ready!
			this.updateBootStatus(BootStatus.READY, 100);

			// Emit boot complete event
			this.events.emit('boot:complete', {
				timestamp: new Date().toISOString()
			});

			if (this.debug) {
				console.log('[WebKernel] Boot sequence completed successfully');
			}
		} catch (error) {
			this.bootStatus = BootStatus.FAILED;
			this.bootError = error instanceof Error ? error : new Error(String(error));

			// Emit boot error event
			this.events.emit('boot:error', {
				error: this.bootError,
				timestamp: new Date().toISOString()
			});

			console.error('[WebKernel] Boot sequence failed:', error);
			throw error;
		}
	}

	/**
	 * Initialize standard directories for the filesystem
	 * This creates the basic directory structure needed for the system
	 */
	private async initializeStandardDirectories(): Promise<void> {
		// Basic directories were already created during filesystem mounting,
		// so we only need to add application-specific ones

		const appDirs = ['/proc/api', '/etc/config', '/var/cache', '/var/data'];

		for (const dir of appDirs) {
			await this.fs.mkdir(dir, true);
		}
	}

	/**
	 * Initialize standard message queues
	 */
	private async initializeMessageQueues(): Promise<void> {
		// Standard message queues
		this.createMessageQueue('/pipes/ui_events', { debug: this.debug });
		this.createMessageQueue('/pipes/data_events', { debug: this.debug });
	}

	/**
	 * Initialize and register capabilities
	 * This registers all pending capabilities with the kernel
	 */
	private async initializeCapabilities(): Promise<void> {
		if (this.pendingCapabilities.size === 0) {
			// No capabilities to register
			return;
		}

		// Register all pending capabilities
		for (const [id, capability] of this.pendingCapabilities.entries()) {
			this.registerCapability(id, capability);
		}

		// Clear pending capabilities
		this.pendingCapabilities.clear();
	}

	/**
	 * Add a capability to be registered during boot
	 * @param id Capability ID
	 * @param capability Capability implementation
	 */
	addPendingCapability(id: string, capability: Capability): void {
		this.pendingCapabilities.set(id, capability);

		// If we're already booted, register immediately
		if (this.bootStatus === BootStatus.READY) {
			this.registerCapability(id, capability);
			this.pendingCapabilities.delete(id);
		}
	}

	/**
	 * Detect if we're running in a browser environment
	 * @returns Boolean indicating if we're running in a browser
	 */
	static isBrowserEnvironment(): boolean {
		return (
			typeof window !== 'undefined' &&
			typeof document !== 'undefined' &&
			typeof localStorage !== 'undefined'
		);
	}

	/**
	 * Determine if browser storage is available
	 * @returns Whether browser storage is available
	 */
	static isStorageAvailable(): boolean {
		return BrowserStorage.isAvailable();
	}
}
