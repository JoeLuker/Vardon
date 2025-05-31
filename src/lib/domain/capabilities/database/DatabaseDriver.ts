/**
 * Database Driver Interface
 *
 * This module defines the interface for database access following Unix filesystem principles.
 * In Unix, all devices are treated as files with a consistent interface (open, read, write, close).
 * Similarly, we abstract database access behind the same interface pattern.
 */

import type { ErrorCode } from '../../kernel/types';

/**
 * Response from a database read operation
 */
export interface DatabaseReadResult<T> {
	/** Error code (0 for success) */
	code: number;

	/** Data returned if successful */
	data?: T;
}

/**
 * Database path descriptor, similar to a file path in Unix
 * e.g., /db/character/1/ability/strength
 */
export interface DatabasePath {
	/** Resource type (e.g., 'character', 'ability') */
	resource: string;

	/** Resource ID (e.g., '1', 'strength') */
	id: string;

	/** Sub-resource type (optional, e.g., 'ability') */
	subResource?: string;

	/** Sub-resource ID (optional, e.g., 'strength') */
	subId?: string;
}

/**
 * Database driver interface that mimics Unix file operations
 */
export interface DatabaseDriver {
	/**
	 * Parse a path string into a DatabasePath object
	 * @param path Path string (e.g., "/db/character/1/ability/strength")
	 * @returns Parsed DatabasePath object
	 */
	parsePath(path: string): DatabasePath;

	/**
	 * Open a database resource and get a file descriptor
	 * @param path Resource path
	 * @param mode Open mode (read, write, etc.)
	 * @returns File descriptor (non-negative) or error code (negative)
	 */
	open(path: string, mode: number): Promise<number>;

	/**
	 * Read data from an opened database resource
	 * @param fd File descriptor from open()
	 * @param buffer Buffer to write data into (passed by reference)
	 * @returns Error code (0 for success)
	 */
	read<T>(fd: number, buffer: T): Promise<number>;

	/**
	 * Write data to an opened database resource
	 * @param fd File descriptor from open()
	 * @param buffer Data to write
	 * @returns Error code (0 for success)
	 */
	write<T>(fd: number, buffer: T): Promise<number>;

	/**
	 * Close an opened database resource
	 * @param fd File descriptor from open()
	 * @returns Error code (0 for success)
	 */
	close(fd: number): Promise<number>;

	/**
	 * Perform a control operation on a database resource
	 * @param fd File descriptor
	 * @param request Request code
	 * @param arg Arguments for the control operation
	 * @returns Error code (0 for success)
	 */
	ioctl(fd: number, request: number, arg: any): Promise<number>;

	/**
	 * Check if a database resource exists
	 * @param path Resource path
	 * @returns True if resource exists, false otherwise
	 */
	exists(path: string): Promise<boolean>;

	/**
	 * Direct query method (optional)
	 * This enables direct database access without going through file operations
	 * @param resourceType Resource type (table name)
	 * @param filter Optional filter criteria
	 * @param queryStr Optional query string
	 * @returns Matching resources
	 */
	query?(resourceType: string, filter?: any, queryStr?: string): Promise<any[]>;

	/**
	 * Get a character by ID (optional)
	 * This enables direct access to character data without file operations
	 * @param id Character ID
	 * @param query Optional query string
	 * @returns Character data
	 */
	getCharacterById?(id: number, query?: string): Promise<any>;
}

/**
 * Standard database capability operations
 */
export enum DatabaseOperation {
	/** Get all records of a type */
	GET_ALL = 1,

	/** Get a single record by ID */
	GET_BY_ID = 2,

	/** Create a new record */
	CREATE = 3,

	/** Update an existing record */
	UPDATE = 4,

	/** Delete a record */
	DELETE = 5,

	/** Query records with filters */
	QUERY = 6
}

/**
 * Standard error codes for database operations
 */
export enum DatabaseErrorCode {
	/** Success (no error) */
	SUCCESS = 0,

	/** Generic database error */
	DB_ERROR = -1000,

	/** Resource not found */
	NOT_FOUND = -1001,

	/** Permission denied */
	PERMISSION_DENIED = -1002,

	/** Duplicate resource */
	DUPLICATE = -1003,

	/** Validation failed */
	VALIDATION_FAILED = -1004,

	/** Connection error */
	CONNECTION_ERROR = -1005,

	/** Transaction error */
	TRANSACTION_ERROR = -1006,

	/** Invalid operation */
	INVALID_OPERATION = -1007
}

/**
 * Convert a database error code to a standard error code
 * @param dbErrorCode Database-specific error code
 * @returns Standard error code
 */
export function convertErrorCode(dbErrorCode: DatabaseErrorCode): ErrorCode {
	switch (dbErrorCode) {
		case DatabaseErrorCode.SUCCESS:
			return ErrorCode.SUCCESS;
		case DatabaseErrorCode.NOT_FOUND:
			return ErrorCode.ENOENT;
		case DatabaseErrorCode.PERMISSION_DENIED:
			return ErrorCode.EACCES;
		case DatabaseErrorCode.DUPLICATE:
			return ErrorCode.EEXIST;
		case DatabaseErrorCode.VALIDATION_FAILED:
			return ErrorCode.EINVAL;
		case DatabaseErrorCode.CONNECTION_ERROR:
			return ErrorCode.EIO;
		case DatabaseErrorCode.TRANSACTION_ERROR:
			return ErrorCode.EIO;
		case DatabaseErrorCode.INVALID_OPERATION:
			return ErrorCode.ENOTSUP;
		case DatabaseErrorCode.DB_ERROR:
		default:
			return ErrorCode.EIO;
	}
}
