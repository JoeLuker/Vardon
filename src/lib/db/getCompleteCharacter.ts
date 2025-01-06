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
  baseSkillsApi,
  baseClassFeaturesApi,
  baseDiscoveriesApi,
  baseArchetypesApi
} from '$lib/db/baseSubtypes';
import {
  bonusTypesApi,
  skillRankSourcesApi,
  buffTypesApi,
  abpBonusTypesApi,
  favoredClassChoicesApi
} from '$lib/db/references';
import { rpgEntitiesApi } from '$lib/db/rpgEntities';
import {
  archetypeFeatureReplacementsApi,
  entityPrerequisitesApi,
  skillBonusesApi,
  weaponProficienciesApi,
  naturalAttacksApi,
  conditionalBonusesApi
} from '$lib/db/bridging';
import { classSkillRelationsApi } from './bridging';

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
  RpgEntityRow,
  EntityPrerequisiteRow,
  SkillBonusesRow,
  WeaponProficienciesRow,
  NaturalAttacksRow,
  ConditionalBonusesRow,
  ArchetypeFeatureReplacementRow,
  BonusTypeRow,
  SkillRankSourceRow,
  BuffTypeRow,
  AbpBonusTypeRow,
  FavoredClassChoiceRow
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
  // removeEmptyArrays(obj);
  return omitKeysDeep(obj, ['created_at', 'updated_at']);
}

/** The final "CompleteCharacter" interface. */
export interface CompleteCharacter extends Omit<CharacterRow, 'created_at' | 'updated_at'> {

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
  corruption: Array<{ base: BaseCorruptionRow; name: string; [key: string]: any }>;
  wildTalents: Array<{ base: BaseWildTalentRow; name: string; [key: string]: any }>;
  equipment: Array<{ base: BaseEquipmentRow; name: string; [key: string]: any }>;
  ancestralTraits: Array<{ base: BaseAncestralTraitRow; name: string; [key: string]: any }>;
  attributes: Array<{ base: BaseAttributeRow; name: string; [key: string]: any }>;

  classFeatures: Array<{ base: BaseClassFeatureRow; name: string; [key: string]: any }>;

  discoveries: Array<{ base: BaseDiscoveryRow; name: string; [key: string]: any }>;

  archetypes: Array<{
    base: BaseArchetypeRow;
    name: string;
    [key: string]: any;
  }>;

  prerequisites: Record<number, Array<EntityPrerequisiteRow>>;

  skillBonuses: Array<SkillBonusesRow>;

  weaponProficiencies: Array<WeaponProficienciesRow>;

  naturalAttacks: Array<NaturalAttacksRow>;

  conditionalBonuses: Array<ConditionalBonusesRow>;

  archetypeReplacements: Array<ArchetypeFeatureReplacementRow>;

  baseSkills: Array<BaseSkillRow & { name: string }>;

  skillsWithRanks: Array<{
    skillId: number;
    name: string;
    ability: string;
    totalRanks: number;
    rankSources: Array<{
      sourceName: string;
    } & CharacterSkillRanksRow>;
  }>;

  // Group all references under one key, using proper types
  references: {
    bonusTypes: Record<BonusTypeRow['id'], BonusTypeRow['name']>;
    skillRankSources: Record<SkillRankSourceRow['id'], SkillRankSourceRow['name']>;
    buffTypes: Record<BuffTypeRow['id'], BuffTypeRow['name']>;
    abpBonusTypes: Record<AbpBonusTypeRow['id'], AbpBonusTypeRow['name']>;
    favoredClassChoices: Record<`${FavoredClassChoiceRow['id']}-${FavoredClassChoiceRow['id']}`, NonNullable<FavoredClassChoiceRow['name']>>;
  };

  abpBonuses: Array<AbpBonus>;
}

type AbpBonus = {
  bonus_type_id: number;
  value: number;
  choices?: Array<{
    key: string;
    value: string;
  }>;
};

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
    allBaseSkills,
    allPrerequisites,
    allSkillBonuses,
    allWeaponProficiencies,
    allNaturalAttacks,
    allConditionalBonuses,
    allArchetypeReplacements
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
    baseSkillsApi.getAllRows(),
    entityPrerequisitesApi.getAllRows(),
    skillBonusesApi.getAllRows(),
    weaponProficienciesApi.getAllRows(),
    naturalAttacksApi.getAllRows(),
    conditionalBonusesApi.getAllRows(),
    archetypeFeatureReplacementsApi.getAllRows()
  ]);

  // 3) Filter bridging data for this character
  const bridgingEntities: CharacterRpgEntitiesRow[] = allCharRpgEntities.filter(
    (be) => be.character_id === charRow.id
  );

  const bridgingProps: CharRpgEntityPropRow[] = allCharRpgProps.filter((prop) =>
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

  // 6) "Batch fetch" subtypes by IDs
  const [
    ancestries,
    classes,
    feats,
    traits,
    buffs,
    corruption,
    wildTalents,
    equipmentRows,
    attributesRows,
    ancestralTraitRows,
    classFeatures,
    discoveries,
    archetypes
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
    baseAncestralTraitsApi.getRowsByIds(entityIdsByType['ancestral_trait'] || []),
    baseClassFeaturesApi.getRowsByIds(entityIdsByType['class_feature'] || []),
    baseDiscoveriesApi.getRowsByIds(entityIdsByType['discovery'] || []),
    baseArchetypesApi.getRowsByIds(entityIdsByType['archetype'] || [])
  ]);

  // Build quick-lookup maps
  const ancestryMap       = new Map(ancestries.map((r) => [r.id, r]));
  const classMap          = new Map(classes.map((r) => [r.id, r]));
  const featMap           = new Map(feats.map((r) => [r.id, r]));
  const traitMap          = new Map(traits.map((r) => [r.id, r]));
  const buffMap           = new Map(buffs.map((r) => [r.id, r]));
  const corruptionMap     = new Map(corruption.map((r) => [r.id, r]));
  const wildTalentMap     = new Map(wildTalents.map((r) => [r.id, r]));
  const equipmentMap      = new Map(equipmentRows.map((r) => [r.id, r]));
  const attributeMap      = new Map(attributesRows.map((r) => [r.id, r]));
  const ancestralTraitMap = new Map(ancestralTraitRows.map((r) => [r.id, r]));
  const classFeatureMap   = new Map(classFeatures.map((r) => [r.id, r]));
  const discoveryMap      = new Map(discoveries.map((r) => [r.id, r]));
  const archetypeMap      = new Map(archetypes.map((r) => [r.id, r]));

  // Prepare final arrays
  let ancestry: CompleteCharacter['ancestry'] = null;
  const finalClasses: CompleteCharacter['classes']           = [];
  const finalFeats: CompleteCharacter['feats']               = [];
  const finalTraits: CompleteCharacter['traits']             = [];
  const finalBuffs: CompleteCharacter['buffs']               = [];
  const finalCorruption: CompleteCharacter['corruption']   = [];
  const finalWildTalents: CompleteCharacter['wildTalents']   = [];
  const finalEquipment: CompleteCharacter['equipment']       = [];
  const finalAncestralTraits: CompleteCharacter['ancestralTraits'] = [];
  const finalAttributes: CompleteCharacter['attributes']     = [];
  const finalClassFeatures: CompleteCharacter['classFeatures'] = [];
  const finalDiscoveries: CompleteCharacter['discoveries']   = [];
  const finalArchetypes: CompleteCharacter['archetypes']     = [];
  const finalAbpBonuses: CompleteCharacter['abpBonuses'] = [];

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
          // Get class skills for this class
          const classSkillRows = await classSkillRelationsApi.getAllRows();
          const classSkills = classSkillRows
              .filter(r => r.class_id === be.entity_id)
              .map((r: { skill_id: number | null }) => r.skill_id)
              .filter((id): id is number => id !== null);
          
          finalClasses.push({ 
              base: row, 
              name, 
              class_skills: classSkills,
              ...props 
          });
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
          finalCorruption.push({ base: row, name, ...props });
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
      case 'class_feature': {
        const row = classFeatureMap.get(be.entity_id);
        if (row) {
          finalClassFeatures.push({ base: row, name, ...props });
        }
        break;
      }
      case 'discovery': {
        const row = discoveryMap.get(be.entity_id);
        if (row) {
          finalDiscoveries.push({ base: row, name, ...props });
        }
        break;
      }
      case 'archetype': {
        const row = archetypeMap.get(be.entity_id);
        if (row) {
          finalArchetypes.push({ base: row, name, ...props });
        }
        break;
      }
      case 'abp_bonus': {
        const props = getPropsForEntity(be.id);
        const bonus: AbpBonus = {
          bonus_type_id: be.entity_id,
          value: parseInt(props.value || '0', 10),
        };
        
        // Handle choices if they exist
        const choices: Array<{ key: string; value: string }> = [];
        Object.entries(props).forEach(([key, value]) => {
          if (key.startsWith('choice_')) {
            choices.push({
              key: key.replace('choice_', ''),
              value
            });
          }
        });
        
        if (choices.length > 0) {
          bonus.choices = choices;
        }
        
        finalAbpBonuses.push(bonus);
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

    // Get the name from rpgEntityMap instead of assuming it exists on skillDef
    const entityInfo = rpgEntityMap.get(skillDef.id);
    if (!entityInfo) continue;

    // Initialize aggregator if not present
    if (!skillAgg.has(sr.skill_id)) {
      skillAgg.set(sr.skill_id, {
        skillId: sr.skill_id,
        name: entityInfo.name,  // Use name from rpgEntityMap
        ability: skillDef.ability,
        totalRanks: 0
      });
    }
    // For each row, increment totalRanks by 1
    skillAgg.get(sr.skill_id)!.totalRanks += 1;
  }

  // Process prerequisites
  const prerequisites: CompleteCharacter['prerequisites'] = {};
  for (const prereq of allPrerequisites) {
    if (!prerequisites[prereq.entity_id]) {
      prerequisites[prereq.entity_id] = [];
    }
    if (prereq.required_entity_id) {
      prerequisites[prereq.entity_id].push({
        required_entity_id: prereq.required_entity_id,
        prereq_type: prereq.prereq_type,
        prereq_value: prereq.prereq_value,
        id: prereq.id,
        entity_id: prereq.entity_id,
        created_at: prereq.created_at,
        updated_at: prereq.updated_at
      });
    }
  }

  // Process skill bonuses
  const skillBonusesWithTypes = allSkillBonuses
    .filter(bonus => bridgingEntities.some(be => be.entity_id === bonus.entity_id))
    .map(bonus => ({
      id: bonus.id,
      entity_id: bonus.entity_id,
      skill_name: bonus.skill_name,
      bonus: bonus.bonus,
      created_at: bonus.created_at,
      updated_at: bonus.updated_at
    }));

  // Process weapon proficiencies
  const weaponProficiencies = allWeaponProficiencies
    .filter(prof => bridgingEntities.some(be => be.entity_id === prof.entity_id))
    .map(prof => ({
      id: prof.id,
      entity_id: prof.entity_id,
      weapon_name: prof.weapon_name,
      created_at: prof.created_at,
      updated_at: prof.updated_at
    }));

  // Process natural attacks
  const naturalAttacks = allNaturalAttacks
    .filter(attack => bridgingEntities.some(be => be.entity_id === attack.entity_id))
    .map(attack => ({
      id: attack.id,
      entity_id: attack.entity_id,
      attack_type: attack.attack_type,
      damage: attack.damage,
      attack_count: attack.attack_count,
      created_at: attack.created_at,
      updated_at: attack.updated_at
    }));

  // Process conditional bonuses
  const conditionalBonuses = allConditionalBonuses
    .filter(bonus => bridgingEntities.some(be => be.entity_id === bonus.entity_id))
    .map(bonus => ({
      id: bonus.id,
      entity_id: bonus.entity_id,
      bonus_type_id: bonus.bonus_type_id,
      bonus_type_name: bonusTypeMap.get(bonus.bonus_type_id) || '',
      value: bonus.value,
      apply_to: bonus.apply_to,
      condition: bonus.condition,
      created_at: bonus.created_at,
      updated_at: bonus.updated_at
    }));

  // Process archetype replacements
  const archetypeReplacements = allArchetypeReplacements
    .filter(replacement => 
      bridgingEntities.some(be => be.entity_id === replacement.archetype_id)
    )
    .map(replacement => ({
      id: replacement.id,
      archetype_id: replacement.archetype_id,
      replaced_feature_id: replacement.replaced_feature_id,
      new_feature_id: replacement.new_feature_id,
      replacement_level: replacement.replacement_level,
      created_at: replacement.created_at,
      updated_at: replacement.updated_at
    }));

  // Create lookup maps for references
  const bonusTypeMap = new Map(allBonusTypes.map(bt => [bt.id, bt.name]));
  const skillRankSourceMap = new Map(allSkillRankSources.map(src => [src.id, src.name]));
  const buffTypeMap = new Map(allBuffTypes.map(bt => [bt.id, bt.name]));
  const abpBonusTypeMap = new Map(allAbpBonusTypes.map(bt => [bt.id, bt.name]));
  const favoredClassChoiceMap = new Map(
    allFavoredClassChoices.map(fcc => [
      fcc.id,
      fcc.name ?? ''
    ])
  );

  // Build skill data with rank sources
  const skillsWithRanks = [...skillAgg.values()].map(skill => ({
    ...skill,
    rankSources: skillRanksForChar
      .filter(sr => sr.skill_id === skill.skillId)
      .map(sr => ({
        ...sr,
        sourceName: skillRankSourceMap.get(sr.source_id ?? 0) ?? ''
      }))
  }));

  // Process buffs with type names
  const buffWithTypes = finalBuffs.map(buff => ({
    ...buff,
    base: {
      ...buff.base,
      buffTypeName: buffTypeMap.get(buff.base.buff_type_id ?? 0) ?? ''
    }
  }));

  // Add names to base skills
  const baseSkillsWithNames = allBaseSkills.map(skill => ({
    ...skill,
    name: rpgEntityMap.get(skill.id)?.name ?? ''
  }));

  // 10) Construct the final object
  const finalObj = {
    id: charRow.id,
    name: charRow.name,
    current_hp: charRow.current_hp,
    max_hp: charRow.max_hp,
    is_offline: charRow.is_offline,
    ancestry,
    classes: finalClasses,
    feats: finalFeats,
    traits: finalTraits,
    buffs: buffWithTypes,
    corruption: finalCorruption,
    wildTalents: finalWildTalents,
    equipment: finalEquipment,
    ancestralTraits: finalAncestralTraits,
    attributes: finalAttributes,
    classFeatures: finalClassFeatures,
    discoveries: finalDiscoveries,
    archetypes: finalArchetypes,
    prerequisites,
    baseSkills: baseSkillsWithNames,
    skillsWithRanks,
    skillBonuses: skillBonusesWithTypes,
    references: {
      bonusTypes: Object.fromEntries(bonusTypeMap),
      skillRankSources: Object.fromEntries(skillRankSourceMap),
      buffTypes: Object.fromEntries(buffTypeMap),
      abpBonusTypes: Object.fromEntries(abpBonusTypeMap),
      favoredClassChoices: Object.fromEntries(favoredClassChoiceMap)
    },
    weaponProficiencies,
    naturalAttacks,
    conditionalBonuses,
    archetypeReplacements,
    abpBonuses: finalAbpBonuses
  };

  // 11) Clean up (remove empty arrays, omit timestamps)
  return cleanUpObject(finalObj);
}
