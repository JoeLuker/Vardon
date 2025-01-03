/******************************************************************************
 * FILE: /Users/jluker/Vardon/src/lib/db/characters.ts
 *
 * Provides a generic "charactersApi" object with CRUD + watchers for
 * the "characters" table in your new schema:
 *    id          number
 *    name        string
 *    current_hp  number
 *    max_hp      number
 *    is_offline  boolean | null
 *    created_at  string | null
 *    updated_at  string | null
 *****************************************************************************/

import type { Database } from '$lib/domain/types/supabase';
import { createDbApi } from './genericApi';

/** Type definitions for the "characters" table. */
export type CharacterRow    = Database['public']['Tables']['characters']['Row'];
export type CharacterInsert = Database['public']['Tables']['characters']['Insert'];
export type CharacterUpdate = Database['public']['Tables']['characters']['Update'];

/**
 * The generic API for "characters" using createDbApi.
 * 
 * This provides:
 *  - getAllRows()
 *  - getRowById(id)
 *  - createRow(...)
 *  - updateRow(...)
 *  - deleteRow(...)
 *  - startWatch(onChange)  [insert/update/delete callback]
 *  - stopWatch()
 */
export const charactersApi = createDbApi<
  CharacterRow,
  CharacterInsert,
  CharacterUpdate
>('characters');
