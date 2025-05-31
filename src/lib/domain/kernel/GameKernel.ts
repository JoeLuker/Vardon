import type {
	Entity,
	Capability,
	Plugin,
	EventEmitter,
	KernelOptions,
	FileDescriptor,
	Inode,
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
import { PipeEventSystem } from './PipeEventSystem';
import { EventBus } from './EventBus';

// Plugin filesystem paths
const PLUGIN_PATHS = {
	/** Base path for plugin executables */
	BIN: '/bin',

	/** Base path for plugin process information */
	PROC_PLUGINS: '/proc/plugins',

	/** Base path for plugin configuration */
	ETC_PLUGINS: '/etc/plugins',

	/** Base path for plugin signals */
	PROC_SIGNALS: '/proc/signals'
};

// Message queue paths
const QUEUE_PATHS = {
	/** Base path for named pipes / message queues */
	PIPES: '/pipes',

	/** System message queue for kernel events */
	SYSTEM: '/pipes/system',

	/** Game events message queue */
	GAME_EVENTS: '/pipes/game_events',

	/** Entity events message queue */
	ENTITY_EVENTS: '/pipes/entity_events',

	/** Feature events message queue */
	FEATURE_EVENTS: '/pipes/feature_events'
};

/**
 * GameKernel is the core of the system, implementing a Unix-like kernel:
 * - Filesystem with files, directories, and devices
 * - Process management (plugins)
 * - System call interface (open, read, write, close)
 * - Mount points for devices (capabilities)
 */
export class GameKernel {
	// Filesystem components
	private readonly inodes: Map<string, Inode> = new Map();
	private readonly directories: Set<string> = new Set();
	private readonly mountPoints: Map<string, Capability> = new Map();

	// File descriptor management (like Unix FD table)
	private readonly fileDescriptors: Map<number, FileDescriptor> = new Map();
	private nextFd: number = 3; // 0=stdin, 1=stdout, 2=stderr

	// Configuration
	private readonly debug: boolean;
	private readonly noFsEvents: boolean;

	// Event system (like signals in Unix)
	public readonly events: EventEmitter;

	// Map of mounted devices (initialized as empty Map to prevent undefined errors)
	public devices: Map<string, Capability> = new Map();

	// Signal handlers for inter-plugin communication
	private readonly signalHandlers: Map<
		string,
		(signal: number, source: string, data?: any) => void
	> = new Map();

	// Message queues (named pipes)
	private readonly messageQueues: Map<string, MessageQueue> = new Map();

	// Unix standard directory paths
	public static readonly PATHS = {
		DEV: '/dev', // Device files
		PROC: '/proc', // Process information
		PROC_CHARACTER: '/proc/character', // Character processes
		ENTITY: '/entity', // Entity files
		ETC: '/etc', // Configuration
		VAR: '/var', // Variable data
		TMP: '/tmp', // Temporary files
		BIN: '/bin', // Executable plugins
		HOME: '/home' // User home directories
	};

	constructor(options: KernelOptions = {}) {
		this.debug = options.debug || false;
		this.noFsEvents = options.noFsEvents || false;
		this.events = options.eventEmitter || new EventBus(this.debug);

		// Initialize filesystem
		this.initializeFilesystem();

		// Initialize message queues
		this.initializeMessageQueues();

		if (this.debug) {
			this.log('Kernel initialized');
		}
	}

	/**
	 * Initialize the filesystem structure
	 * Creates all standard directories in a Unix-like hierarchy
	 */
	private initializeFilesystem(): void {
		// Create root directory
		this.directories.add('/');

		// Create standard top-level directories (like a Unix filesystem)
		this.mkdir(GameKernel.PATHS.DEV); // Device files
		this.mkdir(GameKernel.PATHS.PROC); // Process information
		this.mkdir(GameKernel.PATHS.ENTITY); // Entity files
		this.mkdir(GameKernel.PATHS.ETC); // Configuration
		this.mkdir(GameKernel.PATHS.BIN); // Executable plugins
		this.mkdir(GameKernel.PATHS.VAR); // Variable data
		this.mkdir(GameKernel.PATHS.TMP); // Temporary files
		this.mkdir(GameKernel.PATHS.HOME); // User home directories

		// Create standard subdirectories
		this.mkdir(GameKernel.PATHS.PROC_CHARACTER); // Character processes
		this.mkdir(PLUGIN_PATHS.PROC_PLUGINS); // Plugin process information
		this.mkdir(PLUGIN_PATHS.PROC_SIGNALS); // Plugin signals
		this.mkdir(PLUGIN_PATHS.ETC_PLUGINS); // Plugin configuration
		this.mkdir(`${GameKernel.PATHS.VAR}/log`); // Log files
		this.mkdir(`${GameKernel.PATHS.VAR}/run`); // Runtime data

		// Create message queue directory
		this.mkdir(QUEUE_PATHS.PIPES); // Named pipes directory

		// Create device-specific directories
		this.mkdir('/dev/ability'); // Ability device directory
		this.mkdir('/dev/skill'); // Skill device directory
		this.mkdir('/dev/combat'); // Combat device directory
		this.mkdir('/dev/condition'); // Condition device directory
		this.mkdir('/dev/bonus'); // Bonus device directory
		this.mkdir('/dev/character'); // Character device directory

		// Create app-specific directories
		this.mkdir('/sys'); // System directory
		this.mkdir('/sys/class'); // Class definitions
		this.mkdir('/sys/devices'); // Device specifications

		this.log('Filesystem initialized');
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
		if (!path.startsWith('/')) {
			return {
				success: false,
				errorCode: ErrorCode.EINVAL,
				errorMessage: 'Path must be absolute',
				path
			};
		}

		// If directory already exists, silently return success
		if (this.directories.has(path)) {
			return {
				success: true,
				path
			};
		}

		// Check if parent directory exists
		const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';

		if (!this.directories.has(parentPath)) {
			// If not recursive, return error
			if (!recursive) {
				return {
					success: false,
					errorCode: ErrorCode.ENOENT,
					errorMessage: `Parent directory does not exist: ${parentPath}`,
					path
				};
			}

			// Otherwise create parent directories recursively
			const parentResult = this.mkdir(parentPath, true);
			if (!parentResult.success) {
				return parentResult;
			}
		}

		// Create directory
		this.directories.add(path);

		// Only emit event if not disabled
		if (!this.noFsEvents) {
			this.events.emit('fs:mkdir', { path });
		}

		this.log(`Created directory: ${path}`);

		return { success: true, path };
	}

	/**
	 * Delete a file (like unlink)
	 * @param path Path to delete
	 * @returns Error code (0 for success)
	 */
	unlink(path: string): ErrorCode {
		if (!path.startsWith('/')) {
			return ErrorCode.EINVAL;
		}

		// Check if file exists
		if (!this.inodes.has(path)) {
			return ErrorCode.ENOENT;
		}

		// Check if any file descriptors are open for this file
		for (const descriptor of this.fileDescriptors.values()) {
			if (descriptor.path === path) {
				this.error(`Cannot unlink file ${path} while it has open file descriptors`);
				return ErrorCode.EBUSY;
			}
		}

		// Remove file
		this.inodes.delete(path);

		// Only emit event if not disabled
		if (!this.noFsEvents) {
			this.events.emit('fs:unlink', { path });
		}

		this.log(`Unlinked file: ${path}`);

		return ErrorCode.SUCCESS;
	}

	/**
	 * Mount a device at a path (like mount)
	 * @param path Mount point path
	 * @param device Device to mount (capability)
	 * @param options Mount options
	 * @returns Path result
	 */
	mount(path: string, device: Capability, options: MountOptions = {}): PathResult {
		if (!path.startsWith('/')) {
			return {
				success: false,
				errorCode: ErrorCode.EINVAL,
				errorMessage: 'Path must be absolute',
				path
			};
		}

		// Create parent directories if needed
		const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
		if (!this.directories.has(parentPath)) {
			const mkdirResult = this.mkdir(parentPath);
			if (!mkdirResult.success) {
				return mkdirResult;
			}
		}

		// Mount the device in both mountPoints and devices maps
		this.mountPoints.set(path, device);

		// Ensure devices map exists and populate it
		if (!this.devices) {
			this.devices = new Map();
		}

		// Store in the devices map - extracting the device name from the path
		const deviceName = path.startsWith('/dev/') ? path : path.split('/').pop() || path;
		this.devices.set(deviceName, device);

		this.log(`Mounted device ${device.id} at ${path}, device name: ${deviceName}`);

		// Only emit event if not disabled
		if (!this.noFsEvents) {
			this.events.emit('fs:mount', { path, device: device.id });
		}

		// Call device's onMount handler
		if (device.onMount) {
			device.onMount(this);
		}

		return { success: true, path };
	}

	/**
	 * Create a file (like creat)
	 * @param path File path
	 * @param data File data
	 * @param createParentDirs Whether to create parent directories if they don't exist
	 * @returns Path result
	 */
	create(path: string, data: any, createParentDirs: boolean = true): PathResult {
		if (!path.startsWith('/')) {
			return {
				success: false,
				errorCode: ErrorCode.EINVAL,
				errorMessage: 'Path must be absolute',
				path
			};
		}

		this.log(`Creating file at ${path} (createParentDirs=${createParentDirs})`);

		if (this.inodes.has(path)) {
			// If file exists and it's a directory, we'll remove it
			const stats = this.stat(path);
			if (stats?.isDirectory) {
				this.log(`Found directory at ${path} where a file should be. Removing.`);
				const unlinkResult = this.unlink(path);
				if (unlinkResult !== 0) {
					return {
						success: false,
						errorCode: unlinkResult,
						errorMessage: `Found a directory at ${path} but failed to remove it`,
						path
					};
				}
			} else {
				// It's a file that already exists
				return {
					success: false,
					errorCode: ErrorCode.EEXIST,
					errorMessage: 'File already exists',
					path
				};
			}
		}

		// Check parent directory exists
		const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
		if (!this.directories.has(parentPath)) {
			if (!createParentDirs) {
				return {
					success: false,
					errorCode: ErrorCode.ENOENT,
					errorMessage: `Parent directory does not exist: ${parentPath}`,
					path
				};
			}

			this.log(`Parent directory ${parentPath} doesn't exist, creating it`);

			// Create parent directories recursively
			const mkdirResult = this.mkdir(parentPath, true);
			if (!mkdirResult.success) {
				return {
					success: false,
					errorCode: ErrorCode.ENOENT,
					errorMessage: `Failed to create parent directory: ${mkdirResult.errorMessage}`,
					path
				};
			}
		}

		// Create inode
		const inode: Inode = {
			path,
			data,
			createdAt: Date.now(),
			modifiedAt: Date.now()
		};

		this.inodes.set(path, inode);

		// Only emit event if not disabled
		if (!this.noFsEvents) {
			this.events.emit('fs:create', { path });
		}

		this.log(`Created file: ${path}`);

		return { success: true, path };
	}

	/**
	 * Check if a path exists (like access)
	 * @param path Path to check
	 * @returns Whether the path exists
	 */
	exists(path: string): boolean {
		return this.inodes.has(path) || this.directories.has(path) || this.mountPoints.has(path);
	}

	/**
	 * Get file stats (like stat)
	 * @param path Path to stat
	 * @returns File stats if found, undefined otherwise
	 */
	stat(path: string): Stats | undefined {
		// Directory
		if (this.directories.has(path)) {
			return {
				isFile: false,
				isDirectory: true,
				isDevice: false,
				size: 0,
				createdAt: 0,
				modifiedAt: 0,
				accessedAt: 0
			};
		}

		// Mount point (device)
		if (this.mountPoints.has(path)) {
			return {
				isFile: false,
				isDirectory: false,
				isDevice: true,
				size: 0,
				createdAt: 0,
				modifiedAt: 0,
				accessedAt: 0
			};
		}

		// Regular file
		const inode = this.inodes.get(path);
		if (inode) {
			return {
				isFile: true,
				isDirectory: false,
				isDevice: false,
				size: JSON.stringify(inode.data).length,
				createdAt: inode.createdAt,
				modifiedAt: inode.modifiedAt,
				accessedAt: Date.now()
			};
		}

		return undefined;
	}

	/**
	 * Open a file (like open)
	 * @param path Path to open
	 * @param mode Open mode
	 * @returns File descriptor number, or -1 if error
	 */
	open(path: string, mode: OpenMode = OpenMode.READ): number {
		if (!path.startsWith('/')) {
			this.error(`Invalid path: ${path}`);
			return -1;
		}

		// Check if the path exists
		if (!this.exists(path)) {
			this.error(`Path not found: ${path}`);
			return -1;
		}

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
		const descriptor = this.fileDescriptors.get(fd);
		if (!descriptor) {
			this.error(`Invalid file descriptor: ${fd}`);
			return [ErrorCode.EBADF, null];
		}

		// Check read permission
		if (descriptor.mode !== OpenMode.READ && descriptor.mode !== OpenMode.READ_WRITE) {
			this.error(`File not opened for reading: ${descriptor.path}`);
			return [ErrorCode.EACCES, null];
		}

		// Device file
		const device = this.mountPoints.get(descriptor.path);
		if (device) {
			if (!device.read) {
				this.error(`Device does not support reading: ${descriptor.path}`);
				return [ErrorCode.EINVAL, null];
			}

			try {
				const buffer = {};
				const result = device.read(fd, buffer);
				return [result, buffer];
			} catch (error) {
				this.error(`Error reading from device: ${descriptor.path}`, error);
				return [ErrorCode.EIO, null];
			}
		}

		// Regular file
		const inode = this.inodes.get(descriptor.path);
		if (inode) {
			try {
				// Return a deep copy of the data to prevent modification
				return [ErrorCode.SUCCESS, JSON.parse(JSON.stringify(inode.data))];
			} catch (error) {
				this.error(`Error reading from file: ${descriptor.path}`, error);
				return [ErrorCode.EIO, null];
			}
		}

		// Directory
		if (this.directories.has(descriptor.path)) {
			this.error(`Cannot read from directory: ${descriptor.path}`);
			return [ErrorCode.EISDIR, null];
		}

		this.error(`Path not found: ${descriptor.path}`);
		return [ErrorCode.ENOENT, null];
	}

	/**
	 * Write to a file descriptor (like write)
	 * @param fd File descriptor to write to
	 * @param buffer Data to write
	 * @returns 0 on success, error code on failure
	 */
	write(fd: number, buffer: any): number {
		const descriptor = this.fileDescriptors.get(fd);
		if (!descriptor) {
			this.error(`Invalid file descriptor: ${fd}`);
			return ErrorCode.EBADF;
		}

		// Check write permission
		if (descriptor.mode !== OpenMode.WRITE && descriptor.mode !== OpenMode.READ_WRITE) {
			this.error(`File not opened for writing: ${descriptor.path}`);
			return ErrorCode.EACCES;
		}

		// Device file
		const device = this.mountPoints.get(descriptor.path);
		if (device) {
			if (!device.write) {
				this.error(`Device does not support writing: ${descriptor.path}`);
				return ErrorCode.EINVAL;
			}

			try {
				const result = device.write(fd, buffer);

				// If device write returns a Promise, return success for now
				// For proper async handling, use writeAsync instead
				if (result instanceof Promise) {
					this.log(
						`Device ${descriptor.path} returned a Promise, consider using writeAsync() instead`
					);
					return ErrorCode.SUCCESS;
				}

				return result;
			} catch (error) {
				this.error(`Error writing to device: ${descriptor.path}`, error);
				return ErrorCode.EIO;
			}
		}

		// Regular file
		const inode = this.inodes.get(descriptor.path);
		if (inode) {
			try {
				// Update file data
				if (typeof buffer === 'object') {
					inode.data = { ...buffer };
					inode.modifiedAt = Date.now();
					return ErrorCode.SUCCESS;
				} else {
					this.error(`Buffer must be an object: ${descriptor.path}`);
					return ErrorCode.EINVAL;
				}
			} catch (error) {
				this.error(`Error writing to file: ${descriptor.path}`, error);
				return ErrorCode.EIO;
			}
		}

		// Directory
		if (this.directories.has(descriptor.path)) {
			this.error(`Cannot write to directory: ${descriptor.path}`);
			return ErrorCode.EISDIR;
		}

		this.error(`Path not found: ${descriptor.path}`);
		return ErrorCode.ENOENT;
	}

	/**
	 * Asynchronous write to a file descriptor (like write but returns a Promise)
	 * This is especially useful for device files that may implement async write methods
	 * @param fd File descriptor to write to
	 * @param buffer Data to write
	 * @returns Promise resolving to 0 on success, error code on failure
	 */
	async writeAsync(fd: number, buffer: any): Promise<number> {
		const descriptor = this.fileDescriptors.get(fd);
		if (!descriptor) {
			this.error(`Invalid file descriptor: ${fd}`);
			return ErrorCode.EBADF;
		}

		// Check write permission
		if (descriptor.mode !== OpenMode.WRITE && descriptor.mode !== OpenMode.READ_WRITE) {
			this.error(`File not opened for writing: ${descriptor.path}`);
			return ErrorCode.EACCES;
		}

		// Device file
		const device = this.mountPoints.get(descriptor.path);
		if (device) {
			if (!device.write) {
				this.error(`Device does not support writing: ${descriptor.path}`);
				return ErrorCode.EINVAL;
			}

			try {
				const result = device.write(fd, buffer);

				// If device's write method returns a Promise, await it
				if (result instanceof Promise) {
					return await result;
				}

				// Otherwise return the synchronous result
				return result;
			} catch (error) {
				this.error(`Error writing to device: ${descriptor.path}`, error);
				return ErrorCode.EIO;
			}
		}

		// For regular files, directories, etc., just use the synchronous write method
		return this.write(fd, buffer);
	}

	/**
	 * Close a file descriptor (like close)
	 * @param fd File descriptor to close
	 * @returns 0 on success, error code on failure
	 */
	close(fd: number): number {
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
	 * Device control (like ioctl)
	 * @param fd File descriptor
	 * @param request Request code
	 * @param arg Argument
	 * @returns 0 on success, error code on failure
	 */
	async ioctl(fd: number, request: number, arg: any): Promise<number> {
		const descriptor = this.fileDescriptors.get(fd);
		if (!descriptor) {
			this.error(`Invalid file descriptor: ${fd}`);
			return ErrorCode.EBADF;
		}

		// Only works on device files
		const device = this.mountPoints.get(descriptor.path);
		if (!device) {
			this.error(`Not a device file: ${descriptor.path}`);
			return ErrorCode.ENOTTY;
		}

		if (!device.ioctl) {
			this.error(`Device does not support ioctl: ${descriptor.path}`);
			return ErrorCode.ENOTTY;
		}

		try {
			// Call device's ioctl method and handle Promise if returned
			const result = device.ioctl(fd, request, arg);

			// If the result is a Promise, await it
			if (result instanceof Promise) {
				try {
					const awaitedResult = await result;
					this.log(`Async ioctl result for ${descriptor.path}: ${awaitedResult}`);
					return awaitedResult;
				} catch (asyncError) {
					this.error(`Async error in ioctl for device: ${descriptor.path}`, asyncError);
					// Attach error details to the argument for debugging
					if (arg) {
						arg.errorDetails = {
							message: asyncError.message || 'Unknown async error',
							stack: asyncError.stack,
							error: String(asyncError)
						};
					}
					return ErrorCode.EIO;
				}
			}

			return result;
		} catch (error) {
			this.error(`Error in ioctl for device: ${descriptor.path}`, error);
			// Attach error details to the argument for debugging
			if (arg) {
				arg.errorDetails = {
					message: error.message || 'Unknown error',
					stack: error.stack,
					error: String(error)
				};
			}
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
		const path = `/entity/${entity.id}`;

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
		const path = `/entity/${entityId}`;
		const inode = this.inodes.get(path);
		return inode?.data;
	}

	/**
	 * Get all entity IDs
	 * @returns Array of entity IDs
	 */
	getEntityIds(): string[] {
		return Array.from(this.inodes.keys())
			.filter((path) => path.startsWith('/entity/'))
			.map((path) => path.substring('/entity/'.length));
	}

	/**
	 * Remove an entity by deleting its file
	 * @param entityId Entity ID
	 * @returns Whether removal was successful
	 */
	removeEntity(entityId: string): boolean {
		const path = `/entity/${entityId}`;

		// Check if any file descriptors are open for this entity
		for (const descriptor of this.fileDescriptors.values()) {
			if (descriptor.path === path) {
				this.error(`Cannot remove entity ${entityId} while it has open file descriptors`);
				return false;
			}
		}

		// Remove entity file
		const hadEntity = this.inodes.delete(path);
		if (hadEntity) {
			this.events.emit('entity:removed', { entityId, path });
			this.log(`Removed entity: ${entityId}`);
		}

		return hadEntity;
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
		const devicePath = `/dev/${id}`;

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
		const devicePath = `/dev/${id}`;
		return this.mountPoints.get(devicePath) as T | undefined;
	}

	/**
	 * Get all capability IDs
	 * @returns Array of capability IDs
	 */
	getCapabilityIds(): string[] {
		return Array.from(this.mountPoints.keys())
			.filter((path) => path.startsWith('/dev/'))
			.map((path) => path.substring('/dev/'.length));
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

		// Store the plugin itself in memory (will be replaced by actual filesystem-based execution)
		// This is a temporary bridge during refactoring
		const inode: Inode = {
			path: execPath,
			data: plugin,
			createdAt: Date.now(),
			modifiedAt: Date.now()
		};

		this.inodes.set(execPath, inode);

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

		// Get plugin from inode
		const inode = this.inodes.get(execPath);
		return inode?.data as Plugin | undefined;
	}

	/**
	 * List all plugins in the /bin directory
	 * @returns Array of plugin IDs
	 */
	listPlugins(): string[] {
		return Array.from(this.inodes.keys())
			.filter((path) => path.startsWith(`${PLUGIN_PATHS.BIN}/`))
			.map((path) => path.substring(`${PLUGIN_PATHS.BIN}/`.length));
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
		if (!this.inodes.has(execPath)) {
			const error = `Plugin not found: ${pluginId}`;
			this.error(error);
			this.events.emit('plugin:execution_failed', {
				pluginId,
				entityId,
				error
			});
			throw new Error(error);
		}

		// Get plugin from inode
		const plugin = this.inodes.get(execPath)?.data as Plugin;
		if (!plugin) {
			const error = `Invalid plugin: ${pluginId}`;
			this.error(error);
			this.events.emit('plugin:execution_failed', {
				pluginId,
				entityId,
				error
			});
			throw new Error(error);
		}

		const entityPath = `/entity/${entityId}`;

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
	// Utility Methods
	//=============================================================================

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
		if (!this.directories.has(parentPath)) {
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

	async shutdown(): Promise<void> {
		this.log('Shutting down kernel');

		try {
			// Close all open file descriptors
			const openFds = Array.from(this.fileDescriptors.keys());
			this.log(`Closing ${openFds.length} open file descriptors`);
			for (const fd of openFds) {
				this.close(fd);
			}

			// Unmount all devices
			const devicePaths = Array.from(this.mountPoints.keys());
			this.log(`Unmounting ${devicePaths.length} devices`);
			for (const path of devicePaths) {
				const device = this.mountPoints.get(path);
				if (device?.shutdown) {
					try {
						await device.shutdown();
						this.log(`Device ${path} shut down`);
					} catch (error) {
						this.error(`Error shutting down device ${path}:`, error);
					}
				}
				this.mountPoints.delete(path);
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

			// Clear filesystem
			this.inodes.clear();
			this.directories.clear();

			// Clear event listeners
			this.events.removeAllListeners();

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
		// ALWAYS log these critical messages regardless of debug setting
		if (
			message.includes('Path not found') ||
			message.includes('Creating file') ||
			message.includes('Created file') ||
			message.includes('Failed to create') ||
			message.includes('directory') ||
			message.includes('/proc/character')
		) {
			console.warn(`[GameKernel-DEBUG] ${message}`, data);
			return;
		}

		if (this.debug) {
			if (data !== undefined) {
				console.log(`[GameKernel] ${message}`, data);
			} else {
				console.log(`[GameKernel] ${message}`);
			}
		}
	}

	/**
	 * Log an error message
	 * @param message Error message
	 * @param error Optional error object
	 */
	private error(message: string, error?: any): void {
		// ALWAYS print stack trace for errors
		console.error(`[GameKernel-ERROR] ${message}`, error);
		console.error('Stack trace for error:', new Error().stack);
	}
}
