/******************************************************************************
 * FILE: src/lib/state/multiCharacterStore.ts
 *
 * A store for listing multiple CompleteCharacters. Example usage:
 *   - "Select your character" landing page
 *   - Possibly an admin or overview page
 *****************************************************************************/

import { writable } from 'svelte/store';
import { gameCharacterApi } from '$lib/db';
import { getCompleteCharacter, type CompleteCharacter } from '$lib/db/getCompleteCharacter';

/** Holds an array of loaded characters. */
const characterList = writable<CompleteCharacter[]>([]);
export { characterList };

let watchersInitialized = false;

/**
 * Load ALL characters from DB, storing them in `characterList`.
 */
export async function loadAllCharacters() {
	const rawRows = await gameCharacterApi.getAllRows(); // raw from DB
	const tasks = rawRows.map((row) => getCompleteCharacter(row.id));
	const fetched = await Promise.all(tasks);

	// filter out null
	const results = fetched.filter(Boolean) as CompleteCharacter[];
	characterList.set(results);
}

/**
 * Initialize watchers for the character list.
 * You don't need to call this unless you want real-time updates on the list of characters.
 */
export function initMultiCharWatchers() {
	if (watchersInitialized) return;

	// Watch `characters` table
	gameCharacterApi.startWatch(handleCharactersChange);
	watchersInitialized = true;
}

export function cleanupMultiCharWatchers() {
	if (!watchersInitialized) return;
	gameCharacterApi.stopWatch();
	watchersInitialized = false;
}

/** Called by watchers on insert/update. Do partial update if possible. */
async function handleCharactersChange(type: 'insert' | 'update' | 'delete', row: any) {
	if (type === 'delete') {
		characterList.update(list => list.filter(c => c.id !== row.id));
		return;
	}

	if (type === 'update') {
		characterList.update(list => {
			const idx = list.findIndex(c => c.id === row.id);
			if (idx >= 0) {
				// Patch just the main fields that can change
				list[idx] = {
					...list[idx],
					name: row.name,
					label: row.label,
					current_hp: row.current_hp,
					max_hp: row.max_hp
				};
			}
			return list;
		});
		return;
	}

	// For inserts or if update failed, fetch the whole character
	const newChar = await getCompleteCharacter(row.id);
	if (newChar) {
		characterList.update(list => [...list, newChar]);
	}
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
