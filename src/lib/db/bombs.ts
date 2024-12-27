// FILE: src/lib/db/bombs.ts

import { supabase } from '$lib/db/supabaseClient';
import { readable, type Readable } from 'svelte/store';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

/**
 * The shape of a row in `character_combat_stats`, based on what you said
 * (it includes bombs_left, base_attack_bonus, etc.).
 */
export interface DBCombatStats {
	id: number;
	character_id: number;
	bombs_left: number;
	base_attack_bonus: number;
	// plus any other columns you have (sync_status, updated_at, etc.)
	sync_status?: string | null;
	updated_at?: string | null;
}

/** 
 * Real-time subscription 'event' shape for bombs changes.
 * If the row is missing or is an empty object, we coerce it to `null`.
 */
export interface BombsChangeEvent {
	eventType: 'INSERT' | 'UPDATE' | 'DELETE';
	newRow: DBCombatStats | null;
	oldRow: DBCombatStats | null;
}

/**
 * watchBombsForCharacter()
 *
 * Subscribes to changes on `character_combat_stats` for the specified `characterId`.
 * Returns a Svelte store of an array of BombsChangeEvent. Each time a new realtime
 * event arrives, we push it into the store’s array.
 */
export function watchBombsForCharacter(characterId: number): Readable<BombsChangeEvent[]> {
	return readable<BombsChangeEvent[]>([], (set) => {
		// We keep an internal array of events
		let events: BombsChangeEvent[] = [];

		// Create a supabase channel
		const channel = supabase.channel(`bombs-${characterId}`);

		// A helper to turn DBCombatStats | {} | null → DBCombatStats | null
		function coerceCombatStats(row: DBCombatStats | Record<string, unknown> | null): DBCombatStats | null {
			if (!row || Object.keys(row).length === 0) {
				return null;
			}
			return row as DBCombatStats;
		}

		function handlePayload(payload: RealtimePostgresChangesPayload<DBCombatStats>) {
			const event: BombsChangeEvent = {
				eventType: payload.eventType,
				newRow: coerceCombatStats(payload.new),
				oldRow: coerceCombatStats(payload.old)
			};
			events.push(event);
			set(events);
		}

		// Listen for all changes on `character_combat_stats` matching our character_id
		channel.on(
			'postgres_changes',
			{
				event: '*',
				schema: 'public',
				table: 'character_combat_stats',
				filter: `character_id=eq.${characterId}`
			},
			handlePayload
		);

		channel.subscribe((status) => {
			if (status === 'SUBSCRIBED') {
				console.log(`[db/bombs] Subscribed to bombs for character ${characterId}`);
			}
		});

		// Return an unsubscribe function
		return () => {
			supabase.removeChannel(channel);
		};
	});
}

/**
 * updateBombs()
 * A direct DB operation to set bombs_left for a character.
 */
export async function updateBombs(characterId: number, bombsLeft: number): Promise<void> {
	const { error } = await supabase
		.from('character_combat_stats')
		.update({ bombs_left: bombsLeft })
		.eq('character_id', characterId);

	if (error) {
		console.error('[db/bombs] Failed to update bombs_left:', error);
		throw new Error(error.message);
	}
}
