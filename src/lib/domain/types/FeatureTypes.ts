import type { Subsystem } from '../types/SubsystemTypes';
import type { Entity } from '../types/EntityTypes';
import type { ValueWithBreakdown } from '../types/ValueTypes';

/**
 * Interface for ability score functionality
 */
export interface AbilitySubsystem extends Subsystem {
	// Get base ability score
	getValue(entity: Entity, abilityId: string): number;

	// Get ability modifier
	getModifier(entity: Entity, abilityId: string): number;

	// Get total ability score with all modifiers
	getTotalValue(entity: Entity, abilityId: string): ValueWithBreakdown;

	// Set base ability score
	setValue(entity: Entity, abilityId: string, value: number): void;

	// Get all ability scores
	getAllValues(entity: Entity): Record<string, ValueWithBreakdown>;
}

export interface ValidationResult {
	valid: boolean;
	reason?: string;
}

/**
 * Feature interface for all game features
 */
export interface Feature {
	/**
	 * Unique feature identifier
	 */
	id: string;

	/**
	 * Display name of the feature
	 */
	name: string;

	/**
	 * Required subsystems for this feature to function
	 */
	requiredSubsystems?: string[];

	/**
	 * Whether this feature remains active after application
	 */
	persistent?: boolean;

	/**
	 * Apply the feature to an entity
	 */
	apply(entity: Entity, options: any, subsystems: Record<string, Subsystem>): any;

	/**
	 * Unapply the feature (for persistent features)
	 */
	unapply?(entity: Entity, options: any, subsystems: Record<string, Subsystem>): any;

	/**
	 * Check if this feature can be applied to the entity
	 */
	canApply?(entity: Entity, subsystems: Record<string, Subsystem>): ValidationResult;

	/**
	 * Helper to check if character already has this feat
	 */
	hasFeatAlreadyWithWeapon?(entity: Entity, weaponType: string): boolean;

	/**
	 * Description of this feature
	 */
	description?: string;

	/**
	 * Prerequisites for this feature
	 */
	prerequisites?: string[];

	/**
	 * Feature category
	 */
	category?: string;

	/**
	 * Source of this feature
	 */
	source?: string;
}
