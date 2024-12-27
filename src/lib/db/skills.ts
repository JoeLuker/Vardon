// FILE: src/lib/db/skills.ts
import { supabase } from '$lib/db/supabaseClient';
import { readable, type Readable } from 'svelte/store';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { DatabaseBaseSkill } from '$lib/domain/types/character';

/**
 * Shape for creating or updating a base skill
 * - `id` omitted => insert; if present => update
 */
export interface BaseSkillSaveData {
	name: string;
	ability: string;
	trained_only?: boolean;
	armor_check_penalty?: boolean;
	id?: number; // optional => means update
}

/**
 * Insert or update a base skill row in the DB
 */
export async function saveBaseSkill(data: BaseSkillSaveData): Promise<DatabaseBaseSkill> {
	const isNew = !data.id;

	const query = isNew
		? supabase
				.from('base_skills')
				.insert({
					name: data.name,
					ability: data.ability,
					trained_only: data.trained_only ?? false,
					armor_check_penalty: data.armor_check_penalty ?? false
				})
				.select()
				.single()
		: supabase
				.from('base_skills')
				.update({
					name: data.name,
					ability: data.ability,
					trained_only: data.trained_only ?? false,
					armor_check_penalty: data.armor_check_penalty ?? false
				})
				.eq('id', data.id!)
				.select()
				.single();

	const { data: result, error } = await query;
	if (error) throw error;

	return result as DatabaseBaseSkill;
}

/**
 * Delete a base skill and any related skill ranks or class skill relations
 */
export async function removeBaseSkill(skillId: number): Promise<void> {
	// 1) delete related skill ranks
	const { error: ranksError } = await supabase
		.from('character_skill_ranks')
		.delete()
		.eq('skill_id', skillId);
	if (ranksError) throw ranksError;

	// 2) delete related class skill relations
	const { error: relationsError } = await supabase
		.from('class_skill_relations')
		.delete()
		.eq('skill_id', skillId);
	if (relationsError) throw relationsError;

	// 3) finally, delete the base skill itself
	const { error: skillError } = await supabase.from('base_skills').delete().eq('id', skillId);

	if (skillError) throw skillError;
}

/* ---------------------------------------------------------------------------
   REAL-TIME SUBSCRIPTIONS
   We'll provide a watcher for all `base_skills` rows.
--------------------------------------------------------------------------- */

/**
 * The shape of real-time events for base_skills.
 */
export interface BaseSkillChangeEvent {
	eventType: 'INSERT' | 'UPDATE' | 'DELETE';
	newRow: DatabaseBaseSkill | null;
	oldRow: DatabaseBaseSkill | null;
}

/**
 * watchAllBaseSkills()
 *
 * Subscribes to the `base_skills` table for ALL rows,
 * returning a Svelte store that accumulates real-time events (INSERT/UPDATE/DELETE).
 */
export function watchAllBaseSkills(): Readable<BaseSkillChangeEvent[]> {
	return readable<BaseSkillChangeEvent[]>([], (set) => {
		let internalArray: BaseSkillChangeEvent[] = [];

		const channel = supabase.channel('base_skills_all');

		const handlePayload = (
			payload: RealtimePostgresChangesPayload<Partial<DatabaseBaseSkill>>
		) => {
			// If supabase returns empty new/old, treat them as null
			const newRow =
				payload.new && Object.keys(payload.new).length > 0
					? (payload.new as DatabaseBaseSkill)
					: null;
			const oldRow =
				payload.old && Object.keys(payload.old).length > 0
					? (payload.old as DatabaseBaseSkill)
					: null;

			const event: BaseSkillChangeEvent = {
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
				table: 'base_skills'
			},
			handlePayload
		);

		channel.subscribe((status) => {
			if (status === 'SUBSCRIBED') {
				console.log('[db/skills] Subscribed to all base_skills.');
			}
		});

		// Cleanup once the last subscriber unsubscribes
		return () => {
			supabase.removeChannel(channel);
		};
	});
}
