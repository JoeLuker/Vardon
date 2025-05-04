import type { Entity } from '../../types/EntityTypes';
import type { Feature } from '../../types/FeatureTypes';
import type { Subsystem } from '../../types/SubsystemTypes';

export const BurnFeature: Feature = {
  id: 'class.burn',
  name: 'Burn',
  requiredSubsystems: [],
  description: 'A kineticist can overexert herself to channel more power than normal, pushing past the normal limits of her body and mind, but quickly burning out.',
  category: 'class',
  
  apply(entity: Entity, options: { classLevel?: number } = {}, subsystems = {}) {
    const classLevel = options.classLevel || 1;
    
    // Calculate max burn based on level
    const maxBurn = Math.floor(classLevel / 2) + 3;
    
    // Add class feature
    if (!entity.character) entity.character = {};
    if (!entity.character.classFeatures) entity.character.classFeatures = [];
    
    entity.character.classFeatures.push({
      id: this.id,
      name: this.name,
      options: { classLevel, maxBurn }
    });
    
    // Add burn tracking
    if (!entity.character.resources) entity.character.resources = {};
    
    entity.character.resources.burn = {
      current: 0,
      max: maxBurn,
      name: 'Burn',
      recoversAt: 'daily'
    };
    
    return {
      success: true,
      classLevel,
      maxBurn
    };
  },
  
  canApply(entity: Entity, subsystems: Record<string, Subsystem>) {
    // Check if character already has this class feature
    if (entity.character?.classFeatures?.some(feature => feature.id === this.id)) {
      return { valid: false, reason: "Already has Burn feature" };
    }
    
    return { valid: true };
  }
};