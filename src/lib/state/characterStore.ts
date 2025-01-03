/******************************************************************************
 * FILE: src/lib/state/characterStore.ts
 *****************************************************************************/

import { writable, get } from 'svelte/store';
import { charactersApi } from '$lib/db/characters';
import {
  characterRpgEntitiesApi,
  characterRpgEntityPropsApi,
  characterSkillRanksApi,
} from '$lib/db/bridging';
import {
  getCompleteCharacter,
  type CompleteCharacter
} from '$lib/db/getCompleteCharacter';

// Our store: a single "active" character
export const characterStore = writable<CompleteCharacter | null>(null);

// Track watchers so we only init once
let watchersInitialized = false;

/** 
 * localChanges: Tracks fields where our local store has made changes 
 * that may not be reflected in the DB yet.
 * 
 * Example: { current_hp: 25, max_hp: 40 }
 * 
 * Once we see the DB's data match these values, we remove them from localChanges.
 */
const localChanges: Record<string, unknown> = {};

/**
 * loadCharacter(charId)
 * 
 * Fetch from DB, but preserve localChanges if the DB is stale for those fields.
 */
export async function loadCharacter(charId: number) {
  try {
    const fetched = await getCompleteCharacter(charId);
    if (!fetched) {
      characterStore.set(null);
      return;
    }

    // Compare the fetched data to localChanges
    const newCharacter = reconcileLocalChanges(fetched.character);

    // Rebuild the final state
    const newComplete: CompleteCharacter = {
      ...fetched,
      character: newCharacter
    };

    characterStore.set(newComplete);
  } catch (err) {
    console.error(`Failed to load character #${charId}`, err);
    characterStore.set(null);
    throw err;
  }
}

/**
 * reconcileLocalChanges(dbCharacter)
 * 
 * For each field in localChanges, if dbCharacter[field] differs from localChanges[field],
 * we overwrite dbCharacter[field] with localChanges[field], because we consider our
 * local version the truth (we have updated it, but the DB might not have caught up).
 * 
 * If they match, it means the DB is now in sync, so we can clear that entry from localChanges.
 */
function reconcileLocalChanges(dbCharacter: CompleteCharacter['character']) {
  const newChar = { ...dbCharacter };

  for (const [field, localValue] of Object.entries(localChanges)) {
    // Type assertion for dynamic access
    const dbValue = (dbCharacter as any)[field];
    if (localValue !== dbValue) {
      (newChar as any)[field] = localValue;
    } else {
      delete localChanges[field];
    }
  }

  return newChar;
}

/**
 * initCharacterWatchers()
 * 
 * Watch the characters table + bridging. If there's a change, we reload.
 * But that reload won't clobber local changes due to reconcileLocalChanges.
 */
export function initCharacterWatchers() {
  if (watchersInitialized) return;

  charactersApi.startWatch(handleCharacterTableChange);
  characterRpgEntitiesApi.startWatch(handleBridgingChange);
  characterRpgEntityPropsApi.startWatch(handleBridgingChange);
  characterSkillRanksApi.startWatch(handleBridgingChange);

  watchersInitialized = true;
}

export function cleanupCharacterWatchers() {
  if (!watchersInitialized) return;

  charactersApi.stopWatch();
  characterRpgEntitiesApi.stopWatch();
  characterRpgEntityPropsApi.stopWatch();
  characterSkillRanksApi.stopWatch();

  watchersInitialized = false;
}

/**
 * handleCharacterTableChange(type, row)
 */
async function handleCharacterTableChange(
  _type: 'insert' | 'update' | 'delete',  // Prefix with _ to indicate intentionally unused
  row: any
) {
  const current = get(characterStore);
  if (!current) return;

  if (row?.id !== current.character.id) return;

  if (_type === 'delete') {
    characterStore.set(null);
  } else {
    await loadCharacter(current.character.id);
  }
}

/**
 * handleBridgingChange(type, row)
 */
async function handleBridgingChange(
  _type: 'insert' | 'update' | 'delete',
  row: any
) {
  const current = get(characterStore);
  if (!current) return;

  if (row?.character_id !== current.character.id) return;

  // re-fetch
  await loadCharacter(current.character.id);
}

/**
 * updateCharacterOptimistically(changes)
 * 
 * Example for optimistic updates. 
 * 1) Merge changes into store
 * 2) Save changes in localChanges
 * 3) Attempt DB update
 */
export async function updateCharacterOptimistically(
  changes: Partial<CompleteCharacter['character']>
) {
  const oldState = get(characterStore);
  if (!oldState) return;

  // 1) new local store
  const newCharacter = { ...oldState.character };

  // For each field changed, update store and also localChanges
  for (const [field, value] of Object.entries(changes)) {
    (newCharacter as any)[field] = value;
    (localChanges as any)[field] = value; // track as local
  }

  // 2) set store
  characterStore.set({
    ...oldState,
    character: newCharacter
  });

  // 3) DB update
  try {
    const payload = {
      ...newCharacter,
      id: oldState.character.id
    };
    await charactersApi.updateRow(payload);
    // watchers trigger, loadCharacter => reconcileLocalChanges => removes local changes if matched
  } catch (err) {
    console.error('Optimistic update failed, revert store:', err);
    characterStore.set(oldState);
    // Optionally revert localChanges for those fields
    for (const field of Object.keys(changes)) {
      delete localChanges[field];
    }
  }
}

/**
 * queueCharacterUpdate() – if you still want debouncing
 */
let updateTimer: ReturnType<typeof setTimeout> | null = null;
let pendingChanges: Partial<CompleteCharacter['character']> = {};
const DEBOUNCE_MS = 400;

export function queueCharacterUpdate(changes: Partial<CompleteCharacter['character']>) {
  // merges into pendingChanges
  pendingChanges = { ...pendingChanges, ...changes };

  // apply optimistically to store & localChanges
  applyOptimisticChanges(changes);

  if (updateTimer) clearTimeout(updateTimer);
  updateTimer = setTimeout(flushPending, DEBOUNCE_MS);
}

function applyOptimisticChanges(changes: Partial<CompleteCharacter['character']>) {
  const oldState = get(characterStore);
  if (!oldState) return;

  const newCharacter = { ...oldState.character };

  for (const [field, value] of Object.entries(changes)) {
    (newCharacter as any)[field] = value;
    localChanges[field] = value;
  }

  characterStore.set({
    ...oldState,
    character: newCharacter
  });
}

async function flushPending() {
  const current = get(characterStore);
  if (!current) return;

  const changes = { ...pendingChanges };
  pendingChanges = {};

  const payload = {
    ...changes,
    id: current.character.id
  };

  try {
    await charactersApi.updateRow(payload);
  } catch (err) {
    console.error('Failed to flush queued changes:', err);
  }
}

/**
 * Example convenience function for HP
 */
export function updateHP(charId: number, newHP: number) {
  const state = get(characterStore);
  if (!state || state.character.id !== charId) return;
  // Here we do a simple queued approach:
  queueCharacterUpdate({ current_hp: newHP });
}
