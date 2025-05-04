import type { Entity } from '../../types/EntityTypes';
import type { Feature } from '../../types/FeatureTypes';
import type { BonusSubsystem, Subsystem } from '../../types/SubsystemTypes';

export const ElementalFocusFeature: Feature = {
  id: 'class.elemental_focus',
  name: 'Elemental Focus',
  requiredSubsystems: ['bonus'],
  description: 'At 1st level, a kineticist chooses one primary element from among air, earth, fire, and water. This element determines which blast type the kineticist can use, and grants additional class skills and abilities.',
  category: 'class',
  
  apply(entity: Entity, options: { element?: string } = {}, subsystems: { bonus: BonusSubsystem }) {
    const { bonus } = subsystems;
    const element = options.element || 'fire';
    
    // Add class feature to character data
    if (!entity.character) entity.character = {};
    if (!entity.character.classFeatures) entity.character.classFeatures = [];
    
    entity.character.classFeatures.push({
      id: this.id,
      name: this.name,
      options: { element }
    });
    
    // Add bonus to relevant skill based on element
    let skillToBoost = '';
    
    switch(element) {
      case 'air':
        skillToBoost = 'skill_fly';
        break;
      case 'earth':
        skillToBoost = 'skill_climb';
        break;
      case 'fire':
        skillToBoost = 'skill_acrobatics';
        break;
      case 'water':
        skillToBoost = 'skill_swim';
        break;
      default:
        skillToBoost = 'skill_knowledge_planes';
    }
    
    if (skillToBoost) {
      bonus.addBonus(
        entity,
        skillToBoost,
        2,
        'competence',
        'Elemental Focus'
      );
    }
    
    // Store the element in character's data for other features to access
    if (!entity.character.elements) entity.character.elements = [];
    entity.character.elements.push(element);
    
    return {
      success: true,
      element,
      skillBoosted: skillToBoost
    };
  },
  
  canApply(entity: Entity, subsystems: Record<string, Subsystem>) {
    // Check if character already has this class feature
    if (entity.character?.classFeatures?.some(feature => feature.id === this.id)) {
      return { valid: false, reason: "Already has Elemental Focus" };
    }
    
    return { valid: true };
  }
};