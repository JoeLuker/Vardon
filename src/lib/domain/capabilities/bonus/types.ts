/**
 * Bonus Capability Types
 * 
 * This file defines the interfaces for the bonus capability,
 * which provides a generic system for applying and calculating bonuses.
 */

import type { Entity, Capability } from '../../kernel/types';
import type { CapabilityOptions } from '../BaseCapability';
import type { BonusBreakdown } from '../ability/types';

/**
 * Standard bonus types with stacking rules
 */
export enum BonusType {
  ALCHEMICAL = 'alchemical',      // Non-stacking
  ARMOR = 'armor',                // Non-stacking
  CIRCUMSTANCE = 'circumstance',  // Stacking
  COMPETENCE = 'competence',      // Non-stacking
  DEFLECTION = 'deflection',      // Non-stacking
  DODGE = 'dodge',                // Stacking
  ENHANCEMENT = 'enhancement',    // Non-stacking
  INSIGHT = 'insight',           // Non-stacking
  LUCK = 'luck',                 // Non-stacking
  MORALE = 'morale',             // Non-stacking
  NATURAL_ARMOR = 'natural_armor', // Non-stacking
  PROFANE = 'profane',           // Non-stacking
  RACIAL = 'racial',             // Stacking
  RESISTANCE = 'resistance',     // Non-stacking
  SACRED = 'sacred',             // Non-stacking
  SHIELD = 'shield',             // Non-stacking
  SIZE = 'size',                 // Non-stacking
  TRAIT = 'trait',               // Stacking
  UNTYPED = 'untyped'            // Stacking
}

/**
 * Bonus source structure
 */
export interface BonusSource {
  /** ID of source providing the bonus */
  id: string;
  
  /** Name of source providing the bonus */
  name: string;
  
  /** Type of source (item, feat, class feature, etc.) */
  type: string;
}

/**
 * Bonus target structure
 */
export interface BonusTarget {
  /** ID of the target (ability, skill, etc.) */
  id: string;
  
  /** Category of target (ability, attack, damage, etc.) */
  category: string;
}

/**
 * Individual bonus data
 */
export interface Bonus {
  /** Value of the bonus */
  value: number;
  
  /** Type of the bonus */
  type: BonusType | string;
  
  /** Source of the bonus */
  source: string;
  
  /** When the bonus was applied */
  appliedAt: number;
  
  /** Duration in ms (0 for permanent) */
  duration?: number;
  
  /** Conditions for the bonus to be active */
  conditions?: string[];
}

/**
 * Bonus stacking rule
 */
export enum StackingRule {
  /** Stack all bonuses of same type */
  STACK_ALL = 'stack_all',
  
  /** Only use the highest bonus of same type */
  HIGHEST_ONLY = 'highest_only',
  
  /** Sum all positive bonuses, use lowest penalty */
  POSITIVE_STACK_LOWEST_PENALTY = 'positive_stack_lowest_penalty'
}

/**
 * Bonus capability options
 */
export interface BonusCapabilityOptions extends CapabilityOptions {
  /** Stack same-type bonuses (default: false) */
  stackSameType?: boolean;
}

/**
 * Bonus capability interface
 */
export interface BonusCapability {
  /** Unique identifier for this capability */
  readonly id: string;
  
  /** Semantic version of this capability implementation */
  readonly version: string;
  
  /** Initialize an entity */
  initialize?(entity: Entity): void;
  
  /** Clean up resources */
  shutdown?(): Promise<void>;
  
  /**
   * Add a bonus to a specific target
   * @param entity Entity to add bonus to
   * @param target Target to apply bonus to (e.g. 'strength', 'attack', 'damage')
   * @param value Bonus value
   * @param type Bonus type (e.g. 'enhancement', 'morale')
   * @param source Source of the bonus (e.g. 'Magic Weapon', 'Rage')
   */
  addBonus(
    entity: Entity,
    target: string,
    value: number,
    type: string,
    source: string
  ): void;
  
  /**
   * Remove all bonuses from a specific source
   * @param entity Entity to remove bonus from
   * @param target Target to remove bonus from
   * @param source Source of the bonus to remove
   */
  removeBonus(entity: Entity, target: string, source: string): void;
  
  /**
   * Calculate the total bonus value after applying stacking rules
   * @param entity Entity to calculate bonus for
   * @param target Target to calculate bonus for
   * @returns Total bonus value
   */
  calculateTotal(entity: Entity, target: string): number;
  
  /**
   * Get a detailed breakdown of bonus calculations
   * @param entity Entity to get bonus breakdown for
   * @param target Target to get bonus breakdown for
   * @returns Bonus breakdown
   */
  getBreakdown(entity: Entity, target: string): BonusBreakdown;
  
  /**
   * Check if a specific bonus exists
   * @param entity Entity to check bonus for
   * @param target Target to check bonus for
   * @param source Source of the bonus to check
   * @returns Whether the bonus exists
   */
  hasBonus(entity: Entity, target: string, source: string): boolean;
  
  /**
   * Get all bonuses for an entity
   * @param entity Entity to get bonuses for
   * @returns Record of all bonuses by target
   */
  getAllBonuses(entity: Entity): Record<string, any>;
  
  /**
   * Get components of a bonus
   * @param entity Entity to get bonus components for
   * @param target Target to get bonus components for
   * @returns Array of bonus components
   */
  getComponents(
    entity: Entity,
    target: string
  ): Array<{ source: string; value: number; type?: string }>;
}