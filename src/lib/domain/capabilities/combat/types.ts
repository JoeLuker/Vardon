/**
 * Combat Capability Types
 *
 * This module defines the types for the combat capability.
 */

import type { Capability, Entity } from '../../kernel/types';

/**
 * Attack roll result
 */
export interface AttackRoll {
	/** Natural die roll (1-20) */
	natural: number;

	/** Total attack roll after modifiers */
	total: number;

	/** Whether this is a critical threat */
	isCriticalThreat: boolean;

	/** Whether this is a critical hit (confirmed) */
	isCriticalHit?: boolean;

	/** Whether this is a natural 20 (automatic hit) */
	isNatural20: boolean;

	/** Whether this is a natural 1 (automatic miss) */
	isNatural1: boolean;

	/** Attack modifiers */
	modifiers: Array<{
		/** Source of the modifier */
		source: string;

		/** Value of the modifier */
		value: number;
	}>;
}

/**
 * Damage roll result
 */
export interface DamageRoll {
	/** Base damage roll (e.g. "1d8") */
	baseDamage: number;

	/** Total damage after modifiers */
	total: number;

	/** Damage type (e.g. "slashing", "fire") */
	damageType: string;

	/** Whether this is a critical hit */
	isCritical: boolean;

	/** Critical multiplier (e.g. 2 for x2) */
	criticalMultiplier: number;

	/** Damage modifiers */
	modifiers: Array<{
		/** Source of the modifier */
		source: string;

		/** Value of the modifier */
		value: number;
	}>;
}

/**
 * Combat statistics
 */
export interface CombatStats {
	/** Base attack bonus */
	baseAttackBonus: number;

	/** Melee attack bonus */
	meleeAttack: {
		/** Total melee attack bonus */
		total: number;

		/** Modifiers contributing to melee attack */
		modifiers: Array<{
			/** Source of the modifier */
			source: string;

			/** Value of the modifier */
			value: number;
		}>;
	};

	/** Ranged attack bonus */
	rangedAttack: {
		/** Total ranged attack bonus */
		total: number;

		/** Modifiers contributing to ranged attack */
		modifiers: Array<{
			/** Source of the modifier */
			source: string;

			/** Value of the modifier */
			value: number;
		}>;
	};

	/** Combat Maneuver Bonus */
	cmb: {
		/** Total CMB */
		total: number;

		/** Modifiers contributing to CMB */
		modifiers: Array<{
			/** Source of the modifier */
			source: string;

			/** Value of the modifier */
			value: number;
		}>;
	};

	/** Combat Maneuver Defense */
	cmd: {
		/** Total CMD */
		total: number;

		/** Modifiers contributing to CMD */
		modifiers: Array<{
			/** Source of the modifier */
			source: string;

			/** Value of the modifier */
			value: number;
		}>;
	};

	/** Armor Class */
	ac: {
		/** Total AC */
		total: number;

		/** Touch AC */
		touch: number;

		/** Flat-footed AC */
		flatFooted: number;

		/** Modifiers contributing to AC */
		modifiers: Array<{
			/** Source of the modifier */
			source: string;

			/** Value of the modifier */
			value: number;

			/** Type of the modifier (e.g. "armor", "shield", "natural") */
			type: string;

			/** Whether this applies to touch AC */
			appliesToTouch: boolean;

			/** Whether this applies to flat-footed AC */
			appliesToFlatFooted: boolean;
		}>;
	};

	/** Saving throws */
	saves: {
		/** Fortitude save */
		fortitude: {
			/** Total Fortitude save */
			total: number;

			/** Base save from classes */
			base: number;

			/** Modifiers contributing to Fortitude save */
			modifiers: Array<{
				/** Source of the modifier */
				source: string;

				/** Value of the modifier */
				value: number;
			}>;
		};

		/** Reflex save */
		reflex: {
			/** Total Reflex save */
			total: number;

			/** Base save from classes */
			base: number;

			/** Modifiers contributing to Reflex save */
			modifiers: Array<{
				/** Source of the modifier */
				source: string;

				/** Value of the modifier */
				value: number;
			}>;
		};

		/** Will save */
		will: {
			/** Total Will save */
			total: number;

			/** Base save from classes */
			base: number;

			/** Modifiers contributing to Will save */
			modifiers: Array<{
				/** Source of the modifier */
				source: string;

				/** Value of the modifier */
				value: number;
			}>;
		};
	};
}

/**
 * Combat capability options
 */
export interface CombatCapabilityOptions {
	/** Whether to enable debug logging */
	debug?: boolean;
}

/**
 * Combat capability
 */
export interface CombatCapability extends Capability {
	/** Unique identifier for this capability */
	readonly id: 'combat';

	/**
	 * Get combat statistics for an entity
	 * @param entity The entity to get combat statistics for
	 * @returns Combat statistics
	 */
	getCombatStats(entity: Entity): CombatStats;

	/**
	 * Roll an attack
	 * @param entity The entity making the attack
	 * @param attackBonus Attack bonus
	 * @param options Attack options
	 * @returns Attack roll result
	 */
	rollAttack(
		entity: Entity,
		attackBonus: number,
		options?: {
			criticalRange?: [number, number];
			criticalMultiplier?: number;
		}
	): AttackRoll;

	/**
	 * Roll damage
	 * @param entity The entity dealing damage
	 * @param damageFormula Damage formula (e.g. "1d8+3")
	 * @param options Damage options
	 * @returns Damage roll result
	 */
	rollDamage(
		entity: Entity,
		damageFormula: string,
		options?: {
			damageType?: string;
			isCritical?: boolean;
			criticalMultiplier?: number;
		}
	): DamageRoll;

	/**
	 * Add a base attack bonus modifier
	 * @param entity The entity to modify
	 * @param value Modifier value
	 * @param source Source of the modifier
	 */
	addBaseAttackBonusModifier(entity: Entity, value: number, source: string): void;

	/**
	 * Add a melee attack modifier
	 * @param entity The entity to modify
	 * @param value Modifier value
	 * @param source Source of the modifier
	 */
	addMeleeAttackModifier(entity: Entity, value: number, source: string): void;

	/**
	 * Add a ranged attack modifier
	 * @param entity The entity to modify
	 * @param value Modifier value
	 * @param source Source of the modifier
	 */
	addRangedAttackModifier(entity: Entity, value: number, source: string): void;

	/**
	 * Add a CMB modifier
	 * @param entity The entity to modify
	 * @param value Modifier value
	 * @param source Source of the modifier
	 */
	addCMBModifier(entity: Entity, value: number, source: string): void;

	/**
	 * Add a CMD modifier
	 * @param entity The entity to modify
	 * @param value Modifier value
	 * @param source Source of the modifier
	 */
	addCMDModifier(entity: Entity, value: number, source: string): void;

	/**
	 * Add an AC modifier
	 * @param entity The entity to modify
	 * @param value Modifier value
	 * @param source Source of the modifier
	 * @param options AC modifier options
	 */
	addACModifier(
		entity: Entity,
		value: number,
		source: string,
		options?: {
			type?: string;
			appliesToTouch?: boolean;
			appliesToFlatFooted?: boolean;
		}
	): void;

	/**
	 * Add a save modifier
	 * @param entity The entity to modify
	 * @param save Save type (fortitude, reflex, will)
	 * @param value Modifier value
	 * @param source Source of the modifier
	 */
	addSaveModifier(
		entity: Entity,
		save: 'fortitude' | 'reflex' | 'will',
		value: number,
		source: string
	): void;

	/**
	 * Set base save bonus
	 * @param entity The entity to modify
	 * @param save Save type (fortitude, reflex, will)
	 * @param value Base save value
	 */
	setBaseSave(entity: Entity, save: 'fortitude' | 'reflex' | 'will', value: number): void;
}
