// FILE: src/lib/db/skillRanks.ts
import { supabase } from '$lib/db/supabaseClient';
import { readable, type Readable } from 'svelte/store';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { DatabaseCharacterSkillRank, SkillRankSource } from '$lib/domain/types/character';

/**
 * Single row shape for upserting skill ranks.
 * Adjust fields to match your DB schema, if needed.
 */
export interface SkillRankInsert {
	character_id: number;
	skill_id: number;
	ranks: number;
	applied_at_level: number;
	source: SkillRankSource;
}

/**
 * 1) Get existing class skill ranks for a specific character and source.
 *    e.g., source = SKILL_RANK_SOURCES.CLASS
 */
export async function getClassSkillRanks(
	characterId: number,
	source: string
): Promise<DatabaseCharacterSkillRank[]> {
	const { data, error } = await supabase
		.from('character_skill_ranks')
		.select('*')
		.eq('character_id', characterId)
		.eq('source', source);

	if (error) {
		console.error('Failed to fetch skill ranks:', error);
		throw new Error(`Error fetching skill ranks: ${error.message}`);
	}

	// Return an array of skill-rank rows, or empty array if none
	return data ?? [];
}

/**
 * 2) Delete skill-rank records by an array of IDs.
 */
export async function deleteSkillRanksByIds(ids: number[]): Promise<void> {
	const { error } = await supabase
		.from('character_skill_ranks')
		.delete()
		.in('id', ids);

	if (error) {
		console.error('Failed to delete skill ranks:', error);
		throw new Error(`Error deleting skill ranks: ${error.message}`);
	}
}

/**
 * 3) Upsert (insert or update) multiple skill-rank rows.
 *    Typically used when the user adds new skill ranks in the UI.
 *    The DB determines insertion vs. update by matching unique constraints
 *    (e.g. on (character_id, skill_id, applied_at_level)).
 */
export async function upsertSkillRanks(
	updates: SkillRankInsert[]
): Promise<DatabaseCharacterSkillRank[]> {
	// Adjust your columns as needed. (unique constraint, returning data, etc.)
	const { data, error } = await supabase
		.from('character_skill_ranks')
		.upsert(
			updates.map((update) => ({
				...update,
				source: update.source as 'class' | 'favored_class' | 'intelligence' | 'other',
				applied_at_level: update.applied_at_level || 1
			}))
		)
		.select(); // We select so we get the newly inserted/updated rows back

	if (error) {
		console.error('Failed to upsert skill ranks:', error);
		throw new Error(`Error upserting skill ranks: ${error.message}`);
	}

	// Return the newly upserted rows
	return data ?? [];
}

/* ---------------------------------------------------------------------------
   REAL-TIME SUBSCRIPTIONS
   We’ll provide a watcher for `character_skill_ranks`,
   typically filtered by `character_id=eq.{characterId}`.
--------------------------------------------------------------------------- */

/**
 * The shape of each real-time event for skill ranks.
 */
export interface SkillRankChangeEvent {
	eventType: 'INSERT' | 'UPDATE' | 'DELETE';
	newRow: DatabaseCharacterSkillRank | null;
	oldRow: DatabaseCharacterSkillRank | null;
}

/**
 * watchSkillRanksForCharacter(characterId)
 *
 * Subscribes to changes (INSERT, UPDATE, DELETE) in the `character_skill_ranks` table
 * where `character_id=eq.{characterId}`, returning a Svelte `readable` store that
 * accumulates events as they arrive.
 */
export function watchSkillRanksForCharacter(characterId: number): Readable<SkillRankChangeEvent[]> {
	return readable<SkillRankChangeEvent[]>([], (set) => {
		// We'll store events in an internal array, appending new ones as they come in
		let internalArray: SkillRankChangeEvent[] = [];

		const channel = supabase.channel(`character_skill_ranks_${characterId}`);

		const handlePayload = (
			payload: RealtimePostgresChangesPayload<Partial<DatabaseCharacterSkillRank>>
		) => {
			// If supabase returns empty new/old, treat them as null
			const newRow =
				payload.new && Object.keys(payload.new).length > 0
					? (payload.new as DatabaseCharacterSkillRank)
					: null;
			const oldRow =
				payload.old && Object.keys(payload.old).length > 0
					? (payload.old as DatabaseCharacterSkillRank)
					: null;

			const event: SkillRankChangeEvent = {
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
				table: 'character_skill_ranks',
				filter: `character_id=eq.${characterId}`
			},
			handlePayload
		);

		channel.subscribe((status) => {
			if (status === 'SUBSCRIBED') {
				console.log(`[db/skillRanks] Subscribed to character_skill_ranks for character ${characterId}`);
			}
		});

		// Cleanup once the last subscriber unsubscribes
		return () => {
			supabase.removeChannel(channel);
		};
	});
}
