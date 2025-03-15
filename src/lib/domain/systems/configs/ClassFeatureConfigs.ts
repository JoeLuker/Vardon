import type { ClassFeatureEffectDefinition } from '../ClassFeatureSystem';

/**
 * Configuration for class feature effects
 * Maps class feature name (lowercase) to its effect definitions
 */
export const classFeatureEffectDefinitions: Record<string, ClassFeatureEffectDefinition[]> = {
  'weapon_and_armor_proficiency_fighter': [
    {
      effectType: 'boolean',
      target: 'proficiency.simple_weapons',
      type: 'class_feature',
      value: true,
      priority: 30
    },
    {
      effectType: 'boolean',
      target: 'proficiency.martial_weapons',
      type: 'class_feature',
      value: true,
      priority: 30
    },
    {
      effectType: 'boolean',
      target: 'proficiency.light_armor',
      type: 'class_feature',
      value: true,
      priority: 30
    },
    {
      effectType: 'boolean',
      target: 'proficiency.medium_armor',
      type: 'class_feature',
      value: true,
      priority: 30
    },
    {
      effectType: 'boolean',
      target: 'proficiency.heavy_armor',
      type: 'class_feature',
      value: true,
      priority: 30
    },
    {
      effectType: 'boolean',
      target: 'proficiency.shields',
      type: 'class_feature',
      value: true,
      priority: 30
    }
  ],
  
  'weapon_and_armor_proficiency_rogue': [
    {
      effectType: 'boolean',
      target: 'proficiency.simple_weapons',
      type: 'class_feature',
      value: true,
      priority: 30
    },
    {
      effectType: 'boolean',
      target: 'proficiency.light_armor',
      type: 'class_feature',
      value: true,
      priority: 30
    },
    {
      effectType: 'boolean',
      target: 'proficiency.hand_crossbow',
      type: 'class_feature',
      value: true,
      priority: 30
    },
    {
      effectType: 'boolean',
      target: 'proficiency.rapier',
      type: 'class_feature',
      value: true,
      priority: 30
    },
    {
      effectType: 'boolean',
      target: 'proficiency.sap',
      type: 'class_feature',
      value: true,
      priority: 30
    },
    {
      effectType: 'boolean',
      target: 'proficiency.shortbow',
      type: 'class_feature',
      value: true,
      priority: 30
    },
    {
      effectType: 'boolean',
      target: 'proficiency.shortsword',
      type: 'class_feature',
      value: true,
      priority: 30
    }
  ],
  
  'sneak_attack': [
    {
      effectType: 'numeric',
      target: 'sneak_attack_dice',
      type: 'class_feature',
      value: 1, // Will be multiplied by the number of rogue levels
      priority: 30
    }
  ],
  
  'rage': [
    // Active ability, will need special handling
    {
      effectType: 'boolean',
      target: 'can_rage',
      type: 'class_feature',
      value: true,
      priority: 30
    }
  ],
  
  'rage_powers': [
    // Placeholder for rage powers
    {
      effectType: 'boolean',
      target: 'has_rage_powers',
      type: 'class_feature',
      value: true,
      priority: 30
    }
  ],
  
  'trapfinding': [
    {
      effectType: 'numeric',
      target: 'perception',
      type: 'class_feature',
      value: 1,
      priority: 30,
      condition: 'find_traps'
    },
    {
      effectType: 'numeric',
      target: 'disable_device',
      type: 'class_feature',
      value: 1,
      priority: 30,
      condition: 'disable_traps'
    }
  ],
  
  'evasion': [
    {
      effectType: 'boolean',
      target: 'has_evasion',
      type: 'class_feature',
      value: true,
      priority: 30
    }
  ],
  
  'uncanny_dodge': [
    {
      effectType: 'boolean',
      target: 'cannot_be_flanked',
      type: 'class_feature',
      value: true,
      priority: 30
    }
  ],
  
  'danger_sense': [
    {
      effectType: 'numeric',
      target: 'save_reflex',
      type: 'class_feature',
      value: 1, // +1 per 4 levels
      priority: 30,
      condition: 'against_traps'
    }
  ]
  
  // Many more class features would be defined here
}; 