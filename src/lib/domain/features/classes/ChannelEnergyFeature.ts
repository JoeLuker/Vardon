import type { Entity } from '../../types/EntityTypes';
import type { Feature } from '../../types/FeatureTypes';
import type { AbilitySubsystem, BonusSubsystem } from '../../types/SubsystemTypes';

export const ChannelEnergyFeature: Feature = {
  id: 'class.cleric.channel_energy',
  name: 'Channel Energy',
  requiredSubsystems: ['ability', 'bonus'],
  persistent: false,
  description: 'A cleric can release a wave of energy by channeling the power of their faith through their holy symbol.',
  category: 'class',
  
  apply(
    entity: Entity,
    options: { 
      type: 'positive' | 'negative', 
      healUndead?: boolean 
    },
    subsystems: {
      ability: AbilitySubsystem,
      bonus: BonusSubsystem
    }
  ) {
    const { type, healUndead = false } = options;
    const { ability } = subsystems;
    
    // Track usage
    if (!entity.character) entity.character = {};
    if (!entity.character.resources) entity.character.resources = {};
    
    const clericLevel = entity.character?.classes?.find(c => c.id === 'cleric')?.level || 0;
    const chaModifier = ability.getAbilityModifier(entity, 'charisma');
    
    // Calculate uses per day (3 + Cha modifier)
    const maxUses = 3 + chaModifier;
    
    // Make sure we have a channel energy resource
    if (!entity.character.resources['channel_energy']) {
      entity.character.resources['channel_energy'] = {
        max: maxUses,
        current: maxUses,
        rechargeCondition: 'long rest'
      };
    }
    
    // Check if we have uses remaining
    if (entity.character.resources['channel_energy'].current <= 0) {
      return {
        success: false,
        error: 'No channel energy uses remaining'
      };
    }
    
    // Calculate channel energy damage/healing
    // Cleric level 1-2: 1d6, 3-4: 2d6, 5-6: 3d6, etc.
    const diceCount = Math.ceil(clericLevel / 2);
    const energyAmount = `${diceCount}d6`;
    
    // Use a channel energy
    entity.character.resources['channel_energy'].current--;
    
    // Apply channel energy effects
    // In a real implementation, this would apply the healing/damage to targets
    
    return {
      success: true,
      energyType: type,
      healUndead,
      amount: energyAmount,
      remainingUses: entity.character.resources['channel_energy'].current,
      dcToHalve: 10 + Math.floor(clericLevel/2) + chaModifier
    };
  }
};
