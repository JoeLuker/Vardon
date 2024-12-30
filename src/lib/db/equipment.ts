// FILE: src/lib/db/equipment.ts

import { supabase } from '$lib/db/supabaseClient';
import { readable, type Readable } from 'svelte/store';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { parseRow } from '$lib/db/utils';
import type { Database } from '$lib/domain/types/supabase';

// -----------------------------
// Type Definitions
// -----------------------------

// Core equipment types
export type CharacterEquipmentRow = Database['public']['Tables']['character_equipment']['Row'];
export type CharacterEquipmentPropertyRow = Database['public']['Tables']['character_equipment_properties']['Row'];
export type CharacterConsumableRow = Database['public']['Tables']['character_consumables']['Row'];

// Extended interfaces
export interface EquipmentWithProperties extends CharacterEquipmentRow {
  properties: CharacterEquipmentPropertyRow[];
}

// Real-time types
export interface EquipmentChangeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  newRow: CharacterEquipmentRow | null;
  oldRow: CharacterEquipmentRow | null;
}

export interface ConsumableChangeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  newRow: CharacterConsumableRow | null;
  oldRow: CharacterConsumableRow | null;
}

// -----------------------------
// Real-time Subscriptions
// -----------------------------

export function watchCharacterEquipment(characterId: number): Readable<EquipmentChangeEvent[]> {
  return readable<EquipmentChangeEvent[]>([], (set) => {
    let internalArray: EquipmentChangeEvent[] = [];
    const channel = supabase.channel(`character_equipment_${characterId}`);
    
    const handlePayload = (payload: RealtimePostgresChangesPayload<Partial<CharacterEquipmentRow>>) => {
      const newRow = parseRow<CharacterEquipmentRow>(payload.new);
      const oldRow = parseRow<CharacterEquipmentRow>(payload.old);
      
      const event: EquipmentChangeEvent = {
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
        table: 'character_equipment',
        filter: `character_id=eq.${characterId}`
      },
      handlePayload
    ).subscribe();

    return () => {
      channel.unsubscribe();
    };
  });
}

export function watchCharacterConsumables(characterId: number): Readable<ConsumableChangeEvent[]> {
  return readable<ConsumableChangeEvent[]>([], (set) => {
    let internalArray: ConsumableChangeEvent[] = [];
    const channel = supabase.channel(`character_consumables_${characterId}`);
    
    const handlePayload = (payload: RealtimePostgresChangesPayload<Partial<CharacterConsumableRow>>) => {
      const newRow = parseRow<CharacterConsumableRow>(payload.new);
      const oldRow = parseRow<CharacterConsumableRow>(payload.old);
      
      const event: ConsumableChangeEvent = {
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
        table: 'character_consumables',
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
// Equipment Operations
// -----------------------------

/**
 * Get all equipment for a character with properties
 */
export async function getEquipment(characterId: number): Promise<EquipmentWithProperties[]> {
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
 * Get equipment by type
 */
export async function getEquipmentByType(
  characterId: number,
  type: string
): Promise<EquipmentWithProperties[]> {
  const { data, error } = await supabase
    .from('character_equipment')
    .select(`
      *,
      properties:character_equipment_properties(*)
    `)
    .eq('character_id', characterId)
    .eq('type', type);

  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Add new equipment
 */
export async function addEquipment(
  characterId: number,
  equipment: {
    name: string;
    type: string;
    equipped?: boolean;
    properties?: Array<{ property_key: string; property_value: string }>;
  }
): Promise<EquipmentWithProperties> {
  // Add the base equipment
  const { data: equipmentData, error: equipmentError } = await supabase
    .from('character_equipment')
    .insert({
      character_id: characterId,
      name: equipment.name,
      type: equipment.type,
      equipped: equipment.equipped ?? false
    })
    .select()
    .single();

  if (equipmentError) throw new Error(equipmentError.message);

  // Add properties if provided
  if (equipment.properties && equipment.properties.length > 0) {
    const { error: propertiesError } = await supabase
      .from('character_equipment_properties')
      .insert(
        equipment.properties.map(prop => ({
          equipment_id: equipmentData.id,
          property_key: prop.property_key,
          property_value: prop.property_value
        }))
      );

    if (propertiesError) throw new Error(propertiesError.message);
  }

  // Return complete equipment with properties
  return getEquipmentById(equipmentData.id);
}

/**
 * Get equipment by ID with properties
 */
export async function getEquipmentById(equipmentId: number): Promise<EquipmentWithProperties> {
  const { data, error } = await supabase
    .from('character_equipment')
    .select(`
      *,
      properties:character_equipment_properties(*)
    `)
    .eq('id', equipmentId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Update equipment
 */
export async function updateEquipment(
  equipmentId: number,
  updates: Partial<Pick<CharacterEquipmentRow, 'name' | 'type' | 'equipped'>>
): Promise<EquipmentWithProperties> {
  const { data, error } = await supabase
    .from('character_equipment')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', equipmentId)
    .select(`
      *,
      properties:character_equipment_properties(*)
    `)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Remove equipment
 */
export async function removeEquipment(equipmentId: number): Promise<void> {
  const { error } = await supabase
    .from('character_equipment')
    .delete()
    .eq('id', equipmentId);

  if (error) throw new Error(error.message);
}

// -----------------------------
// Equipment Properties
// -----------------------------

/**
 * Add property to equipment
 */
export async function addEquipmentProperty(
  equipmentId: number,
  propertyKey: string,
  propertyValue: string
): Promise<CharacterEquipmentPropertyRow> {
  const { data, error } = await supabase
    .from('character_equipment_properties')
    .insert({
      equipment_id: equipmentId,
      property_key: propertyKey,
      property_value: propertyValue
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Update equipment property
 */
export async function updateEquipmentProperty(
  propertyId: number,
  propertyValue: string
): Promise<CharacterEquipmentPropertyRow> {
  const { data, error } = await supabase
    .from('character_equipment_properties')
    .update({
      property_value: propertyValue,
      updated_at: new Date().toISOString()
    })
    .eq('id', propertyId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Remove equipment property
 */
export async function removeEquipmentProperty(propertyId: number): Promise<void> {
  const { error } = await supabase
    .from('character_equipment_properties')
    .delete()
    .eq('id', propertyId);

  if (error) throw new Error(error.message);
}

// -----------------------------
// Consumables
// -----------------------------

/**
 * Get all consumables for a character
 */
export async function getConsumables(characterId: number): Promise<CharacterConsumableRow[]> {
  const { data, error } = await supabase
    .from('character_consumables')
    .select('*')
    .eq('character_id', characterId);

  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Add consumable
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
  consumableId: number,
  quantity: number
): Promise<CharacterConsumableRow> {
  const { data, error } = await supabase
    .from('character_consumables')
    .update({
      quantity,
      updated_at: new Date().toISOString()
    })
    .eq('id', consumableId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Remove consumable
 */
export async function removeConsumable(consumableId: number): Promise<void> {
  const { error } = await supabase
    .from('character_consumables')
    .delete()
    .eq('id', consumableId);

  if (error) throw new Error(error.message);
}