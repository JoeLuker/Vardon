import type { Entity } from '../../types/EntityTypes';
import type { Feature } from '../../types/FeatureTypes';
import type { Subsystem } from '../../types/SubsystemTypes';

export const TrueUnlifeFeature: Feature = {
  id: 'corruption.true_unlife',
  name: 'True Unlife',
  requiredSubsystems: [],
  description: 'You can cheat death itself, automatically transforming into gaseous form when near death.',
  prerequisites: ['corruption.greater_unlife', 'corruption.unlife'],
  category: 'corruption',
  
  apply(entity: Entity, options: { manifestationLevel?: number } = {}, subsystems = {}) {
    const manifestationLevel = options.manifestationLevel || 5;
    
    // Add true unlife special ability
    if (!entity.character) entity.character = {};
    if (!entity.character.specialAbilities) entity.character.specialAbilities = [];
    
    entity.character.specialAbilities.push({
      id: 'true_unlife',
      name: 'True Unlife',
      description: 'When reduced to fewer than 0 hit points but not slain and you have a use of fast healing remaining, you immediately assume gaseous form, activate your fast healing, and remain conscious.',
      source: this.id
    });
    
    // Store the corruption manifestation in character data
    if (!entity.character.corruptions) entity.character.corruptions = [];
    
    entity.character.corruptions.push({
      id: this.id,
      name: this.name,
      options: { manifestationLevel }
    });
    
    // Apply stain effect (severe vulnerability to sunlight - burst into flames)
    if (!entity.character.conditions) entity.character.conditions = [];
    
    entity.character.conditions.push({
      id: 'sunlight_vulnerability_deadly',
      name: 'Deadly Sunlight Vulnerability (Fire Damage)',
      description: `If you remain in direct sunlight, at the end of your second turn you burst into flame, taking ${manifestationLevel}d6 points of fire damage each round.`,
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
      return { valid: false, reason: "Already has True Unlife manifestation" };
    }
    
    // Check for prerequisites
    const hasGreaterUnlife = entity.character?.corruptions?.some(c => c.id === 'corruption.greater_unlife');
    const hasUnlife = entity.character?.corruptions?.some(c => c.id === 'corruption.unlife');
    
    if (!hasGreaterUnlife || !hasUnlife) {
      return { valid: false, reason: "Requires both Unlife and Greater Unlife manifestations" };
    }
    
    // Check minimum manifestation level (should be 5+)
    const manifestationLevel = entity.options?.manifestationLevel || 0;
    if (manifestationLevel < 5) {
      return { valid: false, reason: "Requires manifestation level 5+" };
    }
    
    return { valid: true };
  }
};