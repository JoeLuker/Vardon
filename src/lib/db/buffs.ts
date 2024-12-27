// FILE: src/lib/db/buffs.ts
import { supabase } from '$lib/db/supabaseClient';
import { readable, type Readable } from 'svelte/store';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Buff, BuffEffect } from '$lib/domain/types/buffs';
import type { KnownBuffType } from '$lib/domain/types/character';
import type { Json } from '$lib/domain/types/supabase';

/**
 * The raw shape of rows in the `base_buffs` table.
 *
 * Adjust fields based on your actual DB columns
 * (e.g. if you store `conflicts` in a JSONB column, etc.).
 */
export interface DBBaseBuff {
	id: number;
	name: string; // e.g. "int_cognatogen"
	label: string; // e.g. "Intelligence Cognatogen"
	description?: string | null;
	buff_type: 'mutagen' | 'combat' | 'other' | null;
	effects?: Json; // JSON array of effect objects
	conflicts?: Json; // JSON array of buff names
	created_at?: string | null;
	updated_at?: string | null;
}

/**
 * 1) Load all buffs from `base_buffs`
 *    and convert them into your domain `Buff` shape.
 */
export async function loadAllBuffs(): Promise<Buff[]> {
	const { data, error } = await supabase
		.from('base_buffs')
		.select('name, label, description, effects, conflicts')
		.returns<DBBaseBuff[]>()
		.order('name');

	if (error) {
		console.error('Error loading base buffs:', error);
		throw new Error(error.message);
	}
	if (!data) return [];

	const buffs: Buff[] = data.map((row) => ({
		name: row.name as KnownBuffType,
		label: row.label,
		description: row.description ?? '',
		buff_type: row.buff_type as Buff['buff_type'],
		effects: (row.effects as unknown as BuffEffect[]) ?? [],
		conflicts: (row.conflicts as unknown as KnownBuffType[]) ?? []
	}));

	return buffs;
}

/**
 * 2) Load a single buff by ID (you can adapt as needed).
 */
export async function loadBuffById(buffId: number): Promise<DBBaseBuff | null> {
	const { data, error } = await supabase
		.from('base_buffs')
		.select('*')
		.eq('id', buffId)
		.single();

	if (error?.message === 'Multiple or no rows found for the query') {
		// not found
		return null;
	}
	if (error) {
		console.error('Error loading buff by ID:', error);
		throw new Error(error.message);
	}

	return data as DBBaseBuff;
}

/**
 * 3) Insert or update a row in `base_buffs`.
 *    If `id` is present, do an update; otherwise insert a new row.
 */
export interface BaseBuffSaveData {
	id?: number;
	name: string;
	label: string;
	description?: string | null;
	effects?: Json;
	conflicts?: Json;
}

export async function saveBaseBuff(buff: BaseBuffSaveData): Promise<DBBaseBuff> {
	const isNew = buff.id == null;

	const query = isNew
		? supabase
				.from('base_buffs')
				.insert({
					name: buff.name,
					label: buff.label,
					description: buff.description ?? null,
					effects: buff.effects ?? [],
					conflicts: buff.conflicts ?? []
				})
				.select()
				.single()
		: supabase
				.from('base_buffs')
				.update({
					name: buff.name,
					label: buff.label,
					description: buff.description ?? null,
					effects: buff.effects ?? [],
					conflicts: buff.conflicts ?? []
				})
				.eq('id', buff.id!)
				.select()
				.single();

	const { data, error } = await query;
	if (error) {
		console.error('Error saving base buff:', error);
		throw new Error(error.message);
	}
	return data as DBBaseBuff;
}

/**
 * 4) Delete a buff by ID in `base_buffs`.
 *    Could also do by name if you prefer.
 */
export async function removeBaseBuff(id: number): Promise<void> {
	const { error } = await supabase.from('base_buffs').delete().eq('id', id);

	if (error) {
		console.error(`Error removing buff (ID=${id}):`, error);
		throw new Error(error.message);
	}
}

/* ---------------------------------------------------------------------------
   REAL-TIME SUBSCRIPTIONS
   We'll provide a watcher for base_buffs. 
   It emits events in a store each time supabase sees INSERT/UPDATE/DELETE.
--------------------------------------------------------------------------- */

/** A single event from the 'base_buffs' table */
export interface BuffChangeEvent {
	eventType: 'INSERT' | 'UPDATE' | 'DELETE';
	newRow: DBBaseBuff | null;
	oldRow: DBBaseBuff | null;
}

/**
 * watchAllBuffs()
 *
 * Subscribes to real-time changes on the 'base_buffs' table (all rows).
 * Returns a Svelte `readable` store that accumulates Realtime events in an array.
 */
export function watchAllBuffs() : Readable<BuffChangeEvent[]> {
	return readable<BuffChangeEvent[]>([], (set) => {
		// We'll keep events in a local array. Each time a new event arrives, we append to it.
		let internalArray: BuffChangeEvent[] = [];

		const channel = supabase.channel('base_buffs_all');

		const handlePayload = (payload: RealtimePostgresChangesPayload<Partial<DBBaseBuff>>) => {
			const newRow =
				payload.new && Object.keys(payload.new).length > 0 
					? (payload.new as DBBaseBuff)
					: null;
			const oldRow =
				payload.old && Object.keys(payload.old).length > 0
					? (payload.old as DBBaseBuff)
					: null;

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
				table: 'base_buffs'
			},
			handlePayload
		);

		channel.subscribe((status) => {
			if (status === 'SUBSCRIBED') {
				console.log('[db/buffs] Subscribed to base_buffs (all rows).');
			}
		});

		// Cleanup when unsubscribed
		return () => {
			supabase.removeChannel(channel);
		};
	});
}
