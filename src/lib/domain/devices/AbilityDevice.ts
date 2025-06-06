import type { Capability } from '../kernel/types';
import { ErrorCode, OpenMode } from '../kernel/Kernel';
import { REQUEST } from './constants';

/**
 * Unix-style ability device for managing character ability scores
 */
export function createUnixAbilityDevice(options: { debug?: boolean } = {}): Capability {
	const debug = options.debug ?? false;

	return {
		id: 'ability',
		version: '1.0.0',
		kernel: null,

		onMount(kernel: any): void {
			this.kernel = kernel;
			if (debug) console.log(`[ability] Device mounted`);
		},

		// Process control operations via ioctl
		ioctl(fd: number, request: number, arg: any): number {
			if (debug) console.log(`[ability] IOCTL request ${request} on fd ${fd}:`, arg);

			if (!this.kernel) {
				console.error(`[ability] Kernel not available`);
				return ErrorCode.EINVAL;
			}

			if (request === REQUEST.INITIALIZE) {
				const { entityPath } = arg;
				if (!entityPath) return ErrorCode.EINVAL;

				// Open entity file
				const entityFd = this.kernel.open(entityPath, OpenMode.READ_WRITE);
				if (entityFd < 0) {
					console.error(`[ability] Failed to open entity file: ${entityPath} (error: ${entityFd})`);
					return ErrorCode.ENOENT;
				}

				try {
					// Read entity data
					const [readResult, entity] = this.kernel.read(entityFd);
					if (readResult !== ErrorCode.SUCCESS) return readResult;

					// Get raw character data
					const rawCharacter = entity.properties.rawData;

					// Calculate abilities from raw data
					const abilityMap = {
						401: 'strength',
						402: 'dexterity',
						403: 'constitution',
						404: 'intelligence',
						405: 'wisdom',
						406: 'charisma'
					};

					const abilities: Record<string, any> = {};

					// Process each ability score
					if (rawCharacter.game_character_ability) {
						for (const ability of rawCharacter.game_character_ability) {
							const abilityId = ability.ability_id;
							const abilityName = abilityMap[abilityId] || `ability_${abilityId}`;
							const score = ability.value || 10;

							// Calculate modifier
							const modifier = Math.floor((score - 10) / 2);

							// Store structured ability data with breakdown
							abilities[abilityName] = {
								label: abilityName.charAt(0).toUpperCase() + abilityName.slice(1),
								total: score,
								modifier: modifier,
								modifiers: [{ source: 'Base', value: score }]
							};
						}
					}

					// Update entity with ability data
					entity.properties.abilities = abilities;

					// Write updated entity back
					const writeResult = this.kernel.write(entityFd, entity);
					if (writeResult !== ErrorCode.SUCCESS) return writeResult;

					return ErrorCode.SUCCESS;
				} finally {
					// Always close entity file descriptor
					this.kernel.close(entityFd);
				}
			}

			if (request === REQUEST.CALC_ABILITY) {
				// Process ability calculation request
				// Implementation omitted for brevity
				return ErrorCode.SUCCESS;
			}

			return ErrorCode.EINVAL;
		}
	};
}
