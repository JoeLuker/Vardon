import type { Entity } from '../../types/EntityTypes';
import type { Feature } from '../../types/FeatureTypes';
import type { Subsystem } from '../../types/SubsystemTypes';

export const GreaterUnlifeFeature: Feature = {
  id: 'corruption.greater_unlife',
  name: 'Greater Unlife',
  requiredSubsystems: [],
  description: 'You can recover from nearly any wound, gaining improved fast healing and immunity to various forms of harm.',
  prerequisites: ['corruption.unlife'],
  category: 'corruption',
  
  apply(entity: Entity, options: { manifestationLevel?: number } = {}, subsystems = {}) {
    const manifestationLevel = options.manifestationLevel || 4;
    
    // Calculate uses per day (same as Unlife)
    const usesPerDay = Math.floor(manifestationLevel / 2);
    
    // Add fast healing ability (upgrade from 1 to 3)
    if (!entity.character) entity.character = {};
    if (!entity.character.specialAbilities) entity.character.specialAbilities = [];
    
    // Remove the basic fast healing if it exists
    entity.character.specialAbilities = entity.character.specialAbilities.filter(
      ability => !(ability.id === 'fast_healing' && ability.source === 'corruption.unlife')
    );
    
    // Add enhanced fast healing
    entity.character.specialAbilities.push({
      id: 'greater_fast_healing',
      name: 'Greater Fast Healing',
      description: 'As a standard action, you can grant yourself fast healing 3 for 1 minute. While active, you are immune to nonlethal damage, ability damage, and ability drain.',
      usesPerDay: usesPerDay,
      healingRate: 3,
      source: this.id
    });
    
    // Store the corruption manifestation in character data
    if (!entity.character.corruptions) entity.character.corruptions = [];
    
    entity.character.corruptions.push({
      id: this.id,
      name: this.name,
      options: { manifestationLevel }
    });
    
    // Apply stain effect (staggered in sunlight)
    if (!entity.character.conditions) entity.character.conditions = [];
    
    // Remove the basic sunlight vulnerability if it exists
    entity.character.conditions = entity.character.conditions.filter(
      condition => !(condition.id === 'sunlight_vulnerability' && condition.source === 'corruption.unlife')
    );
    
    // Add enhanced vulnerability
    entity.character.conditions.push({
      id: 'sunlight_vulnerability_severe',
      name: 'Sunlight Vulnerability (Staggered)',
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
      return { valid: false, reason: "Already has Greater Unlife manifestation" };
    }
    
    // Check for prerequisite
    const hasUnlife = entity.character?.corruptions?.some(c => c.id === 'corruption.unlife');
    if (!hasUnlife) {
      return { valid: false, reason: "Requires Unlife manifestation" };
    }
    
    // Check minimum manifestation level (should be 4+)
    const manifestationLevel = entity.options?.manifestationLevel || 0;
    if (manifestationLevel < 4) {
      return { valid: false, reason: "Requires manifestation level 4+" };
    }
    
    return { valid: true };
  }
};