/**
 * Skill Capability (Composed)
 *
 * This module implements the skill capability using Unix composition principles.
 * It provides access to skill calculations and management through file operations
 * following the Unix philosophy of "everything is a file" and "do one thing well".
 */

import type { Entity } from '../../kernel/types';
import { ErrorCode, OpenMode } from '../../kernel/types';
import type { SkillCapability, SkillCapabilityOptions, SkillBreakdown } from './types';
import type { AbilityCapability } from '../ability/types';
import type { BonusCapability } from '../bonus/types';
import {
	createCapability,
	log,
	error,
	type CapabilityContext,
	withEntity,
	withEntitySync
} from '../CapabilityKit';

/**
 * Extended capability context for skill capability
 */
interface SkillCapabilityContext extends CapabilityContext {
	/** Skill data */
	skills: Array<{
		id: number;
		name: string;
		abilityType: string;
		isTrainedOnly: boolean;
		hasArmorCheckPenalty: boolean;
	}>;

	/** Ability capability reference */
	abilityCapability: AbilityCapability;

	/** Bonus capability reference */
	bonusCapability: BonusCapability;
}

/**
 * Ensures that /proc and /proc/character directories exist
 * Creating them if necessary
 * @param context Capability context
 */
function ensureProcDirectories(context: CapabilityContext): void {
	if (!context.kernel) {
		error(context, 'Cannot ensure proc directories: kernel not available');
		return;
	}

	// Check if /proc exists
	if (!context.kernel.exists('/proc')) {
		log(context, 'Creating /proc directory');
		const result = context.kernel.mkdir('/proc');
		if (result !== ErrorCode.SUCCESS) {
			error(context, `Failed to create /proc directory: ${result}`);
		}
	}

	// Check if /proc/character exists
	if (!context.kernel.exists('/proc/character')) {
		log(context, 'Creating /proc/character directory');
		const result = context.kernel.mkdir('/proc/character');
		if (result !== ErrorCode.SUCCESS) {
			error(context, `Failed to create /proc/character directory: ${result}`);
		}
	}
}

/**
 * Create a skill capability
 * @param abilityCapability Ability capability to use
 * @param bonusCapability Bonus capability to use
 * @param options Capability options
 * @returns A skill capability
 */
export function createSkillCapability(
	abilityCapability: AbilityCapability,
	bonusCapability: BonusCapability,
	options: SkillCapabilityOptions = {}
): SkillCapability {
	// Create shared context for all operations
	const context: SkillCapabilityContext = {
		id: 'skill',
		debug: options.debug || false,
		version: options.version || '1.0.0',
		kernel: null,
		storage: new Map(),
		openFiles: new Map(),
		skills: options.skills || [],
		abilityCapability,
		bonusCapability
	};

	log(context, `Initialized skill capability with ${context.skills.length} skills`);

	// Create base capability with device operations
	const capability = createCapability({
		id: context.id,
		debug: context.debug,
		version: context.version,

		// Mount handler
		onMount(kernel) {
			context.kernel = kernel;
			// Ensure /proc and /proc/character directories exist on mount
			ensureProcDirectories(context);
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

	// Enhance capability with domain-specific methods
	return Object.assign(capability, {
		// Initialize entity
		initialize: (entity: Entity) => initialize(context, entity),

		// Skill rank operations
		getSkillRanks: (entity: Entity, skillId: number) => getSkillRanks(context, entity, skillId),

		setSkillRanks: (entity: Entity, skillId: number, ranks: number) =>
			setSkillRanks(context, entity, skillId, ranks),

		// Skill bonus calculation
		getSkillBonus: (entity: Entity, skillId: number) => getSkillBonus(context, entity, skillId),

		getSkillBreakdown: (entity: Entity, skillId: number) =>
			getSkillBreakdown(context, entity, skillId),

		// Class skill operations
		isClassSkill: (entity: Entity, skillId: number) => isClassSkill(context, entity, skillId),

		setClassSkill: (entity: Entity, skillId: number, isClassSkill: boolean) =>
			setClassSkill(context, entity, skillId, isClassSkill),

		// Bonus operations
		applySkillBonus: (
			entity: Entity,
			skillId: number,
			value: number,
			type: string,
			source: string
		) => applySkillBonus(context, entity, skillId, value, type, source),

		removeSkillBonus: (entity: Entity, skillId: number, source: string) =>
			removeSkillBonus(context, entity, skillId, source),

		// Skill point calculations
		getAvailableSkillPoints: (entity: Entity, level: number) =>
			getAvailableSkillPoints(context, entity, level),

		getInvestedSkillPoints: (entity: Entity, level?: number) =>
			getInvestedSkillPoints(context, entity, level),

		// Get all skills
		getAllSkills: (entity: Entity) => getAllSkills(context, entity)
	});
}

/**
 * Initialize skills from character data
 * @param context Capability context
 * @param entity Entity to initialize skills for
 */
function initialize(context: SkillCapabilityContext, entity: Entity): void {
	// Ensure the skills property exists
	if (!entity.properties.skills) {
		entity.properties.skills = {};
	}

	// Ensure the classSkills property exists
	if (!entity.properties.classSkills) {
		entity.properties.classSkills = [];
	}

	// Ensure /proc directory exists
	ensureProcDirectories(context);

	// Initialize skill ranks from character data
	if (entity.properties.character?.game_character_skill_rank) {
		for (const skillRank of entity.properties.character.game_character_skill_rank) {
			const skillId = skillRank.skill_id;
			if (!skillId) continue;

			// Get current ranks and increment by 1 for each rank entry
			const currentRanks = getSkillRanks(context, entity, skillId);
			setSkillRanks(context, entity, skillId, currentRanks + 1);
		}
	}

	// Initialize class skills from character data
	if (entity.properties.character?.game_character_class) {
		for (const charClass of entity.properties.character.game_character_class) {
			if (!charClass.class) continue;

			// In a real implementation, you'd fetch class skills from the database
			// For now, use a placeholder implementation
			const classSkills = entity.properties.character.class_skills || [];

			for (const skillId of classSkills) {
				setClassSkill(context, entity, skillId, true);
			}
		}
	}

	log(context, `Initialized skills for entity: ${entity.id}`);
}

/**
 * Get the skill ranks invested
 * @param context Capability context
 * @param entity Entity to get skill ranks for
 * @param skillId Skill ID
 * @returns Skill ranks
 */
function getSkillRanks(context: SkillCapabilityContext, entity: Entity, skillId: number): number {
	if (!entity.properties.skills) return 0;
	return entity.properties.skills[skillId]?.ranks || 0;
}

/**
 * Set skill ranks
 * @param context Capability context
 * @param entity Entity to set skill ranks for
 * @param skillId Skill ID
 * @param ranks Number of ranks
 */
function setSkillRanks(
	context: SkillCapabilityContext,
	entity: Entity,
	skillId: number,
	ranks: number
): void {
	// Ensure the skills property exists
	if (!entity.properties.skills) {
		entity.properties.skills = {};
	}

	// Set the skill ranks
	entity.properties.skills[skillId] = {
		...entity.properties.skills[skillId],
		ranks
	};

	// Update entity timestamp
	entity.metadata.updatedAt = Date.now();

	log(context, `Set ranks for skill ${skillId} to ${ranks} for entity ${entity.id}`);
}

/**
 * Get the total skill bonus including ranks, ability mod, and bonuses
 * @param context Capability context
 * @param entity Entity to get skill bonus for
 * @param skillId Skill ID
 * @returns Total skill bonus
 */
function getSkillBonus(context: SkillCapabilityContext, entity: Entity, skillId: number): number {
	const breakdown = getSkillBreakdown(context, entity, skillId);
	return breakdown.total;
}

/**
 * Check if a skill is a class skill for the character
 * @param context Capability context
 * @param entity Entity to check class skill for
 * @param skillId Skill ID
 * @returns Whether the skill is a class skill
 */
function isClassSkill(context: SkillCapabilityContext, entity: Entity, skillId: number): boolean {
	if (!entity.properties.classSkills) return false;
	return entity.properties.classSkills.includes(skillId);
}

/**
 * Mark a skill as a class skill
 * @param context Capability context
 * @param entity Entity to set class skill for
 * @param skillId Skill ID
 * @param isClassSkill Whether the skill should be a class skill
 */
function setClassSkill(
	context: SkillCapabilityContext,
	entity: Entity,
	skillId: number,
	isClassSkillValue: boolean
): void {
	// Ensure the classSkills property exists
	if (!entity.properties.classSkills) {
		entity.properties.classSkills = [];
	}

	if (isClassSkillValue && !isClassSkill(context, entity, skillId)) {
		// Add to class skills
		entity.properties.classSkills.push(skillId);
	} else if (!isClassSkillValue && isClassSkill(context, entity, skillId)) {
		// Remove from class skills
		entity.properties.classSkills = entity.properties.classSkills.filter((id) => id !== skillId);
	}

	// Update entity timestamp
	entity.metadata.updatedAt = Date.now();

	log(
		context,
		`Set class skill status for skill ${skillId} to ${isClassSkillValue} for entity ${entity.id}`
	);
}

/**
 * Get a detailed breakdown of skill bonus calculation
 * @param context Capability context
 * @param entity Entity to get skill breakdown for
 * @param skillId Skill ID
 * @returns Skill breakdown
 */
function getSkillBreakdown(
	context: SkillCapabilityContext,
	entity: Entity,
	skillId: number
): SkillBreakdown {
	// Get skill ranks
	const ranks = getSkillRanks(context, entity, skillId);

	// Find skill data
	const skill = context.skills.find((s) => s.id === skillId);
	const skillName = skill?.name || `Skill ${skillId}`;

	// Check if it's a class skill
	const classSkillValue = isClassSkill(context, entity, skillId);
	const classSkillBonus = classSkillValue && ranks > 0 ? 3 : 0;

	// Get the ability associated with this skill
	const abilityType = skill?.abilityType?.toLowerCase() || 'dexterity';

	// Get the ability modifier from the ability capability
	let abilityModifier = 0;
	try {
		abilityModifier = context.abilityCapability.getAbilityModifier(entity, abilityType);
	} catch (err) {
		error(context, `Error getting ability modifier for ${abilityType}`, err);
	}

	// Get any additional bonuses from the bonus capability
	let otherBonuses = {
		total: 0,
		base: 0,
		components: []
	};

	try {
		otherBonuses = context.bonusCapability.getBreakdown(entity, `skill.${skillId}`);
	} catch (err) {
		error(context, `Error getting bonus breakdown for skill ${skillId}`, err);
	}

	// Calculate the total skill bonus
	const total = ranks + classSkillBonus + abilityModifier + otherBonuses.total;

	// Calculate armor check penalty if applicable
	let armorCheckPenalty = 0;
	// In a real implementation, this would be calculated from armor

	return {
		skillId,
		skillName,
		ranks,
		abilityModifier,
		abilityType,
		classSkill: classSkillValue,
		classSkillBonus,
		otherBonuses,
		total,
		isTrainedOnly: skill?.isTrainedOnly || false,
		canUseUntrained: !skill?.isTrainedOnly,
		armorCheckPenalty
	};
}

/**
 * Get all skills with their current values
 * @param context Capability context
 * @param entity Entity to get skills for
 * @returns Record of skill breakdowns by skill ID
 */
function getAllSkills(
	context: SkillCapabilityContext,
	entity: Entity
): Record<number, SkillBreakdown> {
	const result: Record<number, SkillBreakdown> = {};

	// Create breakdown for all skills in the game data
	for (const skill of context.skills) {
		result[skill.id] = getSkillBreakdown(context, entity, skill.id);
	}

	return result;
}

/**
 * Apply a bonus to a skill
 * @param context Capability context
 * @param entity Entity to apply bonus to
 * @param skillId Skill ID
 * @param value Bonus value
 * @param type Bonus type (e.g. 'enhancement', 'competence')
 * @param source Source of the bonus (e.g. 'Skill Focus', 'Cloak of Competence')
 */
function applySkillBonus(
	context: SkillCapabilityContext,
	entity: Entity,
	skillId: number,
	value: number,
	type: string,
	source: string
): void {
	try {
		context.bonusCapability.addBonus(entity, `skill.${skillId}`, value, type, source);
		log(
			context,
			`Applied ${type} bonus of ${value} to skill ${skillId} for entity ${entity.id} from ${source}`
		);
	} catch (err) {
		error(context, `Failed to apply bonus to skill ${skillId}`, err);
	}
}

/**
 * Remove a bonus from a skill
 * @param context Capability context
 * @param entity Entity to remove bonus from
 * @param skillId Skill ID
 * @param source Source of the bonus to remove
 */
function removeSkillBonus(
	context: SkillCapabilityContext,
	entity: Entity,
	skillId: number,
	source: string
): void {
	try {
		context.bonusCapability.removeBonus(entity, `skill.${skillId}`, source);
		log(context, `Removed bonus from skill ${skillId} for entity ${entity.id} from ${source}`);
	} catch (err) {
		error(context, `Failed to remove bonus from skill ${skillId}`, err);
	}
}

/**
 * Get the total available skill points for a level
 * @param context Capability context
 * @param entity Entity to get skill points for
 * @param level Character level
 * @returns Total available skill points
 */
function getAvailableSkillPoints(
	context: SkillCapabilityContext,
	entity: Entity,
	level: number
): number {
	// Get base skill points from character class
	let baseSkillPoints = 0;

	if (entity.properties.character?.game_character_class) {
		for (const charClass of entity.properties.character.game_character_class) {
			if (charClass.class && charClass.level === level) {
				baseSkillPoints += charClass.class.skill_ranks_per_level || 0;
			}
		}
	}

	// Add Intelligence modifier (if positive)
	let intModifier = 0;
	try {
		intModifier = context.abilityCapability.getAbilityModifier(entity, 'intelligence');
		intModifier = Math.max(0, intModifier); // Only use positive INT modifier
	} catch (err) {
		error(context, 'Error getting intelligence modifier', err);
	}

	// Add skill ranks from favored class bonuses
	let fcbSkillRanks = 0;
	if (entity.properties.character?.favoredClassBonuses?.skillRanks) {
		// Get favored class bonuses for this level
		const fcbForLevel =
			entity.properties.character.favoredClassChoices?.filter(
				(fcb: any) => fcb.level === level && fcb.favored_class_choice?.name === 'skill'
			) || [];

		fcbSkillRanks = fcbForLevel.length;
	}

	return baseSkillPoints + intModifier + fcbSkillRanks;
}

/**
 * Get all invested skill points, optionally filtered by level
 * @param context Capability context
 * @param entity Entity to get invested skill points for
 * @param level Optional level to filter by
 * @returns Total invested skill points
 */
function getInvestedSkillPoints(
	context: SkillCapabilityContext,
	entity: Entity,
	level?: number
): number {
	// If level is provided, count ranks invested at that level
	if (level !== undefined) {
		const ranksAtLevel =
			entity.properties.character?.game_character_skill_rank?.filter(
				(rank: any) => rank.applied_at_level === level
			) || [];

		return ranksAtLevel.length;
	}

	// Otherwise, count all ranks
	let totalRanks = 0;

	for (const skill of context.skills) {
		totalRanks += getSkillRanks(context, entity, skill.id);
	}

	return totalRanks;
}

/**
 * Handle read operations for the skill capability
 * @param fd File descriptor
 * @param buffer Buffer to read into
 * @param context Capability context
 * @returns Error code
 */
function handleRead(fd: number, buffer: any, context: SkillCapabilityContext): number {
	// Ensure /proc and /proc/character directories exist
	ensureProcDirectories(context);

	// Check if this is a file descriptor for a skill
	const fileInfo = context.openFiles.get(fd);
	if (!fileInfo) {
		error(context, `Invalid file descriptor: ${fd}`);
		return ErrorCode.EBADF;
	}

	// Extract entity ID and skill ID from path
	const match = fileInfo.path.match(/\/entity\/([^\/]+)\/skills\/([^\/]+)/);
	if (match) {
		const entityId = match[1];
		const skillIdOrAll = match[2];

		// Use the withEntity helper to handle file operations
		return withEntitySync(context, entityId, (entity) => {
			if (skillIdOrAll === 'all') {
				// Get all skills
				const skills = getAllSkills(context, entity);
				Object.assign(buffer, skills);
			} else {
				// Get specific skill
				const skillId = parseInt(skillIdOrAll, 10);
				if (isNaN(skillId)) {
					return ErrorCode.EINVAL;
				}

				const skillBreakdown = getSkillBreakdown(context, entity, skillId);
				Object.assign(buffer, skillBreakdown);
			}

			return ErrorCode.SUCCESS;
		});
	}

	// Unrecognized path
	return ErrorCode.EINVAL;
}

/**
 * Handle write operations for the skill capability
 * @param fd File descriptor
 * @param buffer Buffer to write
 * @param context Capability context
 * @returns Error code
 */
function handleWrite(fd: number, buffer: any, context: SkillCapabilityContext): number {
	// Ensure /proc and /proc/character directories exist
	ensureProcDirectories(context);

	// Check if this is a file descriptor for a skill
	const fileInfo = context.openFiles.get(fd);
	if (!fileInfo) {
		error(context, `Invalid file descriptor: ${fd}`);
		return ErrorCode.EBADF;
	}

	// Extract entity ID and skill ID from path
	const match = fileInfo.path.match(/\/entity\/([^\/]+)\/skills\/([^\/]+)/);
	if (match) {
		const entityId = match[1];
		const skillIdStr = match[2];

		// Parse skill ID
		const skillId = parseInt(skillIdStr, 10);
		if (isNaN(skillId)) {
			return ErrorCode.EINVAL;
		}

		// Use the withEntity helper to handle file operations
		return withEntitySync(context, entityId, (entity) => {
			if (buffer.setRanks !== undefined) {
				// Set skill ranks
				setSkillRanks(context, entity, skillId, buffer.setRanks);
				return ErrorCode.SUCCESS;
			}

			if (buffer.setClassSkill !== undefined) {
				// Set class skill status
				setClassSkill(context, entity, skillId, !!buffer.setClassSkill);
				return ErrorCode.SUCCESS;
			}

			if (buffer.addBonus && typeof buffer.addBonus.value === 'number') {
				// Add bonus
				const { value, type, source } = buffer.addBonus;
				if (type && source) {
					applySkillBonus(context, entity, skillId, value, type, source);
					return ErrorCode.SUCCESS;
				}
			}

			if (buffer.removeBonus && buffer.removeBonus.source) {
				// Remove bonus
				removeSkillBonus(context, entity, skillId, buffer.removeBonus.source);
				return ErrorCode.SUCCESS;
			}

			// Unrecognized command
			return ErrorCode.EINVAL;
		});
	}

	// Unrecognized path
	return ErrorCode.EINVAL;
}

/**
 * Handle IOCTL operations for the skill capability
 * @param fd File descriptor
 * @param request Request code
 * @param arg Operation arguments
 * @param context Capability context
 * @returns Error code
 */
function handleIoctl(
	fd: number,
	request: number,
	arg: any,
	context: SkillCapabilityContext
): number {
	// Ensure /proc and /proc/character directories exist
	ensureProcDirectories(context);

	// Check if this is an initialization request
	if (arg && arg.operation === 'initialize' && arg.entityPath) {
		return handleInitializeOperation(arg.entityPath, context);
	}

	// Handle skill operations
	if (
		arg &&
		arg.operation === 'getSkillAvailable' &&
		arg.entityPath &&
		typeof arg.level === 'number'
	) {
		return handleGetAvailableSkillPoints(arg.entityPath, arg.level, context);
	}

	if (arg && arg.operation === 'getSkillInvested' && arg.entityPath && arg.level !== undefined) {
		return handleGetInvestedSkillPoints(arg.entityPath, arg.level, context);
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
function handleInitializeOperation(entityPath: string, context: SkillCapabilityContext): number {
	try {
		// Ensure /proc and /proc/character directories exist
		ensureProcDirectories(context);

		// Extract entity ID from path
		const entityId = entityPath.substring('/entity/'.length);

		// Use the withEntity helper to handle file operations
		return withEntitySync(context, entityId, (entity) => {
			// Initialize skills
			initialize(context, entity);
			return ErrorCode.SUCCESS;
		});
	} catch (err) {
		error(context, `Error processing initialize operation: ${err}`);
		return ErrorCode.EIO;
	}
}

/**
 * Handle get available skill points operation
 * @param entityPath Path to the entity
 * @param level Character level
 * @param context Capability context
 * @returns Error code
 */
function handleGetAvailableSkillPoints(
	entityPath: string,
	level: number,
	context: SkillCapabilityContext
): number {
	try {
		// Ensure /proc and /proc/character directories exist
		ensureProcDirectories(context);

		// Extract entity ID from path
		const entityId = entityPath.substring('/entity/'.length);

		// Use the withEntity helper to handle file operations
		return withEntitySync(context, entityId, (entity) => {
			// Get available skill points
			const points = getAvailableSkillPoints(context, entity, level);

			// Store result in context storage
			context.storage.set(`available_skill_points_${entityId}_${level}`, points);

			return ErrorCode.SUCCESS;
		});
	} catch (err) {
		error(context, `Error processing getSkillAvailable operation: ${err}`);
		return ErrorCode.EIO;
	}
}

/**
 * Handle get invested skill points operation
 * @param entityPath Path to the entity
 * @param level Optional character level
 * @param context Capability context
 * @returns Error code
 */
function handleGetInvestedSkillPoints(
	entityPath: string,
	level: number | undefined,
	context: SkillCapabilityContext
): number {
	try {
		// Ensure /proc and /proc/character directories exist
		ensureProcDirectories(context);

		// Extract entity ID from path
		const entityId = entityPath.substring('/entity/'.length);

		// Use the withEntity helper to handle file operations
		return withEntitySync(context, entityId, (entity) => {
			// Get invested skill points
			const points = getInvestedSkillPoints(context, entity, level);

			// Store result in context storage
			const key =
				level !== undefined
					? `invested_skill_points_${entityId}_${level}`
					: `invested_skill_points_${entityId}_all`;

			context.storage.set(key, points);

			return ErrorCode.SUCCESS;
		});
	} catch (err) {
		error(context, `Error processing getSkillInvested operation: ${err}`);
		return ErrorCode.EIO;
	}
}
