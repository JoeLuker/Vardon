/******************************************************************************
 * FILE: src/lib/db/references.ts
 *
 * Central location for:
 *   - Table Row / Insert / Update types
 *   - createDbApi calls for each table
 *
 * Provides a single 'dbApis' aggregator if you want a one-stop shop for all
 * references. Otherwise, you can still import each <Xyz>Api individually.
 *****************************************************************************/

import { createDbApi } from './genericApi';

/** The main supabase-generated Database type. */
export type { Database } from '$lib/domain/types/supabase';
import type { Database as Db } from '$lib/domain/types/supabase';

/** Just for easier reference in the file below. */
type PublicTables = Db['public']['Tables'];

// -----------------------------------------------------------------------------
// 1) HELPER: Make typed exports a bit shorter
// -----------------------------------------------------------------------------
type RowOf<K extends keyof PublicTables> = PublicTables[K]['Row'];
type InsertOf<K extends keyof PublicTables> = PublicTables[K]['Insert'];
type UpdateOf<K extends keyof PublicTables> = PublicTables[K]['Update'] | { id?: number };

// -----------------------------------------------------------------------------
// 2) Example: Ancestral Trait
// -----------------------------------------------------------------------------
export type AncestralTraitRow    = RowOf<'ancestral_trait'>;
export type AncestralTraitInsert = InsertOf<'ancestral_trait'>;
export type AncestralTraitUpdate = UpdateOf<'ancestral_trait'>;

export const ancestralTraitApi = createDbApi<
  AncestralTraitRow,
  AncestralTraitInsert,
  AncestralTraitUpdate
>('ancestral_trait');

// -----------------------------------------------------------------------------
// 3) Example: Ancestry
// -----------------------------------------------------------------------------
export type AncestryRow    = RowOf<'ancestry'>;
export type AncestryInsert = InsertOf<'ancestry'>;
export type AncestryUpdate = UpdateOf<'ancestry'>;

export const ancestryApi = createDbApi<
  AncestryRow,
  AncestryInsert,
  AncestryUpdate
>('ancestry');

// -----------------------------------------------------------------------------
// 4) Archetype
// -----------------------------------------------------------------------------
export type ArchetypeRow    = RowOf<'archetype'>;
export type ArchetypeInsert = InsertOf<'archetype'>;
export type ArchetypeUpdate = UpdateOf<'archetype'>;

export const archetypeApi = createDbApi<
  ArchetypeRow,
  ArchetypeInsert,
  ArchetypeUpdate
>('archetype');

// -----------------------------------------------------------------------------
// 5) Attribute
// -----------------------------------------------------------------------------
export type AttributeRow    = RowOf<'attribute'>;
export type AttributeInsert = InsertOf<'attribute'>;
export type AttributeUpdate = UpdateOf<'attribute'>;

export const attributeApi = createDbApi<
  AttributeRow,
  AttributeInsert,
  AttributeUpdate
>('attribute');

// -----------------------------------------------------------------------------
// 6) Buff
// -----------------------------------------------------------------------------
export type BuffRow    = RowOf<'buff'>;
export type BuffInsert = InsertOf<'buff'>;
export type BuffUpdate = UpdateOf<'buff'>;

export const buffApi = createDbApi<
  BuffRow,
  BuffInsert,
  BuffUpdate
>('buff');

// -----------------------------------------------------------------------------
// 7) Class
// -----------------------------------------------------------------------------
export type ClassRow    = RowOf<'class'>;
export type ClassInsert = InsertOf<'class'>;
export type ClassUpdate = UpdateOf<'class'>;

export const classApi = createDbApi<
  ClassRow,
  ClassInsert,
  ClassUpdate
>('class');

// -----------------------------------------------------------------------------
// 8) Class Feature
// -----------------------------------------------------------------------------
export type ClassFeatureRow    = RowOf<'class_feature'>;
export type ClassFeatureInsert = InsertOf<'class_feature'>;
export type ClassFeatureUpdate = UpdateOf<'class_feature'>;

export const classFeatureApi = createDbApi<
  ClassFeatureRow,
  ClassFeatureInsert,
  ClassFeatureUpdate
>('class_feature');

// -----------------------------------------------------------------------------
// 9) Class Skill
// -----------------------------------------------------------------------------
export type ClassSkillRow    = RowOf<'class_skill'>;
export type ClassSkillInsert = InsertOf<'class_skill'>;
export type ClassSkillUpdate = UpdateOf<'class_skill'>;

export const classSkillApi = createDbApi<
  ClassSkillRow,
  ClassSkillInsert,
  ClassSkillUpdate
>('class_skill');

// -----------------------------------------------------------------------------
// 10) Consumable
// -----------------------------------------------------------------------------
export type ConsumableRow    = RowOf<'consumable'>;
export type ConsumableInsert = InsertOf<'consumable'>;
export type ConsumableUpdate = UpdateOf<'consumable'>;

export const consumableApi = createDbApi<
  ConsumableRow,
  ConsumableInsert,
  ConsumableUpdate
>('consumable');

// -----------------------------------------------------------------------------
// 11) Corruption
// -----------------------------------------------------------------------------
export type CorruptionRow    = RowOf<'corruption'>;
export type CorruptionInsert = InsertOf<'corruption'>;
export type CorruptionUpdate = UpdateOf<'corruption'>;

export const corruptionApi = createDbApi<
  CorruptionRow,
  CorruptionInsert,
  CorruptionUpdate
>('corruption');

// Corruption Manifestation
export type CorruptionManifestationRow    = RowOf<'corruption_manifestation'>;
export type CorruptionManifestationInsert = InsertOf<'corruption_manifestation'>;
export type CorruptionManifestationUpdate = UpdateOf<'corruption_manifestation'>;

export const corruptionManifestationApi = createDbApi<
  CorruptionManifestationRow,
  CorruptionManifestationInsert,
  CorruptionManifestationUpdate
>('corruption_manifestation');

// -----------------------------------------------------------------------------
// 12) Discovery
// -----------------------------------------------------------------------------
export type DiscoveryRow    = RowOf<'discovery'>;
export type DiscoveryInsert = InsertOf<'discovery'>;
export type DiscoveryUpdate = UpdateOf<'discovery'>;

export const discoveryApi = createDbApi<
  DiscoveryRow,
  DiscoveryInsert,
  DiscoveryUpdate
>('discovery');

// -----------------------------------------------------------------------------
// 13) Equipment
// -----------------------------------------------------------------------------
export type EquipmentRow    = RowOf<'equipment'>;
export type EquipmentInsert = InsertOf<'equipment'>;
export type EquipmentUpdate = UpdateOf<'equipment'>;

export const equipmentApi = createDbApi<
  EquipmentRow,
  EquipmentInsert,
  EquipmentUpdate
>('equipment');

// -----------------------------------------------------------------------------
// 14) Feat
// -----------------------------------------------------------------------------
export type FeatRow    = RowOf<'feat'>;
export type FeatInsert = InsertOf<'feat'>;
export type FeatUpdate = UpdateOf<'feat'>;

export const featApi = createDbApi<
  FeatRow,
  FeatInsert,
  FeatUpdate
>('feat');

// -----------------------------------------------------------------------------
// 15) Game Character
// -----------------------------------------------------------------------------
export type GameCharacterRow    = RowOf<'game_character'>;
export type GameCharacterInsert = InsertOf<'game_character'>;
export type GameCharacterUpdate = UpdateOf<'game_character'>;

export const gameCharacterApi = createDbApi<
  GameCharacterRow,
  GameCharacterInsert,
  GameCharacterUpdate
>('game_character');


export type GameCharacterAncestryRow    = RowOf<'game_character_ancestry'>;
export type GameCharacterAncestryInsert = InsertOf<'game_character_ancestry'>;
export type GameCharacterAncestryUpdate = UpdateOf<'game_character_ancestry'>;

export const gameCharacterAncestryApi = createDbApi<
  GameCharacterAncestryRow,
  GameCharacterAncestryInsert,
  GameCharacterAncestryUpdate
>('game_character_ancestry');

export type GameCharacterArchetypeRow    = RowOf<'game_character_archetype'>;
export type GameCharacterArchetypeInsert = InsertOf<'game_character_archetype'>;
export type GameCharacterArchetypeUpdate = UpdateOf<'game_character_archetype'>;

export const gameCharacterArchetypeApi = createDbApi<
  GameCharacterArchetypeRow,
  GameCharacterArchetypeInsert,
  GameCharacterArchetypeUpdate
>('game_character_archetype');

export type GameCharacterClassRow    = RowOf<'game_character_class'>;
export type GameCharacterClassInsert = InsertOf<'game_character_class'>;
export type GameCharacterClassUpdate = UpdateOf<'game_character_class'>;

export const gameCharacterClassApi = createDbApi<
  GameCharacterClassRow,
  GameCharacterClassInsert,
  GameCharacterClassUpdate
>('game_character_class');

export type GameCharacterFeatRow    = RowOf<'game_character_feat'>;
export type GameCharacterFeatInsert = InsertOf<'game_character_feat'>;
export type GameCharacterFeatUpdate = UpdateOf<'game_character_feat'>;

export const gameCharacterFeatApi = createDbApi<
  GameCharacterFeatRow,
  GameCharacterFeatInsert,
  GameCharacterFeatUpdate
>('game_character_feat');

export type GameCharacterSkillRankRow    = RowOf<'game_character_skill_rank'>;
export type GameCharacterSkillRankInsert = InsertOf<'game_character_skill_rank'>;
export type GameCharacterSkillRankUpdate = UpdateOf<'game_character_skill_rank'>;

export const gameCharacterSkillRankApi = createDbApi<
  GameCharacterSkillRankRow,
  GameCharacterSkillRankInsert,
  GameCharacterSkillRankUpdate
>('game_character_skill_rank');

// export type GameCharacterTraitRow    = RowOf<'game_character_trait'>;
// export type GameCharacterTraitInsert = InsertOf<'game_character_trait'>;
// export type GameCharacterTraitUpdate = UpdateOf<'game_character_trait'>;

// export const gameCharacterTraitApi = createDbApi<
//   GameCharacterTraitRow,
//   GameCharacterTraitInsert,
//   GameCharacterTraitUpdate
// >('game_character_trait');

export type GameCharacterAbpBonusRow    = RowOf<'game_character_abp_bonus'>;
export type GameCharacterAbpBonusInsert = InsertOf<'game_character_abp_bonus'>;
export type GameCharacterAbpBonusUpdate = UpdateOf<'game_character_abp_bonus'>;

export const gameCharacterAbpBonusApi = createDbApi<
  GameCharacterAbpBonusRow,
  GameCharacterAbpBonusInsert,
  GameCharacterAbpBonusUpdate
>('game_character_abp_bonus');

export type GameCharacterWildTalentRow    = RowOf<'game_character_wild_talent'>;
export type GameCharacterWildTalentInsert = InsertOf<'game_character_wild_talent'>;
export type GameCharacterWildTalentUpdate = UpdateOf<'game_character_wild_talent'>;

export const gameCharacterWildTalentApi = createDbApi<
  GameCharacterWildTalentRow,
  GameCharacterWildTalentInsert,
  GameCharacterWildTalentUpdate
>('game_character_wild_talent');

export type GameCharacterEquipmentRow    = RowOf<'game_character_equipment'>;
export type GameCharacterEquipmentInsert = InsertOf<'game_character_equipment'>;
export type GameCharacterEquipmentUpdate = UpdateOf<'game_character_equipment'>;

export const gameCharacterEquipmentApi = createDbApi<
  GameCharacterEquipmentRow,
  GameCharacterEquipmentInsert,
  GameCharacterEquipmentUpdate
>('game_character_equipment');

export type GameCharacterArmorRow    = RowOf<'game_character_armor'>;
export type GameCharacterArmorInsert = InsertOf<'game_character_armor'>;
export type GameCharacterArmorUpdate = UpdateOf<'game_character_armor'>;

export const gameCharacterArmorApi = createDbApi<
  GameCharacterArmorRow,
  GameCharacterArmorInsert,
  GameCharacterArmorUpdate
>('game_character_armor');

export type GameCharacterCorruptionRow    = RowOf<'game_character_corruption'>;
export type GameCharacterCorruptionInsert = InsertOf<'game_character_corruption'>;
export type GameCharacterCorruptionUpdate = UpdateOf<'game_character_corruption'>;

export const gameCharacterCorruptionApi = createDbApi<
  GameCharacterCorruptionRow,
  GameCharacterCorruptionInsert,
  GameCharacterCorruptionUpdate
>('game_character_corruption');

// export type GameCharacterBuffRow    = RowOf<'game_character_buff'>;
// export type GameCharacterBuffInsert = InsertOf<'game_character_buff'>;
// export type GameCharacterBuffUpdate = UpdateOf<'game_character_buff'>;

// export const gameCharacterBuffApi = createDbApi<
//   GameCharacterBuffRow,
//   GameCharacterBuffInsert,
//   GameCharacterBuffUpdate
// >('game_character_buff');

export type GameCharacterCorruptionManifestationRow    = RowOf<'game_character_corruption_manifestation'>;
export type GameCharacterCorruptionManifestationInsert = InsertOf<'game_character_corruption_manifestation'>;
export type GameCharacterCorruptionManifestationUpdate = UpdateOf<'game_character_corruption_manifestation'>;

export const gameCharacterCorruptionManifestationApi = createDbApi<
  GameCharacterCorruptionManifestationRow,
  GameCharacterCorruptionManifestationInsert,
  GameCharacterCorruptionManifestationUpdate
>('game_character_corruption_manifestation');

// export type GameCharacterDiscoveryRow    = RowOf<'game_character_discovery'>;
// export type GameCharacterDiscoveryInsert = InsertOf<'game_character_discovery'>;
// export type GameCharacterDiscoveryUpdate = UpdateOf<'game_character_discovery'>;

// export const gameCharacterDiscoveryApi = createDbApi<
//   GameCharacterDiscoveryRow,
//   GameCharacterDiscoveryInsert,
//   GameCharacterDiscoveryUpdate
// >('game_character_discovery');

// export type GameCharacterEquipmentBonusRow    = RowOf<'game_character_equipment_bonus'>;
// export type GameCharacterEquipmentBonusInsert = InsertOf<'game_character_equipment_bonus'>;
// export type GameCharacterEquipmentBonusUpdate = UpdateOf<'game_character_equipment_bonus'>;

// export const gameCharacterEquipmentBonusApi = createDbApi<
//   GameCharacterEquipmentBonusRow,
//   GameCharacterEquipmentBonusInsert,
//   GameCharacterEquipmentBonusUpdate
// >('game_character_equipment_bonus');

export type GameCharacterAttributeRow    = RowOf<'game_character_attribute'>;
export type GameCharacterAttributeInsert = InsertOf<'game_character_attribute'>;
export type GameCharacterAttributeUpdate = UpdateOf<'game_character_attribute'>;

export const gameCharacterAttributeApi = createDbApi<
  GameCharacterAttributeRow,
  GameCharacterAttributeInsert,
  GameCharacterAttributeUpdate
>('game_character_attribute');

export type GameCharacterClassFeatureRow    = RowOf<'game_character_class_feature'>;
export type GameCharacterClassFeatureInsert = InsertOf<'game_character_class_feature'>;
export type GameCharacterClassFeatureUpdate = UpdateOf<'game_character_class_feature'>;

export const gameCharacterClassFeatureApi = createDbApi<
  GameCharacterClassFeatureRow,
  GameCharacterClassFeatureInsert,
  GameCharacterClassFeatureUpdate
>('game_character_class_feature');




// -----------------------------------------------------------------------------
// 16) Natural Attack
// -----------------------------------------------------------------------------
export type NaturalAttackRow    = RowOf<'natural_attack'>;
export type NaturalAttackInsert = InsertOf<'natural_attack'>;
export type NaturalAttackUpdate = UpdateOf<'natural_attack'>;

export const naturalAttackApi = createDbApi<
  NaturalAttackRow,
  NaturalAttackInsert,
  NaturalAttackUpdate
>('natural_attack');

export type SkillRow    = RowOf<'skill'>;
export type SkillInsert = InsertOf<'skill'>;
export type SkillUpdate = UpdateOf<'skill'>;

export const skillApi = createDbApi<
  SkillRow,
  SkillInsert,
  SkillUpdate
>('skill');

export type SkillBonusRow    = RowOf<'skill_bonus'>;
export type SkillBonusInsert = InsertOf<'skill_bonus'>;
export type SkillBonusUpdate = UpdateOf<'skill_bonus'>;

export const skillBonusApi = createDbApi<
  SkillBonusRow,
  SkillBonusInsert,
  SkillBonusUpdate
>('skill_bonus');

// ...and so forth for the rest of your tables...

// -----------------------------------------------------------------------------
// 16) "Reference" Tables: ref_abp_bonus_type, ref_buff_type, etc.
// -----------------------------------------------------------------------------
export type RefAbpBonusTypeRow = RowOf<'ref_abp_bonus_type'>;
export type RefAbpBonusTypeInsert = InsertOf<'ref_abp_bonus_type'>;
export type RefAbpBonusTypeUpdate = UpdateOf<'ref_abp_bonus_type'>;

export const refAbpBonusTypeApi = createDbApi<
  RefAbpBonusTypeRow,
  RefAbpBonusTypeInsert,
  RefAbpBonusTypeUpdate
>('ref_abp_bonus_type');

export type RefBonusTypeRow = RowOf<'ref_bonus_type'>;
export type RefBonusTypeInsert = InsertOf<'ref_bonus_type'>;
export type RefBonusTypeUpdate = UpdateOf<'ref_bonus_type'>;

export const refBonusTypeApi = createDbApi<
  RefBonusTypeRow,
  RefBonusTypeInsert,
  RefBonusTypeUpdate
>('ref_bonus_type');

export type RefBuffTypeRow = RowOf<'ref_buff_type'>;
export type RefBuffTypeInsert = InsertOf<'ref_buff_type'>;
export type RefBuffTypeUpdate = UpdateOf<'ref_buff_type'>;

export const refBuffTypeApi = createDbApi<
  RefBuffTypeRow,
  RefBuffTypeInsert,
  RefBuffTypeUpdate
>('ref_buff_type');

export type RefFavoredClassChoiceRow = RowOf<'ref_favored_class_choice'>;
export type RefFavoredClassChoiceInsert = InsertOf<'ref_favored_class_choice'>;
export type RefFavoredClassChoiceUpdate = UpdateOf<'ref_favored_class_choice'>;

export const refFavoredClassChoiceApi = createDbApi<
  RefFavoredClassChoiceRow,
  RefFavoredClassChoiceInsert,
  RefFavoredClassChoiceUpdate
>('ref_favored_class_choice');

export type RefSkillRankSourceRow = RowOf<'ref_skill_rank_source'>;
export type RefSkillRankSourceInsert = InsertOf<'ref_skill_rank_source'>;
export type RefSkillRankSourceUpdate = UpdateOf<'ref_skill_rank_source'>;

export const refSkillRankSourceApi = createDbApi<
  RefSkillRankSourceRow,
  RefSkillRankSourceInsert,
  RefSkillRankSourceUpdate
>('ref_skill_rank_source');


// Ancestry Attribute
export type AncestryAttributeRow    = RowOf<'ancestry_attribute'>;
export type AncestryAttributeInsert = InsertOf<'ancestry_attribute'>;
export type AncestryAttributeUpdate = UpdateOf<'ancestry_attribute'>;

export const ancestryAttributeApi = createDbApi<
  AncestryAttributeRow,
  AncestryAttributeInsert,
  AncestryAttributeUpdate
>('ancestry_attribute');

// Archetype Class Feature
export type ArchetypeClassFeatureRow    = RowOf<'archetype_class_feature'>;
export type ArchetypeClassFeatureInsert = InsertOf<'archetype_class_feature'>;
export type ArchetypeClassFeatureUpdate = UpdateOf<'archetype_class_feature'>;

export const archetypeClassFeatureApi = createDbApi<
  ArchetypeClassFeatureRow,
  ArchetypeClassFeatureInsert,
  ArchetypeClassFeatureUpdate
>('archetype_class_feature');

// Archetype Feature Replacement
export type ArchetypeFeatureReplacementRow    = RowOf<'archetype_feature_replacement'>;
export type ArchetypeFeatureReplacementInsert = InsertOf<'archetype_feature_replacement'>;
export type ArchetypeFeatureReplacementUpdate = UpdateOf<'archetype_feature_replacement'>;

export const archetypeFeatureReplacementApi = createDbApi<
  ArchetypeFeatureReplacementRow,
  ArchetypeFeatureReplacementInsert,
  ArchetypeFeatureReplacementUpdate
>('archetype_feature_replacement');

// Armor
export type ArmorRow    = RowOf<'armor'>;
export type ArmorInsert = InsertOf<'armor'>;
export type ArmorUpdate = UpdateOf<'armor'>;

export const armorApi = createDbApi<
  ArmorRow,
  ArmorInsert,
  ArmorUpdate
>('armor');

// Reference Attribute
export type RefAttributeRow    = RowOf<'ref_attribute'>;
export type RefAttributeInsert = InsertOf<'ref_attribute'>;
export type RefAttributeUpdate = UpdateOf<'ref_attribute'>;

export const refAttributeApi = createDbApi<
  RefAttributeRow,
  RefAttributeInsert,
  RefAttributeUpdate
>('ref_attribute');

// Spell
export type SpellRow    = RowOf<'spell'>;
export type SpellInsert = InsertOf<'spell'>;
export type SpellUpdate = UpdateOf<'spell'>;

export const spellApi = createDbApi<
  SpellRow,
  SpellInsert,
  SpellUpdate
>('spell');

// Spell Consumable
export type SpellConsumableRow    = RowOf<'spell_consumable'>;
export type SpellConsumableInsert = InsertOf<'spell_consumable'>;
export type SpellConsumableUpdate = UpdateOf<'spell_consumable'>;

export const spellConsumableApi = createDbApi<
  SpellConsumableRow,
  SpellConsumableInsert,
  SpellConsumableUpdate
>('spell_consumable');

// Spell Extract
export type SpellExtractRow    = RowOf<'spell_extract'>;
export type SpellExtractInsert = InsertOf<'spell_extract'>;
export type SpellExtractUpdate = UpdateOf<'spell_extract'>;

export const spellExtractApi = createDbApi<
  SpellExtractRow,
  SpellExtractInsert,
  SpellExtractUpdate
>('spell_extract');

// Trait
export type TraitRow    = RowOf<'trait'>;
export type TraitInsert = InsertOf<'trait'>;
export type TraitUpdate = UpdateOf<'trait'>;

export const traitApi = createDbApi<
  TraitRow,
  TraitInsert,
  TraitUpdate
>('trait');

// Weapon
export type WeaponRow    = RowOf<'weapon'>;
export type WeaponInsert = InsertOf<'weapon'>;
export type WeaponUpdate = UpdateOf<'weapon'>;

export const weaponApi = createDbApi<
  WeaponRow,
  WeaponInsert,
  WeaponUpdate
>('weapon');

// Weapon Proficiency
export type WeaponProficiencyRow    = RowOf<'weapon_proficiency'>;
export type WeaponProficiencyInsert = InsertOf<'weapon_proficiency'>;
export type WeaponProficiencyUpdate = UpdateOf<'weapon_proficiency'>;

export const weaponProficiencyApi = createDbApi<
  WeaponProficiencyRow,
  WeaponProficiencyInsert,
  WeaponProficiencyUpdate
>('weapon_proficiency');

// Wild Talent
export type WildTalentRow    = RowOf<'wild_talent'>;
export type WildTalentInsert = InsertOf<'wild_talent'>;
export type WildTalentUpdate = UpdateOf<'wild_talent'>;

export const wildTalentApi = createDbApi<
  WildTalentRow,
  WildTalentInsert,
  WildTalentUpdate
>('wild_talent');

// Update the dbApis object to include the new APIs
export const dbApis = {
  // Core game elements
  ancestralTraitApi,
  ancestryApi,
  ancestryAttributeApi,
  archetypeApi,
  archetypeClassFeatureApi,
  archetypeFeatureReplacementApi,
  armorApi,
  attributeApi,
  buffApi,
  classApi,
  classFeatureApi,
  classSkillApi,
  consumableApi,
  corruptionApi,
  corruptionManifestationApi,
  discoveryApi,
  equipmentApi,
  featApi,
  gameCharacterApi,
  gameCharacterAncestryApi,
  gameCharacterClassApi,
  gameCharacterFeatApi,
  gameCharacterSkillRankApi,
  gameCharacterAbpBonusApi,
  gameCharacterWildTalentApi,
  gameCharacterEquipmentApi,
  gameCharacterCorruptionApi,
  gameCharacterCorruptionManifestationApi,
  gameCharacterAttributeApi,
  gameCharacterClassFeatureApi,
  naturalAttackApi,
  skillApi,
  skillBonusApi,
  spellApi,
  spellConsumableApi,
  spellExtractApi,
  traitApi,
  weaponApi,
  weaponProficiencyApi,
  wildTalentApi,

  // Reference tables
  refAbpBonusTypeApi,
  refAttributeApi,
  refBonusTypeApi,
  refBuffTypeApi,
  refFavoredClassChoiceApi,
  refSkillRankSourceApi
};

// -----------------------------------------------------------------------------
// 18) JSON Type for completeness
// -----------------------------------------------------------------------------
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
