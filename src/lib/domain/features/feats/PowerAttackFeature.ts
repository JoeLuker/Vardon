import type { Entity } from '../../types/EntityTypes';
import type { Feature } from '../../types/FeatureTypes';
import type { BonusSubsystem } from '../../types/SubsystemTypes';

export const PowerAttackFeature: Feature = {
  id: 'feat.power_attack',
  name: 'Power Attack',
  requiredSubsystems: ['bonus'],
  
  apply(entity: Entity, options: { penalty?: number }, subsystems: { bonus: BonusSubsystem }) {
    const { bonus } = subsystems;
    const attackPenalty = options.penalty || 1;
    const damageBonus = attackPenalty * 2;
    
    // Store feat in character data
    if (!entity.character) entity.character = {};
    if (!entity.character.feats) entity.character.feats = [];
    
    entity.character.feats.push({
      id: this.id,
      name: this.name,
      options: { penalty: attackPenalty }
    });
    
    // Apply the attack penalty
    bonus.addBonus(
      entity, 
      'melee_attack', 
      -attackPenalty,
      'untyped',
      'Power Attack'
    );
    
    // Apply the damage bonus
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
  }
};