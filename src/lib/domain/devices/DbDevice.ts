import type { Capability } from '../kernel/types';
import { ErrorCode } from '../kernel/Kernel';
import type { GameRulesAPI } from '$lib/db';
import { REQUEST } from './constants';

/**
 * Unix-style database device for accessing game data through file operations
 */
export function createUnixDbDevice(
	gameRulesAPI: GameRulesAPI,
	options: { debug?: boolean } = {}
): Capability {
	const debug = options.debug ?? false;

	return {
		id: 'db',
		version: '1.0.0',
		kernel: null,
		gameRulesAPI,

		onMount(kernel: any): void {
			this.kernel = kernel;
			if (debug) console.log(`[db] Device mounted`);

			// Ensure proc directories exist for the database device
			if (!kernel.exists('/v_proc/schema')) {
				kernel.mkdir('/v_proc/schema');
			}

			if (!kernel.exists('/v_proc/character')) {
				kernel.mkdir('/v_proc/character');
			}
		},

		// Unix-style read method
		read(fd: number, buffer: any): number {
			if (debug) console.log(`[db] Reading from descriptor ${fd}`);

			// Return response data stored during write or ioctl operation
			if (buffer._responseData) {
				Object.assign(buffer, buffer._responseData);
				delete buffer._responseData;
				return ErrorCode.SUCCESS;
			}

			return ErrorCode.EINVAL;
		},

		// Unix-style write method
		async write(fd: number, buffer: any): Promise<number> {
			if (debug) console.log(`[db] Writing to descriptor ${fd}:`, buffer);

			// Process request based on operation type
			if (buffer.operation === 'getCharacter') {
				const characterId = buffer.characterId;

				try {
					// Use GameRulesAPI to get character data
					const character = await this.gameRulesAPI.getCompleteCharacterData(characterId);

					// Store response data to be returned on next read
					buffer._responseData = {
						operation: 'getCharacterResponse',
						success: true,
						character
					};

					return ErrorCode.SUCCESS;
				} catch (error) {
					console.error(`[db] Error getting character data:`, error);

					// Store error response
					buffer._responseData = {
						operation: 'getCharacterResponse',
						success: false,
						error: 'Failed to get character data'
					};

					return ErrorCode.EIO;
				}
			}

			return ErrorCode.EINVAL;
		},

		// Unix-style ioctl method
		ioctl(fd: number, request: number, arg: any): number {
			if (debug) console.log(`[db] IOCTL request ${request} on fd ${fd}:`, arg);

			if (request === REQUEST.INITIALIZE) {
				// Initialize the database device
				// Here we might set up any necessary kernel file structures
				// or perform other initialization tasks
				return ErrorCode.SUCCESS;
			}

			// Support direct database operations via file paths
			if (request === REQUEST.GET_CHARACTER) {
				const { characterId, callback } = arg;
				if (!characterId || typeof callback !== 'function') {
					return ErrorCode.EINVAL;
				}

				// Use GameRulesAPI to fetch character data asynchronously
				this.gameRulesAPI
					.getCompleteCharacterData(characterId)
					.then((character) => callback(null, character))
					.catch((error) => callback(error));

				return ErrorCode.SUCCESS;
			}

			return ErrorCode.EINVAL;
		}
	};
}
