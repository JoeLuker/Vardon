/******************************************************************************
 * FILE: src/lib/db/getCompleteCharacter.ts
 *
 * Returns a "CompleteCharacter" object with:
 *  - The main Character row
 *  - Subtypes (ancestry, classes, feats, buffs, etc.)
 *  - Bridging properties (like selected_level, archetype, etc.)
 *  - References (bonusTypes, buffTypes, etc.) if desired
 *****************************************************************************/

import { charactersApi } from '$lib/db/characters';
import {
  characterRpgEntitiesApi,
  characterRpgEntityPropsApi,
  characterSkillRanksApi
} from '$lib/db/bridging';
import {
  baseAncestriesApi,
  baseClassesApi,
  baseFeatsApi,
  baseTraitsApi,
  baseBuffsApi,
  baseCorruptionsApi,
  baseWildTalentsApi,
  baseEquipmentApi,
  baseAttributesApi,
  baseAncestralTraitsApi,
  baseSkillsApi
} from '$lib/db/baseSubtypes';
import {
  bonusTypesApi,
  skillRankSourcesApi,
  buffTypesApi,
  abpBonusTypesApi,
  favoredClassChoicesApi
} from '$lib/db/references';
import { rpgEntitiesApi } from '$lib/db/rpgEntities';

import type {
  CharacterRow,
  CharacterRpgEntitiesRow,
  CharRpgEntityPropRow,
  CharacterSkillRanksRow,
  BaseAncestryRow,
  BaseClassRow,
  BaseArchetypeRow,
  BaseFeatRow,
  BaseTraitRow,
  BaseBuffRow,
  BaseCorruptionRow,
  BaseDiscoveryRow,
  BaseWildTalentRow,
  BaseEquipmentRow,
  BaseAttributeRow,
  BaseAncestralTraitRow,
  BaseClassFeatureRow,
  BaseSkillRow,
  RpgEntityRow
} from '$lib/db';

/** Helper to remove empty arrays in the final object. */
function removeEmptyArrays(obj: Record<string, any>): void {
  for (const key of Object.keys(obj)) {
    if (Array.isArray(obj[key]) && obj[key].length === 0) {
      delete obj[key];
    }
  }
}

/** Helper to recursively omit certain keys (like created_at, updated_at). */
function omitKeysDeep<T>(obj: T, keysToOmit: string[]): T {
  if (Array.isArray(obj)) {
    return obj.map((item) => omitKeysDeep(item, keysToOmit)) as unknown as T;
  }
  if (obj && typeof obj === 'object') {
    const newObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (!keysToOmit.includes(key)) {
        newObj[key] = omitKeysDeep(value, keysToOmit);
      }
    }
    return newObj as T;
  }
  return obj;
}

/** Remove empty arrays and omit timestamps. */
function cleanUpObject<T extends Record<string, any>>(obj: T): T {
  removeEmptyArrays(obj);
  return omitKeysDeep(obj, ['created_at', 'updated_at']);
}

/** The final “CompleteCharacter” interface. */
export interface CompleteCharacter {
  character: CharacterRow;

  ancestry: {
    base: BaseAncestryRow;
    name: string;
    [key: string]: any;
  } | null;

  classes: Array<{
    base: BaseClassRow;
    name: string;
    [key: string]: any;
  }>;

  feats: Array<{ base: BaseFeatRow; name: string; [key: string]: any }>;
  traits: Array<{ base: BaseTraitRow; name: string; [key: string]: any }>;
  buffs: Array<{ base: BaseBuffRow; name: string; [key: string]: any }>;
  corruptions: Array<{ base: BaseCorruptionRow; name: string; [key: string]: any }>;
  wildTalents: Array<{ base: BaseWildTalentRow; name: string; [key: string]: any }>;
  equipment: Array<{ base: BaseEquipmentRow; name: string; [key: string]: any }>;
  ancestralTraits: Array<{ base: BaseAncestralTraitRow; name: string; [key: string]: any }>;
  attributes: Array<{ base: BaseAttributeRow; name: string; [key: string]: any }>;

  skills: Array<{
    skillId: number;
    name: string;
    ability: string;
    totalRanks: number;
  }>;
}

/**
 * Fetch and assemble a complete character by ID.
 */
export async function getCompleteCharacter(characterId: number): Promise<CompleteCharacter | null> {
  // 1) Fetch main character row
  const charRow = await charactersApi.getRowById(characterId);
  if (!charRow) return null;

  // 2) Fetch bridging data & references in parallel
  const [
    allCharRpgEntities,
    allCharRpgProps,
    allSkillRanks,
    allRpgEntities,
    allBonusTypes,
    allSkillRankSources,
    allBuffTypes,
    allAbpBonusTypes,
    allFavoredClassChoices,
    allBaseSkills
  ] = await Promise.all([
    characterRpgEntitiesApi.getAllRows(),
    characterRpgEntityPropsApi.getAllRows(),
    characterSkillRanksApi.getAllRows(),
    rpgEntitiesApi.getAllRows(), // We do have an rpgEntitiesApi
    bonusTypesApi.getAllRows(),
    skillRankSourcesApi.getAllRows(),
    buffTypesApi.getAllRows(),
    abpBonusTypesApi.getAllRows(),
    favoredClassChoicesApi.getAllRows(),
    baseSkillsApi.getAllRows()
  ]);

  // 3) Filter bridging data for this character
  const bridgingEntities = allCharRpgEntities.filter(
    (be) => be.character_id === charRow.id
  );
  const bridgingProps = allCharRpgProps.filter((prop) =>
    bridgingEntities.some((be) => be.id === prop.character_rpg_entity_id)
  );
  const skillRanksForChar = allSkillRanks.filter(
    (sr) => sr.character_id === charRow.id
  );

  // 4) Build an RpgEntity map: entity_id -> { type, name, description }
  const rpgEntityMap = new Map<number, { type: string; name: string; description: string }>(
    allRpgEntities.map((e: RpgEntityRow) => [
      e.id,
      {
        type: e.entity_type,
        name: e.name,
        description: e.description ?? ''
      }
    ])
  );

  // Helper to gather bridging props for a bridgingEntityId
  function getPropsForEntity(bridgingEntityId: number): Record<string, string> {
    const relevantProps = bridgingProps.filter(
      (p) => p.character_rpg_entity_id === bridgingEntityId
    );
    const out: Record<string, string> = {};
    for (const rp of relevantProps) {
      out[rp.property_key] = rp.property_value;
    }
    return out;
  }

  // 5) Group bridging entities by entity_type, so we can batch-fetch subtypes
  const entityIdsByType: Record<string, number[]> = {};
  for (const be of bridgingEntities) {
    const eInfo = rpgEntityMap.get(be.entity_id);
    if (!eInfo) continue; // If an RpgEntity is missing, skip
    const { type } = eInfo;
    if (!entityIdsByType[type]) entityIdsByType[type] = [];
    entityIdsByType[type].push(be.entity_id);
  }

  // 6) “Batch fetch” subtypes by IDs
  const [
    ancestries,
    classes,
    feats,
    traits,
    buffs,
    corruptions,
    wildTalents,
    equipmentRows,
    attributesRows,
    ancestralTraitRows
  ] = await Promise.all([
    baseAncestriesApi.getRowsByIds(entityIdsByType['ancestry'] || []),
    baseClassesApi.getRowsByIds(entityIdsByType['class'] || []),
    baseFeatsApi.getRowsByIds(entityIdsByType['feat'] || []),
    baseTraitsApi.getRowsByIds(entityIdsByType['trait'] || []),
    baseBuffsApi.getRowsByIds(entityIdsByType['buff'] || []),
    baseCorruptionsApi.getRowsByIds(entityIdsByType['corruption'] || []),
    baseWildTalentsApi.getRowsByIds(entityIdsByType['wild_talent'] || []),
    baseEquipmentApi.getRowsByIds(entityIdsByType['equipment'] || []),
    baseAttributesApi.getRowsByIds(entityIdsByType['attribute'] || []),
    baseAncestralTraitsApi.getRowsByIds(entityIdsByType['ancestral_trait'] || [])
  ]);

  // Build quick-lookup maps
  const ancestryMap       = new Map(ancestries.map((r) => [r.id, r]));
  const classMap          = new Map(classes.map((r) => [r.id, r]));
  const featMap           = new Map(feats.map((r) => [r.id, r]));
  const traitMap          = new Map(traits.map((r) => [r.id, r]));
  const buffMap           = new Map(buffs.map((r) => [r.id, r]));
  const corruptionMap     = new Map(corruptions.map((r) => [r.id, r]));
  const wildTalentMap     = new Map(wildTalents.map((r) => [r.id, r]));
  const equipmentMap      = new Map(equipmentRows.map((r) => [r.id, r]));
  const attributeMap      = new Map(attributesRows.map((r) => [r.id, r]));
  const ancestralTraitMap = new Map(ancestralTraitRows.map((r) => [r.id, r]));

  // Prepare final arrays
  let ancestry: CompleteCharacter['ancestry'] = null;
  const finalClasses: CompleteCharacter['classes']           = [];
  const finalFeats: CompleteCharacter['feats']               = [];
  const finalTraits: CompleteCharacter['traits']             = [];
  const finalBuffs: CompleteCharacter['buffs']               = [];
  const finalCorruptions: CompleteCharacter['corruptions']   = [];
  const finalWildTalents: CompleteCharacter['wildTalents']   = [];
  const finalEquipment: CompleteCharacter['equipment']       = [];
  const finalAncestralTraits: CompleteCharacter['ancestralTraits'] = [];
  const finalAttributes: CompleteCharacter['attributes']     = [];

  // 7) Loop bridgingEntities, tie them to subtypes with bridging props
  for (const be of bridgingEntities) {
    const eInfo = rpgEntityMap.get(be.entity_id);
    if (!eInfo) continue; // missing RpgEntity
    const { type, name } = eInfo;
    const props = getPropsForEntity(be.id);

    switch (type) {
      case 'ancestry': {
        const row = ancestryMap.get(be.entity_id);
        if (row) {
          ancestry = { base: row, name, ...props };
        }
        break;
      }
      case 'class': {
        const row = classMap.get(be.entity_id);
        if (row) {
          finalClasses.push({ base: row, name, ...props });
        }
        break;
      }
      case 'feat': {
        const row = featMap.get(be.entity_id);
        if (row) {
          finalFeats.push({ base: row, name, ...props });
        }
        break;
      }
      case 'trait': {
        const row = traitMap.get(be.entity_id);
        if (row) {
          finalTraits.push({ base: row, name, ...props });
        }
        break;
      }
      case 'buff': {
        const row = buffMap.get(be.entity_id);
        if (row) {
          finalBuffs.push({ base: row, name, ...props });
        }
        break;
      }
      case 'corruption': {
        const row = corruptionMap.get(be.entity_id);
        if (row) {
          finalCorruptions.push({ base: row, name, ...props });
        }
        break;
      }
      case 'wild_talent': {
        const row = wildTalentMap.get(be.entity_id);
        if (row) {
          finalWildTalents.push({ base: row, name, ...props });
        }
        break;
      }
      case 'equipment': {
        const row = equipmentMap.get(be.entity_id);
        if (row) {
          finalEquipment.push({ base: row, name, ...props });
        }
        break;
      }
      case 'attribute': {
        const row = attributeMap.get(be.entity_id);
        if (row) {
          finalAttributes.push({ base: row, name, ...props });
        }
        break;
      }
      case 'ancestral_trait': {
        const row = ancestralTraitMap.get(be.entity_id);
        if (row) {
          finalAncestralTraits.push({ base: row, name, ...props });
        }
        break;
      }
      default:
        break;
    }
  }

  // 8) Build skill data
  const baseSkillMap = new Map(allBaseSkills.map((s) => [s.id, s]));
  const skillAgg = new Map<number, {
    skillId: number;
    name: string;
    ability: string;
    totalRanks: number;
  }>();

  for (const sr of skillRanksForChar) {
    const skillDef = baseSkillMap.get(sr.skill_id);
    if (!skillDef) continue;

    // Initialize aggregator if not present
    if (!skillAgg.has(sr.skill_id)) {
      skillAgg.set(sr.skill_id, {
        skillId: sr.skill_id,
        name: rpgEntityMap.get(skillDef.id)?.name ?? '',
        ability: skillDef.ability,
        totalRanks: 0
      });
    }
    // For each row, increment totalRanks by 1
    skillAgg.get(sr.skill_id)!.totalRanks += 1;
  }
  const skills = [...skillAgg.values()];

  // 9) references (optional)
  const references = {
    bonusTypes: allBonusTypes,
    skillRankSources: allSkillRankSources,
    buffTypes: allBuffTypes,
    abpBonusTypes: allAbpBonusTypes,
    favoredClassChoices: allFavoredClassChoices
  };

  // 10) Construct the final object
  const finalObj = {
    character: charRow,
    ancestry,
    classes: finalClasses,
    feats: finalFeats,
    traits: finalTraits,
    buffs: finalBuffs,
    corruptions: finalCorruptions,
    wildTalents: finalWildTalents,
    equipment: finalEquipment,
    ancestralTraits: finalAncestralTraits,
    attributes: finalAttributes,
    skills
    // references, // uncomment if you want them in the final data
  };

  // 11) Clean up (remove empty arrays, omit timestamps)
  return cleanUpObject(finalObj);
}
