/******************************************************************************
 * FILE: baseSubtypes.ts
 *
 * This file contains code for these base_* tables:
 *   1) base_ancestries
 *   2) base_classes
 *   3) base_skills
 *   4) base_feats
 *   5) base_archetypes
 *   6) base_ancestral_traits
 *   7) base_buffs
 *   8) base_traits
 *   9) base_corruptions
 *   10) base_equipment
 *   11) base_attributes
 *   12) base_wild_talents
 *   13) base_class_features
 *   14) base_discoveries
 *
 * If any table isn't used in your new schema, remove that block.
 *****************************************************************************/

import type { Database } from '$lib/domain/types/supabase';
import { createDbApi } from './genericApi';


/* ------------------------------------------------------------------
   1) BASE_ANCESTRIES
------------------------------------------------------------------ */
export type BaseAncestryRow    = Database['public']['Tables']['base_ancestries']['Row'];
export type BaseAncestryInsert = Database['public']['Tables']['base_ancestries']['Insert'];
export type BaseAncestryUpdate = Database['public']['Tables']['base_ancestries']['Update'];

export const baseAncestriesApi = createDbApi<
  BaseAncestryRow,
  BaseAncestryInsert,
  BaseAncestryUpdate
>('base_ancestries');

/* ------------------------------------------------------------------
   2) BASE_CLASSES
------------------------------------------------------------------ */
export type BaseClassRow    = Database['public']['Tables']['base_classes']['Row'];
export type BaseClassInsert = Database['public']['Tables']['base_classes']['Insert'];
export type BaseClassUpdate = Database['public']['Tables']['base_classes']['Update'];

export const baseClassesApi = createDbApi<
  BaseClassRow,
  BaseClassInsert,
  BaseClassUpdate
>('base_classes');

/* ------------------------------------------------------------------
   3) BASE_SKILLS
------------------------------------------------------------------ */
export type BaseSkillRow    = Database['public']['Tables']['base_skills']['Row'];
export type BaseSkillInsert = Database['public']['Tables']['base_skills']['Insert'];
export type BaseSkillUpdate = Database['public']['Tables']['base_skills']['Update'];

export const baseSkillsApi = createDbApi<
  BaseSkillRow,
  BaseSkillInsert,
  BaseSkillUpdate
>('base_skills');

/* ------------------------------------------------------------------
   4) BASE_FEATS
------------------------------------------------------------------ */
export type BaseFeatRow    = Database['public']['Tables']['base_feats']['Row'];
export type BaseFeatInsert = Database['public']['Tables']['base_feats']['Insert'];
export type BaseFeatUpdate = Database['public']['Tables']['base_feats']['Update'];

export const baseFeatsApi = createDbApi<
  BaseFeatRow,
  BaseFeatInsert,
  BaseFeatUpdate
>('base_feats');

/* ------------------------------------------------------------------
   5) BASE_ARCHETYPES
------------------------------------------------------------------ */
export type BaseArchetypeRow    = Database['public']['Tables']['base_archetypes']['Row'];
export type BaseArchetypeInsert = Database['public']['Tables']['base_archetypes']['Insert'];
export type BaseArchetypeUpdate = Database['public']['Tables']['base_archetypes']['Update'];

export const baseArchetypesApi = createDbApi<
  BaseArchetypeRow,
  BaseArchetypeInsert,
  BaseArchetypeUpdate
>('base_archetypes');

/* ------------------------------------------------------------------
   6) BASE_ANCESTRAL_TRAITS
------------------------------------------------------------------ */
export type BaseAncestralTraitRow    = Database['public']['Tables']['base_ancestral_traits']['Row'];
export type BaseAncestralTraitInsert = Database['public']['Tables']['base_ancestral_traits']['Insert'];
export type BaseAncestralTraitUpdate = Database['public']['Tables']['base_ancestral_traits']['Update'];

export const baseAncestralTraitsApi = createDbApi<
  BaseAncestralTraitRow,
  BaseAncestralTraitInsert,
  BaseAncestralTraitUpdate
>('base_ancestral_traits');

/* ------------------------------------------------------------------
   7) BASE_BUFFS
------------------------------------------------------------------ */
export type BaseBuffRow    = Database['public']['Tables']['base_buffs']['Row'];
export type BaseBuffInsert = Database['public']['Tables']['base_buffs']['Insert'];
export type BaseBuffUpdate = Database['public']['Tables']['base_buffs']['Update'];

export const baseBuffsApi = createDbApi<
  BaseBuffRow,
  BaseBuffInsert,
  BaseBuffUpdate
>('base_buffs');

/* ------------------------------------------------------------------
   8) BASE_TRAITS
------------------------------------------------------------------ */
export type BaseTraitRow    = Database['public']['Tables']['base_traits']['Row'];
export type BaseTraitInsert = Database['public']['Tables']['base_traits']['Insert'];
export type BaseTraitUpdate = Database['public']['Tables']['base_traits']['Update'];

export const baseTraitsApi = createDbApi<
  BaseTraitRow,
  BaseTraitInsert,
  BaseTraitUpdate
>('base_traits');

/* ------------------------------------------------------------------
   9) BASE_CORRUPTIONS
------------------------------------------------------------------ */
export type BaseCorruptionRow    = Database['public']['Tables']['base_corruptions']['Row'];
export type BaseCorruptionInsert = Database['public']['Tables']['base_corruptions']['Insert'];
export type BaseCorruptionUpdate = Database['public']['Tables']['base_corruptions']['Update'];

export const baseCorruptionsApi = createDbApi<
  BaseCorruptionRow,
  BaseCorruptionInsert,
  BaseCorruptionUpdate
>('base_corruptions');

/* ------------------------------------------------------------------
   10) BASE_EQUIPMENT
------------------------------------------------------------------ */
export type BaseEquipmentRow    = Database['public']['Tables']['base_equipment']['Row'];
export type BaseEquipmentInsert = Database['public']['Tables']['base_equipment']['Insert'];
export type BaseEquipmentUpdate = Database['public']['Tables']['base_equipment']['Update'];

export const baseEquipmentApi = createDbApi<
  BaseEquipmentRow,
  BaseEquipmentInsert,
  BaseEquipmentUpdate
>('base_equipment');

/* ------------------------------------------------------------------
   11) BASE_ATTRIBUTES
------------------------------------------------------------------ */
export type BaseAttributeRow    = Database['public']['Tables']['base_attributes']['Row'];
export type BaseAttributeInsert = Database['public']['Tables']['base_attributes']['Insert'];
export type BaseAttributeUpdate = Database['public']['Tables']['base_attributes']['Update'];

export const baseAttributesApi = createDbApi<
  BaseAttributeRow,
  BaseAttributeInsert,
  BaseAttributeUpdate
>('base_attributes');

/* ------------------------------------------------------------------
   12) BASE_WILD_TALENTS
------------------------------------------------------------------ */
export type BaseWildTalentRow    = Database['public']['Tables']['base_wild_talents']['Row'];
export type BaseWildTalentInsert = Database['public']['Tables']['base_wild_talents']['Insert'];
export type BaseWildTalentUpdate = Database['public']['Tables']['base_wild_talents']['Update'];

export const baseWildTalentsApi = createDbApi<
  BaseWildTalentRow,
  BaseWildTalentInsert,
  BaseWildTalentUpdate
>('base_wild_talents');

/* ------------------------------------------------------------------
   13) BASE_CLASS_FEATURES
------------------------------------------------------------------ */
export type BaseClassFeatureRow    = Database['public']['Tables']['base_class_features']['Row'];
export type BaseClassFeatureInsert = Database['public']['Tables']['base_class_features']['Insert'];
export type BaseClassFeatureUpdate = Database['public']['Tables']['base_class_features']['Update'];

export const baseClassFeaturesApi = createDbApi<
  BaseClassFeatureRow,
  BaseClassFeatureInsert,
  BaseClassFeatureUpdate
>('base_class_features');

/* ------------------------------------------------------------------
   14) BASE_DISCOVERIES
------------------------------------------------------------------ */
export type BaseDiscoveryRow    = Database['public']['Tables']['base_discoveries']['Row'];
export type BaseDiscoveryInsert = Database['public']['Tables']['base_discoveries']['Insert'];
export type BaseDiscoveryUpdate = Database['public']['Tables']['base_discoveries']['Update'];

export const baseDiscoveriesApi = createDbApi<
  BaseDiscoveryRow,
  BaseDiscoveryInsert,
  BaseDiscoveryUpdate
>('base_discoveries');
