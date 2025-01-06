/******************************************************************************
 * FILE: src/lib/state/characterCalculations.ts
 *
 * This file is responsible for adding "calculated" fields to a plain
 * CompleteCharacter object or turning it into a "reactive" object with Svelte 5 runes.
 *****************************************************************************/

import type { CompleteCharacter } from '$lib/db/getCompleteCharacter';

export interface EnrichedCharacter extends CompleteCharacter {
  // Combat stats
  ac: number;
  touch_ac: number;
  flat_footed_ac: number;
  cmd: number;
  cmb: number;
  initiative: number;
  
  // Saving throws
  saves: {
    base: {
      fortitude: number;
      reflex: number;
      will: number;
    };
    fortitude: number;
    reflex: number;
    will: number;
  };
  
  // Derived attribute modifiers
  str_mod: number;
  dex_mod: number;
  con_mod: number;
  int_mod: number;
  wis_mod: number;
  cha_mod: number;
  
  // Skill calculations
  skill_modifiers: Record<number, number>; // skillId -> total modifier
}

function getAttributeModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

function calculateBaseSaves(rawCharacter: CompleteCharacter) {
  /**
   * Calculates base saving throw bonuses for a character's classes
   * - Good saves: Base = 2 + level/2
   * - Poor saves: Base = level/3
   */
  const calculateSaveBonus = (classes: any[], saveProgressionKey: string): number => {
    let totalBonus = 0;

    // Calculate bonus from each class
    for (const cls of classes) {
      
      const level = Number(cls.level) || 1;
      const isGoodSave = cls.base[saveProgressionKey] === "good";
      
      if (isGoodSave) {
        totalBonus += 2;
        totalBonus += level / 2; // Good save progression with +2 added
      } else {
        totalBonus += level / 3; // Poor save progression
      }
    }

    rawCharacter.abpBonuses

    // Round down total
    return Math.floor(totalBonus);
  };

  // Calculate base saves for each type
  return {
    fortitude: calculateSaveBonus(rawCharacter.classes, 'fort_save_progression'),
    reflex: calculateSaveBonus(rawCharacter.classes, 'ref_save_progression'), 
    will: calculateSaveBonus(rawCharacter.classes, 'will_save_progression')
  };
}

/**
 * Collects all class skill IDs from all of the character’s classes.
 * If a character is multi-classed, we union them. 
 */
function getAllClassSkillIds(rawCharacter: CompleteCharacter): Set<number> {
  const classSkillIds = new Set<number>();

  for (const cls of rawCharacter.classes || []) {
    // If the class object has a property like cls.class_skills = [28, 31, ...],
    // we add them all to the set:
    if (Array.isArray(cls.class_skills)) {
      cls.class_skills.forEach(skillId => {
        classSkillIds.add(skillId);
      });
    }
  }
  return classSkillIds;
}

export function enrichCharacterData(rawCharacter: CompleteCharacter): EnrichedCharacter {
  // 1) Calculate attribute modifiers
  const getAttrValue = (attrName: string) => {
    const found = rawCharacter.attributes.find(a => a.name === attrName);
    return found?.value ? Number(found.value) : 10;
  };

  const str = getAttrValue('Strength');
  const dex = getAttrValue('Dexterity');
  const con = getAttrValue('Constitution');
  const int = getAttrValue('Intelligence');
  const wis = getAttrValue('Wisdom');
  const cha = getAttrValue('Charisma');

  const str_mod = getAttributeModifier(str);
  const dex_mod = getAttributeModifier(dex);
  const con_mod = getAttributeModifier(con);
  const int_mod = getAttributeModifier(int);
  const wis_mod = getAttributeModifier(wis);
  const cha_mod = getAttributeModifier(cha);

  // 2) Calculate total level (assuming single-class or sum them up if needed)
  //    For example, if you want total character level:
  const level = rawCharacter.classes.reduce((acc, cls) => {
    const lvl = cls.level ? Number(cls.level) : 1;
    return acc + lvl;
  }, 0);

  // 3) Saving Throws
  const baseSaves = calculateBaseSaves(rawCharacter);
  const fortitude = baseSaves.fortitude + con_mod;
  const reflex = baseSaves.reflex + dex_mod;
  const will = baseSaves.will + wis_mod;

  const saves = {
    base: baseSaves,
    fortitude,
    reflex,
    will
  };


  // 4) Armor Class
  //    If the character has the Dodge feat, we add +1
  const hasDodgeFeat = rawCharacter.feats.some(f => f.name === 'Dodge');
  const baseAC = 10 + dex_mod + (hasDodgeFeat ? 1 : 0);
  const ac = baseAC;
  const touch_ac = baseAC; // no armor or shield being factored here
  const flat_footed_ac = baseAC - dex_mod; // lose Dex to AC when flat-footed

  // 5) CMB/CMD
  const cmb = str_mod + level;
  const cmd = 10 + str_mod + dex_mod + level;

  // 6) Initiative
  const initiative = dex_mod;

  // 7) Class-skill bonus logic 
  //    — We gather all class-skill IDs from the classes:
  const classSkillIds = getAllClassSkillIds(rawCharacter);

  // 8) Calculate skill modifiers
  const skill_modifiers: Record<number, number> = {};

  for (const skill of rawCharacter.baseSkills) {

    const skillWithRanks = rawCharacter.skillsWithRanks.find(s => s.skillId === skill.id);
    // Find the ability mod for that skill’s ability
    const ability_mod = {
      'str': str_mod,
      'dex': dex_mod,
      'con': con_mod,
      'int': int_mod,
      'wis': wis_mod,
      'cha': cha_mod
    }[skill.ability] ?? 0;

    // Start with ability mod + ranks
    let total = ability_mod + (skillWithRanks?.totalRanks || 0);

    // If this skill is in the set of class skills, and you have >=1 rank, add +3
    if (classSkillIds.has(skill.id) && (skillWithRanks?.totalRanks ?? 0 > 0)) {
      total += 3;
    }

    // (You could also apply armor-check penalty, feats, synergy, etc. here)
    skill_modifiers[skill.id] = total;
  }

  // Return the enriched object
  return {
    ...rawCharacter,
    ac,
    touch_ac,
    flat_footed_ac,
    cmd,
    cmb,
    initiative,
    saves,
    str_mod,
    dex_mod,
    con_mod,
    int_mod,
    wis_mod,
    cha_mod,
    skill_modifiers
  };
}
