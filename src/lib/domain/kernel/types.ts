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
  READ_WRITE = 'rw',
  
  /** Create if file doesn't exist */
  CREATE = 'c',
  
  /** Read and create if doesn't exist */
  READ_CREATE = 'rc',
  
  /** Write and create if doesn't exist */
  WRITE_CREATE = 'wc',
  
  /** Read, write and create if doesn't exist */
  READ_WRITE_CREATE = 'rwc',
  
  /** Truncate file if it exists */
  TRUNCATE = 't',
  
  /** Write and truncate */
  WRITE_TRUNCATE = 'wt',
  
  /** Append to file */
  APPEND = 'a'
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
   * @returns 0 on success, error code on failure, or a Promise resolving to one of these
   */
  write?(fd: number, buffer: any): number | Promise<number>;
  
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
 * Plugin validation result
 */
export interface PluginValidationResult {
  /** Whether plugin can be applied */
  valid: boolean;
  
  /** Reason why plugin cannot be applied, if invalid */
  reason?: string;
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
  
  /** Semantic version of this plugin */
  version?: string;
  
  /** Author of this plugin */
  author?: string;
  
  /** List of plugin IDs this plugin depends on */
  dependencies?: string[];
  
  /** List of plugins this plugin conflicts with */
  conflicts?: string[];
  
  /**
   * Execute the plugin (like a process running)
   * @param kernel Kernel to use for file operations
   * @param entityPath Path to the entity to operate on
   * @param options Execution options
   * @returns Exit code (0 for success, non-zero for error)
   */
  execute(kernel: any, entityPath: string, options?: Record<string, any>): number | Promise<number>;
  
  /**
   * Check if plugin can be applied to an entity
   * @param entity Entity to check
   * @returns Validation result
   */
  canApply?(entity: Entity): PluginValidationResult;
  
  /**
   * Signal handler for when the plugin is interrupted
   * @param signal Signal number
   * @returns Whether the signal was handled
   */
  signal?(signal: number): boolean;
  
  /**
   * Initialization method called when plugin is first loaded
   * @param kernel Kernel to use for file operations
   * @returns Whether initialization was successful
   */
  onLoad?(kernel: any): boolean | Promise<boolean>;
  
  /**
   * Cleanup method called when plugin is unloaded
   * @returns Whether cleanup was successful
   */
  onUnload?(): boolean | Promise<boolean>;
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
  
  /** Interrupted system call */
  EINTR = 4,
  
  /** I/O error */
  EIO = 5,
  
  /** No such device or address */
  ENXIO = 6,
  
  /** Bad file descriptor */
  EBADF = 9,
  
  /** Try again */
  EAGAIN = 11,
  
  /** Out of memory */
  ENOMEM = 12,
  
  /** Permission denied */
  EACCES = 13,
  
  /** Bad address */
  EFAULT = 14,
  
  /** Device or resource busy */
  EBUSY = 16,
  
  /** File exists */
  EEXIST = 17,
  
  /** No such device */
  ENODEV = 19,
  
  /** Not a directory */
  ENOTDIR = 20,
  
  /** Is a directory */
  EISDIR = 21,
  
  /** Invalid argument */
  EINVAL = 22,
  
  /** File too large */
  EFBIG = 27,
  
  /** No space left on device */
  ENOSPC = 28,
  
  /** Illegal seek */
  ESPIPE = 29,
  
  /** Read-only file system */
  EROFS = 30,
  
  /** Not implemented */
  ENOSYS = 38,
  
  /** Operation not supported */
  ENOTSUP = 95,
  
  /** Custom error codes for our system */
  
  /** Filesystem not ready */
  EFSNOTREADY = 200,
  
  /** Device not ready */
  EDEVNOTREADY = 201,
  
  /** Path already exists */
  EPATHEXISTS = 202,
  
  /** Entity not found */
  EENTITYNOTFOUND = 203,
  
  /** Character not found */
  ECHARACTERNOTFOUND = 204,
  
  /** Capability not found */
  ECAPABILITYNOTFOUND = 205,
  
  /** Plugin not found */
  EPLUGINNOTFOUND = 206,
  
  /** Database error */
  EDBERROR = 207,
  
  /** Network error */
  ENETWORKERROR = 208,
  
  /** Authentication error */
  EAUTHERROR = 209,
  
  /** Invalid operation for the current state */
  EINVALIDSTATE = 210,
  
  /** Feature not available */
  EFEATURENOTAVAILABLE = 211,
  
  /** Resource limit reached */
  ERESOURCELIMIT = 212,
  
  /** Timeout occurred */
  ETIMEOUT = 213,
  
  /** Required parameter missing */
  EPARAMMISSING = 214,
  
  /** Validation failed */
  EVALIDATION = 215,
  
  /** Character already exists */
  ECHARACTEREXISTS = 216,
  
  /** Maximum number of items reached */
  EMAXITEMSREACHED = 217,
  
  /** Data format error */
  EDATAFORMAT = 218
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
 * Message structure for message queues
 */
export interface Message {
  /** Message type for filtering */
  type: string;
  
  /** Message payload */
  payload: any;
  
  /** Message priority (numeric, higher = more important) */
  priority: number;
  
  /** Message ID (generated on enqueue) */
  id: string;
  
  /** Timestamp when message was created */
  timestamp: number;
  
  /** Source component that sent the message */
  source?: string;
  
  /** Target component to receive the message (optional) */
  target?: string;
  
  /** Time to live in milliseconds (0 = forever) */
  ttl?: number;
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
  
  /** Whether to disable emitting filesystem events (improves performance) */
  noFsEvents?: boolean;
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