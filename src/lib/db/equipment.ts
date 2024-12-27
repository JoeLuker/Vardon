// FILE: src/lib/db/equipment.ts

import { supabase } from '$lib/db/supabaseClient';
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
	id?: number; // optional, means update
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
				.eq('id', data.id!) // Added non-null assertion since we checked above
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
	const { error } = await supabase.from('character_equipment').delete().eq('id', equipmentId);

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
