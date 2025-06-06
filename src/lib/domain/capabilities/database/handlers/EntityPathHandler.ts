/**
 * Entity Path Handler - Handles /v_entity/* paths
 *
 * Following Unix principle: do one thing well
 * This handler is responsible for entity-specific path operations
 */

import { ErrorCode } from '../../../kernel/types';
import { DatabaseOperation } from '../DatabaseDriver';
import type { DatabaseDriver } from '../DatabaseDriver';
import { logger } from '$lib/utils/Logger';

export class EntityPathHandler {
	private driver: DatabaseDriver;
	private debug: boolean;

	constructor(driver: DatabaseDriver, debug: boolean = false) {
		this.driver = driver;
		this.debug = debug;
	}

	/**
	 * Handle entity-specific read operations
	 */
	async handleRead(path: string, buffer: any, dbFd: number): Promise<number | undefined> {
		// Parse entity path: /v_entity/{id}/...
		const pathParts = path.split('/').filter(Boolean);

		// Need at least "/v_entity/{id}"
		if (pathParts.length < 2) {
			return undefined;
		}

		const entityId = pathParts[1];
		const subResource = pathParts.length > 2 ? pathParts[2] : null;
		const subId = pathParts.length > 3 ? pathParts[3] : null;

		// Handle entity read
		if (!subResource) {
			// Read entire entity
			const result = await this.driver.read(dbFd, buffer);
			return result;
		}

		// Handle sub-resource read
		if (subResource) {
			// Read sub-resource
			const tempBuffer: any = {};
			const result = await this.driver.read(dbFd, tempBuffer);

			if (result === 0) {
				// Extract and return only the requested sub-resource
				if (tempBuffer.properties && tempBuffer.properties[subResource]) {
					if (subId && tempBuffer.properties[subResource][subId]) {
						// Return specific sub-resource item
						Object.assign(buffer, tempBuffer.properties[subResource][subId]);
					} else {
						// Return entire sub-resource
						Object.assign(buffer, tempBuffer.properties[subResource]);
					}
				} else if (tempBuffer[subResource]) {
					// Handle the case where sub-resource is at the top level
					if (subId && tempBuffer[subResource][subId]) {
						Object.assign(buffer, tempBuffer[subResource][subId]);
					} else {
						Object.assign(buffer, tempBuffer[subResource]);
					}
				} else {
					// Sub-resource not found
					this.error(`Sub-resource not found: ${subResource}`);
					return ErrorCode.ENOENT;
				}
			}

			return result;
		}

		return undefined; // Not handled by this method
	}

	/**
	 * Handle entity-specific write operations
	 */
	async handleWrite(path: string, buffer: any, dbFd: number): Promise<number | undefined> {
		// Parse entity path: /v_entity/{id}/...
		const pathParts = path.split('/').filter(Boolean);

		// Need at least "/v_entity/{id}"
		if (pathParts.length < 2) {
			return undefined;
		}

		const entityId = pathParts[1];
		const subResource = pathParts.length > 2 ? pathParts[2] : null;
		const subId = pathParts.length > 3 ? pathParts[3] : null;

		// Handle entity write (no sub-resource)
		if (!subResource) {
			// Write entire entity
			const result = await this.driver.ioctl(dbFd, DatabaseOperation.UPDATE, {
				entityId,
				data: buffer
			});
			return result;
		}

		// Handle sub-resource write
		if (subResource) {
			// First, read the existing entity data
			const entity: any = {};
			const readResult = await this.driver.read(dbFd, entity);

			if (readResult !== 0) {
				this.error(`Failed to read entity data for sub-resource update: ${readResult}`);
				return readResult;
			}

			// Initialize properties if needed
			if (!entity.properties) {
				entity.properties = {};
			}

			// Initialize the sub-resource if needed
			if (!entity.properties[subResource]) {
				entity.properties[subResource] = {};
			}

			// Update the sub-resource
			if (subId) {
				// Update a specific item within the sub-resource
				entity.properties[subResource][subId] = buffer;
			} else {
				// Update the entire sub-resource
				entity.properties[subResource] = buffer;
			}

			// Update the entity's timestamp
			if (entity.metadata) {
				entity.metadata.updatedAt = Date.now();
			}

			// Write back the updated entity
			const writeResult = await this.driver.ioctl(dbFd, DatabaseOperation.UPDATE, {
				entityId,
				data: entity
			});

			return writeResult;
		}

		return undefined; // Not handled by this method
	}

	/**
	 * Handle IOCTL operations specific to entities
	 */
	async handleIoctl(
		fd: number,
		path: string,
		request: number,
		arg: any,
		dbFd: number
	): Promise<number | undefined> {
		// Extract entity ID and sub-resources from path: /v_entity/{id}/...
		const pathParts = path.split('/').filter(Boolean);

		// Need at least "/v_entity/{id}"
		if (pathParts.length < 2) {
			return undefined;
		}

		const entityId = pathParts[1];
		const subResource = pathParts.length > 2 ? pathParts[2] : null;
		const subId = pathParts.length > 3 ? pathParts[3] : null;

		// Handle entity operations
		switch (request) {
			case DatabaseOperation.GET_BY_ID:
				// Get entity by ID
				arg.entityId = entityId;
				return await this.driver.ioctl(dbFd, request, arg);

			case DatabaseOperation.UPDATE:
				// Update entity data
				if (!arg.data) {
					this.error('No data provided for update operation');
					return ErrorCode.EINVAL;
				}
				arg.entityId = entityId;
				return await this.driver.ioctl(dbFd, request, arg);

			case DatabaseOperation.DELETE:
				// Delete entity
				arg.entityId = entityId;
				return await this.driver.ioctl(dbFd, request, arg);
		}

		// Handle sub-resource operations
		if (subResource) {
			// Add sub-resource information to the arguments
			arg.entityId = entityId;
			arg.subResource = subResource;

			if (subId) {
				arg.subId = subId;
			}

			return await this.driver.ioctl(dbFd, request, arg);
		}

		return undefined; // Not handled by this method
	}

	private log(message: string, data?: any): void {
		if (this.debug) {
			logger.debug('EntityPathHandler', 'log', message, data);
		}
	}

	private error(message: string, error?: any): void {
		logger.error('EntityPathHandler', 'error', message, { error });
	}
}
