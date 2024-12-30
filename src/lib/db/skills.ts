// FILE: src/lib/db/skills.ts

import { supabase } from '$lib/db/supabaseClient';
import { readable, type Readable } from 'svelte/store';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { parseRow } from '$lib/db/utils';
import type { Database } from '$lib/domain/types/supabase';

// -----------------------------
// Type Definitions
// -----------------------------

// Core skill types
export type SkillRow = Database['public']['Tables']['base_skills']['Row'];
export type CharacterSkillRankRow = Database['public']['Tables']['character_skill_ranks']['Row'];
export type SkillRankSourceRow = Database['public']['Tables']['skill_rank_sources']['Row'];
export type SkillBonusRow = Database['public']['Tables']['skill_bonuses']['Row'];
export type ClassSkillRelationRow = Database['public']['Tables']['class_skill_relations']['Row'];

// Extended interfaces
export interface SkillWithRelations extends SkillRow {
  skill_bonuses: SkillBonusRow[];
  class_skill_relations: ClassSkillRelationRow[];
}

export interface CharacterSkillWithDetails extends CharacterSkillRankRow {
  base_skills: SkillRow;
  skill_rank_sources: SkillRankSourceRow | null;
}

// Real-time types
export interface SkillRankChangeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  newRow: CharacterSkillRankRow | null;
  oldRow: CharacterSkillRankRow | null;
}

// -----------------------------
// Real-time Subscriptions
// -----------------------------

export function watchCharacterSkillRanks(characterId: number): Readable<SkillRankChangeEvent[]> {
  return readable<SkillRankChangeEvent[]>([], (set) => {
    let internalArray: SkillRankChangeEvent[] = [];
    const channel = supabase.channel(`character_skill_ranks_${characterId}`);
    
    const handlePayload = (payload: RealtimePostgresChangesPayload<Partial<CharacterSkillRankRow>>) => {
      const newRow = parseRow<CharacterSkillRankRow>(payload.new);
      const oldRow = parseRow<CharacterSkillRankRow>(payload.old);
      
      const event: SkillRankChangeEvent = {
        eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
        newRow,
        oldRow
      };
      
      internalArray = [...internalArray, event];
      set(internalArray);
    };

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'character_skill_ranks',
        filter: `character_id=eq.${characterId}`
      },
      handlePayload
    ).subscribe();

    return () => {
      channel.unsubscribe();
    };
  });
}

// -----------------------------
// Core Skill Operations
// -----------------------------

/**
 * List all available skills
 */
export async function listSkills(): Promise<SkillRow[]> {
  const { data, error } = await supabase
    .from('base_skills')
    .select('*')
    .order('name');

  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Get detailed skill information
 */
export async function getSkill(skillId: number): Promise<SkillWithRelations> {
  const { data, error } = await supabase
    .from('base_skills')
    .select(`
      *,
      skill_bonuses(*),
      class_skill_relations(*)
    `)
    .eq('id', skillId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Get skills that are class skills for a given class
 */
export async function getClassSkills(classId: number): Promise<SkillRow[]> {
  const { data, error } = await supabase
    .from('class_skill_relations')
    .select('base_skills!inner(*)')
    .eq('class_id', classId);

  if (error) throw new Error(error.message);
  return data?.map(row => row.base_skills) ?? [];
}

// -----------------------------
// Character Skill Operations
// -----------------------------

/**
 * Get all skill ranks for a character
 */
export async function getCharacterSkillRanks(characterId: number): Promise<CharacterSkillWithDetails[]> {
  const { data, error } = await supabase
    .from('character_skill_ranks')
    .select(`
      *,
      base_skills!inner(*),
      skill_rank_sources(*)
    `)
    .eq('character_id', characterId)
    .order('skill_id');

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Add a skill rank for a character
 */
export async function addSkillRank(
  characterId: number,
  skillId: number,
  appliedAtLevel: number,
  sourceId?: number
): Promise<CharacterSkillRankRow> {
  const { data, error } = await supabase
    .from('character_skill_ranks')
    .insert({
      character_id: characterId,
      skill_id: skillId,
      applied_at_level: appliedAtLevel,
      source_id: sourceId
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Remove a skill rank from a character
 */
export async function removeSkillRank(rankId: number): Promise<void> {
  const { error } = await supabase
    .from('character_skill_ranks')
    .delete()
    .eq('id', rankId);

  if (error) throw new Error(error.message);
}

/**
 * Get total ranks in a skill for a character
 */
export async function getSkillRankTotal(
  characterId: number,
  skillId: number
): Promise<number> {
  const { count, error } = await supabase
    .from('character_skill_ranks')
    .select('*', { count: 'exact' })
    .eq('character_id', characterId)
    .eq('skill_id', skillId);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

// -----------------------------
// Skill Rank Sources
// -----------------------------

/**
 * List all skill rank sources
 */
export async function listSkillRankSources(): Promise<SkillRankSourceRow[]> {
  const { data, error } = await supabase
    .from('skill_rank_sources')
    .select('*')
    .order('name');

  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Get ranks from a specific source for a character
 */
export async function getSkillRanksFromSource(
  characterId: number,
  sourceId: number
): Promise<CharacterSkillRankRow[]> {
  const { data, error } = await supabase
    .from('character_skill_ranks')
    .select('*')
    .eq('character_id', characterId)
    .eq('source_id', sourceId);

  if (error) throw new Error(error.message);
  return data ?? [];
}

// -----------------------------
// Bulk Operations
// -----------------------------

/**
 * Apply multiple skill ranks at once (e.g., for level up)
 */
export async function bulkAddSkillRanks(
  characterId: number,
  ranks: { skillId: number; level: number; sourceId?: number }[]
): Promise<void> {
  const { error } = await supabase
    .from('character_skill_ranks')
    .insert(
      ranks.map(rank => ({
        character_id: characterId,
        skill_id: rank.skillId,
        applied_at_level: rank.level,
        source_id: rank.sourceId
      }))
    );

  if (error) throw new Error(error.message);
}

/**
 * Distribute skill ranks based on level progression
 */
export async function distributeSkillRanks(
  characterId: number,
  progressions: Array<{
    skill_name: string | null;
    ranks_per_level: number[] | null;
  }>
): Promise<void> {
  const { error } = await supabase.rpc('distribute_skill_ranks', {
    p_character_id: characterId,
    p_progressions: progressions
  });

  if (error) throw new Error(error.message);
}

// -----------------------------
// Validation Helpers
// -----------------------------

/**
 * Check if a character has the maximum allowed ranks in a skill
 */
export async function canAddSkillRank(
  characterId: number,
  skillId: number,
  characterLevel: number
): Promise<boolean> {
  const currentRanks = await getSkillRankTotal(characterId, skillId);
  return currentRanks < characterLevel;
}

/**
 * Check if a skill is a class skill for a character's class
 */
export async function isClassSkill(
  classId: number,
  skillId: number
): Promise<boolean> {
  const { data, error } = await supabase
    .from('class_skill_relations')
    .select('*')
    .eq('class_id', classId)
    .eq('skill_id', skillId)
    .single();

  if (error) return false;
  return !!data;
}

/**
 * Get skill ability modifier
 */
export async function getSkillAbilityModifier(skillId: number): Promise<string> {
  const { data, error } = await supabase
    .from('base_skills')
    .select('ability')
    .eq('id', skillId)
    .single();

  if (error) throw new Error(error.message);
  return data.ability;
}