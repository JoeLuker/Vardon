import type { FeatEffectDefinition } from '../FeatSystem';

/**
 * Configuration for feat effects
 * Maps feat name (lowercase) to its effect definitions
 */
export const featEffectDefinitions: Record<string, FeatEffectDefinition[]> = {
  'dodge': [
    {
      effectType: 'numeric',
      target: 'ac',
      type: 'dodge',
      value: 1,
      priority: 20
    }
  ],
  
  'generally_educated': [
    // Knowledge skills bonus
    {
      effectType: 'numeric',
      target: 'knowledge_arcana',
      type: 'feat',
      value: 2,
      priority: 20
    },
    {
      effectType: 'numeric',
      target: 'knowledge_dungeoneering',
      type: 'feat',
      value: 2,
      priority: 20
    },
    {
      effectType: 'numeric',
      target: 'knowledge_engineering',
      type: 'feat',
      value: 2,
      priority: 20
    },
    {
      effectType: 'numeric',
      target: 'knowledge_geography',
      type: 'feat',
      value: 2,
      priority: 20
    },
    {
      effectType: 'numeric',
      target: 'knowledge_history',
      type: 'feat',
      value: 2,
      priority: 20
    },
    {
      effectType: 'numeric',
      target: 'knowledge_local',
      type: 'feat',
      value: 2,
      priority: 20
    },
    {
      effectType: 'numeric',
      target: 'knowledge_nature',
      type: 'feat',
      value: 2,
      priority: 20
    },
    {
      effectType: 'numeric',
      target: 'knowledge_nobility',
      type: 'feat',
      value: 2,
      priority: 20
    },
    {
      effectType: 'numeric',
      target: 'knowledge_planes',
      type: 'feat',
      value: 2,
      priority: 20
    },
    {
      effectType: 'numeric',
      target: 'knowledge_religion',
      type: 'feat',
      value: 2,
      priority: 20
    },
    // Allow untrained Knowledge checks
    {
      effectType: 'boolean',
      target: 'untrained_knowledge',
      type: 'feat',
      value: true,
      priority: 20
    }
  ],
  
  'weapon_focus': [
    {
      effectType: 'numeric',
      target: 'attack',
      type: 'feat',
      value: 1,
      priority: 20,
      condition: 'selected_weapon_group'
    }
  ],
  
  'weapon_focus_longsword': [
    {
      effectType: 'numeric',
      target: 'attack_longsword',
      type: 'feat',
      value: 1,
      priority: 20
    }
  ],
  
  'improved_initiative': [
    {
      effectType: 'numeric',
      target: 'initiative',
      type: 'feat',
      value: 4,
      priority: 20
    }
  ],
  
  'iron_will': [
    {
      effectType: 'numeric',
      target: 'save_will',
      type: 'feat',
      value: 2,
      priority: 20
    }
  ],
  
  'lightning_reflexes': [
    {
      effectType: 'numeric',
      target: 'save_reflex',
      type: 'feat',
      value: 2,
      priority: 20
    }
  ],
  
  'great_fortitude': [
    {
      effectType: 'numeric',
      target: 'save_fortitude',
      type: 'feat',
      value: 2,
      priority: 20
    }
  ],
  
  'skill_focus': [
    {
      effectType: 'numeric',
      target: 'skill_all', // Will require special handling in skill calculation
      type: 'feat',
      value: 3,
      priority: 20,
      condition: 'selected_skill'
    }
  ],
  
  'weapon_finesse': [
    {
      effectType: 'override',
      target: 'melee_attack_ability',
      type: 'feat',
      value: 'dexterity',
      priority: 50
    }
  ],
  
  'combat_expertise': [
    {
      effectType: 'numeric',
      target: 'ac',
      type: 'dodge',
      value: 1, // Variable based on usage
      priority: 20,
      condition: 'combat_expertise_active'
    },
    {
      effectType: 'numeric',
      target: 'attack',
      type: 'penalty',
      value: -1, // Variable based on usage
      priority: 20,
      condition: 'combat_expertise_active'
    }
  ],

  // Add many more feats here
}; 