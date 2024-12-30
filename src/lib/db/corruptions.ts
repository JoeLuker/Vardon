// FILE: src/lib/db/corruptions.ts

import { supabase } from '$lib/db/supabaseClient';
import { readable, type Readable } from 'svelte/store';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { parseRow } from '$lib/db/utils';
import type { Database } from '$lib/domain/types/supabase';

// ------------------------------------------------------------------------------------------
// Type Definitions
// ------------------------------------------------------------------------------------------

/**
 * base_corruptions
 * (If you have some table storing different corruption “templates” or “types”.)
 */
export type BaseCorruptionRow = Database['public']['Tables']['base_corruptions']['Row'];

/**
 * character_corruptions
 */
export type CharacterCorruptionRow = Database['public']['Tables']['character_corruptions']['Row'];

/**
 * character_corruption_manifestations
 */
export type CorruptionManifestationRow =
  Database['public']['Tables']['character_corruption_manifestations']['Row'];

/**
 * Real-time event type for corruption changes.
 */
export interface CorruptionChangeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  newRow: CharacterCorruptionRow | null;
  oldRow: CharacterCorruptionRow | null;
}

/**
 * Real-time event type for corruption manifestations changes.
 */
export interface CorruptionManifestationChangeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  newRow: CorruptionManifestationRow | null;
  oldRow: CorruptionManifestationRow | null;
}

// ------------------------------------------------------------------------------------------
// Real-time Subscriptions
// ------------------------------------------------------------------------------------------

/**
 * watchCorruptionForCharacter(characterId)
 *
 * Subscribes to `character_corruptions` for rows with `character_id=eq.{characterId}`,
 * returning a Svelte `readable` store that accumulates real-time events.
 */
export function watchCorruptionForCharacter(
  characterId: number
): Readable<CorruptionChangeEvent[]> {
  return readable<CorruptionChangeEvent[]>([], (set) => {
    let internalArray: CorruptionChangeEvent[] = [];

    const channel = supabase.channel(`character_corruptions_${characterId}`);

    const handlePayload = (
      payload: RealtimePostgresChangesPayload<Partial<CharacterCorruptionRow>>
    ) => {
      const newRow = parseRow<CharacterCorruptionRow>(payload.new);
      const oldRow = parseRow<CharacterCorruptionRow>(payload.old);

      const event: CorruptionChangeEvent = {
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
          table: 'character_corruptions',
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

/**
 * watchCorruptionManifestationsForCharacter(characterId)
 *
 * Subscribes to `character_corruption_manifestations` for rows with `character_id=eq.{characterId}`,
 * returning a Svelte `readable` store for real-time updates.
 */
export function watchCorruptionManifestationsForCharacter(
  characterId: number
): Readable<CorruptionManifestationChangeEvent[]> {
  return readable<CorruptionManifestationChangeEvent[]>([], (set) => {
    let internalArray: CorruptionManifestationChangeEvent[] = [];

    const channel = supabase.channel(`character_corruption_manifestations_${characterId}`);

    const handlePayload = (
      payload: RealtimePostgresChangesPayload<Partial<CorruptionManifestationRow>>
    ) => {
      const newRow = parseRow<CorruptionManifestationRow>(payload.new);
      const oldRow = parseRow<CorruptionManifestationRow>(payload.old);

      const event: CorruptionManifestationChangeEvent = {
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
          table: 'character_corruption_manifestations',
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

// ------------------------------------------------------------------------------------------
// Base Corruptions (optional, if you store canonical “corruption types” in `base_corruptions`)
// ------------------------------------------------------------------------------------------

/**
 * getBaseCorruptions()
 * 
 * Retrieve a list of all base corruptions. 
 * 
 * If your `base_corruptions` table only stores an `id` referencing an entity or has more columns,
 * adapt accordingly.
 */
export async function getBaseCorruptions(): Promise<BaseCorruptionRow[]> {
  const { data, error } = await supabase
    .from('base_corruptions')
    .select('*')
    .order('id');

  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

/**
 * getBaseCorruptionById(corruptionId)
 * 
 * Returns a single base corruption. 
 */
export async function getBaseCorruptionById(corruptionId: number): Promise<BaseCorruptionRow> {
  const { data, error } = await supabase
    .from('base_corruptions')
    .select('*')
    .eq('id', corruptionId)
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

// ------------------------------------------------------------------------------------------
// Character Corruptions: CRUD
// ------------------------------------------------------------------------------------------

/**
 * getCorruptionForCharacter(characterId)
 *
 * Retrieve the corruption record(s) for a specific character. 
 * Some systems only allow 1 corruption per character; if so, you might retrieve a single row.
 */
export async function getCorruptionForCharacter(
  characterId: number
): Promise<CharacterCorruptionRow[]> {
  const { data, error } = await supabase
    .from('character_corruptions')
    .select('*')
    .eq('character_id', characterId);

  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

/**
 * addCorruption(characterId, corruptionType, etc.)
 *
 * Creates a new corruption entry for a character. E.g. if they contract "vampirism."
 */
export async function addCorruption(
  characterId: number,
  corruptionType: string,
  stage: number = 1,
  manifestationLevel = 0
): Promise<CharacterCorruptionRow> {
  const { data, error } = await supabase
    .from('character_corruptions')
    .insert({
      character_id: characterId,
      corruption_type: corruptionType,
      corruption_stage: stage,
      manifestation_level: manifestationLevel
      // any other columns, e.g. blood_required, last_feed_date, etc.
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
 * updateCorruption(corruptionId, updates)
 *
 * Update an existing corruption record, e.g. increasing corruption_stage,
 * updating blood_consumed, or setting the last_feed_date.
 */
export async function updateCorruption(
  corruptionId: number,
  updates: Partial<
    Pick<
      CharacterCorruptionRow,
      | 'corruption_type'
      | 'corruption_stage'
      | 'manifestation_level'
      | 'blood_consumed'
      | 'blood_required'
      | 'last_feed_date'
      | 'sync_status'
    >
  >
): Promise<CharacterCorruptionRow> {
  const { data, error } = await supabase
    .from('character_corruptions')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', corruptionId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

/**
 * removeCorruption(corruptionId)
 *
 * Deletes the corruption record for a character. Possibly triggers cascading 
 * deletion of manifestations, depending on your DB constraints.
 */
export async function removeCorruption(corruptionId: number): Promise<void> {
  const { error } = await supabase
    .from('character_corruptions')
    .delete()
    .eq('id', corruptionId);

  if (error) {
    throw new Error(error.message);
  }
}

// ------------------------------------------------------------------------------------------
// Corruption Manifestations: CRUD
// ------------------------------------------------------------------------------------------

/**
 * getCorruptionManifestationsForCharacter(characterId)
 *
 * Returns all manifestations for a given character’s corruption.
 * Depending on your schema, you might also filter by corruption_id 
 * if the character can have multiple corruptions.
 */
export async function getCorruptionManifestationsForCharacter(
  characterId: number
): Promise<CorruptionManifestationRow[]> {
  const { data, error } = await supabase
    .from('character_corruption_manifestations')
    .select('*')
    .eq('character_id', characterId);

  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

/**
 * addCorruptionManifestation(corruptionId, manifestationName, etc.)
 *
 * Create a new manifestation record. 
 * If your schema requires a `corruption_id` (foreign key to the row in `character_corruptions`),
 * be sure to pass it in.
 */
export async function addCorruptionManifestation(
  characterId: number,
  corruptionId: number,
  manifestationName: string,
  minManifestationLevel?: number
): Promise<CorruptionManifestationRow> {
  const { data, error } = await supabase
    .from('character_corruption_manifestations')
    .insert({
      character_id: characterId,
      corruption_id: corruptionId,
      manifestation_name: manifestationName,
      min_manifestation_level: minManifestationLevel ?? null,
      gift_active: false,
      stain_active: false
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
 * updateCorruptionManifestation(manifestationId, updates)
 *
 * Update an existing manifestation, e.g. toggling gift_active or stain_active.
 */
export async function updateCorruptionManifestation(
  manifestationId: number,
  updates: Partial<
    Pick<
      CorruptionManifestationRow,
      'manifestation_name' | 'gift_active' | 'stain_active' | 'sync_status'
    >
  >
): Promise<CorruptionManifestationRow> {
  const { data, error } = await supabase
    .from('character_corruption_manifestations')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', manifestationId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

/**
 * removeCorruptionManifestation(manifestationId)
 *
 * Deletes a single manifestation from a character’s corruption.
 */
export async function removeCorruptionManifestation(
  manifestationId: number
): Promise<void> {
  const { error } = await supabase
    .from('character_corruption_manifestations')
    .delete()
    .eq('id', manifestationId);

  if (error) {
    throw new Error(error.message);
  }
}
