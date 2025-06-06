import type { Capability } from '../kernel/types';
import { ErrorCode, OpenMode } from '../kernel/Kernel';
import { REQUEST } from './constants';

/**
 * Unix-style bonus device for tracking and applying character bonuses
 */
export function createUnixBonusDevice(options: { debug?: boolean } = {}): Capability {
	const debug = options.debug ?? false;

	return {
		id: 'bonus',
		version: '1.0.0',
		kernel: null,

		onMount(kernel: any): void {
			this.kernel = kernel;
			if (debug) console.log(`[bonus] Device mounted`);
		},

		// Process control operations via ioctl
		ioctl(fd: number, request: number, arg: any): number {
			if (debug) console.log(`[bonus] IOCTL request ${request} on fd ${fd}:`, arg);

			if (!this.kernel) {
				console.error(`[bonus] Kernel not available`);
				return ErrorCode.EINVAL;
			}

			if (request === REQUEST.INITIALIZE) {
				// Initialize bonus tracking for the entity
				const { entityPath } = arg;
				if (!entityPath) return ErrorCode.EINVAL;

				// Open entity file
				const entityFd = this.kernel.open(entityPath, OpenMode.READ_WRITE);
				if (entityFd < 0) {
					console.error(`[bonus] Failed to open entity file: ${entityPath} (error: ${entityFd})`);
					return ErrorCode.ENOENT;
				}

				try {
					// Read entity data
					const [readResult, entity] = this.kernel.read(entityFd);
					if (readResult !== ErrorCode.SUCCESS) return readResult;

					// Initialize bonus tracking
					entity.properties.bonuses = [];

					// Write updated entity back
					const writeResult = this.kernel.write(entityFd, entity);
					if (writeResult !== ErrorCode.SUCCESS) return writeResult;

					return ErrorCode.SUCCESS;
				} finally {
					// Always close entity file descriptor
					this.kernel.close(entityFd);
				}
			}

			if (request === REQUEST.APPLY_BONUS) {
				// Apply bonus to entity
				const { entityPath, bonus } = arg;
				if (!entityPath || !bonus) return ErrorCode.EINVAL;

				// Open entity file
				const entityFd = this.kernel.open(entityPath, OpenMode.READ_WRITE);
				if (entityFd < 0) return ErrorCode.ENOENT;

				try {
					// Read entity data
					const [readResult, entity] = this.kernel.read(entityFd);
					if (readResult !== ErrorCode.SUCCESS) return readResult;

					// Add bonus to tracked bonuses
					entity.properties.bonuses = entity.properties.bonuses || [];
					entity.properties.bonuses.push(bonus);

					// Apply bonus to target ability
					if (entity.properties.abilities && entity.properties.abilities[bonus.target]) {
						const ability = entity.properties.abilities[bonus.target];

						// Add to modifiers breakdown
						ability.modifiers = ability.modifiers || [];
						ability.modifiers.push({
							source: bonus.source,
							value: bonus.value
						});

						// Recalculate total
						ability.total = ability.modifiers.reduce((sum, mod) => sum + mod.value, 0);

						// Recalculate modifier
						ability.modifier = Math.floor((ability.total - 10) / 2);
					}

					// Write updated entity back
					const writeResult = this.kernel.write(entityFd, entity);
					if (writeResult !== ErrorCode.SUCCESS) return writeResult;

					return ErrorCode.SUCCESS;
				} finally {
					// Always close entity file descriptor
					this.kernel.close(entityFd);
				}
			}

			return ErrorCode.EINVAL;
		}
	};
}
