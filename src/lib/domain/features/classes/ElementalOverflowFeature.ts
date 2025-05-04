import type { Entity } from '../../types/EntityTypes';
import type { Feature } from '../../types/FeatureTypes';
import type { BonusSubsystem, Subsystem } from '../../types/SubsystemTypes';

/**
 * Elemental Overflow feature implementation following Unix philosophy.
 * This feature focuses on providing bonuses based on burn points.
 */
export const ElementalOverflowFeature: Feature = {
  id: 'class.elemental_overflow',
  name: 'Elemental Overflow',
  requiredSubsystems: ['bonus'],
  description: 'At 3rd level, a kineticist's body surges with energy from her chosen element when she accepts burn, causing her to glow with a nimbus of fire, weep water from her pores, or experience some other sign of her elemental power.',
  category: 'class',
  
  apply(entity: Entity, options: { element?: string, classLevel?: number } = {}, subsystems: { bonus: BonusSubsystem }) {
    const { bonus } = subsystems;
    const element = options.element || this.getElementFromEntity(entity);
    const classLevel = options.classLevel || 3;
    
    // Add class feature to character data
    if (!entity.character) entity.character = {};
    if (!entity.character.classFeatures) entity.character.classFeatures = [];
    
    // Define the overflow bonus table
    const overflowBonuses = [
      { burnThreshold: 1, attackBonus: 1, damageBonus: 0, abilityBonus: 0 },  // 1-2 burn
      { burnThreshold: 3, attackBonus: 2, damageBonus: 2, abilityBonus: 2 },  // 3-4 burn
      { burnThreshold: 5, attackBonus: 3, damageBonus: 3, abilityBonus: 4 },  // 5+ burn
    ];
    
    // Calculate ability score bonuses based on element
    const abilityScores = this.getElementalAbilityScores(element);
    
    entity.character.classFeatures.push({
      id: this.id,
      name: this.name,
      options: { 
        element, 
        classLevel,
        overflowBonuses,
        abilityScores
      }
    });
    
    // Create a dynamic handler for burn changes
    // This is a simplified implementation - in a full version, this would 
    // subscribe to burn changes and adjust bonuses accordingly
    entity.handlers = entity.handlers || {};
    entity.handlers.burnChanged = (burnAmount: number) => {
      // Remove any existing overflow bonuses
      bonus.removeBonusesBySource(entity, 'Elemental Overflow');
      
      // Determine which tier of bonuses to apply
      let tier = -1;
      for (let i = overflowBonuses.length - 1; i >= 0; i--) {
        if (burnAmount >= overflowBonuses[i].burnThreshold) {
          tier = i;
          break;
        }
      }
      
      if (tier >= 0) {
        const tierBonus = overflowBonuses[tier];
        
        // Apply attack bonus to element-based blasts
        bonus.addBonus(
          entity,
          `attack_${element}_blast`,
          tierBonus.attackBonus,
          'untyped',
          'Elemental Overflow'
        );
        
        // Apply damage bonus if class level is high enough
        if (classLevel >= 5 && tierBonus.damageBonus > 0) {
          bonus.addBonus(
            entity,
            `damage_${element}_blast`,
            tierBonus.damageBonus,
            'untyped',
            'Elemental Overflow'
          );
        }
        
        // Apply ability score bonuses if class level is high enough
        if (classLevel >= 11 && tierBonus.abilityBonus > 0) {
          abilityScores.forEach(ability => {
            bonus.addBonus(
              entity,
              `ability.${ability}`,
              tierBonus.abilityBonus,
              'enhancement',
              'Elemental Overflow'
            );
          });
        }
      }
    };
    
    // Apply initial bonuses based on current burn
    const currentBurn = entity.character.resources?.burn?.current || 0;
    if (entity.handlers.burnChanged) {
      entity.handlers.burnChanged(currentBurn);
    }
    
    return {
      success: true,
      element,
      abilityScores
    };
  },
  
  canApply(entity: Entity, subsystems: Record<string, Subsystem>) {
    // Check if character already has this class feature
    if (entity.character?.classFeatures?.some(feature => feature.id === this.id)) {
      return { valid: false, reason: "Already has Elemental Overflow feature" };
    }
    
    // Check for the required Burn feature
    const hasBurn = entity.character?.classFeatures?.some(feature => 
      feature.id === 'class.burn'
    );
    
    if (!hasBurn) {
      return { valid: false, reason: "Requires Burn class feature" };
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
  },
  
  // Helper to determine ability scores based on element
  getElementalAbilityScores(element: string): string[] {
    switch(element) {
      case 'air':
        return ['dexterity', 'constitution'];
      case 'earth':
        return ['strength', 'constitution'];
      case 'fire':
        return ['dexterity', 'charisma'];
      case 'water':
        return ['constitution', 'wisdom'];
      default:
        return ['constitution', 'charisma'];
    }
  }
};

export default ElementalOverflowFeature;