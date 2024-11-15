// src/lib/utils/characterCalculations.ts
import type { 
  Character, 
  CharacterAttributes, 
  KnownBuffType,
  CharacterSkillRank,
  DbTables,
  CharacterEquipmentProperties
} from '$lib/types/character';
import type { ABPBonuses } from '$lib/types/abp';
import type { Buff, BuffEffect } from '$lib/types/buffs';
import { BUFF_CONFIG } from '$lib/config/buffs';

// Use types from Database
type CharacterABPBonus = DbTables['character_abp_bonuses']['Row'];
type CharacterEquipment = DbTables['character_equipment']['Row'];
type CharacterDiscovery = DbTables['character_discoveries']['Row'];
type BaseSkill = DbTables['base_skills']['Row'];

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
  skills: {
    byName: Record<string, {
	  ability: any;
      total: number;
      ranks: SkillRanksByLevel;
      abilityMod: number;
      classSkill: boolean;
      miscMod: number;
      armorCheckPenalty: number;
    }>;
    byLevel: Record<number, {
      available: number;
      used: number;
      remaining: number;
    }>;
  };
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

// Helper function to get ABP bonus value
function getABPBonus(
    abpBonuses: CharacterABPBonus[] | undefined,
    bonusType: CharacterABPBonus['bonus_type']
): number {
    return abpBonuses?.find(b => b.bonus_type === bonusType)?.value ?? 0;
}

// Calculate all attribute-related values
function calculateAttributes(
  character: Character,
  activeBuffs: KnownBuffType[]
): CalculatedStats['attributes'] {
  const baseAttributes = character.character_attributes?.[0] ?? {
      str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10
  };

  // Calculate permanent bonuses (from ABP)
  const permanent = { ...baseAttributes };
  const mentalProwessBonus = getABPBonus(character.character_abp_bonuses, 'mental_prowess');
  
  if (mentalProwessBonus > 0) {
      permanent.int += mentalProwessBonus;
  }

  // Calculate temporary bonuses from active buffs
  const temporary = { ...permanent };
  activeBuffs.forEach(buffName => {
      const buff = BUFF_CONFIG.find((b: Buff) => b.name === buffName);
      if (buff) {
          buff.effects.forEach((effect: BuffEffect) => {
              if (effect.attribute && effect.modifier) {
                  temporary[effect.attribute as keyof CharacterAttributes] += effect.modifier;
              }
          });
      }
  });

  // Calculate modifiers for both permanent and temporary values
  const permanentModifiers = Object.entries(permanent).reduce(
      (acc, [key, value]) => ({
          ...acc,
          [key]: getAbilityModifier(value as number)
      }),
      {} as CharacterAttributes
  );

  const temporaryModifiers = Object.entries(temporary).reduce(
      (acc, [key, value]) => ({
          ...acc,
          [key]: getAbilityModifier(value as number)
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
  let naturalArmorBonus = 0;
  
  // Calculate natural armor bonus from active mutagens/cognatogens
  activeBuffs.forEach(buffName => {
      const buff = BUFF_CONFIG.find((b: Buff) => b.name === buffName);
      if (buff) {
          const naturalArmorEffect = buff.effects.find((e: BuffEffect) => 'naturalArmor' in e);
          if (naturalArmorEffect?.naturalArmor) {
              naturalArmorBonus = Math.max(naturalArmorBonus, naturalArmorEffect.naturalArmor);
          }
      }
  });

  const mods = calculateCombatMods(activeBuffs);

  return {
      ac: {
          normal: 10 + attributes.modifiers.temporary.dex + mods.ac.normal + abpBonuses.armor + naturalArmorBonus,
          touch: 10 + attributes.modifiers.temporary.dex + mods.ac.touch + naturalArmorBonus,
          flatFooted: 10 + mods.ac.flatFooted + abpBonuses.armor + naturalArmorBonus
      },
      saves: {
          fortitude: 2 + attributes.modifiers.temporary.con + mods.saves.fort + abpBonuses.resistance,
          reflex: 2 + attributes.modifiers.temporary.dex + mods.saves.ref + abpBonuses.resistance,
          will: 2 + attributes.modifiers.temporary.wis + mods.saves.will + abpBonuses.resistance
      }
  };
}

// Add new interface for tracking ranks by level
interface SkillRanksByLevel {
    total: number;
    byLevel: Record<number, {
        ranks: number;
        source: string;
    }[]>;
}

// Helper to get ranks up to a specific level
function getRanksUpToLevel(
    skillRanks: CharacterSkillRank[] | undefined,
    skillId: number,
    level: number
): SkillRanksByLevel {
    const ranks = skillRanks?.filter(rank => 
        rank.skill_id === skillId && 
        rank.applied_at_level <= level
    ) ?? [];

    const byLevel: Record<number, { ranks: number; source: string; }[]> = {};
    let total = 0;

    // Initialize all levels
    for (let i = 1; i <= level; i++) {
        byLevel[i] = [];
    }

    // Group ranks by level
    ranks.forEach(rank => {
        byLevel[rank.applied_at_level].push({
            ranks: rank.ranks,
            source: rank.source
        });
        total += rank.ranks;
    });

    return { total, byLevel };
}

// Update the skills interface
export interface CalculatedStats {
    skills: {
        byName: Record<string, {
            ability: any; // Changed from string to any to match the error message
            total: number;
            ranks: SkillRanksByLevel;
            abilityMod: number;
            classSkill: boolean;
            miscMod: number;
            armorCheckPenalty: number;
        }>;
        byLevel: Record<number, {
            available: number;
            used: number;
            remaining: number;
        }>;
    };
    // ... rest of the interface
}

// Update the skills calculation
function calculateSkills(
    character: Character,
    attributes: CalculatedStats['attributes']
): CalculatedStats['skills'] {
    const skillsByName: CalculatedStats['skills']['byName'] = {};
    const skillsByLevel: CalculatedStats['skills']['byLevel'] = {};

    if (!character.base_skills) {
        return { byName: skillsByName, byLevel: skillsByLevel };
    }

    // Calculate available points for each level
    for (let level = 1; level <= character.level; level++) {
        const basePoints = 4; // Alchemist base
        const intBonus = Math.floor((attributes.permanent.int - 10) / 2);
        const fcbPoint = character.character_favored_class_bonuses?.some(
            (fcb: DbTables['character_favored_class_bonuses']['Row']) => 
                fcb.level === level && fcb.choice === 'skill'
        ) ? 1 : 0;

        skillsByLevel[level] = {
            available: Math.max(1, basePoints + intBonus + fcbPoint),
            used: 0,
            remaining: 0 // Will calculate after counting used points
        };
    }

    // Calculate skill totals and track ranks by level
    character.base_skills.forEach(baseSkill => {
        const rankInfo = getRanksUpToLevel(
            character.character_skill_ranks,
            baseSkill.id,
            character.level
        );
        
        const isClassSkill = character.class_skill_relations?.some(
            relation => relation.skill_id === baseSkill.id
        ) ?? false;

        const abilityMod = attributes.modifiers.permanent[
            baseSkill.ability.toLowerCase() as keyof CharacterAttributes
        ];

        const classSkillBonus = (isClassSkill && rankInfo.total > 0) ? 3 : 0;
        
        const armorCheckPenalty = baseSkill.armor_check_penalty ? 
            calculateArmorCheckPenalty(character.character_equipment) : 0;
            
        const miscMod = calculateMiscSkillModifiers(
            character.character_equipment,
            character.character_feats,
            baseSkill.name
        );

        // Add up ranks used at each level
        Object.entries(rankInfo.byLevel).forEach(([level, ranksAtLevel]) => {
            const totalRanksAtLevel = ranksAtLevel.reduce((sum, r) => sum + r.ranks, 0);
            skillsByLevel[Number(level)].used += totalRanksAtLevel;
        });

        const total = rankInfo.total + abilityMod + classSkillBonus + miscMod + armorCheckPenalty;

        skillsByName[baseSkill.name] = {
            total,
            ranks: rankInfo,
            abilityMod,
            classSkill: isClassSkill,
            ability: baseSkill.ability,
            miscMod,
            armorCheckPenalty
        };
    });

    // Calculate remaining points for each level
    Object.keys(skillsByLevel).forEach(level => {
        const lvl = Number(level);
        skillsByLevel[lvl].remaining = 
            skillsByLevel[lvl].available - skillsByLevel[lvl].used;
    });

    return { byName: skillsByName, byLevel: skillsByLevel };
}

// Calculate resource-related values
function calculateResources(
  character: Character,
  attributes: CalculatedStats['attributes']
): CalculatedStats['resources'] {
  // Use temporary int modifier for bombs (includes cognatogen)
  const intModifier = attributes.modifiers.temporary.int;
  const level = character.level;

  return {
      bombs: {
          perDay: level + intModifier,
          remaining: character.character_combat_stats?.[0]?.bombs_left ?? 0,
          damage: `${Math.ceil(level/2)}d6 + ${intModifier}`,
          splash: Math.ceil(level/2) + intModifier
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
  equipment: DbTables['character_equipment']['Row'][] = [],
  feats: DbTables['character_feats']['Row'][] = [],
  skillName: string
): number {
  let modifier = 0;

  // Add equipment bonuses
  equipment.forEach(item => {
      const props = item.properties as CharacterEquipmentProperties;
      if (item.equipped && props?.skill_bonus?.skill === skillName) {
          modifier += props.skill_bonus.value;
      }
  });

  // Add feat bonuses
  feats.forEach(feat => {
      const props = feat.properties as CharacterEquipmentProperties;
      if (props?.skill_bonus?.skill === skillName) {
          modifier += props.skill_bonus.value;
      }
  });

  return modifier;
}

export function calculateSkillBonus(
    skill: BaseSkill, 
    ranks: number, 
    isClassSkill: boolean,
    abilityModifiers: CharacterAttributes,
    armorCheckPenalty: number = 0,
    character: Character
): number {
    const abilityMod = abilityModifiers[skill.ability.toLowerCase() as keyof CharacterAttributes];
    const classSkillBonus = (isClassSkill && ranks > 0) ? 3 : 0;
    const armorPenalty = skill.armor_check_penalty ? armorCheckPenalty : 0;
    
    // Add Perfect Recall bonus for Mindchemist on Knowledge checks
    const perfectRecallBonus = 
        character.archetype === 'mindchemist' && 
        character.level >= 2 && 
        skill.name.startsWith('Knowledge') ? 
            abilityMod : 0;
    
    return ranks + abilityMod + perfectRecallBonus + classSkillBonus + armorPenalty;
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
        ac: { normal: 0, touch: 0, flatFooted: 0 },
        saves: { fort: 0, ref: 0, will: 0 }
    };

    activeBuffs.forEach(buff => {
        switch(buff) {
            // Combat feats only - everything else is handled by ability score changes
            case 'deadly_aim':
                mods.attack -= 2;
                mods.damage += 4;
                break;
            case 'rapid_shot':
            case 'two_weapon_fighting':
                mods.attack -= 2;
                mods.extraAttacks += 1;
                break;
        }
    });

    return mods;
}

// Update skill points calculation to use permanent int bonus
export function calculateTotalSkillPoints(character: Character): number {
    // Base skill points (4 for alchemist)
    const basePoints = 4;
    
    // Get permanent Intelligence including ABP bonuses, but NOT temporary buffs
    const baseInt = character.character_attributes?.[0]?.int ?? 10;
    const mentalProwessBonus = getABPBonus(character.character_abp_bonuses, 'mental_prowess');
    const permanentInt = baseInt + mentalProwessBonus;
    
    // Calculate Int modifier from permanent Int score only
    const intBonus = Math.floor((permanentInt - 10) / 2);
    
    // FCB skill points
    const fcbSkillPoints = (character.character_favored_class_bonuses ?? [])
        .filter(fcb => fcb.choice === 'skill')
        .length;
    
    // Calculate total: (base + int mod) × level + FCB points
    const pointsPerLevel = Math.max(1, basePoints + intBonus);
    const totalPoints = (pointsPerLevel * character.level) + fcbSkillPoints;
    
    return totalPoints;
}

// Update mutagen/cognatogen availability check
function canUseMutagen(character: Character): boolean {
    if (character.archetype === 'mindchemist') {
        // Mindchemists can only use mutagens if they took it as a discovery
        return character.character_discoveries?.some((d: CharacterDiscovery) => 
            d.discovery_name === 'mutagen'
        ) ?? false;
    }
    return true; // Base alchemists always have access
}

function canUseCognatogen(character: Character): boolean {
    if (character.archetype === 'mindchemist') {
        return true; // Mindchemists always have access
    }
    // Base alchemists need the discovery
    return character.character_discoveries?.some((d: CharacterDiscovery) => 
        d.discovery_name === 'cognatogen'
    ) ?? false;
}

// Update buff validation
function validateBuff(character: Character, buffType: KnownBuffType): boolean {
    switch(buffType) {
        case 'int_cognatogen':
        case 'wis_cognatogen':
        case 'cha_cognatogen':
            return (
                character.archetype === 'mindchemist' || 
                (character.character_discoveries?.some(d => 
                    d.discovery_name === 'cognatogen'
                ) ?? false)
            );
        case 'dex_mutagen':
        case 'str_mutagen':
        case 'con_mutagen':
            return character.character_discoveries?.some((d: CharacterDiscovery) => 
                d.discovery_name === 'mutagen'
            ) ?? false;
        default:
            return true;
    }
}

// Export the utility functions so they can be used elsewhere
export { canUseMutagen, canUseCognatogen, validateBuff };