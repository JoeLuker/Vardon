import type { Capability } from '../kernel/types';
import { ErrorCode, OpenMode } from '../kernel/Kernel';
import { REQUEST } from './constants';

/**
 * Browser-specific character device for managing character state
 */
export function createBrowserCharacterDevice(options: { debug?: boolean } = {}): Capability {
	const debug = options.debug ?? false;

	return {
		id: 'character',
		version: '1.0.0',
		kernel: null,

		onMount(kernel: any): void {
			this.kernel = kernel;
			if (debug) console.log(`[character] Device mounted`);
		},

		// Process control operations via ioctl
		ioctl(fd: number, request: number, arg: any): number {
			if (debug) console.log(`[character] IOCTL request ${request} on fd ${fd}:`, arg);

			if (!this.kernel) {
				console.error(`[character] Kernel not available`);
				return ErrorCode.EINVAL;
			}

			if (request === REQUEST.INITIALIZE) {
				// Initialize last step for character
				const { entityPath } = arg;
				if (!entityPath) return ErrorCode.EINVAL;

				// Extract character ID from path
				const match = entityPath.match(/character-(\d+)$/);
				if (!match) return ErrorCode.EINVAL;

				const characterId = match[1];
				if (!characterId) return ErrorCode.EINVAL;

				// Create status file in /proc directory
				const procPath = `/v_proc/character/${characterId}`;
				const statusResult = this.kernel.create(procPath, {
					id: characterId,
					path: entityPath,
					status: 'initialized',
					timestamp: Date.now()
				});

				if (!statusResult.success) {
					if (debug)
						console.warn(`[character] Failed to create status file: ${statusResult.errorMessage}`);
					// Non-fatal error, continue
				}

				return ErrorCode.SUCCESS;
			}

			if (request === REQUEST.SET_CHARACTER) {
				// Update character data
				const { entityPath, updates } = arg;
				if (!entityPath || !updates) return ErrorCode.EINVAL;

				// Open entity file
				const entityFd = this.kernel.open(entityPath, OpenMode.READ_WRITE);
				if (entityFd < 0) return ErrorCode.ENOENT;

				try {
					// Read current data
					const [readResult, entity] = this.kernel.read(entityFd);
					if (readResult !== ErrorCode.SUCCESS) return readResult;

					// Apply updates
					Object.assign(entity.properties, updates);
					entity.metadata.updatedAt = Date.now();

					// Write back
					const writeResult = this.kernel.write(entityFd, entity);
					if (writeResult !== ErrorCode.SUCCESS) return writeResult;

					return ErrorCode.SUCCESS;
				} finally {
					this.kernel.close(entityFd);
				}
			}

			return ErrorCode.EINVAL;
		}
	};
}
