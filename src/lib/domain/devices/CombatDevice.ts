import type { Capability } from '../kernel/types';
import { ErrorCode, OpenMode } from '../kernel/Kernel';
import { REQUEST } from './constants';

/**
 * Unix-style combat device for managing combat statistics
 */
export function createUnixCombatDevice(options: { debug?: boolean } = {}): Capability {
	const debug = options.debug ?? false;

	return {
		id: 'combat',
		version: '1.0.0',
		kernel: null,

		onMount(kernel: any): void {
			this.kernel = kernel;
			if (debug) console.log(`[combat] Device mounted`);
		},

		// Process control operations via ioctl
		ioctl(fd: number, request: number, arg: any): number {
			if (debug) console.log(`[combat] IOCTL request ${request} on fd ${fd}:`, arg);

			if (!this.kernel) {
				console.error(`[combat] Kernel not available`);
				return ErrorCode.EINVAL;
			}

			if (request === REQUEST.INITIALIZE) {
				// Initialize combat stats for the entity
				const { entityPath } = arg;
				if (!entityPath) return ErrorCode.EINVAL;

				// Open entity file
				const entityFd = this.kernel.open(entityPath, OpenMode.READ_WRITE);
				if (entityFd < 0) {
					console.error(`[combat] Failed to open entity file: ${entityPath} (error: ${entityFd})`);
					return ErrorCode.ENOENT;
				}

				try {
					// Read entity data
					const [readResult, entity] = this.kernel.read(entityFd);
					if (readResult !== ErrorCode.SUCCESS) return readResult;

					// Get abilities for combat calculations
					const abilities = entity.properties.abilities || {};

					// Calculate base AC
					const dexMod = abilities.dexterity?.modifier || 0;

					// Initialize combat stats
					entity.properties.combat = {
						ac: {
							label: 'Armor Class',
							total: 10 + dexMod,
							modifiers: [
								{ source: 'Base', value: 10 },
								{ source: 'Dexterity', value: dexMod }
							]
						},
						initiative: {
							label: 'Initiative',
							total: dexMod,
							modifiers: [{ source: 'Dexterity', value: dexMod }]
						},
						bab: {
							label: 'Base Attack Bonus',
							total: 5, // Example for a level 5 fighter
							modifiers: [{ source: 'Class Level', value: 5 }]
						},
						attacks: {
							melee: {
								label: 'Melee Attack',
								total: 5 + (abilities.strength?.modifier || 0),
								modifiers: [
									{ source: 'BAB', value: 5 },
									{ source: 'Strength', value: abilities.strength?.modifier || 0 }
								]
							},
							ranged: {
								label: 'Ranged Attack',
								total: 5 + (abilities.dexterity?.modifier || 0),
								modifiers: [
									{ source: 'BAB', value: 5 },
									{ source: 'Dexterity', value: abilities.dexterity?.modifier || 0 }
								]
							}
						}
					};

					// Write updated entity back
					const writeResult = this.kernel.write(entityFd, entity);
					if (writeResult !== ErrorCode.SUCCESS) return writeResult;

					return ErrorCode.SUCCESS;
				} finally {
					// Always close entity file descriptor
					this.kernel.close(entityFd);
				}
			}

			if (request === REQUEST.CALC_COMBAT) {
				// Process combat calculation request
				// Implementation omitted for brevity
				return ErrorCode.SUCCESS;
			}

			return ErrorCode.EINVAL;
		}
	};
}
