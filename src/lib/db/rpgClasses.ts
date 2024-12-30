// FILE: src/lib/db/rpgClass.ts

import { supabase } from '$lib/db/supabaseClient';
import { readable, type Readable } from 'svelte/store';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { parseRow } from '$lib/db/utils';
import type { Database } from '$lib/domain/types/supabase';

// -----------------------------
// Type Definitions
// -----------------------------

// Core class types
export type ClassRow = Database['public']['Tables']['base_classes']['Row'];
export type ClassFeatureRow = Database['public']['Tables']['base_class_features']['Row'];
export type ClassProgressionRow = Database['public']['Tables']['base_class_progression']['Row'];
export type ClassSkillRelationRow = Database['public']['Tables']['class_skill_relations']['Row'];

// Character-specific types
export type CharacterClassFeatureRow = Database['public']['Tables']['character_class_features']['Row'];
export type CharacterClassFeaturePropertyRow = Database['public']['Tables']['character_class_feature_properties']['Row'];

// Extended interfaces for related data
export interface ClassFeatureWithDetails extends ClassFeatureRow {
  effects: Database['public']['Tables']['base_class_feature_effects']['Row'][];
  prerequisites: Database['public']['Tables']['base_class_feature_prerequisites']['Row'][];
}

export interface ClassWithRelations extends ClassRow {
  class_progression: ClassProgressionRow[];
  class_features: ClassFeatureWithDetails[];
  class_skills: ClassSkillRelationRow[];
}

// Real-time types
export interface ClassFeatureChangeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  newRow: CharacterClassFeatureRow | null;
  oldRow: CharacterClassFeatureRow | null;
}

// -----------------------------
// Real-time Subscriptions
// -----------------------------

export function watchCharacterClassFeatures(characterId: number): Readable<ClassFeatureChangeEvent[]> {
  return readable<ClassFeatureChangeEvent[]>([], (set) => {
    let internalArray: ClassFeatureChangeEvent[] = [];
    const channel = supabase.channel(`character_class_features_${characterId}`);
    
    const handlePayload = (payload: RealtimePostgresChangesPayload<Partial<CharacterClassFeatureRow>>) => {
      const newRow = parseRow<CharacterClassFeatureRow>(payload.new);
      const oldRow = parseRow<CharacterClassFeatureRow>(payload.old);
      
      const event: ClassFeatureChangeEvent = {
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
        table: 'character_class_features',
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
// Core Class Operations
// -----------------------------

/**
 * Get list of available classes
 */
export async function listClasses(): Promise<ClassRow[]> {
  const { data, error } = await supabase
    .from('base_classes')
    .select('*')
    .order('name');

  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Get detailed class information including features and progression
 */
export async function getClass(classId: number): Promise<ClassWithRelations> {
  const { data, error } = await supabase
    .from('base_classes')
    .select(`
      *,
      class_progression(*),
      class_features:base_class_features(
        *,
        effects:base_class_feature_effects(*),
        prerequisites:base_class_feature_prerequisites(*)
      ),
      class_skills:class_skill_relations(*)
    `)
    .eq('id', classId)
    .single();

  if (error) throw new Error(error.message);
  return data as ClassWithRelations;
}

// -----------------------------
// Character Class Features
// -----------------------------

/**
 * Get class features for a character
 */
export async function getCharacterClassFeatures(characterId: number): Promise<CharacterClassFeatureRow[]> {
  const { data, error } = await supabase
    .from('character_class_features')
    .select('*')
    .eq('character_id', characterId)
    .order('feature_level');

  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Add a class feature to a character
 */
export async function addCharacterClassFeature(
  characterId: number,
  featureName: string,
  featureLevel: number,
  active: boolean = true
): Promise<CharacterClassFeatureRow> {
  const { data, error } = await supabase
    .from('character_class_features')
    .insert({
      character_id: characterId,
      feature_name: featureName,
      feature_level: featureLevel,
      active,
      sync_status: 'pending'
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Update a character's class feature
 */
export async function updateCharacterClassFeature(
  featureId: number,
  updates: Partial<Pick<CharacterClassFeatureRow, 'active'>>
): Promise<CharacterClassFeatureRow> {
  const { data, error } = await supabase
    .from('character_class_features')
    .update({
      ...updates,
      sync_status: 'pending',
      updated_at: new Date().toISOString()
    })
    .eq('id', featureId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Remove a class feature from a character
 */
export async function removeCharacterClassFeature(featureId: number): Promise<void> {
  const { error } = await supabase
    .from('character_class_features')
    .delete()
    .eq('id', featureId);

  if (error) throw new Error(error.message);
}

// -----------------------------
// Feature Properties
// -----------------------------

/**
 * Add a property to a character's class feature
 */
export async function addFeatureProperty(
  featureId: number,
  propertyKey: string,
  propertyValue: string
): Promise<CharacterClassFeaturePropertyRow> {
  const { data, error } = await supabase
    .from('character_class_feature_properties')
    .insert({
      class_feature_id: featureId,
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
 * Update a character's class feature property
 */
export async function updateFeatureProperty(
  propertyId: number,
  propertyValue: string
): Promise<CharacterClassFeaturePropertyRow> {
  const { data, error } = await supabase
    .from('character_class_feature_properties')
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
 * Remove a property from a character's class feature
 */
export async function removeFeatureProperty(propertyId: number): Promise<void> {
  const { error } = await supabase
    .from('character_class_feature_properties')
    .delete()
    .eq('id', propertyId);

  if (error) throw new Error(error.message);
}

// -----------------------------
// Class Skill Relations
// -----------------------------

/**
 * Get class skills for a specific class
 */
export async function getClassSkills(classId: number): Promise<ClassSkillRelationRow[]> {
  const { data, error } = await supabase
    .from('class_skill_relations')
    .select('*')
    .eq('class_id', classId);

  if (error) throw new Error(error.message);
  return data ?? [];
}