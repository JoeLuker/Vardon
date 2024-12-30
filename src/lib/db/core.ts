// FILE: src/lib/db/core.ts

import { supabase } from '$lib/db/supabaseClient';
import { readable, type Readable } from 'svelte/store';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { parseRow } from '$lib/db/utils';
import type { Database } from '$lib/domain/types/supabase';

// -------------------------------------
// Existing Exports
// -------------------------------------
export type CharacterRow = Database['public']['Tables']['characters']['Row'];
export type CharacterAttributesRow = Database['public']['Tables']['character_attributes']['Row'];
export type RPGEntityRow = Database['public']['Tables']['rpg_entities']['Row'];
export type CharacterRPGEntityRow = Database['public']['Tables']['character_rpg_entities']['Row'];
export type EntityChoiceRow = Database['public']['Tables']['entity_choices']['Row'];
export type CharacterEntityChoiceRow = Database['public']['Tables']['character_entity_choices']['Row'];

// NEW: entity_prerequisites row
export type EntityPrerequisiteRow =
  Database['public']['Tables']['entity_prerequisites']['Row'];

// Extended interface for character with relations
export interface CharacterWithRelations extends CharacterRow {
  character_attributes: CharacterAttributesRow | null;
  character_rpg_entities: (CharacterRPGEntityRow & {
    rpg_entities: RPGEntityRow;
    entity_choices: EntityChoiceRow[];
  })[];
}

// Real-time watching interfaces
export interface CharacterChangeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  newRow: CharacterRow | null;
  oldRow: CharacterRow | null;
}

export interface EntityPrerequisiteChangeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  newRow: EntityPrerequisiteRow | null;
  oldRow: EntityPrerequisiteRow | null;
}

/**
 * watchCharacter(characterId)
 * 
 * Subscribes to changes for a specific character and their related data.
 */
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
    );

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[db/core] Subscribed to character ${characterId}`);
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  });
}

/**
 * watchEntityPrerequisites()
 *
 * If you want a real-time feed for all `entity_prerequisites`.
 * You can refine the filter (e.g., `entity_id=eq.X`) if you only want 
 * prerequisites for one specific entity.
 */
export function watchEntityPrerequisites(): Readable<EntityPrerequisiteChangeEvent[]> {
  return readable<EntityPrerequisiteChangeEvent[]>([], (set) => {
    let internalArray: EntityPrerequisiteChangeEvent[] = [];

    const channel = supabase.channel(`entity_prerequisites_all`);

    const handlePayload = (
      payload: RealtimePostgresChangesPayload<Partial<EntityPrerequisiteRow>>
    ) => {
      const newRow = parseRow<EntityPrerequisiteRow>(payload.new);
      const oldRow = parseRow<EntityPrerequisiteRow>(payload.old);

      const event: EntityPrerequisiteChangeEvent = {
        eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
        newRow,
        oldRow,
      };

      internalArray = [...internalArray, event];
      set(internalArray);
    };

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'entity_prerequisites',
      },
      handlePayload
    ).subscribe();

    return () => {
      channel.unsubscribe();
    };
  });
}

// -----------------------------
// GETTERS
// -----------------------------

/**
 * getCharacter(characterId)
 * 
 * Retrieve a character and all their core related data
 */
export async function getCharacter(characterId: number): Promise<CharacterWithRelations> {
  const { data, error } = await supabase
    .from('characters')
    .select(`
      *,
      character_attributes(*),
      character_rpg_entities(
        *,
        rpg_entities(*),
        entity_choices(*)
      )
    `)
    .eq('id', characterId)
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as CharacterWithRelations;
}

/**
 * listCharacters()
 * 
 * Get a list of all characters (basic info only)
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
 * getEntityPrerequisites(entityId?: number)
 *
 * Retrieves prerequisites for all entities or for a specific `entity_id`.
 */
export async function getEntityPrerequisites(entityId?: number): Promise<EntityPrerequisiteRow[]> {
  const query = supabase
    .from('entity_prerequisites')
    .select('*');

  if (entityId) {
    query.eq('entity_id', entityId);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data ?? [];
}

// -----------------------------
// Character CRUD
// -----------------------------

/** Create a new character with initial attributes */
export async function createCharacter(
  name: string,
  initialAttributes: Omit<CharacterAttributesRow, 'id' | 'character_id' | 'created_at' | 'updated_at'>
): Promise<CharacterWithRelations> {
  // Start a Supabase transaction
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

  // Add initial attributes
  const { error: attrError } = await supabase
    .from('character_attributes')
    .insert({
      character_id: character.id,
      ...initialAttributes
    });

  if (attrError) throw new Error(attrError.message);

  // Return the full character data
  return await getCharacter(character.id);
}

/** Update basic character information */
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

/** Update character attributes */
export async function updateCharacterAttributes(
  characterId: number,
  updates: Partial<Pick<CharacterAttributesRow, 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'>>
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

/** Delete a character and all related data */
export async function deleteCharacter(characterId: number): Promise<void> {
  const { error } = await supabase
    .from('characters')
    .delete()
    .eq('id', characterId);

  if (error) throw new Error(error.message);
}

// -----------------------------
// RPG Entity Management
// -----------------------------

/** Add an RPG entity to a character */
export async function addCharacterEntity(
  characterId: number,
  entityId: number,
  selectedLevel?: number
): Promise<CharacterRPGEntityRow> {
  const { data, error } = await supabase
    .from('character_rpg_entities')
    .insert({
      character_id: characterId,
      entity_id: entityId,
      selected_level: selectedLevel ?? null,
      is_active: true
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Update a character's entity relationship */
export async function updateCharacterEntity(
  characterId: number,
  entityId: number,
  updates: Partial<Pick<CharacterRPGEntityRow, 'selected_level' | 'is_active'>>
): Promise<CharacterRPGEntityRow> {
  const { data, error } = await supabase
    .from('character_rpg_entities')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('character_id', characterId)
    .eq('entity_id', entityId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Remove an RPG entity from a character */
export async function removeCharacterEntity(
  characterId: number,
  entityId: number
): Promise<void> {
  const { error } = await supabase
    .from('character_rpg_entities')
    .delete()
    .eq('character_id', characterId)
    .eq('entity_id', entityId);

  if (error) throw new Error(error.message);
}

// -----------------------------
// Entity Choices
// -----------------------------

/** Add a choice to a character's entity */
export async function addCharacterEntityChoice(
  characterEntityId: number,
  choiceKey: string,
  choiceValue: string
): Promise<CharacterEntityChoiceRow> {
  const { data, error } = await supabase
    .from('character_entity_choices')
    .insert({
      character_entity_id: characterEntityId,
      choice_key: choiceKey,
      choice_value: choiceValue
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Update a character's entity choice */
export async function updateCharacterEntityChoice(
  choiceId: number,
  updates: Partial<Pick<CharacterEntityChoiceRow, 'choice_key' | 'choice_value'>>
): Promise<CharacterEntityChoiceRow> {
  const { data, error } = await supabase
    .from('character_entity_choices')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', choiceId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Remove a character's entity choice */
export async function removeCharacterEntityChoice(choiceId: number): Promise<void> {
  const { error } = await supabase
    .from('character_entity_choices')
    .delete()
    .eq('id', choiceId);

  if (error) throw new Error(error.message);
}

// -----------------------------
// Entity Prerequisites
// -----------------------------

/**
 * addEntityPrerequisite(entityId, prereqType, prereqValue, requiredEntityId?)
 *
 * Creates a new prerequisite row referencing an `entity_id` and optionally a `required_entity_id`.
 */
export async function addEntityPrerequisite(
  entityId: number,
  prereqType: string,
  prereqValue: string,
  requiredEntityId?: number
): Promise<EntityPrerequisiteRow> {
  const { data, error } = await supabase
    .from('entity_prerequisites')
    .insert({
      entity_id: entityId,
      prereq_type: prereqType,
      prereq_value: prereqValue,
      required_entity_id: requiredEntityId ?? null
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * updateEntityPrerequisite(prereqId, updates)
 *
 * Updates an existing prerequisite row, e.g. changing its type or required_entity_id.
 */
export async function updateEntityPrerequisite(
  prereqId: number,
  updates: Partial<
    Pick<EntityPrerequisiteRow, 'prereq_type' | 'prereq_value' | 'required_entity_id'>
  >
): Promise<EntityPrerequisiteRow> {
  const { data, error } = await supabase
    .from('entity_prerequisites')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', prereqId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * removeEntityPrerequisite(prereqId)
 *
 * Deletes one row from `entity_prerequisites`.
 */
export async function removeEntityPrerequisite(prereqId: number): Promise<void> {
  const { error } = await supabase
    .from('entity_prerequisites')
    .delete()
    .eq('id', prereqId);

  if (error) throw new Error(error.message);
}