// FILE: src/lib/state/character/CharacterStore.svelte.ts
import { browser } from '$app/environment';
import type { Character, KnownBuffType } from '$lib/domain/types/character';
import { updateQueue } from '$lib/utils/updateQueue.svelte';

// Import your domain aggregator to compute derived stats
import { calculateFullCharacterState } from '$lib/domain/character';

// Import your actual DB functions (Supabase calls)
import {
	dbUpdateHP,
	dbToggleBuff
	// ... plus any others (dbUpdateConsumable, dbUpdateAttribute, etc.)
} from '$lib/db/character';

// ────────────────────────────────────────────────────────────────────────────────
// Store data: A Map of characterId → Character objects
// ────────────────────────────────────────────────────────────────────────────────
const characterRecords = $state(new Map<number, Character>());

// ────────────────────────────────────────────────────────────────────────────────
// (Optional) Provide an empty "template" if we can't find a character in the store
// ────────────────────────────────────────────────────────────────────────────────
function createEmptyCharacter(): Character {
	return {
		id: 0,
		name: '',
		ancestry: '',
		class: '',
		level: 1,
		current_hp: 0,
		max_hp: 0,
		created_at: null,
		updated_at: null,
		last_synced_at: null,
		is_offline: null,
		user_id: null,
		// Make sure to fill out the rest of your arrays as empty:
		base_skills: [],
		character_skill_ranks: [],
		class_skill_relations: [],
		character_attributes: [],
		character_buffs: [],
		character_combat_stats: [],
		character_consumables: [],
		character_spell_slots: [],
		character_known_spells: [],
		character_class_features: [],
		character_discoveries: [],
		character_equipment: [],
		character_feats: [],
		character_extracts: [],
		character_favored_class_bonuses: [],
		character_traits: [],
		character_abp_bonuses: [],
		character_corruption_manifestations: [],
		character_corruptions: [],
		character_ancestries: [],
		character_ancestral_traits: [],
		archetype: null
	};
}

// ────────────────────────────────────────────────────────────────────────────────
// 1) initializeCharacter
//    Called once per character to put the data in the store
// ────────────────────────────────────────────────────────────────────────────────
export function initializeCharacter(c: Character) {
	if (!c || !c.id) {
		console.error('Invalid character passed to initializeCharacter');
		return;
	}

	// Wrap the character in a $state so that changes are trackable
	const reactiveChar = $state({
		...createEmptyCharacter(),
		...c
	});

	characterRecords.set(c.id, reactiveChar);

	// If you want real-time subscription, do it here
	if (browser) {
		setupRealtimeSubscription(c.id);
	}
}

// ────────────────────────────────────────────────────────────────────────────────
// 2) getCharacter
//    Returns the raw character data from the store
// ────────────────────────────────────────────────────────────────────────────────
export function getCharacter(characterId: number): Character {
	return characterRecords.get(characterId) ?? createEmptyCharacter();
}

// ────────────────────────────────────────────────────────────────────────────────
// 3) getCalculated
//    Returns a fully computed “view” of the character’s stats
//    by calling your domain aggregator, e.g. calculateFullCharacterState
// ────────────────────────────────────────────────────────────────────────────────
export function getCalculated(characterId: number) {
	const char = getCharacter(characterId);
	return calculateFullCharacterState(char);
}

// ────────────────────────────────────────────────────────────────────────────────
// 4) setHP (example action)
//    Demonstrates an optimistic update approach for HP
// ────────────────────────────────────────────────────────────────────────────────
export async function setHP(characterId: number, newHP: number) {
	const char = getCharacter(characterId);
	if (!char || char.id === 0) {
		console.error(`No character found in store for ID ${characterId}`);
		return;
	}

	const previousHP = char.current_hp;
	// Optimistically update
	char.current_hp = newHP;

	// Enqueue supabase update
	try {
		await updateQueue.enqueue({
			key: `hp-${characterId}`,
			execute: async () => {
				// Make your DB call
				await dbUpdateHP(characterId, newHP);
			},
			optimisticUpdate: () => {
				// We already did the assignment
			},
			rollback: () => {
				// Revert on failure
				char.current_hp = previousHP;
			}
		});
	} catch (err) {
		console.error('Failed to update HP:', err);
	}
}

// ────────────────────────────────────────────────────────────────────────────────
// 5) toggleBuff (another example action)
//    Demonstrates toggling a buff on/off
// ────────────────────────────────────────────────────────────────────────────────
export async function toggleBuff(characterId: number, buffType: KnownBuffType) {
	const char = getCharacter(characterId);
	if (!char || char.id === 0) {
		console.error(`No character found in store for ID ${characterId}`);
		return;
	}

	const buff = char.character_buffs.find((b) => b.buff_type === buffType);
	if (!buff) {
		console.warn(`Buff ${buffType} not found for character ${characterId}`);
		return;
	}

	const wasActive = buff.is_active;
	// Optimistically toggle
	buff.is_active = !wasActive;

	try {
		await updateQueue.enqueue({
			key: `buff-${characterId}-${buffType}`,
			execute: async () => {
				await dbToggleBuff(characterId, buffType, !wasActive);
			},
			optimisticUpdate: () => {},
			rollback: () => {
				buff.is_active = wasActive;
			}
		});
	} catch (err) {
		console.error('Failed to toggle buff:', err);
	}
}

// ────────────────────────────────────────────────────────────────────────────────
// 6) Example real-time subscription (optional):
//    If you want to stay in sync with Supabase changes, you can set up channels
// ────────────────────────────────────────────────────────────────────────────────
function setupRealtimeSubscription(characterId: number) {
	// e.g. supabase.channel(...).on( ... ).subscribe();
	// Then in the event callback, do something like:
	//   const char = getCharacter(characterId);
	//   if (char) { Object.assign(char, payload.newData); }
	// This is heavily app-specific, so fill in as needed
}

// ────────────────────────────────────────────────────────────────────────────────
// 7) Cleanup or remove a character
//    Optionally let you remove the record from the store if we’re done
// ────────────────────────────────────────────────────────────────────────────────
export function cleanupCharacter(characterId: number) {
	characterRecords.delete(characterId);
	// possibly unsubscribe from real-time as well
}
