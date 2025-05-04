import type { Entity } from '../../types/EntityTypes';
import type { Feature } from '../../types/FeatureTypes';
import type { Subsystem } from '../../types/SubsystemTypes';

/**
 * Gather Power feature implementation following Unix philosophy.
 * This feature focuses on doing one thing well: implementing the Gather Power mechanic.
 */
export const GatherPowerFeature: Feature = {
  id: 'class.gather_power',
  name: 'Gather Power',
  requiredSubsystems: [],
  description: 'By gathering energy for 1 round, a kineticist can reduce the burn cost of a blast by 1 point.',
  category: 'class',
  
  apply(entity: Entity, options: { classLevel?: number } = {}, subsystems = {}) {
    const classLevel = options.classLevel || 1;
    
    // Calculate power levels available
    const powerLevels = [];
    
    // At 1st level: Minor Gather Power (reduce by 1)
    powerLevels.push({
      name: 'Minor',
      actionType: 'move',
      burnReduction: 1,
      description: 'Gathering power for a move action reduces the total burn cost of a blast wild talent by 1 point.'
    });
    
    // At 6th level: Major Gather Power (reduce by 2)
    if (classLevel >= 6) {
      powerLevels.push({
        name: 'Major',
        actionType: 'full-round',
        burnReduction: 2,
        description: 'Gathering power for a full-round action reduces the total burn cost of a blast wild talent by 2 points.'
      });
    }
    
    // At 11th level: Supercharge (reduce by 3)
    if (classLevel >= 11) {
      powerLevels.push({
        name: 'Supercharge',
        actionType: 'full-round',
        burnReduction: 3,
        condition: 'Accept 1 point of burn',
        description: 'By accepting 1 point of burn while gathering power as a full-round action, the kineticist can reduce the total burn cost of a blast wild talent by 3 points instead of 2.'
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
        powerLevels
      }
    });
    
    // Add ability to track current gather power state
    if (!entity.character.resources) entity.character.resources = {};
    
    entity.character.resources.gatherPower = {
      current: 'None',
      possibleValues: ['None', 'Minor', 'Major', 'Supercharge'],
      name: 'Gather Power',
      recoversAt: 'action'
    };
    
    return {
      success: true,
      classLevel,
      powerLevels
    };
  },
  
  canApply(entity: Entity, subsystems: Record<string, Subsystem>) {
    // Check if character already has this class feature
    if (entity.character?.classFeatures?.some(feature => feature.id === this.id)) {
      return { valid: false, reason: "Already has Gather Power feature" };
    }
    
    // Check if has Burn class feature which is a prerequisite
    const hasBurn = entity.character?.classFeatures?.some(feature => 
      feature.id === 'class.burn'
    );
    
    if (!hasBurn) {
      return { valid: false, reason: "Requires Burn class feature" };
    }
    
    return { valid: true };
  }
};

export default GatherPowerFeature;