import type { 
  Entity, 
  Capability, 
  Plugin, 
  EventEmitter, 
  KernelOptions,
  OpenMode,
  FileDescriptor,
  Inode,
  MountOptions,
  PathResult,
  Stats,
  ErrorCode
} from './types';
import { EventBus } from './EventBus';

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
  
  // Process management (plugins)
  private readonly plugins: Map<string, Plugin> = new Map();
  
  // Configuration
  private readonly debug: boolean;
  
  // Event system (like signals in Unix)
  public readonly events: EventEmitter;
  
  constructor(options: KernelOptions = {}) {
    this.debug = options.debug || false;
    this.events = options.eventEmitter || new EventBus(this.debug);
    
    // Create root directory
    this.directories.add('/');
    
    // Create standard directories
    this.mkdir('/dev');    // Device files
    this.mkdir('/entity'); // Entity files
    
    if (this.debug) {
      this.log('Kernel initialized');
    }
  }
  
  //=============================================================================
  // Filesystem Operations (Unix system calls)
  //=============================================================================
  
  /**
   * Create a directory (like mkdir)
   * @param path Directory path to create
   * @returns Path result
   */
  mkdir(path: string): PathResult {
    if (!path.startsWith('/')) {
      return {
        success: false,
        errorCode: ErrorCode.EINVAL,
        errorMessage: 'Path must be absolute',
        path
      };
    }
    
    if (this.directories.has(path)) {
      return {
        success: false,
        errorCode: ErrorCode.EEXIST,
        errorMessage: 'Directory already exists',
        path
      };
    }
    
    // Check parent directory exists
    const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
    if (!this.directories.has(parentPath)) {
      return {
        success: false,
        errorCode: ErrorCode.ENOENT,
        errorMessage: `Parent directory does not exist: ${parentPath}`,
        path
      };
    }
    
    // Create directory
    this.directories.add(path);
    this.events.emit('fs:mkdir', { path });
    this.log(`Created directory: ${path}`);
    
    return { success: true, path };
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
    
    // Mount the device
    this.mountPoints.set(path, device);
    this.events.emit('fs:mount', { path, device: device.id });
    this.log(`Mounted device ${device.id} at ${path}`);
    
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
   * @returns Path result
   */
  create(path: string, data: any): PathResult {
    if (!path.startsWith('/')) {
      return {
        success: false,
        errorCode: ErrorCode.EINVAL,
        errorMessage: 'Path must be absolute',
        path
      };
    }
    
    if (this.inodes.has(path)) {
      return {
        success: false,
        errorCode: ErrorCode.EEXIST,
        errorMessage: 'File already exists',
        path
      };
    }
    
    // Check parent directory exists
    const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
    if (!this.directories.has(parentPath)) {
      return {
        success: false,
        errorCode: ErrorCode.ENOENT,
        errorMessage: `Parent directory does not exist: ${parentPath}`,
        path
      };
    }
    
    // Create inode
    const inode: Inode = {
      path,
      data,
      createdAt: Date.now(),
      modifiedAt: Date.now()
    };
    
    this.inodes.set(path, inode);
    this.events.emit('fs:create', { path });
    this.log(`Created file: ${path}`);
    
    return { success: true, path };
  }
  
  /**
   * Check if a path exists (like access)
   * @param path Path to check
   * @returns Whether the path exists
   */
  exists(path: string): boolean {
    return this.inodes.has(path) || 
           this.directories.has(path) || 
           this.mountPoints.has(path);
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
   * @param buffer Buffer to read into
   * @returns 0 on success, error code on failure
   */
  read(fd: number, buffer: any): number {
    const descriptor = this.fileDescriptors.get(fd);
    if (!descriptor) {
      this.error(`Invalid file descriptor: ${fd}`);
      return ErrorCode.EBADF;
    }
    
    // Check read permission
    if (descriptor.mode !== OpenMode.READ && descriptor.mode !== OpenMode.READ_WRITE) {
      this.error(`File not opened for reading: ${descriptor.path}`);
      return ErrorCode.EACCES;
    }
    
    // Device file
    const device = this.mountPoints.get(descriptor.path);
    if (device) {
      if (!device.read) {
        this.error(`Device does not support reading: ${descriptor.path}`);
        return ErrorCode.EINVAL;
      }
      
      try {
        return device.read(fd, buffer);
      } catch (error) {
        this.error(`Error reading from device: ${descriptor.path}`, error);
        return ErrorCode.EIO;
      }
    }
    
    // Regular file
    const inode = this.inodes.get(descriptor.path);
    if (inode) {
      try {
        // Copy data to buffer
        if (typeof buffer === 'object') {
          Object.assign(buffer, inode.data);
        } else {
          this.error(`Buffer must be an object: ${descriptor.path}`);
          return ErrorCode.EINVAL;
        }
        
        return ErrorCode.SUCCESS;
      } catch (error) {
        this.error(`Error reading from file: ${descriptor.path}`, error);
        return ErrorCode.EIO;
      }
    }
    
    // Directory
    if (this.directories.has(descriptor.path)) {
      this.error(`Cannot read from directory: ${descriptor.path}`);
      return ErrorCode.EISDIR;
    }
    
    this.error(`Path not found: ${descriptor.path}`);
    return ErrorCode.ENOENT;
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
        return device.write(fd, buffer);
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
  ioctl(fd: number, request: number, arg: any): number {
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
      .filter(path => path.startsWith('/entity/'))
      .map(path => path.substring('/entity/'.length));
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
      .filter(path => path.startsWith('/dev/'))
      .map(path => path.substring('/dev/'.length));
  }
  
  //=============================================================================
  // Plugin Management (as processes)
  //=============================================================================
  
  /**
   * Register a plugin with the kernel
   * @param plugin Plugin to register
   */
  registerPlugin(plugin: Plugin): void {
    if (this.plugins.has(plugin.id)) {
      this.log(`Replacing existing plugin: ${plugin.id}`);
    }
    
    this.plugins.set(plugin.id, plugin);
    this.events.emit('plugin:registered', { id: plugin.id });
    this.log(`Registered plugin: ${plugin.id}`);
  }
  
  /**
   * Get a plugin by ID
   * @param id Plugin ID
   * @returns Plugin or undefined if not found
   */
  getPlugin(id: string): Plugin | undefined {
    return this.plugins.get(id);
  }
  
  /**
   * Execute a plugin (like running a process)
   * @param pluginId Plugin ID
   * @param entityId Entity ID
   * @param options Plugin options
   * @returns Result of execution
   */
  async executePlugin<T>(pluginId: string, entityId: string, options: Record<string, any> = {}): Promise<T> {
    // Get plugin
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      const error = `Plugin not found: ${pluginId}`;
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
  
  /**
   * Shut down the kernel
   */
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
      
      // Clear filesystem
      this.inodes.clear();
      this.directories.clear();
      
      // Clear plugin registry
      this.plugins.clear();
      
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
    if (error !== undefined) {
      console.error(`[GameKernel] ${message}`, error);
    } else {
      console.error(`[GameKernel] ${message}`);
    }
  }
}