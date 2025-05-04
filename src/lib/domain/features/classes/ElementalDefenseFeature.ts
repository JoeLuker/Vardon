import type { Entity } from '../../types/EntityTypes';
import type { Feature } from '../../types/FeatureTypes';
import type { BonusSubsystem, Subsystem } from '../../types/SubsystemTypes';

/**
 * Elemental Defense feature implementation following Unix philosophy.
 * This feature focuses on providing defense based on the kineticist's chosen element.
 */
export const ElementalDefenseFeature: Feature = {
  id: 'class.elemental_defense',
  name: 'Elemental Defense',
  requiredSubsystems: ['bonus'],
  description: 'At 2nd level, a kineticist gains a defense based on her primary element.',
  category: 'class',
  
  apply(entity: Entity, options: { element?: string, classLevel?: number } = {}, subsystems: { bonus: BonusSubsystem }) {
    const { bonus } = subsystems;
    const element = options.element || this.getElementFromEntity(entity);
    const classLevel = options.classLevel || 2;
    
    // Add class feature to character data
    if (!entity.character) entity.character = {};
    if (!entity.character.classFeatures) entity.character.classFeatures = [];
    
    // Determine defense type and bonuses based on element
    let defenseName = '';
    let defenseDescription = '';
    
    switch(element) {
      case 'air':
        defenseName = 'Elemental Defense (Air Shield)';
        defenseDescription = 'You surround yourself with an envelope of air, granting a +2 dodge bonus to AC against ranged attacks.';
        
        // Apply dodge bonus to AC against ranged attacks
        bonus.addBonus(
          entity,
          'ranged_ac',
          2,
          'dodge',
          'Air Shield'
        );
        break;
        
      case 'earth':
        defenseName = 'Elemental Defense (Flesh of Stone)';
        defenseDescription = 'Your skin hardens like stone, granting DR 1/adamantine.';
        
        // Apply damage reduction
        if (!entity.character.damageReduction) entity.character.damageReduction = [];
        entity.character.damageReduction.push({
          amount: Math.min(Math.floor(classLevel / 2), 5), // Max DR 5/adamantine at level 10
          bypassedBy: 'adamantine',
          source: this.id
        });
        break;
        
      case 'fire':
        defenseName = 'Elemental Defense (Flame Shield)';
        defenseDescription = 'You surround yourself with a veil of heat that damages those who attack you in melee.';
        
        // Apply fire shield effect
        if (!entity.character.auras) entity.character.auras = [];
        entity.character.auras.push({
          name: 'Flame Shield',
          type: 'fire',
          radius: 0, // Self-only
          damage: `${Math.floor((classLevel + 1) / 3)}d6`, // 1d6 at level 2, scales up
          effect: 'Deals fire damage to melee attackers',
          source: this.id
        });
        break;
        
      case 'water':
        defenseName = 'Elemental Defense (Shroud of Water)';
        defenseDescription = 'You surround yourself with a cushioning shroud of water, granting a 10% chance to negate critical hits and sneak attacks.';
        
        // Apply fortification effect
        bonus.addBonus(
          entity,
          'fortification',
          10 + Math.floor(classLevel / 2) * 5, // 10% at level 2, up to 40% at level 12
          'natural',
          'Shroud of Water'
        );
        break;
        
      default:
        defenseName = 'Elemental Defense';
        defenseDescription = 'You gain a defensive ability based on your chosen element.';
    }
    
    entity.character.classFeatures.push({
      id: this.id,
      name: defenseName,
      description: defenseDescription,
      options: { element, classLevel }
    });
    
    return {
      success: true,
      element,
      defenseName
    };
  },
  
  canApply(entity: Entity, subsystems: Record<string, Subsystem>) {
    // Check if character already has this class feature
    if (entity.character?.classFeatures?.some(feature => feature.id === this.id)) {
      return { valid: false, reason: "Already has Elemental Defense feature" };
    }
    
    // Check for the required Elemental Focus feature
    const hasElementalFocus = entity.character?.classFeatures?.some(feature => 
      feature.id === 'class.elemental_focus'
    );
    
    if (!hasElementalFocus) {
      return { valid: false, reason: "Requires Elemental Focus class feature" };
    }
    
    return { valid: true };
  },
  
  // Helper to determine element from entity if not provided in options
  getElementFromEntity(entity: Entity): string {
    // Check if the entity has the Elemental Focus feature with an element
    const elementalFocus = entity.character?.classFeatures?.find(feature => 
      feature.id === 'class.elemental_focus'
    );
    
    if (elementalFocus?.options?.element) {
      return elementalFocus.options.element;
    }
    
    // Try to get element from character's elements list
    if (entity.character?.elements?.length > 0) {
      return entity.character.elements[0];
    }
    
    // Default to fire if no element found
    return 'fire';
  }
};

export default ElementalDefenseFeature;