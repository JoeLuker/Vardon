/**
 * Character Adapter
 *
 * This adapter translates between the architecture's Entity format
 * and the AssembledCharacter format expected by UI components.
 */

import type { Entity } from '$lib/domain/kernel/types';
import type { AssembledCharacter, ValueWithBreakdown } from '$lib/domain/character/characterTypes';
import type { PluginManager } from '$lib/domain/plugins/PluginManager';
import type { CompleteCharacter } from '$lib/db/gameRules.api';
import type { SkillCapability } from '$lib/domain/capabilities/skill/types';
import type { CombatCapability } from '$lib/domain/capabilities/combat/types';

/**
 * Converts an Entity to an AssembledCharacter for UI components
 */
export function adaptEntityToAssembledCharacter(
  entity: Entity,
  pluginManager: PluginManager,
  rawCharacter: CompleteCharacter
): AssembledCharacter {
  // Get required capabilities
  const abilityCapability = pluginManager.getCapability('ability');
  const skillCapability = pluginManager.getCapability('skill');
  const combatCapability = pluginManager.getCapability('combat');

  if (!abilityCapability) {
    throw new Error('Ability capability not available');
  }

  // Get ability scores for each standard ability
  const abilities = {
    strength: abilityCapability.getAbilityBreakdown(entity, 'strength'),
    dexterity: abilityCapability.getAbilityBreakdown(entity, 'dexterity'),
    constitution: abilityCapability.getAbilityBreakdown(entity, 'constitution'),
    intelligence: abilityCapability.getAbilityBreakdown(entity, 'intelligence'),
    wisdom: abilityCapability.getAbilityBreakdown(entity, 'wisdom'),
    charisma: abilityCapability.getAbilityBreakdown(entity, 'charisma')
  };

  // Create the assembled character
  const assembledCharacter: AssembledCharacter = {
    // Preserve original character data
    ...rawCharacter,
    
    // Add totalLevel property
    totalLevel: calculateTotalLevel(rawCharacter),
    
    // Add empty spell data fields required by the type
    preparedSpells: {},
    spellSlots: {},
    
    // Add ability scores
    strength: convertToValueWithBreakdown(abilities.strength),
    dexterity: convertToValueWithBreakdown(abilities.dexterity),
    constitution: convertToValueWithBreakdown(abilities.constitution), 
    intelligence: convertToValueWithBreakdown(abilities.intelligence),
    wisdom: convertToValueWithBreakdown(abilities.wisdom),
    charisma: convertToValueWithBreakdown(abilities.charisma),
    
    // Add ability modifiers
    strMod: abilities.strength.modifier,
    dexMod: abilities.dexterity.modifier,
    conMod: abilities.constitution.modifier,
    intMod: abilities.intelligence.modifier,
    wisMod: abilities.wisdom.modifier,
    chaMod: abilities.charisma.modifier,
    
    // Add empty saves object (to be filled if combat capability exists)
    saves: {
      fortitude: createEmptyValueWithBreakdown('Fortitude'),
      reflex: createEmptyValueWithBreakdown('Reflex'),
      will: createEmptyValueWithBreakdown('Will')
    },
    
    // Add empty skills object (to be filled if skill capability exists)
    skills: {},
    
    // Add empty AC properties
    ac: createEmptyValueWithBreakdown('AC'),
    touch_ac: createEmptyValueWithBreakdown('Touch AC'),
    flat_footed_ac: createEmptyValueWithBreakdown('Flat-footed AC'),
    
    // Add empty combat stats
    initiative: createEmptyValueWithBreakdown('Initiative'),
    cmb: createEmptyValueWithBreakdown('CMB'),
    cmd: createEmptyValueWithBreakdown('CMD'),
    
    // Add empty attacks object
    attacks: {
      melee: createEmptyValueWithBreakdown('Melee Attack'),
      ranged: createEmptyValueWithBreakdown('Ranged Attack'),
      bomb: {
        attack: createEmptyValueWithBreakdown('Bomb Attack'),
        damage: createEmptyValueWithBreakdown('Bomb Damage'),
        bombDice: 0
      }
    },
    
    // Add empty skill points object
    skillPoints: {
      total: {},
      remaining: {}
    },
    
    // Add empty skill ranks array
    skillsWithRanks: [],
    
    // Add empty processed class features array
    processedClassFeatures: [],
    
    // Add empty ABP data
    abpData: {
      nodes: [],
      appliedBonuses: []
    },
    
    // Add empty favored class data
    favoredClassData: {
      bonuses: [],
      appliedBonuses: [],
      skillRanks: 0
    }
  };
  
  // Add skills if skill capability is available
  if (skillCapability) {
    const typedSkillCapability = skillCapability as SkillCapability;
    const skills = typedSkillCapability.getAllSkills(entity);
    if (skills) {
      // Convert skills to the expected format
      const skillsObject: Record<number, ValueWithBreakdown> = {};
      Object.entries(skills).forEach(([skillId, skillData]: [string, any]) => {
        skillsObject[parseInt(skillId)] = convertToValueWithBreakdown(skillData);
      });
      assembledCharacter.skills = skillsObject;
      
      // Create skillsWithRanks array
      assembledCharacter.skillsWithRanks = Object.entries(skills)
        .filter(([_, skillData]: [string, any]) => skillData.ranks > 0)
        .map(([skillId, skillData]: [string, any]) => ({
          skillId: parseInt(skillId),
          name: skillData.name,
          isClassSkill: skillData.isClassSkill,
          skillRanks: [{ level: 1, rank: skillData.ranks }]
        }));
    }
  }
  
  // Add combat stats if combat capability is available
  if (combatCapability) {
    const typedCombatCapability = combatCapability as CombatCapability;
    const combatStats = typedCombatCapability.getCombatStats(entity);
    if (combatStats) {
      // Add saving throws
      assembledCharacter.saves = {
        fortitude: convertToValueWithBreakdown(combatStats.saves.fortitude),
        reflex: convertToValueWithBreakdown(combatStats.saves.reflex),
        will: convertToValueWithBreakdown(combatStats.saves.will)
      };
      
      // Add AC stats
      assembledCharacter.ac = convertToValueWithBreakdown({ 
        total: combatStats.ac.total,
        modifiers: combatStats.ac.modifiers,
        label: 'AC'
      });
      assembledCharacter.touch_ac = convertToValueWithBreakdown({
        total: combatStats.ac.touch,
        modifiers: combatStats.ac.modifiers.filter((m: any) => m.appliesToTouch),
        label: 'Touch AC'
      });
      assembledCharacter.flat_footed_ac = convertToValueWithBreakdown({
        total: combatStats.ac.flatFooted,
        modifiers: combatStats.ac.modifiers.filter((m: any) => m.appliesToFlatFooted),
        label: 'Flat-footed AC'
      });
      
      // Add combat maneuver stats
      assembledCharacter.cmb = convertToValueWithBreakdown(combatStats.cmb);
      assembledCharacter.cmd = convertToValueWithBreakdown(combatStats.cmd);
      
      // Add attack stats
      assembledCharacter.attacks.melee = convertToValueWithBreakdown(combatStats.meleeAttack);
      assembledCharacter.attacks.ranged = convertToValueWithBreakdown(combatStats.rangedAttack);
    }
  }
  
  return assembledCharacter;
}

/**
 * Convert capability value to ValueWithBreakdown format
 */
function convertToValueWithBreakdown(value: any): ValueWithBreakdown {
  if (!value) {
    return createEmptyValueWithBreakdown('Unknown');
  }
  
  return {
    label: value.label || 'Unknown',
    total: value.total || 0,
    modifiers: value.modifiers || []
  };
}

/**
 * Create an empty ValueWithBreakdown object
 */
function createEmptyValueWithBreakdown(label: string): ValueWithBreakdown {
  return {
    label,
    total: 0,
    modifiers: []
  };
}

/**
 * Calculate total character level from raw character data
 */
function calculateTotalLevel(rawCharacter: CompleteCharacter): number {
  if (!rawCharacter.game_character_class || !rawCharacter.game_character_class.length) {
    return 0;
  }
  
  return rawCharacter.game_character_class.reduce((sum, classData) => {
    return sum + (classData.level || 0);
  }, 0);
}