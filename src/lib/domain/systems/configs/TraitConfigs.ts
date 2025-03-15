import type { TraitEffectDefinition } from '../TraitSystem';

/**
 * Configuration for trait effects
 * Maps trait name (lowercase) to its effect definitions
 */
export const traitEffectDefinitions: Record<string, TraitEffectDefinition[]> = {
  'pragmatic_activator': [
    {
      effectType: 'override',
      target: 'use_magic_device_ability',
      type: 'override',
      value: 'intelligence',
      priority: 50
    }
  ],
  
  'clever_wordplay': [
    {
      effectType: 'override',
      target: 'diplomacy_ability',
      type: 'override',
      value: 'intelligence',
      priority: 50
    }
  ],
  
  'reactionary': [
    {
      effectType: 'numeric',
      target: 'initiative',
      type: 'trait',
      value: 2,
      priority: 20
    }
  ],
  
  'ambitious': [
    {
      effectType: 'numeric',
      target: 'profession',
      type: 'trait',
      value: 1,
      priority: 20
    },
    {
      effectType: 'numeric',
      target: 'diplomacy',
      type: 'trait',
      value: 1,
      priority: 20
    }
  ]
  
  // Add more traits here
}; 