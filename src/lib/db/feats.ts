import { supabase } from '$lib/db/supabaseClient';
import { readable, type Readable } from 'svelte/store';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { parseRow } from '$lib/db/utils';
import type { Database } from '$lib/domain/types/supabase';

// -----------------------------
// Type Definitions
// -----------------------------

// Core feat types
export type CharacterFeatRow = Database['public']['Tables']['character_feats']['Row'];
export type CharacterFeatPropertyRow = Database['public']['Tables']['character_feat_properties']['Row'];

// Extended interfaces
export interface FeatWithProperties extends CharacterFeatRow {
  properties: CharacterFeatPropertyRow[];
}

// Real-time types
export interface FeatChangeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  newRow: CharacterFeatRow | null;
  oldRow: CharacterFeatRow | null;
}

// -----------------------------
// Real-time Subscriptions
// -----------------------------

export function watchCharacterFeats(characterId: number): Readable<FeatChangeEvent[]> {
  return readable<FeatChangeEvent[]>([], (set) => {
    let internalArray: FeatChangeEvent[] = [];
    const channel = supabase.channel(`character_feats_${characterId}`);
    
    const handlePayload = (payload: RealtimePostgresChangesPayload<Partial<CharacterFeatRow>>) => {
      const newRow = parseRow<CharacterFeatRow>(payload.new);
      const oldRow = parseRow<CharacterFeatRow>(payload.old);
      
      const event: FeatChangeEvent = {
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
        table: 'character_feats',
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
// Feat Operations
// -----------------------------

/**
 * Get all feats for a character with properties
 */
export async function getFeats(characterId: number): Promise<FeatWithProperties[]> {
  const { data, error } = await supabase
    .from('character_feats')
    .select(`
      *,
      properties:character_feat_properties(*)
    `)
    .eq('character_id', characterId)
    .order('selected_level');

  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Add new feat
 */
export async function addFeat(
  characterId: number,
  baseFeatId: number,
  selectedLevel: number,
  properties?: Array<{ property_key: string; property_value: string }>
): Promise<FeatWithProperties> {
  // Add the base feat
  const { data: featData, error: featError } = await supabase
    .from('character_feats')
    .insert({
      character_id: characterId,
      base_feat_id: baseFeatId,
      selected_level: selectedLevel,
      sync_status: 'pending'
    })
    .select()
    .single();

  if (featError) throw new Error(featError.message);

  // Add properties if provided
  if (properties && properties.length > 0) {
    const { error: propertiesError } = await supabase
      .from('character_feat_properties')
      .insert(
        properties.map(prop => ({
          character_feat_id: featData.id,
          property_key: prop.property_key,
          property_value: prop.property_value,
          sync_status: 'pending' as const
        }))
      );

    if (propertiesError) throw new Error(propertiesError.message);
  }

  // Return complete feat with properties
  return getFeatById(featData.id);
}

/**
 * Get feat by ID with properties
 */
export async function getFeatById(featId: number): Promise<FeatWithProperties> {
  const { data, error } = await supabase
    .from('character_feats')
    .select(`
      *,
      properties:character_feat_properties(*)
    `)
    .eq('id', featId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Remove feat
 */
export async function removeFeat(featId: number): Promise<void> {
  const { error } = await supabase
    .from('character_feats')
    .delete()
    .eq('id', featId);

  if (error) throw new Error(error.message);
}

// -----------------------------
// Feat Properties
// -----------------------------

/**
 * Add property to feat
 */
export async function addFeatProperty(
  featId: number,
  propertyKey: string,
  propertyValue: string
): Promise<CharacterFeatPropertyRow> {
  const { data, error } = await supabase
    .from('character_feat_properties')
    .insert({
      character_feat_id: featId,
      property_key: propertyKey,
      property_value: propertyValue,
      sync_status: 'pending'
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Update feat property
 */
export async function updateFeatProperty(
  propertyId: number,
  propertyValue: string
): Promise<CharacterFeatPropertyRow> {
  const { data, error } = await supabase
    .from('character_feat_properties')
    .update({
      property_value: propertyValue,
      sync_status: 'pending',
      updated_at: new Date().toISOString()
    })
    .eq('id', propertyId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Remove feat property
 */
export async function removeFeatProperty(propertyId: number): Promise<void> {
  const { error } = await supabase
    .from('character_feat_properties')
    .delete()
    .eq('id', propertyId);

  if (error) throw new Error(error.message);
}