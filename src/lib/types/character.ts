import type { SKILL_ABILITIES, CLASS_SKILLS } from '$lib/stores/constants';

export type Ability = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export type BuffName = 
  | 'deadly_aim'
  | 'two_weapon_fighting'
  | 'rapid_shot'
  | 'cognatogen'
  | 'dex_mutagen';

export interface Attributes {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export type SkillName = keyof typeof SKILL_ABILITIES;
export type AbilityForSkill = typeof SKILL_ABILITIES[SkillName];
export type ClassSkillName = keyof typeof CLASS_SKILLS;

export interface Skill {
  ability: AbilityForSkill;
  ranks: number;
  classSkill: boolean;
}

export type Skills = Record<SkillName, Skill>;

export interface SpellSlot {
  total: number;
  remaining: number;
  bonus: number;
  dc: number;
}

export type SpellSlots = Record<number, SpellSlot>;

export interface KnownSpells {
  [level: string]: string[];
}

export interface SpellState {
  spellsByLevel: Record<string, {
    total: number;
    remaining: number;
    bonus: number;
    spells: string[];
  }>;
  knownSpells: KnownSpells;
  errors: string[];
}

export interface SpellLevel {
  spells: string[];
  remaining: number;
  total: number;
  dc: number;
}

export interface SpellMetadata {
  dc: number;
  casterLevel: number;
  baseSlots: Record<number, number>;
}

export interface Consumables {
  alchemistFire: number;
  acid: number;
  tanglefoot: number;
}

export interface CombatStats {
  currentHP: number;
  bombsLeft: number;
  baseAttackBonus: number;
}

export interface Character {
  id: number;
  name: string;
  class: string;
  race: string;
  level: number;
  current_hp: number;
  created_at: string;
  updated_at: string;
}

export interface CharacterStats {
  id: number;
  character_id: number;
  base_attributes: Attributes;
  current_attributes: Attributes;
  combat_stats: CombatStats;
  consumables: Consumables;
  spell_slots: SpellSlots;
  known_spells: KnownSpells;
  buffs: Record<BuffName, boolean>;
  current_hp: number;
  skills: Skills;
  updated_at: string;
}

export interface SkillState {
  skills: Skills;
  pointsByLevel: Record<string, boolean>[];
  errors: string[];
}

export interface CombatState {
  stats: CombatStats;
  errors: string[];
}

export interface EquipmentState {
  consumables: Consumables;
  errors: string[];
}

export interface BuffState extends Record<BuffName, boolean> {
  errors: string[];
}

export interface AttributeState {
  base: Attributes;
  current: Attributes;
  errors: string[];
}

export interface RootState {
  character: Character | null;
  stats: CharacterStats | null;
  isInitialized: boolean;
  isLoading: boolean;
  errors: string[];
}

export interface AttributeModifiers {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface StoreState<T> {
  data: T;
  isLoading: boolean;
  errors: string[];
}

export interface StoreMethods<T> {
  init: (characterId: number) => Promise<void>;
  reset: (characterId: number) => Promise<void>;
  update: (characterId: number, data: Partial<T>) => Promise<void>;
  clearErrors: () => void;
}