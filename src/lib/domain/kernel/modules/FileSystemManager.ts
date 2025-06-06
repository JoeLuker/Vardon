import type { Inode, PathResult, ErrorCode, Stats } from '../types';
import { VIRTUAL_PATHS } from '../PathConstants';

/**
 * Manages the virtual filesystem operations
 */
export class FileSystemManager {
	private readonly inodes: Map<string, Inode> = new Map();
	private readonly directories: Set<string> = new Set();
	private readonly debug: boolean;

	constructor(debug: boolean = false) {
		this.debug = debug;
		this.initializeFilesystem();
	}

	/**
	 * Initialize the filesystem structure
	 * Creates all standard directories in a Unix-like hierarchy
	 */
	private initializeFilesystem(): void {
		// Create root directory
		this.directories.add('/');

		// Create standard top-level directories (like a Unix filesystem)
		this.mkdir(VIRTUAL_PATHS.DEV); // Device files
		this.mkdir(VIRTUAL_PATHS.PROC); // Process information
		this.mkdir(VIRTUAL_PATHS.ENTITY); // Entity files
		this.mkdir(VIRTUAL_PATHS.ETC); // Configuration
		this.mkdir(VIRTUAL_PATHS.BIN); // Executable plugins
		this.mkdir(VIRTUAL_PATHS.VAR); // Variable data
		this.mkdir(VIRTUAL_PATHS.TMP); // Temporary files
		this.mkdir(VIRTUAL_PATHS.HOME); // User home directories

		// Create standard subdirectories
		this.mkdir(VIRTUAL_PATHS.PROC_CHARACTER); // Character processes
		this.mkdir(VIRTUAL_PATHS.PROC_PLUGINS); // Plugin process information
		this.mkdir(VIRTUAL_PATHS.PROC_SIGNALS); // Plugin signals
		this.mkdir(VIRTUAL_PATHS.ETC_PLUGINS); // Plugin configuration
		this.mkdir(VIRTUAL_PATHS.VAR_LOG); // Log files
		this.mkdir(VIRTUAL_PATHS.VAR_RUN); // Runtime data

		// Create message queue directory
		this.mkdir(VIRTUAL_PATHS.PIPES); // Named pipes directory

		// Create device-specific directories
		this.mkdir(VIRTUAL_PATHS.DEV_ABILITY); // Ability device directory
		this.mkdir(VIRTUAL_PATHS.DEV_SKILL); // Skill device directory
		this.mkdir(VIRTUAL_PATHS.DEV_COMBAT); // Combat device directory
		this.mkdir(VIRTUAL_PATHS.DEV_CONDITION); // Condition device directory
		this.mkdir(VIRTUAL_PATHS.DEV_BONUS); // Bonus device directory
		this.mkdir(VIRTUAL_PATHS.DEV_CHARACTER); // Character device directory

		// Create app-specific directories
		this.mkdir(VIRTUAL_PATHS.SYS); // System directory
		this.mkdir(VIRTUAL_PATHS.SYS_CLASS); // Class definitions
		this.mkdir(VIRTUAL_PATHS.SYS_DEVICES); // Device specifications

		if (this.debug) {
			console.log('[FileSystemManager] Filesystem initialized');
		}
	}

	/**
	 * Create a directory (like mkdir -p)
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

		if (this.debug) {
			console.log(`[FileSystemManager] Created directory: ${path}`);
		}

		return { success: true, path };
	}

	/**
	 * Check if a path exists
	 */
	exists(path: string): boolean {
		return this.directories.has(path) || this.inodes.has(path);
	}

	/**
	 * Check if a path is a directory
	 */
	isDirectory(path: string): boolean {
		return this.directories.has(path);
	}

	/**
	 * Get inode for a path
	 */
	getInode(path: string): Inode | undefined {
		return this.inodes.get(path);
	}

	/**
	 * Set inode for a path
	 */
	setInode(path: string, inode: Inode): void {
		this.inodes.set(path, inode);
	}

	/**
	 * Delete inode for a path
	 */
	deleteInode(path: string): boolean {
		return this.inodes.delete(path);
	}

	/**
	 * List directory contents
	 */
	readdir(path: string): string[] {
		if (!this.directories.has(path)) {
			return [];
		}

		const entries: string[] = [];
		const prefix = path === '/' ? '' : path;

		// Find all direct children
		for (const p of this.directories) {
			if (p !== path && p.startsWith(prefix + '/')) {
				const relative = p.substring(prefix.length + 1);
				if (!relative.includes('/')) {
					entries.push(relative);
				}
			}
		}

		for (const p of this.inodes.keys()) {
			if (p.startsWith(prefix + '/')) {
				const relative = p.substring(prefix.length + 1);
				if (!relative.includes('/')) {
					entries.push(relative);
				}
			}
		}

		return [...new Set(entries)].sort();
	}

	/**
	 * Get file stats
	 */
	stat(path: string): Stats | null {
		const inode = this.inodes.get(path);
		if (inode) {
			return {
				size: JSON.stringify(inode.data || {}).length,
				mode: inode.mode,
				mtime: inode.mtime,
				ctime: inode.ctime,
				isDirectory: () => false,
				isFile: () => true
			};
		}

		if (this.directories.has(path)) {
			return {
				size: 0,
				mode: 0o755,
				mtime: Date.now(),
				ctime: Date.now(),
				isDirectory: () => true,
				isFile: () => false
			};
		}

		return null;
	}

	/**
	 * Create or update a file
	 */
	createFile(path: string, data: any, mode: number = 0o644): PathResult {
		if (!path.startsWith('/')) {
			return {
				success: false,
				errorCode: ErrorCode.EINVAL,
				errorMessage: 'Path must be absolute',
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

		const now = Date.now();
		const inode: Inode = {
			data,
			mode,
			ctime: now,
			mtime: now
		};

		this.inodes.set(path, inode);

		return { success: true, path };
	}

	/**
	 * Delete a file
	 */
	deleteFile(path: string): ErrorCode {
		if (!path.startsWith('/')) {
			return ErrorCode.EINVAL;
		}

		if (!this.inodes.has(path)) {
			return ErrorCode.ENOENT;
		}

		this.inodes.delete(path);
		return ErrorCode.SUCCESS;
	}

	/**
	 * Get all inodes (for debugging)
	 */
	getAllInodes(): Map<string, Inode> {
		return new Map(this.inodes);
	}

	/**
	 * Get all directories (for debugging)
	 */
	getAllDirectories(): Set<string> {
		return new Set(this.directories);
	}
}
