import type { ProcessedClassFeature, CompleteCharacter } from '../../db/gameRules.api';
import type { Database } from '$lib/domain/types/supabase';
import type { GameRules } from '../../db/gameRules.api';

// Re-export the CompleteCharacter type
export type { CompleteCharacter };

// Re-export SpellcastingClassFeature type
export type SpellcastingClassFeature = GameRules.Relationships.SpellcastingFeature;

// Database types
export type Tables = Database['public']['Tables'];
export type Row<T extends keyof Tables> = Tables[T]['Row'];

// Value breakdown for stats
export interface ValueWithBreakdown {
	label: string;
	modifiers: Array<{ source: string; value: number }>;
	total: number;
	overrides?: {
		trained_only?: boolean;
		ability?: {
			original: string;
			override: string;
			source: string;
		};
	};
}

// Skills with ranks
export interface SkillWithRanks {
	skillId: number;
	name: string;
	isClassSkill: boolean;
	skillRanks: Array<{ level: number; rank: number }>;
}

// Spell slot data
export interface SpellSlotData {
	base: number;
	bonus: number;
	total: number;
}

// Enriched character data
export interface EnrichedCharacter extends GameRules.Complete.Character  {
	// Ability scores with breakdown
	strength: ValueWithBreakdown;
	dexterity: ValueWithBreakdown;
	constitution: ValueWithBreakdown;
	intelligence: ValueWithBreakdown;
	wisdom: ValueWithBreakdown;
	charisma: ValueWithBreakdown;

	// Ability modifiers
	strMod: number;
	dexMod: number;
	conMod: number;
	intMod: number;
	wisMod: number;
	chaMod: number;

	// Saving throws
	saves: {
		fortitude: ValueWithBreakdown;
		reflex: ValueWithBreakdown;
		will: ValueWithBreakdown;
	};

	// Combat stats
	ac: ValueWithBreakdown;
	touch_ac: ValueWithBreakdown;
	flat_footed_ac: ValueWithBreakdown;
	initiative: ValueWithBreakdown;
	cmb: ValueWithBreakdown;
	cmd: ValueWithBreakdown;

	// Skills
	skills: Record<number, ValueWithBreakdown>;

	// Attacks
	attacks: {
		melee: ValueWithBreakdown;
		ranged: ValueWithBreakdown;
		bomb: {
			attack: ValueWithBreakdown;
			damage: ValueWithBreakdown;
			bombDice: number;
		};
	};

	// Skill points
	skillPoints: {
		total: Record<number, ValueWithBreakdown>;
		remaining: Record<number, number>;
	};
	
	// Character data
	totalLevel: number;
	skillsWithRanks: SkillWithRanks[];
	processedClassFeatures: ProcessedClassFeature[];
	spellSlots: Record<number, Record<number, SpellSlotData>>;
}

// Bonus entry
export interface BonusEntry {
	source: string;
	value: number;
	type: string;
}

// Stacking accumulator
export interface StackingAccumulator {
	typedBonuses: Record<string, number>;
	sumOfDodges: number;
	sumOfCircumstance: number;
	sumOfUntyped: number;
}

// ABP node with bonuses
export interface AbpNodeWithBonuses {
	id: number;
	group_id: number;
	name: string;
	label: string | null;
	description: string | null;
	requires_choice: boolean;
	created_at: string | null;
	updated_at: string | null;
	bonuses: Array<{
		id: number;
		node_id: number;
		bonus_type_id: number;
		value: number;
		target_specifier: string | null;
		created_at: string | null;
		updated_at: string | null;
		bonus_type: {
			id: number;
			name: string;
			label: string | null;
			created_at: string | null;
			updated_at: string | null;
		};
	}>;
}

// ABP cache
export interface AbpCache {
	nodes: AbpNodeWithBonuses[];
	bonusTypes: Record<number, string>;
}

// Character cache
export interface CharacterCache {
	abp: AbpCache;
	ancestryTraitBonuses: Record<string, BonusEntry[]>;
	classSaveBonuses: Record<string, BonusEntry[]>;
	classSkillIds: Set<number>;
}

// Size data
export interface SizeData {
	baseSize: string;
	effectiveSize: string;
	modifier: number;
	modifiers: Array<{ source: string; value: number }>;
}

// Attack bonuses
export interface AttackBonuses {
    baseAttackBonus: number;
    weaponAttunement: number;
    enhancement: number;
    iterativeAttacks: number[];
}

// Combat maneuver parts
export interface CombatManeuverParts {
	cmb: ValueWithBreakdown;
	cmd: ValueWithBreakdown;
}

// Attack parts
export interface AttackParts {
	melee: ValueWithBreakdown;
	ranged: ValueWithBreakdown;
	bomb: {
		attack: ValueWithBreakdown;
		damage: ValueWithBreakdown;
		bombDice: number;
	};
	cmb: ValueWithBreakdown;
	cmd: ValueWithBreakdown;
}

// AC parts
export interface ACParts {
	ac: ValueWithBreakdown;
	touch_ac: ValueWithBreakdown;
	flat_footed_ac: ValueWithBreakdown;
	allBonuses: BonusEntry[];
}

// Skill ranks by level
export interface SkillRanksByLevel {
	skillId: number;
	ranksByLevel: Array<number>;
} 

/**
 * CharacterSheet.ts
 * 
 * Clean interface representing a character sheet in the game.
 * This is strictly a character-specific data structure - no calculations.
 */

import type { CompleteCharacter } from '$lib/db/gameRules.api';
import type { ValueWithBreakdown } from '$lib/domain/systems/SystemTypes';

/**
 * Character sheet representation with calculated values
 */
export interface CharacterSheet {
  // Core character data
  id: number;
  name: string;
  level: number;
  
  // Ability scores
  abilityScores: {
    strength: ValueWithBreakdown;
    dexterity: ValueWithBreakdown;
    constitution: ValueWithBreakdown;
    intelligence: ValueWithBreakdown;
    wisdom: ValueWithBreakdown;
    charisma: ValueWithBreakdown;
  };
  
  // Combat stats
  combat: {
    ac: ValueWithBreakdown;
    touchAC: ValueWithBreakdown;
    flatFootedAC: ValueWithBreakdown;
    initiative: ValueWithBreakdown;
    baseAttackBonus: number[];
    meleeAttack: ValueWithBreakdown;
    rangedAttack: ValueWithBreakdown;
    cmb: ValueWithBreakdown;
    cmd: ValueWithBreakdown;
  };
  
  // Saving throws
  saves: {
    fortitude: ValueWithBreakdown;
    reflex: ValueWithBreakdown;
    will: ValueWithBreakdown;
  };
  
  // Skills
  skills: Record<number, ValueWithBreakdown>;
  
  // Class features
  classFeatures: Array<{
    id: number;
    name: string;
    description: string;
    level: number;
    className: string;
  }>;
  
  // Equipment
  equipment: {
    armor: any[];
    weapons: any[];
    items: any[];
  };
  
  // Spellcasting
  spellcasting: {
    classes: any[];
    spellsKnown: any[];
    spellsPerDay: any[];
  };
}

