// FILE: src/lib/db/character.ts

import { error } from '@sveltejs/kit';
import { supabase } from '$lib/db/supabaseClient';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Import your domain types
import type { Character, CharacterBuff, SkillRankSource } from '$lib/domain/types/character';
import type { ABPBonusType } from '$lib/domain/types/abp';
import type { AttributeKey, ConsumableKey, KnownBuffType } from '$lib/domain/types/character';
import type { Database } from '$lib/domain/types/supabase';
type Tables = Database['public']['Tables'];

/**
 * Fetch the main character plus sub-data.
 * Returns a fully-hydrated `Character` object or throws an HTTP error on failure.
 */
export async function getFullCharacterData(characterId: number): Promise<Character> {
	console.log('🔄 DB Layer: Loading character data');

	// 1. Fetch the main character row
	const { data: characterData, error: characterError } = await supabase
		.from('characters')
		.select('*')
		.eq('id', characterId)
		.single();

	if (characterError) {
		console.error('❌ DB Layer: Error loading character:', characterError);
		throw error(500, 'Error loading character data');
	}

	if (!characterData) {
		console.error('❌ DB Layer: No character found with ID:', characterId);
		throw error(404, 'Character not found');
	}

	// 2. Fetch all sub-tables in parallel
	const [
		{ data: attributes, error: attrError },
		{ data: buffs, error: buffsError },
		{ data: skillRanks, error: skillRanksError },
		{ data: baseSkills, error: baseSkillsError },
		{ data: classSkillRelations, error: classSkillsError },
		{ data: classFeatures, error: classFeaturesError },
		{ data: abpBonuses, error: abpError },
		{ data: combatStats, error: combatError },
		{ data: equipment, error: equipmentError },
		{ data: feats, error: featsError },
		{ data: discoveries, error: discError },
		{ data: favoredClassBonuses, error: fcbError },
		{ data: consumables, error: consError },
		{ data: spellSlots, error: spellSlotsError },
		{ data: knownSpells, error: knownSpellsError },
		{ data: extracts, error: extractsError },
		{ data: corruptionManifestations, error: corrManError },
		{ data: corruptions, error: corrError },
		{ data: traits, error: traitsError },
		{ data: ancestries, error: ancestryError },
		{ data: ancestralTraits, error: ancestralTraitsError }
	] = await Promise.all([
		supabase.from('character_attributes').select('*').eq('character_id', characterId),
		supabase.from('character_buffs').select('*').eq('character_id', characterId),
		supabase.from('character_skill_ranks').select('*').eq('character_id', characterId),
		supabase.from('base_skills').select('*'),
		supabase.from('class_skill_relations').select('*').eq('class_name', characterData.class),
		supabase.from('character_class_features').select('*').eq('character_id', characterId),
		supabase.from('character_abp_bonuses').select('*').eq('character_id', characterId),
		supabase.from('character_combat_stats').select('*').eq('character_id', characterId),
		supabase.from('character_equipment').select('*').eq('character_id', characterId),
		supabase.from('character_feats').select('*').eq('character_id', characterId),
		supabase.from('character_discoveries').select('*').eq('character_id', characterId),
		supabase.from('character_favored_class_bonuses').select('*').eq('character_id', characterId),
		supabase.from('character_consumables').select('*').eq('character_id', characterId),
		supabase.from('character_spell_slots').select('*').eq('character_id', characterId),
		supabase.from('character_known_spells').select('*').eq('character_id', characterId),
		supabase.from('character_extracts').select('*').eq('character_id', characterId),
		supabase
			.from('character_corruption_manifestations')
			.select('*')
			.eq('character_id', characterId),
		supabase.from('character_corruptions').select('*').eq('character_id', characterId),
		supabase.from('character_traits').select('*, base_traits(*)').eq('character_id', characterId),
		supabase
			.from('character_ancestries')
			.select(
				`
                *,
                ancestry:base_ancestries!inner (
                    id,
                    name,
                    size,
                    base_speed,
                    ability_modifiers,
                    description
                )
            `
			)
			.eq('character_id', characterId),
		supabase.from('character_ancestral_traits').select('*').eq('character_id', characterId)
	]);

	// 3. Check for sub-query errors
	const subQueryErrors = [
		attrError,
		buffsError,
		skillRanksError,
		baseSkillsError,
		classSkillsError,
		classFeaturesError,
		abpError,
		combatError,
		equipmentError,
		featsError,
		discError,
		fcbError,
		consError,
		spellSlotsError,
		knownSpellsError,
		extractsError,
		corrManError,
		corrError,
		traitsError,
		ancestryError,
		ancestralTraitsError
	].filter(Boolean);

	if (subQueryErrors.length > 0) {
		console.error('❌ DB Layer: One or more sub-query errors:', subQueryErrors);
		throw error(500, 'Error loading sub-data for character');
	}

	// 4. Build final `Character` object
	const character: Character = {
		...characterData,
		character_attributes: attributes ?? [],
		character_buffs: (buffs ?? []).map((b) => ({
			...b,
			buff_type: b.buff_type as CharacterBuff['buff_type']
		})),
		character_skill_ranks: (skillRanks ?? []).map((rank) => ({
			...rank,
			source: rank.source as SkillRankSource
		})),
		base_skills: baseSkills ?? [],
		class_skill_relations: classSkillRelations ?? [],
		character_class_features: classFeatures ?? [],
		character_abp_bonuses: abpBonuses ?? [],
		character_combat_stats: combatStats ?? [],
		character_equipment: equipment ?? [],
		character_feats: feats ?? [],
		character_discoveries: discoveries ?? [],
		character_favored_class_bonuses: favoredClassBonuses ?? [],
		character_consumables: consumables ?? [],
		character_spell_slots: spellSlots ?? [],
		character_known_spells: knownSpells ?? [],
		character_extracts: extracts ?? [],
		character_corruption_manifestations: corruptionManifestations ?? [],
		character_corruptions: corruptions ?? [],
		character_traits: (traits ?? []).map((t) => ({
			...t,
			base_traits: t.base_traits || undefined
		})),
		character_ancestries: (ancestries ?? []).map((a) => {
			const fixedAncestry = a.ancestry
				? {
						...a.ancestry,
						ability_modifiers: a.ancestry.ability_modifiers as Record<string, number>
					}
				: undefined;
			return {
				...a,
				ancestry: fixedAncestry
			};
		}),
		character_ancestral_traits: ancestralTraits ?? []
	};

	console.log('✅ DB Layer: Character data loaded successfully');
	return character;
}

/**
 * Setup a real-time subscription for the given characterId,
 * and pass changes to your callback functions.
 */
export function dbSetupRealtimeSubscription(
	characterId: number,
	onCharactersChange: (payload: RealtimePostgresChangesPayload<any>) => void,
	onAttrChange: (payload: RealtimePostgresChangesPayload<any>) => void,
	onCombatChange: (payload: RealtimePostgresChangesPayload<any>) => void,
	onConsumablesChange: (payload: RealtimePostgresChangesPayload<any>) => void,
	onBuffsChange: (payload: RealtimePostgresChangesPayload<any>) => void
): () => void {
	const channel = supabase
		.channel(`character-${characterId}`)
		.on(
			'postgres_changes',
			{
				event: '*',
				schema: 'public',
				table: 'characters',
				filter: `id=eq.${characterId}`
			},
			onCharactersChange
		)
		.on(
			'postgres_changes',
			{
				event: '*',
				schema: 'public',
				table: 'character_attributes',
				filter: `character_id=eq.${characterId}`
			},
			onAttrChange
		)
		.on(
			'postgres_changes',
			{
				event: '*',
				schema: 'public',
				table: 'character_combat_stats',
				filter: `character_id=eq.${characterId}`
			},
			onCombatChange
		)
		.on(
			'postgres_changes',
			{
				event: '*',
				schema: 'public',
				table: 'character_consumables',
				filter: `character_id=eq.${characterId}`
			},
			onConsumablesChange
		)
		.on(
			'postgres_changes',
			{
				event: '*',
				schema: 'public',
				table: 'character_buffs',
				filter: `character_id=eq.${characterId}`
			},
			onBuffsChange
		)
		.subscribe();

	// Return unsubscribe function
	return () => {
		supabase.removeChannel(channel);
	};
}

/** Update bombs_left in character_combat_stats */
export async function dbUpdateBombs(characterId: number, bombs: number) {
	const { error } = await supabase
		.from('character_combat_stats')
		.update({ bombs_left: bombs })
		.eq('character_id', characterId);
	if (error) throw error;
}

/** Update a single consumable item by key */
export async function dbUpdateConsumable(characterId: number, type: ConsumableKey, value: number) {
	const { error } = await supabase
		.from('character_consumables')
		.update({ [type]: value })
		.eq('character_id', characterId);
	if (error) throw error;
}

/** Update a single attribute (STR, DEX, etc.) */
export async function dbUpdateAttribute(characterId: number, attr: AttributeKey, value: number) {
	const { error } = await supabase
		.from('character_attributes')
		.update({ [attr]: value })
		.eq('character_id', characterId);
	if (error) throw error;
}

/** Update skill ranks for a given skill_id */
export async function dbUpdateSkillRank(characterId: number, skillId: number, ranks: number) {
	const { error } = await supabase
		.from('character_skill_ranks')
		.update({ ranks })
		.eq('character_id', characterId)
		.eq('skill_id', skillId);
	if (error) throw error;
}

/** Update current HP in the characters table */
export async function dbUpdateHP(characterId: number, newValue: number) {
	const { error } = await supabase
		.from('characters')
		.update({ current_hp: newValue })
		.eq('id', characterId);
	if (error) throw error;
}

/** Update a single spell slot's remaining count */
export async function dbUpdateSpellSlot(characterId: number, level: number, remaining: number) {
	const { error } = await supabase
		.from('character_spell_slots')
		.update({ remaining })
		.eq('character_id', characterId)
		.eq('spell_level', level);
	if (error) throw error;
}

/** Update a single extract row (partial) */
export async function dbUpdateExtract(
	characterId: number,
	extractId: number,
	updates: Omit<Partial<Tables['character_extracts']['Row']>, 'id'>
) {
	const { error } = await supabase
		.from('character_extracts')
		.update({
			...updates,
			prepared: updates.prepared ?? 0,
			used: updates.used ?? 0,
			updated_at: new Date().toISOString()
		})
		.eq('id', extractId)
		.eq('character_id', characterId);
	if (error) throw error;
}

/** Toggle a buff on or off */
export async function dbToggleBuff(
	characterId: number,
	buffType: KnownBuffType,
	isActive: boolean
) {
	const { error } = await supabase
		.from('character_buffs')
		.update({ is_active: isActive })
		.eq('character_id', characterId)
		.eq('buff_type', buffType);

	if (error) throw error;
}

/** Update an ABP bonus */
export async function dbUpdateABPBonus(
	characterId: number,
	bonusType: ABPBonusType,
	value: number,
	valueTarget?: string
) {
	const { error } = await supabase
		.from('character_abp_bonuses')
		.update({
			value,
			value_target: valueTarget
		})
		.eq('character_id', characterId)
		.eq('bonus_type', bonusType);

	if (error) throw error;
}

/**
 * Fetch skill data (base skills, skill ranks, class skill relations) for a character
 */
export async function dbFetchSkillData(
	characterId: number,
	characterClass: string | null | undefined
) {
	if (!characterClass) {
		throw new Error('Character class is required to fetch skill data');
	}

	const [baseSkillsResult, skillRanksResult, classSkillsResult] = await Promise.all([
		supabase.from('base_skills').select('*'),
		supabase.from('character_skill_ranks').select('*').eq('character_id', characterId),
		supabase.from('class_skill_relations').select('*').eq('class_name', characterClass)
	]);

	if (baseSkillsResult.error) throw baseSkillsResult.error;
	if (skillRanksResult.error) throw skillRanksResult.error;
	if (classSkillsResult.error) throw classSkillsResult.error;

	return {
		baseSkills: baseSkillsResult.data ?? [],
		skillRanks: skillRanksResult.data ?? [],
		classSkillRelations: classSkillsResult.data ?? []
	};
}

/**
 * Fetch partial data: favored class bonuses & ancestry data
 */
export async function dbFetchPartialCharacterData(characterId: number) {
	const [fcbResult, ancestryResult] = await Promise.all([
		supabase.from('character_favored_class_bonuses').select('*').eq('character_id', characterId),
		supabase
			.from('character_ancestries')
			.select(
				`
                *,
                ancestry:base_ancestries!inner (
                    id,
                    name,
                    size,
                    base_speed,
                    ability_modifiers,
                    description
                )
            `
			)
			.eq('character_id', characterId)
	]);

	if (fcbResult.error) throw fcbResult.error;
	if (ancestryResult.error) throw ancestryResult.error;

	return {
		favoredClassBonuses: fcbResult.data ?? [],
		ancestryRows: ancestryResult.data ?? []
	};
}
