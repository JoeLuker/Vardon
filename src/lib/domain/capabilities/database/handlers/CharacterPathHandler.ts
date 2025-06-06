/**
 * Character Path Handler - Handles /v_proc/character/* paths
 *
 * Following Unix principle: do one thing well
 * This handler is responsible for character-specific path operations
 */

import { ErrorCode } from '../../../kernel/types';
import { DatabaseOperation } from '../DatabaseDriver';
import type { DatabaseDriver } from '../DatabaseDriver';
import { logger } from '$lib/utils/Logger';

export class CharacterPathHandler {
	private driver: DatabaseDriver;
	private debug: boolean;

	constructor(driver: DatabaseDriver, debug: boolean = false) {
		this.driver = driver;
		this.debug = debug;
	}

	/**
	 * Handle character-specific read operations
	 */
	async handleRead(path: string, buffer: any, dbFd: number): Promise<number | undefined> {
		// Handle character list
		if (path === '/v_proc/character/list') {
			// Read all characters
			const result = await this.driver.read(dbFd, buffer);
			return result;
		}

		// Handle individual character paths: /proc/character/{id}
		const characterIdMatch = path.match(/\/v_proc\/character\/(\d+)$/);
		if (characterIdMatch) {
			const characterId = parseInt(characterIdMatch[1], 10);

			// Read character by ID
			const result = await this.driver.read(dbFd, buffer);

			// If successful and no data was read, try to populate from database
			if (result === 0 && Object.keys(buffer).length === 0) {
				this.log(`No data in buffer for character ${characterId}, trying to fetch from database`);

				// Use ioctl to get character data
				const tempBuffer: any = {};
				const ioctlResult = await this.driver.ioctl(dbFd, DatabaseOperation.GET_BY_ID, {
					characterId,
					buffer: tempBuffer
				});

				if (ioctlResult === 0 && tempBuffer.data) {
					// Copy data to the original buffer
					Object.assign(buffer, tempBuffer.data);
					return 0;
				}
			}

			return result;
		}

		return undefined; // Not handled by this method
	}

	/**
	 * Handle character-specific write operations
	 */
	async handleWrite(path: string, buffer: any, dbFd: number): Promise<number | undefined> {
		// Handle character creation
		if (path === '/v_proc/character/create') {
			// Create a new character
			const result = await this.driver.ioctl(dbFd, DatabaseOperation.CREATE, {
				data: buffer
			});
			return result;
		}

		// Handle individual character paths: /proc/character/{id}
		const characterIdMatch = path.match(/\/v_proc\/character\/(\d+)$/);
		if (characterIdMatch) {
			const characterId = parseInt(characterIdMatch[1], 10);

			// Write character data
			const result = await this.driver.ioctl(dbFd, DatabaseOperation.UPDATE, {
				characterId,
				data: buffer
			});
			return result;
		}

		return undefined; // Not handled by this method
	}

	/**
	 * Handle IOCTL operations specific to characters
	 */
	async handleIoctl(
		fd: number,
		path: string,
		request: number,
		arg: any,
		dbFd: number
	): Promise<number | undefined> {
		// Extract character ID from path: /v_proc/character/{id}
		const characterIdMatch = path.match(/\/v_proc\/character\/(\d+)/);
		const characterId = characterIdMatch ? parseInt(characterIdMatch[1], 10) : null;

		if (!characterId) {
			// Special case for the list path
			if (path === '/v_proc/character/list') {
				if (request === DatabaseOperation.GET_ALL) {
					// Get all characters
					return await this.driver.ioctl(dbFd, request, arg);
				}
			}
			return undefined; // Not handled
		}

		switch (request) {
			case DatabaseOperation.GET_BY_ID:
				// Get character by ID
				arg.characterId = characterId;
				return await this.driver.ioctl(dbFd, request, arg);

			case DatabaseOperation.UPDATE:
				// Update character data
				if (!arg.data) {
					this.error('No data provided for update operation');
					return ErrorCode.EINVAL;
				}
				arg.characterId = characterId;
				return await this.driver.ioctl(dbFd, request, arg);

			case DatabaseOperation.DELETE:
				// Delete character
				arg.characterId = characterId;
				return await this.driver.ioctl(dbFd, request, arg);

			default:
				return undefined; // Not handled by this method
		}
	}

	private log(message: string, data?: any): void {
		if (this.debug) {
			logger.debug('CharacterPathHandler', 'log', message, data);
		}
	}

	private error(message: string, error?: any): void {
		logger.error('CharacterPathHandler', 'error', message, { error });
	}
}
