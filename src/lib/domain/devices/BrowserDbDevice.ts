import type { Capability } from '../kernel/types';
import { ErrorCode } from '../kernel/Kernel';
import { REQUEST } from './constants';

/**
 * Browser-specific database device that uses local storage and mock data
 */
export function createBrowserDbDevice(options: { debug?: boolean } = {}): Capability {
	const debug = options.debug ?? false;

	return {
		id: 'db',
		version: '1.0.0',
		kernel: null,

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

				// Check if we have cached data first
				const cachePath = `/v_var/cache/character/${characterId}`;
				if (this.kernel.exists(cachePath)) {
					const cachedData = this.kernel.readFile(cachePath);
					if (cachedData.success && cachedData.data) {
						buffer._responseData = {
							operation: 'getCharacterResponse',
							success: true,
							source: 'cache',
							character: cachedData.data
						};
						return ErrorCode.SUCCESS;
					}
				}

				// Mock character data for development
				// In production, this would fetch from network
				buffer._responseData = {
					operation: 'getCharacterResponse',
					success: true,
					source: 'mock',
					character: {
						id: characterId,
						name: `Character ${characterId}`,
						max_hp: 25,
						current_hp: 25,
						game_character_ability: [
							{ ability_id: 401, value: 14 },
							{ ability_id: 402, value: 16 },
							{ ability_id: 403, value: 12 },
							{ ability_id: 404, value: 10 },
							{ ability_id: 405, value: 8 },
							{ ability_id: 406, value: 16 }
						],
						game_character_class: [{ class_id: 1, level: 5, class: { name: 'Fighter' } }],
						game_character_ancestry: [{ ancestry: { name: 'Human' } }]
					}
				};

				// Cache the data for future use
				this.kernel.create(cachePath, buffer._responseData.character, true);

				return ErrorCode.SUCCESS;
			}

			return ErrorCode.EINVAL;
		},

		// Unix-style ioctl method
		ioctl(fd: number, request: number, arg: any): number {
			if (debug) console.log(`[db] IOCTL request ${request} on fd ${fd}:`, arg);

			if (request === REQUEST.INITIALIZE) {
				return ErrorCode.SUCCESS;
			}

			return ErrorCode.EINVAL;
		}
	};
}
