// FILE: src/lib/db/abp.ts

import { supabase } from '$lib/db/supabaseClient';
import { readable, type Readable } from 'svelte/store';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

import { parseRow } from '$lib/db/utils'; // <--- shared helper

// 1) Import your generated Database types
import type { Database } from '$lib/domain/types/supabase';

// 2) Create aliases for clarity
export type ABPBonusRow = Database['public']['Tables']['character_abp_bonuses']['Row'];
export type ABPBonusTargetsRow =
  Database['public']['Tables']['character_abp_bonus_targets']['Row'];
export type ABPBonusTypeRow = Database['public']['Tables']['abp_bonus_types']['Row'];

/**
 * Extended interface describing ABP bonus row plus its related data:
 *  - abp_bonus_types (via foreign key)
 *  - character_abp_bonus_targets (child rows)
 */
export interface ABPBonusWithRelations extends ABPBonusRow {
  abp_bonus_types: ABPBonusTypeRow | null;
  character_abp_bonus_targets: ABPBonusTargetsRow[];
}

// -----------------------------
// Real-time watching of ABP bonuses
// -----------------------------

export interface ABPBonusChangeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  newRow: ABPBonusRow | null;
  oldRow: ABPBonusRow | null;
}

/**
 * watchABPBonusesForCharacter(characterId)
 *
 * Subscribes to the `character_abp_bonuses` table for rows with `character_id=eq.{characterId}`,
 * returning a Svelte `readable` store that accumulates real-time events.
 */
export function watchABPBonusesForCharacter(
  characterId: number
): Readable<ABPBonusChangeEvent[]> {
  return readable<ABPBonusChangeEvent[]>([], (set) => {
    let internalArray: ABPBonusChangeEvent[] = [];

    // Create a channel specific to this character's ABP
    const channel = supabase.channel(`abp_bonuses_${characterId}`);

    const handlePayload = (
      payload: RealtimePostgresChangesPayload<Partial<ABPBonusRow>>
    ) => {
      // Instead of inline object checks, use parseRow<T>
      const newRow = parseRow<ABPBonusRow>(payload.new);
      const oldRow = parseRow<ABPBonusRow>(payload.old);

      const event: ABPBonusChangeEvent = {
        eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
        newRow,
        oldRow
      };

      internalArray = [...internalArray, event];
      set(internalArray);
    };

    // Listen for all changes in character_abp_bonuses for `character_id=eq.X`
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'character_abp_bonuses',
        filter: `character_id=eq.${characterId}`
      },
      handlePayload
    );

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(
          `[db/abp] Subscribed to character_abp_bonuses for character ${characterId}`
        );
      }
    });

    // Cleanup when unsubscribed
    return () => {
      supabase.removeChannel(channel);
    };
  });
}

// -----------------------------
// GETTERS (with 5NF Joins)
// -----------------------------

/**
 * getABPBonusesForCharacter(characterId)
 * 
 * Pull:
 *  - all rows from `character_abp_bonuses` (for that character)
 *  - the related `abp_bonus_types` row (via bonus_type_id)
 *  - child rows from `character_abp_bonus_targets`
 */
export async function getABPBonusesForCharacter(
  characterId: number
): Promise<ABPBonusWithRelations[]> {
  const { data, error } = await supabase
    .from('character_abp_bonuses')
    .select('*, abp_bonus_types(*), character_abp_bonus_targets(*)')
    .eq('character_id', characterId);

  if (error) {
    throw new Error(error.message);
  }
  // data is (ABPBonusWithRelations[] | null)
  return (data ?? []) as unknown as ABPBonusWithRelations[];
}

/**
 * getBonusTypes()
 *
 * Convenience function to retrieve all bonus types from `abp_bonus_types`.
 */
export async function getBonusTypes(): Promise<ABPBonusTypeRow[]> {
  const { data, error } = await supabase
    .from('abp_bonus_types')
    .select('*')
    .order('name');

  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

// -----------------------------
// CRUD for `character_abp_bonuses`
// -----------------------------

/** Create a new ABP bonus row for a character. */
export async function addABPBonus(
  characterId: number,
  bonusTypeId: number,
  value: number
): Promise<ABPBonusRow> {
  const { data, error } = await supabase
    .from('character_abp_bonuses')
    .insert({
      character_id: characterId,
      bonus_type_id: bonusTypeId,
      value
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as ABPBonusRow;
}

/** Update a single ABP bonus row (e.g. `value`) by ID. */
export async function updateABPBonus(
  bonusId: number,
  newValue: number
): Promise<ABPBonusRow> {
  const { data, error } = await supabase
    .from('character_abp_bonuses')
    .update({
      value: newValue,
      updated_at: new Date().toISOString()
    })
    .eq('id', bonusId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as ABPBonusRow;
}

/** Delete an ABP bonus row by ID. */
export async function removeABPBonus(bonusId: number): Promise<void> {
  const { error } = await supabase
    .from('character_abp_bonuses')
    .delete()
    .eq('id', bonusId);

  if (error) throw new Error(error.message);
}

// -----------------------------
// Managing Bonus Targets (child table)
// -----------------------------

/** Insert a new target row for a given ABP bonus ID. */
export async function addBonusTarget(
  abpBonusId: number,
  targetKey: string,
  targetValue: string
): Promise<ABPBonusTargetsRow> {
  const { data, error } = await supabase
    .from('character_abp_bonus_targets')
    .insert({
      abp_bonus_id: abpBonusId,
      target_key: targetKey,
      target_value: targetValue
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as ABPBonusTargetsRow;
}

/** Update an existing target record by ID. */
export async function updateBonusTarget(
  targetId: number,
  updatedFields: Partial<Pick<ABPBonusTargetsRow, 'target_key' | 'target_value'>>
): Promise<ABPBonusTargetsRow> {
  const { data, error } = await supabase
    .from('character_abp_bonus_targets')
    .update({
      ...updatedFields,
      updated_at: new Date().toISOString()
    })
    .eq('id', targetId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as ABPBonusTargetsRow;
}

/** Delete a bonus target record by ID. */
export async function removeBonusTarget(targetId: number): Promise<void> {
  const { error } = await supabase
    .from('character_abp_bonus_targets')
    .delete()
    .eq('id', targetId);

  if (error) throw new Error(error.message);
}

// -----------------------------
// Bonus Types
// -----------------------------

/** Create a new ABP bonus type. */
export async function addBonusType(
  name: string,
  label?: string
): Promise<ABPBonusTypeRow> {
  const { data, error } = await supabase
    .from('abp_bonus_types')
    .insert({
      name,
      label: label ?? null
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as ABPBonusTypeRow;
}

/** Update an existing ABP bonus type by ID. */
export async function updateBonusType(
  bonusTypeId: number,
  updatedFields: Partial<Pick<ABPBonusTypeRow, 'name' | 'label'>>
): Promise<ABPBonusTypeRow> {
  const { data, error } = await supabase
    .from('abp_bonus_types')
    .update(updatedFields)
    .eq('id', bonusTypeId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as ABPBonusTypeRow;
}

/** Delete an existing ABP bonus type. */
export async function removeBonusType(bonusTypeId: number): Promise<void> {
  const { error } = await supabase
    .from('abp_bonus_types')
    .delete()
    .eq('id', bonusTypeId);

  if (error) throw new Error(error.message);
}
