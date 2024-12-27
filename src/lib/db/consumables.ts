// FILE: src/lib/db/consumables.ts

import { supabase } from '$lib/db/supabaseClient';
import { readable, type Readable } from 'svelte/store';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

/**
 * The shape of rows in `character_consumables`.
 * Adjust if you have more columns. 
 */
export interface DBConsumables {
	id: number;
	character_id: number | null;
	alchemist_fire: number;
	acid: number;
	tanglefoot: number;
	// possibly sync_status, updated_at, etc.
	sync_status?: string | null;
	updated_at?: string | null;
}

/**
 * Real-time event shape for consumables changes.
 */
export interface ConsumablesChangeEvent {
	eventType: 'INSERT' | 'UPDATE' | 'DELETE';
	newRow: DBConsumables | null;
	oldRow: DBConsumables | null;
}

/**
 * watchConsumablesForCharacter()
 *
 * Subscribes to changes on `character_consumables` for a given character.
 * Returns a Svelte store of ConsumablesChangeEvent[].
 */
export function watchConsumablesForCharacter(characterId: number): Readable<ConsumablesChangeEvent[]> {
	return readable<ConsumablesChangeEvent[]>([], (set) => {
		let events: ConsumablesChangeEvent[] = [];

		const channel = supabase.channel(`consumables-${characterId}`);

		function coerceConsumables(row: DBConsumables | Record<string, unknown> | null): DBConsumables | null {
			if (!row || Object.keys(row).length === 0) {
				return null;
			}
			return row as DBConsumables;
		}

		function handlePayload(payload: RealtimePostgresChangesPayload<DBConsumables>) {
			const event: ConsumablesChangeEvent = {
				eventType: payload.eventType,
				newRow: coerceConsumables(payload.new),
				oldRow: coerceConsumables(payload.old)
			};
			events.push(event);
			set(events);
		}

		channel.on(
			'postgres_changes',
			{
				event: '*',
				schema: 'public',
				table: 'character_consumables',
				filter: `character_id=eq.${characterId}`
			},
			handlePayload
		);

		channel.subscribe((status) => {
			if (status === 'SUBSCRIBED') {
				console.log(`[db/consumables] Subscribed to consumables for character ${characterId}`);
			}
		});

		return () => {
			supabase.removeChannel(channel);
		};
	});
}

/**
 * updateConsumable()
 * A direct DB operation to update a single consumable column.
 * e.g. type can be 'acid', 'alchemist_fire', 'tanglefoot', etc.
 */
export async function updateConsumable(characterId: number, type: string, newValue: number): Promise<void> {
	const { error } = await supabase
		.from('character_consumables')
		.update({ [type]: newValue })
		.eq('character_id', characterId);

	if (error) {
		console.error(`[db/consumables] Failed to update ${type}:`, error);
		throw new Error(error.message);
	}
}
