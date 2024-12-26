// src/lib/utils/stateManager.ts
import type { Character } from '$lib/domain/types/character';
import { getCharacter } from '$lib/state/character.svelte';

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