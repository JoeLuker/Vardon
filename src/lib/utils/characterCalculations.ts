// src/lib/utils/characterCalculations.ts
import type { 
    Character, 
    CharacterAttributes, 
    KnownBuffType,
    CharacterSkillRank,
    DbTables,
    CharacterEquipmentProperties,
    DatabaseCharacterAbpBonus
} from '$lib/types/character';
import { getABPBonuses, type ABPBonuses } from '$lib/types/abp';
import type { Buff, BuffEffect, AttributeEffect, ArmorEffect, AttackEffect } from '$lib/types/buffs';
import { BUFF_CONFIG } from '$lib/state/buffs.svelte';

// Type guards for BuffEffect
function isAttributeEffect(effect: BuffEffect): effect is AttributeEffect {
    return 'attribute' in effect && 'modifier' in effect;
}

function isArmorEffect(effect: BuffEffect): effect is ArmorEffect {
    return 'naturalArmor' in effect;
}

function isAttackEffect(effect: BuffEffect): effect is AttackEffect {
    return 'attackRoll' in effect || 'damageRoll' in effect || 
           'mainHandPenalty' in effect || 'offHandPenalty' in effect || 
           'extraAttack' in effect;
}

type CharacterEquipment = DbTables['character_equipment']['Row'];
type CharacterDiscovery = DbTables['character_discoveries']['Row'];

export interface CalculatedStats {
  attributes: {
      base: CharacterAttributes;
      permanent: CharacterAttributes;
      temporary: CharacterAttributes;
      modifiers: {
          permanent: CharacterAttributes;
          temporary: CharacterAttributes;
      };
      bonuses: {
          ancestry: {
              source: string;
              values: Partial<CharacterAttributes>;
          };
          abp: {
              mental: {
                  attribute: keyof CharacterAttributes;
                  value: number;
              } | null;
              physical: {
                  attribute: keyof CharacterAttributes;
                  value: number;
              } | null;
          };
          buffs: {
              source: string;
              values: Partial<CharacterAttributes>;
          }[];
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
      abpBonuses: ABPBonuses;
      armorCheckPenalty: number;
      naturalArmorBonus?: number;
      equipmentBonuses?: {
          armor: number;
          maxDex: number | null;
          checkPenalty: number;
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

export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

function getABPBonus(
    abpBonuses: DatabaseCharacterAbpBonus[] | undefined,
    bonusType: DatabaseCharacterAbpBonus['bonus_type']
): number {
    return abpBonuses?.find(b => b.bonus_type === bonusType)?.value ?? 0;
}

// Calculate attributes as before
function calculateAttributes(
  character: Character,
  activeBuffs: KnownBuffType[]
): CalculatedStats['attributes'] {
  const baseAttributes = character.character_attributes?.[0] ?? {
      str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10
  };

  const permanent = { ...baseAttributes };
  
  const primaryAncestry = character.character_ancestries?.find(ca => ca.is_primary);
  const ancestryModifiers = primaryAncestry?.ancestry?.ability_modifiers ?? {};
  
  Object.entries(ancestryModifiers).forEach(([ability, modifier]) => {
    const key = ability.toLowerCase() as keyof CharacterAttributes;
    permanent[key] += modifier;
  });

  const mentalProwessBonus = getABPBonus(character.character_abp_bonuses, 'mental_prowess');
  const physicalProwessBonus = getABPBonus(character.character_abp_bonuses, 'physical_prowess');

  const mentalProwessChoice = character.character_abp_bonuses?.find(b => 
    b.bonus_type === 'mental_prowess_choice'
  )?.value_target ?? 'int';

  const physicalProwessChoice = character.character_abp_bonuses?.find(b => 
    b.bonus_type === 'physical_prowess_choice'
  )?.value_target ?? 'dex';

  if (mentalProwessBonus > 0) {
    permanent[mentalProwessChoice as keyof CharacterAttributes] += mentalProwessBonus;
  }
  if (physicalProwessBonus > 0) {
    permanent[physicalProwessChoice as keyof CharacterAttributes] += physicalProwessBonus;
  }

  const temporary = { ...permanent };
  const buffBonuses: CalculatedStats['attributes']['bonuses']['buffs'] = [];
  
  activeBuffs.forEach(buffName => {
    const buff = BUFF_CONFIG.find((b: Buff) => b.name === buffName);
    if (buff) {
      const buffValues: Partial<CharacterAttributes> = {};
      buff.effects.forEach((effect: BuffEffect) => {
        // Use type guards to ensure effect is AttributeEffect before accessing attribute/modifier
        if (isAttributeEffect(effect)) {
          temporary[effect.attribute as keyof CharacterAttributes] += effect.modifier;
          buffValues[effect.attribute as keyof CharacterAttributes] = effect.modifier;
        }
        // If you need to handle other effect types (ArmorEffect, AttackEffect), do so here.
      });
      if (Object.keys(buffValues).length > 0) {
        buffBonuses.push({
          source: buff.label,
          values: buffValues
        });
      }
    }
  });

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
    },
    bonuses: {
      ancestry: {
        source: primaryAncestry?.ancestry?.name ?? 'Ancestry',
        values: ancestryModifiers
      },
      abp: {
        mental: mentalProwessBonus > 0 ? {
          attribute: mentalProwessChoice as keyof CharacterAttributes,
          value: mentalProwessBonus
        } : null,
        physical: physicalProwessBonus > 0 ? {
          attribute: physicalProwessChoice as keyof CharacterAttributes,
          value: physicalProwessBonus
        } : null
      },
      buffs: buffBonuses
    }
  };
}

function calculateCombat(
  character: Character,
  attributes: CalculatedStats['attributes'],
  activeBuffs: KnownBuffType[]
): CalculatedStats['combat'] {
  const mods = calculateCombatMods(activeBuffs);
  const bab = character.character_combat_stats?.[0]?.base_attack_bonus ?? 0;

  return {
      initiative: attributes.modifiers.temporary.dex + mods.initiative,
      baseAttackBonus: bab,
      attacks: {
          melee: {
              bonus: formatAttackBonus(
                  bab + attributes.modifiers.temporary.str + mods.attack,
                  bab,
                  mods.extraAttacks.melee
              ),
              damage: formatDamageBonus(attributes.modifiers.temporary.str + mods.damage)
          },
          ranged: {
              bonus: formatAttackBonus(
                  bab + attributes.modifiers.temporary.dex + mods.attack,
                  bab,
                  mods.extraAttacks.ranged
              ),
              damage: formatDamageBonus(mods.damage)
          }
      },
      combatManeuver: {
          bonus: bab + attributes.modifiers.temporary.str + mods.cmb,
          defense: 10 + attributes.modifiers.temporary.str + 
                  attributes.modifiers.temporary.dex + mods.cmd
      }
  };
}

function calculateArmorBonuses(equipment: CharacterEquipment[] = []): {
  armor: number;
  maxDex: number | null;
  checkPenalty: number;
} {
  let totalArmor = 0;
  let maxDex: number | null = null;
  let checkPenalty = 0;

  equipment.forEach(item => {
      if (item.equipped && item.properties) {
          const props = item.properties as CharacterEquipmentProperties;
          if (props.armor_bonus) {
              totalArmor += props.armor_bonus;
          }
          if (props.max_dex !== undefined) {
              maxDex = maxDex === null ? props.max_dex : Math.min(maxDex, props.max_dex);
          }
          if (props.armor_check_penalty) {
              checkPenalty += props.armor_check_penalty;
          }
      }
  });

  return {
      armor: totalArmor,
      maxDex,
      checkPenalty
  };
}

function calculateDefenses(
  attributes: CalculatedStats['attributes'],
  activeBuffs: KnownBuffType[],
  character: Character
): CalculatedStats['defenses'] {
  let abpBonuses = getABPBonuses(character.character_abp_bonuses ?? []);
  
  const equipmentBonuses = calculateArmorBonuses(character.character_equipment ?? []);
  
  let naturalArmorBonus = 0;

  activeBuffs.forEach(buffName => {
      const buff = BUFF_CONFIG.find((b: Buff) => b.name === buffName);
      if (buff) {
          // Check for armor effect
          const naturalArmorEffect = buff.effects.find(e => isArmorEffect(e));
          if (naturalArmorEffect && isArmorEffect(naturalArmorEffect)) {
              naturalArmorBonus = Math.max(naturalArmorBonus, naturalArmorEffect.naturalArmor);
          }
      }
  });

  const mods = calculateCombatMods(activeBuffs);

  const effectiveDexMod = equipmentBonuses.maxDex !== null 
    ? Math.min(attributes.modifiers.temporary.dex, equipmentBonuses.maxDex)
    : attributes.modifiers.temporary.dex;

  return {
      ac: {
          normal: 10 + effectiveDexMod + mods.ac.normal + abpBonuses.armor + abpBonuses.deflection + naturalArmorBonus + equipmentBonuses.armor,
          touch: 10 + effectiveDexMod + mods.ac.touch + abpBonuses.deflection,
          flatFooted: 10 + mods.ac.flatFooted + abpBonuses.armor + abpBonuses.deflection + naturalArmorBonus + equipmentBonuses.armor
      },
      saves: {
          fortitude: 2 + attributes.modifiers.temporary.con + mods.saves.fort + abpBonuses.resistance,
          reflex: 2 + effectiveDexMod + mods.saves.ref + abpBonuses.resistance,
          will: 2 + attributes.modifiers.temporary.wis + mods.saves.will + abpBonuses.resistance
      },
      abpBonuses: abpBonuses,
      armorCheckPenalty: equipmentBonuses.checkPenalty,
      naturalArmorBonus: naturalArmorBonus,
      equipmentBonuses: equipmentBonuses
  };
}

interface SkillRanksByLevel {
    total: number;
    byLevel: Record<number, {
        ranks: number;
        source: string;
    }[]>;
}

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

    for (let i = 1; i <= level; i++) {
        byLevel[i] = [];
    }

    ranks.forEach(rank => {
        byLevel[rank.applied_at_level].push({
            ranks: rank.ranks,
            source: rank.source
        });
        total += rank.ranks;
    });

    return { total, byLevel };
}

function calculateSkills(
    character: Character,
    attributes: CalculatedStats['attributes']
): CalculatedStats['skills'] {
    const skillsByName: CalculatedStats['skills']['byName'] = {};
    const skillsByLevel: CalculatedStats['skills']['byLevel'] = {};

    if (!character.base_skills) {
        return { byName: skillsByName, byLevel: skillsByLevel };
    }

    // Check if character has Breadth of Experience feat
    const hasBreadthOfExperience = character.character_feats?.some(feat => 
        feat.feat_name.toLowerCase() === 'breadth of experience'
    ) ?? false;

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
            remaining: 0
        };
    }

    character.base_skills.forEach(baseSkill => {
        const rankInfo = getRanksUpToLevel(
            character.character_skill_ranks,
            baseSkill.id,
            character.level
        );
        
        const isClassSkill = character.class_skill_relations?.some(
            relation => relation.skill_id === baseSkill.id
        ) ?? false;

        const abilityMod = attributes.modifiers.temporary[
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

        // Perfect Recall for Mindchemist on Knowledge checks
        let perfectRecallBonus = 0;
        if (
          character.archetype === 'mindchemist' && 
          character.level >= 2 &&
          baseSkill.name.startsWith('Knowledge')
        ) {
            perfectRecallBonus = abilityMod;
        }

        // Breadth of Experience: +2 on Knowledge and Profession checks
        let breadthBonus = 0;
        if (hasBreadthOfExperience && 
           (baseSkill.name.startsWith('Knowledge') || baseSkill.name.startsWith('Profession'))) {
            breadthBonus = 2;
        }

        // Calculate total skill bonus
        const total = rankInfo.total + abilityMod + classSkillBonus + armorCheckPenalty + miscMod + perfectRecallBonus + breadthBonus;

        // Add up ranks used at each level
        Object.entries(rankInfo.byLevel).forEach(([level, ranksAtLevel]) => {
            const totalRanksAtLevel = ranksAtLevel.reduce((sum, r) => sum + r.ranks, 0);
            skillsByLevel[Number(level)].used += totalRanksAtLevel;
        });

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
          damage: `${Math.ceil(level/2)}d6 + ${attributes.modifiers.temporary.int}`,
          splash: Math.ceil(level/2) + attributes.modifiers.temporary.int
      },
      extracts: Object.fromEntries(
          Array.from({ length: 6 }, (_, i) => i + 1).map(lvl => [
              lvl,
              {
                  perDay: calculateExtractsPerDay(character.level, intModifier, lvl),
                  prepared: 0,
                  used: 0
              }
          ])
      )
  };
}

export function calculateCharacterStats(character: Character): CalculatedStats {
  const activeBuffs = character.character_buffs
    ?.filter(b => b.is_active)
    .map(b => b.buff_type as KnownBuffType) ?? [];

  const attributes = calculateAttributes(character, activeBuffs);
  
  return {
    attributes,
    combat: calculateCombat(character, attributes, activeBuffs),
    defenses: calculateDefenses(attributes, activeBuffs, character),
    skills: calculateSkills(character, attributes),
    resources: calculateResources(character, attributes)
  };
}

function calculateArmorCheckPenalty(equipment: CharacterEquipment[] = []): number {
  const equippedArmor = equipment.find(e => e.type === 'armor' && e.equipped);
  return (equippedArmor?.properties as CharacterEquipmentProperties)?.armor_check_penalty ?? 0;
}

function formatAttackBonus(total: number, bab: number, extraAttacks: number = 0): string {
    const sign = total >= 0 ? '+' : '';
    let display = `${sign}${total}`;
    const iterations = Math.floor(bab / 5) - 1;
    for (let i = 1; i <= iterations; i++) {
        display += ` / ${sign}${total - (5 * i)}`;
    }
    for (let i = 0; i < extraAttacks; i++) {
        display += ` / ${sign}${total}`;
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

  equipment.forEach(item => {
      const props = item.properties as CharacterEquipmentProperties;
      if (item.equipped && props?.skill_bonus?.skill === skillName) {
          modifier += props.skill_bonus.value;
      }
  });

  feats.forEach(feat => {
      const props = feat.properties as CharacterEquipmentProperties;
      if (props?.skill_bonus?.skill === skillName) {
          modifier += props.skill_bonus.value;
      }
  });

  return modifier;
}

interface CombatMods {
  initiative: number;
  attack: number;
  damage: number;
  extraAttacks: {
    melee: number;
    ranged: number;
  };
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

function calculateCombatMods(activeBuffs: KnownBuffType[]): CombatMods {
    const mods: CombatMods = {
        initiative: 0,
        attack: 0,
        damage: 0,
        extraAttacks: {
            melee: 0,
            ranged: 0
        },
        cmb: 0,
        cmd: 0,
        ac: { normal: 0, touch: 0, flatFooted: 0 },
        saves: { fort: 0, ref: 0, will: 0 }
    };

    activeBuffs.forEach(buff => {
        switch(buff) {
            case 'deadly_aim':
                mods.attack -= 2;
                mods.damage += 4;
                break;
            case 'rapid_shot':
                mods.attack -= 2;
                mods.extraAttacks.ranged += 1;
                break;
            case 'two_weapon_fighting':
                mods.attack -= 2;
                mods.extraAttacks.melee += 1;
                mods.extraAttacks.ranged += 1;
                break;
        }
    });

    return mods;
}

export function calculateTotalSkillPoints(character: Character): number {
    const basePoints = 4;
    const baseInt = character.character_attributes?.[0]?.int ?? 10;
    const mentalProwessBonus = getABPBonus(character.character_abp_bonuses, 'mental_prowess');
    const permanentInt = baseInt + mentalProwessBonus;
    const intBonus = Math.floor((permanentInt - 10) / 2);
    const fcbSkillPoints = (character.character_favored_class_bonuses ?? [])
        .filter(fcb => fcb.choice === 'skill')
        .length;
    const pointsPerLevel = Math.max(1, basePoints + intBonus);
    return (pointsPerLevel * character.level) + fcbSkillPoints;
}

function canUseMutagen(character: Character): boolean {
    if (character.archetype === 'mindchemist') {
        return character.character_discoveries?.some((d: CharacterDiscovery) => 
            d.discovery_name === 'mutagen'
        ) ?? false;
    }
    return true;
}

function canUseCognatogen(character: Character): boolean {
    if (character.archetype === 'mindchemist') {
        return true;
    }
    return character.character_discoveries?.some((d: CharacterDiscovery) => 
        d.discovery_name === 'cognatogen'
    ) ?? false;
}

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

export { canUseMutagen, canUseCognatogen, validateBuff };
