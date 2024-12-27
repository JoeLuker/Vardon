// FILE: src/lib/db/classFeatures.ts

import { supabase } from '$lib/db/supabaseClient';
import { readable, type Readable } from 'svelte/store';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Json } from '$lib/domain/types/supabase';

/**
 * DB shape for 'character_class_features'.
 */
export interface DBClassFeature {
  id: number;
  character_id: number;
  feature_name: string;
  feature_level: number;
  active: boolean;
  properties: Json | null;
  updated_at: string | null;
  sync_status: string | null;
}

/**
 * For inserting/updating a row (create or update).
 */
export interface SaveClassFeatureDTO {
  character_id: number;
  feature_name: string;
  feature_level: number;
  active: boolean;
  properties: Json | null;
}

export async function saveClassFeature(
  dto: SaveClassFeatureDTO,
  existingId?: number
): Promise<DBClassFeature> {
  const isNew = !existingId;
  const query = isNew
    ? supabase
        .from('character_class_features')
        .insert(dto)
        .select()
        .single()
    : supabase
        .from('character_class_features')
        .update(dto)
        .eq('id', existingId)
        .select()
        .single();

  const { data, error } = await query;
  if (error) {
    console.error('Failed to save class feature:', error);
    throw new Error(`Failed to save feature: ${error.message}`);
  }
  return data as DBClassFeature;
}

export async function deleteClassFeature(featureId: number): Promise<void> {
  const { error } = await supabase
    .from('character_class_features')
    .delete()
    .eq('id', featureId);

  if (error) {
    console.error('Failed to delete class feature:', error);
    throw new Error(`Failed to delete feature: ${error.message}`);
  }
}

/**
 * The shape of each real-time event your store will emit.
 */
export interface FeatureChangeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  newRow: DBClassFeature | null;
  oldRow: DBClassFeature | null;
}

/**
 * watchClassFeatures(characterId)
 * 
 * Returns a `readable` store with an array of real-time events from the
 * `character_class_features` table, filtered by `character_id=eq.{characterId}`.
 *
 * Each time an INSERT/UPDATE/DELETE occurs, a new FeatureChangeEvent is appended
 * to the array in the store. It's up to the consumer to subscribe and handle them.
 */
export function watchClassFeatures(characterId: number): Readable<FeatureChangeEvent[]> {
  return readable<FeatureChangeEvent[]>([], (set) => {
    // We'll keep an internal array of events and push new ones as they come in
    let internalArray: FeatureChangeEvent[] = [];

    // Create a channel unique to this character's features
    const channel = supabase.channel(`class_features_${characterId}`);

    const handlePayload = (
      payload: RealtimePostgresChangesPayload<Partial<DBClassFeature>>
    ) => {
      // If `payload.new` or `payload.old` is an empty object, we treat it as null
      const newRow =
        payload.new && Object.keys(payload.new).length > 0
          ? (payload.new as DBClassFeature)
          : null;
      const oldRow =
        payload.old && Object.keys(payload.old).length > 0
          ? (payload.old as DBClassFeature)
          : null;

      const change: FeatureChangeEvent = {
        eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
        newRow,
        oldRow
      };

      // Append to our internal array, then set() it
      internalArray = [...internalArray, change];
      set(internalArray);
    };

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'character_class_features',
        filter: `character_id=eq.${characterId}`
      },
      handlePayload
    );

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[db] Subscribed to classFeatures for character ${characterId}`);
      }
    });

    // Cleanup when the subscriber stops listening
    return () => {
      supabase.removeChannel(channel);
    };
  });
}
