// FILE: src/lib/db/archetypes.ts

import { supabase } from '$lib/db/supabaseClient';
import { readable, type Readable } from 'svelte/store';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { parseRow } from '$lib/db/utils';
import type { Database } from '$lib/domain/types/supabase';

// -----------------------------
// Type Definitions
// -----------------------------

// Core types
export type ArchetypeRow = Database['public']['Tables']['base_archetypes']['Row'];
export type ArchetypeFeatureReplacementRow = Database['public']['Tables']['archetype_feature_replacements']['Row'];

// Extended interfaces
export interface ArchetypeWithRelations extends ArchetypeRow {
  rpg_entities: Database['public']['Tables']['rpg_entities']['Row'] | null;
  feature_replacements: (ArchetypeFeatureReplacementRow & {
    new_feature: Database['public']['Tables']['rpg_entities']['Row'] | null;
    replaced_feature: Database['public']['Tables']['rpg_entities']['Row'];
  })[];
  class: Database['public']['Tables']['base_classes']['Row'] | null;
}

// Real-time types
export interface ArchetypeChangeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  newRow: ArchetypeRow | null;
  oldRow: ArchetypeRow | null;
}

// -----------------------------
// Real-time Subscriptions
// -----------------------------

export function watchArchetype(archetypeId: number): Readable<ArchetypeChangeEvent[]> {
  return readable<ArchetypeChangeEvent[]>([], (set) => {
    let internalArray: ArchetypeChangeEvent[] = [];
    const channel = supabase.channel(`archetype_${archetypeId}`);
    
    const handlePayload = (payload: RealtimePostgresChangesPayload<Partial<ArchetypeRow>>) => {
      const newRow = parseRow<ArchetypeRow>(payload.new);
      const oldRow = parseRow<ArchetypeRow>(payload.old);
      
      const event: ArchetypeChangeEvent = {
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
        table: 'base_archetypes',
        filter: `id=eq.${archetypeId}`
      },
      handlePayload
    ).subscribe();

    return () => {
      channel.unsubscribe();
    };
  });
}

// -----------------------------
// Core Operations
// -----------------------------

/**
 * List all available archetypes
 */
export async function listArchetypes(): Promise<ArchetypeWithRelations[]> {
  const { data, error } = await supabase
    .from('base_archetypes')
    .select(`
      *,
      rpg_entities!base_archetypes_id_fkey(*),
      class:class_id(*),
      feature_replacements:archetype_feature_replacements(
        *,
        new_feature:new_feature_id(*),
        replaced_feature:replaced_feature_id(*)
      )
    `)
    .order('id');

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ArchetypeWithRelations[];
}

/**
 * Get detailed archetype information
 */
export async function getArchetype(archetypeId: number): Promise<ArchetypeWithRelations> {
  const { data, error } = await supabase
    .from('base_archetypes')
    .select(`
      *,
      rpg_entities!base_archetypes_id_fkey(*),
      class:class_id(*),
      feature_replacements:archetype_feature_replacements(
        *,
        new_feature:new_feature_id(*),
        replaced_feature:replaced_feature_id(*)
      )
    `)
    .eq('id', archetypeId)
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as ArchetypeWithRelations;
}

/**
 * Get archetypes available for a specific class
 */
export async function getArchetypesForClass(classId: number): Promise<ArchetypeWithRelations[]> {
  const { data, error } = await supabase
    .from('base_archetypes')
    .select(`
      *,
      rpg_entities!base_archetypes_id_fkey(*),
      class:class_id(*),
      feature_replacements:archetype_feature_replacements(
        *,
        new_feature:new_feature_id(*),
        replaced_feature:replaced_feature_id(*)
      )
    `)
    .eq('class_id', classId)
    .order('id');

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ArchetypeWithRelations[];
}

// -----------------------------
// Feature Replacements
// -----------------------------

/**
 * Get feature replacements for an archetype
 */
export async function getArchetypeFeatureReplacements(
  archetypeId: number
): Promise<ArchetypeFeatureReplacementRow[]> {
  const { data, error } = await supabase
    .from('archetype_feature_replacements')
    .select('*')
    .eq('archetype_id', archetypeId)
    .order('replacement_level');

  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Get replaced features for a specific level
 */
export async function getReplacedFeaturesAtLevel(
  archetypeId: number,
  level: number
): Promise<ArchetypeFeatureReplacementRow[]> {
  const { data, error } = await supabase
    .from('archetype_feature_replacements')
    .select('*')
    .eq('archetype_id', archetypeId)
    .eq('replacement_level', level);

  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Check if a class feature is replaced by an archetype at a specific level
 */
export async function isFeatureReplacedAtLevel(
  featureId: number,
  archetypeId: number,
  level: number
): Promise<boolean> {
  const { data, error } = await supabase
    .from('archetype_feature_replacements')
    .select('*')
    .eq('archetype_id', archetypeId)
    .eq('replaced_feature_id', featureId)
    .eq('replacement_level', level)
    .single();

  if (error) return false;
  return !!data;
}

/**
 * Get new feature that replaces a specific class feature
 */
export async function getReplacementFeature(
  archetypeId: number,
  replacedFeatureId: number
): Promise<ArchetypeFeatureReplacementRow | null> {
  const { data, error } = await supabase
    .from('archetype_feature_replacements')
    .select('*')
    .eq('archetype_id', archetypeId)
    .eq('replaced_feature_id', replacedFeatureId)
    .single();

  if (error) return null;
  return data;
}

// -----------------------------
// Validation Helpers
// -----------------------------

/**
 * Check if an archetype is compatible with a class
 */
export async function isArchetypeCompatibleWithClass(
  archetypeId: number,
  classId: number
): Promise<boolean> {
  const { data, error } = await supabase
    .from('base_archetypes')
    .select('*')
    .eq('id', archetypeId)
    .eq('class_id', classId)
    .single();

  if (error) return false;
  return !!data;
}

/**
 * Get all features replaced by an archetype
 */
export async function getArchetypeReplacedFeatures(archetypeId: number): Promise<number[]> {
  const { data, error } = await supabase
    .from('archetype_feature_replacements')
    .select('replaced_feature_id')
    .eq('archetype_id', archetypeId);

  if (error) throw new Error(error.message);
  return (data ?? [])
    .map(row => row.replaced_feature_id)
    .filter((id): id is number => id !== null);
}