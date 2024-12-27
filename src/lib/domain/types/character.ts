import type { Database } from '$lib/domain/types/supabase';
import type { CharacterFeatWithBase } from '$lib/db/feats';

// Type aliases for commonly used database types
export type DbTables = Database['public']['Tables'];
export type DatabaseCharacter = DbTables['characters']['Row'];
export type DatabaseCharacterBuff = DbTables['character_buffs']['Row'];
export type DatabaseCharacterAttribute = DbTables['character_attributes']['Row'];
export type DatabaseCharacterSkillRank = DbTables['character_skill_ranks']['Row'];
export type DatabaseBaseSkill = DbTables['base_skills']['Row'];
export type DatabaseClassSkillRelation = DbTables['class_skill_relations']['Row'];
export type DatabaseCharacterClassFeature = DbTables['character_class_features']['Row'];
export type DatabaseCharacterDiscovery = DbTables['character_discoveries']['Row'];
export type DatabaseCharacterAbpBonus = DbTables['character_abp_bonuses']['Row'];
export type DatabaseCharacterCombatStats = DbTables['character_combat_stats']['Row'];
export type DatabaseCharacterConsumables = DbTables['character_consumables']['Row'];
export type DatabaseCharacterCorruptionManifestation =
	DbTables['character_corruption_manifestations']['Row'];
export type DatabaseCharacterCorruption = DbTables['character_corruptions']['Row'];
export type DatabaseCharacterEquipment = DbTables['character_equipment']['Row'];
export type DatabaseCharacterExtract = DbTables['character_extracts']['Row'];
export type DatabaseCharacterFavoredClassBonus = DbTables['character_favored_class_bonuses']['Row'];
export type DatabaseCharacterFeat = DbTables['character_feats']['Row'];
export type DatabaseCharacterKnownSpell = DbTables['character_known_spells']['Row'];
export type DatabaseCharacterSpellSlot = DbTables['character_spell_slots']['Row'];
export type DatabaseBaseTrait = DbTables['base_traits']['Row'];
export type DatabaseCharacterTrait = DbTables['character_traits']['Row'];
export type DatabaseCharacterAncestry = DbTables['character_ancestries']['Row'] & {
	ancestry?: {
		id: number;
		name: string;
		size: string;
		base_speed: number;
		ability_modifiers: Record<string, number>;
		description: string | null;
	};
};
export type DatabaseCharacterAncestralTrait = DbTables['character_ancestral_traits']['Row'];
export type DatabaseBaseAncestralTrait = DbTables['base_ancestral_traits']['Row'];

// This excludes the `id` field from the Character interface
export type CharacterUpdatableFields = Omit<Character, 'id' | 'created_at' | 'updated_at'>;

// Type aliases for commonly used table types
export type AttributeKey = keyof Pick<
	DbTables['character_attributes']['Row'],
	'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
>;
export type ConsumableKey = keyof Pick<
	DbTables['character_consumables']['Row'],
	'alchemist_fire' | 'acid' | 'tanglefoot'
>;

// Game-specific constants
export const KNOWN_BUFFS = [
	'int_cognatogen',
	'wis_cognatogen',
	'cha_cognatogen',
	'dex_mutagen',
	'str_mutagen',
	'con_mutagen',
	'deadly_aim',
	'rapid_shot',
	'two_weapon_fighting',
	'encumbered',
	'improved_initiative',
	'shield_of_faith',
	'mage_armor',
	'barkskin',
	'bulls_strength',
	'enlarge_person',
	'reduce_person',
	'resistance',
	'divine_favor',
	'owl_wisdom'
] as const;

export const SKILL_RANK_SOURCES = {
	CLASS: 'class',
	INTELLIGENCE: 'intelligence',
	FAVORED_CLASS: 'favored_class',
	OTHER: 'other'
} as const;

// Derived types from constants
export type KnownBuffType = (typeof KNOWN_BUFFS)[number];
export type SkillRankSource = (typeof SKILL_RANK_SOURCES)[keyof typeof SKILL_RANK_SOURCES];

// Core attribute interfaces
export interface CharacterAttributes {
	str: number;
	dex: number;
	con: number;
	int: number;
	wis: number;
	cha: number;
}

export interface Consumables {
	alchemist_fire: number;
	acid: number;
	tanglefoot: number;
}

// Type refinements
export interface CharacterBuff extends Omit<DatabaseCharacterBuff, 'buff_type'> {
	buff_type: KnownBuffType;
}

export interface CharacterSkillRank extends Omit<DatabaseCharacterSkillRank, 'source'> {
	source: SkillRankSource;
}

// Combined view types
export interface SkillView {
	character_id: number;
	skill_id: number;
	skill_name: string;
	ability: string;
	trained_only: boolean;
	armor_check_penalty: boolean;
	ranks_by_source: Record<SkillRankSource, number>;
	total_ranks: number;
	is_class_skill: boolean;
}

// Add a type for character traits that includes the joined base_traits data
export interface CharacterTraitWithBase extends DatabaseCharacterTrait {
	base_traits?: DatabaseBaseTrait;
}

// Main Character interface combining multiple tables
// Inherits `archetype` (string | null) from DatabaseCharacter
export interface Character extends DatabaseCharacter {
	character_attributes?: DatabaseCharacterAttribute[];
	character_buffs?: CharacterBuff[];
	character_skill_ranks?: CharacterSkillRank[];
	base_skills?: DatabaseBaseSkill[];
	class_skill_relations?: DatabaseClassSkillRelation[];
	character_class_features?: DatabaseCharacterClassFeature[];
	character_abp_bonuses?: DatabaseCharacterAbpBonus[];
	character_combat_stats?: DatabaseCharacterCombatStats[];
	character_equipment?: DatabaseCharacterEquipment[];
	character_feats?: CharacterFeatWithBase[];
	character_discoveries?: DatabaseCharacterDiscovery[];
	character_favored_class_bonuses?: DatabaseCharacterFavoredClassBonus[];
	character_consumables?: DatabaseCharacterConsumables[];
	character_spell_slots?: DatabaseCharacterSpellSlot[];
	character_known_spells?: DatabaseCharacterKnownSpell[];
	character_extracts?: DatabaseCharacterExtract[];
	character_corruption_manifestations?: DatabaseCharacterCorruptionManifestation[];
	character_corruptions?: DatabaseCharacterCorruption[];
	character_traits?: CharacterTraitWithBase[];
	character_ancestries?: DatabaseCharacterAncestry[];
	character_ancestral_traits?: DatabaseCharacterAncestralTrait[];
}

// Helper types for operations
export type NewCharacter = Omit<
	Character,
	'id' | 'created_at' | 'updated_at' | 'last_synced_at' | 'is_offline'
>;
export type CharacterUpdate = Partial<Omit<Character, 'id'>>;

// Type guards and validation
export const isKnownBuff = (buff: string): buff is KnownBuffType => {
	return KNOWN_BUFFS.includes(buff as KnownBuffType);
};

export const isValidSkillRankSource = (source: string): source is SkillRankSource => {
	return Object.values(SKILL_RANK_SOURCES).includes(source as SkillRankSource);
};

export const isValidAttributeKey = (key: string): key is keyof CharacterAttributes => {
	return ['str', 'dex', 'con', 'int', 'wis', 'cha'].includes(key);
};

export const isValidConsumableKey = (key: string): key is keyof Consumables => {
	return ['alchemist_fire', 'acid', 'tanglefoot'].includes(key);
};

// Add equipment properties type
export interface CharacterEquipmentProperties {
	armor_bonus?: number;
	max_dex?: number;
	armor_check_penalty?: number;
	damage?: string;
	crit_range?: string;
	crit_mult?: number;
	bonus?: number;
	type?: string;
	skill_bonus?: {
		skill: string;
		value: number;
	};
}

export interface CombatStats {
	bombs_left: number;
	base_attack_bonus: number;
}
