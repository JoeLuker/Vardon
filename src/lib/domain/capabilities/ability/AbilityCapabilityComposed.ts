/**
 * Ability Capability - Unix Architecture Implementation (Composed Version)
 *
 * This module implements a Unix-style device driver for ability scores
 * using the composition pattern and the new persistent Kernel.
 *
 * It follows Unix principles:
 * - Device exposes operations through file operations (read, write, ioctl)
 * - Clear separation between device interface and implementation
 * - Device handles its own resource management
 * - Consistent error handling with error codes
 * - Persistence through the filesystem
 */

import type { Entity, Capability } from '../../kernel/types';
import { ErrorCode, OpenMode } from '../../kernel/types';
import type { Kernel } from '../../kernel/Kernel';
import { createErrorLogger } from '../../kernel/ErrorHandler';
import type { BonusCapability } from '../bonus';
import {
	createCapability,
	createIoctlHandler,
	withEntity,
	withEntitySync,
	handleInitializeOperation,
	performEntityOperation,
	log,
	error,
	type CapabilityContext
} from '../CapabilityKit';

// Device file paths
export const ABILITY_PATHS = {
	DEVICE: '/dev/ability',
	PROC_CHARACTER: '/proc/character',
	VIRTUAL_FILES: '/proc/ability'
};

// Operation request codes
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
 * Create a Unix-style ability device using composition pattern
 * @param bonusCapability Bonus capability dependency
 * @param options Device options
 * @returns A capability for ability operations
 */
export function createAbilityCapability(
	bonusCapability: BonusCapability,
	options: { debug?: boolean } = {}
): Capability {
	// Create the capability with the CapabilityKit
	return createCapability({
		id: 'ability',
		debug: options.debug,
		version: '2.0.0',

		// Initialization handler
		onMount: (kernel: Kernel) => {
			// Initialize device directories
			kernel.mkdir('/proc/ability', true);
			kernel.mkdir('/proc/ability/cache', true);
			kernel.mkdir(ABILITY_PATHS.PROC_CHARACTER, true);

			// Create device metadata file
			kernel.create('/proc/ability/info.json', {
				name: 'ability',
				version: '2.0.0',
				description: 'Unix-style device driver for ability scores',
				abilities: STANDARD_ABILITIES
			});

			// Don't return anything - we're using void return type now
		},

		// Read handler
		onRead: (fd: number, buffer: any, context: CapabilityContext) => {
			const fileInfo = context.openFiles.get(fd);
			if (!fileInfo) {
				context.logger.error(`Invalid file descriptor: ${fd}`);
				return ErrorCode.EBADF;
			}

			const path = fileInfo.path;

			// Check for entity ability path pattern
			const entityMatch = path.match(/\/entity\/([^\/]+)\/abilities(?:\/([^\/]+))?/);
			if (entityMatch) {
				return readEntityAbility(context, entityMatch[1], entityMatch[2], buffer);
			}

			// Check for proc file paths
			if (path === '/proc/ability/info.json') {
				Object.assign(buffer, {
					name: 'ability',
					version: '2.0.0',
					description: 'Unix-style device driver for ability scores',
					abilities: STANDARD_ABILITIES
				});
				return ErrorCode.SUCCESS;
			}

			// Check for IOCTL stored data
			const storageKeys = [
				'all_abilities',
				...STANDARD_ABILITIES.map((ability) => `breakdown_${ability}`)
			];

			for (const key of storageKeys) {
				const data = context.storage.get(key);
				if (data) {
					// Copy data to buffer
					if (key === 'all_abilities') {
						// For all abilities, copy each ability to the buffer directly
						Object.assign(buffer, data);
					} else {
						// For single ability, copy the breakdown
						Object.assign(buffer, data);
					}
					return ErrorCode.SUCCESS;
				}
			}

			// If we've read from the device after an IOCTL call,
			// this is most likely the case when we're trying to read
			// IOCTL operation results, so we'll check for all stored data
			if (path === ABILITY_PATHS.DEVICE) {
				// Check if we have any stored data for abilities
				for (const key of Array.from(context.storage.keys())) {
					// If we find any ability-related data, return it
					if (key.startsWith('breakdown_') || key === 'all_abilities') {
						const data = context.storage.get(key);
						if (data) {
							if (key === 'all_abilities') {
								Object.assign(buffer, data);
							} else {
								Object.assign(buffer, data);
							}
							return ErrorCode.SUCCESS;
						}
					}
				}
			}

			context.logger.error(`Unrecognized path: ${path}`);
			return ErrorCode.EINVAL;
		},

		// Write handler
		onWrite: (fd: number, buffer: any, context: CapabilityContext) => {
			const fileInfo = context.openFiles.get(fd);
			if (!fileInfo) {
				context.logger.error(`Invalid file descriptor: ${fd}`);
				return ErrorCode.EBADF;
			}

			const path = fileInfo.path;

			// Check for entity ability path pattern
			const entityMatch = path.match(/\/entity\/([^\/]+)\/abilities(?:\/([^\/]+))?/);
			if (entityMatch) {
				return writeEntityAbility(context, entityMatch[1], entityMatch[2], buffer);
			}

			context.logger.error(`Unrecognized path: ${path}`);
			return ErrorCode.EINVAL;
		},

		// IOCTL handler
		onIoctl: createIoctlHandler(
			{
				id: 'ability',
				debug: options.debug || false,
				version: '2.0.0',
				kernel: null,
				storage: new Map(),
				openFiles: new Map(),
				logger: createErrorLogger('ability'),
				bonusCapability
			},
			{
				// Initialize ability scores for an entity
				initialize: (context, entityPath) => {
					return handleInitializeOperation(context, entityPath, (entity) => {
						// Initialize abilities property if needed
						if (!entity.properties.abilities) {
							entity.properties.abilities = {};
						}

						// Set default values for standard abilities
						for (const ability of STANDARD_ABILITIES) {
							if (entity.properties.abilities[ability] === undefined) {
								entity.properties.abilities[ability] = 10;
							}
						}
					});
				},

				// Get ability score for an entity
				getScore: (context, entityPath, args) => {
					if (!args.ability) {
						context.logger.error('Missing ability name');
						return ErrorCode.EINVAL;
					}

					// Use EntitySync utility to handle file operations
					const result = withEntitySync(context, entityPath.split('/').pop() || '', (entity) => {
						const score = getAbilityScoreForEntity(entity, args.ability, context);
						// Store result in context storage to be retrieved later
						context.storage.set(`score_${args.ability}`, score);
						return score;
					});

					if (!result.success) {
						context.logger.error(`Failed to get ability score: ${result.errorMessage}`);
						return result.errorCode || ErrorCode.EIO;
					}

					return ErrorCode.SUCCESS;
				},

				// Set ability score for an entity
				setScore: (context, entityPath, args) => {
					if (!args.ability || args.value === undefined) {
						context.logger.error('Missing ability name or value');
						return ErrorCode.EINVAL;
					}

					return performEntityOperation(context, entityPath, (entity) => {
						if (!entity.properties.abilities) {
							entity.properties.abilities = {};
						}

						entity.properties.abilities[args.ability] = args.value;
						entity.metadata.updatedAt = Date.now();
					});
				},

				// Get ability modifier for an entity
				getModifier: (context, entityPath, args) => {
					if (!args.ability) {
						context.logger.error('Missing ability name');
						return ErrorCode.EINVAL;
					}

					// Use EntitySync utility to handle file operations
					const result = withEntitySync(context, entityPath.split('/').pop() || '', (entity) => {
						const score = getAbilityScoreForEntity(entity, args.ability, context);
						const modifier = Math.floor((score - 10) / 2);

						// Store result in context storage to be retrieved later
						context.storage.set(`modifier_${args.ability}`, modifier);
						return modifier;
					});

					if (!result.success) {
						context.logger.error(`Failed to get ability modifier: ${result.errorMessage}`);
						return result.errorCode || ErrorCode.EIO;
					}

					return ErrorCode.SUCCESS;
				},

				// Get ability breakdown for an entity
				getBreakdown: (context, entityPath, args) => {
					if (!args.ability) {
						context.logger.error('Missing ability name');
						return ErrorCode.EINVAL;
					}

					if (!context.kernel) {
						context.logger.error('Kernel not available, cannot get ability breakdown');
						return ErrorCode.ENODEV;
					}

					// Get entity ID from path
					const entityId = entityPath.split('/').pop() || '';

					// Verify entity exists, create it if it doesn't
					const entityPath2 = `/entity/${entityId}`;
					if (!context.kernel.exists(entityPath2)) {
						context.logger.warn(`Entity ${entityId} doesn't exist, creating it`);
						try {
							// Ensure parent directory exists
							if (!context.kernel.exists('/entity')) {
								context.kernel.mkdir('/entity', true);
							}

							// Create entity file with basic structure
							context.kernel.create(entityPath2, {
								id: entityId,
								type: 'character',
								properties: {
									abilities: {}
								},
								metadata: {
									createdAt: Date.now(),
									updatedAt: Date.now()
								}
							});
						} catch (err) {
							context.logger.error(`Failed to create entity: ${err}`);
							return ErrorCode.EIO;
						}
					}

					// Handle 'all' ability parameter
					if (args.ability === 'all') {
						// Get all abilities
						const result = withEntitySync(context, entityId, (entity) => {
							const abilities: Record<string, any> = {};

							// Process each standard ability
							for (const ability of STANDARD_ABILITIES) {
								abilities[ability] = getAbilityBreakdownForEntity(entity, ability, context);
							}

							// Store result for all abilities
							context.storage.set('all_abilities', abilities);
							return abilities;
						});

						if (!result.success) {
							context.logger.error(`Failed to get all ability breakdowns: ${result.errorMessage}`);
							return result.errorCode || ErrorCode.EIO;
						}

						return ErrorCode.SUCCESS;
					}

					// Handle single ability case
					const result = withEntitySync(context, entityId, (entity) => {
						const breakdown = getAbilityBreakdownForEntity(entity, args.ability, context);

						// Store result in context storage to be retrieved later
						context.storage.set(`breakdown_${args.ability}`, breakdown);
						return breakdown;
					});

					if (!result.success) {
						context.logger.error(`Failed to get ability breakdown: ${result.errorMessage}`);
						return result.errorCode || ErrorCode.EIO;
					}

					return ErrorCode.SUCCESS;
				},

				// Apply bonus to an ability
				applyBonus: (context, entityPath, args) => {
					if (!args.ability || args.value === undefined || !args.type || !args.source) {
						context.logger.error('Missing required arguments for apply bonus operation');
						return ErrorCode.EINVAL;
					}

					return performEntityOperation(context, entityPath, (entity) => {
						// Apply bonus through the bonus capability
						const bonusCap = context.bonusCapability;
						if (!bonusCap) {
							context.logger.error('Bonus capability not available');
							return;
						}

						bonusCap.addBonus(entity, args.ability, args.value, args.type, args.source);
						entity.metadata.updatedAt = Date.now();
					});
				},

				// Remove bonus from an ability
				removeBonus: (context, entityPath, args) => {
					if (!args.ability || !args.source) {
						context.logger.error('Missing required arguments for remove bonus operation');
						return ErrorCode.EINVAL;
					}

					return performEntityOperation(context, entityPath, (entity) => {
						// Remove bonus through the bonus capability
						const bonusCap = context.bonusCapability;
						if (!bonusCap) {
							context.logger.error('Bonus capability not available');
							return;
						}

						bonusCap.removeBonus(entity, args.ability, args.source);
						entity.metadata.updatedAt = Date.now();
					});
				}
			}
		)
	});

	/**
	 * Read ability score(s) for an entity
	 * @param context Capability context
	 * @param entityId Entity ID
	 * @param abilityName Ability name (or 'all' for all abilities)
	 * @param buffer Buffer to read into
	 * @returns ErrorCode (0 for success)
	 */
	function readEntityAbility(
		context: CapabilityContext,
		entityId: string,
		abilityName: string | undefined,
		buffer: any
	): number {
		return withEntitySync(context, entityId, (entity) => {
			// Check if entity has abilities
			if (!entity.properties.abilities) {
				context.logger.error(`Entity does not have abilities: ${entityId}`);
				return ErrorCode.ENOENT;
			}

			// Read all abilities or a specific one
			if (!abilityName || abilityName === 'all') {
				// Read all abilities
				const abilities: Record<string, any> = {};

				for (const ability of STANDARD_ABILITIES) {
					abilities[ability] = getAbilityBreakdownForEntity(entity, ability, context);
				}

				// Store in buffer
				Object.assign(buffer, { abilities });
			} else {
				// Read specific ability
				const breakdown = getAbilityBreakdownForEntity(entity, abilityName, context);

				// Store in buffer
				Object.assign(buffer, breakdown);
			}

			return ErrorCode.SUCCESS;
		}) as number;
	}

	/**
	 * Write to an ability for an entity
	 * @param context Capability context
	 * @param entityId Entity ID
	 * @param abilityName Ability name
	 * @param buffer Data to write
	 * @returns ErrorCode (0 for success)
	 */
	function writeEntityAbility(
		context: CapabilityContext,
		entityId: string,
		abilityName: string | undefined,
		buffer: any
	): number {
		// Need ability name for writes
		if (!abilityName) {
			context.logger.error('Missing ability name for write operation');
			return ErrorCode.EINVAL;
		}

		return withEntitySync(context, entityId, (entity) => {
			// Initialize abilities if needed
			if (!entity.properties.abilities) {
				entity.properties.abilities = {};
			}

			// Check what operation to perform
			if (buffer.value !== undefined) {
				// Set base ability score
				entity.properties.abilities[abilityName] = buffer.value;
			} else if (buffer.bonus) {
				// Apply a bonus via bonusCapability
				const bonusCap = context.bonusCapability;
				if (!bonusCap) {
					context.logger.error('Bonus capability not available');
					return ErrorCode.EINVAL;
				}

				bonusCap.addBonus(
					entity,
					abilityName,
					buffer.bonus.value,
					buffer.bonus.type || 'untyped',
					buffer.bonus.source || 'unknown'
				);
			} else if (buffer.removeBonus) {
				// Remove a bonus via bonusCapability
				const bonusCap = context.bonusCapability;
				if (!bonusCap) {
					context.logger.error('Bonus capability not available');
					return ErrorCode.EINVAL;
				}

				bonusCap.removeBonus(entity, abilityName, buffer.removeBonus.source);
			} else {
				context.logger.error('Invalid write operation');
				return ErrorCode.EINVAL;
			}

			// Update entity timestamp
			entity.metadata.updatedAt = Date.now();

			return ErrorCode.SUCCESS;
		}) as number;
	}

	/**
	 * Get total ability score for an entity
	 * @param entity Entity to get score for
	 * @param ability Ability name
	 * @param context Capability context
	 * @returns Total ability score
	 */
	function getAbilityScoreForEntity(
		entity: Entity,
		ability: string,
		context: CapabilityContext
	): number {
		// Get base score
		const base = entity.properties.abilities?.[ability] || 10;

		// Get bonuses from bonus capability
		const bonusCap = context.bonusCapability;
		if (!bonusCap) {
			context.logger.error('Bonus capability not available');
			return base;
		}

		const bonusTotal = bonusCap.calculateTotal(entity, ability);

		return base + bonusTotal;
	}

	/**
	 * Get a detailed breakdown of an ability score
	 * @param entity Entity to get breakdown for
	 * @param ability Ability name
	 * @param context Capability context
	 * @returns Ability breakdown
	 */
	function getAbilityBreakdownForEntity(
		entity: Entity,
		ability: string,
		context: CapabilityContext
	): AbilityBreakdown {
		// Get base score
		const base = entity.properties.abilities?.[ability] || 10;

		// Get bonus modifiers
		const bonusCap = context.bonusCapability;
		if (!bonusCap) {
			context.logger.error('Bonus capability not available');
			return {
				ability,
				base,
				total: base,
				modifier: Math.floor((base - 10) / 2),
				modifiers: []
			};
		}

		const breakdown = bonusCap.getBreakdown(entity, ability);
		const modifiers = breakdown.modifiers || [];

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
}
