// FILE: src/lib/db/feats.ts

import { supabase } from '$lib/db/supabaseClient';
import type { Json } from '$lib/domain/types/supabase';

/**
 * 1. BASE FEATS (the “master” feats table)
 *    Typically stored in `base_feats`.
 */

// A shape for the row in `base_feats` if you want to do e.g. create/update
export interface BaseFeatData {
  name: string;
  label?: string;      // optional if your table has a label column
  feat_type: string;   // e.g. "combat", "metamagic", etc.
  description?: string | null;
  effects?: Json;      // optional JSON for the feat’s mechanical effects
  prerequisites?: Json | null; // optional JSON for prereqs
}

// The “Row” shape from your Supabase-generated types (for `base_feats`) might be:
export interface DatabaseBaseFeat {
  id: number;
  name: string;
  label: string;
  feat_type: string;
  description: string | null;
  effects: Json;
  prerequisites: Json | null;
  created_at: string;
  updated_at: string;
}

/**
 * Create a new base feat in `base_feats`.
 */
export async function createBaseFeat(data: BaseFeatData): Promise<DatabaseBaseFeat> {
  const { data: result, error } = await supabase
    .from('base_feats')
    .insert({
      name: data.name,
      label: data.label ?? data.name, // fallback if label is missing
      feat_type: data.feat_type,
      description: data.description ?? null,
      effects: data.effects ?? {},
      prerequisites: data.prerequisites ?? null
      // plus any other columns you have
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return result as DatabaseBaseFeat;
}

/**
 * Update an existing base feat in `base_feats` by ID.
 */
export async function updateBaseFeat(
  featId: number,
  changes: Partial<BaseFeatData>
): Promise<DatabaseBaseFeat> {
  const { data: result, error } = await supabase
    .from('base_feats')
    .update({
      ...(changes.name !== undefined && { name: changes.name }),
      ...(changes.label !== undefined && { label: changes.label }),
      ...(changes.feat_type !== undefined && { feat_type: changes.feat_type }),
      ...(changes.description !== undefined && { description: changes.description }),
      ...(changes.effects !== undefined && { effects: changes.effects }),
      ...(changes.prerequisites !== undefined && { prerequisites: changes.prerequisites })
    })
    .eq('id', featId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return result as DatabaseBaseFeat;
}

/**
 * Delete a base feat by ID from `base_feats`.
 * Typically you'd want to ensure no existing `character_feats`
 * rows reference it before removing.
 */
export async function removeBaseFeat(featId: number): Promise<void> {
  const { error } = await supabase
    .from('base_feats')
    .delete()
    .eq('id', featId);

  if (error) throw new Error(error.message);
}

/**
 * Get a single base feat by ID, including everything you need from the DB row.
 */
export async function getBaseFeatById(featId: number): Promise<DatabaseBaseFeat | null> {
  const { data, error } = await supabase
    .from('base_feats')
    .select('*')
    .eq('id', featId)
    .single();

  if (error?.message === 'Multiple or no rows found for the query') {
    return null; // not found
  }
  if (error) throw new Error(error.message);

  return data as DatabaseBaseFeat;
}

/**
 * Get a list of all base feats (e.g. for picking from a UI).
 */
export async function getAllBaseFeats(): Promise<DatabaseBaseFeat[]> {
  const { data, error } = await supabase
    .from('base_feats')
    .select('*')
    .order('name'); // or label, or id, etc.

  if (error) throw new Error(error.message);
  return data as DatabaseBaseFeat[];
}

/* ---------------------------------------------------------------------------
 * 2. CHARACTER FEATS (the “junction” table `character_feats`)
 *    Linking a `character` to a `base_feat`.
 * ---------------------------------------------------------------------------
 */

// The row shape from your Supabase types:
export interface DatabaseCharacterFeat {
  id: number;
  base_feat_id: number | null;
  character_id: number | null;
  selected_level: number;
  properties: Json | null;
  sync_status: string | null;
  updated_at: string;
}

// Data shape for connecting a feat to a character
export interface CharacterFeatData {
  base_feat_id: number;  // which feat from base_feats
  character_id: number;  // which character
  selected_level: number;
  properties?: Json;     // optional
  id?: number;           // if present => update an existing row
}

/**
 * Creates a new row in `character_feats` linking a base_feat to a character,
 * or updates an existing row if `id` is provided.
 */
export async function saveCharacterFeat(data: CharacterFeatData): Promise<DatabaseCharacterFeat> {
  const query = !data.id
    ? supabase
        .from('character_feats')
        .insert({
          base_feat_id: data.base_feat_id,
          character_id: data.character_id,
          selected_level: data.selected_level,
          properties: data.properties ?? null
        })
    : supabase
        .from('character_feats')
        .update({
          base_feat_id: data.base_feat_id,
          selected_level: data.selected_level,
          ...(data.properties !== undefined && { properties: data.properties })
        })
        .eq('id', data.id);

  const { data: result, error } = await query.select().single();
  if (error) throw new Error(error.message);

  return result as DatabaseCharacterFeat;
}

/**
 * Removes (unlinks) a specific row from `character_feats` by ID,
 * effectively removing that feat from the character’s build.
 */
export async function removeCharacterFeat(id: number): Promise<void> {
  const { error } = await supabase
    .from('character_feats')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

/**
 * List all feats a character has selected, optionally joining to base_feats
 * so we can see the feat name, label, type, etc.
 */
export interface CharacterFeatWithBase extends DatabaseCharacterFeat {
  base_feats?: {
    name: string;
    label: string;
    feat_type: string;
  };
}

export async function getFeatsForCharacter(
  characterId: number,
  includeBaseFeatInfo = true
): Promise<CharacterFeatWithBase[]> {
  const columns = includeBaseFeatInfo
    ? '*, base_feats!inner(name, label, feat_type)'
    : '*';

  const { data, error } = await supabase
    .from('character_feats')
    .select(columns)
    .eq('character_id', characterId)
    .order('selected_level', { ascending: true });

  if (error) throw new Error(error.message);
  return data as unknown as CharacterFeatWithBase[];
}

/**
 * Example: you might also want a function that fetches a single `character_feat` row by ID
 */
export async function getCharacterFeatById(
  id: number,
  includeBaseFeatInfo = true
): Promise<CharacterFeatWithBase | null> {
  const columns = includeBaseFeatInfo
    ? '*, base_feats!inner(name, label, feat_type)'
    : '*';

  const { data, error } = await supabase
    .from('character_feats')
    .select(columns)
    .eq('id', id)
    .single();

  if (error?.message === 'Multiple or no rows found for the query') {
    return null; // not found
  }
  if (error) throw new Error(error.message);

  return data as unknown as CharacterFeatWithBase;
}
