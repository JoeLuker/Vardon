import type { Capability } from '../kernel/types';
import { ErrorCode, OpenMode } from '../kernel/Kernel';
import { REQUEST } from './constants';

/**
 * Unix-style skill device for managing character skills
 */
export function createUnixSkillDevice(options: { debug?: boolean } = {}): Capability {
	const debug = options.debug ?? false;

	return {
		id: 'skill',
		version: '1.0.0',
		kernel: null,

		onMount(kernel: any): void {
			this.kernel = kernel;
			if (debug) console.log(`[skill] Device mounted`);
		},

		// Process control operations via ioctl
		ioctl(fd: number, request: number, arg: any): number {
			if (debug) console.log(`[skill] IOCTL request ${request} on fd ${fd}:`, arg);

			if (!this.kernel) {
				console.error(`[skill] Kernel not available`);
				return ErrorCode.EINVAL;
			}

			if (request === REQUEST.INITIALIZE) {
				// Initialize skills for the entity
				const { entityPath } = arg;
				if (!entityPath) return ErrorCode.EINVAL;

				// Open entity file
				const entityFd = this.kernel.open(entityPath, OpenMode.READ_WRITE);
				if (entityFd < 0) {
					console.error(`[skill] Failed to open entity file: ${entityPath} (error: ${entityFd})`);
					return ErrorCode.ENOENT;
				}

				try {
					// Read entity data
					const [readResult, entity] = this.kernel.read(entityFd);
					if (readResult !== ErrorCode.SUCCESS) return readResult;

					// Get abilities for skill calculations
					const abilities = entity.properties.abilities || {};

					// Initialize skills with default values
					const skills: Record<string, any> = {
						acrobatics: {
							label: 'Acrobatics',
							ability: 'dexterity',
							total: abilities.dexterity?.modifier || 0,
							modifiers: [{ source: 'Dexterity', value: abilities.dexterity?.modifier || 0 }]
						},
						arcana: {
							label: 'Arcana',
							ability: 'intelligence',
							total: abilities.intelligence?.modifier || 0,
							modifiers: [{ source: 'Intelligence', value: abilities.intelligence?.modifier || 0 }]
						},
						athletics: {
							label: 'Athletics',
							ability: 'strength',
							total: abilities.strength?.modifier || 0,
							modifiers: [{ source: 'Strength', value: abilities.strength?.modifier || 0 }]
						}
					};

					// Update entity with skill data
					entity.properties.skills = skills;

					// Write updated entity back
					const writeResult = this.kernel.write(entityFd, entity);
					if (writeResult !== ErrorCode.SUCCESS) return writeResult;

					return ErrorCode.SUCCESS;
				} finally {
					// Always close entity file descriptor
					this.kernel.close(entityFd);
				}
			}

			if (request === REQUEST.CALC_SKILL) {
				// Process skill calculation request
				// Implementation omitted for brevity
				return ErrorCode.SUCCESS;
			}

			return ErrorCode.EINVAL;
		}
	};
}
