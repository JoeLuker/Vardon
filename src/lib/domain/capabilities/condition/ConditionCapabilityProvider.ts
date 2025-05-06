/**
 * Condition Capability Provider
 * 
 * This module provides the condition capability implementation.
 */

import type { Entity } from '../../kernel/types';
import type { ConditionCapability, ConditionCapabilityOptions, Condition, ApplyConditionOptions } from './types';
import type { BonusCapability } from '../bonus/types';
import { BaseCapability } from '../BaseCapability';

/**
 * Implementation of the condition capability
 */
export class ConditionCapabilityProvider extends BaseCapability implements ConditionCapability {
  /** Unique identifier for this capability */
  public readonly id = 'condition';
  
  /** Semantic version of this capability */
  public readonly version = '1.0.0';
  
  /** Dependencies */
  private readonly bonusCapability: BonusCapability;
  
  /** Registered condition definitions */
  private readonly conditionDefinitions: Map<string, Omit<Condition, 'appliedAt' | 'stacks'>> = new Map();
  
  constructor(
    bonusCapability: BonusCapability,
    options: ConditionCapabilityOptions = {}
  ) {
    super({ debug: options.debug });
    
    this.bonusCapability = bonusCapability;
    
    // Register standard conditions
    this.registerStandardConditions();
    
    this.log('Condition capability provider initialized');
  }
  
  /**
   * Initialize an entity's condition properties
   * @param entity Entity to initialize
   */
  initialize(entity: Entity): void {
    this.log(`Initializing conditions for entity: ${entity.id}`);
    
    // Ensure conditions property exists
    if (!entity.properties.conditions) {
      entity.properties.conditions = [];
    }
    
    this.log(`Condition initialization complete for entity: ${entity.id}`);
  }
  
  /**
   * Apply a condition to an entity
   * @param entityId Entity ID
   * @param conditionId Condition ID
   * @param options Options for applying the condition
   * @returns Applied condition
   */
  applyCondition(
    entityId: string,
    conditionId: string,
    options: ApplyConditionOptions = {}
  ): Condition {
    const entity = this.getEntityOrThrow(entityId);
    
    // Ensure conditions property exists
    if (!entity.properties.conditions) {
      this.initialize(entity);
    }
    
    // Get condition definition
    const definition = this.getConditionDefinition(conditionId);
    if (!definition) {
      throw new Error(`Condition definition not found: ${conditionId}`);
    }
    
    // Check if entity already has this condition
    const existingCondition = this.getCondition(entityId, conditionId);
    
    if (existingCondition) {
      if (definition.stacks && options.addStack) {
        // Increment stacks if condition stacks and addStack is true
        const currentStacks = existingCondition.stacks || 1;
        const maxStacks = definition.maxStacks || Number.MAX_SAFE_INTEGER;
        
        if (currentStacks < maxStacks) {
          existingCondition.stacks = currentStacks + 1;
          
          // Update duration if specified
          if (options.duration !== undefined) {
            existingCondition.duration = options.duration;
          }
          
          // Apply stack-based effects
          this.applyConditionEffects(entityId, existingCondition);
          
          return existingCondition;
        } else {
          this.log(`Cannot add stack to condition ${conditionId}: already at max stacks (${maxStacks})`);
          return existingCondition;
        }
      } else if (!definition.stacks) {
        this.log(`Entity ${entityId} already has non-stacking condition ${conditionId}`);
        
        // Update duration if specified
        if (options.duration !== undefined) {
          existingCondition.duration = options.duration;
        }
        
        return existingCondition;
      }
    }
    
    // Create new condition
    const newCondition: Condition = {
      ...definition,
      appliedAt: Date.now(),
      source: options.source || 'unknown',
      stacks: definition.stacks ? 1 : undefined,
      duration: options.duration,
      data: options.data
    };
    
    // Add condition to entity
    entity.properties.conditions.push(newCondition);
    
    // Apply condition effects
    this.applyConditionEffects(entityId, newCondition);
    
    this.log(`Applied condition ${conditionId} to entity ${entityId}`);
    
    return newCondition;
  }
  
  /**
   * Remove a condition from an entity
   * @param entityId Entity ID
   * @param conditionId Condition ID
   * @returns Whether the condition was removed
   */
  removeCondition(entityId: string, conditionId: string): boolean {
    const entity = this.getEntityOrThrow(entityId);
    
    if (!entity.properties.conditions) {
      return false;
    }
    
    // Get the condition
    const condition = this.getCondition(entityId, conditionId);
    
    if (!condition) {
      return false;
    }
    
    // Check if condition is removable
    if (!condition.removable) {
      this.log(`Cannot remove condition ${conditionId}: not removable`);
      return false;
    }
    
    // Remove condition effects
    this.removeConditionEffects(entityId, condition);
    
    // Remove condition from entity
    entity.properties.conditions = entity.properties.conditions.filter(c => c.id !== conditionId);
    
    this.log(`Removed condition ${conditionId} from entity ${entityId}`);
    
    return true;
  }
  
  /**
   * Check if an entity has a condition
   * @param entityId Entity ID
   * @param conditionId Condition ID
   * @returns Whether the entity has the condition
   */
  hasCondition(entityId: string, conditionId: string): boolean {
    return this.getCondition(entityId, conditionId) !== undefined;
  }
  
  /**
   * Get a condition on an entity
   * @param entityId Entity ID
   * @param conditionId Condition ID
   * @returns Condition or undefined if not found
   */
  getCondition(entityId: string, conditionId: string): Condition | undefined {
    const entity = this.getEntity(entityId);
    
    if (!entity || !entity.properties.conditions) {
      return undefined;
    }
    
    return entity.properties.conditions.find(c => c.id === conditionId);
  }
  
  /**
   * Get all conditions on an entity
   * @param entityId Entity ID
   * @returns All conditions on the entity
   */
  getAllConditions(entityId: string): Condition[] {
    const entity = this.getEntity(entityId);
    
    if (!entity || !entity.properties.conditions) {
      return [];
    }
    
    return entity.properties.conditions;
  }
  
  /**
   * Register a condition definition
   * @param conditionId Condition ID
   * @param definition Condition definition
   */
  registerConditionDefinition(
    conditionId: string,
    definition: Omit<Condition, 'appliedAt' | 'stacks'>
  ): void {
    this.conditionDefinitions.set(conditionId, definition);
    this.log(`Registered condition definition: ${conditionId}`);
  }
  
  /**
   * Get a condition definition
   * @param conditionId Condition ID
   * @returns Condition definition or undefined if not found
   */
  getConditionDefinition(conditionId: string): Omit<Condition, 'appliedAt' | 'stacks'> | undefined {
    return this.conditionDefinitions.get(conditionId);
  }
  
  /**
   * Process condition expirations
   * @param entityId Entity ID
   * @param rounds Number of rounds that have passed
   * @returns Conditions that expired
   */
  processExpirations(entityId: string, rounds: number): Condition[] {
    const entity = this.getEntityOrThrow(entityId);
    
    if (!entity.properties.conditions) {
      return [];
    }
    
    const expiredConditions: Condition[] = [];
    
    // Process each condition
    for (const condition of [...entity.properties.conditions]) {
      if (condition.duration !== undefined) {
        // Reduce duration by number of rounds
        condition.duration -= rounds;
        
        // If duration reaches 0 or below, the condition expires
        if (condition.duration <= 0) {
          // Remove the condition
          this.removeCondition(entityId, condition.id);
          
          // Add to expired conditions list
          expiredConditions.push(condition);
        }
      }
    }
    
    return expiredConditions;
  }
  
  /**
   * Register standard conditions
   */
  private registerStandardConditions(): void {
    // Blinded
    this.registerConditionDefinition('blinded', {
      id: 'blinded',
      name: 'Blinded',
      description: 'The character cannot see, taking a -2 penalty to AC, losing Dexterity bonus to AC, and taking a -4 penalty on most Strength and Dexterity-based skill checks and on opposed Perception skill checks.',
      severity: 4,
      removable: true,
      stacks: false,
      source: 'system'
    });
    
    // Confused
    this.registerConditionDefinition('confused', {
      id: 'confused',
      name: 'Confused',
      description: 'The character behaves randomly, rolling on the confusion table each round.',
      severity: 3,
      removable: true,
      stacks: false,
      source: 'system'
    });
    
    // Dazzled
    this.registerConditionDefinition('dazzled', {
      id: 'dazzled',
      name: 'Dazzled',
      description: 'The creature is unable to see well because of overstimulation of the eyes, taking a -1 penalty on attack rolls and sight-based Perception checks.',
      severity: 1,
      removable: true,
      stacks: false,
      source: 'system'
    });
    
    // Deafened
    this.registerConditionDefinition('deafened', {
      id: 'deafened',
      name: 'Deafened',
      description: 'The character cannot hear, taking a -4 penalty on initiative checks and a -4 penalty on Perception checks based on sound.',
      severity: 2,
      removable: true,
      stacks: false,
      source: 'system'
    });
    
    // Fatigued
    this.registerConditionDefinition('fatigued', {
      id: 'fatigued',
      name: 'Fatigued',
      description: 'A fatigued character cannot run or charge and takes a -2 penalty to Strength and Dexterity.',
      severity: 2,
      removable: true,
      stacks: false,
      source: 'system'
    });
    
    // Exhausted
    this.registerConditionDefinition('exhausted', {
      id: 'exhausted',
      name: 'Exhausted',
      description: 'An exhausted character moves at half speed, cannot run or charge, and takes a -6 penalty to Strength and Dexterity.',
      severity: 3,
      removable: true,
      stacks: false,
      source: 'system'
    });
    
    // Frightened
    this.registerConditionDefinition('frightened', {
      id: 'frightened',
      name: 'Frightened',
      description: 'A frightened creature flees from the source of its fear as best it can, taking a -2 penalty on attack rolls, saving throws, skill checks, and ability checks.',
      severity: 3,
      removable: true,
      stacks: false,
      source: 'system'
    });
    
    // Shaken
    this.registerConditionDefinition('shaken', {
      id: 'shaken',
      name: 'Shaken',
      description: 'A shaken character takes a -2 penalty on attack rolls, saving throws, skill checks, and ability checks.',
      severity: 2,
      removable: true,
      stacks: false,
      source: 'system'
    });
    
    // Sickened
    this.registerConditionDefinition('sickened', {
      id: 'sickened',
      name: 'Sickened',
      description: 'The character takes a -2 penalty on all attack rolls, weapon damage rolls, saving throws, skill checks, and ability checks.',
      severity: 2,
      removable: true,
      stacks: false,
      source: 'system'
    });
    
    // Stunned
    this.registerConditionDefinition('stunned', {
      id: 'stunned',
      name: 'Stunned',
      description: 'A stunned creature drops everything held, cannot take actions, takes a -2 penalty to AC, and loses Dexterity bonus to AC.',
      severity: 4,
      removable: true,
      stacks: false,
      source: 'system'
    });
  }
  
  /**
   * Apply condition effects to an entity
   * @param entityId Entity ID
   * @param condition Condition to apply effects for
   */
  private applyConditionEffects(entityId: string, condition: Condition): void {
    // Apply effects based on condition
    switch (condition.id) {
      case 'blinded':
        // -2 penalty to AC
        this.bonusCapability.addBonus(entityId, 'ac', 'blinded', -2);
        
        // -4 penalty to relevant skill checks
        this.bonusCapability.addBonus(entityId, 'skill.perception', 'blinded', -4);
        break;
        
      case 'dazzled':
        // -1 penalty on attack rolls
        this.bonusCapability.addBonus(entityId, 'attack', 'dazzled', -1);
        
        // -1 penalty on sight-based Perception checks
        this.bonusCapability.addBonus(entityId, 'skill.perception', 'dazzled', -1);
        break;
        
      case 'deafened':
        // -4 penalty on initiative checks
        this.bonusCapability.addBonus(entityId, 'initiative', 'deafened', -4);
        
        // -4 penalty on Perception checks based on sound
        this.bonusCapability.addBonus(entityId, 'skill.perception', 'deafened', -4);
        break;
        
      case 'fatigued':
        // -2 penalty to Strength
        this.bonusCapability.addBonus(entityId, 'ability.strength', 'fatigued', -2);
        
        // -2 penalty to Dexterity
        this.bonusCapability.addBonus(entityId, 'ability.dexterity', 'fatigued', -2);
        break;
        
      case 'exhausted':
        // -6 penalty to Strength
        this.bonusCapability.addBonus(entityId, 'ability.strength', 'exhausted', -6);
        
        // -6 penalty to Dexterity
        this.bonusCapability.addBonus(entityId, 'ability.dexterity', 'exhausted', -6);
        break;
        
      case 'frightened':
      case 'shaken':
        // -2 penalty on attack rolls, saving throws, skill checks, and ability checks
        this.bonusCapability.addBonus(entityId, 'attack', condition.id, -2);
        this.bonusCapability.addBonus(entityId, 'save.fortitude', condition.id, -2);
        this.bonusCapability.addBonus(entityId, 'save.reflex', condition.id, -2);
        this.bonusCapability.addBonus(entityId, 'save.will', condition.id, -2);
        break;
        
      case 'sickened':
        // -2 penalty on all attack rolls, weapon damage rolls, saving throws, skill checks, and ability checks
        this.bonusCapability.addBonus(entityId, 'attack', 'sickened', -2);
        this.bonusCapability.addBonus(entityId, 'damage', 'sickened', -2);
        this.bonusCapability.addBonus(entityId, 'save.fortitude', 'sickened', -2);
        this.bonusCapability.addBonus(entityId, 'save.reflex', 'sickened', -2);
        this.bonusCapability.addBonus(entityId, 'save.will', 'sickened', -2);
        break;
        
      case 'stunned':
        // -2 penalty to AC, lose Dexterity bonus to AC
        this.bonusCapability.addBonus(entityId, 'ac', 'stunned', -2);
        break;
    }
  }
  
  /**
   * Remove condition effects from an entity
   * @param entityId Entity ID
   * @param condition Condition to remove effects for
   */
  private removeConditionEffects(entityId: string, condition: Condition): void {
    // Remove all bonuses associated with this condition
    this.bonusCapability.removeBonusesWithSource(entityId, condition.id);
  }
  
  /**
   * Get entity or throw an error if not found
   * @param entityId Entity ID
   * @returns Entity
   */
  private getEntityOrThrow(entityId: string): Entity {
    const entity = this.getEntity(entityId);
    if (!entity) {
      throw new Error(`Entity not found: ${entityId}`);
    }
    return entity;
  }
}