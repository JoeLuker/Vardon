/**
 * Ability Capability - Unix Architecture Implementation
 *
 * This module implements a Unix-style device driver for ability scores.
 * Following Unix principles:
 * - Device exposes operations through file operations (read, write, ioctl)
 * - Clear separation between device interface and implementation
 * - Device handles its own resource management
 * - Consistent error handling with error codes
 */

import type { Entity, Capability } from '../../kernel/types';
import { ErrorCode, OpenMode } from '../../kernel/types';
import type { GameKernel } from '../../kernel/GameKernel';
import type { BonusCapability } from '../bonus';
import {
	createError,
	success,
	failure,
	withFile,
	createErrorLogger,
	type Result,
	type SystemError
} from '../../kernel/ErrorHandler';

// Device file paths
export const ABILITY_PATHS = {
	DEVICE: '/v_dev/ability',
	PROC_CHARACTER: '/v_proc/character',
	VIRTUAL_FILES: '/v_proc/ability'
};

// Operation request codes (like ioctl request codes in Unix)
export const ABILITY_REQUEST = {
	INITIALIZE: 0,
	GET_SCORE: 1,
	SET_SCORE: 2,
	GET_MODIFIER: 3,
	GET_BREAKDOWN: 4,
	APPLY_BONUS: 5,
	REMOVE_BONUS: 6
};

// Standard abilities in Pathfinder
export const STANDARD_ABILITIES = [
	'strength',
	'dexterity',
	'constitution',
	'intelligence',
	'wisdom',
	'charisma'
];

/**
 * Ability score breakdown
 */
export interface AbilityBreakdown {
	ability: string;
	label?: string;
	base: number;
	total: number;
	modifier: number;
	modifiers: { source: string; value: number }[];
}

/**
 * Create a Unix-style ability device
 * @param bonusCapability Bonus capability dependency
 * @param options Device options
 * @returns A capability for ability operations
 */
export function createUnixAbilityDevice(
	bonusCapability: BonusCapability,
	options: { debug?: boolean } = {}
): Capability {
	const debug = options.debug ?? false;

	// Internal state - retained between operations
	const state = {
		defaultAbilities: STANDARD_ABILITIES,
		kernel: null as GameKernel | null,

		// Track file operations for this device
		openFiles: new Map<number, { path: string; mode: OpenMode }>(),

		// Cache for frequently accessed data
		cache: new Map<string, { data: any; timestamp: number }>(),

		// Buffer for multi-step operations
		buffers: new Map<number, any>()
	};

	// Create error logger
	const logger = createErrorLogger('ability-device');

	function log(message: string): void {
		if (debug) {
			logger.debug(message);
		}
	}

	return {
		id: 'ability',

		/**
		 * Unix-style mount handler
		 * @param kernel Kernel instance
		 */
		onMount(kernel: GameKernel): void {
			state.kernel = kernel;
			log('Ability device mounted');

			// Create device directory structure safely
			const createDirIfNeeded = (path: string): boolean => {
				if (!kernel.exists(path)) {
					const result = kernel.mkdir(path);
					if (result !== ErrorCode.SUCCESS) {
						logger.error(`Failed to create directory: ${path}`, null, {
							operation: 'onMount.mkdir',
							path,
							errorCode: result
						});
						return false;
					}
					log(`Created directory: ${path}`);
				}
				return true;
			};

			// Create all required directories
			if (!createDirIfNeeded('/v_proc')) return;
			if (!createDirIfNeeded('/v_proc/ability')) return;
			if (!createDirIfNeeded('/proc/ability/cache')) return;
			if (!createDirIfNeeded(ABILITY_PATHS.PROC_CHARACTER)) return;

			// Create device metadata file
			kernel.create('/proc/ability/info.json', {
				name: 'ability',
				version: '1.0.0',
				description: 'Unix-style device driver for ability scores',
				abilities: STANDARD_ABILITIES
			});

			log('Ability device initialized');
		},

		/**
		 * Unix-style read method
		 * @param fd File descriptor
		 * @param buffer Buffer to read into
		 * @returns ErrorCode (0 for success)
		 */
		read(fd: number, buffer: any): number {
			log(`Reading from fd ${fd}`);

			const fileInfo = state.openFiles.get(fd);
			if (!fileInfo) {
				logger.error(`Invalid file descriptor: ${fd}`, null, {
					operation: 'read',
					fd
				});
				return ErrorCode.EBADF;
			}

			const path = fileInfo.path;

			// Check for cached results in buffers (from ioctl operations)
			const bufferedResult = state.buffers.get(fd);
			if (bufferedResult) {
				Object.assign(buffer, bufferedResult);
				state.buffers.delete(fd);
				return ErrorCode.SUCCESS;
			}

			// Check for entity ability path pattern
			const entityMatch = path.match(/\/entity\/([^\/]+)\/abilities(?:\/([^\/]+))?/);
			if (entityMatch) {
				return readEntityAbility(entityMatch[1], entityMatch[2], buffer);
			}

			// Check for proc file paths
			if (path === '/proc/ability/info.json') {
				Object.assign(buffer, {
					name: 'ability',
					version: '1.0.0',
					description: 'Unix-style device driver for ability scores',
					abilities: STANDARD_ABILITIES
				});
				return ErrorCode.SUCCESS;
			}

			logger.error(`Unrecognized path: ${path}`, null, {
				operation: 'read.path',
				path
			});
			return ErrorCode.EINVAL;
		},

		/**
		 * Unix-style write method
		 * @param fd File descriptor
		 * @param buffer Data to write
		 * @returns ErrorCode (0 for success)
		 */
		write(fd: number, buffer: any): number {
			log(`Writing to fd ${fd}`);

			const fileInfo = state.openFiles.get(fd);
			if (!fileInfo) {
				logger.error(`Invalid file descriptor: ${fd}`, null, {
					operation: 'read',
					fd
				});
				return ErrorCode.EBADF;
			}

			const path = fileInfo.path;

			// Check for entity ability path pattern
			const entityMatch = path.match(/\/entity\/([^\/]+)\/abilities(?:\/([^\/]+))?/);
			if (entityMatch) {
				return writeEntityAbility(entityMatch[1], entityMatch[2], buffer);
			}

			logger.error(`Unrecognized path: ${path}`, null, {
				operation: 'read.path',
				path
			});
			return ErrorCode.EINVAL;
		},

		/**
		 * Unix-style ioctl method
		 * @param fd File descriptor
		 * @param request Request code
		 * @param arg Arguments for the operation
		 * @returns ErrorCode (0 for success)
		 */
		ioctl(fd: number, request: number, arg: any): number {
			log(`IOCTL request ${request} on fd ${fd}`);

			try {
				switch (request) {
					case ABILITY_REQUEST.INITIALIZE:
						return initializeEntity(arg);

					case ABILITY_REQUEST.GET_SCORE:
						return getAbilityScore(arg, state.buffers, fd);

					case ABILITY_REQUEST.SET_SCORE:
						return setAbilityScore(arg);

					case ABILITY_REQUEST.GET_MODIFIER:
						return getAbilityModifier(arg, state.buffers, fd);

					case ABILITY_REQUEST.GET_BREAKDOWN:
						return getAbilityBreakdown(arg, state.buffers, fd);

					case ABILITY_REQUEST.APPLY_BONUS:
						return applyAbilityBonus(arg);

					case ABILITY_REQUEST.REMOVE_BONUS:
						return removeAbilityBonus(arg);

					default:
						logger.error(`Unsupported request: ${request}`, null, {
							operation: 'ioctl',
							fd,
							request
						});
						return ErrorCode.EINVAL;
				}
			} catch (err) {
				const sysError = createError(
					ErrorCode.EIO,
					`Unhandled exception in ioctl operation: ${err instanceof Error ? err.message : String(err)}`,
					{
						component: 'ability-device',
						operation: 'ioctl',
						fd,
						request
					}
				);
				logger.error(sysError.message, err);
				return ErrorCode.EIO;
			}
		},

		/**
		 * Unix-style cleanup handler
		 */
		shutdown(): void {
			log('Ability device shutting down');

			// Clear all state
			state.openFiles.clear();
			state.cache.clear();
			state.buffers.clear();
			state.kernel = null;

			log('Ability device shutdown complete');
		}
	};

	/**
	 * Read ability score(s) for an entity
	 * @param entityId Entity ID
	 * @param abilityName Ability name (or 'all' for all abilities)
	 * @param buffer Buffer to read into
	 * @returns ErrorCode (0 for success)
	 */
	function readEntityAbility(
		entityId: string,
		abilityName: string | undefined,
		buffer: any
	): number {
		if (!state.kernel) {
			logger.error('Kernel not available', null, {
				operation: 'readEntityAbility'
			});
			return ErrorCode.EINVAL;
		}

		// Ensure directory structure exists
		const procDirExists = state.kernel.exists(ABILITY_PATHS.PROC_CHARACTER);
		if (!procDirExists) {
			log(`Creating directory: ${ABILITY_PATHS.PROC_CHARACTER}`);
			const mkdirResult = state.kernel.mkdir(ABILITY_PATHS.PROC_CHARACTER);
			if (mkdirResult !== ErrorCode.SUCCESS) {
				logger.error(`Failed to create directory: ${ABILITY_PATHS.PROC_CHARACTER}`, null, {
					operation: 'readEntityAbility.mkdir',
					errorCode: mkdirResult
				});
				return mkdirResult;
			}
		}

		// Open entity file
		const entityPath = `${ABILITY_PATHS.PROC_CHARACTER}/${entityId}`;
		const entityFd = state.kernel.open(entityPath, OpenMode.READ);
		if (entityFd < 0) {
			logger.error(`Failed to open entity: ${entityPath}`, null, {
				operation: 'readEntityAbility.open',
				path: entityPath,
				errorCode: entityFd
			});
			return ErrorCode.ENOENT;
		}

		try {
			// Read entity data
			const [readResult, entity] = state.kernel.read(entityFd);
			if (readResult !== ErrorCode.SUCCESS) {
				logger.error(`Failed to read entity: ${entityPath}`, null, {
					operation: 'readEntityAbility.read',
					path: entityPath,
					errorCode: readResult
				});
				return readResult;
			}

			// Check if entity has abilities
			if (!entity.properties.abilities) {
				logger.error(`Entity does not have abilities: ${entityId}`, null, {
					operation: 'readEntityAbility.check',
					entityId
				});
				return ErrorCode.ENOENT;
			}

			// Read all abilities or a specific one
			if (!abilityName || abilityName === 'all') {
				// Read all abilities
				const abilities: Record<string, any> = {};

				for (const ability of state.defaultAbilities) {
					abilities[ability] = getAbilityBreakdownForEntity(entity, ability);
				}

				// Store in buffer
				Object.assign(buffer, { abilities });
			} else {
				// Read specific ability
				const breakdown = getAbilityBreakdownForEntity(entity, abilityName);

				// Store in buffer
				Object.assign(buffer, breakdown);
			}

			return ErrorCode.SUCCESS;
		} finally {
			// Always close file descriptor
			state.kernel.close(entityFd);
		}
	}

	/**
	 * Write to an ability for an entity
	 * @param entityId Entity ID
	 * @param abilityName Ability name
	 * @param buffer Data to write
	 * @returns ErrorCode (0 for success)
	 */
	function writeEntityAbility(
		entityId: string,
		abilityName: string | undefined,
		buffer: any
	): number {
		if (!state.kernel) {
			logger.error('Kernel not available', null, {
				operation: 'writeEntityAbility'
			});
			return ErrorCode.EINVAL;
		}

		// Need ability name for writes
		if (!abilityName) {
			logger.error('Missing ability name for write operation', null, {
				operation: 'writeEntityAbility',
				entityId
			});
			return ErrorCode.EINVAL;
		}

		// Ensure directory structure exists
		const procDirExists = state.kernel.exists(ABILITY_PATHS.PROC_CHARACTER);
		if (!procDirExists) {
			log(`Creating directory: ${ABILITY_PATHS.PROC_CHARACTER}`);
			const mkdirResult = state.kernel.mkdir(ABILITY_PATHS.PROC_CHARACTER);
			if (mkdirResult !== ErrorCode.SUCCESS) {
				logger.error(`Failed to create directory: ${ABILITY_PATHS.PROC_CHARACTER}`, null, {
					operation: 'writeEntityAbility.mkdir',
					errorCode: mkdirResult
				});
				return mkdirResult;
			}
		}

		// Open entity file
		const entityPath = `${ABILITY_PATHS.PROC_CHARACTER}/${entityId}`;
		const entityFd = state.kernel.open(entityPath, OpenMode.READ_WRITE);
		if (entityFd < 0) {
			logger.error(`Failed to open entity: ${entityPath}`, null, {
				operation: 'writeEntityAbility.open',
				path: entityPath,
				errorCode: entityFd
			});
			return ErrorCode.ENOENT;
		}

		try {
			// Read entity data
			const [readResult, entity] = state.kernel.read(entityFd);
			if (readResult !== ErrorCode.SUCCESS) {
				logger.error(`Failed to read entity: ${entityPath}`, null, {
					operation: 'writeEntityAbility.read',
					path: entityPath,
					errorCode: readResult
				});
				return readResult;
			}

			// Initialize abilities if needed
			if (!entity.properties.abilities) {
				entity.properties.abilities = {};
			}

			// Check what operation to perform
			if (buffer.value !== undefined) {
				// Set base ability score
				entity.properties.abilities[abilityName] = buffer.value;
			} else if (buffer.bonus) {
				// Apply a bonus
				applyAbilityBonusToEntity(
					entity,
					abilityName,
					buffer.bonus.value,
					buffer.bonus.type || 'untyped',
					buffer.bonus.source || 'unknown'
				);
			} else if (buffer.removeBonus) {
				// Remove a bonus
				removeAbilityBonusFromEntity(entity, abilityName, buffer.removeBonus.source);
			} else {
				logger.error('Invalid write operation', null, {
					operation: 'writeEntityAbility.operation',
					entityId,
					abilityName,
					buffer: JSON.stringify(buffer)
				});
				return ErrorCode.EINVAL;
			}

			// Update entity timestamp
			entity.metadata.updatedAt = Date.now();

			// Write updated entity
			const writeResult = state.kernel.write(entityFd, entity);
			if (writeResult !== ErrorCode.SUCCESS) {
				logger.error(`Failed to write entity: ${entityPath}`, null, {
					operation: 'writeEntityAbility.write',
					path: entityPath,
					errorCode: writeResult
				});
				return writeResult;
			}

			return ErrorCode.SUCCESS;
		} finally {
			// Always close file descriptor
			state.kernel.close(entityFd);
		}
	}

	/**
	 * Initialize abilities for an entity
	 * @param arg Arguments
	 * @returns ErrorCode (0 for success)
	 */
	function initializeEntity(arg: any): number {
		if (!state.kernel) {
			logger.error('Kernel not available', null, {
				operation: 'initializeEntity'
			});
			return ErrorCode.EINVAL;
		}

		// Check that we have an entity path
		if (!arg || !arg.entityPath) {
			logger.error('Missing entity path for initialization', null, {
				operation: 'initializeEntity'
			});
			return ErrorCode.EINVAL;
		}

		const entityPath = arg.entityPath;

		// Ensure proc directory exists
		const procDir = ABILITY_PATHS.PROC_CHARACTER;
		if (!state.kernel.exists(procDir)) {
			log(`Creating directory: ${procDir}`);
			const mkdirResult = state.kernel.mkdir(procDir);
			if (mkdirResult !== ErrorCode.SUCCESS) {
				logger.error(`Failed to create directory: ${procDir}`, null, {
					operation: 'initializeEntity.mkdir',
					path: procDir,
					errorCode: mkdirResult
				});
				return mkdirResult;
			}
		}

		return withFile(state.kernel, entityPath, OpenMode.READ_WRITE, (fd) => {
			// Read entity data
			const [readResult, entity] = state.kernel.read(fd);
			if (readResult !== ErrorCode.SUCCESS) {
				logger.error(`Failed to read entity: ${entityPath}`, null, {
					operation: 'initializeEntity.read',
					path: entityPath,
					fd,
					errorCode: readResult
				});
				return readResult;
			}

			// Initialize abilities property if needed
			if (!entity.properties.abilities) {
				entity.properties.abilities = {};
			}

			// Set default values for standard abilities
			for (const ability of state.defaultAbilities) {
				if (entity.properties.abilities[ability] === undefined) {
					entity.properties.abilities[ability] = 10;
				}
			}

			// Write updated entity
			const writeResult = state.kernel.write(fd, entity);
			if (writeResult !== ErrorCode.SUCCESS) {
				logger.error(`Failed to write entity: ${entityPath}`, null, {
					operation: 'initializeEntity.write',
					path: entityPath,
					fd,
					errorCode: writeResult
				});
				return writeResult;
			}

			log(`Initialized abilities for entity: ${entity.id}`);
			return ErrorCode.SUCCESS;
		}) as number;
	}

	/**
	 * Get ability score for an entity
	 * @param arg Arguments
	 * @param buffers Buffer map to store result
	 * @param fd File descriptor for response
	 * @returns ErrorCode (0 for success)
	 */
	function getAbilityScore(arg: any, buffers: Map<number, any>, fd: number): number {
		if (!state.kernel) {
			logger.error('Kernel not available', null, {
				operation: 'getAbilityScore'
			});
			return ErrorCode.EINVAL;
		}

		// Check that we have entity path and ability
		if (!arg || !arg.entityPath || !arg.ability) {
			logger.error('Missing entity path or ability name', null, {
				operation: 'getAbilityScore',
				arg: JSON.stringify(arg)
			});
			return ErrorCode.EINVAL;
		}

		const entityPath = arg.entityPath;
		const abilityName = arg.ability;

		// Ensure proc directory exists
		const procDir = ABILITY_PATHS.PROC_CHARACTER;
		if (!state.kernel.exists(procDir)) {
			log(`Creating directory: ${procDir}`);
			const mkdirResult = state.kernel.mkdir(procDir);
			if (mkdirResult !== ErrorCode.SUCCESS) {
				logger.error(`Failed to create directory: ${procDir}`, null, {
					operation: 'getAbilityScore.mkdir',
					path: procDir,
					errorCode: mkdirResult
				});
				return mkdirResult;
			}
		}

		// Open entity file
		const entityFd = state.kernel.open(entityPath, OpenMode.READ);
		if (entityFd < 0) {
			logger.error(`Failed to open entity: ${entityPath}`, null, {
				operation: 'getAbilityScore.open',
				path: entityPath
			});
			return ErrorCode.ENOENT;
		}

		try {
			// Read entity data
			const [readResult, entity] = state.kernel.read(entityFd);
			if (readResult !== ErrorCode.SUCCESS) {
				logger.error(`Failed to read entity: ${readResult}`, null, {
					operation: 'getAbilityScore.read',
					path: entityPath,
					errorCode: readResult
				});
				return readResult;
			}

			// Get ability score
			const score = getAbilityScoreForEntity(entity, abilityName);

			// Store result in buffer
			buffers.set(fd, { score });

			return ErrorCode.SUCCESS;
		} finally {
			// Always close file descriptor
			state.kernel.close(entityFd);
		}
	}

	/**
	 * Set ability score for an entity
	 * @param arg Arguments
	 * @returns ErrorCode (0 for success)
	 */
	function setAbilityScore(arg: any): number {
		if (!state.kernel) {
			logger.error('Kernel not available', null, {
				operation: 'setAbilityScore'
			});
			return ErrorCode.EINVAL;
		}

		// Check that we have entity path, ability, and value
		if (!arg || !arg.entityPath || !arg.ability || arg.value === undefined) {
			logger.error('Missing entity path, ability name, or value', null, {
				operation: 'setAbilityScore',
				arg: JSON.stringify(arg)
			});
			return ErrorCode.EINVAL;
		}

		const entityPath = arg.entityPath;
		const abilityName = arg.ability;
		const value = arg.value;

		// Ensure proc directory exists
		const procDir = ABILITY_PATHS.PROC_CHARACTER;
		if (!state.kernel.exists(procDir)) {
			log(`Creating directory: ${procDir}`);
			const mkdirResult = state.kernel.mkdir(procDir);
			if (mkdirResult !== ErrorCode.SUCCESS) {
				logger.error(`Failed to create directory: ${procDir}`, null, {
					operation: 'setAbilityScore.mkdir',
					path: procDir,
					errorCode: mkdirResult
				});
				return mkdirResult;
			}
		}

		// Open entity file
		const entityFd = state.kernel.open(entityPath, OpenMode.READ_WRITE);
		if (entityFd < 0) {
			logger.error(`Failed to open entity: ${entityPath}`, null, {
				operation: 'setAbilityScore.open',
				path: entityPath
			});
			return ErrorCode.ENOENT;
		}

		try {
			// Read entity data
			const [readResult, entity] = state.kernel.read(entityFd);
			if (readResult !== ErrorCode.SUCCESS) {
				logger.error(`Failed to read entity: ${readResult}`, null, {
					operation: 'setAbilityScore.read',
					path: entityPath,
					errorCode: readResult
				});
				return readResult;
			}

			// Initialize abilities if needed
			if (!entity.properties.abilities) {
				entity.properties.abilities = {};
			}

			// Set ability score
			entity.properties.abilities[abilityName] = value;

			// Update entity timestamp
			entity.metadata.updatedAt = Date.now();

			// Write updated entity
			const writeResult = state.kernel.write(entityFd, entity);
			if (writeResult !== ErrorCode.SUCCESS) {
				logger.error(`Failed to write entity: ${writeResult}`, null, {
					operation: 'setAbilityScore.write',
					path: entityPath,
					errorCode: writeResult
				});
				return writeResult;
			}

			log(`Set ${abilityName} to ${value} for entity: ${entity.id}`);
			return ErrorCode.SUCCESS;
		} finally {
			// Always close file descriptor
			state.kernel.close(entityFd);
		}
	}

	/**
	 * Get ability modifier for an entity
	 * @param arg Arguments
	 * @param buffers Buffer map to store result
	 * @param fd File descriptor for response
	 * @returns ErrorCode (0 for success)
	 */
	function getAbilityModifier(arg: any, buffers: Map<number, any>, fd: number): number {
		if (!state.kernel) {
			logger.error('Kernel not available', null, {
				operation: 'getAbilityModifier'
			});
			return ErrorCode.EINVAL;
		}

		// Check that we have entity path and ability
		if (!arg || !arg.entityPath || !arg.ability) {
			logger.error('Missing entity path or ability name', null, {
				operation: 'getAbilityModifier',
				arg: JSON.stringify(arg)
			});
			return ErrorCode.EINVAL;
		}

		const entityPath = arg.entityPath;
		const abilityName = arg.ability;

		// Ensure proc directory exists
		const procDir = ABILITY_PATHS.PROC_CHARACTER;
		if (!state.kernel.exists(procDir)) {
			log(`Creating directory: ${procDir}`);
			const mkdirResult = state.kernel.mkdir(procDir);
			if (mkdirResult !== ErrorCode.SUCCESS) {
				logger.error(`Failed to create directory: ${procDir}`, null, {
					operation: 'getAbilityModifier.mkdir',
					path: procDir,
					errorCode: mkdirResult
				});
				return mkdirResult;
			}
		}

		// Open entity file
		const entityFd = state.kernel.open(entityPath, OpenMode.READ);
		if (entityFd < 0) {
			logger.error(`Failed to open entity: ${entityPath}`, null, {
				operation: 'getAbilityModifier.open',
				path: entityPath
			});
			return ErrorCode.ENOENT;
		}

		try {
			// Read entity data
			const [readResult, entity] = state.kernel.read(entityFd);
			if (readResult !== ErrorCode.SUCCESS) {
				logger.error(`Failed to read entity: ${readResult}`, null, {
					operation: 'getAbilityModifier.read',
					path: entityPath,
					errorCode: readResult
				});
				return readResult;
			}

			// Get ability score
			const score = getAbilityScoreForEntity(entity, abilityName);

			// Calculate modifier
			const modifier = Math.floor((score - 10) / 2);

			// Store result in buffer
			buffers.set(fd, { modifier });

			return ErrorCode.SUCCESS;
		} finally {
			// Always close file descriptor
			state.kernel.close(entityFd);
		}
	}

	/**
	 * Get ability breakdown for an entity
	 * @param arg Arguments
	 * @param buffers Buffer map to store result
	 * @param fd File descriptor for response
	 * @returns ErrorCode (0 for success)
	 */
	function getAbilityBreakdown(arg: any, buffers: Map<number, any>, fd: number): number {
		if (!state.kernel) {
			logger.error('Kernel not available', null, {
				operation: 'getAbilityBreakdown'
			});
			return ErrorCode.EINVAL;
		}

		// Check that we have entity path and ability
		if (!arg || !arg.entityPath || !arg.ability) {
			logger.error('Missing entity path or ability name', null, {
				operation: 'getAbilityBreakdown',
				arg: JSON.stringify(arg)
			});
			return ErrorCode.EINVAL;
		}

		const entityPath = arg.entityPath;
		const abilityName = arg.ability;

		// Ensure proc directory exists
		const procDir = ABILITY_PATHS.PROC_CHARACTER;
		if (!state.kernel.exists(procDir)) {
			log(`Creating directory: ${procDir}`);
			const mkdirResult = state.kernel.mkdir(procDir);
			if (mkdirResult !== ErrorCode.SUCCESS) {
				logger.error(`Failed to create directory: ${procDir}`, null, {
					operation: 'getAbilityBreakdown.mkdir',
					path: procDir,
					errorCode: mkdirResult
				});
				return mkdirResult;
			}
		}

		// Open entity file
		const entityFd = state.kernel.open(entityPath, OpenMode.READ);
		if (entityFd < 0) {
			logger.error(`Failed to open entity: ${entityPath}`, null, {
				operation: 'getAbilityBreakdown.open',
				path: entityPath
			});
			return ErrorCode.ENOENT;
		}

		try {
			// Read entity data
			const [readResult, entity] = state.kernel.read(entityFd);
			if (readResult !== ErrorCode.SUCCESS) {
				logger.error(`Failed to read entity: ${readResult}`, null, {
					operation: 'getAbilityBreakdown.read',
					path: entityPath,
					errorCode: readResult
				});
				return readResult;
			}

			// Get ability breakdown
			const breakdown = getAbilityBreakdownForEntity(entity, abilityName);

			// Store result in buffer
			buffers.set(fd, breakdown);

			return ErrorCode.SUCCESS;
		} finally {
			// Always close file descriptor
			state.kernel.close(entityFd);
		}
	}

	/**
	 * Apply a bonus to an ability
	 * @param arg Arguments
	 * @returns ErrorCode (0 for success)
	 */
	function applyAbilityBonus(arg: any): number {
		if (!state.kernel) {
			logger.error('Kernel not available', null, {
				operation: 'applyAbilityBonus'
			});
			return ErrorCode.EINVAL;
		}

		// Check that we have entity path, ability, value, type, and source
		if (
			!arg ||
			!arg.entityPath ||
			!arg.ability ||
			arg.value === undefined ||
			!arg.type ||
			!arg.source
		) {
			logger.error('Missing required arguments for apply bonus operation', null, {
				operation: 'applyAbilityBonus',
				arg: JSON.stringify(arg)
			});
			return ErrorCode.EINVAL;
		}

		const entityPath = arg.entityPath;
		const abilityName = arg.ability;
		const value = arg.value;
		const type = arg.type;
		const source = arg.source;

		// Ensure proc directory exists
		const procDir = ABILITY_PATHS.PROC_CHARACTER;
		if (!state.kernel.exists(procDir)) {
			log(`Creating directory: ${procDir}`);
			const mkdirResult = state.kernel.mkdir(procDir);
			if (mkdirResult !== ErrorCode.SUCCESS) {
				logger.error(`Failed to create directory: ${procDir}`, null, {
					operation: 'applyAbilityBonus.mkdir',
					path: procDir,
					errorCode: mkdirResult
				});
				return mkdirResult;
			}
		}

		// Open entity file
		const entityFd = state.kernel.open(entityPath, OpenMode.READ_WRITE);
		if (entityFd < 0) {
			logger.error(`Failed to open entity: ${entityPath}`, null, {
				operation: 'applyAbilityBonus.open',
				path: entityPath
			});
			return ErrorCode.ENOENT;
		}

		try {
			// Read entity data
			const [readResult, entity] = state.kernel.read(entityFd);
			if (readResult !== ErrorCode.SUCCESS) {
				logger.error(`Failed to read entity: ${readResult}`, null, {
					operation: 'applyAbilityBonus.read',
					path: entityPath,
					errorCode: readResult
				});
				return readResult;
			}

			// Apply bonus
			applyAbilityBonusToEntity(entity, abilityName, value, type, source);

			// Write updated entity
			const writeResult = state.kernel.write(entityFd, entity);
			if (writeResult !== ErrorCode.SUCCESS) {
				logger.error(`Failed to write entity: ${writeResult}`, null, {
					operation: 'applyAbilityBonus.write',
					path: entityPath,
					errorCode: writeResult
				});
				return writeResult;
			}

			log(`Applied ${type} bonus of ${value} to ${abilityName} for entity: ${entity.id}`);
			return ErrorCode.SUCCESS;
		} finally {
			// Always close file descriptor
			state.kernel.close(entityFd);
		}
	}

	/**
	 * Remove a bonus from an ability
	 * @param arg Arguments
	 * @returns ErrorCode (0 for success)
	 */
	function removeAbilityBonus(arg: any): number {
		if (!state.kernel) {
			logger.error('Kernel not available', null, {
				operation: 'removeAbilityBonus'
			});
			return ErrorCode.EINVAL;
		}

		// Check that we have entity path, ability, and source
		if (!arg || !arg.entityPath || !arg.ability || !arg.source) {
			logger.error('Missing required arguments for remove bonus operation', null, {
				operation: 'removeAbilityBonus',
				arg: JSON.stringify(arg)
			});
			return ErrorCode.EINVAL;
		}

		const entityPath = arg.entityPath;
		const abilityName = arg.ability;
		const source = arg.source;

		// Ensure proc directory exists
		const procDir = ABILITY_PATHS.PROC_CHARACTER;
		if (!state.kernel.exists(procDir)) {
			log(`Creating directory: ${procDir}`);
			const mkdirResult = state.kernel.mkdir(procDir);
			if (mkdirResult !== ErrorCode.SUCCESS) {
				logger.error(`Failed to create directory: ${procDir}`, null, {
					operation: 'removeAbilityBonus.mkdir',
					path: procDir,
					errorCode: mkdirResult
				});
				return mkdirResult;
			}
		}

		// Open entity file
		const entityFd = state.kernel.open(entityPath, OpenMode.READ_WRITE);
		if (entityFd < 0) {
			logger.error(`Failed to open entity: ${entityPath}`, null, {
				operation: 'removeAbilityBonus.open',
				path: entityPath
			});
			return ErrorCode.ENOENT;
		}

		try {
			// Read entity data
			const [readResult, entity] = state.kernel.read(entityFd);
			if (readResult !== ErrorCode.SUCCESS) {
				logger.error(`Failed to read entity: ${readResult}`, null, {
					operation: 'removeAbilityBonus.read',
					path: entityPath,
					errorCode: readResult
				});
				return readResult;
			}

			// Remove bonus
			removeAbilityBonusFromEntity(entity, abilityName, source);

			// Write updated entity
			const writeResult = state.kernel.write(entityFd, entity);
			if (writeResult !== ErrorCode.SUCCESS) {
				logger.error(`Failed to write entity: ${writeResult}`, null, {
					operation: 'removeAbilityBonus.write',
					path: entityPath,
					errorCode: writeResult
				});
				return writeResult;
			}

			log(`Removed bonus from ${abilityName} for entity: ${entity.id}`);
			return ErrorCode.SUCCESS;
		} finally {
			// Always close file descriptor
			state.kernel.close(entityFd);
		}
	}

	/**
	 * Get total ability score for an entity
	 * @param entity Entity to get score for
	 * @param ability Ability name
	 * @returns Total ability score
	 */
	function getAbilityScoreForEntity(entity: Entity, ability: string): number {
		// Get base score
		const base = entity.properties.abilities?.[ability] || 10;

		// Get bonuses
		const bonusTotal = getBonusTotal(entity, ability);

		return base + bonusTotal;
	}

	/**
	 * Get a detailed breakdown of an ability score
	 * @param entity Entity to get breakdown for
	 * @param ability Ability name
	 * @returns Ability breakdown
	 */
	function getAbilityBreakdownForEntity(entity: Entity, ability: string): AbilityBreakdown {
		// Get base score
		const base = entity.properties.abilities?.[ability] || 10;

		// Get bonus modifiers
		const modifiers = getBonusModifiers(entity, ability);

		// Calculate total
		const total = base + modifiers.reduce((sum, mod) => sum + mod.value, 0);

		// Calculate modifier
		const modifier = Math.floor((total - 10) / 2);

		return {
			ability,
			base,
			total,
			modifier,
			modifiers
		};
	}

	/**
	 * Apply a bonus to an ability
	 * @param entity Entity to apply bonus to
	 * @param ability Ability name
	 * @param value Bonus value
	 * @param type Bonus type
	 * @param source Bonus source
	 */
	function applyAbilityBonusToEntity(
		entity: Entity,
		ability: string,
		value: number,
		type: string,
		source: string
	): void {
		// Use bonus capability to apply bonus
		bonusCapability.addBonus(entity, ability, value, type, source);
	}

	/**
	 * Remove a bonus from an ability
	 * @param entity Entity to remove bonus from
	 * @param ability Ability name
	 * @param source Bonus source
	 */
	function removeAbilityBonusFromEntity(entity: Entity, ability: string, source: string): void {
		// Use bonus capability to remove bonus
		bonusCapability.removeBonus(entity, ability, source);
	}

	/**
	 * Get the total bonus for an ability
	 * @param entity Entity to get bonus for
	 * @param ability Ability name
	 * @returns Total bonus
	 */
	function getBonusTotal(entity: Entity, ability: string): number {
		return bonusCapability.calculateTotal(entity, ability);
	}

	/**
	 * Get a list of bonus modifiers for an ability
	 * @param entity Entity to get modifiers for
	 * @param ability Ability name
	 * @returns List of bonus modifiers
	 */
	function getBonusModifiers(entity: Entity, ability: string): { source: string; value: number }[] {
		const breakdown = bonusCapability.getBreakdown(entity, ability);
		return breakdown.modifiers || [];
	}
}
