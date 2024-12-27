/**
 * This file holds:
 * - An in-memory Map for all `Character` objects
 * - Functions to initialize, get, and mutate them
 * - Example usage of $state for reactivity
 * - Example usage of `updateQueue` for optimistic updates
 */

import { dbUpdateHP, dbToggleBuff, dbUpdateConsumable } from '$lib/db/character'; 
import { updateQueue } from '$lib/utils/updateQueue.svelte'; 
import type { Character, KnownBuffType, ConsumableKey } from '$lib/domain/types/character';
import { executeUpdate } from '$lib/utils/updates';

// 1) In-memory store: a reactive Map of characterId → Character
let characterRecords = $state(new Map<number, Character>());

// 2) A helper to create a fallback for non-existent IDs
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

		// fill in arrays/tables as empty
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
		character_favored_class_bonuses: [],
		character_equipment: [],
		character_feats: [],
		character_extracts: [],
		character_corruption_manifestations: [],
		character_corruptions: [],
		character_traits: [],
		character_ancestries: [],
		character_ancestral_traits: [],
		archetype: null
	};
}

/**
 * Put the given character into our store (if not already),
 * wrapped with $state so that writes become reactive.
 */
export function initializeCharacter(c: Character) {
	if (!c || !c.id) {
		console.error('Invalid character passed to initializeCharacter:', c);
		return;
	}

	// If we already have a record, skip or update it
	if (characterRecords.has(c.id)) {
		// Optionally merge if new data arrives
		const existing = characterRecords.get(c.id)!;
		Object.assign(existing, c);
	} else {
		// Create a fresh reactive copy
		const reactiveChar = $state({
			...createEmptyCharacter(),
			...c
		});
		characterRecords.set(c.id, reactiveChar);
	}
}

/**
 * Returns the raw character object, or a fallback if not found.
 * Because we used $state in initializeCharacter, the returned
 * object is deeply reactive (unless you used .raw).
 */
export function getCharacter(characterId: number): Character {
	return characterRecords.get(characterId) ?? createEmptyCharacter();
}

/**
 * Example: setHP with optimistic update
 */
export async function setHP(characterId: number, newHP: number) {
	const char = getCharacter(characterId);
	if (char.id === 0) {
		console.warn(`Character ${characterId} not found in store`);
		return;
	}

	const previousHP = char.current_hp;
	char.current_hp = newHP; // optimistic

	await updateQueue.enqueue({
		key: `hp-${characterId}`,
		execute: async () => {
			await dbUpdateHP(characterId, newHP);
		},
		optimisticUpdate: () => {
			// no-op, we already updated
		},
		rollback: () => {
			char.current_hp = previousHP;
		}
	});
}

/**
 * Example: toggleBuff with optimistic update
 */
export async function toggleBuff(characterId: number, buffType: KnownBuffType) {
	const char = getCharacter(characterId);
	if (char.id === 0) return;

	const buff = char.character_buffs?.find((b) => b.buff_type === buffType);
	if (!buff) {
		console.warn(`No buff ${buffType} found on character ${characterId}`);
		return;
	}

	const wasActive = buff.is_active ?? false;
	buff.is_active = !wasActive;

	await executeUpdate({
		key: `buff-${characterId}-${buffType}`,
		operation: async () => {
			await dbToggleBuff(characterId, buffType, !wasActive);
		},
		optimisticUpdate: () => {},
		rollback: () => {
			buff.is_active = wasActive;
		}
	});
}

/**
 * Example: update a consumable with optimistic approach
 */
export async function updateConsumable(characterId: number, key: ConsumableKey, amount: number) {
	const char = getCharacter(characterId);
	if (char.id === 0) return;

	const row = char.character_consumables?.[0];
	if (!row) {
		console.warn(`No consumables row found for character ${characterId}`);
		return;
	}

	const previousValue = row[key];
	row[key] = amount;

	await executeUpdate({
		key: `consumable-${characterId}-${key}`,
		operation: async () => {
			await dbUpdateConsumable(characterId, key, amount);
		},
		optimisticUpdate: () => {},
		rollback: () => {
			row[key] = previousValue;
		}
	});
}

/**
 * If you want to remove a character from memory, e.g. on signout.
 */
export function cleanupCharacter(characterId: number) {
	characterRecords.delete(characterId);
}


================================================================================
File: /Users/jluker/Vardon/src/lib/utils/updateQueue.svelte.ts
================================================================================
import { browser } from '$app/environment';

export type UpdateStatus = 'idle' | 'processing' | 'error' | 'offline';

export interface QueueUpdate {
	key: string;
	execute: () => Promise<void>;
	optimisticUpdate: () => void;
	rollback: () => void;
}

export class UpdateQueue {
	private status = $state<UpdateStatus>('idle');
	private pendingUpdates = $state(new Map<string, QueueUpdate>());

	constructor() {
		if (browser) {
			window.addEventListener('offline', () => {
				this.status = 'offline';
			});
			window.addEventListener('online', () => {
				this.status = 'idle';
			});
		}
	}

	async enqueue(update: QueueUpdate): Promise<void> {
		// Apply optimistic update immediately
		update.optimisticUpdate();

		// If there's a pending update for this key, clear it
		if (this.pendingUpdates.has(update.key)) {
			this.pendingUpdates.delete(update.key);
		}

		// Add update to pending queue
		this.pendingUpdates.set(update.key, update);

		this.status = 'processing';
		try {
			// Execute the update
			await update.execute();
			this.pendingUpdates.delete(update.key);
			if (this.pendingUpdates.size === 0) {
				this.status = 'idle';
			}
		} catch (error) {
			console.error('UpdateQueue error:', error);
			update.rollback();
			this.pendingUpdates.delete(update.key);
			this.status = 'error';
		}
	}
}

export const updateQueue = new UpdateQueue();


export interface StateUpdate<T> {
	key: string;
	characterId: number;
	previousValue: T;
	newValue: T;
	updateFn: (value: T) => Promise<void>;
	optimisticUpdate: (character: Character, value: T) => void;
}

export function createStateUpdate<T>({
	key,
	characterId,
	previousValue,
	newValue,
	updateFn,
	optimisticUpdate
}: StateUpdate<T>) {
	let character = $derived(getCharacter(characterId));
	return {
		key: `${key}-${characterId}`,
		execute: async () => await updateFn(newValue),
		optimisticUpdate: () => optimisticUpdate(character, newValue),
		rollback: () => optimisticUpdate(character, previousValue)
	};
}



export async function executeUpdate({
	key,
	operation,
	optimisticUpdate,
	rollback
}: {
	key: string;
	operation: () => Promise<void>;
	optimisticUpdate: () => void;
	rollback: () => void;
}) {
	await updateQueue.enqueue({
		key,
		execute: operation,
		optimisticUpdate,
		rollback
	});
}

export interface OptimisticUpdateConfig<T> {
	key: string;
	execute: () => Promise<T>;
	optimisticUpdate: () => void;
	rollback: () => void;
}

export function createOptimisticUpdate<T>({
	key,
	execute,
	optimisticUpdate,
	rollback
}: OptimisticUpdateConfig<T>) {
	return {
		key,
		execute,
		optimisticUpdate,
		rollback
	};
}


