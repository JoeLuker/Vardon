/**
 * Core type definitions for the kernel module
 * Following actual Unix kernel and filesystem design principles
 */

/**
 * File open modes like in Unix
 */
export enum OpenMode {
  /** Read only access */
  READ = 'r',
  
  /** Write only access */
  WRITE = 'w',
  
  /** Read and write access */
  READ_WRITE = 'rw'
}

/**
 * File descriptor for accessing resources
 * In Unix, processes access resources through file descriptors
 */
export interface FileDescriptor {
  /** Unique numeric identifier for this file descriptor */
  fd: number;
  
  /** Path to the resource this descriptor references */
  path: string;
  
  /** Mode the file was opened with */
  mode: OpenMode;
  
  /** When the file was opened */
  openedAt: number;
}

/**
 * Inode representing a file or resource
 * In Unix, inodes store file metadata and data
 */
export interface Inode {
  /** Path to this resource */
  path: string;
  
  /** Resource data */
  data: any;
  
  /** Creation time */
  createdAt: number;
  
  /** Last modified time */
  modifiedAt: number;
}

/**
 * Entity is the base unit of gameplay. It could be a character, item, etc.
 * In the Unix model, entities are essentially files in the filesystem
 */
export interface Entity {
  id: string;
  type: string;
  name: string;
  properties: Record<string, any>;
  metadata: {
    createdAt: number;
    updatedAt: number;
    version: number;
  };
}

/**
 * Capability is the interface for accessing system functionality
 * In Unix, capabilities are device drivers that get mounted in the /dev directory
 */
export interface Capability {
  /** Unique identifier for this capability (like a device name) */
  readonly id: string;
  
  /** Semantic version of this capability implementation */
  readonly version: string;
  
  /** 
   * Called when the device is mounted
   * Initialization happens here, once, at mount time
   */
  onMount?(kernel: any): void;
  
  /**
   * Read from the device (like a read() system call)
   * @param fd File descriptor to read from
   * @param buffer Buffer to read into
   * @returns 0 on success, error code on failure
   */
  read?(fd: number, buffer: any): number;
  
  /**
   * Write to the device (like a write() system call)
   * @param fd File descriptor to write to
   * @param buffer Data to write
   * @returns 0 on success, error code on failure
   */
  write?(fd: number, buffer: any): number;
  
  /**
   * Control device (like an ioctl() system call)
   * @param fd File descriptor to control
   * @param request Control code
   * @param arg Control argument
   * @returns 0 on success, error code on failure
   */
  ioctl?(fd: number, request: number, arg: any): number;
  
  /**
   * Clean up resources when shutting down or unmounting
   */
  shutdown?(): Promise<void>;
}

/**
 * Plugin is the interface for components that implement game features
 * In Unix, plugins would be like processes that open files and devices
 */
export interface Plugin {
  /** Unique identifier for this plugin (like a process name) */
  id: string;
  
  /** Human-readable name of this plugin */
  name: string;
  
  /** Description of what this plugin does */
  description?: string;
  
  /** List of device paths this plugin requires access to */
  requiredDevices: string[];
  
  /**
   * Execute the plugin (like a process running)
   * @param kernel Kernel to use for file operations
   * @param entityPath Path to the entity to operate on
   * @param options Execution options
   * @returns Exit code (0 for success, non-zero for error)
   */
  execute(kernel: any, entityPath: string, options?: Record<string, any>): number | Promise<number>;
  
  /**
   * Signal handler for when the plugin is interrupted
   * @param signal Signal number
   * @returns Whether the signal was handled
   */
  signal?(signal: number): boolean;
}

/**
 * Error codes like in Unix errno.h
 */
export enum ErrorCode {
  /** Success */
  SUCCESS = 0,
  
  /** Operation not permitted */
  EPERM = 1,
  
  /** No such file or directory */
  ENOENT = 2,
  
  /** No such process */
  ESRCH = 3,
  
  /** Bad file descriptor */
  EBADF = 9,
  
  /** Permission denied */
  EACCES = 13,
  
  /** Device or resource busy */
  EBUSY = 16,
  
  /** Invalid argument */
  EINVAL = 22
}

/**
 * EventListener for kernel events
 */
export type EventListener = (data: any) => void;

/**
 * Event subscription information
 */
export interface EventSubscription {
  /** Unique identifier for this subscription */
  id: string;
  
  /** Event name this subscription is for */
  event: string;
  
  /** Listener function */
  listener: EventListener;
}

/**
 * EventEmitter for kernel events
 */
export interface EventEmitter {
  /** 
   * Emit an event
   * @param event Event name
   * @param data Event data
   */
  emit(event: string, data: any): void;
  
  /**
   * Subscribe to an event
   * @param event Event name
   * @param listener Listener function
   * @returns Subscription ID
   */
  on(event: string, listener: EventListener): string;
  
  /**
   * Unsubscribe from an event
   * @param id Subscription ID
   */
  off(id: string): void;
  
  /**
   * Remove all event listeners
   */
  removeAllListeners(): void;
}

/**
 * KernelOptions for configuring a kernel instance
 */
export interface KernelOptions {
  /** Whether to show debug logs */
  debug?: boolean;
  
  /** Custom event emitter implementation */
  eventEmitter?: EventEmitter;
}

/**
 * Mount options for mounting devices
 */
export interface MountOptions {
  /** Whether to mount read-only */
  readonly?: boolean;
  
  /** Additional mount options */
  options?: Record<string, any>;
}

/**
 * Path operation result
 */
export interface PathResult {
  /** Success status */
  success: boolean;
  
  /** Error code if operation failed */
  errorCode?: ErrorCode;
  
  /** Error message if operation failed */
  errorMessage?: string;
  
  /** Path that was operated on */
  path: string;
}

/**
 * Filesystem stats like from stat() system call
 */
export interface Stats {
  /** Whether this is a file */
  isFile: boolean;
  
  /** Whether this is a directory */
  isDirectory: boolean;
  
  /** Whether this is a device */
  isDevice: boolean;
  
  /** Size in bytes */
  size: number;
  
  /** Created time */
  createdAt: number;
  
  /** Modified time */
  modifiedAt: number;
  
  /** Last accessed time */
  accessedAt: number;
}