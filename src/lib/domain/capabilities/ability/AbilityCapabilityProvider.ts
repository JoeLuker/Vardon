/**
 * Ability Capability Provider
 * 
 * This module implements the ability capability, which provides
 * access to ability score calculations.
 */

import { Entity } from '../../kernel/types';
import { BaseCapability } from '../types';
import { AbilityCapability, AbilityCapabilityOptions, AbilityBreakdown } from './types';
import { BonusCapability } from '../bonus';

/**
 * Standard abilities in Pathfinder
 */
const STANDARD_ABILITIES = [
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma'
];

/**
 * Implementation of the ability capability
 */
export class AbilityCapabilityProvider extends BaseCapability implements AbilityCapability {
  /** Capability ID */
  public readonly id = 'ability';
  
  /** Default abilities to initialize */
  private readonly defaultAbilities: string[];
  
  /** Bonus capability reference */
  private readonly bonusCapability: BonusCapability;
  
  constructor(
    bonusCapability: BonusCapability,
    options: AbilityCapabilityOptions = {}
  ) {
    super(options);
    this.defaultAbilities = options.defaultAbilities || STANDARD_ABILITIES;
    this.bonusCapability = bonusCapability;
  }
  
  /**
   * Initialize ability scores for the given entity
   * @param entity Entity to initialize abilities for
   */
  initialize(entity: Entity): void {
    // Ensure the abilities property exists
    if (!entity.properties.abilities) {
      entity.properties.abilities = {};
    }
    
    // Initialize default abilities
    for (const ability of this.defaultAbilities) {
      if (!entity.properties.abilities[ability]) {
        entity.properties.abilities[ability] = 10; // Default score
      }
    }
    
    this.log(`Initialized ability scores for entity: ${entity.id}`);
  }
  
  /**
   * Get the total ability score including all bonuses
   * @param entity Entity to get ability score for
   * @param ability Ability name (e.g. 'strength')
   * @returns Total ability score
   */
  getAbilityScore(entity: Entity, ability: string): number {
    // Get base ability score
    const base = this.getBaseAbilityScore(entity, ability);
    
    // Calculate bonuses
    const bonusTotal = this.bonusCapability.calculateTotal(entity, ability);
    
    return base + bonusTotal;
  }
  
  /**
   * Get the ability modifier calculated from the total score
   * @param entity Entity to get ability modifier for
   * @param ability Ability name (e.g. 'strength')
   * @returns Ability modifier
   */
  getAbilityModifier(entity: Entity, ability: string): number {
    const score = this.getAbilityScore(entity, ability);
    return Math.floor((score - 10) / 2);
  }
  
  /**
   * Set the base ability score
   * @param entity Entity to set ability score for
   * @param ability Ability name (e.g. 'strength')
   * @param value Base ability score value
   */
  setAbilityScore(entity: Entity, ability: string, value: number): void {
    // Ensure the abilities property exists
    if (!entity.properties.abilities) {
      entity.properties.abilities = {};
    }
    
    // Set the ability score
    entity.properties.abilities[ability] = value;
    
    // Update entity timestamp
    entity.metadata.updatedAt = Date.now();
    
    this.log(`Set ${ability} for entity ${entity.id} to ${value}`);
  }
  
  /**
   * Get the base ability score before bonuses
   * @param entity Entity to get base ability score for
   * @param ability Ability name (e.g. 'strength')
   * @returns Base ability score
   */
  getBaseAbilityScore(entity: Entity, ability: string): number {
    // Ensure the abilities property exists
    if (!entity.properties.abilities) {
      return 10; // Default score
    }
    
    // Get the ability score, defaulting to 10 if not set
    return entity.properties.abilities[ability] || 10;
  }
  
  /**
   * Get a detailed breakdown of an ability score
   * @param entity Entity to get ability breakdown for
   * @param ability Ability name (e.g. 'strength')
   * @returns Ability breakdown
   */
  getAbilityBreakdown(entity: Entity, ability: string): AbilityBreakdown {
    // Get base ability score
    const base = this.getBaseAbilityScore(entity, ability);
    
    // Get bonus breakdown
    const bonuses = this.bonusCapability.getBreakdown(entity, ability);
    
    // Calculate total
    const total = base + bonuses.total;
    
    // Calculate modifier
    const modifier = Math.floor((total - 10) / 2);
    
    return {
      ability,
      base,
      total,
      modifier,
      bonuses
    };
  }
  
  /**
   * Apply a bonus to an ability score
   * @param entity Entity to apply bonus to
   * @param ability Ability name (e.g. 'strength')
   * @param value Bonus value
   * @param type Bonus type (e.g. 'enhancement', 'morale')
   * @param source Source of the bonus (e.g. 'Bull's Strength')
   */
  applyAbilityBonus(
    entity: Entity,
    ability: string,
    value: number,
    type: string,
    source: string
  ): void {
    this.bonusCapability.addBonus(entity, ability, value, type, source);
    this.log(`Applied ${type} bonus of ${value} to ${ability} for entity ${entity.id} from ${source}`);
  }
  
  /**
   * Remove a bonus from an ability score
   * @param entity Entity to remove bonus from
   * @param ability Ability name (e.g. 'strength')
   * @param source Source of the bonus to remove
   */
  removeAbilityBonus(entity: Entity, ability: string, source: string): void {
    this.bonusCapability.removeBonus(entity, ability, source);
    this.log(`Removed bonus from ${ability} for entity ${entity.id} from ${source}`);
  }
  
  /**
   * Clean up resources when shutting down
   */
  async shutdown(): Promise<void> {
    this.log('Shutting down ability capability');
  }
}