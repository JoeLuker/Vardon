/******************************************************************************
 * FILE: src/lib/state/multiCharacterStore.ts
 *
 * A store for listing multiple CompleteCharacters. Example usage:
 *   - "Select your character" landing page
 *   - Possibly an admin or overview page
 *****************************************************************************/

import { writable } from 'svelte/store';
import { GameRulesAPI, type CompleteCharacter } from '$lib/db';
import { supabase } from '$lib/db/supabaseClient';

const rules = new GameRulesAPI(supabase);
const characterList = writable<CompleteCharacter[]>([]);
export { characterList };

let watchersInitialized = false;

/**
 * Load ALL characters from DB, storing them in `characterList`.
 */
export async function loadAllCharacters() {
	const characters = await rules.getAllGameCharacter();
	if (!characters) return;

	const characterIds = characters.map(char => char.id);
	const completeChars = await rules.getMultipleCompleteCharacterData(characterIds);
	characterList.set(completeChars.map(removeTimestamps));
}

/**
 * Initialize watchers for the character list.
 * You don't need to call this unless you want real-time updates on the list of characters.
 */
export function initMultiCharWatchers() {
	if (watchersInitialized) return;
	rules.watchGameCharacter(handleCharactersChange);
	watchersInitialized = true;
}

export function cleanupMultiCharWatchers() {
	if (!watchersInitialized) return;
	rules.stopWatchGameCharacter();
	watchersInitialized = false;
}

/** Recursively removes created_at and updated_at fields from an object */
function removeTimestamps<T>(obj: T): T {
	if (!obj || typeof obj !== 'object') {
		return obj;
	}

	if (Array.isArray(obj)) {
		return obj.map(removeTimestamps) as T;
	}

	const cleaned = { ...obj };
	delete (cleaned as any)['created_at'];
	delete (cleaned as any)['updated_at'];

	for (const key in cleaned) {
		if (cleaned[key] && typeof cleaned[key] === 'object') {
			cleaned[key] = removeTimestamps(cleaned[key]);
		}
	}

	return cleaned;
}

/** Called by watchers on insert/update. Do partial update if possible. */
async function handleCharactersChange(type: 'insert' | 'update' | 'delete', row: any) {
	if (type === 'delete') {
		characterList.update(list => list.filter(c => c.id !== row.id));
		return;
	}

	const newChar = await rules.getCompleteCharacterData(row.id);
	if (!newChar) return;

	const cleanedChar = removeTimestamps(newChar);

	characterList.update(list => {
		const idx = list.findIndex(c => c.id === row.id);
		if (idx >= 0) {
			list[idx] = cleanedChar;
			return list;
		} else {
			return [...list, cleanedChar];
		}
	});
}

/**
 * Example "optimistic" for multi-character changes, e.g. if you add a new character or remove.
 * Probably your landing page might just do a normal create or delete though.
 */
export async function createNewCharacter(_name: string) {
	// 1) optimistic: get old value
	let oldValue: CompleteCharacter[] = [];
	characterList.subscribe((value) => {
		oldValue = value;
	})();

	// 2) create row in DB
	try {
		// Suppose you have an API for creating a new character
		// or you just do something like: await gameCharacterApi.createRow({ name });
		// Then re-fetch the entire list or upsert the new result:
		await loadAllCharacters();
	} catch (err) {
		console.error('Failed to create character:', err);
		// revert if needed
		characterList.set(oldValue);
	}
}
