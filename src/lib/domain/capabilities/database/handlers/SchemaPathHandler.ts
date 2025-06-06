/**
 * Schema Path Handler - Handles /v_etc/schema/* paths
 *
 * Following Unix principle: do one thing well
 * This handler is responsible for schema-specific path operations
 */

import { ErrorCode } from '../../../kernel/types';
import { DatabaseOperation } from '../DatabaseDriver';
import type { DatabaseDriver } from '../DatabaseDriver';
import { logger } from '$lib/utils/Logger';

export class SchemaPathHandler {
	private driver: DatabaseDriver;
	private debug: boolean;

	constructor(driver: DatabaseDriver, debug: boolean = false) {
		this.driver = driver;
		this.debug = debug;
	}

	/**
	 * Handle schema-specific read operations
	 */
	async handleRead(path: string, buffer: any, dbFd: number): Promise<number | undefined> {
		// Parse schema path: /v_etc/schema/{type}/...
		const pathParts = path.split('/').filter(Boolean);

		// Need at least "/v_etc/schema/{type}"
		if (pathParts.length < 3) {
			return undefined;
		}

		const schemaType = pathParts[2];
		const schemaId = pathParts.length > 3 ? pathParts[3] : null;

		// Handle schema list
		if (schemaId === 'list') {
			// Read all schemas of this type
			const result = await this.driver.ioctl(dbFd, DatabaseOperation.GET_ALL, {
				schemaType,
				buffer
			});
			return result;
		}

		// Handle specific schema by ID
		if (schemaId && schemaId !== 'list') {
			// Read schema by ID
			const result = await this.driver.ioctl(dbFd, DatabaseOperation.GET_BY_ID, {
				schemaType,
				schemaId,
				buffer
			});
			return result;
		}

		return undefined; // Not handled by this method
	}

	/**
	 * Handle schema-specific write operations
	 */
	async handleWrite(path: string, buffer: any, dbFd: number): Promise<number | undefined> {
		// Parse schema path: /v_etc/schema/{type}/...
		const pathParts = path.split('/').filter(Boolean);

		// Need at least "/v_etc/schema/{type}"
		if (pathParts.length < 3) {
			return undefined;
		}

		const schemaType = pathParts[2];
		const schemaId = pathParts.length > 3 ? pathParts[3] : null;

		// Handle schema creation
		if (!schemaId || schemaId === 'create') {
			// Create a new schema
			const result = await this.driver.ioctl(dbFd, DatabaseOperation.CREATE, {
				schemaType,
				data: buffer
			});
			return result;
		}

		// Handle schema update by ID
		if (schemaId && schemaId !== 'list') {
			// Update schema by ID
			const result = await this.driver.ioctl(dbFd, DatabaseOperation.UPDATE, {
				schemaType,
				schemaId,
				data: buffer
			});
			return result;
		}

		return undefined; // Not handled by this method
	}

	/**
	 * Handle IOCTL operations specific to schemas
	 */
	async handleIoctl(
		fd: number,
		path: string,
		request: number,
		arg: any,
		dbFd: number
	): Promise<number | undefined> {
		// Parse schema path: /v_etc/schema/{type}/...
		const pathParts = path.split('/').filter(Boolean);

		// Need at least "/v_etc/schema/{type}"
		if (pathParts.length < 3) {
			return undefined;
		}

		const schemaType = pathParts[2];
		const schemaId = pathParts.length > 3 ? pathParts[3] : null;

		// Add schema type to arguments
		arg.schemaType = schemaType;

		// Handle schema operations
		switch (request) {
			case DatabaseOperation.GET_ALL:
				// Get all schemas of this type
				return await this.driver.ioctl(dbFd, request, arg);

			case DatabaseOperation.GET_BY_ID:
				// Get schema by ID
				if (!schemaId) {
					this.error('No schema ID provided for GET_BY_ID operation');
					return ErrorCode.EINVAL;
				}
				arg.schemaId = schemaId;
				return await this.driver.ioctl(dbFd, request, arg);

			case DatabaseOperation.CREATE:
				// Create new schema
				if (!arg.data) {
					this.error('No data provided for CREATE operation');
					return ErrorCode.EINVAL;
				}
				return await this.driver.ioctl(dbFd, request, arg);

			case DatabaseOperation.UPDATE:
				// Update schema by ID
				if (!schemaId) {
					this.error('No schema ID provided for UPDATE operation');
					return ErrorCode.EINVAL;
				}
				if (!arg.data) {
					this.error('No data provided for UPDATE operation');
					return ErrorCode.EINVAL;
				}
				arg.schemaId = schemaId;
				return await this.driver.ioctl(dbFd, request, arg);

			case DatabaseOperation.DELETE:
				// Delete schema
				if (!schemaId) {
					this.error('No schema ID provided for DELETE operation');
					return ErrorCode.EINVAL;
				}
				arg.schemaId = schemaId;
				return await this.driver.ioctl(dbFd, request, arg);

			default:
				return undefined; // Not handled by this method
		}
	}

	private log(message: string, data?: any): void {
		if (this.debug) {
			logger.debug('SchemaPathHandler', 'log', message, data);
		}
	}

	private error(message: string, error?: any): void {
		logger.error('SchemaPathHandler', 'error', message, { error });
	}
}
