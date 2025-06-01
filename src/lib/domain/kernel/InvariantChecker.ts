import type { ErrorCode } from './types';

export interface InvariantContext {
	component: string;
	operation: string;
	path?: string;
	fd?: number;
	entity?: string;
	metadata?: Record<string, any>;
}

export interface InvariantViolation {
	message: string;
	context: InvariantContext;
	timestamp: number;
	stackTrace?: string;
}

export class InvariantChecker {
	private enabled: boolean;
	private violations: InvariantViolation[] = [];
	private readonly maxViolations = 100;

	constructor(debug: boolean) {
		this.enabled = debug;
	}

	/**
	 * Check an invariant condition. In debug mode, throws on violation.
	 * In production, logs but continues execution.
	 */
	check(condition: boolean, message: string, context: InvariantContext): void {
		if (!condition) {
			const violation: InvariantViolation = {
				message,
				context,
				timestamp: Date.now(),
				stackTrace: this.enabled ? new Error().stack : undefined
			};

			this.violations.push(violation);
			if (this.violations.length > this.maxViolations) {
				this.violations.shift(); // Keep only recent violations
			}

			const errorMessage = `INVARIANT VIOLATION [${context.component}:${context.operation}]: ${message}`;
			console.error(errorMessage, context);

			if (this.enabled) {
				// In debug mode, throw to catch issues early
				throw new Error(errorMessage);
			}
		}
	}

	/**
	 * Check multiple related invariants as a group
	 */
	checkGroup(
		checks: Array<{ condition: boolean; message: string }>,
		context: InvariantContext
	): void {
		for (const { condition, message } of checks) {
			this.check(condition, message, context);
		}
	}

	/**
	 * Unix-specific invariant checks
	 */
	checkPath(path: string, context: InvariantContext): void {
		this.check(path.startsWith('/'), `Path must be absolute, got: ${path}`, { ...context, path });

		this.check(!path.includes('//'), `Path must not contain double slashes: ${path}`, {
			...context,
			path
		});

		this.check(
			!path.endsWith('/') || path === '/',
			`Path must not end with slash (except root): ${path}`,
			{ ...context, path }
		);
	}

	checkFileDescriptor(fd: number, context: InvariantContext): void {
		this.check(
			Number.isInteger(fd) && fd >= 0,
			`File descriptor must be non-negative integer, got: ${fd}`,
			{ ...context, fd }
		);
	}

	checkEntityPath(path: string, context: InvariantContext): void {
		this.checkPath(path, context);
		this.check(
			path.startsWith('/v_entity/') || path.startsWith('/proc/character/'),
			`Entity path must start with /v_entity/ or /v_proc/character/, got: ${path}`,
			{ ...context, path }
		);
	}

	checkCapabilityPath(path: string, context: InvariantContext): void {
		this.checkPath(path, context);
		this.check(
			path.startsWith('/v_dev/'),
			`Capability mount path must start with /v_dev/, got: ${path}`,
			{ ...context, path }
		);
	}

	/**
	 * System-wide invariant checks
	 */
	checkFileDescriptorLeak(openFds: number, maxFds: number, context: InvariantContext): void {
		this.check(
			openFds <= maxFds,
			`File descriptor leak detected: ${openFds} open (max: ${maxFds})`,
			{ ...context, metadata: { openFds, maxFds } }
		);
	}

	checkMountPointConflict(
		existingMount: string | undefined,
		newMount: string,
		context: InvariantContext
	): void {
		this.check(
			!existingMount,
			`Mount point conflict: ${newMount} already mounted at ${existingMount}`,
			{ ...context, metadata: { existingMount, newMount } }
		);
	}

	/**
	 * Get all recorded violations
	 */
	getViolations(): InvariantViolation[] {
		return [...this.violations];
	}

	/**
	 * Clear violation history
	 */
	clearViolations(): void {
		this.violations = [];
	}

	/**
	 * Check if any violations have occurred
	 */
	hasViolations(): boolean {
		return this.violations.length > 0;
	}

	/**
	 * Enable or disable invariant checking at runtime
	 */
	setEnabled(enabled: boolean): void {
		this.enabled = enabled;
	}

	/**
	 * Get current enabled state
	 */
	isEnabled(): boolean {
		return this.enabled;
	}
}

/**
 * Common invariant checks for Unix architecture
 */
export const UnixInvariants = {
	/**
	 * Check that a parent directory exists for a given path
	 */
	parentExists(path: string, fileSystem: any): boolean {
		if (path === '/') return true;
		const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
		return fileSystem.exists(parentPath);
	},

	/**
	 * Check that a path doesn't already exist as a different type
	 */
	noTypeConflict(path: string, expectedType: 'file' | 'directory', fileSystem: any): boolean {
		const inode = fileSystem.getInode(path);
		if (!inode) return true; // No conflict if doesn't exist
		return inode.type === expectedType;
	},

	/**
	 * Check that a file descriptor has the required permissions
	 */
	hasPermission(mode: number, requiredMode: number): boolean {
		// For READ_WRITE mode, both READ and WRITE operations are allowed
		if (mode === 2) return true; // READ_WRITE allows all operations
		return mode === requiredMode;
	}
};
