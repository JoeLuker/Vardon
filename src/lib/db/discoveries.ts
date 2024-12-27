// FILE: src/lib/db/discoveries.ts
import { supabase } from '$lib/db/supabaseClient';
import { readable, type Readable } from 'svelte/store';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { DatabaseCharacterDiscovery } from '$lib/domain/types/character';
import type { Json } from '$lib/domain/types/supabase';

/**
 * Shape of data needed to insert or update a discovery.
 * `id` is optional; if not present, we do an insert.
 */
export interface DiscoverySaveData {
	discovery_name: string;
	selected_level: number;
	character_id: number;
	properties: Json | null;
	id?: number; // If present => update row; if absent => insert new
}

/**
 * Insert or update a discovery row in `character_discoveries`,
 * returning the saved row.
 */
export async function saveDiscovery(data: DiscoverySaveData): Promise<DatabaseCharacterDiscovery> {
	const isNew = !data.id;

	const query = isNew
		? supabase
				.from('character_discoveries')
				.insert({
					discovery_name: data.discovery_name,
					selected_level: data.selected_level,
					character_id: data.character_id,
					properties: data.properties
				})
				.select()
				.single()
		: supabase
				.from('character_discoveries')
				.update({
					discovery_name: data.discovery_name,
					selected_level: data.selected_level,
					character_id: data.character_id,
					properties: data.properties
				})
				.eq('id', data.id!)
				.select()
				.single();

	const { data: result, error } = await query;
	if (error) throw error;

	return result as DatabaseCharacterDiscovery;
}

/**
 * Delete a discovery row by its ID.
 */
export async function removeDiscovery(discoveryId: number): Promise<void> {
	const { error } = await supabase
		.from('character_discoveries')
		.delete()
		.eq('id', discoveryId);

	if (error) throw error;
}

/* ---------------------------------------------------------------------------
   REAL-TIME SUBSCRIPTIONS
   We'll provide a watcher for rows in `character_discoveries`,
   filtered by `character_id=eq.{characterId}`.
--------------------------------------------------------------------------- */

/**
 * The shape of each real-time event for character_discoveries.
 */
export interface DiscoveryChangeEvent {
	eventType: 'INSERT' | 'UPDATE' | 'DELETE';
	newRow: DatabaseCharacterDiscovery | null;
	oldRow: DatabaseCharacterDiscovery | null;
}

/**
 * watchDiscoveriesForCharacter(characterId)
 *
 * Returns a Svelte `readable` store that accumulates real-time
 * events (INSERT, UPDATE, DELETE) for the `character_discoveries` table,
 * filtered by `character_id`.
 */
export function watchDiscoveriesForCharacter(characterId: number): Readable<DiscoveryChangeEvent[]> {
	return readable<DiscoveryChangeEvent[]>([], (set) => {
		// We'll store events in this array
		let internalArray: DiscoveryChangeEvent[] = [];

		const channel = supabase.channel(`character_discoveries_${characterId}`);

		const handlePayload = (
			payload: RealtimePostgresChangesPayload<Partial<DatabaseCharacterDiscovery>>
		) => {
			// If supabase returns empty objects, treat them as null
			const newRow =
				payload.new && Object.keys(payload.new).length > 0
					? (payload.new as DatabaseCharacterDiscovery)
					: null;
			const oldRow =
				payload.old && Object.keys(payload.old).length > 0
					? (payload.old as DatabaseCharacterDiscovery)
					: null;

			const event: DiscoveryChangeEvent = {
				eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
				newRow,
				oldRow
			};

			// Append to the internal array
			internalArray = [...internalArray, event];
			set(internalArray);
		};

		channel.on(
			'postgres_changes',
			{
				event: '*',
				schema: 'public',
				table: 'character_discoveries',
				filter: `character_id=eq.${characterId}`
			},
			handlePayload
		);

		channel.subscribe((status) => {
			if (status === 'SUBSCRIBED') {
				console.log(`[db/discoveries] Subscribed to character_discoveries for char ${characterId}`);
			}
		});

		// Cleanup once the last subscriber unsubscribes
		return () => {
			supabase.removeChannel(channel);
		};
	});
}
