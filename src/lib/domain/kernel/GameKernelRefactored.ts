import type {
	Entity,
	Capability,
	Plugin,
	EventEmitter,
	KernelOptions,
	PathResult,
	Stats,
	Message,
	OpenMode,
	FileDescriptor,
	MountOptions
} from './types';
import { ErrorCode } from './types';
import { EventBus } from './EventBus';
import { VIRTUAL_PATHS } from './PathConstants';
import {
	FileSystemManager,
	DeviceManager,
	FileDescriptorManager,
	MessageQueueManager,
	EntityManager,
	PluginExecutor
} from './modules';
import type { MessageSelector } from './MessageQueue';

/**
 * Refactored GameKernel - orchestrates the modular components
 * Implements a Unix-like kernel with better separation of concerns
 */
export class GameKernelRefactored {
	// Core modules
	private readonly fileSystem: FileSystemManager;
	private readonly deviceManager: DeviceManager;
	private readonly fdManager: FileDescriptorManager;
	private readonly mqManager: MessageQueueManager;
	private readonly entityManager: EntityManager;
	private readonly pluginExecutor: PluginExecutor;

	// Configuration
	private readonly debug: boolean;
	private readonly noFsEvents: boolean;

	// Event system
	public readonly events: EventEmitter;

	// Public device access (for compatibility)
	public get devices(): Map<string, Capability> {
		return this.deviceManager.getAllDevices();
	}

	// Unix standard paths (for compatibility)
	public static readonly PATHS = VIRTUAL_PATHS;

	constructor(options: KernelOptions = {}) {
		this.debug = options.debug || false;
		this.noFsEvents = options.noFsEvents || false;
		this.events = options.eventEmitter || new EventBus(this.debug);

		// Initialize modules
		this.fileSystem = new FileSystemManager(this.debug);
		this.deviceManager = new DeviceManager(this.events, this.debug);
		this.fdManager = new FileDescriptorManager(this.debug);
		this.mqManager = new MessageQueueManager(this.debug);
		this.entityManager = new EntityManager(this.debug);
		this.pluginExecutor = new PluginExecutor(this.events, this.debug);

		if (this.debug) {
			this.log('Kernel initialized with modular architecture');
		}
	}

	//=============================================================================
	// Filesystem Operations (delegated to FileSystemManager)
	//=============================================================================

	mkdir(path: string, recursive: boolean = true): PathResult {
		const result = this.fileSystem.mkdir(path, recursive);
		if (result.success && !this.noFsEvents) {
			this.events.emit('fs:mkdir', { path });
		}
		return result;
	}

	exists(path: string): boolean {
		return this.fileSystem.exists(path);
	}

	isDirectory(path: string): boolean {
		return this.fileSystem.isDirectory(path);
	}

	readdir(path: string): string[] {
		return this.fileSystem.readdir(path);
	}

	stat(path: string): Stats | null {
		return this.fileSystem.stat(path);
	}

	unlink(path: string): ErrorCode {
		// Check if any file descriptors are open
		if (this.fdManager.hasOpenDescriptors(path)) {
			this.error(`Cannot unlink file ${path} while it has open file descriptors`);
			return ErrorCode.EBUSY;
		}

		const result = this.fileSystem.deleteFile(path);
		if (result === ErrorCode.SUCCESS && !this.noFsEvents) {
			this.events.emit('fs:unlink', { path });
		}
		return result;
	}

	//=============================================================================
	// File Operations (using FileDescriptorManager)
	//=============================================================================

	open(path: string, mode: OpenMode): number {
		if (!path.startsWith('/')) {
			return -ErrorCode.EINVAL;
		}

		// Check if this is a device file
		const device = this.deviceManager.getDeviceAtPath(path);
		const devicePath = device ? path : undefined;

		// For non-device files, check existence based on mode
		if (!device) {
			if (mode === OpenMode.READ || mode === OpenMode.READ_WRITE) {
				if (!this.fileSystem.exists(path)) {
					return -ErrorCode.ENOENT;
				}
			} else if (mode === OpenMode.WRITE) {
				// Create file if it doesn't exist
				if (!this.fileSystem.exists(path)) {
					const result = this.fileSystem.createFile(path, {});
					if (!result.success) {
						return -result.errorCode!;
					}
				}
			}
		}

		// Allocate file descriptor
		const fd = this.fdManager.allocate(path, mode, devicePath);

		if (fd >= 0 && !this.noFsEvents) {
			this.events.emit('fs:open', { path, fd, mode });
		}

		return fd;
	}

	close(fd: number): ErrorCode {
		const result = this.fdManager.close(fd);
		if (result === ErrorCode.SUCCESS && !this.noFsEvents) {
			this.events.emit('fs:close', { fd });
		}
		return result;
	}

	read(fd: number): [ErrorCode, any] {
		const descriptor = this.fdManager.get(fd);
		if (!descriptor) {
			return [ErrorCode.EBADF, null];
		}

		// Check if this is a device file
		if (descriptor.devicePath) {
			const device = this.deviceManager.getDeviceAtPath(descriptor.devicePath);
			if (device && device.read) {
				const buffer = {};
				const result = device.read(fd, buffer);
				return [result, buffer];
			}
		}

		// Regular file read
		const inode = this.fileSystem.getInode(descriptor.path);
		if (!inode) {
			return [ErrorCode.ENOENT, null];
		}

		return [ErrorCode.SUCCESS, inode.data || {}];
	}

	write(fd: number, data: any): ErrorCode {
		const descriptor = this.fdManager.get(fd);
		if (!descriptor) {
			return ErrorCode.EBADF;
		}

		// Check mode
		if (descriptor.mode === OpenMode.READ) {
			return ErrorCode.EACCES;
		}

		// Check if this is a device file
		if (descriptor.devicePath) {
			const device = this.deviceManager.getDeviceAtPath(descriptor.devicePath);
			if (device && device.write) {
				return device.write(fd, data);
			}
		}

		// Regular file write
		const result = this.fileSystem.createFile(descriptor.path, data);
		return result.success ? ErrorCode.SUCCESS : result.errorCode!;
	}

	ioctl(fd: number, request: number, arg: any): ErrorCode {
		const descriptor = this.fdManager.get(fd);
		if (!descriptor) {
			return ErrorCode.EBADF;
		}

		// ioctl only works on device files
		if (!descriptor.devicePath) {
			return ErrorCode.ENOTTY;
		}

		const device = this.deviceManager.getDeviceAtPath(descriptor.devicePath);
		if (!device || !device.ioctl) {
			return ErrorCode.ENOTTY;
		}

		return device.ioctl(fd, request, arg);
	}

	//=============================================================================
	// Device Operations (delegated to DeviceManager)
	//=============================================================================

	mount(path: string, device: Capability, options: MountOptions = {}): PathResult {
		// Ensure parent directory exists
		const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
		if (!this.fileSystem.exists(parentPath)) {
			const mkdirResult = this.fileSystem.mkdir(parentPath);
			if (!mkdirResult.success) {
				return mkdirResult;
			}
		}

		// Pass kernel reference to device
		const deviceWithKernel = { ...device };
		if (deviceWithKernel.onMount) {
			const originalOnMount = deviceWithKernel.onMount;
			deviceWithKernel.onMount = (kernel: any) => {
				originalOnMount.call(deviceWithKernel, this);
			};
		}

		return this.deviceManager.mount(path, deviceWithKernel, options);
	}

	unmount(path: string): PathResult {
		return this.deviceManager.unmount(path);
	}

	getDevice(id: string): Capability | undefined {
		return this.deviceManager.getDeviceById(id);
	}

	//=============================================================================
	// Entity Operations (delegated to EntityManager)
	//=============================================================================

	registerEntity(entity: Entity): PathResult {
		const result = this.entityManager.register(entity);
		if (result.success) {
			// Create entity file
			this.fileSystem.createFile(result.path, entity);
			this.events.emit('entity:registered', { entityId: entity.id, path: result.path });
		}
		return result;
	}

	unregisterEntity(entityId: string): ErrorCode {
		const result = this.entityManager.unregister(entityId);
		if (result === ErrorCode.SUCCESS) {
			// Remove entity file
			const entityPath = `${VIRTUAL_PATHS.ENTITY}/${entityId}`;
			this.fileSystem.deleteFile(entityPath);
			this.events.emit('entity:unregistered', { entityId });
		}
		return result;
	}

	getEntity(entityId: string): Entity | undefined {
		return this.entityManager.getEntity(entityId);
	}

	//=============================================================================
	// Plugin Operations (delegated to PluginExecutor)
	//=============================================================================

	async exec(path: string, plugin: Plugin, args: string[] = []): Promise<PathResult> {
		return this.pluginExecutor.exec(path, plugin, args);
	}

	async kill(pluginId: string, signal: number = 15): Promise<ErrorCode> {
		return this.pluginExecutor.kill(pluginId, signal);
	}

	sendSignal(pluginId: string, signal: number, data?: any): ErrorCode {
		return this.pluginExecutor.sendSignal(pluginId, signal, data);
	}

	registerSignalHandler(
		pluginId: string,
		signal: number,
		handler: (signal: number, source: string, data?: any) => void
	): ErrorCode {
		return this.pluginExecutor.registerSignalHandler(pluginId, signal, handler);
	}

	//=============================================================================
	// Message Queue Operations (delegated to MessageQueueManager)
	//=============================================================================

	createMessageQueue(path: string, attributes?: any): PathResult {
		const queue = this.mqManager.createQueue(path, attributes);
		return { success: true, path };
	}

	sendMessage(queuePath: string, message: Message): ErrorCode {
		const queue = this.mqManager.getQueue(queuePath);
		if (!queue) {
			return ErrorCode.ENOENT;
		}
		return queue.send(message);
	}

	receiveMessage(queuePath: string, selector?: MessageSelector): Message | null {
		const queue = this.mqManager.getQueue(queuePath);
		if (!queue) {
			return null;
		}
		return queue.receive(selector);
	}

	//=============================================================================
	// Convenience Methods
	//=============================================================================

	create(path: string, data: any, force: boolean = false): PathResult {
		if (!force && this.fileSystem.exists(path)) {
			return {
				success: false,
				errorCode: ErrorCode.EEXIST,
				errorMessage: `File already exists: ${path}`,
				path
			};
		}

		const result = this.fileSystem.createFile(path, data);
		if (result.success && !this.noFsEvents) {
			this.events.emit('fs:create', { path });
		}
		return result;
	}

	readFile(path: string): {
		success: boolean;
		data?: any;
		errorCode?: ErrorCode;
		errorMessage?: string;
	} {
		const inode = this.fileSystem.getInode(path);
		if (!inode) {
			return {
				success: false,
				errorCode: ErrorCode.ENOENT,
				errorMessage: `File not found: ${path}`
			};
		}

		return {
			success: true,
			data: inode.data
		};
	}

	writeFile(path: string, data: any): PathResult {
		return this.create(path, data, true);
	}

	//=============================================================================
	// Lifecycle
	//=============================================================================

	async shutdown(): Promise<void> {
		this.log('Shutting down kernel...');

		// Shutdown plugins first
		await this.pluginExecutor.shutdownAll();

		// Close all message queues
		this.mqManager.closeAll();

		// Close all file descriptors (except stdin/stdout/stderr)
		for (const [fd] of this.fdManager.getAllDescriptors()) {
			if (fd > 2) {
				this.fdManager.close(fd);
			}
		}

		// Emit shutdown event
		this.events.emit('kernel:shutdown', {});

		this.log('Kernel shutdown complete');
	}

	//=============================================================================
	// Logging
	//=============================================================================

	private log(...args: any[]): void {
		if (this.debug) {
			console.log('[GameKernel]', ...args);
		}
	}

	private error(...args: any[]): void {
		console.error('[GameKernel]', ...args);
	}
}
