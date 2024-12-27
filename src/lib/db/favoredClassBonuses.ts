// FILE: src/lib/db/favoredClassBonuses.ts

import { supabase } from '$lib/db/supabaseClient';
import { readable, type Readable } from 'svelte/store';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { DatabaseCharacterFavoredClassBonus } from '$lib/domain/types/character';

/**
 * Shape for saving/updating a favored class bonus:
 * - If `id` is present => update that row
 * - Otherwise => insert a new record
 */
export interface FavoredClassBonusSaveData {
	character_id: number;
	level: number;
	choice: 'hp' | 'skill' | 'other';
	id?: number; // optional => means update
}

/**
 * Insert or update a favored class bonus row
 * and return the updated row.
 */
export async function saveFavoredClassBonus(
	data: FavoredClassBonusSaveData
): Promise<DatabaseCharacterFavoredClassBonus> {
	const isNew = data.id == null;

	// If new => insert; otherwise => update
	const query = isNew
		? supabase
				.from('character_favored_class_bonuses')
				.insert({
					character_id: data.character_id,
					level: data.level,
					choice: data.choice
				})
				.select()
				.single()
		: supabase
				.from('character_favored_class_bonuses')
				.update({
					choice: data.choice
					// We could also allow updating level or character_id if needed,
					// but your code only updates 'choice'.
				})
				.eq('id', data.id!)
				.select()
				.single();

	const { data: result, error } = await query;
	if (error) {
		throw new Error(error.message);
	}

	return result as DatabaseCharacterFavoredClassBonus;
}

/**
 * Delete a favored class bonus by ID.
 */
export async function removeFavoredClassBonus(fcbId: number): Promise<void> {
	const { error } = await supabase
		.from('character_favored_class_bonuses')
		.delete()
		.eq('id', fcbId);

	if (error) {
		throw new Error(error.message);
	}
}

/* ---------------------------------------------------------------------------
   REAL-TIME SUBSCRIPTIONS
   We'll provide a watcher for `character_favored_class_bonuses`,
   typically filtered by `character_id=eq.{characterId}`.
--------------------------------------------------------------------------- */

/**
 * The shape of each real-time event for favored class bonuses.
 */
export interface FavoredClassBonusChangeEvent {
	eventType: 'INSERT' | 'UPDATE' | 'DELETE';
	newRow: DatabaseCharacterFavoredClassBonus | null;
	oldRow: DatabaseCharacterFavoredClassBonus | null;
}

/**
 * watchFavoredClassBonuses(characterId)
 *
 * Returns a Svelte `readable` store that accumulates real-time events
 * (INSERT, UPDATE, DELETE) for the `character_favored_class_bonuses` table,
 * filtered by `character_id`.
 */
export function watchFavoredClassBonuses(characterId: number): Readable<FavoredClassBonusChangeEvent[]> {
	return readable<FavoredClassBonusChangeEvent[]>([], (set) => {
		// We'll store events in an array as they come in
		let internalArray: FavoredClassBonusChangeEvent[] = [];

		const channel = supabase.channel(`character_fcb_${characterId}`);

		const handlePayload = (
			payload: RealtimePostgresChangesPayload<Partial<DatabaseCharacterFavoredClassBonus>>
		) => {
			// If supabase returns empty objects for new/old, treat them as null
			const newRow =
				payload.new && Object.keys(payload.new).length > 0
					? (payload.new as DatabaseCharacterFavoredClassBonus)
					: null;
			const oldRow =
				payload.old && Object.keys(payload.old).length > 0
					? (payload.old as DatabaseCharacterFavoredClassBonus)
					: null;

			const event: FavoredClassBonusChangeEvent = {
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
				table: 'character_favored_class_bonuses',
				filter: `character_id=eq.${characterId}`
			},
			handlePayload
		);

		channel.subscribe((status) => {
			if (status === 'SUBSCRIBED') {
				console.log(
					`[db/favoredClassBonuses] Subscribed to favored_class_bonuses for character ${characterId}`
				);
			}
		});

		// Cleanup when the last subscriber unsubscribes
		return () => {
			supabase.removeChannel(channel);
		};
	});
}
