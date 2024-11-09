import type { Readable } from 'svelte/store';
import type { 
  Attributes, 
  Skills, 
  CombatStats, 
  BuffState,
  SpellState,
  Consumables,
  StoreMethods
} from './character';

export interface StoreDependencies {
  attributes: Readable<Attributes>;
  skills: Readable<Skills>;
  combat: Readable<CombatStats>;
  buffs: Readable<BuffState>;
  spells: Readable<SpellState>;
  equipment: Readable<Consumables>;
}

export interface StoreDependencyConfig {
  required: (keyof StoreDependencies)[];
  optional?: (keyof StoreDependencies)[];
}

export interface BaseStore<T> extends Readable<T>, StoreMethods<T> {
  subscribe: Readable<T>['subscribe'];
  data: Readable<T>;
  errors: Readable<string[]>;
  isLoading: Readable<boolean>;
}

export interface CombatCalculations {
  defenseStats: Readable<DefenseState>;
  attackStats: Readable<AttackState>;
  maxHP: Readable<number>;
}

export interface DefenseState {
  ac: number;
  touch: number;
  flatFooted: number;
  saves: {
    fort: number;
    ref: number;
    will: number;
  };
}

export interface AttackState {
  baseAttackBonus: number;
  totalAttackBonus: number;
  damageBonus: number;
}

export interface SkillCalculations {
  modifiers: Readable<Record<string, number>>;
  totals: Readable<Record<string, number>>;
}

export interface SpellCalculations {
  spellsPerDay: Readable<Record<string, number>>;
  bonusSpells: Readable<Record<string, number>>;
  spellDCs: Readable<Record<string, number>>;
}