/**
 * Database Capability - Refactored to follow "do one thing well" principle
 *
 * This module implements a Unix-style capability for database access.
 * It delegates path-specific operations to specialized handlers.
 */

import type { Capability, Entity } from '../../kernel/types';
import { ErrorCode, OpenMode } from '../../kernel/types';
import type { CapabilityOptions } from '../BaseCapability';
import type { DatabaseDriver, DatabasePath } from './DatabaseDriver';
import { DatabaseOperation } from './DatabaseDriver';
import { SupabaseDatabaseDriver } from './SupabaseDatabaseDriver';
import type { SchemaDescriptor } from './SchemaDescriptor';
import { CharacterPathHandler, EntityPathHandler, SchemaPathHandler } from './handlers';
import { logger } from '$lib/utils/Logger';

/**
 * Options for the database capability
 */
export interface DatabaseCapabilityOptions extends CapabilityOptions {
	/** Custom database driver */
	driver?: DatabaseDriver;
}

/**
 * Database capability implementation - orchestrates path handlers
 */
export class DatabaseCapabilityRefactored implements Capability {
	/** Capability identifier */
	readonly id: string = 'database';

	/** Capability version */
	readonly version: string;

	/** Debug mode flag */
	private debug: boolean;

	/** Database driver */
	private driver: DatabaseDriver;

	/** Map of open file descriptors */
	private openFiles: Map<number, number> = new Map();

	/** Reference to the kernel (set when mounted) */
	private kernel: any = null;

	/** Path handlers */
	private characterHandler: CharacterPathHandler;
	private entityHandler: EntityPathHandler;
	private schemaHandler: SchemaPathHandler;

	/**
	 * Create a new database capability
	 * @param options Capability options
	 */
	constructor(options: DatabaseCapabilityOptions = {}) {
		this.version = options.version || '1.0.0';
		this.debug = options.debug || false;

		if (!options.driver) {
			throw new Error(
				'DatabaseCapability requires a driver. Use kernel.mount("/v_dev/db", new DatabaseCapability({ driver }))'
			);
		}

		this.driver = options.driver;

		// Initialize path handlers
		this.characterHandler = new CharacterPathHandler(this.driver, this.debug);
		this.entityHandler = new EntityPathHandler(this.driver, this.debug);
		this.schemaHandler = new SchemaPathHandler(this.driver, this.debug);

		this.log('Database capability initialized');
	}

	/**
	 * Mount the capability to the kernel
	 * @param kernel Kernel instance
	 */
	onMount(kernel: any): void {
		this.kernel = kernel;
		this.log('Database capability mounted');

		// Initialize directory structure
		this.initializeDirectoryStructure();
	}

	/**
	 * Initialize the directory structure for database resources
	 */
	private initializeDirectoryStructure(): void {
		if (!this.kernel) {
			this.error('Kernel not available for directory initialization');
			return;
		}

		// Directory structure follows our file path mapping
		const directories = [
			// Core directories
			'/v_proc',
			'/v_entity',
			'/v_etc',
			'/v_dev',

			// Proc subdirectories
			'/v_proc/character',
			'/v_proc/ability',

			// Entity subdirectories
			'/v_entity',

			// Schema directories
			'/v_etc/schema',
			'/v_etc/schema/ability',
			'/v_etc/schema/class',
			'/v_etc/schema/feat',
			'/v_etc/schema/skill',

			// Device files directory
			'/v_dev'
		];

		// Create each directory
		for (const dir of directories) {
			if (!this.kernel.exists(dir)) {
				this.log(`Creating directory: ${dir}`);
				const result = this.kernel.mkdir(dir, true);

				if (!result.success) {
					this.error(`Failed to create directory ${dir}: ${result.errorMessage}`);
				}
			}
		}

		this.log('Directory structure initialized');
	}

	/**
	 * Shut down the capability
	 */
	async shutdown(): Promise<void> {
		// Close all open files
		for (const [fd, dbFd] of this.openFiles.entries()) {
			await this.driver.close(dbFd);
		}

		this.openFiles.clear();
		this.log('Database capability shut down');
	}

	/**
	 * Handle open operation
	 */
	async onOpen(path: string, mode: number, ctx: any): Promise<number> {
		try {
			this.log(`Opening ${path} with mode ${mode}`);

			// Open the database resource
			const dbFd = await this.driver.open(path, mode);

			if (dbFd < 0) {
				this.error(`Failed to open ${path}: ${dbFd}`);
				return dbFd;
			}

			// Store mapping from capability FD to database driver FD
			const fd = ctx.allocateFd(path, mode);
			this.openFiles.set(fd, dbFd);

			this.log(`Opened ${path} as fd ${fd} (db fd ${dbFd})`);
			return fd;
		} catch (error) {
			this.error(`Error opening ${path}:`, error);
			return ErrorCode.EIO;
		}
	}

	/**
	 * Handle read operation - delegates to path handlers
	 */
	async onRead(fd: number, buffer: any, ctx: any): Promise<number> {
		try {
			this.log(`Reading from fd ${fd}`);

			// Get the database FD
			const dbFd = this.openFiles.get(fd);
			if (dbFd === undefined) {
				this.error(`Invalid file descriptor: ${fd}`);
				return ErrorCode.EBADF;
			}

			// Get file info from context if available
			const fileInfo = ctx.openFiles?.get(fd);
			const path = fileInfo?.path || '';

			// Delegate to appropriate handler based on path
			if (path.startsWith('/v_proc/character/')) {
				const result = await this.characterHandler.handleRead(path, buffer, dbFd);
				if (result !== undefined) {
					return result;
				}
			} else if (path.startsWith('/v_entity/')) {
				const result = await this.entityHandler.handleRead(path, buffer, dbFd);
				if (result !== undefined) {
					return result;
				}
			} else if (path.startsWith('/v_etc/schema/')) {
				const result = await this.schemaHandler.handleRead(path, buffer, dbFd);
				if (result !== undefined) {
					return result;
				}
			}

			// Default behavior: read from the database
			const result = await this.driver.read(dbFd, buffer);

			if (result !== 0) {
				this.error(`Failed to read from fd ${fd}: ${result}`);
			} else {
				this.log(`Read from fd ${fd} successful`);
			}

			return result;
		} catch (error) {
			this.error(`Error reading from fd ${fd}:`, error);
			return ErrorCode.EIO;
		}
	}

	/**
	 * Handle write operation - delegates to path handlers
	 */
	async onWrite(fd: number, buffer: any, ctx: any): Promise<number> {
		try {
			this.log(`Writing to fd ${fd}`);

			// Get the database FD
			const dbFd = this.openFiles.get(fd);
			if (dbFd === undefined) {
				this.error(`Invalid file descriptor: ${fd}`);
				return ErrorCode.EBADF;
			}

			// Get file info from context if available
			const fileInfo = ctx.openFiles?.get(fd);
			const path = fileInfo?.path || '';

			// Delegate to appropriate handler based on path
			if (path.startsWith('/v_proc/character/')) {
				const result = await this.characterHandler.handleWrite(path, buffer, dbFd);
				if (result !== undefined) {
					return result;
				}
			} else if (path.startsWith('/v_entity/')) {
				const result = await this.entityHandler.handleWrite(path, buffer, dbFd);
				if (result !== undefined) {
					return result;
				}
			} else if (path.startsWith('/v_etc/schema/')) {
				const result = await this.schemaHandler.handleWrite(path, buffer, dbFd);
				if (result !== undefined) {
					return result;
				}
			}

			// Default behavior: write to the database
			const result = await this.driver.write(dbFd, buffer);

			if (result !== 0) {
				this.error(`Failed to write to fd ${fd}: ${result}`);
			} else {
				this.log(`Write to fd ${fd} successful`);
			}

			return result;
		} catch (error) {
			this.error(`Error writing to fd ${fd}:`, error);
			return ErrorCode.EIO;
		}
	}

	/**
	 * Handle close operation
	 */
	async onClose(fd: number, ctx: any): Promise<number> {
		try {
			this.log(`Closing fd ${fd}`);

			// Get the database FD
			const dbFd = this.openFiles.get(fd);
			if (dbFd === undefined) {
				this.error(`Invalid file descriptor: ${fd}`);
				return ErrorCode.EBADF;
			}

			// Close the database resource
			const result = await this.driver.close(dbFd);

			// Remove the FD mapping
			this.openFiles.delete(fd);

			if (result !== 0) {
				this.error(`Failed to close fd ${fd}: ${result}`);
			} else {
				this.log(`Closed fd ${fd} successfully`);
			}

			return result;
		} catch (error) {
			this.error(`Error closing fd ${fd}:`, error);
			return ErrorCode.EIO;
		}
	}

	/**
	 * Handle I/O control operation
	 */
	async ioctl(fd: number, request: number, arg: any): Promise<number> {
		try {
			this.log(`IOCTL on fd ${fd}, request ${request}`);

			// Handle common operations
			if (request === DatabaseOperation.READ) {
				// Handle read operation
				this.log(`Database read operation: ${JSON.stringify(arg)}`);

				if (arg.resource === 'character' && arg.id) {
					// Get character by ID
					try {
						const buffer = arg.buffer || {};
						const character = await this.driver.getCharacterById(arg.id, arg.query || '*');

						if (character) {
							buffer.data = character;
							return 0; // Success
						} else {
							return ErrorCode.ENOENT; // Not found
						}
					} catch (error) {
						this.error(`Error fetching character: ${error}`);
						return ErrorCode.EIO;
					}
				}
			} else if (request === DatabaseOperation.QUERY) {
				// Handle query operation
				this.log(`Database query operation: ${JSON.stringify(arg)}`);

				if (arg.resource) {
					try {
						const result = await this.driver.query(arg.resource, arg.filter, arg.query);
						if (arg.buffer) {
							arg.buffer.data = result;
						}
						return 0; // Success
					} catch (error) {
						this.error(`Error executing query: ${error}`);
						return ErrorCode.EIO;
					}
				}
			}

			// If we have a context object with file descriptors, use the onIoctl method
			if (arguments.length > 3 && arguments[3]) {
				return this.onIoctl(fd, request, arg, arguments[3]);
			}

			// For direct device operations
			if (this.driver && typeof this.driver.ioctl === 'function') {
				try {
					// Pass through to driver
					return await this.driver.ioctl(fd, request, arg);
				} catch (error) {
					this.error(`Error in driver ioctl: ${error}`);
					return ErrorCode.EIO;
				}
			}

			return 0; // Default success for operations we don't specifically handle
		} catch (error) {
			this.error(`Error in IOCTL on fd ${fd}:`, error);
			return ErrorCode.EIO;
		}
	}

	/**
	 * Original onIoctl implementation - delegates to path handlers
	 */
	async onIoctl(fd: number, request: number, arg: any, ctx: any): Promise<number> {
		try {
			this.log(`onIoctl called with fd ${fd}, request ${request}`);

			// Get the database FD
			const dbFd = this.openFiles.get(fd);
			if (dbFd === undefined) {
				this.error(`Invalid file descriptor: ${fd}`);
				return ErrorCode.EBADF;
			}

			// Get file info from context if available
			const fileInfo = ctx.openFiles?.get(fd);
			const path = fileInfo?.path || '';

			// Delegate to appropriate handler based on path
			if (path.startsWith('/v_proc/character/')) {
				const result = await this.characterHandler.handleIoctl(fd, path, request, arg, dbFd);
				if (result !== undefined) {
					return result;
				}
			} else if (path.startsWith('/v_entity/')) {
				const result = await this.entityHandler.handleIoctl(fd, path, request, arg, dbFd);
				if (result !== undefined) {
					return result;
				}
			} else if (path === '/v_dev/db') {
				// Special DB device operations
				if (request === DatabaseOperation.QUERY) {
					// Execute custom query
					if (!arg.query) {
						this.error('No query provided for query operation');
						return ErrorCode.EINVAL;
					}
					return await this.driver.ioctl(dbFd, request, arg);
				}
			}

			// Forward to the database driver for standard operations
			const result = await this.driver.ioctl(dbFd, request, arg);

			if (result !== 0) {
				this.error(`Failed IOCTL on fd ${fd}: ${result}`);
			} else {
				this.log(`IOCTL on fd ${fd} successful`);
			}

			return result;
		} catch (error) {
			this.error(`Error in onIoctl for fd ${fd}:`, error);
			return ErrorCode.EIO;
		}
	}

	/**
	 * Register a schema with the database driver
	 */
	registerSchema(resourceType: string, schema: SchemaDescriptor): void {
		if (this.driver instanceof SupabaseDatabaseDriver) {
			this.driver.registerSchema(resourceType, schema);
			this.log(`Registered schema for ${resourceType}`);
		} else {
			this.error(`Cannot register schema: driver does not support schema registration`);
		}
	}

	/**
	 * Direct query method for capabilities who need to bypass the device file system
	 */
	async query(resourceType: string, filter?: any, queryStr: string = '*'): Promise<any[]> {
		try {
			this.log(`Direct query on ${resourceType} with filter:`, filter);

			if (!this.driver || typeof this.driver.query !== 'function') {
				this.error(`Driver does not support direct query`);
				return [];
			}

			const results = await this.driver.query(resourceType, filter, queryStr);
			return results;
		} catch (error) {
			this.error(`Error in direct query:`, error);
			return [];
		}
	}

	private log(message: string, data?: any): void {
		if (this.debug) {
			logger.debug('DatabaseCapability', 'log', message, data);
		}
	}

	private error(message: string, error?: any): void {
		logger.error('DatabaseCapability', 'error', message, { error });
	}
}
