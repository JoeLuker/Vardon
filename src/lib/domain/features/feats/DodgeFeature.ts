import type { Entity } from '../../types/EntityTypes';
import type { Feature, ValidationResult } from '../../types/FeatureTypes';
import type { BonusSubsystem } from '../../types/SubsystemTypes';

export const DodgeFeature: Feature = {
  id: 'feat.dodge',
  name: 'Dodge',
  requiredSubsystems: ['bonus'],
  description: 'You gain a +1 dodge bonus to your AC. This bonus stacks with other dodge bonuses.',
  prerequisites: ['Dexterity 13'],
  category: 'combat',
  persistent: true, // Dodge is a persistent feature
  
  apply(entity: Entity, options: {}, subsystems: { bonus: BonusSubsystem }) {
    const { bonus } = subsystems;
    
    // Store feat in character data
    if (!entity.character) entity.character = {};
    if (!entity.character.feats) entity.character.feats = [];
    
    // Check if the feat already exists to avoid duplication
    const hasFeaturealready = entity.character.feats.some(feat => feat.id === this.id);
    if (!hasFeaturealready) {
      entity.character.feats.push({
        id: this.id,
        name: this.name
      });
    }
    
    // Apply the dodge bonus to AC
    // Dodge bonuses are designed to stack in Pathfinder
    bonus.addBonus(
      entity,
      'ac',
      1,
      'dodge',
      'Dodge'
    );
    
    // Also apply to touch AC and CMD since dodge bonuses apply to these
    bonus.addBonus(
      entity,
      'touch_ac',
      1,
      'dodge',
      'Dodge'
    );
    
    bonus.addBonus(
      entity,
      'cmd',
      1,
      'dodge',
      'Dodge'
    );
    
    return {
      success: true,
      bonusApplied: 1
    };
  },
  
  unapply(entity: Entity, options: {}, subsystems: { bonus: BonusSubsystem }) {
    const { bonus } = subsystems;
    
    // Remove the dodge bonuses
    bonus.removeBonus(entity, 'ac', 'Dodge');
    bonus.removeBonus(entity, 'touch_ac', 'Dodge');
    bonus.removeBonus(entity, 'cmd', 'Dodge');
    
    return {
      success: true
    };
  },
  
  canApply(entity: Entity, subsystems: Record<string, Subsystem>): ValidationResult {
    // Check for Dexterity 13 prerequisite
    const dexterity = entity.character?.abilities?.dexterity || 0;
    if (dexterity < 13) {
      return { valid: false, reason: "Requires Dexterity 13 or higher" };
    }
    
    return { valid: true };
  }
};