import type { Entity } from '../../types/EntityTypes';
import type { Feature } from '../../types/FeatureTypes';
import type { BonusSubsystem } from '../../types/SubsystemTypes';

export const SneakAttackFeature: Feature = {
  id: 'class.rogue.sneak_attack',
  name: 'Sneak Attack',
  requiredSubsystems: ['bonus'],
  description: 'If a rogue catches an opponent unable to defend himself effectively, she can strike a vital spot for extra damage.',
  category: 'class',
  
  apply(entity: Entity, options: { apply?: boolean }, subsystems: { bonus: BonusSubsystem }) {
    const { apply = true } = options;
    const { bonus } = subsystems;
    
    if (!entity.character) entity.character = {};
    
    // Get rogue level
    const rogueLevel = entity.character?.classes?.find(c => c.id === 'rogue')?.level || 0;
    
    // Calculate sneak attack dice (1d6 per 2 rogue levels, minimum 1d6)
    const sneakAttackDice = Math.ceil(rogueLevel / 2);
    
    if (apply) {
      // Apply sneak attack bonus to next attack
      bonus.addBonus(
        entity,
        'damage_next_attack',
        sneakAttackDice,
        'precision',  // Precision damage type doesn't multiply on crits
        'Sneak Attack'
      );
      
      return {
        success: true,
        damageBonus: `${sneakAttackDice}d6`,
        appliedTo: 'next attack'
      };
    } else {
      // Just return the calculation without applying
      return {
        success: true,
        damageBonus: `${sneakAttackDice}d6`,
        appliedTo: null
      };
    }
  }
};
