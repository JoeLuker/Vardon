// FILE: src/lib/db/discoveries.ts

import { supabase } from '$lib/db/supabaseClient';
import { readable, type Readable } from 'svelte/store';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { parseRow } from '$lib/db/utils';

import type { Database } from '$lib/domain/types/supabase';

/* ------------------------------------------------------------------------
 * Type Definitions
 * ------------------------------------------------------------------------ */

/**
 * character_discoveries row
 */
export type CharacterDiscoveryRow =
  Database['public']['Tables']['character_discoveries']['Row'];

/**
 * character_discovery_properties row
 */
export type CharacterDiscoveryPropertyRow =
  Database['public']['Tables']['character_discovery_properties']['Row'];

/**
 * Extended interface if you want to combine a discovery with its properties.
 */
export interface DiscoveryWithProperties extends CharacterDiscoveryRow {
  properties: CharacterDiscoveryPropertyRow[];
}

/**
 * Real-time event type for discovery changes.
 */
export interface DiscoveryChangeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  newRow: CharacterDiscoveryRow | null;
  oldRow: CharacterDiscoveryRow | null;
}

/**
 * Real-time event type for discovery property changes.
 */
export interface DiscoveryPropertyChangeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  newRow: CharacterDiscoveryPropertyRow | null;
  oldRow: CharacterDiscoveryPropertyRow | null;
}

/* ------------------------------------------------------------------------
 * Real-time Subscriptions
 * ------------------------------------------------------------------------ */

/**
 * watchCharacterDiscoveries(characterId)
 *
 * Subscribes to `character_discoveries` for rows with `character_id=eq.{characterId}`,
 * returning a Svelte `readable` store of real-time events.
 */
export function watchCharacterDiscoveries(
  characterId: number
): Readable<DiscoveryChangeEvent[]> {
  return readable<DiscoveryChangeEvent[]>([], (set) => {
    let internalArray: DiscoveryChangeEvent[] = [];

    const channel = supabase.channel(`character_discoveries_${characterId}`);

    const handlePayload = (
      payload: RealtimePostgresChangesPayload<Partial<CharacterDiscoveryRow>>
    ) => {
      const newRow = parseRow<CharacterDiscoveryRow>(payload.new);
      const oldRow = parseRow<CharacterDiscoveryRow>(payload.old);

      const event: DiscoveryChangeEvent = {
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
          table: 'character_discoveries',
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
 * watchDiscoveryProperties(characterId)
 *
 * If you need to monitor changes in `character_discovery_properties`,
 * you can do so similarly—though it only has `character_discovery_id`,
 * so you might need a more advanced filter. For simplicity’s sake,
 * we’re not filtering by character_id here; you can customize as needed.
 */
export function watchDiscoveryProperties(): Readable<DiscoveryPropertyChangeEvent[]> {
  return readable<DiscoveryPropertyChangeEvent[]>([], (set) => {
    let internalArray: DiscoveryPropertyChangeEvent[] = [];

    const channel = supabase.channel(`character_discovery_properties`);

    const handlePayload = (
      payload: RealtimePostgresChangesPayload<Partial<CharacterDiscoveryPropertyRow>>
    ) => {
      const newRow = parseRow<CharacterDiscoveryPropertyRow>(payload.new);
      const oldRow = parseRow<CharacterDiscoveryPropertyRow>(payload.old);

      const event: DiscoveryPropertyChangeEvent = {
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
          table: 'character_discovery_properties'
          // .filter(...) if your schema supports it
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
 * Discovery CRUD
 * ------------------------------------------------------------------------ */

/**
 * getDiscoveriesForCharacter(characterId)
 *
 * Returns all discoveries for a character. If you need the associated properties,
 * you can do a Supabase multi-table select to get them in one query:
 *
 *   .select('*, properties:character_discovery_properties(*)')
 */
export async function getDiscoveriesForCharacter(
  characterId: number
): Promise<CharacterDiscoveryRow[]> {
  const { data, error } = await supabase
    .from('character_discoveries')
    .select('*')
    .eq('character_id', characterId)
    .order('selected_level');

  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

/**
 * getDiscoveryById(discoveryId)
 *
 * Retrieves a single discovery by ID, optionally with properties.
 */
export async function getDiscoveryById(
  discoveryId: number
): Promise<DiscoveryWithProperties> {
  const { data, error } = await supabase
    .from('character_discoveries')
    .select(
      `
        *,
        properties:character_discovery_properties(*)
      `
    )
    .eq('id', discoveryId)
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

/**
 * addDiscovery(characterId, discoveryName, selectedLevel, [properties])
 *
 * Inserts a new discovery row for a character, optionally adding property rows.
 */
export async function addDiscovery(
  characterId: number,
  discoveryName: string,
  selectedLevel: number,
  properties?: Array<{ property_key: string; property_value: string }>
): Promise<DiscoveryWithProperties> {
  // 1) Insert the base discovery
  const { data: discoveryData, error: discError } = await supabase
    .from('character_discoveries')
    .insert({
      character_id: characterId,
      discovery_name: discoveryName,
      selected_level: selectedLevel,
      // sync_status: 'pending'
    })
    .select()
    .single();

  if (discError) {
    throw new Error(discError.message);
  }

  // 2) Insert property rows (optional)
  if (properties && properties.length > 0) {
    const { error: propError } = await supabase
      .from('character_discovery_properties')
      .insert(
        properties.map((p) => ({
          character_discovery_id: discoveryData.id,
          property_key: p.property_key,
          property_value: p.property_value,
          // sync_status: 'pending'
        }))
      );
    if (propError) {
      throw new Error(propError.message);
    }
  }

  // 3) Return the full discovery with properties
  return await getDiscoveryById(discoveryData.id);
}

/**
 * updateDiscovery(discoveryId, updates)
 *
 * Updates a single discovery row’s fields, e.g. changing the name, level, or sync_status.
 */
export async function updateDiscovery(
  discoveryId: number,
  updates: Partial<
    Pick<CharacterDiscoveryRow, 'discovery_name' | 'selected_level' | 'sync_status'>
  >
): Promise<CharacterDiscoveryRow> {
  const { data, error } = await supabase
    .from('character_discoveries')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', discoveryId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

/**
 * removeDiscovery(discoveryId)
 *
 * Deletes the discovery row. Possibly cascades to remove discovery properties if your DB
 * has ON DELETE CASCADE constraints.
 */
export async function removeDiscovery(discoveryId: number): Promise<void> {
  const { error } = await supabase
    .from('character_discoveries')
    .delete()
    .eq('id', discoveryId);

  if (error) {
    throw new Error(error.message);
  }
}

/* ------------------------------------------------------------------------
 * Discovery Properties CRUD
 * ------------------------------------------------------------------------ */

/**
 * getDiscoveryProperties(discoveryId)
 *
 * Fetch the property rows associated with a given discovery.
 */
export async function getDiscoveryProperties(
  discoveryId: number
): Promise<CharacterDiscoveryPropertyRow[]> {
  const { data, error } = await supabase
    .from('character_discovery_properties')
    .select('*')
    .eq('character_discovery_id', discoveryId);

  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

/**
 * addDiscoveryProperty(discoveryId, propertyKey, propertyValue)
 *
 * Adds a single property to a discovery.
 */
export async function addDiscoveryProperty(
  discoveryId: number,
  propertyKey: string,
  propertyValue: string
): Promise<CharacterDiscoveryPropertyRow> {
  const { data, error } = await supabase
    .from('character_discovery_properties')
    .insert({
      character_discovery_id: discoveryId,
      property_key: propertyKey,
      property_value: propertyValue,
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
 * updateDiscoveryProperty(propertyId, propertyValue)
 *
 * Update a property’s value (or other columns, if you have them).
 */
export async function updateDiscoveryProperty(
  propertyId: number,
  propertyValue: string
): Promise<CharacterDiscoveryPropertyRow> {
  const { data, error } = await supabase
    .from('character_discovery_properties')
    .update({
      property_value: propertyValue,
      updated_at: new Date().toISOString(),
      // sync_status: 'pending',
    })
    .eq('id', propertyId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

/**
 * removeDiscoveryProperty(propertyId)
 *
 * Removes a single property row from a discovery.
 */
export async function removeDiscoveryProperty(propertyId: number): Promise<void> {
  const { error } = await supabase
    .from('character_discovery_properties')
    .delete()
    .eq('id', propertyId);

  if (error) {
    throw new Error(error.message);
  }
}
