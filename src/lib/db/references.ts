/******************************************************************************
 * FILE: references.ts
 * 
 * This module provides references for:
 *   - bonus_types
 *   - skill_rank_sources
 *   - buff_types
 *   - abp_bonus_types
 *   - favored_class_choices
 * 
 * Uses the `createDbApi` approach to define CRUD + watchers for each table.
 *****************************************************************************/

import type { Database } from '$lib/domain/types/supabase';
import { createDbApi } from './genericApi';

/** 1) BONUS TYPES */
export type BonusTypeRow    = Database['public']['Tables']['bonus_types']['Row'];
export type BonusTypeInsert = Database['public']['Tables']['bonus_types']['Insert'];
export type BonusTypeUpdate = Database['public']['Tables']['bonus_types']['Update'] | { id?: number };

// Create a generic DB API for bonus_types:
export const bonusTypesApi = createDbApi<BonusTypeRow, BonusTypeInsert, BonusTypeUpdate>('bonus_types');

/** 2) SKILL_RANK_SOURCES */
export type SkillRankSourceRow    = Database['public']['Tables']['skill_rank_sources']['Row'];
export type SkillRankSourceInsert = Database['public']['Tables']['skill_rank_sources']['Insert'];
export type SkillRankSourceUpdate = Database['public']['Tables']['skill_rank_sources']['Update'] | { id?: number };

export const skillRankSourcesApi = createDbApi<
  SkillRankSourceRow,
  SkillRankSourceInsert,
  SkillRankSourceUpdate
>('skill_rank_sources');

/** 3) BUFF TYPES */
export type BuffTypeRow    = Database['public']['Tables']['buff_types']['Row'];
export type BuffTypeInsert = Database['public']['Tables']['buff_types']['Insert'];
export type BuffTypeUpdate = Database['public']['Tables']['buff_types']['Update'] | { id?: number };

export const buffTypesApi = createDbApi<BuffTypeRow, BuffTypeInsert, BuffTypeUpdate>('buff_types');

/** 4) ABP BONUS TYPES */
export type AbpBonusTypeRow    = Database['public']['Tables']['abp_bonus_types']['Row'];
export type AbpBonusTypeInsert = Database['public']['Tables']['abp_bonus_types']['Insert'];
export type AbpBonusTypeUpdate = Database['public']['Tables']['abp_bonus_types']['Update'] | { id?: number };

export const abpBonusTypesApi = createDbApi<
  AbpBonusTypeRow,
  AbpBonusTypeInsert,
  AbpBonusTypeUpdate
>('abp_bonus_types');

/** 5) FAVORED_CLASS_CHOICES */
export type FavoredClassChoiceRow    = Database['public']['Tables']['favored_class_choices']['Row'];
export type FavoredClassChoiceInsert = Database['public']['Tables']['favored_class_choices']['Insert'];
export type FavoredClassChoiceUpdate = Database['public']['Tables']['favored_class_choices']['Update'] | { id?: number };

export const favoredClassChoicesApi = createDbApi<
  FavoredClassChoiceRow,
  FavoredClassChoiceInsert,
  FavoredClassChoiceUpdate
>('favored_class_choices');
