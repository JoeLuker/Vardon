/******************************************************************************
 * FILE: rpgEntities.ts
 * 
 * Provides a "rpgEntitiesApi" object for CRUD + watchers on the 
 * "rpg_entities" supertype table.
 *****************************************************************************/

import type { Database } from '$lib/domain/types/supabase';
import { createDbApi } from './genericApi';

/** Row/Insert/Update from your generated types. */
export type RpgEntityRow    = Database['public']['Tables']['rpg_entities']['Row'];
export type RpgEntityInsert = Database['public']['Tables']['rpg_entities']['Insert'];
export type RpgEntityUpdate = Database['public']['Tables']['rpg_entities']['Update'];

/**
 * The single API object for "rpg_entities", 
 * providing getAllRows, getRowById, createRow, updateRow, deleteRow, 
 * plus startWatch/stopWatch for realtime.
 */
export const rpgEntitiesApi = createDbApi<
  RpgEntityRow,
  RpgEntityInsert,
  RpgEntityUpdate
>('rpg_entities');
