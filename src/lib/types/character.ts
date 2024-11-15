import type { Json } from "./supabase";

export interface CharacterAttributes {
	str: number;
	dex: number;
	con: number;
	int: number;
	wis: number;
	cha: number;
}

export interface CombatStats {
	bombs_left: number;
	base_attack_bonus: number;
	initiative: number;
	cmb: number;
	cmd: number;
	ac: number;
	touch_ac: number;
	flat_footed_ac: number;
	fortitude: number;
	reflex: number;
	will: number;
}

export interface Consumables {
	alchemist_fire: number;
	acid: number;
	tanglefoot: number;
}

export interface DatabaseCharacterSkill {
	id: number;
	character_id: number | null;
	skill_name: string;
	ability: string;
	class_skill: boolean | null;
	ranks: number;
	sync_status: string | null;
	updated_at: string | null;
}

export interface CharacterSkill {
	skill_name: string;
	ability: string;
	class_skill: boolean | null;
	ranks: number;
}

export type AttributeKey = keyof CharacterAttributes;
export type ConsumableKey = keyof Consumables;

export const KNOWN_BUFFS = [
    'cognatogen',
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
    'resistance',
    'divine_favor',
    'owl_wisdom'
] as const;

export type KnownBuffType = 
  | 'cognatogen' 
  | 'dex_mutagen' 
  | 'str_mutagen' 
  | 'con_mutagen'
  | 'deadly_aim'
  | 'rapid_shot'
  | 'two_weapon_fighting'
  | 'encumbered'
  | 'improved_initiative'
  | 'shield_of_faith'
  | 'mage_armor'
  | 'barkskin'
  | 'bulls_strength'
  | 'enlarge_person'
  | 'resistance'
  | 'divine_favor'
  | 'owl_wisdom';

export interface DatabaseCharacterBuff {
	id: number;
	character_id: number | null;
	buff_type: string;
	is_active: boolean | null;
	updated_at: string | null;
	sync_status: 'synced' | 'pending' | 'conflict' | null;
}

export interface CharacterBuff extends Omit<DatabaseCharacterBuff, 'buff_type'> {
	buff_type: KnownBuffType;
}

export interface SpellSlot {
	id: number;
	character_id: number | null;
	spell_level: number;
	total: number;
	remaining: number;
	updated_at: string | null;
	sync_status: 'synced' | 'pending' | 'conflict' | null;
}

export interface KnownSpell {
	id: number;
	character_id: number | null;
	spell_level: number;
	spell_name: string;
	created_at: string | null;
	sync_status: 'synced' | 'pending' | 'conflict' | null;
}

export interface CharacterDiscovery {
	id: number;
	character_id: number | null;
	discovery_name: string;
	selected_level: number;
	properties: Record<string, unknown> | null;
	updated_at: string | null;
	sync_status: 'synced' | 'pending' | 'conflict' | null;
}

export interface CharacterClassFeature {
	id: number;
	character_id: number | null;
	feature_name: string;
	feature_level: number;
	active: boolean;
	properties: Json | null;
	updated_at: string | null;
	sync_status: 'synced' | 'pending' | 'conflict' | null;
}

export interface CharacterFeat {
	id: number;
	character_id: number | null;
	feat_name: string;
	feat_type: string;
	selected_level: number;
	properties: Record<string, unknown> | null;
	updated_at: string | null;
	sync_status: 'synced' | 'pending' | 'conflict' | null;
}

export interface BaseSkill {
    id: number;
    name: string;
    ability: string;
    trained_only: boolean | null;
    armor_check_penalty: boolean | null;
}

export interface CharacterSkillRank {
    id: number;
    character_id: number | null;
    skill_id: number | null;
    ranks: number;
    sync_status: string | null;
    updated_at: string | null;
}

export interface ClassSkillRelation {
    id: number;
    class_name: string;
    skill_id: number | null;
}

export interface Character {
    id: number;
    name: string;
    class: string;
    race: string;
    level: number;
    current_hp: number;
    max_hp: number;
    is_offline: boolean | null;
    created_at: string | null;
    updated_at: string | null;
    last_synced_at: string | null;
    user_id: string | null;
    character_attributes: CharacterAttributes[];
    character_combat_stats: CombatStats[];
    character_consumables: Consumables[];
    character_buffs: DatabaseCharacterBuff[];
    character_skill_ranks: CharacterSkillRank[];
    character_spell_slots: SpellSlot[];
    character_known_spells: KnownSpell[];
    character_discoveries: CharacterDiscovery[];
    character_class_features: CharacterClassFeature[];
    character_feats: CharacterFeat[];
    character_extracts: CharacterExtract[];
    character_equipment: CharacterEquipment[];
    base_skills?: BaseSkill[];
    class_skill_relations?: ClassSkillRelation[];
}

// Helper type for creating new characters
export type NewCharacter = Omit<
	Character,
	'id' | 'created_at' | 'updated_at' | 'last_synced_at' | 'is_offline'
>;

// Helper type for updates
export type CharacterUpdate = Partial<Omit<Character, 'id'>>;

// Helper types for specific updates
export interface AttributeUpdate extends Partial<CharacterAttributes> {
	character_id?: number;
}

export interface CombatStatsUpdate extends Partial<CombatStats> {
	character_id?: number;
}

export interface ConsumablesUpdate extends Partial<Consumables> {
	character_id?: number;
}

export interface BuffUpdate {
	character_id?: number;
	buff_type: KnownBuffType;
	is_active: boolean;
}

export interface SkillUpdate {
	character_id?: number;
	skill_id: number;
	ranks: number;
}

// Validation helpers
export const isKnownBuff = (buff: string): buff is KnownBuffType => {
	return KNOWN_BUFFS.includes(buff as KnownBuffType);
};

export const isValidAttributeKey = (key: string): key is AttributeKey => {
	return ['str', 'dex', 'con', 'int', 'wis', 'cha'].includes(key);
};

export const isValidConsumableKey = (key: string): key is ConsumableKey => {
	return ['alchemist_fire', 'acid', 'tanglefoot'].includes(key);
};

export interface CharacterSpellSlot {
    character_id: number;
    spell_level: number;
    total: number;
    remaining: number;
}

export interface CharacterKnownSpell {
    character_id: number;
    spell_level: number;
    spell_name: string;
}

export interface CharacterExtract {
    id: number;
    character_id: number | null;
    extract_name: string;
    extract_level: number;
    prepared: number;
    used: number;
    created_at: string | null;
    updated_at: string | null;
    sync_status: string | null;
}

export interface SkillView {
    character_id: number;
    skill_id: number;
    skill_name: string;
    ability: string;
    trained_only: boolean;
    armor_check_penalty: boolean;
    ranks: number;
    is_class_skill: boolean;
}

export interface CharacterEquipment {
    id: number;
    character_id: number | null;
    name: string;
    type: string;
    equipped: boolean;
    properties: CharacterEquipmentProperties;
    updated_at: string | null;
    sync_status: 'synced' | 'pending' | 'conflict' | null;
}

export interface CharacterEquipmentProperties {
    armor_check_penalty?: number;
    skill_bonus?: {
        skill: string;
        value: number;
    };
    [key: string]: unknown;
}