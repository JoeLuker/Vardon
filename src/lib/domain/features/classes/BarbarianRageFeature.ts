import type { Entity } from '../../types/EntityTypes';
import type { Feature } from '../../types/FeatureTypes';
import type { BonusSubsystem, AbilitySubsystem } from '../../types/SubsystemTypes';

export const BarbarianRageFeature: Feature = {
  id: 'class.barbarian.rage',
  name: 'Barbarian Rage',
  requiredSubsystems: ['bonus', 'ability'],
  persistent: true,
  description: 'A barbarian can call upon inner reserves of strength and ferocity, granting additional combat prowess.',
  category: 'class',
  
  apply(
    entity: Entity, 
    options: { rounds?: number }, 
    subsystems: { 
      bonus: BonusSubsystem, 
      ability: AbilitySubsystem 
    }
  ) {
    const { bonus, ability } = subsystems;
    const { rounds = 0 } = options;
    
    // Calculate bonus values
    const strengthBonus = 4;
    const constitutionBonus = 4;
    const willBonus = 2;
    const acPenalty = -2;
    
    // Store rage state
    if (!entity.character) entity.character = {};
    if (!entity.character.resources) entity.character.resources = {};
    
    // Calculate available rounds (real implementation would consider Constitution)
    const barbarianLevel = entity.character?.classes?.find(c => c.id === 'barbarian')?.level || 0;
    const maxRounds = barbarianLevel + ability.getAbilityModifier(entity, 'constitution');
    
    entity.character.resources['rage'] = {
      max: maxRounds,
      current: Math.max(0, maxRounds - (rounds || 0)),
      rechargeCondition: 'long rest'
    };
    
    // Apply rage bonuses
    bonus.addBonus(entity, 'ability_strength', strengthBonus, 'morale', 'Rage');
    bonus.addBonus(entity, 'ability_constitution', constitutionBonus, 'morale', 'Rage');
    bonus.addBonus(entity, 'save_will', willBonus, 'morale', 'Rage');
    bonus.addBonus(entity, 'armor_class', acPenalty, 'untyped', 'Rage');
    
    // Track that rage is active
    if (!entity.character.conditions) entity.character.conditions = [];
    entity.character.conditions.push('rage');
    
    // Emit an event (would be handled through EventBus)
    // This would allow Power Attack to detect rage and increase damage
    
    return {
      success: true,
      strengthBonus,
      constitutionBonus,
      willBonus,
      acPenalty,
      remainingRounds: entity.character.resources['rage'].current
    };
  },
  
  unapply(
    entity: Entity, 
    options: {}, 
    subsystems: { 
      bonus: BonusSubsystem 
    }
  ) {
    const { bonus } = subsystems;
    
    // Remove rage bonuses
    bonus.removeBonus(entity, 'ability_strength', 'Rage');
    bonus.removeBonus(entity, 'ability_constitution', 'Rage');
    bonus.removeBonus(entity, 'save_will', 'Rage');
    bonus.removeBonus(entity, 'armor_class', 'Rage');
    
    // Remove rage condition
    if (entity.character?.conditions) {
      entity.character.conditions = entity.character.conditions.filter(c => c !== 'rage');
    }
    
    // Add fatigue condition
    if (!entity.character) entity.character = {};
    if (!entity.character.conditions) entity.character.conditions = [];
    entity.character.conditions.push('fatigued');
    
    return {
      success: true,
      fatiguedApplied: true
    };
  }
};
