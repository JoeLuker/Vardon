/******************************************************************************
 * FILE: bridging.ts
 *
 * Provides typed APIs for bridging tables:
 *   1) class_skill_relations
 *   2) archetype_feature_replacements
 *   3) entity_prerequisites
 *   4) entity_choices
 *   5) character_entity_choices
 *   6) character_rpg_entities
 *   7) character_rpg_entity_properties
 *   8) skill_bonuses
 *   9) weapon_proficiencies
 *   10) natural_attacks
 *   11) conditional_bonuses
 *   12) character_skill_ranks
 *   13) archetype_feature_replacements
 *****************************************************************************/

import { createDbApi } from './genericApi';
import type { Database } from '$lib/domain/types/supabase';

/* ------------------------------------------------------------------
   1) class_skill_relations
------------------------------------------------------------------ */
export type ClassSkillRelationsRow    = Database['public']['Tables']['class_skill_relations']['Row'];
export type ClassSkillRelationsInsert = Database['public']['Tables']['class_skill_relations']['Insert'];
export type ClassSkillRelationsUpdate = Database['public']['Tables']['class_skill_relations']['Update'];

export const classSkillRelationsApi = createDbApi<
  ClassSkillRelationsRow,
  ClassSkillRelationsInsert,
  ClassSkillRelationsUpdate
>('class_skill_relations');

/* ------------------------------------------------------------------
   2) archetype_feature_replacements
------------------------------------------------------------------ */
export type ArchetypeFeatureRepRow    = Database['public']['Tables']['archetype_feature_replacements']['Row'];
export type ArchetypeFeatureRepInsert = Database['public']['Tables']['archetype_feature_replacements']['Insert'];
export type ArchetypeFeatureRepUpdate = Database['public']['Tables']['archetype_feature_replacements']['Update'];

export const archetypeFeatureRepsApi = createDbApi<
  ArchetypeFeatureRepRow,
  ArchetypeFeatureRepInsert,
  ArchetypeFeatureRepUpdate
>('archetype_feature_replacements');

/* ------------------------------------------------------------------
   3) entity_prerequisites
------------------------------------------------------------------ */
export type EntityPrerequisiteRow    = Database['public']['Tables']['entity_prerequisites']['Row'];
export type EntityPrerequisiteInsert = Database['public']['Tables']['entity_prerequisites']['Insert'];
export type EntityPrerequisiteUpdate = Database['public']['Tables']['entity_prerequisites']['Update'];

export const entityPrerequisitesApi = createDbApi<
  EntityPrerequisiteRow,
  EntityPrerequisiteInsert,
  EntityPrerequisiteUpdate
>('entity_prerequisites');

/* ------------------------------------------------------------------
   4) entity_choices
------------------------------------------------------------------ */
export type EntityChoiceRow    = Database['public']['Tables']['entity_choices']['Row'];
export type EntityChoiceInsert = Database['public']['Tables']['entity_choices']['Insert'];
export type EntityChoiceUpdate = Database['public']['Tables']['entity_choices']['Update'];

export const entityChoicesApi = createDbApi<
  EntityChoiceRow,
  EntityChoiceInsert,
  EntityChoiceUpdate
>('entity_choices');

/* ------------------------------------------------------------------
   5) character_entity_choices
------------------------------------------------------------------ */
export type CharacterEntityChoiceRow    = Database['public']['Tables']['character_entity_choices']['Row'];
export type CharacterEntityChoiceInsert = Database['public']['Tables']['character_entity_choices']['Insert'];
export type CharacterEntityChoiceUpdate = Database['public']['Tables']['character_entity_choices']['Update'];

export const characterEntityChoicesApi = createDbApi<
  CharacterEntityChoiceRow,
  CharacterEntityChoiceInsert,
  CharacterEntityChoiceUpdate
>('character_entity_choices');

/* ------------------------------------------------------------------
   6) character_rpg_entities
------------------------------------------------------------------ */
export type CharacterRpgEntitiesRow    = Database['public']['Tables']['character_rpg_entities']['Row'];
export type CharacterRpgEntitiesInsert = Database['public']['Tables']['character_rpg_entities']['Insert'];
export type CharacterRpgEntitiesUpdate = Database['public']['Tables']['character_rpg_entities']['Update'];

export const characterRpgEntitiesApi = createDbApi<
  CharacterRpgEntitiesRow,
  CharacterRpgEntitiesInsert,
  CharacterRpgEntitiesUpdate
>('character_rpg_entities');

/* ------------------------------------------------------------------
   7) character_rpg_entity_properties
------------------------------------------------------------------ */
export type CharRpgEntityPropRow    = Database['public']['Tables']['character_rpg_entity_properties']['Row'];
export type CharRpgEntityPropInsert = Database['public']['Tables']['character_rpg_entity_properties']['Insert'];
export type CharRpgEntityPropUpdate = Database['public']['Tables']['character_rpg_entity_properties']['Update'];

export const characterRpgEntityPropsApi = createDbApi<
  CharRpgEntityPropRow,
  CharRpgEntityPropInsert,
  CharRpgEntityPropUpdate
>('character_rpg_entity_properties');

/* ------------------------------------------------------------------
   8) skill_bonuses
------------------------------------------------------------------ */
export type SkillBonusesRow    = Database['public']['Tables']['skill_bonuses']['Row'];
export type SkillBonusesInsert = Database['public']['Tables']['skill_bonuses']['Insert'];
export type SkillBonusesUpdate = Database['public']['Tables']['skill_bonuses']['Update'];

export const skillBonusesApi = createDbApi<
  SkillBonusesRow,
  SkillBonusesInsert,
  SkillBonusesUpdate
>('skill_bonuses');

/* ------------------------------------------------------------------
   9) weapon_proficiencies
------------------------------------------------------------------ */
export type WeaponProficienciesRow    = Database['public']['Tables']['weapon_proficiencies']['Row'];
export type WeaponProficienciesInsert = Database['public']['Tables']['weapon_proficiencies']['Insert'];
export type WeaponProficienciesUpdate = Database['public']['Tables']['weapon_proficiencies']['Update'];

export const weaponProficienciesApi = createDbApi<
  WeaponProficienciesRow,
  WeaponProficienciesInsert,
  WeaponProficienciesUpdate
>('weapon_proficiencies');

/* ------------------------------------------------------------------
   10) natural_attacks
------------------------------------------------------------------ */
export type NaturalAttacksRow    = Database['public']['Tables']['natural_attacks']['Row'];
export type NaturalAttacksInsert = Database['public']['Tables']['natural_attacks']['Insert'];
export type NaturalAttacksUpdate = Database['public']['Tables']['natural_attacks']['Update'];

export const naturalAttacksApi = createDbApi<
  NaturalAttacksRow,
  NaturalAttacksInsert,
  NaturalAttacksUpdate
>('natural_attacks');

/* ------------------------------------------------------------------
   11) conditional_bonuses
------------------------------------------------------------------ */
export type ConditionalBonusesRow    = Database['public']['Tables']['conditional_bonuses']['Row'];
export type ConditionalBonusesInsert = Database['public']['Tables']['conditional_bonuses']['Insert'];
export type ConditionalBonusesUpdate = Database['public']['Tables']['conditional_bonuses']['Update'];

export const conditionalBonusesApi = createDbApi<
  ConditionalBonusesRow,
  ConditionalBonusesInsert,
  ConditionalBonusesUpdate
>('conditional_bonuses');

/* ------------------------------------------------------------------
   12) character_skill_ranks
------------------------------------------------------------------ */
export type CharacterSkillRanksRow    = Database['public']['Tables']['character_skill_ranks']['Row'];
export type CharacterSkillRanksInsert = Database['public']['Tables']['character_skill_ranks']['Insert'];
export type CharacterSkillRanksUpdate = Database['public']['Tables']['character_skill_ranks']['Update'];

export const characterSkillRanksApi = createDbApi<
  CharacterSkillRanksRow,
  CharacterSkillRanksInsert,
  CharacterSkillRanksUpdate
>('character_skill_ranks');

/* ------------------------------------------------------------------
   13) archetype_feature_replacements
------------------------------------------------------------------ */
export type ArchetypeFeatureReplacementRow    = Database['public']['Tables']['archetype_feature_replacements']['Row'];
export type ArchetypeFeatureReplacementInsert = Database['public']['Tables']['archetype_feature_replacements']['Insert'];
export type ArchetypeFeatureReplacementUpdate = Database['public']['Tables']['archetype_feature_replacements']['Update'];

export const archetypeFeatureReplacementsApi = createDbApi<
  ArchetypeFeatureReplacementRow,
  ArchetypeFeatureReplacementInsert,
  ArchetypeFeatureReplacementUpdate
>('archetype_feature_replacements');
