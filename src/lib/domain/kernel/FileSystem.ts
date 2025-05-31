/**
 * FileSystem.ts - Unix-Style Persistent Filesystem
 * 
 * This implements a proper Unix-like filesystem that persists between sessions.
 * It follows Unix principles with a clear separation of concerns:
 * - Filesystem structure is managed only by the kernel
 * - Proper path resolution and validation
 * - Persistent storage using browser storage
 * - Rigorous error handling with Unix-like error codes
 * - Clean separation between filesystem and devices
 */

import { ErrorCode } from './types';
import { BrowserStorage, StorageAdapter } from './BrowserStorage';
import { InvariantChecker, UnixInvariants } from './InvariantChecker';

// Filesystem storage keys
const FS_INODES_KEY = 'inodes';
const FS_DIRECTORIES_KEY = 'directories';
const FS_METADATA_KEY = 'metadata';
const FS_MOUNTPOINTS_KEY = 'mountpoints';

// FileSystem entry types
export enum FileType {
  FILE = 'file',
  DIRECTORY = 'directory',
  DEVICE = 'device',
  SYMLINK = 'symlink',
  PIPE = 'pipe',
  SOCKET = 'socket',
}

// Filesystem metadata for storage
interface FilesystemMetadata {
  version: string;
  createdAt: number;
  lastMountedAt: number;
  mountCount: number;
  format: 'json';
}

// File or directory permissions (Unix-style)
export interface FilePermissions {
  owner: {
    read: boolean;
    write: boolean;
    execute: boolean;
  };
  group: {
    read: boolean;
    write: boolean;
    execute: boolean;
  };
  others: {
    read: boolean;
    write: boolean;
    execute: boolean;
  };
}

// File metadata (similar to Unix inodes)
export interface Inode {
  id: string;
  type: FileType;
  path: string;
  size: number;
  owner: string;
  group: string;
  permissions: FilePermissions;
  createdAt: number;
  modifiedAt: number;
  accessedAt: number;
  links: number;
  data?: any;
  device?: string; // Only for device files
  target?: string; // Only for symlinks
}

// Directory entry
export interface DirectoryEntry {
  name: string;
  type: FileType;
  inodeId: string;
}

// Path operation result
export interface PathResult {
  success: boolean;
  errorCode?: ErrorCode;
  errorMessage?: string;
  path: string;
  inode?: Inode;
}

// Stat result (like fs.Stats in Node.js)
export interface Stats {
  dev: number;
  ino: string;
  mode: number;
  nlink: number;
  uid: string;
  gid: string;
  rdev: number;
  size: number;
  blksize: number;
  blocks: number;
  atimeMs: number;
  mtimeMs: number;
  ctimeMs: number;
  birthtimeMs: number;
  isFile: boolean;
  isDirectory: boolean;
  isSymbolicLink: boolean;
  isDevice: boolean;
  isPipe: boolean;
  isSocket: boolean;
}

/**
 * Options for initializing the filesystem
 */
export interface FilesystemOptions {
  debug?: boolean;
  readOnly?: boolean;
  skipMount?: boolean;
  storage?: StorageAdapter;
}

/**
 * Filesystem implementation with persistence via browser storage
 * This follows Unix principles for filesystem operations
 */
export class FileSystem {
  // In-memory storage (cache)
  private inodes: Map<string, Inode> = new Map();
  private directories: Map<string, DirectoryEntry[]> = new Map();
  private metadata: FilesystemMetadata;
  
  // State
  private mounted: boolean = false;
  private readOnly: boolean = false;
  private debug: boolean = false;
  
  // Mount paths for devices
  private mountPoints: Map<string, string> = new Map();
  
  // Storage adapter
  private storage: StorageAdapter;
  
  // Invariant checker
  private invariants: InvariantChecker;
  
  constructor(options: FilesystemOptions = {}) {
    this.debug = options.debug ?? false;
    this.readOnly = options.readOnly ?? false;
    
    // Initialize invariant checker
    this.invariants = new InvariantChecker(this.debug);
    
    // Use provided storage adapter or create a new browser storage
    this.storage = options.storage ?? new BrowserStorage();
    
    // Initialize filesystem metadata
    this.metadata = {
      version: '1.0.0',
      createdAt: Date.now(),
      lastMountedAt: Date.now(),
      mountCount: 1,
      format: 'json'
    };
    
    // Mount filesystem immediately unless told not to
    if (!options.skipMount) {
      this.mount();
    }
  }
  
  /**
   * Mount the filesystem, loading state from storage
   * @returns PathResult indicating success or failure
   */
  async mount(): Promise<PathResult> {
    try {
      if (this.mounted) {
        if (this.debug) console.log('[FileSystem] Already mounted');
        return { success: true, path: '/' };
      }
      
      if (this.debug) console.log('[FileSystem] Mounting filesystem');
      
      // Initialize the storage adapter if it's a BrowserStorage
      if ('initialize' in this.storage && typeof (this.storage as any).initialize === 'function') {
        await (this.storage as any).initialize();
      }
      
      // Load filesystem metadata (or initialize if it doesn't exist)
      const storedMetadata = await this.storage.getItem(FS_METADATA_KEY);
      if (storedMetadata) {
        try {
          this.metadata = storedMetadata;
          this.metadata.lastMountedAt = Date.now();
          this.metadata.mountCount++;
        } catch (e) {
          if (this.debug) console.error('[FileSystem] Failed to parse metadata, initializing fresh filesystem');
          // Initialize new metadata and filesystem if parsing fails
          await this.initializeFilesystem();
        }
      } else {
        // Initialize new filesystem if no metadata exists
        await this.initializeFilesystem();
      }
      
      // Load inodes from storage
      const storedInodes = await this.storage.getItem(FS_INODES_KEY);
      if (storedInodes) {
        this.inodes = new Map(Object.entries(storedInodes));
      }
      
      // Load directories from storage
      const storedDirectories = await this.storage.getItem(FS_DIRECTORIES_KEY);
      if (storedDirectories) {
        this.directories = new Map(Object.entries(storedDirectories));
      }
      
      // Load mount points from storage
      const storedMountPoints = await this.storage.getItem(FS_MOUNTPOINTS_KEY);
      if (storedMountPoints) {
        this.mountPoints = new Map(Object.entries(storedMountPoints));
      }
      
      // If we don't have root directory, initialize the filesystem
      if (!this.directories.has('/')) {
        await this.initializeFilesystem();
      }
      
      this.mounted = true;
      if (this.debug) console.log('[FileSystem] Filesystem mounted successfully');
      
      // Save updated metadata
      await this.saveMetadata();
      
      return { success: true, path: '/' };
    } catch (error) {
      const errorMessage = `Failed to mount filesystem: ${error instanceof Error ? error.message : String(error)}`;
      if (this.debug) console.error(`[FileSystem] ${errorMessage}`);
      return {
        success: false,
        errorCode: ErrorCode.EIO,
        errorMessage,
        path: '/'
      };
    }
  }
  
  /**
   * Unmount the filesystem, saving state to storage
   * @returns PathResult indicating success or failure
   */
  async unmount(): Promise<PathResult> {
    try {
      if (!this.mounted) {
        if (this.debug) console.log('[FileSystem] Already unmounted');
        return { success: true, path: '/' };
      }
      
      if (this.debug) console.log('[FileSystem] Unmounting filesystem');
      
      // Save state to storage
      await this.saveToStorage();
      
      // Clear in-memory state
      this.inodes.clear();
      this.directories.clear();
      this.mountPoints.clear();
      
      this.mounted = false;
      if (this.debug) console.log('[FileSystem] Filesystem unmounted successfully');
      
      return { success: true, path: '/' };
    } catch (error) {
      const errorMessage = `Failed to unmount filesystem: ${error instanceof Error ? error.message : String(error)}`;
      if (this.debug) console.error(`[FileSystem] ${errorMessage}`);
      return {
        success: false,
        errorCode: ErrorCode.EIO,
        errorMessage,
        path: '/'
      };
    }
  }
  
  /**
   * Initialize the filesystem with standard Unix directory structure
   */
  private async initializeFilesystem(): Promise<void> {
    if (this.debug) console.log('[FileSystem] Initializing new filesystem');
    
    // Clear existing data
    this.inodes.clear();
    this.directories.clear();
    this.mountPoints.clear();
    
    // Reset metadata
    this.metadata = {
      version: '1.0.0',
      createdAt: Date.now(),
      lastMountedAt: Date.now(),
      mountCount: 1,
      format: 'json'
    };
    
    // Create root directory
    this.createRootDirectory();
    
    // Create standard Unix directories
    await this.createStandardDirectories();
    
    // Save to storage
    await this.saveToStorage();
    
    if (this.debug) console.log('[FileSystem] Filesystem initialized successfully');
  }
  
  /**
   * Create the root directory ('/')
   */
  private createRootDirectory(): void {
    const rootInode: Inode = {
      id: this.generateInodeId(),
      type: FileType.DIRECTORY,
      path: '/',
      size: 0,
      owner: 'root',
      group: 'root',
      permissions: {
        owner: { read: true, write: true, execute: true },
        group: { read: true, write: false, execute: true },
        others: { read: true, write: false, execute: true }
      },
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      accessedAt: Date.now(),
      links: 2 // Self + parent
    };
    
    this.inodes.set(rootInode.id, rootInode);
    this.directories.set('/', []);
  }
  
  /**
   * Create standard Unix directory structure
   */
  private async createStandardDirectories(): Promise<void> {
    // Standard Unix directories
    const standardDirs = [
      '/bin',      // Essential user commands
      '/dev',      // Device files
      '/etc',      // System configuration
      '/home',     // User home directories
      '/lib',      // Libraries
      '/proc',     // Process information
      '/sys',      // System information
      '/tmp',      // Temporary files
      '/usr',      // User utilities
      '/var',      // Variable data
      
      // Custom application directories
      '/entity',   // Game entities
      '/pipes',    // Message queues
    ];
    
    // Create each directory
    for (const dir of standardDirs) {
      await this.mkdir(dir);
    }
    
    // Create important subdirectories
    await this.mkdir('/dev/character');
    await this.mkdir('/dev/ability');
    await this.mkdir('/dev/skill');
    await this.mkdir('/dev/combat');
    await this.mkdir('/dev/condition');
    await this.mkdir('/dev/bonus');
    
    await this.mkdir('/proc/character');
    await this.mkdir('/proc/plugins');
    await this.mkdir('/proc/signals');
    
    await this.mkdir('/etc/plugins');
    
    await this.mkdir('/var/log');
    await this.mkdir('/var/run');
  }
  
  /**
   * Save metadata to storage
   */
  private async saveMetadata(): Promise<void> {
    if (this.readOnly) return;
    
    try {
      await this.storage.setItem(FS_METADATA_KEY, this.metadata);
    } catch (error) {
      if (this.debug) {
        console.error('[FileSystem] Failed to save metadata:', error);
      }
    }
  }
  
  /**
   * Save filesystem state to storage
   */
  private async saveToStorage(): Promise<void> {
    if (this.readOnly) return;
    
    try {
      // Convert Maps to objects for JSON serialization
      const inodesObj = Object.fromEntries(this.inodes.entries());
      const dirsObj = Object.fromEntries(this.directories.entries());
      const mountsObj = Object.fromEntries(this.mountPoints.entries());
      
      // Save to storage
      await Promise.all([
        this.storage.setItem(FS_INODES_KEY, inodesObj),
        this.storage.setItem(FS_DIRECTORIES_KEY, dirsObj),
        this.storage.setItem(FS_MOUNTPOINTS_KEY, mountsObj),
        this.saveMetadata()
      ]);
      
      if (this.debug) console.log('[FileSystem] Saved filesystem state to storage');
    } catch (error) {
      if (this.debug) {
        console.error('[FileSystem] Failed to save filesystem state:', error);
      }
    }
  }
  
  /**
   * Generate a unique inode ID
   * @returns A unique string ID
   */
  private generateInodeId(): string {
    return `inode_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  /**
   * Normalize a path (like path.normalize in Node.js)
   * @param path The path to normalize
   * @returns Normalized path
   */
  private normalizePath(path: string): string {
    // Handle empty path
    if (!path) return '/';
    
    // Handle absolute vs relative path
    const isAbsolute = path.startsWith('/');
    const parts = path.split('/').filter(Boolean);
    const resultParts: string[] = [];
    
    for (const part of parts) {
      if (part === '.') {
        // Current directory, skip
        continue;
      } else if (part === '..') {
        // Parent directory, pop last part
        resultParts.pop();
      } else {
        // Regular path component
        resultParts.push(part);
      }
    }
    
    // Reconstruct path
    let result = resultParts.join('/');
    if (isAbsolute) result = '/' + result;
    if (!result) result = '/';
    
    return result;
  }
  
  /**
   * Get the parent directory path of a given path
   * @param path The path to get the parent of
   * @returns The parent directory path
   */
  private getParentPath(path: string): string {
    if (path === '/' || !path) return '/';
    
    const normalized = this.normalizePath(path);
    const lastSlashIndex = normalized.lastIndexOf('/');
    
    if (lastSlashIndex <= 0) return '/';
    return normalized.substring(0, lastSlashIndex) || '/';
  }
  
  /**
   * Get the basename of a path (like path.basename in Node.js)
   * @param path The path to get the basename of
   * @returns The basename
   */
  private getBasename(path: string): string {
    if (path === '/' || !path) return '';
    
    const normalized = this.normalizePath(path);
    const lastSlashIndex = normalized.lastIndexOf('/');
    
    if (lastSlashIndex === normalized.length - 1) {
      // Trailing slash, get second-to-last slash
      const withoutTrailing = normalized.substring(0, normalized.length - 1);
      const secondLastSlashIndex = withoutTrailing.lastIndexOf('/');
      return withoutTrailing.substring(secondLastSlashIndex + 1);
    }
    
    return normalized.substring(lastSlashIndex + 1);
  }
  
  /**
   * Get inode for a path
   * @param path The path to get the inode for
   * @returns The inode or undefined if not found
   */
  private getInode(path: string): Inode | undefined {
    if (!this.mounted) return undefined;
    
    const normalized = this.normalizePath(path);
    
    // Check for direct match in inodes
    for (const inode of this.inodes.values()) {
      if (inode.path === normalized) {
        // Update access time
        inode.accessedAt = Date.now();
        return inode;
      }
    }
    
    return undefined;
  }
  
  /**
   * Get directory entries for a path
   * @param path The path to get directory entries for
   * @returns Array of directory entries or undefined if not found or not a directory
   */
  private getDirectoryEntries(path: string): DirectoryEntry[] | undefined {
    if (!this.mounted) return undefined;
    
    const normalized = this.normalizePath(path);
    return this.directories.get(normalized);
  }
  
  /**
   * Check if a path exists
   * @param path Path to check
   * @returns Boolean indicating if path exists
   */
  exists(path: string): boolean {
    if (!this.mounted) return false;
    
    const normalized = this.normalizePath(path);
    
    // Check if path is a directory
    if (this.directories.has(normalized)) {
      return true;
    }
    
    // Check if path is a file or other inode type
    const inode = this.getInode(normalized);
    return !!inode;
  }
  
  /**
   * Get stats for a path (like fs.stat in Node.js)
   * @param path Path to stat
   * @returns Stats object or undefined if not found
   */
  stat(path: string): Stats | undefined {
    if (!this.mounted) return undefined;
    
    const normalized = this.normalizePath(path);
    const inode = this.getInode(normalized);
    
    if (!inode) return undefined;
    
    // Convert inode to stats object
    return {
      dev: 1,  // Device ID (always 1 for our virtual filesystem)
      ino: inode.id,
      mode: 0,  // Mode bits (not fully implemented)
      nlink: inode.links,
      uid: inode.owner,
      gid: inode.group,
      rdev: 0,  // Device ID for special files
      size: inode.size,
      blksize: 4096, // Block size (default from Unix)
      blocks: Math.ceil(inode.size / 4096),
      atimeMs: inode.accessedAt,
      mtimeMs: inode.modifiedAt,
      ctimeMs: inode.modifiedAt,
      birthtimeMs: inode.createdAt,
      isFile: inode.type === FileType.FILE,
      isDirectory: inode.type === FileType.DIRECTORY,
      isSymbolicLink: inode.type === FileType.SYMLINK,
      isDevice: inode.type === FileType.DEVICE,
      isPipe: inode.type === FileType.PIPE,
      isSocket: inode.type === FileType.SOCKET
    };
  }
  
  /**
   * Create a directory (like mkdir -p in Unix)
   * @param path Directory path to create
   * @param recursive Whether to create parent directories if they don't exist
   * @returns Path result
   */
  async mkdir(path: string, recursive: boolean = true): Promise<PathResult> {
    const context = { component: 'FileSystem', operation: 'mkdir', path };
    
    // Invariant: Path must be absolute
    this.invariants.checkPath(path, context);
    
    if (!this.mounted) {
      return {
        success: false,
        errorCode: ErrorCode.ENODEV,
        errorMessage: 'Filesystem not mounted',
        path
      };
    }
    
    if (this.readOnly) {
      return {
        success: false,
        errorCode: ErrorCode.EROFS,
        errorMessage: 'Filesystem is read-only',
        path
      };
    }
    
    const normalized = this.normalizePath(path);
    
    // If directory already exists, succeed silently
    if (this.directories.has(normalized)) {
      return { success: true, path: normalized };
    }
    
    // Check if parent directory exists
    const parentPath = this.getParentPath(normalized);
    if (!this.directories.has(parentPath)) {
      // If not recursive, return error
      if (!recursive) {
        return {
          success: false,
          errorCode: ErrorCode.ENOENT,
          errorMessage: `Parent directory does not exist: ${parentPath}`,
          path: normalized
        };
      }
      
      // Otherwise, create parent directories recursively
      const parentResult = await this.mkdir(parentPath, true);
      if (!parentResult.success) {
        return parentResult;
      }
    }
    
    // Create directory inode
    const dirInode: Inode = {
      id: this.generateInodeId(),
      type: FileType.DIRECTORY,
      path: normalized,
      size: 0,
      owner: 'root',  // TODO: Use current user
      group: 'root',  // TODO: Use current group
      permissions: {
        owner: { read: true, write: true, execute: true },
        group: { read: true, write: false, execute: true },
        others: { read: true, write: false, execute: true }
      },
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      accessedAt: Date.now(),
      links: 2  // Self + parent
    };
    
    // Add directory inode
    this.inodes.set(dirInode.id, dirInode);
    
    // Create empty directory entry list
    this.directories.set(normalized, []);
    
    // Add entry to parent directory
    const dirName = this.getBasename(normalized);
    const parentEntries = this.directories.get(parentPath) || [];
    parentEntries.push({
      name: dirName,
      type: FileType.DIRECTORY,
      inodeId: dirInode.id
    });
    this.directories.set(parentPath, parentEntries);
    
    // Update parent inode's modification time
    const parentInode = this.getInode(parentPath);
    if (parentInode) {
      parentInode.modifiedAt = Date.now();
    }
    
    // Save to storage (async but don't wait)
    this.saveToStorage().catch(err => {
      if (this.debug) console.error(`[FileSystem] Failed to save after mkdir: ${normalized}`, err);
    });
    
    if (this.debug) console.log(`[FileSystem] Created directory: ${normalized}`);
    return { success: true, path: normalized };
  }
  
  /**
   * Create a file (like touch in Unix)
   * @param path File path to create
   * @param data File data (optional)
   * @param createParent Whether to create parent directories if they don't exist
   * @returns Path result
   */
  async create(path: string, data: any = null, createParent: boolean = true): Promise<PathResult> {
    const context = { component: 'FileSystem', operation: 'create', path };
    
    // Invariant: Path must be absolute
    this.invariants.checkPath(path, context);
    
    if (!this.mounted) {
      return {
        success: false,
        errorCode: ErrorCode.ENODEV,
        errorMessage: 'Filesystem not mounted',
        path
      };
    }
    
    if (this.readOnly) {
      return {
        success: false,
        errorCode: ErrorCode.EROFS,
        errorMessage: 'Filesystem is read-only',
        path
      };
    }
    
    const normalized = this.normalizePath(path);
    
    // Invariant: Parent directory must exist (unless creating parent dirs)
    if (!createParent) {
      this.invariants.check(
        UnixInvariants.parentExists(normalized, this),
        `Parent directory does not exist for path: ${normalized}`,
        context
      );
    }
    
    // Check if file already exists
    const existingInode = this.getInode(normalized);
    if (existingInode) {
      // It's a file, update it
      if (existingInode.type === FileType.FILE) {
        existingInode.modifiedAt = Date.now();
        existingInode.accessedAt = Date.now();
        existingInode.data = data;
        existingInode.size = data ? JSON.stringify(data).length : 0;
        
        // Save to storage (async but don't wait)
        this.saveToStorage().catch(err => {
          if (this.debug) console.error(`[FileSystem] Failed to save after updating file: ${normalized}`, err);
        });
        
        if (this.debug) console.log(`[FileSystem] Updated file: ${normalized}`);
        return { 
          success: true, 
          path: normalized,
          inode: existingInode 
        };
      }
      
      // It's a directory or other type, return error
      return {
        success: false,
        errorCode: ErrorCode.EISDIR,
        errorMessage: `Path exists and is not a file: ${normalized}`,
        path: normalized
      };
    }
    
    // Check if parent directory exists
    const parentPath = this.getParentPath(normalized);
    if (!this.directories.has(parentPath)) {
      // If createParent is false, return error
      if (!createParent) {
        return {
          success: false,
          errorCode: ErrorCode.ENOENT,
          errorMessage: `Parent directory does not exist: ${parentPath}`,
          path: normalized
        };
      }
      
      // Otherwise, create parent directories recursively
      const parentResult = await this.mkdir(parentPath, true);
      if (!parentResult.success) {
        return parentResult;
      }
    }
    
    // Create file inode
    const fileInode: Inode = {
      id: this.generateInodeId(),
      type: FileType.FILE,
      path: normalized,
      size: data ? JSON.stringify(data).length : 0,
      owner: 'root',  // TODO: Use current user
      group: 'root',  // TODO: Use current group
      permissions: {
        owner: { read: true, write: true, execute: false },
        group: { read: true, write: false, execute: false },
        others: { read: true, write: false, execute: false }
      },
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      accessedAt: Date.now(),
      links: 1,
      data
    };
    
    // Add file inode
    this.inodes.set(fileInode.id, fileInode);
    
    // Add entry to parent directory
    const fileName = this.getBasename(normalized);
    const parentEntries = this.directories.get(parentPath) || [];
    parentEntries.push({
      name: fileName,
      type: FileType.FILE,
      inodeId: fileInode.id
    });
    this.directories.set(parentPath, parentEntries);
    
    // Update parent inode's modification time
    const parentInode = this.getInode(parentPath);
    if (parentInode) {
      parentInode.modifiedAt = Date.now();
    }
    
    // Save to storage (async but don't wait)
    this.saveToStorage().catch(err => {
      if (this.debug) console.error(`[FileSystem] Failed to save after creating file: ${normalized}`, err);
    });
    
    if (this.debug) console.log(`[FileSystem] Created file: ${normalized}`);
    return { 
      success: true, 
      path: normalized,
      inode: fileInode 
    };
  }
  
  /**
   * Read a file (like cat in Unix)
   * @param path File path to read
   * @returns [Error code, data] tuple
   */
  read(path: string): [ErrorCode, any] {
    const context = { component: 'FileSystem', operation: 'read', path };
    
    // Invariant: Path must be absolute
    this.invariants.checkPath(path, context);
    
    if (!this.mounted) {
      return [ErrorCode.ENODEV, null];
    }
    
    const normalized = this.normalizePath(path);
    const inode = this.getInode(normalized);
    
    // If path doesn't exist, return error
    if (!inode) {
      if (this.debug) console.log(`[FileSystem] Path not found: ${normalized}`);
      return [ErrorCode.ENOENT, null];
    }
    
    // If path is a directory, return error
    if (inode.type === FileType.DIRECTORY) {
      if (this.debug) console.log(`[FileSystem] Cannot read directory as file: ${normalized}`);
      return [ErrorCode.EISDIR, null];
    }
    
    // If path is a device, handle specially
    if (inode.type === FileType.DEVICE) {
      if (this.debug) console.log(`[FileSystem] Reading device file: ${normalized}`);
      // For now, return empty data - device reads will be handled elsewhere
      return [ErrorCode.SUCCESS, inode.data || {}];
    }
    
    // Update access time
    inode.accessedAt = Date.now();
    
    // Return file data
    if (this.debug) console.log(`[FileSystem] Read file: ${normalized}`);
    return [ErrorCode.SUCCESS, inode.data];
  }
  
  /**
   * Write to a file (like echo > file in Unix)
   * @param path File path to write to
   * @param data Data to write
   * @returns Error code
   */
  write(path: string, data: any): ErrorCode {
    const context = { component: 'FileSystem', operation: 'write', path };
    
    // Invariant: Path must be absolute
    this.invariants.checkPath(path, context);
    
    if (!this.mounted) {
      return ErrorCode.ENODEV;
    }
    
    if (this.readOnly) {
      return ErrorCode.EROFS;
    }
    
    const normalized = this.normalizePath(path);
    const inode = this.getInode(normalized);
    
    // If path doesn't exist, return error
    if (!inode) {
      if (this.debug) console.log(`[FileSystem] Path not found: ${normalized}`);
      return ErrorCode.ENOENT;
    }
    
    // If path is a directory, return error
    if (inode.type === FileType.DIRECTORY) {
      if (this.debug) console.log(`[FileSystem] Cannot write to directory: ${normalized}`);
      return ErrorCode.EISDIR;
    }
    
    // If path is a device, handle specially
    if (inode.type === FileType.DEVICE) {
      if (this.debug) console.log(`[FileSystem] Writing to device file: ${normalized}`);
      // For now, just store the data - device writes will be handled elsewhere
      inode.data = data;
      inode.modifiedAt = Date.now();
      inode.accessedAt = Date.now();
      
      // Save to storage (async but don't wait)
      this.saveToStorage().catch(err => {
        if (this.debug) console.error(`[FileSystem] Failed to save after writing to device: ${normalized}`, err);
      });
      
      return ErrorCode.SUCCESS;
    }
    
    // Update file data
    inode.data = data;
    inode.size = data ? JSON.stringify(data).length : 0;
    inode.modifiedAt = Date.now();
    inode.accessedAt = Date.now();
    
    // Save to storage (async but don't wait)
    this.saveToStorage().catch(err => {
      if (this.debug) console.error(`[FileSystem] Failed to save after writing to file: ${normalized}`, err);
    });
    
    if (this.debug) console.log(`[FileSystem] Wrote to file: ${normalized}`);
    return ErrorCode.SUCCESS;
  }
  
  /**
   * Delete a file (like rm in Unix)
   * @param path File path to delete
   * @returns Error code
   */
  unlink(path: string): ErrorCode {
    const context = { component: 'FileSystem', operation: 'unlink', path };
    
    // Invariant: Path must be absolute
    this.invariants.checkPath(path, context);
    
    if (!this.mounted) {
      return ErrorCode.ENODEV;
    }
    
    if (this.readOnly) {
      return ErrorCode.EROFS;
    }
    
    const normalized = this.normalizePath(path);
    
    // Cannot delete root directory
    if (normalized === '/') {
      if (this.debug) console.log(`[FileSystem] Cannot delete root directory`);
      return ErrorCode.EPERM;
    }
    
    const inode = this.getInode(normalized);
    
    // If path doesn't exist, return error
    if (!inode) {
      if (this.debug) console.log(`[FileSystem] Path not found: ${normalized}`);
      return ErrorCode.ENOENT;
    }
    
    // If path is a directory, return error
    if (inode.type === FileType.DIRECTORY) {
      if (this.debug) console.log(`[FileSystem] Use rmdir to delete directories: ${normalized}`);
      return ErrorCode.EISDIR;
    }
    
    // Cannot delete device files through unlink
    if (inode.type === FileType.DEVICE) {
      if (this.debug) console.log(`[FileSystem] Cannot delete device file: ${normalized}`);
      return ErrorCode.EPERM;
    }
    
    // Remove the file
    // 1. Remove from inodes
    this.inodes.delete(inode.id);
    
    // 2. Remove entry from parent directory
    const parentPath = this.getParentPath(normalized);
    const parentEntries = this.directories.get(parentPath) || [];
    const fileName = this.getBasename(normalized);
    const newEntries = parentEntries.filter(entry => entry.name !== fileName);
    this.directories.set(parentPath, newEntries);
    
    // 3. Update parent inode's modification time
    const parentInode = this.getInode(parentPath);
    if (parentInode) {
      parentInode.modifiedAt = Date.now();
    }
    
    // Save to storage (async but don't wait)
    this.saveToStorage().catch(err => {
      if (this.debug) console.error(`[FileSystem] Failed to save after unlinking file: ${normalized}`, err);
    });
    
    if (this.debug) console.log(`[FileSystem] Deleted file: ${normalized}`);
    return ErrorCode.SUCCESS;
  }
  
  /**
   * Delete a directory (like rmdir in Unix)
   * @param path Directory path to delete
   * @param recursive Whether to recursively delete contents (like rm -rf)
   * @returns Error code
   */
  async rmdir(path: string, recursive: boolean = false): Promise<ErrorCode> {
    if (!this.mounted) {
      return ErrorCode.ENODEV;
    }
    
    if (this.readOnly) {
      return ErrorCode.EROFS;
    }
    
    const normalized = this.normalizePath(path);
    
    // Cannot delete root directory
    if (normalized === '/') {
      if (this.debug) console.log(`[FileSystem] Cannot delete root directory`);
      return ErrorCode.EPERM;
    }
    
    // Check if path exists and is a directory
    if (!this.directories.has(normalized)) {
      if (this.debug) console.log(`[FileSystem] Directory not found: ${normalized}`);
      return ErrorCode.ENOENT;
    }
    
    // Check if directory is empty
    const entries = this.getDirectoryEntries(normalized) || [];
    if (entries.length > 0 && !recursive) {
      if (this.debug) console.log(`[FileSystem] Directory not empty: ${normalized}`);
      return ErrorCode.ENOTEMPTY;
    }
    
    // If recursive, delete all contents first
    if (recursive && entries.length > 0) {
      for (const entry of entries) {
        const entryPath = normalized === '/' ? `/${entry.name}` : `${normalized}/${entry.name}`;
        
        if (entry.type === FileType.DIRECTORY) {
          // Recursively delete subdirectory
          const rmdirResult = await this.rmdir(entryPath, true);
          if (rmdirResult !== ErrorCode.SUCCESS) {
            // If we can't delete a subdirectory, abort
            return rmdirResult;
          }
        } else {
          // Delete file
          const unlinkResult = this.unlink(entryPath);
          if (unlinkResult !== ErrorCode.SUCCESS) {
            // If we can't delete a file, abort
            return unlinkResult;
          }
        }
      }
    }
    
    // Get directory inode
    const dirInode = this.getInode(normalized);
    if (!dirInode) {
      // This shouldn't happen, but just in case
      if (this.debug) console.log(`[FileSystem] Directory inode not found: ${normalized}`);
      return ErrorCode.ENOENT;
    }
    
    // Remove the directory
    // 1. Remove from inodes
    this.inodes.delete(dirInode.id);
    
    // 2. Remove from directories
    this.directories.delete(normalized);
    
    // 3. Remove entry from parent directory
    const parentPath = this.getParentPath(normalized);
    const parentEntries = this.directories.get(parentPath) || [];
    const dirName = this.getBasename(normalized);
    const newEntries = parentEntries.filter(entry => entry.name !== dirName);
    this.directories.set(parentPath, newEntries);
    
    // 4. Update parent inode's modification time
    const parentInode = this.getInode(parentPath);
    if (parentInode) {
      parentInode.modifiedAt = Date.now();
    }
    
    // Save to storage (async but don't wait)
    this.saveToStorage().catch(err => {
      if (this.debug) console.error(`[FileSystem] Failed to save after rmdir: ${normalized}`, err);
    });
    
    if (this.debug) console.log(`[FileSystem] Deleted directory: ${normalized}`);
    return ErrorCode.SUCCESS;
  }
  
  /**
   * List directory contents (like ls in Unix)
   * @param path Directory path to list
   * @returns Array of directory entries or error code
   */
  readdir(path: string): [ErrorCode, DirectoryEntry[]] {
    if (!this.mounted) {
      return [ErrorCode.ENODEV, []];
    }
    
    const normalized = this.normalizePath(path);
    
    // Check if path exists and is a directory
    if (!this.directories.has(normalized)) {
      if (this.debug) console.log(`[FileSystem] Directory not found: ${normalized}`);
      return [ErrorCode.ENOENT, []];
    }
    
    // Get directory entries
    const entries = this.getDirectoryEntries(normalized) || [];
    
    // Update access time for directory inode
    const dirInode = this.getInode(normalized);
    if (dirInode) {
      dirInode.accessedAt = Date.now();
    }
    
    if (this.debug) console.log(`[FileSystem] Listed directory: ${normalized}`);
    return [ErrorCode.SUCCESS, entries];
  }
  
  /**
   * Mount a device at a path
   * @param path Mount point path
   * @param deviceId Device identifier
   * @returns Path result
   */
  async mount(path: string, deviceId: string): Promise<PathResult> {
    if (!this.mounted) {
      return {
        success: false,
        errorCode: ErrorCode.ENODEV,
        errorMessage: 'Filesystem not mounted',
        path
      };
    }
    
    if (this.readOnly) {
      return {
        success: false,
        errorCode: ErrorCode.EROFS,
        errorMessage: 'Filesystem is read-only',
        path
      };
    }
    
    const normalized = this.normalizePath(path);
    
    // Create mount point if it doesn't exist
    if (!this.exists(normalized)) {
      const parentPath = this.getParentPath(normalized);
      
      // Make sure parent directory exists
      if (!this.directories.has(parentPath)) {
        const mkdirResult = await this.mkdir(parentPath, true);
        if (!mkdirResult.success) {
          return mkdirResult;
        }
      }
      
      // Create device file
      const deviceInode: Inode = {
        id: this.generateInodeId(),
        type: FileType.DEVICE,
        path: normalized,
        size: 0,
        owner: 'root',
        group: 'root',
        permissions: {
          owner: { read: true, write: true, execute: false },
          group: { read: true, write: false, execute: false },
          others: { read: true, write: false, execute: false }
        },
        createdAt: Date.now(),
        modifiedAt: Date.now(),
        accessedAt: Date.now(),
        links: 1,
        device: deviceId
      };
      
      // Add device inode
      this.inodes.set(deviceInode.id, deviceInode);
      
      // Add entry to parent directory
      const deviceName = this.getBasename(normalized);
      const parentEntries = this.directories.get(parentPath) || [];
      parentEntries.push({
        name: deviceName,
        type: FileType.DEVICE,
        inodeId: deviceInode.id
      });
      this.directories.set(parentPath, parentEntries);
      
      // Save mount point
      this.mountPoints.set(normalized, deviceId);
      
      // Save to storage (async but don't wait)
      this.saveToStorage().catch(err => {
        if (this.debug) console.error(`[FileSystem] Failed to save after mounting device: ${normalized}`, err);
      });
      
      if (this.debug) console.log(`[FileSystem] Mounted device ${deviceId} at ${normalized}`);
      return { 
        success: true, 
        path: normalized,
        inode: deviceInode 
      };
    } else {
      // Path already exists, check if it's a device file
      const inode = this.getInode(normalized);
      if (!inode) {
        return {
          success: false,
          errorCode: ErrorCode.ENOENT,
          errorMessage: `Path not found: ${normalized}`,
          path: normalized
        };
      }
      
      if (inode.type !== FileType.DEVICE) {
        return {
          success: false,
          errorCode: ErrorCode.ENOTBLK,
          errorMessage: `Path exists but is not a device file: ${normalized}`,
          path: normalized
        };
      }
      
      // Update device ID
      inode.device = deviceId;
      inode.modifiedAt = Date.now();
      
      // Save mount point
      this.mountPoints.set(normalized, deviceId);
      
      // Save to storage (async but don't wait)
      this.saveToStorage().catch(err => {
        if (this.debug) console.error(`[FileSystem] Failed to save after updating device mount: ${normalized}`, err);
      });
      
      if (this.debug) console.log(`[FileSystem] Updated device mount ${deviceId} at ${normalized}`);
      return { 
        success: true, 
        path: normalized,
        inode 
      };
    }
  }
  
  /**
   * Unmount a device from a path
   * @param path Mount point path
   * @returns Path result
   */
  async umount(path: string): Promise<PathResult> {
    if (!this.mounted) {
      return {
        success: false,
        errorCode: ErrorCode.ENODEV,
        errorMessage: 'Filesystem not mounted',
        path
      };
    }
    
    if (this.readOnly) {
      return {
        success: false,
        errorCode: ErrorCode.EROFS,
        errorMessage: 'Filesystem is read-only',
        path
      };
    }
    
    const normalized = this.normalizePath(path);
    
    // Check if path exists and is a device file
    const inode = this.getInode(normalized);
    if (!inode) {
      return {
        success: false,
        errorCode: ErrorCode.ENOENT,
        errorMessage: `Path not found: ${normalized}`,
        path: normalized
      };
    }
    
    if (inode.type !== FileType.DEVICE) {
      return {
        success: false,
        errorCode: ErrorCode.ENOTBLK,
        errorMessage: `Path exists but is not a device file: ${normalized}`,
        path: normalized
      };
    }
    
    // Remove mount point
    this.mountPoints.delete(normalized);
    
    // Clear device ID
    inode.device = '';
    inode.modifiedAt = Date.now();
    
    // Save to storage (async but don't wait)
    this.saveToStorage().catch(err => {
      if (this.debug) console.error(`[FileSystem] Failed to save after unmounting device: ${normalized}`, err);
    });
    
    if (this.debug) console.log(`[FileSystem] Unmounted device from ${normalized}`);
    return { success: true, path: normalized };
  }
  
  /**
   * Get device ID for a mount point
   * @param path Mount point path
   * @returns Device ID or empty string if not a mount point
   */
  getDeviceId(path: string): string {
    if (!this.mounted) return '';
    
    const normalized = this.normalizePath(path);
    return this.mountPoints.get(normalized) || '';
  }
  
  /**
   * Check if a path is a mount point
   * @param path Path to check
   * @returns Boolean indicating if path is a mount point
   */
  isMountPoint(path: string): boolean {
    if (!this.mounted) return false;
    
    const normalized = this.normalizePath(path);
    return this.mountPoints.has(normalized);
  }
  
  /**
   * Get all mount points in the filesystem
   * @returns Map of mount points to device IDs
   */
  getMountPoints(): Map<string, string> {
    return new Map(this.mountPoints);
  }
  
  /**
   * Clear the filesystem (DANGEROUS)
   * @returns PathResult
   */
  async clear(): Promise<PathResult> {
    if (this.readOnly) {
      return {
        success: false,
        errorCode: ErrorCode.EROFS,
        errorMessage: 'Filesystem is read-only',
        path: '/'
      };
    }
    
    try {
      // Clear in-memory state
      this.inodes.clear();
      this.directories.clear();
      this.mountPoints.clear();
      
      // Clear storage
      await this.storage.clear();
      
      // Reset mounted state
      this.mounted = false;
      
      if (this.debug) console.log('[FileSystem] Filesystem cleared');
      
      // Re-initialize
      await this.mount();
      
      return { success: true, path: '/' };
    } catch (error) {
      const errorMessage = `Failed to clear filesystem: ${error instanceof Error ? error.message : String(error)}`;
      if (this.debug) console.error(`[FileSystem] ${errorMessage}`);
      return {
        success: false,
        errorCode: ErrorCode.EIO,
        errorMessage,
        path: '/'
      };
    }
  }
  
  /**
   * Check filesystem consistency
   * Called periodically in debug mode to validate filesystem state
   */
  checkFilesystemConsistency(): void {
    if (!this.debug || !this.mounted) return;
    
    const context = { component: 'FileSystem', operation: 'checkConsistency' };
    
    // Check that all inodes have corresponding directory entries
    for (const [path, inode] of this.inodes) {
      if (path === '/') continue; // Skip root
      
      const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
      const filename = path.substring(path.lastIndexOf('/') + 1);
      const parentEntries = this.directories.get(parentPath);
      
      this.invariants.check(
        parentEntries !== undefined,
        `Parent directory ${parentPath} missing for inode ${path}`,
        { ...context, path }
      );
      
      if (parentEntries) {
        this.invariants.check(
          parentEntries.some(e => e.name === filename),
          `Directory entry missing for inode ${path} in parent ${parentPath}`,
          { ...context, path, parentPath }
        );
      }
    }
    
    // Check that all directory entries have corresponding inodes
    for (const [dirPath, entries] of this.directories) {
      for (const entry of entries) {
        const fullPath = dirPath === '/' ? `/${entry.name}` : `${dirPath}/${entry.name}`;
        
        this.invariants.check(
          this.inodes.has(fullPath),
          `Inode missing for directory entry ${fullPath}`,
          { ...context, path: fullPath }
        );
      }
    }
    
    // Check mount points consistency
    for (const [mountPath, deviceId] of this.mountPoints) {
      const inode = this.inodes.get(mountPath);
      
      this.invariants.check(
        inode !== undefined,
        `Mount point ${mountPath} has no inode`,
        { ...context, path: mountPath, entity: deviceId }
      );
      
      if (inode) {
        this.invariants.check(
          inode.type === FileType.DEVICE,
          `Mount point ${mountPath} is not a device (type: ${inode.type})`,
          { ...context, path: mountPath, entity: deviceId }
        );
      }
    }
    
    // Check root directory exists
    this.invariants.check(
      this.inodes.has('/'),
      'Root directory inode missing',
      context
    );
    
    // Check root directory entries exist
    this.invariants.check(
      this.directories.has('/'),
      'Root directory entries missing',
      context
    );
  }
}