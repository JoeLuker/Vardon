// FILE: src/lib/db/corruptions.ts

import { supabase } from '$lib/db/supabaseClient';
import { readable, type Readable } from 'svelte/store';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Tables, TablesInsert } from '$lib/domain/types/supabase';

/** The full row type from the database */
export type DBCorruption = Tables<'character_corruptions'>;

/** Type for inserting a new corruption */
export type CorruptionInsert = TablesInsert<'character_corruptions'>;

/**
 * Type for updating an existing corruption.
 * Explicitly includes 'id' and other optional fields, including 'sync_status'.
 */
export interface CorruptionUpdate {
	id: number;
	blood_consumed?: number | null;
	blood_required?: number | null;
	character_id?: number | null;
	corruption_stage?: number | null;
	corruption_type?: string;
	properties?: VampireManifestationProperties;
	created_at?: string | null;
	updated_at?: string | null;
	sync_status?: string | null;
}

/**
 * Define the `VampireManifestationProperties` interface
 * based on your specific requirements.
 */
export interface VampireManifestationProperties {
	lastFeedDate?: string;
	constitutionDamageDealt?: number;
	requiresDailyFeeding?: boolean;
	hasSpiderClimb?: boolean;
	invitedDwellings?: string[];
}

/** A small type-guard to differentiate an update vs. insert */
function isCorruptionUpdate(input: CorruptionInsert | CorruptionUpdate): input is CorruptionUpdate {
	return (input as CorruptionUpdate).id !== undefined;
}

/**
 * Insert or update (upsert) a corruption row in `character_corruptions`.
 * - If `id` is present => update that row
 * - Otherwise => insert new
 */
export async function upsertCorruption(
	input: CorruptionInsert | CorruptionUpdate
): Promise<DBCorruption> {
	if (isCorruptionUpdate(input)) {
		const { id, ...updateFields } = input;
		const { data, error } = await supabase
			.from('character_corruptions')
			.update(updateFields)
			.eq('id', id)
			.select()
			.single();

		if (error) throw new Error(error.message);
		return data;
	} else {
		const { data, error } = await supabase
			.from('character_corruptions')
			.insert(input)
			.select()
			.single();

		if (error) throw new Error(error.message);
		return data;
	}
}

/** Delete a corruption by ID */
export async function deleteCorruption(id: number): Promise<void> {
	const { error } = await supabase.from('character_corruptions').delete().eq('id', id);
	if (error) throw new Error(error.message);
}

/* ---------------------------------------------------------------------------
   REAL-TIME SUBSCRIPTIONS
   We provide a watcher for rows in `character_corruptions`,
   typically filtered by `character_id=eq.{characterId}`.
--------------------------------------------------------------------------- */

/**
 * The shape of each real-time event we emit for corruptions.
 */
export interface CorruptionChangeEvent {
	eventType: 'INSERT' | 'UPDATE' | 'DELETE';
	newRow: DBCorruption | null;
	oldRow: DBCorruption | null;
}

/**
 * watchCorruptionsForCharacter(characterId)
 * 
 * Returns a Svelte `readable` store that accumulates real-time events
 * for the `character_corruptions` table where `character_id=characterId`.
 */
export function watchCorruptionsForCharacter(characterId: number): Readable<CorruptionChangeEvent[]> {
	return readable<CorruptionChangeEvent[]>([], (set) => {
		// We'll keep events in a local array. Each time a new event arrives, we append to it.
		let internalArray: CorruptionChangeEvent[] = [];

		const channel = supabase.channel(`character_corruptions_${characterId}`);

		const handlePayload = (payload: RealtimePostgresChangesPayload<Partial<DBCorruption>>) => {
			// If supabase returns an empty object for new/old, treat them as null
			const newRow =
				payload.new && Object.keys(payload.new).length > 0
					? (payload.new as DBCorruption)
					: null;
			const oldRow =
				payload.old && Object.keys(payload.old).length > 0
					? (payload.old as DBCorruption)
					: null;

			const event: CorruptionChangeEvent = {
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
				table: 'character_corruptions',
				filter: `character_id=eq.${characterId}`
			},
			handlePayload
		);

		channel.subscribe((status) => {
			if (status === 'SUBSCRIBED') {
				console.log(`[db/corruptions] Subscribed to character_corruptions for character ${characterId}`);
			}
		});

		// Cleanup when unsubscribed
		return () => {
			supabase.removeChannel(channel);
		};
	});
}
