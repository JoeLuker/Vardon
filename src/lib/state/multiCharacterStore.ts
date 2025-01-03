/******************************************************************************
 * FILE: src/lib/state/multiCharacterStore.ts
 *
 * A store for listing multiple CompleteCharacters. Example usage:
 *   - "Select your character" landing page
 *   - Possibly an admin or overview page
 *****************************************************************************/

import { writable, get } from 'svelte/store';
import { charactersApi } from '$lib/db/characters'; 
// bridging watchers optional if you want them to auto-update list 
import { characterRpgEntitiesApi, characterRpgEntityPropsApi, characterSkillRanksApi } from '$lib/db/bridging';

import { getCompleteCharacter, type CompleteCharacter } from '$lib/db/getCompleteCharacter';

/** Holds an array of loaded characters. */
export const characterList = writable<CompleteCharacter[]>([]);

let watchersInitialized = false;

/**
 * Load ALL characters from DB, storing them in `characterList`.
 */
export async function loadAllCharacters() {
  const rawRows = await charactersApi.getAllRows(); // raw from DB
  const tasks = rawRows.map((row) => getCompleteCharacter(row.id));
  const fetched = await Promise.all(tasks);

  // filter out null
  const results = fetched.filter(Boolean) as CompleteCharacter[];
  characterList.set(results);
}

/**
 * Optional: Start watchers so that if changes happen in the DB,
 * we re-fetch the entire list. Probably not necessary for a "landing page" 
 * unless you want real-time updates on the list of characters.
 */
export function initMultiCharWatchers() {
  if (watchersInitialized) return;

  // Watch `characters` table
  charactersApi.startWatch(handleCharactersChange);

  // Watch bridging if you truly want real-time updates to the *list*:
  characterRpgEntitiesApi.startWatch(handleBridgingChange);
  characterRpgEntityPropsApi.startWatch(handleBridgingChange);
  characterSkillRanksApi.startWatch(handleBridgingChange);
  // ... more bridging watchers if needed

  watchersInitialized = true;
}
export function cleanupMultiCharWatchers() {
  if (!watchersInitialized) return;

  charactersApi.stopWatch();
  characterRpgEntitiesApi.stopWatch();
  characterRpgEntityPropsApi.stopWatch();
  characterSkillRanksApi.stopWatch();
  watchersInitialized = false;
}

/** Called by watchers on insert/update. Re-fetch entire list. */
async function handleCharactersChange(type: 'insert'|'update'|'delete', row: any) {
  // The simplest approach: re-fetch entire list. If your data is large, 
  // you might do a partial approach. But for short lists, this is fine.
  await loadAllCharacters();
}

/** Similarly bridging changes might also alter the "complete" data of each char. */
async function handleBridgingChange(type: 'insert'|'update'|'delete', row: any) {
  await loadAllCharacters();
}

/**
 * Example "optimistic" for multi-character changes, e.g. if you add a new character or remove.
 * Probably your landing page might just do a normal create or delete though.
 */
export async function createNewCharacter(name: string) {
  // 1) optimistic: get old array
  const old = get(characterList);

  // 2) create row in DB
  try {
    // Suppose you have an API for creating a new character
    // or you just do something like: await charactersApi.createRow({ name });
    // Then re-fetch the entire list or upsert the new result:
    await loadAllCharacters();
  } catch (err) {
    console.error('Failed to create character:', err);
    // revert if needed
    characterList.set(old);
  }
}
