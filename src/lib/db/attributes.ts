// FILE: src/lib/db/attributes.ts
import { supabase } from '$lib/db/supabaseClient';
import { readable, type Readable } from 'svelte/store';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

/**
 * Example shape of your `character_attributes` row.
 * Adjust these fields to match your actual table columns.
 */
export interface DBCharacterAttributes {
	id: number;
	character_id: number;
	str: number;
	dex: number;
	con: number;
	int: number;
	wis: number;
	cha: number;
	is_temporary?: boolean | null;
	updated_at?: string | null;
	sync_status?: string | null; // or any other columns you need
}

/**
 * The shape of each real-time event your store will emit
 * for changes in the `character_attributes` table.
 */
export interface AttributesChangeEvent {
	eventType: 'INSERT' | 'UPDATE' | 'DELETE';
	newRow: DBCharacterAttributes | null;
	oldRow: DBCharacterAttributes | null;
}

/**
 * 1) The existing function to update a character's attributes
 */
export async function updateCharacterAttributes(
	characterId: number,
	updates: Record<string, number>
): Promise<void> {
	const { error } = await supabase
		.from('character_attributes')
		.update(updates)
		.eq('character_id', characterId);

	if (error) {
		console.error('Failed to update character attributes:', error);
		throw new Error(error.message);
	}
}

/**
 * 2) watchCharacterAttributes(characterId)
 *
 * Returns a Svelte `readable` store that accumulates real-time
 * events (INSERT, UPDATE, DELETE) for rows in `character_attributes`
 * that match the given `character_id`.
 *
 * Each event is appended to an array, so your app can subscribe and
 * react to each new change as it arrives.
 */
export function watchCharacterAttributes(characterId: number): Readable<AttributesChangeEvent[]> {
	return readable<AttributesChangeEvent[]>([], (set) => {
		// We'll store all events in this array, appending new ones as they come in
		let internalArray: AttributesChangeEvent[] = [];

		// Create a channel unique to this character's attributes
		const channel = supabase.channel(`character_attributes_${characterId}`);

		const handlePayload = (
			payload: RealtimePostgresChangesPayload<Partial<DBCharacterAttributes>>
		) => {
			// If supabase returns an empty object for new/old, treat them as null
			const newRow =
				payload.new && Object.keys(payload.new).length > 0
					? (payload.new as DBCharacterAttributes)
					: null;
			const oldRow =
				payload.old && Object.keys(payload.old).length > 0
					? (payload.old as DBCharacterAttributes)
					: null;

			const event: AttributesChangeEvent = {
				eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
				newRow,
				oldRow
			};

			internalArray = [...internalArray, event];
			set(internalArray);
		};

		// Subscribe to all changes in `character_attributes` where character_id = ...
		channel.on(
			'postgres_changes',
			{
				event: '*',
				schema: 'public',
				table: 'character_attributes',
				filter: `character_id=eq.${characterId}`
			},
			handlePayload
		);

		channel.subscribe((status) => {
			if (status === 'SUBSCRIBED') {
				console.log(`[db/attributes] Subscribed to character_attributes for character ${characterId}`);
			}
		});

		// Cleanup function when the last subscriber unsubscribes
		return () => {
			supabase.removeChannel(channel);
		};
	});
}
