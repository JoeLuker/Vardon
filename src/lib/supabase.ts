// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export async function getDataFromTable<T extends keyof Database['public']['Tables']>(
  table: T,
  query: Partial<Database['public']['Tables'][T]['Row']> = {}
) {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .match(query);

  if (error) throw error;
  return data;
}

export async function insertIntoTable<T extends keyof Database['public']['Tables']>(
  table: T,
  data: Database['public']['Tables'][T]['Insert']
) {
  const { data: result, error } = await supabase
    .from(table)
    .insert([data as any]) // Cast to any to avoid type inference issues
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function updateTable<T extends keyof Database['public']['Tables']>(
  table: T,
  match: Partial<Database['public']['Tables'][T]['Row']>,
  updates: Database['public']['Tables'][T]['Update']
) {
  const { error } = await supabase
    .from(table)
    .update(updates as any) // Cast to any to avoid type inference issues
    .match(match);

  if (error) throw error;
}

export async function deleteFromTable<T extends keyof Database['public']['Tables']>(
  table: T,
  match: Partial<Database['public']['Tables'][T]['Row']>
) {
  const { error } = await supabase
    .from(table)
    .delete()
    .match(match);

  if (error) throw error;
}

// Type helpers for external use
export type Tables = Database['public']['Tables'];
export type TableRow<T extends keyof Tables> = Tables[T]['Row'];
export type TableInsert<T extends keyof Tables> = Tables[T]['Insert'];
export type TableUpdate<T extends keyof Tables> = Tables[T]['Update'];