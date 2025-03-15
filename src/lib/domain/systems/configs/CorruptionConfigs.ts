import type { ManifestationEffectDefinition } from '../CorruptionSystem';

/**
 * Configuration for corruption manifestation effects
 * Maps manifestation name (lowercase) to its effect definitions
 */
export const manifestationEffectDefinitions: Record<string, ManifestationEffectDefinition[]> = {
  'allure': [
    {
      effectType: 'numeric',
      target: 'diplomacy',
      type: 'corruption',
      value: 4,
      priority: 30
    },
    {
      effectType: 'numeric',
      target: 'bluff',
      type: 'corruption',
      value: 4,
      priority: 30
    },
    {
      effectType: 'numeric',
      target: 'intimidate',
      type: 'corruption',
      value: 4,
      priority: 30
    }
  ],

  'vampiric_grace': [
    {
      effectType: 'numeric',
      target: 'dexterity_bonus',
      type: 'enhancement',
      value: 2,
      priority: 30
    },
    {
      effectType: 'numeric',
      target: 'initiative',
      type: 'corruption',
      value: 2,
      priority: 30
    }
  ],

  'children_of_night': [
    {
      effectType: 'boolean',
      target: 'darkvision',
      type: 'corruption',
      value: true,
      priority: 30
    },
    {
      effectType: 'numeric',
      target: 'perception',
      type: 'corruption',
      value: 2,
      priority: 30,
      condition: 'in_darkness'
    }
  ],

  'gaseous_form': [
    {
      effectType: 'boolean',
      target: 'can_use_gaseous_form',
      type: 'corruption',
      value: true,
      priority: 30
    }
  ],

  'might_of_the_grave': [
    {
      effectType: 'numeric',
      target: 'strength_bonus',
      type: 'enhancement', 
      value: 2,
      priority: 30
    },
    {
      effectType: 'numeric',
      target: 'strength_bonus',
      type: 'enhancement',
      value: 4,
      priority: 30,
      condition: 'manifestation_level_2+'
    },
    {
      effectType: 'numeric',
      target: 'constitution_bonus',
      type: 'enhancement',
      value: 2,
      priority: 30,
      condition: 'manifestation_level_3+'
    }
  ],

  'supernatural_resistance': [
    {
      effectType: 'numeric',
      target: 'cold_resistance',
      type: 'corruption',
      value: 5,
      priority: 30
    },
    {
      effectType: 'numeric',
      target: 'electricity_resistance',
      type: 'corruption',
      value: 5,
      priority: 30
    },
    {
      effectType: 'numeric',
      target: 'cold_resistance',
      type: 'corruption',
      value: 10,
      priority: 30,
      condition: 'manifestation_level_2+'
    },
    {
      effectType: 'numeric',
      target: 'electricity_resistance',
      type: 'corruption',
      value: 10,
      priority: 30,
      condition: 'manifestation_level_2+'
    },
    {
      effectType: 'numeric',
      target: 'save_all',
      type: 'resistance',
      value: 2,
      priority: 30,
      condition: 'manifestation_level_3+'
    }
  ]
}; 