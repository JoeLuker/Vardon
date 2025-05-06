/**
 * Bonus Capability Provider
 * 
 * This module implements the bonus capability, which provides
 * a generic system for applying and calculating bonuses.
 */

import type { Entity } from '../../kernel/types';
import { BaseCapability } from '../BaseCapability';
import type { BonusCapability, BonusCapabilityOptions, BonusBreakdown } from './types';

/**
 * Private type for bonus component storage
 */
interface BonusComponent {
  value: number;
  type: string;
  source: string;
}

/**
 * Implementation of the bonus capability
 */
export class BonusCapabilityProvider extends BaseCapability implements BonusCapability {
  /** Capability ID */
  public readonly id = 'bonus';
  
  /** Whether to stack same-type bonuses */
  private readonly stackSameType: boolean;
  
  constructor(options: BonusCapabilityOptions = {}) {
    super(options);
    this.stackSameType = options.stackSameType || false;
  }
  
  /**
   * Initialize the bonus system for the given entity
   * @param entity Entity to initialize bonuses for
   */
  initialize(entity: Entity): void {
    // Ensure the bonuses property exists
    if (!entity.properties.bonuses) {
      entity.properties.bonuses = {};
    }
    
    this.log(`Initialized bonus system for entity: ${entity.id}`);
  }
  
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
  ): void {
    this.log(`Adding bonus to '${target}' for entity ${entity.id}:`, { value, type, source });
    
    // Ensure the bonuses property exists
    if (!entity.properties.bonuses) {
      entity.properties.bonuses = {};
    }
    
    // Ensure the target array exists
    if (!entity.properties.bonuses[target]) {
      entity.properties.bonuses[target] = [];
    }
    
    // Check if a bonus from this source already exists
    const existingIndex = entity.properties.bonuses[target].findIndex(
      (b: BonusComponent) => b.source === source
    );
    
    // If it exists, update it
    if (existingIndex !== -1) {
      entity.properties.bonuses[target][existingIndex] = { value, type, source };
    } else {
      // Otherwise, add it
      entity.properties.bonuses[target].push({ value, type, source });
    }
    
    // Update entity timestamp
    entity.metadata.updatedAt = Date.now();
  }
  
  /**
   * Remove all bonuses from a specific source
   * @param entity Entity to remove bonus from
   * @param target Target to remove bonus from
   * @param source Source of the bonus to remove
   */
  removeBonus(entity: Entity, target: string, source: string): void {
    this.log(`Removing bonus from '${target}' for entity ${entity.id}:`, { source });
    
    // Ensure the bonuses property exists
    if (!entity.properties.bonuses) {
      return;
    }
    
    // Ensure the target array exists
    if (!entity.properties.bonuses[target]) {
      return;
    }
    
    // Filter out bonuses from this source
    entity.properties.bonuses[target] = entity.properties.bonuses[target].filter(
      (b: BonusComponent) => b.source !== source
    );
    
    // If the target array is empty, remove it
    if (entity.properties.bonuses[target].length === 0) {
      delete entity.properties.bonuses[target];
    }
    
    // Update entity timestamp
    entity.metadata.updatedAt = Date.now();
  }
  
  /**
   * Calculate the total bonus value after applying stacking rules
   * @param entity Entity to calculate bonus for
   * @param target Target to calculate bonus for
   * @returns Total bonus value
   */
  calculateTotal(entity: Entity, target: string): number {
    // Ensure the bonuses property exists
    if (!entity.properties.bonuses) {
      return 0;
    }
    
    // Ensure the target array exists
    if (!entity.properties.bonuses[target]) {
      return 0;
    }
    
    // Group bonuses by type
    const bonusesByType: Record<string, BonusComponent[]> = {};
    for (const bonus of entity.properties.bonuses[target]) {
      if (!bonusesByType[bonus.type]) {
        bonusesByType[bonus.type] = [];
      }
      bonusesByType[bonus.type].push(bonus);
    }
    
    // Calculate total by applying stacking rules
    let total = 0;
    
    // For each type, apply stacking rules
    for (const type in bonusesByType) {
      const bonuses = bonusesByType[type];
      
      if (this.stackSameType || type === 'untyped' || type === 'circumstance' || type === 'dodge') {
        // These types stack
        for (const bonus of bonuses) {
          total += bonus.value;
        }
      } else {
        // Take the highest bonus of this type
        let highestValue = 0;
        for (const bonus of bonuses) {
          if (bonus.value > highestValue) {
            highestValue = bonus.value;
          }
        }
        total += highestValue;
      }
    }
    
    return total;
  }
  
  /**
   * Get a detailed breakdown of bonus calculations
   * @param entity Entity to get bonus breakdown for
   * @param target Target to get bonus breakdown for
   * @returns Bonus breakdown
   */
  getBreakdown(entity: Entity, target: string): BonusBreakdown {
    // Create the base breakdown
    const breakdown: BonusBreakdown = {
      total: 0,
      base: 0,
      components: []
    };
    
    // Ensure the bonuses property exists
    if (!entity.properties.bonuses) {
      return breakdown;
    }
    
    // Ensure the target array exists
    if (!entity.properties.bonuses[target]) {
      return breakdown;
    }
    
    // Group bonuses by type
    const bonusesByType: Record<string, BonusComponent[]> = {};
    for (const bonus of entity.properties.bonuses[target]) {
      if (!bonusesByType[bonus.type]) {
        bonusesByType[bonus.type] = [];
      }
      bonusesByType[bonus.type].push(bonus);
    }
    
    // Calculate total by applying stacking rules
    let total = 0;
    const appliedComponents: Array<{ value: number; type: string; source: string }> = [];
    
    // For each type, apply stacking rules
    for (const type in bonusesByType) {
      const bonuses = bonusesByType[type];
      
      if (this.stackSameType || type === 'untyped' || type === 'circumstance' || type === 'dodge') {
        // These types stack
        for (const bonus of bonuses) {
          total += bonus.value;
          appliedComponents.push({
            value: bonus.value,
            type: bonus.type,
            source: bonus.source
          });
        }
      } else {
        // Take the highest bonus of this type
        let highestValue = 0;
        let highestBonus: BonusComponent | null = null;
        
        for (const bonus of bonuses) {
          if (bonus.value > highestValue) {
            highestValue = bonus.value;
            highestBonus = bonus;
          }
        }
        
        if (highestBonus) {
          total += highestValue;
          appliedComponents.push({
            value: highestBonus.value,
            type: highestBonus.type,
            source: highestBonus.source
          });
        }
      }
    }
    
    // Set the breakdown values
    breakdown.total = total;
    breakdown.components = appliedComponents;
    
    return breakdown;
  }
  
  /**
   * Check if a specific bonus exists
   * @param entity Entity to check bonus for
   * @param target Target to check bonus for
   * @param source Source of the bonus to check
   * @returns Whether the bonus exists
   */
  hasBonus(entity: Entity, target: string, source: string): boolean {
    // Ensure the bonuses property exists
    if (!entity.properties.bonuses) {
      return false;
    }
    
    // Ensure the target array exists
    if (!entity.properties.bonuses[target]) {
      return false;
    }
    
    // Check if a bonus from this source exists
    return entity.properties.bonuses[target].some(
      (b: BonusComponent) => b.source === source
    );
  }
  
  /**
   * Get all bonuses for an entity
   * @param entity Entity to get bonuses for
   * @returns Record of all bonuses by target
   */
  getAllBonuses(entity: Entity): Record<string, any> {
    // Ensure the bonuses property exists
    if (!entity.properties.bonuses) {
      return {};
    }
    
    return entity.properties.bonuses;
  }
  
  /**
   * Get components of a bonus
   * @param entity Entity to get bonus components for
   * @param target Target to get bonus components for
   * @returns Array of bonus components
   */
  getComponents(
    entity: Entity,
    target: string
  ): Array<{ source: string; value: number; type?: string }> {
    // Ensure the bonuses property exists
    if (!entity.properties.bonuses) {
      return [];
    }
    
    // Ensure the target array exists
    if (!entity.properties.bonuses[target]) {
      return [];
    }
    
    return entity.properties.bonuses[target];
  }
  
  /**
   * Clean up resources when shutting down
   */
  async shutdown(): Promise<void> {
    this.log('Shutting down bonus capability');
  }
}