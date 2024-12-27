// FILE: src/lib/db/equipment.ts
import { supabase } from '$lib/db/supabaseClient';
import { readable, type Readable } from 'svelte/store';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { DatabaseCharacterEquipment } from '$lib/domain/types/character';
import type { Json } from '$lib/domain/types/supabase';

/**
 * Shape for saving/updating equipment
 * - if `id` is present, we do an update
 * - otherwise, we do an insert
 */
export interface EquipmentSaveData {
	name: string;
	type: string;
	equipped: boolean;
	properties: Json; // Changed from 'object' to 'Json'
	character_id: number;
	id?: number; // optional => update if present, else insert
}

/**
 * Insert or update a piece of equipment
 */
export async function saveEquipment(data: EquipmentSaveData): Promise<DatabaseCharacterEquipment> {
	const isNew = data.id == null;

	if (!isNew && data.id === undefined) {
		throw new Error('ID is required for updates');
	}

	const query = isNew
		? supabase
				.from('character_equipment')
				.insert({
					name: data.name,
					type: data.type,
					equipped: data.equipped,
					properties: data.properties,
					character_id: data.character_id
				})
				.select()
				.single()
		: supabase
				.from('character_equipment')
				.update({
					name: data.name,
					type: data.type,
					equipped: data.equipped,
					properties: data.properties,
					character_id: data.character_id
				})
				.eq('id', data.id!)
				.select()
				.single();

	const { data: result, error } = await query;
	if (error) throw error;

	return result as DatabaseCharacterEquipment;
}

/**
 * Delete a piece of equipment by ID
 */
export async function removeEquipment(equipmentId: number): Promise<void> {
	const { error } = await supabase
		.from('character_equipment')
		.delete()
		.eq('id', equipmentId);

	if (error) throw error;
}

/**
 * Toggle a piece of equipment's equipped status
 * (or you could just do a general 'updateEquipment' if you prefer)
 */
export async function toggleEquipment(
	equipmentId: number,
	newValue: boolean
): Promise<DatabaseCharacterEquipment> {
	const { data, error } = await supabase
		.from('character_equipment')
		.update({ equipped: newValue })
		.eq('id', equipmentId)
		.select()
		.single();

	if (error) throw error;
	return data as DatabaseCharacterEquipment;
}

/* ---------------------------------------------------------------------------
   REAL-TIME SUBSCRIPTIONS
   We'll provide a watcher for `character_equipment`,
   typically filtered by character_id=eq.{characterId}.
--------------------------------------------------------------------------- */

/**
 * The shape of real-time equipment change events.
 */
export interface EquipmentChangeEvent {
	eventType: 'INSERT' | 'UPDATE' | 'DELETE';
	newRow: DatabaseCharacterEquipment | null;
	oldRow: DatabaseCharacterEquipment | null;
}

/**
 * watchEquipmentForCharacter(characterId)
 *
 * Subscribes to the `character_equipment` table for the specified character,
 * returning a Svelte store that accumulates real-time events (INSERT/UPDATE/DELETE).
 *
 * Each time a change occurs for rows with `character_id=eq.{characterId}`, 
 * a new EquipmentChangeEvent is appended to the store array.
 */
export function watchEquipmentForCharacter(characterId: number): Readable<EquipmentChangeEvent[]> {
	return readable<EquipmentChangeEvent[]>([], (set) => {
		// We'll accumulate events in an internal array
		let internalArray: EquipmentChangeEvent[] = [];

		const channel = supabase.channel(`character_equipment_${characterId}`);

		const handlePayload = (
			payload: RealtimePostgresChangesPayload<Partial<DatabaseCharacterEquipment>>
		) => {
			// If we get an empty object for new/old, treat it as null
			const newRow =
				payload.new && Object.keys(payload.new).length > 0
					? (payload.new as DatabaseCharacterEquipment)
					: null;
			const oldRow =
				payload.old && Object.keys(payload.old).length > 0
					? (payload.old as DatabaseCharacterEquipment)
					: null;

			const event: EquipmentChangeEvent = {
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
				table: 'character_equipment',
				filter: `character_id=eq.${characterId}`
			},
			handlePayload
		);

		channel.subscribe((status) => {
			if (status === 'SUBSCRIBED') {
				console.log(
					`[db/equipment] Subscribed to character_equipment for character ${characterId}`
				);
			}
		});

		// Cleanup function
		return () => {
			supabase.removeChannel(channel);
		};
	});
}
