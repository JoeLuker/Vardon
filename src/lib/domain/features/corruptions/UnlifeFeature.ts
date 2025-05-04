import type { Entity } from '../../types/EntityTypes';
import type { Feature } from '../../types/FeatureTypes';
import type { Subsystem } from '../../types/SubsystemTypes';

export const UnlifeFeature: Feature = {
  id: 'corruption.unlife',
  name: 'Unlife',
  requiredSubsystems: [],
  description: 'You heal at a phenomenal rate, gaining fast healing but becoming vulnerable to sunlight.',
  category: 'corruption',
  
  apply(entity: Entity, options: { manifestationLevel?: number } = {}, subsystems = {}) {
    const manifestationLevel = options.manifestationLevel || 3;
    
    // Calculate uses per day
    const usesPerDay = Math.floor(manifestationLevel / 2);
    
    // Add fast healing ability
    if (!entity.character) entity.character = {};
    if (!entity.character.specialAbilities) entity.character.specialAbilities = [];
    
    entity.character.specialAbilities.push({
      id: 'fast_healing',
      name: 'Fast Healing',
      description: 'As a standard action, you can grant yourself fast healing 1 for 1 minute.',
      usesPerDay: usesPerDay,
      healingRate: 1,
      source: this.id
    });
    
    // Store the corruption manifestation in character data
    if (!entity.character.corruptions) entity.character.corruptions = [];
    
    entity.character.corruptions.push({
      id: this.id,
      name: this.name,
      options: { manifestationLevel }
    });
    
    // Apply stain effect (shaken in sunlight)
    if (!entity.character.conditions) entity.character.conditions = [];
    entity.character.conditions.push({
      id: 'sunlight_vulnerability',
      name: 'Sunlight Vulnerability (Shaken)',
      source: this.id
    });
    
    return {
      success: true,
      manifestationLevel,
      usesPerDay
    };
  },
  
  canApply(entity: Entity, subsystems: Record<string, Subsystem>) {
    // Check if character already has this manifestation
    if (entity.character?.corruptions?.some(c => c.id === this.id)) {
      return { valid: false, reason: "Already has Unlife manifestation" };
    }
    
    // Check minimum manifestation level (should be 3+)
    const manifestationLevel = entity.options?.manifestationLevel || 0;
    if (manifestationLevel < 3) {
      return { valid: false, reason: "Requires manifestation level 3+" };
    }
    
    return { valid: true };
  }
};