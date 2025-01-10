import { supabase } from './supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Database } from '$lib/domain/types/supabase';

// A union of all table names in your Database['public']['Tables']
type TableName = keyof Database['public']['Tables'];

/**
 * Creates a DB API for a given table name with typed row/insert/update,
 * plus watchers and optional "batch fetch" methods.
 */
export function createDbApi<TRow, TInsert, TUpdate extends { id?: number }>(tableName: TableName) {
	let channel: RealtimeChannel | null = null;

	return {
		/**
		 * Select all rows, ordered by ID.
		 */
		async getAllRows(): Promise<TRow[]> {
			const { data, error } = await supabase.from(tableName).select('*').order('id');
			if (error) throw error;
			// Casting because supabase's `data` can be unknown
			return (data as TRow[]) ?? [];
		},

		/**
		 * Fetch one row by ID, or null if not found.
		 */
		async getRowById(id: number): Promise<TRow | null> {
			const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
			if (error && error.code !== 'PGRST116') throw error;
			return data as TRow | null;
		},

		/**
		 * Insert a new row. Returns the inserted row or null.
		 */
		async createRow(newItem: TInsert): Promise<TRow | null> {
			const { data, error } = await supabase
				.from(tableName)
				.insert(newItem as any) // cast if needed
				.select()
				.single();
			if (error) throw error;
			return data as TRow | null;
		},

		/**
		 * Update a row by ID. Must contain { id, ...rest }.
		 * Returns the updated row or null if not found.
		 */
		async updateRow(changes: TUpdate): Promise<TRow | null> {
			const { id, ...rest } = changes;
			if (!id) {
				throw new Error(`updateRow: missing "id" field for table '${tableName}'`);
			}
			const { data, error } = await supabase
				.from(tableName)
				.update(rest)
				.eq('id', id)
				.select()
				.single();
			if (error) throw error;
			return data as TRow | null;
		},

		/**
		 * Delete a row by ID. Returns `true` on success.
		 */
		async deleteRow(id: number): Promise<boolean> {
			const { error } = await supabase.from(tableName).delete().eq('id', id);
			if (error) throw error;
			return true;
		},

		/**
		 * Fetch multiple rows by a list of IDs (in('id', ids)).
		 * Returns an empty array if `ids` is empty or no matching rows.
		 */
		async getRowsByIds(ids: number[]): Promise<TRow[]> {
			if (!ids.length) return [];
			const { data, error } = await supabase.from(tableName).select('*').in('id', ids);
			if (error) throw error;
			return (data as TRow[]) ?? [];
		},

		/**
		 * A generic "filter fetch" if you want quick one-off queries:
		 * Pass `filter` as an object of { columnName: value } to match.
		 */
		async getRowsByFilter(filter: Record<string, any>): Promise<TRow[]> {
			let query = supabase.from(tableName).select('*');
			for (const [col, val] of Object.entries(filter)) {
				query = query.eq(col, val);
			}
			const { data, error } = await query;
			if (error) throw error;
			return (data as TRow[]) ?? [];
		},

		/**
		 * Start watching this table. Calls onChange(type, row) for insert/update/delete.
		 */
		startWatch(onChange: (type: 'insert' | 'update' | 'delete', row: TRow) => void): void {
			if (channel) return; // Already watching
			channel = supabase
				.channel(`${tableName}_changes`)
				.on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload) => {
					if (payload.eventType === 'INSERT') {
						onChange('insert', payload.new as TRow);
					} else if (payload.eventType === 'UPDATE') {
						onChange('update', payload.new as TRow);
					} else if (payload.eventType === 'DELETE' && payload.old) {
						onChange('delete', payload.old as TRow);
					}
				})
				.subscribe();
		},

		/**
		 * Stop watching this table.
		 */
		stopWatch(): void {
			if (channel) {
				supabase.removeChannel(channel);
				channel = null;
			}
		}
	};
}
