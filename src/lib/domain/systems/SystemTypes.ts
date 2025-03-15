import type { GameRulesAPI } from '$lib/db/gameRules.api';
import type { CompleteCharacter } from '$lib/domain/character/CharacterTypes';

/**
 * Generic Entity interface that can represent either a character or a monster
 * This allows systems to work with both types of entities
 */
export interface Entity {
  id: number;
  [key: string]: any; // Allow for flexible properties
}

/**
 * Value breakdown for statistics
 * Used by all calculation engines for transparent stat building
 */
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

/**
 * Result of stacking bonuses with a breakdown and total
 */
export interface BonusStackingResult {
  total: number;
  modifiers: Array<{ source: string; value: number }>;
}

/**
 * Interface for any system that can be applied to a character
 */
export interface CharacterSystem {
  /**
   * Apply this system to a character
   * @param character The character to apply the system to
   */
  applyToCharacter(character: CompleteCharacter): Promise<void>;
  
  /**
   * Clear any effects from this system
   */
  clearEffects(): void;
}

/**
 * Interface for a system that has dependencies on other systems
 */
export interface SystemWithDependencies extends CharacterSystem {
  /**
   * Set dependencies on other systems
   * @param dependencies Object mapping dependency names to system instances
   */
  setDependencies(dependencies: Record<string, CharacterSystem>): void;
}

/**
 * Interface for the context provided to systems
 */
export interface SystemContext {
  gameRules: GameRulesAPI;
  systems: Record<string, CharacterSystem>;
}

/**
 * Generic bonus entry for use in all bonus calculations
 */
export interface BonusEntry {
  source: string;
  value: number;
  type?: string;
  condition?: string;
  priority?: number;
}

/**
 * Represents a favored class choice option
 */
export interface FavoredClassChoice {
  id: number;
  name: string;
  label?: string;
}

/**
 * Represents a favored class bonus entry for a character
 */
export interface FavoredClassBonus {
  id: number;
  game_character_id: number;
  class_id: number;
  choice_id: number;
  level: number;
  choice?: FavoredClassChoice;
} 