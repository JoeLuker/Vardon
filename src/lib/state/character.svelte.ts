// FILE: src/lib/state/character.svelte.ts
import { browser } from '$app/environment';

import type { Database } from '$lib/domain/types/supabase';
import type {
    AttributeKey,
    Character,
    ConsumableKey,
    DatabaseCharacterBuff,
    KnownBuffType,
    SkillRankSource
} from '$lib/domain/types/character';
import type { ABPBonusType } from '$lib/domain/types/abp';

import {
    dbSetupRealtimeSubscription,
    dbUpdateBombs,
    dbUpdateConsumable,
    dbUpdateAttribute,
    dbUpdateSkillRank,
    dbUpdateHP,
    dbUpdateSpellSlot,
    dbUpdateExtract,
    dbToggleBuff,
    dbUpdateABPBonus,
    dbFetchSkillData,
    dbFetchPartialCharacterData
    // ^^^ any other DB functions you moved to $lib/db/character.ts
} from '$lib/db/character';

import { createOptimisticUpdate, type OptimisticUpdateConfig } from '$lib/utils/optimisticUpdate';
import { updateQueue, type UpdateQueue } from '$lib/utils/updateQueue.svelte';

type Tables = Database['public']['Tables'];

interface CharacterState {
    data: Character;
    updateQueue: UpdateQueue;
    cleanup?: () => void;
}

const characterStates = $state(new Map<number, CharacterState>());

export function getCharacter(id: number): Character {
    const state = characterStates.get(id);
    return state?.data ?? createEmptyCharacter();
}

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
    } satisfies Character;
}

/**
 * Initialize local state for a character (already fetched) and set up real-time if in the browser.
 */
export function initializeCharacter(data: Tables['characters']['Row'] & Partial<Character>) {
    if (!data || !data.id) throw new Error('Valid character data is required');

    const fullCharacter = $state({
        ...createEmptyCharacter(),
        ...data,
        // Merge in any related arrays (these might come from a fully-hydrated fetch)
        base_skills: data.base_skills ?? [],
        character_skill_ranks: data.character_skill_ranks ?? [],
        class_skill_relations: data.class_skill_relations ?? [],
        character_attributes: data.character_attributes ?? [],
        character_buffs: data.character_buffs ?? [],
        character_combat_stats: data.character_combat_stats ?? [],
        character_consumables: data.character_consumables ?? [],
        character_spell_slots: data.character_spell_slots ?? [],
        character_known_spells: data.character_known_spells ?? [],
        character_class_features: data.character_class_features ?? [],
        character_discoveries: data.character_discoveries ?? [],
        character_equipment: data.character_equipment ?? [],
        character_feats: data.character_feats ?? [],
        character_extracts: data.character_extracts ?? [],
        character_favored_class_bonuses: data.character_favored_class_bonuses ?? [],
        character_traits: data.character_traits ?? [],
        character_abp_bonuses: data.character_abp_bonuses ?? [],
        character_corruption_manifestations: data.character_corruption_manifestations ?? [],
        character_corruptions: data.character_corruptions ?? [],
        character_ancestries: data.character_ancestries ?? [],
        character_ancestral_traits: data.character_ancestral_traits ?? []
    });

    const newState: CharacterState = {
        data: fullCharacter,
        updateQueue: updateQueue
    };

    characterStates.set(data.id, newState);

    // If in the browser, set up live subscription to reflect changes from the DB
    if (browser) {
        $effect(() => {
            const unsubscribe = dbSetupRealtimeSubscription(
                data.id,
                // onCharactersChange
                (payload) => {
                    Object.assign(fullCharacter, payload.new);
                },
                // onAttrChange
                (payload) => {
                    if (fullCharacter.character_attributes?.[0]) {
                        const updated = {
                            ...fullCharacter.character_attributes[0],
                            ...payload.new
                        };
                        fullCharacter.character_attributes = [updated];
                    }
                },
                // onCombatChange
                (payload) => {
                    if (fullCharacter.character_combat_stats?.[0]) {
                        const updatedStats = [...fullCharacter.character_combat_stats];
                        updatedStats[0] = { ...updatedStats[0], ...payload.new };
                        fullCharacter.character_combat_stats = updatedStats;
                    }
                },
                // onConsumablesChange
                (payload) => {
                    if (fullCharacter.character_consumables?.[0]) {
                        const updatedConsumables = [...fullCharacter.character_consumables];
                        updatedConsumables[0] = { ...updatedConsumables[0], ...payload.new };
                        fullCharacter.character_consumables = updatedConsumables;
                    }
                },
                // onBuffsChange
                (payload) => {
                    if (fullCharacter.character_buffs && payload.new && 'buff_type' in payload.new) {
                        const newBuff = payload.new as DatabaseCharacterBuff;
                        const buffs = fullCharacter.character_buffs.map((buff) =>
                            buff.buff_type === newBuff.buff_type
                                ? { ...newBuff, buff_type: newBuff.buff_type }
                                : buff
                        );
                        fullCharacter.character_buffs = buffs;
                    }
                }
            );
            return unsubscribe;
        });
    }

    return data.id;
}

/** Cleanup / remove a character from the store */
export function cleanupCharacter(characterId: number) {
    const state = characterStates.get(characterId);
    if (state?.cleanup) {
        state.cleanup();
    }
    characterStates.delete(characterId);
}

// ------------------- DB “Bridge” Functions That Call Our db/character.ts Functions -------------------

export async function updateBombs(characterId: number, bombs: number) {
    await dbUpdateBombs(characterId, bombs);
}

export async function updateConsumable(characterId: number, type: ConsumableKey, value: number) {
    await dbUpdateConsumable(characterId, type, value);
}

export async function updateAttribute(characterId: number, attr: AttributeKey, value: number) {
    await dbUpdateAttribute(characterId, attr, value);
}

export async function updateSkillRank(characterId: number, skillId: number, ranks: number) {
    await dbUpdateSkillRank(characterId, skillId, ranks);
}

export async function updateHP(characterId: number, newValue: number) {
    await dbUpdateHP(characterId, newValue);
}

export async function updateSpellSlot(characterId: number, level: number, remaining: number) {
    await dbUpdateSpellSlot(characterId, level, remaining);
}

export async function updateExtract(
    characterId: number,
    extractId: number,
    updates: Omit<Partial<Tables['character_extracts']['Row']>, 'id'>
) {
    await dbUpdateExtract(characterId, extractId, updates);
}

export async function toggleBuff(characterId: number, buffType: KnownBuffType, isActive: boolean) {
    await dbToggleBuff(characterId, buffType, isActive);
}

export async function updateABPBonus(
    characterId: number,
    bonusType: ABPBonusType,
    value: number,
    valueTarget?: string
) {
    await dbUpdateABPBonus(characterId, bonusType, value, valueTarget);
}

/** Provide an example of how we can fetch skill data, store it in local state, etc. */
export async function fetchSkillData(characterId: number) {
    const state = characterStates.get(characterId);
    if (!state) throw new Error(`No state found for character ${characterId}`);
    const characterClass = state.data.class;
    const { baseSkills, skillRanks, classSkillRelations } = await dbFetchSkillData(characterId, characterClass);

    state.data.base_skills = baseSkills;
    state.data.character_skill_ranks = skillRanks.map((rank) => ({
        ...rank,
        source: (rank.source || 'class') as SkillRankSource
    }));
    state.data.class_skill_relations = classSkillRelations;
}

export async function fetchCharacterData(characterId: number) {
    const state = characterStates.get(characterId);
    if (!state) throw new Error(`No state found for character ${characterId}`);

    await fetchSkillData(characterId);

    const { favoredClassBonuses, ancestryRows } = await dbFetchPartialCharacterData(characterId);

    state.data.character_favored_class_bonuses = favoredClassBonuses ?? [];
    state.data.character_ancestries = ancestryRows.map((row) => {
        let fixedAncestry = undefined;
        if (row.ancestry) {
            fixedAncestry = {
                ...row.ancestry,
                ability_modifiers: row.ancestry.ability_modifiers as Record<string, number>
            };
        }
        return {
            ...row,
            ancestry: fixedAncestry
        };
    });
}

// ------------------- UTILITY -------------------

export function isClassSkill(characterId: number, skillId: number): boolean {
    const state = characterStates.get(characterId);
    return state?.data.class_skill_relations?.some((r) => r.skill_id === skillId) ?? false;
}

export function getSkillRanks(characterId: number, skillId: number): number {
    const state = characterStates.get(characterId);
    return state?.data.character_skill_ranks?.find((s) => s.skill_id === skillId)?.ranks ?? 0;
}

export function enqueueCharacterUpdate<T>({
    characterId,
    key,
    execute,
    optimisticUpdate,
    rollback
}: OptimisticUpdateConfig<T> & { characterId: number }) {
    const state = characterStates.get(characterId);
    if (!state) throw new Error(`No state found for character ${characterId}`);

    return state.updateQueue.enqueue(
        createOptimisticUpdate({
            key,
            execute,
            optimisticUpdate,
            rollback
        })
    );
}

// ------------------- REACTIVITY-HELPER OPTIMISTIC FUNCTIONS -------------------

export function optimisticToggleBuff(
    characterId: number,
    buffName: KnownBuffType,
    isActive: boolean
) {
    const state = characterStates.get(characterId);
    if (!state) return;

    const buffs = (state.data.character_buffs ?? []).map((buff) => ({
        ...buff,
        is_active: buff.buff_type === buffName ? isActive : buff.is_active
    }));
    state.data.character_buffs = buffs;
}

export function rollbackToggleBuff(
    characterId: number,
    buffName: KnownBuffType,
    previousActive: boolean
) {
    const state = characterStates.get(characterId);
    if (!state) return;

    const buffs = (state.data.character_buffs ?? []).map((buff) =>
        buff.buff_type === buffName ? { ...buff, is_active: previousActive } : buff
    );
    state.data.character_buffs = buffs;
}

export function optimisticUpdateBombs(characterId: number, newValue: number) {
    const state = characterStates.get(characterId);
    if (!state) return;

    if (state.data.character_combat_stats?.[0]) {
        const updatedStats = [...state.data.character_combat_stats];
        updatedStats[0] = { ...updatedStats[0], bombs_left: newValue };
        state.data.character_combat_stats = updatedStats;
    }
}

export function rollbackUpdateBombs(characterId: number, previousValue: number) {
    const state = characterStates.get(characterId);
    if (!state) return;

    if (state.data.character_combat_stats?.[0]) {
        const updatedStats = [...state.data.character_combat_stats];
        updatedStats[0] = { ...updatedStats[0], bombs_left: previousValue };
        state.data.character_combat_stats = updatedStats;
    }
}
