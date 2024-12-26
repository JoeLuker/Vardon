import type { Database } from '$lib/domain/types/supabase';

export type TablesInsert = Database['public']['Tables'];
export type CharacterUpdate = TablesInsert['characters']['Update'];
export type AttributeUpdate = TablesInsert['character_attributes']['Update'];
export type CombatStatsUpdate = TablesInsert['character_combat_stats']['Update'];
export type ConsumablesUpdate = TablesInsert['character_consumables']['Update'];

export interface SyncUpdate {
	type: string;
	data: unknown;
	timestamp: number;
}

export interface SyncUpdates {
	hp?: number;
	attributes?: AttributeUpdate;
	combatStats?: CombatStatsUpdate;
	consumables?: ConsumablesUpdate;
}

export interface Notification {
	id: number;
	message: string;
	type: 'success' | 'error' | 'warning';
	autoDismiss: boolean;
}

export interface LocalState {
	state: any; // Replace with your character type
	timestamp: number;
}

export type AttributeKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
export type ConsumableKey = 'alchemist_fire' | 'acid' | 'tanglefoot';
