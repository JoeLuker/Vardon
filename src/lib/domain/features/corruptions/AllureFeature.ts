import type { Entity } from '../../types/EntityTypes';
import type { Feature } from '../../types/FeatureTypes';
import type { BonusSubsystem, Subsystem } from '../../types/SubsystemTypes';

export const AllureFeature: Feature = {
  id: 'corruption.allure',
  name: 'Allure',
  requiredSubsystems: ['bonus'],
  description: 'You can influence others subtly, but lose your reflection.',
  category: 'corruption',
  
  apply(entity: Entity, options: { manifestationLevel?: number } = {}, subsystems: { bonus: BonusSubsystem }) {
    const { bonus } = subsystems;
    const manifestationLevel = options.manifestationLevel || 1;
    
    // Apply the social skill bonuses
    const bonusValue = manifestationLevel >= 3 ? 4 : 2;
    
    bonus.addBonus(entity, 'skill_bluff', bonusValue, 'racial', 'Allure');
    bonus.addBonus(entity, 'skill_diplomacy', bonusValue, 'racial', 'Allure');
    bonus.addBonus(entity, 'skill_intimidate', bonusValue, 'racial', 'Allure');
    
    // Store the corruption manifestation in character data
    if (!entity.character) entity.character = {};
    if (!entity.character.corruptions) entity.character.corruptions = [];
    
    entity.character.corruptions.push({
      id: this.id,
      name: this.name,
      options: { manifestationLevel }
    });
    
    // Apply stain effect (no reflection) - no mechanical effect, but could be tracked
    if (!entity.character.conditions) entity.character.conditions = [];
    entity.character.conditions.push({
      id: 'no_reflection',
      name: 'No Reflection',
      source: this.id
    });
    
    return {
      success: true,
      manifestationLevel,
      bonusApplied: bonusValue
    };
  },
  
  canApply(entity: Entity, subsystems: Record<string, Subsystem>) {
    // Check if character already has this manifestation
    if (entity.character?.corruptions?.some(c => c.id === this.id)) {
      return { valid: false, reason: "Already has Allure manifestation" };
    }
    
    return { valid: true };
  }
};