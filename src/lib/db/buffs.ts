import { supabase } from '$lib/db/supabaseClient';
import { readable, type Readable } from 'svelte/store';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { parseRow } from '$lib/db/utils';
import type { Database } from '$lib/domain/types/supabase';

// Type aliases
export type BuffRow = Database['public']['Tables']['character_buffs']['Row'];
export type BuffTypeRow = Database['public']['Tables']['buff_types']['Row'];

// Extended interface for buff with relations
export interface BuffWithRelations extends BuffRow {
  buff_types: BuffTypeRow | null;
}

// Real-time watching interfaces
export interface BuffChangeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  newRow: BuffRow | null;
  oldRow: BuffRow | null;
}

/**
 * watchBuffsForCharacter(characterId)
 * 
 * Subscribes to changes for a specific character's buffs
 */
export function watchBuffsForCharacter(characterId: number): Readable<BuffChangeEvent[]> {
  return readable<BuffChangeEvent[]>([], (set) => {
    let internalArray: BuffChangeEvent[] = [];
    
    const channel = supabase.channel(`buffs_${characterId}`);
    
    const handlePayload = (payload: RealtimePostgresChangesPayload<Partial<BuffRow>>) => {
      const newRow = parseRow<BuffRow>(payload.new);
      const oldRow = parseRow<BuffRow>(payload.old);
      
      const event: BuffChangeEvent = {
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
        table: 'character_buffs',
        filter: `character_id=eq.${characterId}`
      },
      handlePayload
    );

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[db/buffs] Subscribed to buffs for character ${characterId}`);
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  });
}

// -----------------------------
// GETTERS
// -----------------------------

/**
 * getBuffsForCharacter(characterId)
 * 
 * Retrieve all buffs and their related data for a character
 */
export async function getBuffsForCharacter(characterId: number): Promise<BuffWithRelations[]> {
  const { data, error } = await supabase
    .from('character_buffs')
    .select(`
      *,
      buff_types(*)
    `)
    .eq('character_id', characterId);

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as BuffWithRelations[];
}

/**
 * getBuffTypes()
 * 
 * Get all available buff types
 */
export async function getBuffTypes(): Promise<BuffTypeRow[]> {
  const { data, error } = await supabase
    .from('buff_types')
    .select('*')
    .order('name');

  if (error) throw new Error(error.message);
  return data ?? [];
}

// -----------------------------
// CRUD Operations
// -----------------------------

/** Add a new buff to a character */
export async function addBuff(
  characterId: number,
  buffTypeId: number,
  value: number,
  duration?: number
): Promise<BuffRow> {
  const { data, error } = await supabase
    .from('character_buffs')
    .insert({
      character_id: characterId,
      buff_type_id: buffTypeId,
      value,
      duration: duration ?? null,
      is_active: true
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Update an existing buff */
export async function updateBuff(
  buffId: number,
  updates: Partial<Pick<BuffRow, 'sync_status' | 'base_buff_id' | 'character_id' | 'is_active'>>
): Promise<BuffRow> {
  const { data, error } = await supabase
    .from('character_buffs')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', buffId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Remove a buff */
export async function removeBuff(buffId: number): Promise<void> {
  const { error } = await supabase
    .from('character_buffs')
    .delete()
    .eq('id', buffId);

  if (error) throw new Error(error.message);
}