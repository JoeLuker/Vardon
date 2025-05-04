import type { Entity } from '../../types/EntityTypes';
import type { Feature, ValidationResult } from '../../types/FeatureTypes';
import type { BonusSubsystem } from '../../types/SubsystemTypes';

export const PowerAttackFeature: Feature = {
  id: 'feat.power_attack',
  name: 'Power Attack',
  requiredSubsystems: ['bonus'],
  description: 'You can choose to take a penalty on all melee attack rolls to gain a bonus on all melee damage rolls. This penalty applies until your next turn.',
  prerequisites: ['Str 13', 'base attack bonus +1'],
  category: 'combat',
  persistent: false, // Power Attack can be toggled on/off
  
  apply(entity: Entity, options: { penalty?: number }, subsystems: { bonus: BonusSubsystem }) {
    const { bonus } = subsystems;
    
    // The penalty cannot exceed BAB and cannot be negative
    const baseAttackBonus = entity.character?.baseAttackBonus || 0;
    let attackPenalty = options.penalty || 1;
    
    // Make sure the penalty doesn't exceed the maximum allowed
    attackPenalty = Math.max(1, Math.min(attackPenalty, baseAttackBonus));
    
    // Damage bonus is 2x for one-handed weapons, 3x for two-handed
    // For simplicity, we're assuming two-handed weapons here (3x)
    const damageBonus = attackPenalty * 3;
    
    // Store feat in character data if not already there
    if (!entity.character) entity.character = {};
    if (!entity.character.feats) entity.character.feats = [];
    
    const existingFeatIndex = entity.character.feats.findIndex(feat => feat.id === this.id);
    if (existingFeatIndex >= 0) {
      // Update existing feat
      entity.character.feats[existingFeatIndex].options = { penalty: attackPenalty };
    } else {
      // Add new feat
      entity.character.feats.push({
        id: this.id,
        name: this.name,
        options: { penalty: attackPenalty }
      });
    }
    
    // Store the active state for toggling
    if (!entity.character.activeFeatures) entity.character.activeFeatures = {};
    entity.character.activeFeatures[this.id] = {
      active: true,
      options: { penalty: attackPenalty }
    };
    
    // Apply the attack penalty to all melee attacks
    bonus.addBonus(
      entity, 
      'melee_attack', 
      -attackPenalty,
      'untyped',
      'Power Attack'
    );
    
    // Apply the damage bonus to all melee damage
    bonus.addBonus(
      entity,
      'melee_damage',
      damageBonus,
      'untyped',
      'Power Attack'
    );
    
    return { 
      success: true,
      attackPenalty,
      damageBonus
    };
  },
  
  unapply(entity: Entity, options: {}, subsystems: { bonus: BonusSubsystem }) {
    const { bonus } = subsystems;
    
    // Remove the bonuses
    bonus.removeBonus(entity, 'melee_attack', 'Power Attack');
    bonus.removeBonus(entity, 'melee_damage', 'Power Attack');
    
    // Update active state
    if (entity.character?.activeFeatures) {
      entity.character.activeFeatures[this.id] = {
        active: false,
        options: {}
      };
    }
    
    return {
      success: true
    };
  },
  
  canApply(entity: Entity, subsystems: Record<string, Subsystem>): ValidationResult {
    // Check Strength 13 prerequisite
    const strength = entity.character?.abilities?.strength || 0;
    if (strength < 13) {
      return { valid: false, reason: "Requires Strength 13 or higher" };
    }
    
    // Check BAB +1 prerequisite
    const bab = entity.character?.baseAttackBonus || 0;
    if (bab < 1) {
      return { valid: false, reason: "Requires base attack bonus +1 or higher" };
    }
    
    return { valid: true };
  }
};