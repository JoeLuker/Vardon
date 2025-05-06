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