/**
 * Kernel.ts - Unix-Style Operating System Kernel
 *
 * This implements a proper Unix-like kernel that uses the persistent FileSystem.
 * It follows Unix principles with clear separation of concerns:
 * - Consistent syscall interface for file operations
 * - Process management through plugins
 * - Device management through capabilities
 * - Message queue system for inter-process communication
 * - Signal system for event handling
 *
 * This file replaces the older GameKernel implementation with a more consistent
 * architecture that properly implements Unix principles.
 */

import type {
	Entity,
	Capability,
	Plugin,
	EventEmitter,
	KernelOptions,
	FileDescriptor,
	MountOptions,
	PathResult,
	Stats,
	Message
} from './types';
import { OpenMode, ErrorCode } from './types';
import {
	MessageQueue,
	MessagePriority,
	type MessageQueueAttributes,
	type MessageSelector
} from './MessageQueue';
import { EventBus } from './EventBus';
import { FileSystem, type DirectoryEntry, FileType } from './FileSystem';
import { InvariantChecker, UnixInvariants } from './InvariantChecker';

// Plugin filesystem paths
const PLUGIN_PATHS = {
	/** Base path for plugin executables */
	BIN: '/v_bin',

	/** Base path for plugin process information */
	PROC_PLUGINS: '/v_proc/plugins',

	/** Base path for plugin configuration */
	ETC_PLUGINS: '/v_etc/plugins',

	/** Base path for plugin signals */
	PROC_SIGNALS: '/v_proc/signals'
};

// Message queue paths
const QUEUE_PATHS = {
	/** Base path for named pipes / message queues */
	PIPES: '/v_pipes',

	/** System message queue for kernel events */
	SYSTEM: '/v_pipes/system',

	/** Game events message queue */
	GAME_EVENTS: '/v_pipes/game_events',

	/** Entity events message queue */
	ENTITY_EVENTS: '/v_pipes/entity_events',

	/** Feature events message queue */
	FEATURE_EVENTS: '/v_pipes/feature_events'
};

/**
 * Kernel implements a Unix-like operating system kernel:
 * - Filesystem with persistence via localStorage
 * - Process management (plugins)
 * - System call interface (open, read, write, close)
 * - Mount points for devices (capabilities)
 * - IPC through message queues and signals
 */
export class Kernel {
	// Standard Unix paths
	public static readonly PATHS = {
		DEV: '/v_dev', // Device files
		PROC: '/v_proc', // Process information
		PROC_CHARACTER: '/v_proc/character', // Character processes
		ENTITY: '/v_entity', // Entity files
		ETC: '/v_etc', // Configuration
		VAR: '/v_var', // Variable data
		TMP: '/v_tmp', // Temporary files
		BIN: '/v_bin', // Executable plugins
		HOME: '/v_home' // User home directories
	};

	// Filesystem
	private readonly fs: FileSystem;

	// File descriptor management (like Unix FD table)
	private readonly fileDescriptors: Map<number, FileDescriptor> = new Map();
	private nextFd: number = 3; // 0=stdin, 1=stdout, 2=stderr

	// Configuration
	private readonly debug: boolean;
	private readonly noFsEvents: boolean;

	// Event system (like signals in Unix)
	public readonly events: EventEmitter;

	// Signal handlers for inter-plugin communication
	private readonly signalHandlers: Map<
		string,
		(signal: number, source: string, data?: any) => void
	> = new Map();

	// Message queues (named pipes)
	private readonly messageQueues: Map<string, MessageQueue> = new Map();

	// Device mapping (capability id -> mount path)
	private readonly devicePaths: Map<string, string> = new Map();

	// Invariant checker for runtime validation
	private readonly invariants: InvariantChecker;

	// Maximum allowed open file descriptors
	private readonly maxOpenFds = 1024;

	constructor(options: KernelOptions = {}) {
		this.debug = options.debug || false;
		this.noFsEvents = options.noFsEvents || false;
		this.events = options.eventEmitter || new EventBus(this.debug);

		// Initialize invariant checker
		this.invariants = new InvariantChecker(this.debug);

		// Initialize filesystem with persistence
		this.fs = new FileSystem({ debug: this.debug });

		// Initialize standard file descriptors (for stdin, stdout, stderr)
		this.initializeStandardFileDescriptors();

		// Initialize message queues
		this.initializeMessageQueues();

		if (this.debug) {
			this.log('Kernel initialized with persistent filesystem');
			// Run initial system invariant checks
			this.checkSystemInvariants();
		}
	}

	/**
	 * Initialize standard file descriptors (stdin, stdout, stderr)
	 */
	private initializeStandardFileDescriptors(): void {
		// stdin (fd 0)
		this.fileDescriptors.set(0, {
			fd: 0,
			path: '/v_dev/stdin',
			mode: OpenMode.READ,
			openedAt: Date.now()
		});

		// stdout (fd 1)
		this.fileDescriptors.set(1, {
			fd: 1,
			path: '/v_dev/stdout',
			mode: OpenMode.WRITE,
			openedAt: Date.now()
		});

		// stderr (fd 2)
		this.fileDescriptors.set(2, {
			fd: 2,
			path: '/v_dev/stderr',
			mode: OpenMode.WRITE,
			openedAt: Date.now()
		});
	}

	/**
	 * Initialize standard message queues
	 */
	private initializeMessageQueues(): void {
		// Create standard message queues
		this.createMessageQueue(QUEUE_PATHS.SYSTEM, { debug: this.debug });
		this.createMessageQueue(QUEUE_PATHS.GAME_EVENTS, { debug: this.debug });
		this.createMessageQueue(QUEUE_PATHS.ENTITY_EVENTS, { debug: this.debug });
		this.createMessageQueue(QUEUE_PATHS.FEATURE_EVENTS, { debug: this.debug });

		this.log('Message queues initialized');
	}

	//=============================================================================
	// Filesystem Operations (Unix system calls)
	//=============================================================================

	/**
	 * Create a directory (like mkdir -p)
	 * @param path Directory path to create
	 * @param recursive Whether to create parent directories if they don't exist
	 * @returns Path result
	 */
	mkdir(path: string, recursive: boolean = true): PathResult {
		const result = this.fs.mkdir(path, recursive);

		// Only emit event if not disabled
		if (!this.noFsEvents && result.success) {
			this.events.emit('fs:mkdir', { path });
		}

		if (result.success) {
			this.log(`Created directory: ${path}`);
		} else {
			this.error(`Failed to create directory: ${path} - ${result.errorMessage}`);
		}

		return result;
	}

	/**
	 * Delete a file (like unlink)
	 * @param path Path to delete
	 * @returns Error code (0 for success)
	 */
	unlink(path: string): ErrorCode {
		const result = this.fs.unlink(path);

		// Only emit event if not disabled and successful
		if (!this.noFsEvents && result === ErrorCode.SUCCESS) {
			this.events.emit('fs:unlink', { path });
		}

		if (result === ErrorCode.SUCCESS) {
			this.log(`Unlinked file: ${path}`);
		} else {
			this.error(`Failed to unlink file: ${path} (${result})`);
		}

		return result;
	}

	/**
	 * Mount a device at a path (like mount)
	 * @param path Mount point path
	 * @param device Device to mount (capability)
	 * @param options Mount options
	 * @returns Path result
	 */
	mount(path: string, device: Capability, options: MountOptions = {}): PathResult {
		const context = { component: 'Kernel', operation: 'mount', path };

		// Invariant: Path must be valid for capabilities
		this.invariants.checkCapabilityPath(path, context);

		// Invariant: Check for mount point conflicts
		this.invariants.checkMountPointConflict(this.devicePaths.get(device.id), path, {
			...context,
			entity: device.id
		});

		// Store device path in map
		const devicePath = path;
		this.devicePaths.set(device.id, devicePath);

		// Mount the device in filesystem
		const result = this.fs.mount(path, device.id);

		// Only emit event if not disabled
		if (!this.noFsEvents && result.success) {
			this.events.emit('fs:mount', { path, device: device.id });
		}

		if (result.success) {
			this.log(`Mounted device ${device.id} at ${path}`);

			// Call device's onMount handler
			if (device.onMount) {
				device.onMount(this);
			}
		} else {
			this.error(`Failed to mount device: ${device.id} at ${path} - ${result.errorMessage}`);
		}

		return result;
	}

	/**
	 * Create a file (like creat)
	 * @param path File path
	 * @param data File data
	 * @param createParentDirs Whether to create parent directories if they don't exist
	 * @returns Path result
	 */
	async create(path: string, data: any, createParentDirs: boolean = true): Promise<PathResult> {
		const context = { component: 'Kernel', operation: 'create', path };

		// Invariant: Path must be absolute
		this.invariants.checkPath(path, context);

		// Invariant: Parent directory must exist (unless creating parent dirs)
		if (!createParentDirs) {
			this.invariants.check(
				UnixInvariants.parentExists(path, this.fs),
				`Parent directory does not exist for path: ${path}`,
				context
			);
		}

		const result = await this.fs.create(path, data, createParentDirs);

		// Only emit event if not disabled
		if (!this.noFsEvents && result.success) {
			this.events.emit('fs:create', { path });
		}

		if (result.success) {
			this.log(`Created file: ${path}`);
		} else {
			this.error(`Failed to create file: ${path} - ${result.errorMessage}`);
		}

		return result;
	}

	/**
	 * Check if a path exists (like access)
	 * @param path Path to check
	 * @returns Whether the path exists
	 */
	exists(path: string): boolean {
		return this.fs.exists(path);
	}

	/**
	 * Get file stats (like stat)
	 * @param path Path to stat
	 * @returns File stats if found, undefined otherwise
	 */
	stat(path: string): Stats | undefined {
		const fsStats = this.fs.stat(path);
		if (!fsStats) return undefined;

		// Convert FileSystem stats to kernel Stats
		return {
			isFile: fsStats.isFile,
			isDirectory: fsStats.isDirectory,
			isDevice: fsStats.isDevice,
			size: fsStats.size,
			createdAt: fsStats.birthtimeMs,
			modifiedAt: fsStats.mtimeMs,
			accessedAt: fsStats.atimeMs
		};
	}

	/**
	 * Open a file (like open)
	 * @param path Path to open
	 * @param mode Open mode
	 * @returns File descriptor number, or -1 if error
	 */
	open(path: string, mode: OpenMode = OpenMode.READ): number {
		const context = { component: 'Kernel', operation: 'open', path };

		// Invariant: Path must be absolute
		this.invariants.checkPath(path, context);

		if (!path.startsWith('/')) {
			this.error(`Invalid path: ${path}`);
			return -1;
		}

		// Check if the path exists
		if (!this.exists(path)) {
			this.error(`Path not found: ${path}`);
			return -1;
		}

		// Invariant: Check for file descriptor leak
		this.invariants.checkFileDescriptorLeak(this.fileDescriptors.size, this.maxOpenFds, context);

		// Create file descriptor
		const fd = this.nextFd++;
		const descriptor: FileDescriptor = {
			fd,
			path,
			mode,
			openedAt: Date.now()
		};

		this.fileDescriptors.set(fd, descriptor);
		this.events.emit('fs:open', { path, fd, mode });
		this.log(`Opened ${path} as fd ${fd}`);

		return fd;
	}

	/**
	 * Read from a file descriptor (like read)
	 * @param fd File descriptor to read from
	 * @returns [Error code, data] where error code is 0 for success
	 */
	read(fd: number): [ErrorCode, any] {
		const context = { component: 'Kernel', operation: 'read', fd };

		// Invariant: File descriptor must be valid
		this.invariants.checkFileDescriptor(fd, context);

		const descriptor = this.fileDescriptors.get(fd);
		if (!descriptor) {
			this.error(`Invalid file descriptor: ${fd}`);
			return [ErrorCode.EBADF, null];
		}

		// Invariant: Check read permission
		this.invariants.check(
			UnixInvariants.hasPermission(descriptor.mode, OpenMode.READ),
			`File descriptor ${fd} not opened for reading`,
			{ ...context, path: descriptor.path, mode: descriptor.mode }
		);

		// Check read permission
		if (descriptor.mode !== OpenMode.READ && descriptor.mode !== OpenMode.READ_WRITE) {
			this.error(`File not opened for reading: ${descriptor.path}`);
			return [ErrorCode.EACCES, null];
		}

		// Check if this is a device file
		const pathParts = descriptor.path.split('/');
		if (pathParts.length >= 3 && pathParts[1] === 'v_dev') {
			const deviceId = pathParts[2];
			const device = this.getCapability(deviceId);

			// If device exists and has read method, call it
			if (device && device.read) {
				try {
					const buffer = {};
					const result = device.read(fd, buffer);
					return [result, buffer];
				} catch (error) {
					this.error(`Error reading from device: ${descriptor.path}`, error);
					return [ErrorCode.EIO, null];
				}
			}
		}

		// Regular file or directory - use filesystem
		return this.fs.read(descriptor.path);
	}

	/**
	 * Write to a file descriptor (like write)
	 * @param fd File descriptor to write to
	 * @param buffer Data to write
	 * @returns 0 on success, error code on failure
	 */
	write(fd: number, buffer: any): number {
		const context = { component: 'Kernel', operation: 'write', fd };

		// Invariant: File descriptor must be valid
		this.invariants.checkFileDescriptor(fd, context);

		const descriptor = this.fileDescriptors.get(fd);
		if (!descriptor) {
			this.error(`Invalid file descriptor: ${fd}`);
			return ErrorCode.EBADF;
		}

		// Invariant: Check write permission
		this.invariants.check(
			UnixInvariants.hasPermission(descriptor.mode, OpenMode.WRITE),
			`File descriptor ${fd} not opened for writing`,
			{ ...context, path: descriptor.path, mode: descriptor.mode }
		);

		// Check write permission
		if (descriptor.mode !== OpenMode.WRITE && descriptor.mode !== OpenMode.READ_WRITE) {
			this.error(`File not opened for writing: ${descriptor.path}`);
			return ErrorCode.EACCES;
		}

		// Check for standard output/error
		if (fd === 1) {
			// stdout
			console.log(buffer);
			return ErrorCode.SUCCESS;
		} else if (fd === 2) {
			// stderr
			console.error(buffer);
			return ErrorCode.SUCCESS;
		}

		// Check if this is a device file
		const pathParts = descriptor.path.split('/');
		if (pathParts.length >= 3 && pathParts[1] === 'v_dev') {
			const deviceId = pathParts[2];
			const device = this.getCapability(deviceId);

			// If device exists and has write method, call it
			if (device && device.write) {
				try {
					return device.write(fd, buffer);
				} catch (error) {
					this.error(`Error writing to device: ${descriptor.path}`, error);
					return ErrorCode.EIO;
				}
			}
		}

		// Regular file - use filesystem
		return this.fs.write(descriptor.path, buffer);
	}

	/**
	 * Close a file descriptor (like close)
	 * @param fd File descriptor to close
	 * @returns 0 on success, error code on failure
	 */
	close(fd: number): number {
		const context = { component: 'Kernel', operation: 'close', fd };

		// Invariant: File descriptor must be valid
		this.invariants.checkFileDescriptor(fd, context);

		// Skip standard file descriptors
		if (fd <= 2) {
			return ErrorCode.SUCCESS;
		}

		// Invariant: FD must exist to be closed
		this.invariants.check(
			this.fileDescriptors.has(fd),
			`Attempting to close non-existent file descriptor: ${fd}`,
			context
		);

		const descriptor = this.fileDescriptors.get(fd);
		if (!descriptor) {
			this.error(`Invalid file descriptor: ${fd}`);
			return ErrorCode.EBADF;
		}

		this.fileDescriptors.delete(fd);
		this.events.emit('fs:close', { fd, path: descriptor.path });
		this.log(`Closed fd ${fd} (${descriptor.path})`);

		return ErrorCode.SUCCESS;
	}

	/**
	 * List directory contents (like readdir)
	 * @param path Directory path to list
	 * @returns [Error code, entries] tuple
	 */
	readdir(path: string): [ErrorCode, DirectoryEntry[]] {
		return this.fs.readdir(path);
	}

	/**
	 * Device control (like ioctl)
	 * @param fd File descriptor
	 * @param request Request code
	 * @param arg Argument
	 * @returns 0 on success, error code on failure
	 */
	ioctl(fd: number, request: number, arg: any): number {
		const descriptor = this.fileDescriptors.get(fd);
		if (!descriptor) {
			this.error(`Invalid file descriptor: ${fd}`);
			return ErrorCode.EBADF;
		}

		// Only works on device files
		const pathParts = descriptor.path.split('/');
		if (pathParts.length < 3 || pathParts[1] !== 'v_dev') {
			this.error(`Not a device file: ${descriptor.path}`);
			return ErrorCode.ENOTTY;
		}

		const deviceId = pathParts[2];
		const device = this.getCapability(deviceId);

		if (!device) {
			this.error(`Device not found: ${deviceId}`);
			return ErrorCode.ENODEV;
		}

		if (!device.ioctl) {
			this.error(`Device does not support ioctl: ${descriptor.path}`);
			return ErrorCode.ENOTTY;
		}

		try {
			return device.ioctl(fd, request, arg);
		} catch (error) {
			this.error(`Error in ioctl for device: ${descriptor.path}`, error);
			return ErrorCode.EIO;
		}
	}

	//=============================================================================
	// Entity Management (as files in /entity directory)
	//=============================================================================

	/**
	 * Register an entity with the kernel by creating a file
	 * @param entity Entity to register
	 * @returns Entity path
	 */
	registerEntity(entity: Entity): string {
		const path = `/v_entity/${entity.id}`;

		// Create entity file
		const result = this.create(path, entity);
		if (!result.success) {
			this.error(`Failed to register entity: ${entity.id}`);
			return '';
		}

		this.events.emit('entity:registered', { entityId: entity.id, path });
		return path;
	}

	/**
	 * Get an entity by ID (for direct kernel usage)
	 * External components should use open/read instead
	 * @param entityId Entity ID
	 * @returns Entity or undefined if not found
	 */
	getEntity(entityId: string): Entity | undefined {
		const path = `/v_entity/${entityId}`;
		const [errorCode, data] = this.fs.read(path);

		if (errorCode === ErrorCode.SUCCESS) {
			return data as Entity;
		}

		return undefined;
	}

	/**
	 * Get all entity IDs
	 * @returns Array of entity IDs
	 */
	getEntityIds(): string[] {
		const [errorCode, entries] = this.fs.readdir('/v_entity');

		if (errorCode !== ErrorCode.SUCCESS) {
			return [];
		}

		return entries.filter((entry) => entry.type === FileType.FILE).map((entry) => entry.name);
	}

	/**
	 * Remove an entity by deleting its file
	 * @param entityId Entity ID
	 * @returns Whether removal was successful
	 */
	removeEntity(entityId: string): boolean {
		const path = `/v_entity/${entityId}`;

		// Check if any file descriptors are open for this entity
		for (const descriptor of this.fileDescriptors.values()) {
			if (descriptor.path === path) {
				this.error(`Cannot remove entity ${entityId} while it has open file descriptors`);
				return false;
			}
		}

		// Remove entity file
		const result = this.unlink(path);
		const success = result === ErrorCode.SUCCESS;

		if (success) {
			this.events.emit('entity:removed', { entityId, path });
			this.log(`Removed entity: ${entityId}`);
		}

		return success;
	}

	//=============================================================================
	// Device Management (as files in /dev directory)
	//=============================================================================

	/**
	 * Register a capability as a device
	 * @param id Capability ID
	 * @param capability Capability implementation
	 */
	registerCapability(id: string, capability: Capability): void {
		const devicePath = `/v_dev/${id}`;

		// Mount the device
		const result = this.mount(devicePath, capability);
		if (!result.success) {
			this.error(`Failed to register capability: ${id}`);
			return;
		}

		this.events.emit('capability:registered', { id, path: devicePath });
		this.log(`Registered capability: ${id} at ${devicePath}`);
	}

	/**
	 * Get a capability by ID
	 * @param id Capability ID
	 * @returns Capability or undefined if not found
	 */
	getCapability<T extends Capability>(id: string): T | undefined {
		// Get the device path from map
		const devicePath = this.devicePaths.get(id);
		if (!devicePath) return undefined;

		// For now, capabilities are stored in memory during mounting
		// In a more complete implementation, we'd need to store/retrieve them
		// from somewhere more permanent
		return null as unknown as T;
	}

	/**
	 * Get all capability IDs
	 * @returns Array of capability IDs
	 */
	getCapabilityIds(): string[] {
		const mountPoints = this.fs.getMountPoints();
		const deviceIds: string[] = [];

		for (const [path, deviceId] of mountPoints.entries()) {
			if (path.startsWith('/v_dev/')) {
				deviceIds.push(deviceId);
			}
		}

		return deviceIds;
	}

	//=============================================================================
	// Plugin Management (as files in /bin directory)
	//=============================================================================

	/**
	 * Register a plugin with the kernel by creating a file in /bin
	 * @param plugin Plugin to register
	 */
	registerPlugin(plugin: Plugin): void {
		// Path to plugin executable in /bin
		const execPath = `${PLUGIN_PATHS.BIN}/${plugin.id}`;

		// Path to plugin metadata in /proc/plugins
		const procPath = `${PLUGIN_PATHS.PROC_PLUGINS}/${plugin.id}`;

		// Create metadata
		const metadata = {
			id: plugin.id,
			name: plugin.name || 'Unnamed Plugin',
			description: plugin.description || '',
			requiredDevices: plugin.requiredDevices || [],
			version: (plugin as any).version || '1.0.0',
			author: (plugin as any).author || 'Unknown',
			registeredAt: new Date().toISOString()
		};

		// Store plugin metadata in /proc/plugins
		const procResult = this.create(procPath, metadata);
		if (!procResult.success) {
			this.error(`Failed to create plugin metadata file: ${procPath}`);
			return;
		}

		// Store the plugin itself
		const result = this.create(execPath, plugin);
		if (!result.success) {
			this.error(`Failed to create plugin executable file: ${execPath}`);
			this.unlink(procPath); // Clean up metadata if exec creation fails
			return;
		}

		this.events.emit('plugin:registered', { id: plugin.id, path: execPath });
		this.log(`Registered plugin: ${plugin.id} at ${execPath}`);
	}

	/**
	 * Get a plugin by ID using filesystem
	 * @param id Plugin ID
	 * @returns Plugin or undefined if not found
	 */
	getPlugin(id: string): Plugin | undefined {
		// Path to plugin executable
		const execPath = `${PLUGIN_PATHS.BIN}/${id}`;

		// Get plugin from filesystem
		const [errorCode, data] = this.fs.read(execPath);

		if (errorCode === ErrorCode.SUCCESS) {
			return data as Plugin;
		}

		return undefined;
	}

	/**
	 * List all plugins in the /bin directory
	 * @returns Array of plugin IDs
	 */
	listPlugins(): string[] {
		const [errorCode, entries] = this.fs.readdir(PLUGIN_PATHS.BIN);

		if (errorCode !== ErrorCode.SUCCESS) {
			return [];
		}

		return entries.filter((entry) => entry.type === FileType.FILE).map((entry) => entry.name);
	}

	/**
	 * Execute a plugin (like running a process)
	 * @param pluginId Plugin ID
	 * @param entityId Entity ID
	 * @param options Plugin options
	 * @returns Result of execution
	 */
	async executePlugin<T>(
		pluginId: string,
		entityId: string,
		options: Record<string, any> = {}
	): Promise<T> {
		// Path to plugin executable
		const execPath = `${PLUGIN_PATHS.BIN}/${pluginId}`;

		// Check if plugin exists
		if (!this.exists(execPath)) {
			const error = `Plugin not found: ${pluginId}`;
			this.error(error);
			this.events.emit('plugin:execution_failed', {
				pluginId,
				entityId,
				error
			});
			throw new Error(error);
		}

		// Get plugin from filesystem
		const [errorCode, plugin] = this.fs.read(execPath);

		if (errorCode !== ErrorCode.SUCCESS || !plugin) {
			const error = `Invalid plugin: ${pluginId}`;
			this.error(error);
			this.events.emit('plugin:execution_failed', {
				pluginId,
				entityId,
				error
			});
			throw new Error(error);
		}

		const entityPath = `/v_entity/${entityId}`;

		// Check if entity exists
		if (!this.exists(entityPath)) {
			const error = `Entity not found: ${entityId}`;
			this.error(error);
			this.events.emit('plugin:execution_failed', {
				pluginId,
				entityId,
				error
			});
			throw new Error(error);
		}

		try {
			this.log(`Executing plugin: ${pluginId} for entity: ${entityId}`);

			// Execute the plugin
			const exitCode = await plugin.execute(this, entityPath, options);

			if (exitCode !== 0) {
				const error = `Plugin exited with code: ${exitCode}`;
				this.error(error);
				this.events.emit('plugin:execution_failed', {
					pluginId,
					entityId,
					error
				});
				throw new Error(error);
			}

			// Get updated entity data for result
			const entityData = this.getEntity(entityId);

			// Emit success event
			this.events.emit('plugin:executed', {
				pluginId,
				entityId,
				success: true,
				timestamp: new Date().toISOString()
			});

			this.log(`Successfully executed plugin: ${pluginId} for entity: ${entityId}`);
			return entityData as T;
		} catch (error) {
			// Log error and emit failure event
			this.error(`Error executing plugin ${pluginId} for entity ${entityId}:`, error);
			this.events.emit('plugin:execution_failed', {
				pluginId,
				entityId,
				error: error instanceof Error ? error.message : String(error),
				timestamp: new Date().toISOString()
			});

			// Rethrow
			throw error;
		}
	}

	//=============================================================================
	// Signal System (Unix-like signal handling)
	//=============================================================================

	/**
	 * Register a signal handler for a plugin
	 * @param pluginId Plugin ID
	 * @param handler Signal handler function
	 */
	registerSignalHandler(
		pluginId: string,
		handler: (signal: number, source: string, data?: any) => void
	): void {
		// Create signal file in /proc/signals
		const signalPath = `${PLUGIN_PATHS.PROC_SIGNALS}/${pluginId}`;

		// Store empty metadata for the signal handler
		this.create(signalPath, {
			pluginId,
			registered: new Date().toISOString()
		});

		// Register the handler
		this.signalHandlers.set(pluginId, handler);
		this.log(`Registered signal handler for plugin: ${pluginId}`);
	}

	/**
	 * Unregister a signal handler for a plugin
	 * @param pluginId Plugin ID
	 */
	unregisterSignalHandler(pluginId: string): void {
		// Remove signal handler
		this.signalHandlers.delete(pluginId);

		// Remove signal file
		const signalPath = `${PLUGIN_PATHS.PROC_SIGNALS}/${pluginId}`;
		this.unlink(signalPath);

		this.log(`Unregistered signal handler for plugin: ${pluginId}`);
	}

	/**
	 * Send a signal to a plugin
	 * @param targetPluginId Target plugin ID
	 * @param signal Signal number
	 * @param sourcePluginId Source plugin ID
	 * @param data Optional signal data
	 * @returns Whether the signal was delivered
	 */
	sendSignal(targetPluginId: string, signal: number, sourcePluginId: string, data?: any): boolean {
		// Check if target plugin has a signal handler
		const handler = this.signalHandlers.get(targetPluginId);
		if (!handler) {
			this.log(`No signal handler registered for plugin: ${targetPluginId}`);
			return false;
		}

		try {
			// Call the signal handler
			handler(signal, sourcePluginId, data);

			// Emit event for signal delivery
			this.events.emit('plugin:signal', {
				target: targetPluginId,
				source: sourcePluginId,
				signal,
				timestamp: new Date().toISOString()
			});

			this.log(`Sent signal ${signal} to plugin ${targetPluginId} from ${sourcePluginId}`);
			return true;
		} catch (error) {
			this.error(`Error delivering signal ${signal} to plugin ${targetPluginId}:`, error);
			return false;
		}
	}

	/**
	 * Broadcast a signal to all plugins with registered handlers
	 * @param signal Signal number
	 * @param sourcePluginId Source plugin ID
	 * @param data Optional signal data
	 * @returns Number of plugins that received the signal
	 */
	broadcastSignal(signal: number, sourcePluginId: string, data?: any): number {
		let count = 0;

		// Send to all registered handlers
		for (const targetPluginId of this.signalHandlers.keys()) {
			// Skip sending to self
			if (targetPluginId === sourcePluginId) {
				continue;
			}

			// Send signal
			const delivered = this.sendSignal(targetPluginId, signal, sourcePluginId, data);
			if (delivered) {
				count++;
			}
		}

		this.log(`Broadcast signal ${signal} from ${sourcePluginId} to ${count} plugins`);
		return count;
	}

	//=============================================================================
	// Message Queue Operations (Unix IPC)
	//=============================================================================

	/**
	 * Create a message queue (named pipe)
	 * @param path Path for the message queue
	 * @param attributes Optional queue attributes
	 * @returns Path result
	 */
	createMessageQueue(path: string, attributes: Partial<MessageQueueAttributes> = {}): PathResult {
		if (!path.startsWith('/')) {
			return {
				success: false,
				errorCode: ErrorCode.EINVAL,
				errorMessage: 'Path must be absolute',
				path
			};
		}

		// Check if path already exists
		if (this.messageQueues.has(path)) {
			return {
				success: false,
				errorCode: ErrorCode.EEXIST,
				errorMessage: 'Message queue already exists',
				path
			};
		}

		// Create parent directories if needed
		const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
		if (!this.exists(parentPath)) {
			const mkdirResult = this.mkdir(parentPath);
			if (!mkdirResult.success) {
				return mkdirResult;
			}
		}

		// Create the queue
		const queue = new MessageQueue(path, { ...attributes, debug: this.debug });
		this.messageQueues.set(path, queue);

		// Create a metadata file entry
		this.create(path, { type: 'message_queue', created: Date.now() });

		this.log(`Created message queue: ${path}`);
		this.events.emit('mq:created', { path });

		return { success: true, path };
	}

	/**
	 * Send a message to a queue
	 * @param queuePath Path to the queue
	 * @param type Message type
	 * @param payload Message payload
	 * @param options Message options
	 * @returns Message ID if sent, null if failed
	 */
	sendMessage(
		queuePath: string,
		type: string,
		payload: any,
		options: {
			priority?: MessagePriority;
			source?: string;
			target?: string;
			ttl?: number;
		} = {}
	): string | null {
		const queue = this.messageQueues.get(queuePath);
		if (!queue) {
			this.error(`Message queue not found: ${queuePath}`);
			return null;
		}

		const messageId = queue.enqueue(type, payload, options);
		if (messageId) {
			this.events.emit('mq:message_sent', {
				queue: queuePath,
				messageId,
				type
			});
		}

		return messageId;
	}

	/**
	 * Receive a message from a queue
	 * @param queuePath Path to the queue
	 * @param selector Optional message selector
	 * @returns Message or null if none available
	 */
	receiveMessage(queuePath: string, selector?: MessageSelector): Message | null {
		const queue = this.messageQueues.get(queuePath);
		if (!queue) {
			this.error(`Message queue not found: ${queuePath}`);
			return null;
		}

		const message = queue.dequeue(selector);
		if (message) {
			this.events.emit('mq:message_received', {
				queue: queuePath,
				messageId: message.id,
				type: message.type
			});
		}

		return message;
	}

	/**
	 * Wait for a message from a queue
	 * @param queuePath Path to the queue
	 * @param selector Optional message selector
	 * @param timeout Optional timeout in milliseconds
	 * @returns Promise that resolves with the message
	 */
	async waitForMessage(
		queuePath: string,
		selector?: MessageSelector,
		timeout: number = 0
	): Promise<Message> {
		const queue = this.messageQueues.get(queuePath);
		if (!queue) {
			throw new Error(`Message queue not found: ${queuePath}`);
		}

		const message = await queue.waitForMessage(selector, timeout);

		this.events.emit('mq:message_received', {
			queue: queuePath,
			messageId: message.id,
			type: message.type
		});

		return message;
	}

	/**
	 * Browse messages in a queue without removing them
	 * @param queuePath Path to the queue
	 * @param selector Optional message selector
	 * @returns Array of messages
	 */
	browseMessages(queuePath: string, selector?: MessageSelector): Message[] {
		const queue = this.messageQueues.get(queuePath);
		if (!queue) {
			this.error(`Message queue not found: ${queuePath}`);
			return [];
		}

		return queue.browse(selector);
	}

	/**
	 * Get a message queue by path
	 * @param queuePath Path to the queue
	 * @returns The message queue or undefined if not found
	 */
	getMessageQueue(queuePath: string): MessageQueue | undefined {
		return this.messageQueues.get(queuePath);
	}

	/**
	 * Delete a message queue
	 * @param queuePath Path to the queue
	 * @returns Whether deletion was successful
	 */
	deleteMessageQueue(queuePath: string): boolean {
		const queue = this.messageQueues.get(queuePath);
		if (!queue) {
			return false;
		}

		// Clear and remove the queue
		queue.clear();
		this.messageQueues.delete(queuePath);

		// Remove the queue file
		this.unlink(queuePath);

		this.log(`Deleted message queue: ${queuePath}`);
		this.events.emit('mq:deleted', { path: queuePath });

		return true;
	}

	/**
	 * Check system-wide invariants
	 * Called periodically in debug mode
	 */
	private checkSystemInvariants(): void {
		if (!this.debug) return;

		const context = { component: 'Kernel', operation: 'checkSystemInvariants' };

		// Check for file descriptor leaks
		this.invariants.checkFileDescriptorLeak(this.fileDescriptors.size, this.maxOpenFds, context);

		// Check that all open FDs point to existing paths
		for (const [fd, descriptor] of this.fileDescriptors) {
			if (fd > 2) {
				// Skip standard descriptors
				this.invariants.check(
					this.exists(descriptor.path) || descriptor.path.startsWith('/v_dev/'),
					`File descriptor ${fd} points to non-existent path: ${descriptor.path}`,
					{ ...context, fd, path: descriptor.path }
				);
			}
		}

		// Check filesystem consistency
		const rootStats = this.fs.stat('/');
		this.invariants.check(
			rootStats !== undefined && rootStats.isDirectory,
			'Root directory / must exist and be a directory',
			context
		);

		// Check standard directories exist
		const standardDirs = ['/v_dev', '/v_proc', '/v_entity', '/v_etc', '/v_var', '/v_tmp', '/v_bin'];
		for (const dir of standardDirs) {
			const stats = this.fs.stat(dir);
			this.invariants.check(
				stats !== undefined && stats.isDirectory,
				`Standard directory ${dir} must exist`,
				{ ...context, path: dir }
			);
		}

		// Check mount points consistency
		for (const [deviceId, mountPath] of this.devicePaths) {
			this.invariants.check(
				this.exists(mountPath),
				`Mount point ${mountPath} for device ${deviceId} does not exist`,
				{ ...context, path: mountPath, entity: deviceId }
			);
		}

		// Check message queue consistency
		for (const [queuePath, queue] of this.messageQueues) {
			this.invariants.check(
				this.exists(queuePath),
				`Message queue path ${queuePath} does not exist in filesystem`,
				{ ...context, path: queuePath }
			);
		}

		// Report violations if any
		if (this.invariants.hasViolations()) {
			const violations = this.invariants.getViolations();
			this.error(`System invariant check found ${violations.length} violations`);
			if (this.debug) {
				violations.forEach((v) => {
					console.error(`  - ${v.message}`, v.context);
				});
			}
		}
	}

	/**
	 * Shut down the kernel gracefully
	 */
	async shutdown(): Promise<void> {
		this.log('Shutting down kernel');

		try {
			// Close all open file descriptors
			const openFds = Array.from(this.fileDescriptors.keys());
			this.log(`Closing ${openFds.length} open file descriptors`);
			for (const fd of openFds) {
				if (fd > 2) {
					// Skip standard descriptors
					this.close(fd);
				}
			}

			// Call shutdown on all capabilities (devices)
			const deviceIds = this.getCapabilityIds();
			this.log(`Shutting down ${deviceIds.length} devices`);
			for (const id of deviceIds) {
				const capability = this.getCapability(id);
				if (capability?.shutdown) {
					try {
						await capability.shutdown();
						this.log(`Device ${id} shut down`);
					} catch (error) {
						this.error(`Error shutting down device ${id}:`, error);
					}
				}
			}

			// Close all message queues
			const queuePaths = Array.from(this.messageQueues.keys());
			this.log(`Closing ${queuePaths.length} message queues`);
			for (const path of queuePaths) {
				const queue = this.messageQueues.get(path);
				if (queue) {
					queue.clear();
				}
			}
			this.messageQueues.clear();

			// Unregister all signal handlers
			this.signalHandlers.clear();

			// Unmount filesystem
			await this.fs.unmount();

			// Clear event listeners
			this.events.removeAllListeners();

			// Final invariant check
			if (this.debug) {
				this.log('Running final system invariant checks');
				this.checkSystemInvariants();
			}

			this.log('Kernel shutdown complete');
		} catch (error) {
			this.error('Error during kernel shutdown:', error);
			throw error;
		}
	}

	/**
	 * Log a debug message
	 * @param message Message to log
	 * @param data Optional data to log
	 */
	private log(message: string, data?: any): void {
		if (this.debug) {
			if (data !== undefined) {
				console.log(`[Kernel] ${message}`, data);
			} else {
				console.log(`[Kernel] ${message}`);
			}
		}
	}

	/**
	 * Log an error message
	 * @param message Error message
	 * @param error Optional error object
	 */
	private error(message: string, error?: any): void {
		console.error(`[Kernel-ERROR] ${message}`);
		if (error) {
			console.error(error);
		}
	}
}
