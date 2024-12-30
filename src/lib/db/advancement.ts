// FILE: src/lib/db/advancement.ts

import { supabase } from '$lib/db/supabaseClient';
import { readable, type Readable } from 'svelte/store';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { parseRow } from '$lib/db/utils';

import type { Database } from '$lib/domain/types/supabase';

/* ------------------------------------------------------------------------
 * Type Definitions
 * ------------------------------------------------------------------------ */

/**
 * favored_class_choices row
 */
export type FavoredClassChoiceRow =
  Database['public']['Tables']['favored_class_choices']['Row'];

/**
 * character_favored_class_bonuses row
 */
export type CharacterFavoredClassBonusRow =
  Database['public']['Tables']['character_favored_class_bonuses']['Row'];

/**
 * Real-time event type for favored_class_choices changes.
 */
export interface FavoredClassChoiceChangeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  newRow: FavoredClassChoiceRow | null;
  oldRow: FavoredClassChoiceRow | null;
}

/**
 * Real-time event type for character_favored_class_bonuses changes.
 */
export interface CharacterFavoredClassBonusChangeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  newRow: CharacterFavoredClassBonusRow | null;
  oldRow: CharacterFavoredClassBonusRow | null;
}

/* ------------------------------------------------------------------------
 * Real-time Subscriptions
 * ------------------------------------------------------------------------ */

/**
 * watchFavoredClassChoices()
 *
 * Subscribes to `favored_class_choices` table changes.
 * If you only want to watch a single choice, adapt the filter accordingly.
 */
export function watchFavoredClassChoices(): Readable<FavoredClassChoiceChangeEvent[]> {
  return readable<FavoredClassChoiceChangeEvent[]>([], (set) => {
    let internalArray: FavoredClassChoiceChangeEvent[] = [];

    const channel = supabase.channel(`favored_class_choices_all`);

    const handlePayload = (
      payload: RealtimePostgresChangesPayload<Partial<FavoredClassChoiceRow>>
    ) => {
      const newRow = parseRow<FavoredClassChoiceRow>(payload.new);
      const oldRow = parseRow<FavoredClassChoiceRow>(payload.old);

      const event: FavoredClassChoiceChangeEvent = {
        eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
        newRow,
        oldRow
      };

      internalArray = [...internalArray, event];
      set(internalArray);
    };

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'favored_class_choices'
        },
        handlePayload
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  });
}

/**
 * watchCharacterFavoredClassBonuses(characterId)
 *
 * Subscribes to `character_favored_class_bonuses` for a specific character,
 * returning a real-time Svelte store with changes.
 */
export function watchCharacterFavoredClassBonuses(
  characterId: number
): Readable<CharacterFavoredClassBonusChangeEvent[]> {
  return readable<CharacterFavoredClassBonusChangeEvent[]>([], (set) => {
    let internalArray: CharacterFavoredClassBonusChangeEvent[] = [];

    const channel = supabase.channel(`character_favored_class_bonuses_${characterId}`);

    const handlePayload = (
      payload: RealtimePostgresChangesPayload<Partial<CharacterFavoredClassBonusRow>>
    ) => {
      const newRow = parseRow<CharacterFavoredClassBonusRow>(payload.new);
      const oldRow = parseRow<CharacterFavoredClassBonusRow>(payload.old);

      const event: CharacterFavoredClassBonusChangeEvent = {
        eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
        newRow,
        oldRow
      };

      internalArray = [...internalArray, event];
      set(internalArray);
    };

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'character_favored_class_bonuses',
          filter: `character_id=eq.${characterId}`
        },
        handlePayload
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  });
}

/* ------------------------------------------------------------------------
 * Favored Class Choices CRUD
 * ------------------------------------------------------------------------ */

/**
 * listFavoredClassChoices()
 *
 * Retrieves all possible favored class choices (name & label),
 * e.g., “+1 HP”, “+1 Skill Rank”, or custom ones.
 */
export async function listFavoredClassChoices(): Promise<FavoredClassChoiceRow[]> {
  const { data, error } = await supabase
    .from('favored_class_choices')
    .select('*')
    .order('id');

  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

/**
 * getFavoredClassChoiceById(choiceId)
 */
export async function getFavoredClassChoiceById(
  choiceId: number
): Promise<FavoredClassChoiceRow> {
  const { data, error } = await supabase
    .from('favored_class_choices')
    .select('*')
    .eq('id', choiceId)
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

/**
 * addFavoredClassChoice(name, label)
 *
 * Inserts a new favored class choice row.
 */
export async function addFavoredClassChoice(
  name: string,
  label?: string
): Promise<FavoredClassChoiceRow> {
  const { data, error } = await supabase
    .from('favored_class_choices')
    .insert({
      name,
      label: label ?? null
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

/**
 * updateFavoredClassChoice(choiceId, updates)
 *
 * Updates an existing favored class choice (e.g. rename).
 */
export async function updateFavoredClassChoice(
  choiceId: number,
  updates: Partial<Pick<FavoredClassChoiceRow, 'name' | 'label'>>
): Promise<FavoredClassChoiceRow> {
  const { data, error } = await supabase
    .from('favored_class_choices')
    .update({
      ...updates
    })
    .eq('id', choiceId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

/**
 * removeFavoredClassChoice(choiceId)
 *
 * Deletes a favored class choice row. 
 * (If any `character_favored_class_bonuses` rows reference this choice, 
 * you may want to handle or block it to avoid orphaned references.)
 */
export async function removeFavoredClassChoice(choiceId: number): Promise<void> {
  const { error } = await supabase
    .from('favored_class_choices')
    .delete()
    .eq('id', choiceId);

  if (error) {
    throw new Error(error.message);
  }
}

/* ------------------------------------------------------------------------
 * Character Favored Class Bonuses CRUD
 * ------------------------------------------------------------------------ */

/**
 * getFavoredClassBonusesForCharacter(characterId)
 *
 * Returns all favored class bonus records for a character, each referencing a favored_choice_id.
 */
export async function getFavoredClassBonusesForCharacter(
  characterId: number
): Promise<CharacterFavoredClassBonusRow[]> {
  const { data, error } = await supabase
    .from('character_favored_class_bonuses')
    .select('*')
    .eq('character_id', characterId)
    .order('level');

  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

/**
 * addFavoredClassBonus(characterId, favoredChoiceId, level)
 *
 * Creates a new favored class bonus record for a character at a given level 
 * (e.g., "At level 3, choose +1 HP").
 */
export async function addFavoredClassBonus(
  characterId: number,
  favoredChoiceId: number,
  level: number
): Promise<CharacterFavoredClassBonusRow> {
  const { data, error } = await supabase
    .from('character_favored_class_bonuses')
    .insert({
      character_id: characterId,
      favored_choice_id: favoredChoiceId,
      level
      // sync_status: 'pending'
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

/**
 * updateFavoredClassBonus(bonusId, updates)
 *
 * Update an existing favored class bonus record, e.g. changing the favored_choice_id 
 * or the level at which it's applied.
 */
export async function updateFavoredClassBonus(
  bonusId: number,
  updates: Partial<
    Pick<CharacterFavoredClassBonusRow, 'favored_choice_id' | 'level' | 'sync_status'>
  >
): Promise<CharacterFavoredClassBonusRow> {
  const { data, error } = await supabase
    .from('character_favored_class_bonuses')
    .update({
      ...updates
    })
    .eq('id', bonusId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

/**
 * removeFavoredClassBonus(bonusId)
 *
 * Deletes a single favored class bonus record by ID.
 */
export async function removeFavoredClassBonus(bonusId: number): Promise<void> {
  const { error } = await supabase
    .from('character_favored_class_bonuses')
    .delete()
    .eq('id', bonusId);

  if (error) {
    throw new Error(error.message);
  }
}
