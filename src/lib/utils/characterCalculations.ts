import type { Character, CharacterAttributes, KnownBuffType, BaseSkill, CharacterSkillRank, ClassSkillRelation } from '$lib/types/character';
import type { ABPBonuses } from '$lib/types/abp';

// Add these type definitions near the top of the file
interface SkillBonus {
  skill: string;
  value: number;
}

// Base ability score modifier calculation
export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

// Interface for all calculated stats
export interface CalculatedStats {
  // Ability Scores & Modifiers
  attributes: {
    base: CharacterAttributes;        // Base scores
    permanent: CharacterAttributes;   // Base + permanent bonuses
    temporary: CharacterAttributes;   // All bonuses including temporary
    modifiers: {
      permanent: CharacterAttributes; // Modifiers from permanent scores
      temporary: CharacterAttributes; // Modifiers including temporary bonuses
    };
  };
  
  // Combat Stats
  combat: {
    initiative: number;
    baseAttackBonus: number;
    meleeAttack: number;
    rangedAttack: number;
    combatManeuver: {
      bonus: number;
      defense: number;
    };
  };
  
  // Defenses
  defenses: {
    ac: {
      normal: number;
      touch: number;
      flatFooted: number;
    };
    saves: {
      fortitude: number;
      reflex: number;
      will: number;
    };
  };
  
  // Skills
  skills: Record<string, {
    total: number;
    ranks: number;
    abilityMod: number;
    classSkill: boolean;
    miscMod: number;
  }>;
}

// Helper to determine if a buff provides permanent bonuses
function isBuffPermanent(_buff: KnownBuffType): boolean {
  return false;
}

function calculateModifiedAttributes(
  base: CharacterAttributes,
  activeBuffs: KnownBuffType[]
): {
  permanent: CharacterAttributes;
  temporary: CharacterAttributes;
} {
  // Start with base values
  const permanent = { ...base };
  const temporary = { ...base };

  // Apply permanent bonuses first
  activeBuffs.forEach(buff => {
    if (isBuffPermanent(buff)) {
      // Apply permanent bonuses here
      // Currently none implemented
    }
  });

  // Apply all bonuses (including temporary) to the temporary scores
  activeBuffs.forEach(buff => {
    switch (buff) {
      case 'cognatogen':
        temporary.int += 4;
        temporary.str -= 2;
        break;
      case 'dex_mutagen':
        temporary.dex += 4;
        temporary.wis -= 2;
        break;
    }
  });

  return { permanent, temporary };
}

// Update the main calculation function
export function calculateCharacterStats(
  character: Character,
  abpBonuses: ABPBonuses
): CalculatedStats {
  const activeBuffs = character.character_buffs
    ?.filter(b => b.is_active)
    .map(b => b.buff_type as KnownBuffType) ?? [];
    
  const baseAttributes = character.character_attributes?.[0] ?? {
    str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10
  };
  
  const { permanent, temporary } = calculateModifiedAttributes(baseAttributes, activeBuffs);

  // Calculate both permanent and temporary modifiers
  const permanentModifiers = Object.entries(permanent).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [key]: getAbilityModifier(value)
    }),
    {} as CharacterAttributes
  );

  const temporaryModifiers = Object.entries(temporary).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [key]: getAbilityModifier(value)
    }),
    {} as CharacterAttributes
  );

  // Use temporary modifiers for combat stats
  const combatStats = calculateCombatStats(
    character,
    temporaryModifiers,
    activeBuffs,
    abpBonuses
  );

  // Use temporary modifiers for defenses
  const defenses = calculateDefenses(
    character,
    temporaryModifiers,
    abpBonuses
  );

  // Use permanent modifiers for skill calculations
  const skills = calculateSkills(
    character,
    permanentModifiers
  );

  return {
    attributes: {
      base: baseAttributes,
      permanent,
      temporary,
      modifiers: {
        permanent: permanentModifiers,
        temporary: temporaryModifiers
      }
    },
    combat: combatStats,
    defenses,
    skills
  };
}

function calculateCombatStats(
  _character: Character,
  modifiers: CharacterAttributes,
  _activeBuffs: KnownBuffType[],
  _abpBonuses: ABPBonuses
) {
  // Placeholder implementation - replace with actual logic
  return {
    initiative: modifiers.dex,
    baseAttackBonus: 0, // Calculate based on character level and class
    meleeAttack: modifiers.str,
    rangedAttack: modifiers.dex,
    combatManeuver: {
      bonus: modifiers.str,
      defense: 10 + modifiers.str + modifiers.dex
    }
  };
}

function calculateDefenses(
  _character: Character,
  modifiers: CharacterAttributes,
  _abpBonuses: ABPBonuses
) {
  // Placeholder implementation - replace with actual logic
  return {
    ac: {
      normal: 10 + modifiers.dex,
      touch: 10 + modifiers.dex,
      flatFooted: 10
    },
    saves: {
      fortitude: modifiers.con,
      reflex: modifiers.dex,
      will: modifiers.wis
    }
  };
}

function calculateSkills(
  character: Character & {
    base_skills?: BaseSkill[];
    character_skill_ranks?: CharacterSkillRank[];
    class_skill_relations?: ClassSkillRelation[];
  },
  modifiers: CharacterAttributes
) {
  const skills: Record<string, {
    total: number;
    ranks: number;
    abilityMod: number;
    classSkill: boolean;
    miscMod: number;
  }> = {};

  // Early return if we don't have the necessary data
  if (!character.base_skills) return skills;

  character.base_skills.forEach(baseSkill => {
    const skillRank = character.character_skill_ranks?.find(
      rank => rank.skill_id === baseSkill.id
    );
    const isClassSkill = character.class_skill_relations?.some(
      relation => relation.skill_id === baseSkill.id
    ) ?? false;
    const abilityMod = modifiers[baseSkill.ability.toLowerCase() as keyof CharacterAttributes];
    const ranks = skillRank?.ranks ?? 0;
    const classSkillBonus = (isClassSkill && ranks > 0) ? 3 : 0;
    const armorCheckPenalty = baseSkill.armor_check_penalty ? 
      calculateArmorCheckPenalty(character) : 0;
    const miscMod = calculateMiscSkillModifiers(character, baseSkill.name);
    const total = ranks + abilityMod + classSkillBonus + miscMod + armorCheckPenalty;

    skills[baseSkill.name] = {
      total,
      ranks,
      abilityMod,
      classSkill: isClassSkill,
      miscMod: miscMod + armorCheckPenalty
    };
  });

  return skills;
}

// Update the equipment check in calculateMiscSkillModifiers
function calculateMiscSkillModifiers(character: Character, skillName: string): number {
  let modifier = 0;

  // Add racial bonuses
  if (character.race === 'Tengu' && skillName === 'Stealth') {
    modifier += 2;
  }

  // Add equipment and feat bonuses
  character.character_equipment?.forEach(equipment => {
    const skillBonus = equipment.properties?.skill_bonus as SkillBonus | undefined;
    if (equipment.equipped && skillBonus?.skill === skillName) {
      modifier += skillBonus.value;
    }
  });

  character.character_feats?.forEach(feat => {
    const skillBonus = feat.properties?.skill_bonus as SkillBonus | undefined;
    if (skillBonus?.skill === skillName) {
      modifier += skillBonus.value;
    }
  });

  return modifier;
}

// Keep this version of calculateArmorCheckPenalty since it's already being used
function calculateArmorCheckPenalty(character: Character): number {
  const armor = character.character_equipment?.find(
    e => e.type === 'armor' && e.equipped
  );
  return armor?.properties?.armor_check_penalty ?? 0;
}
// Keep these helper functions but remove the duplicates below them
export function calculateSkillBonus(
    skill: BaseSkill,
    ranks: number,
    isClassSkill: boolean,
    abilityModifiers: CharacterAttributes,
    armorCheckPenalty: number = 0
): number {
    const abilityMod = abilityModifiers[skill.ability.toLowerCase() as keyof CharacterAttributes];
    const classSkillBonus = (isClassSkill && ranks > 0) ? 3 : 0;
    const acp = skill.armor_check_penalty ? armorCheckPenalty : 0;
    
    return ranks + abilityMod + classSkillBonus + acp;
}

export function getArmorCheckPenalty(character: Character): number {
    const equippedArmor = character.character_equipment?.find(
        e => e.type === 'armor' && e.equipped
    );
    return equippedArmor?.properties?.armor_check_penalty ?? 0;
}
