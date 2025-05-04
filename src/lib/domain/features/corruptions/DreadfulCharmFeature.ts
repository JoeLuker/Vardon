import type { Entity } from '../../types/EntityTypes';
import type { Feature } from '../../types/FeatureTypes';
import type { Subsystem } from '../../types/SubsystemTypes';

export const DreadfulCharmFeature: Feature = {
  id: 'corruption.dreadful_charm',
  name: 'Dreadful Charm',
  requiredSubsystems: [],
  description: 'Your powers of persuasion allow you to compel the weak.',
  prerequisites: ['corruption.allure'],
  category: 'corruption',
  
  apply(entity: Entity, options: { manifestationLevel?: number } = {}, subsystems = {}) {
    const manifestationLevel = options.manifestationLevel || 2;
    
    // Add charm ability
    if (!entity.character) entity.character = {};
    if (!entity.character.spellLikeAbilities) entity.character.spellLikeAbilities = [];
    
    entity.character.spellLikeAbilities.push({
      id: 'dreadful_charm',
      name: 'Dreadful Charm',
      description: 'Once per day when you succeed at a Bluff, Diplomacy, or Intimidate check against a creature, you can charm that creature as if using charm monster.',
      spellLevel: 4,
      usesPerDay: 1,
      casterLevel: manifestationLevel,
      saveDC: 14 + Math.floor(manifestationLevel / 2),
      source: this.id
    });
    
    // Store the corruption manifestation in character data
    if (!entity.character.corruptions) entity.character.corruptions = [];
    
    entity.character.corruptions.push({
      id: this.id,
      name: this.name,
      options: { manifestationLevel }
    });
    
    // Apply stain effects
    if (!entity.character.conditions) entity.character.conditions = [];
    
    // No shadow
    entity.character.conditions.push({
      id: 'no_shadow',
      name: 'No Shadow',
      source: this.id
    });
    
    // Garlic vulnerability
    entity.character.conditions.push({
      id: 'garlic_vulnerability',
      name: 'Garlic Vulnerability',
      description: 'When in an area that smells strongly of garlic, you must succeed at a DC 20 Fortitude save or be sickened for 1d4 minutes.',
      source: this.id
    });
    
    return {
      success: true,
      manifestationLevel
    };
  },
  
  canApply(entity: Entity, subsystems: Record<string, Subsystem>) {
    // Check if character already has this manifestation
    if (entity.character?.corruptions?.some(c => c.id === this.id)) {
      return { valid: false, reason: "Already has Dreadful Charm manifestation" };
    }
    
    // Check for prerequisite
    const hasAllure = entity.character?.corruptions?.some(c => c.id === 'corruption.allure');
    if (!hasAllure) {
      return { valid: false, reason: "Requires Allure manifestation" };
    }
    
    // Check minimum manifestation level (should be 2+)
    const manifestationLevel = entity.options?.manifestationLevel || 0;
    if (manifestationLevel < 2) {
      return { valid: false, reason: "Requires manifestation level 2+" };
    }
    
    return { valid: true };
  }
};