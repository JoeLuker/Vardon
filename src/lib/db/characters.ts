// FILE: src/lib/db/character.ts

import { supabase } from '$lib/db/supabaseClient';
import { readable, type Readable } from 'svelte/store';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { parseRow } from '$lib/db/utils';
import type { Database } from '$lib/domain/types/supabase';

// -----------------------------
// Type Definitions
// -----------------------------

// Core character types
export type CharacterRow = Database['public']['Tables']['characters']['Row'];
export type CharacterAttributesRow = Database['public']['Tables']['character_attributes']['Row'];
export type CharacterRPGEntityRow = Database['public']['Tables']['character_rpg_entities']['Row'];

// Equipment types
export type CharacterEquipmentRow = Database['public']['Tables']['character_equipment']['Row'];
export type CharacterEquipmentPropertyRow = Database['public']['Tables']['character_equipment_properties']['Row'];
export type CharacterConsumableRow = Database['public']['Tables']['character_consumables']['Row'];

// Extended interfaces
export interface CharacterWithAttributes extends CharacterRow {
  attributes: CharacterAttributesRow;
}

export interface CharacterEquipmentWithProperties extends CharacterEquipmentRow {
  properties: CharacterEquipmentPropertyRow[];
}

// Real-time types
export interface CharacterChangeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  newRow: CharacterRow | null;
  oldRow: CharacterRow | null;
}

// -----------------------------
// Real-time Subscriptions 
// -----------------------------

export function watchCharacter(characterId: number): Readable<CharacterChangeEvent[]> {
  return readable<CharacterChangeEvent[]>([], (set) => {
    let internalArray: CharacterChangeEvent[] = [];
    const channel = supabase.channel(`character_${characterId}`);
    
    const handlePayload = (payload: RealtimePostgresChangesPayload<Partial<CharacterRow>>) => {
      const newRow = parseRow<CharacterRow>(payload.new);
      const oldRow = parseRow<CharacterRow>(payload.old);
      
      const event: CharacterChangeEvent = {
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
        table: 'characters',
        filter: `id=eq.${characterId}`
      },
      handlePayload
    ).subscribe();

    return () => {
      channel.unsubscribe();
    };
  });
}

// -----------------------------
// Core Character Operations
// -----------------------------

/**
 * Create a new character with initial attributes
 */
export async function createCharacter(
  name: string,
  initialAttributes: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  }
): Promise<CharacterWithAttributes> {
  const { data: character, error: charError } = await supabase
    .from('characters')
    .insert({
      name,
      level: 1,
      current_hp: 0,
      max_hp: 0
    })
    .select()
    .single();

  if (charError) throw new Error(charError.message);

  const { data: attributes, error: attrError } = await supabase
    .from('character_attributes')
    .insert({
      character_id: character.id,
      ...initialAttributes
    })
    .select()
    .single();

  if (attrError) throw new Error(attrError.message);

  return {
    ...character,
    attributes
  };
}

/**
 * Get a character's full details
 */
export async function getCharacter(characterId: number): Promise<CharacterWithAttributes> {
  const { data, error } = await supabase
    .from('characters')
    .select(`
      *,
      attributes:character_attributes(*)
    `)
    .eq('id', characterId)
    .single();
  if (error) throw new Error(error.message);
  return {
    ...data,
    attributes: data.attributes[0]
  };
}

/**
 * List all characters (basic info only)
 */
export async function listCharacters(): Promise<CharacterRow[]> {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .order('name');

  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Update basic character information
 */
export async function updateCharacter(
  characterId: number,
  updates: Partial<Pick<CharacterRow, 'name' | 'level' | 'current_hp' | 'max_hp'>>
): Promise<CharacterRow> {
  const { data, error } = await supabase
    .from('characters')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', characterId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Delete a character and all related data
 */
export async function deleteCharacter(characterId: number): Promise<void> {
  const { error } = await supabase
    .from('characters')
    .delete()
    .eq('id', characterId);

  if (error) throw new Error(error.message);
}

// -----------------------------
// Attribute Management
// -----------------------------

/**
 * Update character attributes
 */
export async function updateAttributes(
  characterId: number,
  updates: Partial<Omit<CharacterAttributesRow, 'id' | 'character_id' | 'created_at' | 'updated_at'>>
): Promise<CharacterAttributesRow> {
  const { data, error } = await supabase
    .from('character_attributes')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('character_id', characterId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// -----------------------------
// Equipment Management
// -----------------------------

/**
 * Get all equipment for a character
 */
export async function getCharacterEquipment(
  characterId: number
): Promise<CharacterEquipmentWithProperties[]> {
  const { data, error } = await supabase
    .from('character_equipment')
    .select(`
      *,
      properties:character_equipment_properties(*)
    `)
    .eq('character_id', characterId);

  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Add equipment to a character
 */
export async function addEquipment(
  characterId: number,
  name: string,
  type: string,
  equipped: boolean = false
): Promise<CharacterEquipmentRow> {
  const { data, error } = await supabase
    .from('character_equipment')
    .insert({
      character_id: characterId,
      name,
      type,
      equipped
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Toggle equipment equipped status
 */
export async function toggleEquipment(
  equipmentId: number,
  equipped: boolean
): Promise<CharacterEquipmentRow> {
  const { data, error } = await supabase
    .from('character_equipment')
    .update({
      equipped,
      updated_at: new Date().toISOString()
    })
    .eq('id', equipmentId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Remove equipment from a character
 */
export async function removeEquipment(equipmentId: number): Promise<void> {
  const { error } = await supabase
    .from('character_equipment')
    .delete()
    .eq('id', equipmentId);

  if (error) throw new Error(error.message);
}

// -----------------------------
// Consumables Management
// -----------------------------

/**
 * Get all consumables for a character
 */
export async function getCharacterConsumables(
  characterId: number
): Promise<CharacterConsumableRow[]> {
  const { data, error } = await supabase
    .from('character_consumables')
    .select('*')
    .eq('character_id', characterId);

  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Add consumable to character inventory
 */
export async function addConsumable(
  characterId: number,
  consumableType: string,
  quantity: number = 1
): Promise<CharacterConsumableRow> {
  const { data, error } = await supabase
    .from('character_consumables')
    .insert({
      character_id: characterId,
      consumable_type: consumableType,
      quantity
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Update consumable quantity
 */
export async function updateConsumableQuantity(
  characterId: number,
  consumableType: string,
  quantity: number
): Promise<CharacterConsumableRow> {
  const { data, error } = await supabase
    .from('character_consumables')
    .update({
      quantity,
      updated_at: new Date().toISOString()
    })
    .eq('character_id', characterId)
    .eq('consumable_type', consumableType)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Remove consumable from inventory
 */
export async function removeConsumable(
  characterId: number,
  consumableType: string
): Promise<void> {
  const { error } = await supabase
    .from('character_consumables')
    .delete()
    .eq('character_id', characterId)
    .eq('consumable_type', consumableType);

  if (error) throw new Error(error.message);
}

// -----------------------------
// HP Management
// -----------------------------

/**
 * Update character's current HP
 */
export async function updateCurrentHP(
  characterId: number,
  currentHP: number
): Promise<CharacterRow> {
  const { data, error } = await supabase
    .from('characters')
    .update({
      current_hp: currentHP,
      updated_at: new Date().toISOString()
    })
    .eq('id', characterId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Update character's maximum HP
 */
export async function updateMaxHP(
  characterId: number,
  maxHP: number
): Promise<CharacterRow> {
  const { data, error } = await supabase
    .from('characters')
    .update({
      max_hp: maxHP,
      updated_at: new Date().toISOString()
    })
    .eq('id', characterId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}