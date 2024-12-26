// FILE: src/lib/db/skillRanks.ts
import { supabase } from '$lib/db/supabaseClient';
import type { DatabaseCharacterSkillRank, SkillRankSource } from '$lib/domain/types/character';


/**
 * Single row shape for upserting skill ranks.
 * Add/adjust fields to match your DB schema. 
 */
export interface SkillRankInsert {
  character_id: number;
  skill_id: number;
  ranks: number;
  applied_at_level: number;
  source: SkillRankSource;
}

/**
 * 1) Get existing class skill ranks for a specific character and source.
 *    e.g., source = SKILL_RANK_SOURCES.CLASS
 */
export async function getClassSkillRanks(
  characterId: number,
  source: string
): Promise<DatabaseCharacterSkillRank[]> {
  const { data, error } = await supabase
    .from('character_skill_ranks')
    .select('*')
    .eq('character_id', characterId)
    .eq('source', source);

  if (error) {
    console.error('Failed to fetch skill ranks:', error);
    throw new Error(`Error fetching skill ranks: ${error.message}`);
  }

  // Return an array of skill-rank rows, or empty array if none
  return data ?? [];
}

/**
 * 2) Delete skill-rank records by an array of IDs.
 */
export async function deleteSkillRanksByIds(ids: number[]): Promise<void> {
  const { error } = await supabase
    .from('character_skill_ranks')
    .delete()
    .in('id', ids);

  if (error) {
    console.error('Failed to delete skill ranks:', error);
    throw new Error(`Error deleting skill ranks: ${error.message}`);
  }
}

/**
 * 3) Upsert (insert or update) multiple skill-rank rows.
 *    Typically used when the user adds new skill ranks in the UI. 
 *    The DB determines insertion vs. update by matching unique constraints 
 *    (e.g. on (character_id, skill_id, applied_at_level)).
 */
export async function upsertSkillRanks(
  updates: SkillRankInsert[]
): Promise<DatabaseCharacterSkillRank[]> {
  // Adjust your columns as needed. (unique constraint, returning data, etc.)
  const { data, error } = await supabase
    .from('character_skill_ranks')
    .upsert(updates.map(update => ({
      ...update,
      source: update.source as "class" | "favored_class" | "intelligence" | "other",
      applied_at_level: update.applied_at_level || 1
    })))
    .select(); // We select so we get the newly inserted/updated rows back

  if (error) {
    console.error('Failed to upsert skill ranks:', error);
    throw new Error(`Error upserting skill ranks: ${error.message}`);
  }

  // Return the newly upserted rows
  return data ?? [];
}
