import type { Entity } from '../types/EntityTypes';
import type { ConditionSubsystem, ConditionEffect, BonusSubsystem } from '../types/SubsystemTypes';

export class ConditionSubsystemImpl implements ConditionSubsystem {
  id = 'condition';
  version = '1.0.0';
  
  constructor(private bonusSubsystem: BonusSubsystem) {}
  
  // Condition definitions
  private conditionEffects: Record<string, ConditionEffect> = {
    // Movement conditions
    'prone': {
      name: 'Prone',
      description: 'You are lying on the ground and take penalties to attacks and AC.',
      effects: {
        ac_melee: -4,
        ac_ranged: 4,
        attack: -2,
        movement: 0.5 // Half movement
      }
    },
    'grappled': {
      name: 'Grappled',
      description: 'You are restrained by a creature, effect, or trap.',
      effects: {
        dexterity: -4,
        attack: -2,
        movement: 0 // Cannot move
      }
    },
    'entangled': {
      name: 'Entangled',
      description: 'You are caught in something that restricts movement.',
      effects: {
        dexterity: -4,
        attack: -2,
        movement: 0.5 // Half movement
      }
    },
    
    // Mental/physical conditions
    'blinded': {
      name: 'Blinded',
      description: 'You cannot see and take penalties to most actions.',
      effects: {
        ac: -2,
        attack: -4,
        perception: -4,
        movement: 0.5 // Half movement
      }
    },
    'deafened': {
      name: 'Deafened',
      description: 'You cannot hear.',
      effects: {
        initiative: -4,
        perception: -4
      }
    },
    'fatigued': {
      name: 'Fatigued',
      description: 'You cannot run or charge, and take penalties to Strength and Dexterity.',
      effects: {
        strength: -2,
        dexterity: -2,
        movement: 0.75 // Cannot run or charge
      }
    },
    'exhausted': {
      name: 'Exhausted',
      description: 'You move slower and take penalties to Strength and Dexterity.',
      effects: {
        strength: -6,
        dexterity: -6,
        movement: 0.5 // Half movement
      }
    },
    'sickened': {
      name: 'Sickened',
      description: 'You take penalties to attacks, weapon damage, saves, skills, and ability checks.',
      effects: {
        attack: -2,
        weapon_damage: -2,
        saving_throws: -2,
        skills: -2,
        ability_checks: -2
      }
    },
    'frightened': {
      name: 'Frightened',
      description: 'You flee from the source of your fear.',
      effects: {
        attack: -2,
        saving_throws: -2,
        skills: -2,
        ability_checks: -2
      }
    },
    
    // Combat conditions
    'flat-footed': {
      name: 'Flat-Footed',
      description: 'You have not yet acted in combat and cannot apply Dexterity bonus to AC.',
      effects: {
        // Special handling in AC calculations
      }
    },
    'stunned': {
      name: 'Stunned',
      description: 'You drop everything held, can\'t take actions, and take an AC penalty.',
      effects: {
        ac: -2,
        // Cannot take actions - special handling required
      }
    }
  };
  
  /**
   * Validate a condition exists
   */
  validateCondition(condition: string): boolean {
    return !!this.conditionEffects[condition];
  }
  
  /**
   * Apply a condition to an entity
   */
  applyCondition(entity: Entity, condition: string, duration?: number): void {
    if (!this.validateCondition(condition)) {
      throw new Error(`Unknown condition: ${condition}`);
    }
    
    if (!entity.character) entity.character = {};
    if (!entity.character.conditions) entity.character.conditions = [];
    
    // Only add if not already applied
    if (!entity.character.conditions.includes(condition)) {
      entity.character.conditions.push(condition);
    }
    
    // Track duration if needed
    if (duration) {
      if (!entity.character.conditionDurations) entity.character.conditionDurations = {};
      entity.character.conditionDurations[condition] = duration;
    }
    
    // Apply condition effects as bonuses
    const effects = this.conditionEffects[condition].effects;
    
    // Apply each effect to the bonus system
    Object.entries(effects).forEach(([target, value]) => {
      this.bonusSubsystem.addBonus(
        entity,
        target,
        typeof value === 'number' ? value : 0,
        'condition',
        `Condition: ${condition}`
      );
    });
    
    entity.metadata.updatedAt = Date.now();
  }
  
  /**
   * Remove a condition
   */
  removeCondition(entity: Entity, condition: string): void {
    if (!entity.character?.conditions) return;
    
    entity.character.conditions = entity.character.conditions.filter(c => c !== condition);
    
    // Remove duration tracking
    if (entity.character.conditionDurations) {
      delete entity.character.conditionDurations[condition];
    }
    
    // Remove condition effects from bonus system
    this.bonusSubsystem.removeBonus(entity, '*', `Condition: ${condition}`);
    
    entity.metadata.updatedAt = Date.now();
  }
  
  /**
   * Check if an entity has a condition
   */
  hasCondition(entity: Entity, condition: string): boolean {
    return entity.character?.conditions?.includes(condition) || false;
  }
  
  /**
   * Get all active conditions
   */
  getActiveConditions(entity: Entity): string[] {
    return entity.character?.conditions || [];
  }
  
  /**
   * Get the effects of a condition
   */
  getConditionEffect(condition: string): ConditionEffect {
    if (!this.validateCondition(condition)) {
      throw new Error(`Unknown condition: ${condition}`);
    }
    return this.conditionEffects[condition];
  }
  
  /**
   * Apply a round of duration updates
   * Returns conditions that expired
   */
  updateDurations(entity: Entity): string[] {
    if (!entity.character?.conditionDurations) return [];
    
    const expired: string[] = [];
    
    Object.entries(entity.character.conditionDurations).forEach(([condition, duration]) => {
      // Reduce duration by 1
      entity.character!.conditionDurations![condition] = duration - 1;
      
      // Check if condition has expired
      if (duration - 1 <= 0) {
        delete entity.character!.conditionDurations![condition];
        this.removeCondition(entity, condition);
        expired.push(condition);
      }
    });
    
    return expired;
  }
} 