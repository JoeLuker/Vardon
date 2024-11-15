// src/lib/utils/characterCalculations.ts
import type { 
  Character, 
  CharacterAttributes, 
  KnownBuffType,
  BaseSkill,
  CharacterEquipment,
  CharacterEquipmentProperties
} from '$lib/types/character';
import type { ABPBonuses } from '$lib/types/abp';

// Types for calculated stats
export interface CalculatedStats {
  attributes: {
      base: CharacterAttributes;
      permanent: CharacterAttributes;
      temporary: CharacterAttributes;
      modifiers: {
          permanent: CharacterAttributes;
          temporary: CharacterAttributes;
      };
  };
  combat: {
      initiative: number;
      baseAttackBonus: number;
      attacks: {
          melee: {
              bonus: string;
              damage: string;
          };
          ranged: {
              bonus: string;
              damage: string;
          };
      };
      combatManeuver: {
          bonus: number;
          defense: number;
      };
  };
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
  skills: Record<string, {
      total: number;
      ranks: number;
      abilityMod: number;
      classSkill: boolean;
      miscMod: number;
      armorCheckPenalty: number;
  }>;
  resources: {
      bombs: {
          perDay: number;
          remaining: number;
          damage: string;
          splash: number;
      };
      extracts: Record<number, {
          perDay: number;
          prepared: number;
          used: number;
      }>;
  };
}

// Helper function to calculate ability score modifier
export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

// Calculate all attribute-related values
function calculateAttributes(
  character: Character,
  activeBuffs: KnownBuffType[]
): CalculatedStats['attributes'] {
  const baseAttributes = character.character_attributes?.[0] ?? {
      str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10
  };

  // Calculate permanent bonuses (from items, feats, etc.)
  const permanent = { ...baseAttributes };
  // Add permanent bonuses here when implemented

  // Calculate temporary bonuses from active buffs
  const temporary = { ...permanent };
  activeBuffs.forEach(buff => {
      switch(buff) {
          case 'cognatogen':
              temporary.int += 4;
              temporary.str -= 2;
              break;
          case 'dex_mutagen':
              temporary.dex += 4;
              temporary.wis -= 2;
              break;
          // Add other buff effects
      }
  });

  // Calculate modifiers for both permanent and temporary values
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

  return {
      base: baseAttributes,
      permanent,
      temporary,
      modifiers: {
          permanent: permanentModifiers,
          temporary: temporaryModifiers
      }
  };
}

// Calculate all combat-related values
function calculateCombat(
  character: Character,
  attributes: CalculatedStats['attributes'],
  activeBuffs: KnownBuffType[]
): CalculatedStats['combat'] {
  const mods = calculateCombatMods(activeBuffs);
  const baseAttackBonus = character.character_combat_stats?.[0]?.base_attack_bonus ?? 0;

  return {
      initiative: attributes.modifiers.temporary.dex + mods.initiative,
      baseAttackBonus,
      attacks: {
          melee: {
              bonus: formatAttackBonus(
                  baseAttackBonus + attributes.modifiers.temporary.str + mods.attack,
                  mods.extraAttacks
              ),
              damage: formatDamageBonus(attributes.modifiers.temporary.str + mods.damage)
          },
          ranged: {
              bonus: formatAttackBonus(
                  baseAttackBonus + attributes.modifiers.temporary.dex + mods.attack,
                  mods.extraAttacks
              ),
              damage: formatDamageBonus(mods.damage)
          }
      },
      combatManeuver: {
          bonus: baseAttackBonus + attributes.modifiers.temporary.str + mods.cmb,
          defense: 10 + attributes.modifiers.temporary.str + 
                  attributes.modifiers.temporary.dex + mods.cmd
      }
  };
}

// Calculate all defense-related values
function calculateDefenses(
  attributes: CalculatedStats['attributes'],
  activeBuffs: KnownBuffType[],
  abpBonuses: ABPBonuses
): CalculatedStats['defenses'] {
  const mods = calculateCombatMods(activeBuffs);

  return {
      ac: {
          normal: 10 + attributes.modifiers.temporary.dex + mods.ac.normal + abpBonuses.armor,
          touch: 10 + attributes.modifiers.temporary.dex + mods.ac.touch,
          flatFooted: 10 + mods.ac.flatFooted + abpBonuses.armor
      },
      saves: {
          fortitude: 2 + attributes.modifiers.temporary.con + mods.saves.fort + abpBonuses.resistance,
          reflex: 2 + attributes.modifiers.temporary.dex + mods.saves.ref + abpBonuses.resistance,
          will: 2 + attributes.modifiers.temporary.wis + mods.saves.will + abpBonuses.resistance
      }
  };
}

// Calculate all skill-related values
function calculateSkills(
  character: Character,
  attributes: CalculatedStats['attributes']
): CalculatedStats['skills'] {
  const skills: CalculatedStats['skills'] = {};

  if (!character.base_skills) return skills;

  character.base_skills.forEach(baseSkill => {
      const skillRank = character.character_skill_ranks?.find(
          rank => rank.skill_id === baseSkill.id
      );
      const isClassSkill = character.class_skill_relations?.some(
          relation => relation.skill_id === baseSkill.id
      ) ?? false;
      const abilityMod = attributes.modifiers.permanent[
          baseSkill.ability.toLowerCase() as keyof CharacterAttributes
      ];
      const ranks = skillRank?.ranks ?? 0;
      const classSkillBonus = (isClassSkill && ranks > 0) ? 3 : 0;
      
      const armorCheckPenalty = baseSkill.armor_check_penalty ? 
          calculateArmorCheckPenalty(character.character_equipment) : 0;
          
      const miscMod = calculateMiscSkillModifiers(
          character.character_equipment,
          character.character_feats,
          baseSkill.name
      );

      const total = ranks + abilityMod + classSkillBonus + miscMod + armorCheckPenalty;

      skills[baseSkill.name] = {
          total,
          ranks,
          abilityMod,
          classSkill: isClassSkill,
          miscMod,
          armorCheckPenalty
      };
  });

  return skills;
}

// Calculate resource-related values
function calculateResources(
  character: Character,
  attributes: CalculatedStats['attributes']
): CalculatedStats['resources'] {
  const intModifier = attributes.modifiers.permanent.int;
  const level = character.level;

  return {
      bombs: {
          perDay: level + intModifier,
          remaining: character.character_combat_stats?.[0]?.bombs_left ?? 0,
          damage: `${Math.ceil(level/2)}d6 + ${intModifier}`,
          splash: intModifier
      },
      extracts: Object.fromEntries(
          Array.from({ length: 6 }, (_, i) => i + 1).map(level => [
              level,
              {
                  perDay: calculateExtractsPerDay(character.level, intModifier, level),
                  prepared: 0, // Add actual prepared count
                  used: 0 // Add actual used count
              }
          ])
      )
  };
}

// Master calculation function
export function calculateCharacterStats(
  character: Character,
  abpBonuses: ABPBonuses
): CalculatedStats {
  const activeBuffs = (character.character_buffs ?? [])
      .filter(b => b.is_active)
      .map(b => b.buff_type as KnownBuffType);

  const attributes = calculateAttributes(character, activeBuffs);
  
  return {
      attributes,
      combat: calculateCombat(character, attributes, activeBuffs),
      defenses: calculateDefenses(attributes, activeBuffs, abpBonuses),
      skills: calculateSkills(character, attributes),
      resources: calculateResources(character, attributes)
  };
}

// Helper functions for formatting and specific calculations
function calculateArmorCheckPenalty(equipment: CharacterEquipment[] = []): number {
  const equippedArmor = equipment.find(e => e.type === 'armor' && e.equipped);
  return (equippedArmor?.properties as CharacterEquipmentProperties)?.armor_check_penalty ?? 0;
}

function formatAttackBonus(total: number, extraAttacks: number = 0): string {
  const sign = total >= 0 ? '+' : '';
  let display = `${sign}${total}`;
  
  // Add iterative attacks
  const iterations = Math.floor(total / 5);
  for (let i = 1; i <= iterations; i++) {
      display += ` / ${sign}${total - (5 * i)}`;
  }
  
  // Add extra attacks from effects (like Rapid Shot)
  if (extraAttacks > 0) {
      display += ` / ${sign}${total}`.repeat(extraAttacks);
  }
  
  return display;
}

function formatDamageBonus(bonus: number): string {
  return bonus === 0 ? '' : (bonus > 0 ? `+${bonus}` : bonus.toString());
}

function calculateExtractsPerDay(characterLevel: number, intModifier: number, extractLevel: number): number {
  const baseExtractsTable = {
      1: [1, 0, 0, 0, 0, 0],
      2: [2, 0, 0, 0, 0, 0],
      3: [3, 0, 0, 0, 0, 0],
      4: [3, 1, 0, 0, 0, 0],
      5: [4, 2, 0, 0, 0, 0],
      6: [4, 3, 0, 0, 0, 0],
      7: [4, 3, 1, 0, 0, 0],
      8: [4, 4, 2, 0, 0, 0]
      // Add remaining levels
  };

  const baseExtracts = baseExtractsTable[characterLevel as keyof typeof baseExtractsTable]?.[extractLevel - 1] ?? 0;
  const bonusExtracts = intModifier > 0 ? Math.max(0, intModifier) : 0;
  
  return baseExtracts + bonusExtracts;
}

function calculateMiscSkillModifiers(
  equipment: CharacterEquipment[] = [],
  feats: any[] = [],
  skillName: string
): number {
  let modifier = 0;

  // Add equipment bonuses
  equipment.forEach(item => {
      if (item.equipped && item.properties?.skill_bonus?.skill === skillName) {
          modifier += item.properties.skill_bonus.value;
      }
  });

  // Add feat bonuses
  feats.forEach(feat => {
      if (feat.properties?.skill_bonus?.skill === skillName) {
          modifier += feat.properties.skill_bonus.value;
      }
  });

  return modifier;
}

export function calculateSkillBonus(
    skill: BaseSkill, 
    ranks: number, 
    isClassSkill: boolean,
    abilityModifiers: CharacterAttributes,
    armorCheckPenalty: number = 0
): number {
    const abilityMod = abilityModifiers[skill.ability.toLowerCase() as keyof CharacterAttributes];
    const classSkillBonus = (isClassSkill && ranks > 0) ? 3 : 0;
    const armorPenalty = skill.armor_check_penalty ? armorCheckPenalty : 0;
    
    return ranks + abilityMod + classSkillBonus + armorPenalty;
}

interface CombatMods {
  initiative: number;
  attack: number;
  damage: number;
  extraAttacks: number;
  cmb: number;
  cmd: number;
  ac: {
    normal: number;
    touch: number;
    flatFooted: number;
  };
  saves: {
    fort: number;
    ref: number;
    will: number;
  };
}

// Add this function
function calculateCombatMods(activeBuffs: KnownBuffType[]): CombatMods {
  const mods: CombatMods = {
    initiative: 0,
    attack: 0,
    damage: 0,
    extraAttacks: 0,
    cmb: 0,
    cmd: 0,
    ac: {
      normal: 0,
      touch: 0,
      flatFooted: 0
    },
    saves: {
      fort: 0,
      ref: 0,
      will: 0
    }
  };

  activeBuffs.forEach(buff => {
    switch(buff) {
      case 'cognatogen':
        mods.attack += 2; // Example bonus
        break;
      case 'dex_mutagen':
        mods.initiative += 2;
        mods.ac.normal += 2;
        mods.ac.touch += 2;
        mods.saves.ref += 2;
        break;
      // Add other buff effects as needed
    }
  });

  return mods;
}