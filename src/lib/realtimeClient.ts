import { supabase } from './supabaseClient';
import type { Database } from './types/supabase';

type Tables = Database['public']['Tables'];
type TableNames = keyof Tables;
type CharacterRow = Tables['characters']['Row'];
type AttributesRow = Tables['character_attributes']['Row'];
type CombatStatsRow = Tables['character_combat_stats']['Row'];
type ConsumablesRow = Tables['character_consumables']['Row'];

export type RealtimeStatus = 'connected' | 'disconnected';

export function subscribeToCharacter(
	characterId: number,
	onUpdate: {
		character?: (data: CharacterRow) => void;
		attributes?: (data: AttributesRow) => void;
		combatStats?: (data: CombatStatsRow) => void;
		consumables?: (data: ConsumablesRow) => void;
		status?: (status: RealtimeStatus) => void;
	}
) {
	console.log('🔄 Setting up realtime subscription for character:', characterId);

	const channel = supabase
		.channel(`character-${characterId}`)
		.on(
			'postgres_changes',
			{
				event: 'UPDATE',
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
				event: 'UPDATE',
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
				event: 'UPDATE',
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
				event: 'UPDATE',
				schema: 'public',
				table: 'character_consumables',
				filter: `character_id=eq.${characterId}`
			},
			(payload) => {
				console.log('📝 Realtime: Consumables update received', payload);
				onUpdate.consumables?.(payload.new as ConsumablesRow);
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
	const { error } = await supabase
		.from(table)
		.update(updates)
		.eq(table === 'characters' ? 'id' : 'character_id', characterId);

	if (error) throw error;
}
