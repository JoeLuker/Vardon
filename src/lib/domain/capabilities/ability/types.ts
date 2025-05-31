/**
 * Ability Capability Types
 *
 * This file defines the interfaces for the ability capability,
 * which provides access to ability score calculations.
 */

import type { Entity, Capability } from '../../kernel/types';
import type { CapabilityOptions } from '../BaseCapability';

/**
 * Ability score data structure
 */
export interface AbilityScore {
	/** Base ability score without modifiers */
	base: number;

	/** Calculated total after all modifiers */
	total: number;

	/** Ability modifier derived from total score */
	modifier: number;
}

/**
 * Type of ability
 */
export enum AbilityType {
	STRENGTH = 'strength',
	DEXTERITY = 'dexterity',
	CONSTITUTION = 'constitution',
	INTELLIGENCE = 'intelligence',
	WISDOM = 'wisdom',
	CHARISMA = 'charisma'
}

/**
 * Ability score calculation breakdown
 */
export interface AbilityBreakdown {
	/** Name of the ability (e.g. 'strength') */
	ability: string;

	/** Base score before modifiers */
	base: number;

	/** Total score after all modifiers */
	total: number;

	/** Ability modifier calculated from total */
	modifier: number;

	/** Bonuses applied to this ability */
	bonuses: BonusBreakdown;
}

/**
 * Bonus calculation breakdown
 */
export interface BonusBreakdown {
	/** Total bonus after stacking rules */
	total: number;

	/** Base value before bonuses */
	base: number;

	/** Individual components of the bonus */
	components: Array<{
		/** Bonus value */
		value: number;

		/** Bonus type (e.g. 'enhancement', 'morale') */
		type: string;

		/** Source of the bonus (e.g. 'Bull's Strength', 'Belt of Giant Strength') */
		source: string;
	}>;
}

/**
 * Ability capability options
 */
export interface AbilityCapabilityOptions extends CapabilityOptions {
	/** Default abilities to initialize */
	defaultAbilities?: string[];
}

/**
 * Ability capability interface
 */
export interface AbilityCapability {
	/** Unique identifier for this capability */
	readonly id: string;

	/** Semantic version of this capability implementation */
	readonly version: string;

	/** Initialize an entity */
	initialize?(entity: Entity): void;

	/** Clean up resources */
	shutdown?(): Promise<void>;

	/**
	 * Get the total ability score including all bonuses
	 * @param entity Entity to get ability score for
	 * @param ability Ability name (e.g. 'strength')
	 * @returns Total ability score
	 */
	getAbilityScore(entity: Entity, ability: string): number;

	/**
	 * Get the ability modifier calculated from the total score
	 * @param entity Entity to get ability modifier for
	 * @param ability Ability name (e.g. 'strength')
	 * @returns Ability modifier
	 */
	getAbilityModifier(entity: Entity, ability: string): number;

	/**
	 * Set the base ability score
	 * @param entity Entity to set ability score for
	 * @param ability Ability name (e.g. 'strength')
	 * @param value Base ability score value
	 */
	setAbilityScore(entity: Entity, ability: string, value: number): void;

	/**
	 * Get the base ability score before bonuses
	 * @param entity Entity to get base ability score for
	 * @param ability Ability name (e.g. 'strength')
	 * @returns Base ability score
	 */
	getBaseAbilityScore(entity: Entity, ability: string): number;

	/**
	 * Get a detailed breakdown of an ability score
	 * @param entity Entity to get ability breakdown for
	 * @param ability Ability name (e.g. 'strength')
	 * @returns Ability breakdown
	 */
	getAbilityBreakdown(entity: Entity, ability: string): AbilityBreakdown;

	/**
	 * Apply a bonus to an ability score
	 * @param entity Entity to apply bonus to
	 * @param ability Ability name (e.g. 'strength')
	 * @param value Bonus value
	 * @param type Bonus type (e.g. 'enhancement', 'morale')
	 * @param source Source of the bonus (e.g. 'Bull's Strength')
	 */
	applyAbilityBonus(
		entity: Entity,
		ability: string,
		value: number,
		type: string,
		source: string
	): void;

	/**
	 * Remove a bonus from an ability score
	 * @param entity Entity to remove bonus from
	 * @param ability Ability name (e.g. 'strength')
	 * @param source Source of the bonus to remove
	 */
	removeAbilityBonus(entity: Entity, ability: string, source: string): void;
}
