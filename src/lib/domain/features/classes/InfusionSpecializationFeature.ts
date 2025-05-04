import type { Entity } from '../../types/EntityTypes';
import type { Feature } from '../../types/FeatureTypes';
import type { Subsystem } from '../../types/SubsystemTypes';

/**
 * Infusion Specialization feature implementation following Unix philosophy.
 * This feature focuses on reducing the burn cost of infusions.
 */
export const InfusionSpecializationFeature: Feature = {
  id: 'class.infusion_specialization',
  name: 'Infusion Specialization',
  requiredSubsystems: [],
  description: 'At 5th level, whenever a kineticist uses one or more infusions with a blast, she reduces the combined burn cost of the infusions by 1 point. This discount increases by 1 at 8th, 11th, 14th, 17th, and 20th levels.',
  category: 'class',
  
  apply(entity: Entity, options: { classLevel?: number } = {}, subsystems = {}) {
    const classLevel = options.classLevel || 5;
    
    // Calculate the burn reduction amount based on class level
    // Base reduction at 5th level is 1, increases by 1 every 3 levels
    const burnReduction = Math.min(
      Math.floor((classLevel - 2) / 3),
      6  // Maximum reduction of 6 at 20th level
    );
    
    // Add class feature to character data
    if (!entity.character) entity.character = {};
    if (!entity.character.classFeatures) entity.character.classFeatures = [];
    
    entity.character.classFeatures.push({
      id: this.id,
      name: this.name,
      options: { 
        classLevel,
        burnReduction 
      }
    });
    
    // Add infusion specialization to character mechanics
    if (!entity.character.mechanics) entity.character.mechanics = {};
    
    entity.character.mechanics.infusionSpecialization = {
      burnReduction,
      source: this.id
    };
    
    return {
      success: true,
      classLevel,
      burnReduction
    };
  },
  
  canApply(entity: Entity, subsystems: Record<string, Subsystem>) {
    // Check if character already has this class feature
    if (entity.character?.classFeatures?.some(feature => feature.id === this.id)) {
      return { valid: false, reason: "Already has Infusion Specialization feature" };
    }
    
    // Check for the required Burn feature
    const hasBurn = entity.character?.classFeatures?.some(feature => 
      feature.id === 'class.burn'
    );
    
    if (!hasBurn) {
      return { valid: false, reason: "Requires Burn class feature" };
    }
    
    return { valid: true };
  }
};

export default InfusionSpecializationFeature;