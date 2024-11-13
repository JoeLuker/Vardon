// src/lib/server/db.ts

import { supabase } from '../supabaseClient';
import type { PostgrestError } from '@supabase/supabase-js';
import type {
	CharacterWithRelations,
	CombatStats,
	Consumables,
	CharacterAttributes
} from '../types/character';

// Custom error classes
class DatabaseError extends Error {
	constructor(
		message: string,
		public originalError: PostgrestError
	) {
		super(message);
		this.name = 'DatabaseError';
	}
}

class NotFoundError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'NotFoundError';
	}
}

// Helper function to transform the data
function transformCharacterData(data: any): CharacterWithRelations {
	return {
		...data,
		character_attributes: data.character_attributes?.[0] || null,
		character_combat_stats: data.character_combat_stats?.[0] || null,
		character_consumables: data.character_consumables?.[0] || null,
		character_buffs: data.character_buffs || [],
		character_spell_slots: data.character_spell_slots || [],
		character_known_spells: data.character_known_spells || [],
		character_skills: data.character_skills || []
	};
}

/**
 * Fetches a character along with all related data.
 * @param id - The ID of the character to fetch.
 * @returns A promise that resolves to a CharacterWithRelations object.
 */
export async function getCharacter(id: number): Promise<CharacterWithRelations> {
	const { data, error } = await supabase
		.from('characters')
		.select(
			`
            *,
            character_attributes!inner (
                str,
                dex,
                con,
                int,
                wis,
                cha
            ),
            character_combat_stats!inner (
                bombs_left,
                base_attack_bonus
            ),
            character_consumables!inner (
                alchemist_fire,
                acid,
                tanglefoot
            ),
            character_buffs (
                buff_type,
                is_active
            ),
            character_spell_slots (
                spell_level,
                total,
                remaining
            ),
            character_known_spells (
                spell_level,
                spell_name
            ),
            character_skills (
                ability,
                class_skill,
                ranks,
                skill_name
            )
        `
		)
		.eq('id', id)
		.single();

	if (error) {
		throw new DatabaseError('Failed to fetch character', error);
	}

	if (!data) {
		throw new NotFoundError(`Character with ID ${id} not found`);
	}

	return transformCharacterData(data);
}

/**
 * Updates the current HP of a character.
 * @param id - The ID of the character.
 * @param hp - The new HP value.
 * @returns A promise that resolves when the update is complete.
 */
export async function updateCharacterHP(id: number, hp: number): Promise<void> {
	const { error } = await supabase.from('characters').update({ current_hp: hp }).eq('id', id);

	if (error) throw error;
}

/**
 * Updates a specific attribute of a character.
 * @param characterId - The ID of the character.
 * @param attribute - The attribute to update.
 * @param value - The new value for the attribute.
 * @returns A promise that resolves when the update is complete.
 */
export async function updateCharacterAttribute(
	characterId: number,
	attribute: keyof CharacterAttributes,
	value: number
): Promise<void> {
	const { error } = await supabase
		.from('character_attributes')
		.update({ [attribute]: value })
		.eq('character_id', characterId)
		.single();

	if (error) throw error;
}

/**
 * Updates the combat stats of a character.
 * @param id - The ID of the character.
 * @param stats - Partial combat stats to update.
 * @returns A promise that resolves when the update is complete.
 */
export async function updateCombatStats(id: number, stats: Partial<CombatStats>): Promise<void> {
	const { error } = await supabase
		.from('character_combat_stats')
		.update(stats)
		.eq('character_id', id)
		.single();

	if (error) throw error;
}

/**
 * Updates the consumables of a character.
 * @param id - The ID of the character.
 * @param consumables - Partial consumables to update.
 * @returns A promise that resolves when the update is complete.
 */
export async function updateConsumables(
	id: number,
	consumables: Partial<Consumables>
): Promise<void> {
	const { error } = await supabase
		.from('character_consumables')
		.update(consumables)
		.eq('character_id', id)
		.single();

	if (error) throw error;
}

/**
 * Updates a specific buff.
 * @param id - The ID of the character.
 * @param buffType - The type of buff to update.
 * @param isActive - The new active state of the buff.
 * @returns A promise that resolves when the update is complete.
 */
export async function updateBuff(id: number, buffType: string, isActive: boolean): Promise<void> {
	const { error } = await supabase
		.from('character_buffs')
		.update({ is_active: isActive })
		.eq('character_id', id)
		.eq('buff_type', buffType)
		.single();

	if (error) throw error;
}

/**
 * Updates a specific skill of a character.
 * @param id - The ID of the character.
 * @param skillName - The name of the skill to update.
 * @param ranks - The new ranks for the skill.
 * @returns A promise that resolves when the update is complete.
 */
export async function updateSkill(id: number, skillName: string, ranks: number): Promise<void> {
	const { error } = await supabase
		.from('character_skills')
		.update({ ranks })
		.eq('character_id', id)
		.eq('skill_name', skillName)
		.single();

	if (error) throw error;
}
