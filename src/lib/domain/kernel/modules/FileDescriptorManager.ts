import type { FileDescriptor, OpenMode } from '../types';
import { ErrorCode } from '../types';

/**
 * Manages file descriptors (Unix-style FD table)
 */
export class FileDescriptorManager {
	private readonly fileDescriptors: Map<number, FileDescriptor> = new Map();
	private nextFd: number = 3; // 0=stdin, 1=stdout, 2=stderr
	private readonly debug: boolean;
	private readonly maxOpenFds: number = 1024;

	constructor(debug: boolean = false) {
		this.debug = debug;
		this.initializeStandardFileDescriptors();
	}

	/**
	 * Initialize standard file descriptors
	 */
	private initializeStandardFileDescriptors(): void {
		// stdin (0)
		this.fileDescriptors.set(0, {
			fd: 0,
			path: '/dev/stdin',
			mode: OpenMode.READ,
			position: 0,
			devicePath: '/dev/stdin'
		});

		// stdout (1)
		this.fileDescriptors.set(1, {
			fd: 1,
			path: '/dev/stdout',
			mode: OpenMode.WRITE,
			position: 0,
			devicePath: '/dev/stdout'
		});

		// stderr (2)
		this.fileDescriptors.set(2, {
			fd: 2,
			path: '/dev/stderr',
			mode: OpenMode.WRITE,
			position: 0,
			devicePath: '/dev/stderr'
		});
	}

	/**
	 * Allocate a new file descriptor
	 */
	allocate(path: string, mode: OpenMode, devicePath?: string): number {
		// Check if we've reached the limit
		if (this.fileDescriptors.size >= this.maxOpenFds) {
			if (this.debug) {
				console.error(`[FileDescriptorManager] Too many open files (limit: ${this.maxOpenFds})`);
			}
			return -ErrorCode.EMFILE;
		}

		const fd = this.nextFd++;
		const descriptor: FileDescriptor = {
			fd,
			path,
			mode,
			position: 0,
			devicePath
		};

		this.fileDescriptors.set(fd, descriptor);

		if (this.debug) {
			console.log(`[FileDescriptorManager] Allocated fd ${fd} for ${path} (mode: ${mode})`);
		}

		return fd;
	}

	/**
	 * Get file descriptor
	 */
	get(fd: number): FileDescriptor | undefined {
		return this.fileDescriptors.get(fd);
	}

	/**
	 * Update file descriptor position
	 */
	updatePosition(fd: number, position: number): ErrorCode {
		const descriptor = this.fileDescriptors.get(fd);
		if (!descriptor) {
			return ErrorCode.EBADF;
		}

		descriptor.position = position;
		return ErrorCode.SUCCESS;
	}

	/**
	 * Close file descriptor
	 */
	close(fd: number): ErrorCode {
		// Don't allow closing standard file descriptors
		if (fd >= 0 && fd <= 2) {
			return ErrorCode.EINVAL;
		}

		const descriptor = this.fileDescriptors.get(fd);
		if (!descriptor) {
			return ErrorCode.EBADF;
		}

		this.fileDescriptors.delete(fd);

		if (this.debug) {
			console.log(`[FileDescriptorManager] Closed fd ${fd} (${descriptor.path})`);
		}

		return ErrorCode.SUCCESS;
	}

	/**
	 * Check if file descriptor exists
	 */
	exists(fd: number): boolean {
		return this.fileDescriptors.has(fd);
	}

	/**
	 * Get all file descriptors for a path
	 */
	getDescriptorsForPath(path: string): FileDescriptor[] {
		const descriptors: FileDescriptor[] = [];
		for (const descriptor of this.fileDescriptors.values()) {
			if (descriptor.path === path) {
				descriptors.push(descriptor);
			}
		}
		return descriptors;
	}

	/**
	 * Check if any file descriptors are open for a path
	 */
	hasOpenDescriptors(path: string): boolean {
		for (const descriptor of this.fileDescriptors.values()) {
			if (descriptor.path === path) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Get open file descriptor count
	 */
	getOpenCount(): number {
		// Subtract 3 for stdin, stdout, stderr
		return this.fileDescriptors.size - 3;
	}

	/**
	 * Get all file descriptors (for debugging)
	 */
	getAllDescriptors(): Map<number, FileDescriptor> {
		return new Map(this.fileDescriptors);
	}
}
