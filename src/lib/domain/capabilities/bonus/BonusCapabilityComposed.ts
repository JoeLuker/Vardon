/**
 * Bonus Capability Provider (Composed Version)
 *
 * This module implements the bonus capability using composition rather than inheritance.
 * It follows Unix philosophy of simple, composable tools that do one thing well.
 *
 * Each operation is implemented as a separate function rather than a method on a class.
 */

import type { Entity } from '../../kernel/types';
import { ErrorCode } from '../../kernel/types';
import type {
	BonusCapability,
	BonusCapabilityOptions,
	BonusBreakdown,
	Bonus,
	BonusType
} from './types';
import { createCapability, withEntity, log, error, type CapabilityContext } from '../CapabilityKit';
import { createErrorLogger } from '../../kernel/ErrorHandler';

/**
 * Types that stack by default
 */
export const STACKING_TYPES = ['untyped', 'circumstance', 'dodge', 'racial', 'trait'];

/**
 * Create a new bonus capability provider using composition
 * @param options Bonus capability options
 * @returns Composed bonus capability
 */
export function createBonusCapability(options: BonusCapabilityOptions = {}): BonusCapability {
	// Create shared context
	const context: CapabilityContext & {
		stackSameType: boolean;
		stackingTypes: string[];
	} = {
		id: 'bonus',
		debug: options.debug || false,
		version: options.version || '1.0.0',
		kernel: null,
		storage: new Map(),
		openFiles: new Map(),
		stackSameType: options.stackSameType || false,
		stackingTypes: STACKING_TYPES
	};

	// Create device capability
	const capability = createCapability({
		id: 'bonus',
		debug: options.debug,
		version: options.version,

		// Mount handler
		onMount(kernel) {
			context.kernel = kernel;
		},

		// Device operations
		onRead(fd, buffer, ctx) {
			return handleRead(fd, buffer, ctx);
		},

		onWrite(fd, buffer, ctx) {
			return handleWrite(fd, buffer, ctx);
		},

		onIoctl(fd, request, arg, ctx) {
			return handleIoctl(fd, request, arg, ctx);
		}
	});

	// Add domain-specific methods to the capability
	const enhancedCapability = Object.assign(capability, {
		// Domain methods
		addBonus: (entity: Entity, target: string, value: number, type: string, source: string) =>
			addBonus(context, entity, target, value, type, source),

		removeBonus: (entity: Entity, target: string, source: string) =>
			removeBonus(context, entity, target, source),

		calculateTotal: (entity: Entity, target: string) => calculateTotal(context, entity, target),

		getBreakdown: (entity: Entity, target: string) => getBreakdown(context, entity, target),

		hasBonus: (entity: Entity, target: string, source: string) =>
			hasBonus(context, entity, target, source),

		getAllBonuses: (entity: Entity) => getAllBonuses(context, entity),

		getComponents: (entity: Entity, target: string) => getComponents(context, entity, target),

		initialize: (entity: Entity) => initialize(context, entity)
	});

	return enhancedCapability;
}

/**
 * Initialize bonus system for an entity
 * @param context Capability context
 * @param entity Entity to initialize
 */
function initialize(context: any, entity: Entity): void {
	// Ensure the bonuses property exists
	if (!entity.properties.bonuses) {
		entity.properties.bonuses = {};
	}

	// Create logger function
	const logger = createErrorLogger('bonus');
	if (context.debug) {
		logger.debug(`Initialized bonus system for entity: ${entity.id}`);
	}
}

/**
 * Add a bonus to a specific target
 * @param context Capability context
 * @param entity Entity to add bonus to
 * @param target Target to apply bonus to (e.g. 'strength', 'attack')
 * @param value Bonus value
 * @param type Bonus type (e.g. 'enhancement', 'morale')
 * @param source Source of the bonus (e.g. 'Magic Weapon', 'Rage')
 */
function addBonus(
	context: any,
	entity: Entity,
	target: string,
	value: number,
	type: string,
	source: string
): void {
	const logger = createErrorLogger('bonus');
	if (context.debug) {
		logger.debug(
			`Adding bonus to '${target}' for entity ${entity.id}: ${value} ${type} from ${source}`
		);
	}

	// Ensure the bonuses property exists
	if (!entity.properties.bonuses) {
		entity.properties.bonuses = {};
	}

	// Ensure the target array exists
	if (!entity.properties.bonuses[target]) {
		entity.properties.bonuses[target] = [];
	}

	// Check if a bonus from this source already exists
	const existingIndex = entity.properties.bonuses[target].findIndex(
		(b: Bonus) => b.source === source
	);

	// Define the bonus component
	const bonusComponent: Bonus = {
		value,
		type,
		source,
		appliedAt: Date.now()
	};

	// If it exists, update it
	if (existingIndex !== -1) {
		entity.properties.bonuses[target][existingIndex] = bonusComponent;
	} else {
		// Otherwise, add it
		entity.properties.bonuses[target].push(bonusComponent);
	}

	// Update entity timestamp
	entity.metadata.updatedAt = Date.now();
}

/**
 * Remove all bonuses from a specific source
 * @param context Capability context
 * @param entity Entity to remove bonus from
 * @param target Target to remove bonus from
 * @param source Source of the bonus to remove
 */
function removeBonus(context: any, entity: Entity, target: string, source: string): void {
	const logger = createErrorLogger('bonus');
	if (context.debug) {
		logger.debug(`Removing bonus from '${target}' for entity ${entity.id}: ${source}`);
	}

	// Ensure the bonuses property exists
	if (!entity.properties.bonuses) {
		return;
	}

	// Ensure the target array exists
	if (!entity.properties.bonuses[target]) {
		return;
	}

	// Filter out bonuses from this source
	entity.properties.bonuses[target] = entity.properties.bonuses[target].filter(
		(b: Bonus) => b.source !== source
	);

	// If the target array is empty, remove it
	if (entity.properties.bonuses[target].length === 0) {
		delete entity.properties.bonuses[target];
	}

	// Update entity timestamp
	entity.metadata.updatedAt = Date.now();
}

/**
 * Calculate the total bonus value after applying stacking rules
 * @param context Capability context
 * @param entity Entity to calculate bonus for
 * @param target Target to calculate bonus for
 * @returns Total bonus value
 */
function calculateTotal(context: any, entity: Entity, target: string): number {
	// Ensure the bonuses property exists
	if (!entity.properties.bonuses) {
		return 0;
	}

	// Ensure the target array exists
	if (!entity.properties.bonuses[target]) {
		return 0;
	}

	// Group bonuses by type
	const bonusesByType: Record<string, Bonus[]> = {};
	for (const bonus of entity.properties.bonuses[target]) {
		if (!bonusesByType[bonus.type]) {
			bonusesByType[bonus.type] = [];
		}
		bonusesByType[bonus.type].push(bonus);
	}

	// Calculate total by applying stacking rules
	let total = 0;

	// For each type, apply stacking rules
	for (const type in bonusesByType) {
		const bonuses = bonusesByType[type];

		// Check if this type should stack
		const shouldStack = context.stackSameType || context.stackingTypes.includes(type);

		if (shouldStack) {
			// These types stack
			for (const bonus of bonuses) {
				total += bonus.value;
			}
		} else {
			// Take the highest bonus of this type
			let highestValue = 0;
			for (const bonus of bonuses) {
				if (bonus.value > highestValue) {
					highestValue = bonus.value;
				}
			}
			total += highestValue;
		}
	}

	return total;
}

/**
 * Get a detailed breakdown of bonus calculations
 * @param context Capability context
 * @param entity Entity to get bonus breakdown for
 * @param target Target to get bonus breakdown for
 * @returns Bonus breakdown
 */
function getBreakdown(context: any, entity: Entity, target: string): BonusBreakdown {
	// Create the base breakdown
	const breakdown: BonusBreakdown = {
		total: 0,
		base: 0,
		components: []
	};

	// Ensure the bonuses property exists
	if (!entity.properties.bonuses) {
		return breakdown;
	}

	// Ensure the target array exists
	if (!entity.properties.bonuses[target]) {
		return breakdown;
	}

	// Group bonuses by type
	const bonusesByType: Record<string, Bonus[]> = {};
	for (const bonus of entity.properties.bonuses[target]) {
		if (!bonusesByType[bonus.type]) {
			bonusesByType[bonus.type] = [];
		}
		bonusesByType[bonus.type].push(bonus);
	}

	// Calculate total by applying stacking rules
	let total = 0;
	const appliedComponents: Array<{ value: number; type: string; source: string }> = [];

	// For each type, apply stacking rules
	for (const type in bonusesByType) {
		const bonuses = bonusesByType[type];

		// Check if this type should stack
		const shouldStack = context.stackSameType || context.stackingTypes.includes(type);

		if (shouldStack) {
			// These types stack
			for (const bonus of bonuses) {
				total += bonus.value;
				appliedComponents.push({
					value: bonus.value,
					type: bonus.type,
					source: bonus.source
				});
			}
		} else {
			// Take the highest bonus of this type
			let highestValue = 0;
			let highestBonus: Bonus | null = null;

			for (const bonus of bonuses) {
				if (bonus.value > highestValue) {
					highestValue = bonus.value;
					highestBonus = bonus;
				}
			}

			if (highestBonus) {
				total += highestValue;
				appliedComponents.push({
					value: highestBonus.value,
					type: highestBonus.type,
					source: highestBonus.source
				});
			}
		}
	}

	// Set the breakdown values
	breakdown.total = total;
	breakdown.components = appliedComponents;

	return breakdown;
}

/**
 * Check if a specific bonus exists
 * @param context Capability context
 * @param entity Entity to check bonus for
 * @param target Target to check bonus for
 * @param source Source of the bonus to check
 * @returns Whether the bonus exists
 */
function hasBonus(context: any, entity: Entity, target: string, source: string): boolean {
	// Ensure the bonuses property exists
	if (!entity.properties.bonuses) {
		return false;
	}

	// Ensure the target array exists
	if (!entity.properties.bonuses[target]) {
		return false;
	}

	// Check if a bonus from this source exists
	return entity.properties.bonuses[target].some((b: Bonus) => b.source === source);
}

/**
 * Get all bonuses for an entity
 * @param context Capability context
 * @param entity Entity to get bonuses for
 * @returns Record of all bonuses by target
 */
function getAllBonuses(context: any, entity: Entity): Record<string, any> {
	// Ensure the bonuses property exists
	if (!entity.properties.bonuses) {
		return {};
	}

	return entity.properties.bonuses;
}

/**
 * Get components of a bonus
 * @param context Capability context
 * @param entity Entity to get bonus components for
 * @param target Target to get bonus components for
 * @returns Array of bonus components
 */
function getComponents(
	context: any,
	entity: Entity,
	target: string
): Array<{ source: string; value: number; type?: string }> {
	// Ensure the bonuses property exists
	if (!entity.properties.bonuses) {
		return [];
	}

	// Ensure the target array exists
	if (!entity.properties.bonuses[target]) {
		return [];
	}

	return entity.properties.bonuses[target];
}

/**
 * Handle IOCTL operations for the bonus capability
 * @param fd File descriptor
 * @param request Request code
 * @param arg Operation arguments
 * @param context Capability context
 * @returns Error code
 */
function handleIoctl(fd: number, request: number, arg: any, context: any): number {
	// Check if this is an initialization request
	if (arg && arg.operation === 'initialize' && arg.entityPath) {
		return handleInitializeOperation(arg.entityPath, context);
	}

	// Handle bonus add/remove operations
	if (
		arg &&
		arg.operation === 'addBonus' &&
		arg.entityPath &&
		arg.target &&
		arg.value !== undefined &&
		arg.type &&
		arg.source
	) {
		return handleAddBonusOperation(
			arg.entityPath,
			arg.target,
			arg.value,
			arg.type,
			arg.source,
			context
		);
	}

	if (arg && arg.operation === 'removeBonus' && arg.entityPath && arg.target && arg.source) {
		return handleRemoveBonusOperation(arg.entityPath, arg.target, arg.source, context);
	}

	// Unrecognized operation
	return ErrorCode.EINVAL;
}

/**
 * Handle initialization operation
 * @param entityPath Path to the entity
 * @param context Capability context
 * @returns Error code
 */
function handleInitializeOperation(entityPath: string, context: any): number {
	try {
		// Extract entity ID from path
		const entityId = entityPath.substring('/entity/'.length);

		// Use the withEntity helper to handle file operations
		return withEntitySync(context, entityId, (entity) => {
			// Initialize bonuses
			initialize(context, entity);
			return ErrorCode.SUCCESS;
		});
	} catch (err) {
		error(context, `Error processing initialize operation: ${err}`);
		return ErrorCode.EIO;
	}
}

/**
 * Handle add bonus operation
 * @param entityPath Path to the entity
 * @param target Target to add bonus to
 * @param value Bonus value
 * @param type Bonus type
 * @param source Bonus source
 * @param context Capability context
 * @returns Error code
 */
function handleAddBonusOperation(
	entityPath: string,
	target: string,
	value: number,
	type: string,
	source: string,
	context: any
): number {
	try {
		// Extract entity ID from path
		const entityId = entityPath.substring('/entity/'.length);

		// Use the withEntity helper to handle file operations
		return withEntitySync(context, entityId, (entity) => {
			// Add bonus
			addBonus(context, entity, target, value, type, source);
			return ErrorCode.SUCCESS;
		});
	} catch (err) {
		error(context, `Error processing addBonus operation: ${err}`);
		return ErrorCode.EIO;
	}
}

/**
 * Handle remove bonus operation
 * @param entityPath Path to the entity
 * @param target Target to remove bonus from
 * @param source Bonus source
 * @param context Capability context
 * @returns Error code
 */
function handleRemoveBonusOperation(
	entityPath: string,
	target: string,
	source: string,
	context: any
): number {
	try {
		// Extract entity ID from path
		const entityId = entityPath.substring('/entity/'.length);

		// Use the withEntity helper to handle file operations
		return withEntitySync(context, entityId, (entity) => {
			// Remove bonus
			removeBonus(context, entity, target, source);
			return ErrorCode.SUCCESS;
		});
	} catch (err) {
		error(context, `Error processing removeBonus operation: ${err}`);
		return ErrorCode.EIO;
	}
}

/**
 * Handle read operations for the bonus capability
 * @param fd File descriptor
 * @param buffer Buffer to read into
 * @param context Capability context
 * @returns Error code
 */
function handleRead(fd: number, buffer: any, context: any): number {
	// Check if this is a file descriptor for a bonus target
	const fileInfo = context.openFiles.get(fd);
	if (!fileInfo) {
		error(context, `Invalid file descriptor: ${fd}`);
		return ErrorCode.EBADF;
	}

	// Extract entity ID and target from path
	const match = fileInfo.path.match(/\/entity\/([^\/]+)\/bonuses\/([^\/]+)/);
	if (match) {
		const entityId = match[1];
		const target = match[2];

		// Use the withEntity helper to handle file operations
		return withEntitySync(context, entityId, (entity) => {
			if (target === 'all') {
				// Get all bonuses
				Object.assign(buffer, getAllBonuses(context, entity));
			} else {
				// Get specific target bonuses
				const breakdown = getBreakdown(context, entity, target);
				Object.assign(buffer, breakdown);
			}

			return ErrorCode.SUCCESS;
		});
	}

	// Unrecognized path
	return ErrorCode.EINVAL;
}

/**
 * Handle write operations for the bonus capability
 * @param fd File descriptor
 * @param buffer Buffer to write
 * @param context Capability context
 * @returns Error code
 */
function handleWrite(fd: number, buffer: any, context: any): number {
	// Check if this is a file descriptor for a bonus target
	const fileInfo = context.openFiles.get(fd);
	if (!fileInfo) {
		error(context, `Invalid file descriptor: ${fd}`);
		return ErrorCode.EBADF;
	}

	// Extract entity ID and target from path
	const match = fileInfo.path.match(/\/entity\/([^\/]+)\/bonuses\/([^\/]+)/);
	if (match) {
		const entityId = match[1];
		const target = match[2];

		// Use the withEntity helper to handle file operations
		return withEntitySync(context, entityId, (entity) => {
			if (buffer.addBonus) {
				// Add bonus
				const { value, type, source } = buffer.addBonus;
				if (value !== undefined && type && source) {
					addBonus(context, entity, target, value, type, source);
					return ErrorCode.SUCCESS;
				}
			}

			if (buffer.removeBonus) {
				// Remove bonus
				const { source } = buffer.removeBonus;
				if (source) {
					removeBonus(context, entity, target, source);
					return ErrorCode.SUCCESS;
				}
			}

			// Unrecognized command
			return ErrorCode.EINVAL;
		});
	}

	// Unrecognized path
	return ErrorCode.EINVAL;
}

/**
 * Synchronous version of withEntity for use in device operations
 * @param context Capability context
 * @param entityId Entity ID
 * @param operation Operation to perform
 * @returns Error code
 */
function withEntitySync<T extends number>(
	context: CapabilityContext,
	entityId: string,
	operation: (entity: Entity) => T
): T {
	const kernel = context.kernel;
	if (!kernel) {
		error(context, 'Kernel not available');
		return ErrorCode.EINVAL as T;
	}

	// Path to the entity file
	const entityPath = `/entity/${entityId}`;

	// Verify entity exists
	if (!kernel.exists(entityPath)) {
		error(context, `Entity not found: ${entityPath}`);
		return ErrorCode.ENOENT as T;
	}

	// Open the entity file
	const fd = kernel.open(entityPath, OpenMode.READ_WRITE);
	if (fd < 0) {
		error(context, `Failed to open entity file: ${entityPath}`);
		return fd as T;
	}

	try {
		// Read entity data
		const [result, entity] = kernel.read(fd);

		if (result !== 0) {
			error(context, `Failed to read entity: ${entityPath}, error code: ${result}`);
			return result as T;
		}

		// Perform the operation with the entity
		const opResult = operation(entity as Entity);

		// Write back the entity if operation succeeded
		if (opResult === 0) {
			const writeResult = kernel.write(fd, entity);

			if (writeResult !== 0) {
				error(context, `Failed to write entity: ${entityPath}, error code: ${writeResult}`);
				return writeResult as T;
			}
		}

		return opResult;
	} finally {
		// Always close the file descriptor
		kernel.close(fd);
	}
}
