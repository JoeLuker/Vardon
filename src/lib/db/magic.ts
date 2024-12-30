// FILE: src/lib/db/magic.ts

import { supabase } from '$lib/db/supabaseClient';
import { readable, type Readable } from 'svelte/store';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

import { parseRow } from '$lib/db/utils'; // shared helper for safely parsing row data

// 1) Import your generated Database types
import type { Database } from '$lib/domain/types/supabase';

// ------------------------------------------------------------------------------------------
// Type Definitions
// ------------------------------------------------------------------------------------------

/**
 * character_known_spells
 */
export type KnownSpellRow = Database['public']['Tables']['character_known_spells']['Row'];

/**
 * character_spell_slots
 */
export type SpellSlotRow = Database['public']['Tables']['character_spell_slots']['Row'];

/**
 * character_extracts
 */
export type ExtractRow = Database['public']['Tables']['character_extracts']['Row'];

/**
 * Real-time events for known spells
 */
export interface KnownSpellChangeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  newRow: KnownSpellRow | null;
  oldRow: KnownSpellRow | null;
}

/**
 * Real-time events for spell slots
 */
export interface SpellSlotChangeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  newRow: SpellSlotRow | null;
  oldRow: SpellSlotRow | null;
}

/**
 * Real-time events for extracts
 */
export interface ExtractChangeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  newRow: ExtractRow | null;
  oldRow: ExtractRow | null;
}

// ------------------------------------------------------------------------------------------
// Real-time Subscriptions
// ------------------------------------------------------------------------------------------

/**
 * watchKnownSpellsForCharacter(characterId)
 *
 * Subscribes to the `character_known_spells` table for rows with `character_id=eq.{characterId}`,
 * returning a Svelte `readable` store that accumulates real-time events.
 */
export function watchKnownSpellsForCharacter(
  characterId: number
): Readable<KnownSpellChangeEvent[]> {
  return readable<KnownSpellChangeEvent[]>([], (set) => {
    let internalArray: KnownSpellChangeEvent[] = [];

    // Create a channel specific to known spells for this character
    const channel = supabase.channel(`known_spells_${characterId}`);

    const handlePayload = (
      payload: RealtimePostgresChangesPayload<Partial<KnownSpellRow>>
    ) => {
      const newRow = parseRow<KnownSpellRow>(payload.new);
      const oldRow = parseRow<KnownSpellRow>(payload.old);

      const event: KnownSpellChangeEvent = {
        eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
        newRow,
        oldRow
      };

      internalArray = [...internalArray, event];
      set(internalArray);
    };

    // Listen for all changes in character_known_spells for this character
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'character_known_spells',
        filter: `character_id=eq.${characterId}`
      },
      handlePayload
    );

    channel.subscribe();

    // Cleanup when unsubscribed
    return () => {
      supabase.removeChannel(channel);
    };
  });
}

/**
 * watchSpellSlotsForCharacter(characterId)
 *
 * Subscribes to `character_spell_slots` for changes related to this character’s spell slots.
 */
export function watchSpellSlotsForCharacter(
  characterId: number
): Readable<SpellSlotChangeEvent[]> {
  return readable<SpellSlotChangeEvent[]>([], (set) => {
    let internalArray: SpellSlotChangeEvent[] = [];

    const channel = supabase.channel(`spell_slots_${characterId}`);

    const handlePayload = (
      payload: RealtimePostgresChangesPayload<Partial<SpellSlotRow>>
    ) => {
      const newRow = parseRow<SpellSlotRow>(payload.new);
      const oldRow = parseRow<SpellSlotRow>(payload.old);

      const event: SpellSlotChangeEvent = {
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
        table: 'character_spell_slots',
        filter: `character_id=eq.${characterId}`
      },
      handlePayload
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  });
}

/**
 * watchExtractsForCharacter(characterId)
 *
 * Subscribes to `character_extracts` for changes related to this character’s extracts.
 */
export function watchExtractsForCharacter(
  characterId: number
): Readable<ExtractChangeEvent[]> {
  return readable<ExtractChangeEvent[]>([], (set) => {
    let internalArray: ExtractChangeEvent[] = [];

    const channel = supabase.channel(`extracts_${characterId}`);

    const handlePayload = (
      payload: RealtimePostgresChangesPayload<Partial<ExtractRow>>
    ) => {
      const newRow = parseRow<ExtractRow>(payload.new);
      const oldRow = parseRow<ExtractRow>(payload.old);

      const event: ExtractChangeEvent = {
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
        table: 'character_extracts',
        filter: `character_id=eq.${characterId}`
      },
      handlePayload
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  });
}

// ------------------------------------------------------------------------------------------
// Known Spells CRUD
// ------------------------------------------------------------------------------------------

/**
 * Retrieve all known spells for a character, sorted by spell level (optional).
 */
export async function getKnownSpellsForCharacter(
  characterId: number
): Promise<KnownSpellRow[]> {
  const { data, error } = await supabase
    .from('character_known_spells')
    .select('*')
    .eq('character_id', characterId)
    .order('spell_level');

  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

/**
 * Add a known spell to a character
 */
export async function addKnownSpell(
  characterId: number,
  spellName: string,
  spellLevel: number
): Promise<KnownSpellRow> {
  const { data, error } = await supabase
    .from('character_known_spells')
    .insert({
      character_id: characterId,
      spell_name: spellName,
      spell_level: spellLevel,
      // you can also set `sync_status: 'pending'` here if you need
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

/**
 * Update a known spell, e.g. changing the level or the name
 */
export async function updateKnownSpell(
  knownSpellId: number,
  updates: Partial<Pick<KnownSpellRow, 'spell_name' | 'spell_level' | 'sync_status'>>
): Promise<KnownSpellRow> {
  const { data, error } = await supabase
    .from('character_known_spells')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', knownSpellId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

/**
 * Remove a known spell from a character
 */
export async function removeKnownSpell(knownSpellId: number): Promise<void> {
  const { error } = await supabase
    .from('character_known_spells')
    .delete()
    .eq('id', knownSpellId);

  if (error) {
    throw new Error(error.message);
  }
}

// ------------------------------------------------------------------------------------------
// Spell Slots CRUD
// ------------------------------------------------------------------------------------------

/**
 * Get all spell slots for a character
 */
export async function getSpellSlotsForCharacter(
  characterId: number
): Promise<SpellSlotRow[]> {
  const { data, error } = await supabase
    .from('character_spell_slots')
    .select('*')
    .eq('character_id', characterId)
    .order('spell_level');

  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

/**
 * Update the number of remaining spell slots for a specific slot ID
 */
export async function updateSpellSlot(
  slotId: number,
  remaining: number
): Promise<SpellSlotRow> {
  const { data, error } = await supabase
    .from('character_spell_slots')
    .update({
      remaining,
      updated_at: new Date().toISOString()
    })
    .eq('id', slotId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

/**
 * Bulk update or create new spell slots for a character (example)
 * (You could tailor this to your specific leveling logic or partial upserts.)
 */
export async function bulkUpsertSpellSlots(
  characterId: number,
  slots: { spell_level: number; total: number; remaining: number }[]
): Promise<void> {
  const { error } = await supabase
    .from('character_spell_slots')
    .upsert(
      slots.map((s) => ({
        character_id: characterId,
        spell_level: s.spell_level,
        total: s.total,
        remaining: s.remaining,
        updated_at: new Date().toISOString()
      })),
      {
        onConflict: 'character_id, spell_level'
      }
    );

  if (error) {
    throw new Error(error.message);
  }
}

// ------------------------------------------------------------------------------------------
// Extracts (e.g., Alchemist extracts) CRUD
// ------------------------------------------------------------------------------------------

/**
 * Get all extracts for a character
 */
export async function getExtractsForCharacter(
  characterId: number
): Promise<ExtractRow[]> {
  const { data, error } = await supabase
    .from('character_extracts')
    .select('*')
    .eq('character_id', characterId)
    .order('extract_level');

  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

/**
 * Add an extract (e.g., an Alchemist’s prepared extract)
 */
export async function addExtract(
  characterId: number,
  extractName: string,
  extractLevel: number,
  preparedCount: number
): Promise<ExtractRow> {
  const { data, error } = await supabase
    .from('character_extracts')
    .insert({
      character_id: characterId,
      extract_name: extractName,
      extract_level: extractLevel,
      prepared: preparedCount, // how many times prepared
      used: 0 // default unused
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

/**
 * Update an extract (e.g., marking how many are used)
 */
export async function updateExtract(
  extractId: number,
  updates: Partial<Pick<ExtractRow, 'prepared' | 'used' | 'sync_status'>>
): Promise<ExtractRow> {
  const { data, error } = await supabase
    .from('character_extracts')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', extractId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

/**
 * Remove an extract from a character
 */
export async function removeExtract(extractId: number): Promise<void> {
  const { error } = await supabase
    .from('character_extracts')
    .delete()
    .eq('id', extractId);

  if (error) {
    throw new Error(error.message);
  }
}
