import type { Entity } from '../../types/EntityTypes';
import type { Feature } from '../../types/FeatureTypes';
import type { BonusSubsystem, Subsystem } from '../../types/SubsystemTypes';

export const KineticBlastFeature: Feature = {
  id: 'class.kinetic_blast',
  name: 'Kinetic Blast',
  requiredSubsystems: ['bonus', 'combat'],
  description: 'You can unleash an energy attack at will as a standard action. This blast is a spell-like ability that allows you to fire a blast of energy as a ranged attack, dealing damage based on your element.',
  category: 'class',
  
  apply(entity: Entity, options: { element?: string, level?: number } = {}, subsystems: { bonus: BonusSubsystem }) {
    const { bonus } = subsystems;
    const element = options.element || 'fire';
    const level = options.level || 1;
    
    // Calculate damage based on level
    const damageDice = Math.floor((level + 1) / 2) + 'd6';
    
    // Add class feature
    if (!entity.character) entity.character = {};
    if (!entity.character.classFeatures) entity.character.classFeatures = [];
    
    entity.character.classFeatures.push({
      id: this.id,
      name: this.name,
      options: { element, level }
    });
    
    // Add kinetic blast attack
    if (!entity.character.attacks) entity.character.attacks = [];
    
    entity.character.attacks.push({
      id: `kinetic_blast_${element}`,
      name: `${element.charAt(0).toUpperCase() + element.slice(1)} Kinetic Blast`,
      type: 'ranged',
      damage: damageDice,
      range: 30,
      damageType: element
    });
    
    return {
      success: true,
      element,
      level,
      damageDice
    };
  },
  
  canApply(entity: Entity, subsystems: Record<string, Subsystem>) {
    // Check if character already has this class feature with the same element
    const { element } = entity.options || {};
    
    if (entity.character?.classFeatures?.some(
      c => c.id === this.id && c.options?.element === element
    )) {
      return { valid: false, reason: `Already has ${element} Kinetic Blast` };
    }
    
    return { valid: true };
  }
};