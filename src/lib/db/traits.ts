// FILE: src/lib/db/traits.ts

import { supabase } from '$lib/db/supabaseClient';
import { readable, type Readable } from 'svelte/store';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { DatabaseBaseTrait } from '$lib/domain/types/character';

/**
 * If you need a special type for new vs. update, you can define it here.
 */

// This type excludes 'id', 'created_at', 'updated_at' if you want
export type NewTraitData = Omit<DatabaseBaseTrait, 'id' | 'created_at' | 'updated_at'>;

// This type includes 'id' for updates
export type UpdateTraitData = Partial<DatabaseBaseTrait> & { id: number };

/* ---------------------------------------------------------------------------
   1) A helper to load the base traits
--------------------------------------------------------------------------- */
export async function loadBaseTraits(): Promise<DatabaseBaseTrait[]> {
	const { data, error } = await supabase.from('base_traits').select('*').order('name');

	if (error) {
		throw new Error(error.message);
	}

	return data ?? [];
}

/* ---------------------------------------------------------------------------
   2) Insert a new base trait
--------------------------------------------------------------------------- */
export async function insertBaseTrait(trait: NewTraitData): Promise<void> {
	const { error } = await supabase.from('base_traits').insert(trait);

	if (error) {
		throw new Error(error.message);
	}
}

/* ---------------------------------------------------------------------------
   3) Update an existing base trait
--------------------------------------------------------------------------- */
export async function updateBaseTrait(trait: DatabaseBaseTrait): Promise<void> {
	const { id, ...fields } = trait;

	const { error } = await supabase
		.from('base_traits')
		.update({
			name: fields.name,
			trait_type: fields.trait_type,
			description: fields.description,
			benefits: fields.benefits
		})
		.eq('id', id);

	if (error) {
		throw new Error(error.message);
	}
}

/* ---------------------------------------------------------------------------
   4) Delete a base trait
--------------------------------------------------------------------------- */
export async function removeBaseTrait(id: number): Promise<void> {
	const { error } = await supabase.from('base_traits').delete().eq('id', id);

	if (error) {
		throw new Error(error.message);
	}
}

/* ---------------------------------------------------------------------------
   REAL-TIME SUBSCRIPTIONS
   We'll provide a watcher for the entire `base_traits` table.
--------------------------------------------------------------------------- */

/**
 * Each real-time event about the `base_traits` table:
 *  - eventType: 'INSERT' | 'UPDATE' | 'DELETE'
 *  - newRow: the newly inserted/updated row (or null for DELETE)
 *  - oldRow: the old row for UPDATE/DELETE (or null for INSERT)
 */
export interface BaseTraitChangeEvent {
	eventType: 'INSERT' | 'UPDATE' | 'DELETE';
	newRow: DatabaseBaseTrait | null;
	oldRow: DatabaseBaseTrait | null;
}

/**
 * watchAllBaseTraits()
 *
 * Subscribes to real-time changes (INSERT, UPDATE, DELETE) in the `base_traits` table,
 * returning a Svelte readable store that accumulates these events in an array.
 */
export function watchAllBaseTraits(): Readable<BaseTraitChangeEvent[]> {
	return readable<BaseTraitChangeEvent[]>([], (set) => {
		let internalArray: BaseTraitChangeEvent[] = [];

		const channel = supabase.channel('base_traits_all');

		// Each time supabase sees a row change in `base_traits`, we receive a payload
		const handlePayload = (payload: RealtimePostgresChangesPayload<Partial<DatabaseBaseTrait>>) => {
			// If supabase returns empty objects for new/old, treat them as null
			const newRow =
				payload.new && Object.keys(payload.new).length > 0
					? (payload.new as DatabaseBaseTrait)
					: null;
			const oldRow =
				payload.old && Object.keys(payload.old).length > 0
					? (payload.old as DatabaseBaseTrait)
					: null;

			const event: BaseTraitChangeEvent = {
				eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
				newRow,
				oldRow
			};

			// Append the new event to our local array
			internalArray = [...internalArray, event];
			set(internalArray);
		};

		channel.on(
			'postgres_changes',
			{
				event: '*',
				schema: 'public',
				table: 'base_traits'
			},
			handlePayload
		);

		channel.subscribe((status) => {
			if (status === 'SUBSCRIBED') {
				console.log('[db/traits] Subscribed to all base_traits.');
			}
		});

		// Cleanup function when last subscriber unsubscribes
		return () => {
			supabase.removeChannel(channel);
		};
	});
}
