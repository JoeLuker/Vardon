// FILE: src/lib/db/combat.ts

import { supabase } from '$lib/db/supabaseClient';
import { readable, type Readable } from 'svelte/store';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { parseRow } from '$lib/db/utils';
import type { Database } from '$lib/domain/types/supabase';

// ------------------------------------------------------------------------------------------
// Type Definitions
// ------------------------------------------------------------------------------------------

/**
 * natural_attacks row
 */
export type NaturalAttackRow =
  Database['public']['Tables']['natural_attacks']['Row'];

/**
 * character_bombs row
 */
export type CharacterBombRow =
  Database['public']['Tables']['character_bombs']['Row'];

/**
 * Real-time event for natural attacks
 */
export interface NaturalAttackChangeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  newRow: NaturalAttackRow | null;
  oldRow: NaturalAttackRow | null;
}

/**
 * Real-time event for character bombs
 */
export interface CharacterBombChangeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  newRow: CharacterBombRow | null;
  oldRow: CharacterBombRow | null;
}

// ------------------------------------------------------------------------------------------
// Real-time Subscriptions
// ------------------------------------------------------------------------------------------

/**
 * watchNaturalAttacksForEntity(entityId)
 *
 * Subscribes to the `natural_attacks` table for rows with `entity_id=eq.{entityId}`,
 * returning a Svelte `readable` store that accumulates real-time changes.
 *
 * If you want to watch *all* natural attacks, remove or modify the filter.
 */
export function watchNaturalAttacksForEntity(
  entityId: number
): Readable<NaturalAttackChangeEvent[]> {
  return readable<NaturalAttackChangeEvent[]>([], (set) => {
    let internalArray: NaturalAttackChangeEvent[] = [];

    const channel = supabase.channel(`natural_attacks_${entityId}`);

    const handlePayload = (
      payload: RealtimePostgresChangesPayload<Partial<NaturalAttackRow>>
    ) => {
      const newRow = parseRow<NaturalAttackRow>(payload.new);
      const oldRow = parseRow<NaturalAttackRow>(payload.old);

      const event: NaturalAttackChangeEvent = {
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
          table: 'natural_attacks',
          filter: `entity_id=eq.${entityId}`
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
 * watchCharacterBombs(characterId)
 *
 * Subscribes to `character_bombs` for rows with `character_id=eq.{characterId}`,
 * returning a Svelte `readable` store that accumulates real-time events.
 */
export function watchCharacterBombs(
  characterId: number
): Readable<CharacterBombChangeEvent[]> {
  return readable<CharacterBombChangeEvent[]>([], (set) => {
    let internalArray: CharacterBombChangeEvent[] = [];

    const channel = supabase.channel(`character_bombs_${characterId}`);

    const handlePayload = (
      payload: RealtimePostgresChangesPayload<Partial<CharacterBombRow>>
    ) => {
      const newRow = parseRow<CharacterBombRow>(payload.new);
      const oldRow = parseRow<CharacterBombRow>(payload.old);

      const event: CharacterBombChangeEvent = {
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
          table: 'character_bombs',
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
// Natural Attacks CRUD
// ------------------------------------------------------------------------------------------

/**
 * getNaturalAttacksForEntity(entityId)
 *
 * Retrieve all natural attacks for a given entity (e.g., a monster or character).
 */
export async function getNaturalAttacksForEntity(
  entityId: number
): Promise<NaturalAttackRow[]> {
  const { data, error } = await supabase
    .from('natural_attacks')
    .select('*')
    .eq('entity_id', entityId);

  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

/**
 * addNaturalAttack(entityId, attackType, damage, attackCount)
 *
 * Create a new natural attack row referencing a particular entity.
 */
export async function addNaturalAttack(
  entityId: number,
  attackType: string,
  damage: string,
  attackCount?: number
): Promise<NaturalAttackRow> {
  const { data, error } = await supabase
    .from('natural_attacks')
    .insert({
      entity_id: entityId,
      attack_type: attackType,
      damage,
      attack_count: attackCount ?? null
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

/**
 * updateNaturalAttack(attackId, updates)
 *
 * Update an existing natural attack, e.g., adjusting the damage or type.
 */
export async function updateNaturalAttack(
  attackId: number,
  updates: Partial<Pick<NaturalAttackRow, 'attack_type' | 'damage' | 'attack_count'>>
): Promise<NaturalAttackRow> {
  const { data, error } = await supabase
    .from('natural_attacks')
    .update({
      ...updates
    })
    .eq('id', attackId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

/**
 * removeNaturalAttack(attackId)
 *
 * Remove a single natural attack by ID.
 */
export async function removeNaturalAttack(attackId: number): Promise<void> {
  const { error } = await supabase
    .from('natural_attacks')
    .delete()
    .eq('id', attackId);

  if (error) {
    throw new Error(error.message);
  }
}

// ------------------------------------------------------------------------------------------
// Character Bombs CRUD
// ------------------------------------------------------------------------------------------

/**
 * getBombsForCharacter(characterId)
 *
 * Retrieve all bomb entries (like alchemist bombs, etc.) for a character.
 */
export async function getBombsForCharacter(
  characterId: number
): Promise<CharacterBombRow[]> {
  const { data, error } = await supabase
    .from('character_bombs')
    .select('*')
    .eq('character_id', characterId);

  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

/**
 * addBomb(characterId, bombType, bombsLeft)
 *
 * Creates a bomb record for a character (e.g., track remaining bombs).
 */
export async function addBomb(
  characterId: number,
  bombType: string,
  bombsLeft: number
): Promise<CharacterBombRow> {
  const { data, error } = await supabase
    .from('character_bombs')
    .insert({
      character_id: characterId,
      bomb_type: bombType,
      bombs_left: bombsLeft
      // sync_status: 'pending',
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

/**
 * updateBomb(bombId, updates)
 *
 * Update an existing bomb record, e.g., changing the bomb_type or bombs_left count.
 */
export async function updateBomb(
  bombId: number,
  updates: Partial<Pick<CharacterBombRow, 'bomb_type' | 'bombs_left' | 'sync_status'>>
): Promise<CharacterBombRow> {
  const { data, error } = await supabase
    .from('character_bombs')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', bombId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

/**
 * removeBomb(bombId)
 *
 * Deletes a bomb record from a character’s data.
 */
export async function removeBomb(bombId: number): Promise<void> {
  const { error } = await supabase
    .from('character_bombs')
    .delete()
    .eq('id', bombId);

  if (error) {
    throw new Error(error.message);
  }
}
