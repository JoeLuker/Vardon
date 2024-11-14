import { supabase } from './supabaseClient';
import type { Database } from './types/supabase';

type Tables = Database['public']['Tables'];
type TableNames = keyof Tables;
type CharacterRow = Tables['characters']['Row'];
type AttributesRow = Tables['character_attributes']['Row'];
type CombatStatsRow = Tables['character_combat_stats']['Row'];
type ConsumablesRow = Tables['character_consumables']['Row'];
type BuffRow = Tables['character_buffs']['Row'];
type SkillRow = Tables['character_skills']['Row'];

export type RealtimeStatus = 'connected' | 'disconnected';

export function subscribeToCharacter(
	characterId: number,
	onUpdate: {
		character?: (data: CharacterRow) => void;
		attributes?: (data: AttributesRow) => void;
		combatStats?: (data: CombatStatsRow) => void;
		consumables?: (data: ConsumablesRow) => void;
		buffs?: (data: BuffRow) => void;
		skills?: (data: SkillRow[]) => void;
		status?: (status: RealtimeStatus) => void;
	}
) {
	console.log('🔄 Setting up realtime subscription for character:', characterId);

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
			(payload) => {
				console.log('📝 Realtime: Character update received', payload);
				onUpdate.character?.(payload.new as CharacterRow);
			}
		)
		.on(
			'postgres_changes',
			{
				event: '*',
				schema: 'public',
				table: 'character_attributes',
				filter: `character_id=eq.${characterId}`
			},
			(payload) => {
				console.log('📝 Realtime: Attributes update received', payload);
				onUpdate.attributes?.(payload.new as AttributesRow);
			}
		)
		.on(
			'postgres_changes',
			{
				event: '*',
				schema: 'public',
				table: 'character_combat_stats',
				filter: `character_id=eq.${characterId}`
			},
			(payload) => {
				console.log('📝 Realtime: Combat stats update received', payload);
				onUpdate.combatStats?.(payload.new as CombatStatsRow);
			}
		)
		.on(
			'postgres_changes',
			{
				event: '*',
				schema: 'public',
				table: 'character_consumables',
				filter: `character_id=eq.${characterId}`
			},
			(payload) => {
				console.log('📝 Realtime: Consumables update received', payload);
				onUpdate.consumables?.(payload.new as ConsumablesRow);
			}
		)
		.on(
			'postgres_changes',
			{
				event: '*',
				schema: 'public',
				table: 'character_buffs',
				filter: `character_id=eq.${characterId}`
			},
			(payload) => {
				console.log('📝 Realtime: Buffs update received', payload);
				onUpdate.buffs?.(payload.new as BuffRow);
			}
		)
		.on(
			'postgres_changes',
			{
				event: '*',
				schema: 'public',
				table: 'character_skills',
				filter: `character_id=eq.${characterId}`
			},
			(payload) => {
				console.log('📝 Realtime: Skills update received', payload);
				// We send the entire array since skills are managed as a collection
				if (payload.new) {
					const updatedSkill = payload.new as SkillRow;
					onUpdate.skills?.([updatedSkill]);
				}
			}
		);

	channel.subscribe(async (status) => {
		if (status === 'SUBSCRIBED') {
			console.log('✅ Realtime: Successfully subscribed');
			onUpdate.status?.('connected');
		} else {
			console.log('⚠️ Realtime: Subscription status:', status);
			onUpdate.status?.('disconnected');
		}
	});

	return () => {
		console.log('🔌 Realtime: Unsubscribing');
		supabase.removeChannel(channel);
	};
}

export async function updateCharacterField(
	table: TableNames,
	characterId: number,
	updates: Record<string, unknown>
) {
	console.log(`Updating ${table} for character ${characterId}:`, updates);
	
	// Create the base query without select() first
	const baseQuery = supabase
		.from(table)
		.update(updates);
	
	// Add appropriate filters based on table
	if (table === 'characters') {
		baseQuery.eq('id', characterId);
	} else if (table === 'character_buffs') {
		baseQuery
			.eq('character_id', characterId)
			.eq('buff_type', updates.buff_type as string);
	} else {
		baseQuery.eq('character_id', characterId);
	}

	// Add select() at the end and execute the query
	const { error, data } = await baseQuery.select();
	
	if (error) {
		console.error(`Error updating ${table}:`, error);
		throw error;
	}
	
	console.log(`Successfully updated ${table}:`, data);
	return data;
}