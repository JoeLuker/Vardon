import type { Entity } from '../../types/EntityTypes';
import type { Feature } from '../../types/FeatureTypes';
import type { Subsystem } from '../../types/SubsystemTypes';

/**
 * Metakinesis feature implementation following Unix philosophy.
 * This feature focuses on providing meta-magic like effects for kinetic blasts.
 */
export const MetakinesisFeature: Feature = {
  id: 'class.metakinesis',
  name: 'Metakinesis',
  requiredSubsystems: [],
  description: 'At 5th level, a kineticist can learn to manipulate her kinetic abilities with greater finesse.',
  category: 'class',
  
  apply(entity: Entity, options: { classLevel?: number } = {}, subsystems = {}) {
    const classLevel = options.classLevel || 5;
    
    // Determine available metakinesis options based on class level
    const metakinesisOptions = [];
    
    // Empowered: At 5th level
    if (classLevel >= 5) {
      metakinesisOptions.push({
        name: 'Empowered',
        burnCost: 1,
        effect: 'Increase the damage by 50%',
        description: 'You can spend 1 point of burn to empower a kinetic blast as if using the Empower Spell metamagic feat.'
      });
    }
    
    // Maximized: At 9th level
    if (classLevel >= 9) {
      metakinesisOptions.push({
        name: 'Maximized',
        burnCost: 2,
        effect: 'Maximize the damage',
        description: 'You can spend 2 points of burn to maximize a kinetic blast as if using the Maximize Spell metamagic feat.'
      });
    }
    
    // Quickened: At 13th level
    if (classLevel >= 13) {
      metakinesisOptions.push({
        name: 'Quickened',
        burnCost: 3,
        effect: 'Blast becomes a swift action',
        description: 'You can spend 3 points of burn to quicken a kinetic blast as if using the Quicken Spell metamagic feat.'
      });
    }
    
    // Add class feature to character data
    if (!entity.character) entity.character = {};
    if (!entity.character.classFeatures) entity.character.classFeatures = [];
    
    entity.character.classFeatures.push({
      id: this.id,
      name: this.name,
      options: { 
        classLevel,
        metakinesisOptions 
      }
    });
    
    // Add metakinesis tracking
    if (!entity.character.resources) entity.character.resources = {};
    
    entity.character.resources.metakinesis = {
      current: 'None',
      possibleValues: ['None', ...metakinesisOptions.map(option => option.name)],
      name: 'Metakinesis',
      recoversAt: 'action'
    };
    
    return {
      success: true,
      classLevel,
      metakinesisOptions
    };
  },
  
  canApply(entity: Entity, subsystems: Record<string, Subsystem>) {
    // Check if character already has this class feature
    if (entity.character?.classFeatures?.some(feature => feature.id === this.id)) {
      return { valid: false, reason: "Already has Metakinesis feature" };
    }
    
    // Check for the required Burn and kinetic blast features
    const hasBurn = entity.character?.classFeatures?.some(feature => 
      feature.id === 'class.burn'
    );
    
    const hasKineticBlast = entity.character?.classFeatures?.some(feature => 
      feature.id === 'class.kinetic_blast'
    );
    
    if (!hasBurn) {
      return { valid: false, reason: "Requires Burn class feature" };
    }
    
    if (!hasKineticBlast) {
      return { valid: false, reason: "Requires Kinetic Blast class feature" };
    }
    
    return { valid: true };
  }
};

export default MetakinesisFeature;