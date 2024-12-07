// src/lib/state/character.svelte.ts
import { browser } from '$app/environment';
import { supabase } from '$lib/supabaseClient';
import type { Database } from '$lib/types/supabase';
import type { AttributeKey, Character, CharacterBuff, ConsumableKey, DatabaseCharacterAncestry, DatabaseCharacterBuff, KnownBuffType, SkillRankSource } from '$lib/types/character';
import { createOptimisticUpdate, type OptimisticUpdateConfig } from '$lib/utils/optimisticUpdate';
import { updateQueue, type UpdateQueue } from '$lib/utils/updateQueue.svelte';
import type { ABPBonusType } from '$lib/types/abp';

type Tables = Database['public']['Tables'];

interface CharacterState {
    data: Character;
    updateQueue: UpdateQueue;
    cleanup?: () => void;
}

// Store of all character instances using $state rune
const characterStates = $state(new Map<number, CharacterState>());

// Modify the existing getCharacter export to be more defensive
// Instead of returning $derived directly, we should return the state data
function getCharacter(id: number): Character {
    const state = characterStates.get(id);
    return state?.data ?? createEmptyCharacter();
}
// Initialize empty character data
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
        character_ancestral_traits: []
    } satisfies Character;
}

// Initialize or update character state with $effect for subscriptions
function initializeCharacter(data: Tables['characters']['Row'] & Partial<Character>) {
    if (!data || !data.id) throw new Error('Valid character data is required');
    
    const fullCharacter = $state({
        ...createEmptyCharacter(),
        ...data,
        // Ensure all arrays are initialized
        base_skills: data.base_skills || [],
        character_skill_ranks: data.character_skill_ranks || [],
        class_skill_relations: data.class_skill_relations || [],
        character_attributes: data.character_attributes || [],
        character_buffs: data.character_buffs || [],
        character_combat_stats: data.character_combat_stats || [],
        character_consumables: data.character_consumables || [],
        character_spell_slots: data.character_spell_slots || [],
        character_known_spells: data.character_known_spells || [],
        character_class_features: data.character_class_features || [],
        character_discoveries: data.character_discoveries || [],
        character_equipment: data.character_equipment || [],
        character_feats: data.character_feats || [],
        character_extracts: data.character_extracts || [],
        character_favored_class_bonuses: data.character_favored_class_bonuses || [],
        character_traits: data.character_traits || [],
        character_abp_bonuses: data.character_abp_bonuses || [],
        character_corruption_manifestations: data.character_corruption_manifestations || [],
        character_corruptions: data.character_corruptions || [],
        character_ancestries: data.character_ancestries || [],
        character_ancestral_traits: data.character_ancestral_traits || []
    });

    const newState: CharacterState = {
        data: fullCharacter,
        updateQueue: updateQueue,
    };
    
    characterStates.set(data.id, newState);
    
    if (browser) {
        $effect(() => {
            const cleanup = setupRealtimeSubscription(data.id);
            return cleanup;
        });
    }
    
    return data.id;
}

// Core update functions
async function updateBombs(characterId: number, bombs: number) {
    const { error } = await supabase
        .from('character_combat_stats')
        .update({ bombs_left: bombs })
        .eq('character_id', characterId);
    
    if (error) throw error;
}

async function updateConsumable(characterId: number, type: ConsumableKey, value: number) {
    const { error } = await supabase
        .from('character_consumables')
        .update({ [type]: value })
        .eq('character_id', characterId);
    
    if (error) throw error;
}

async function updateAttribute(characterId: number, attr: AttributeKey, value: number) {
    const { error } = await supabase
        .from('character_attributes')
        .update({ [attr]: value })
        .eq('character_id', characterId);
    
    if (error) throw error;
}

async function updateSkillRank(characterId: number, skillId: number, ranks: number) {
    const { error } = await supabase
        .from('character_skill_ranks')
        .update({ ranks })
        .eq('character_id', characterId)
        .eq('skill_id', skillId);
    
    if (error) throw error;
}

async function updateHP(characterId: number, newValue: number) {
    const { error } = await supabase
        .from('characters')
        .update({ current_hp: newValue })
        .eq('id', characterId);
    
    if (error) throw error;
}

async function updateSpellSlot(characterId: number, level: number, remaining: number) {
    const { error } = await supabase
        .from('character_spell_slots')
        .update({ remaining })
        .eq('character_id', characterId)
        .eq('spell_level', level);
    
    if (error) throw error;
}

async function updateExtract(characterId: number, extractId: number, updates: Omit<Partial<Tables['character_extracts']['Row']>, 'id'>) {
    const { error } = await supabase
        .from('character_extracts')
        .update({
            ...updates,
            prepared: updates.prepared ?? 0,
            used: updates.used ?? 0,
            updated_at: new Date().toISOString()
        })
        .eq('id', extractId)
        .eq('character_id', characterId);
    
    if (error) throw error;
}

// Helper functions using derived state
function isClassSkill(characterId: number, skillId: number): boolean {
    const state = characterStates.get(characterId);
    return state?.data.class_skill_relations?.some(
        relation => relation.skill_id === skillId
    ) ?? false;
}

function getSkillRanks(characterId: number, skillId: number): number {
    const state = characterStates.get(characterId);
    return state?.data.character_skill_ranks?.find(
        rank => rank.skill_id === skillId
    )?.ranks ?? 0;
}

// Update functions using $effect for optimistic updates
function enqueueCharacterUpdate<T>({ 
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

// Realtime subscription setup using $effect
function setupRealtimeSubscription(characterId: number) {
    const state = characterStates.get(characterId);
    if (!state) throw new Error(`No state found for character ${characterId}`);
    
    const channel = supabase
        .channel(`character-${characterId}`)
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public',
            table: 'characters',
            filter: `id=eq.${characterId}`
        }, (payload) => {
            Object.assign(state.data, payload.new);
        })
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'character_attributes',
            filter: `character_id=eq.${characterId}`
        }, (payload) => {
            if (state.data.character_attributes?.[0]) {
                Object.assign(state.data.character_attributes[0], payload.new);
            }
        })
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'character_combat_stats',
            filter: `character_id=eq.${characterId}`
        }, (payload) => {
            if (state.data.character_combat_stats?.[0]) {
                Object.assign(state.data.character_combat_stats[0], payload.new);
            }
        })
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'character_consumables',
            filter: `character_id=eq.${characterId}`
        }, (payload) => {
            if (state.data.character_consumables?.[0]) {
                Object.assign(state.data.character_consumables[0], payload.new);
            }
        })
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'character_buffs',
            filter: `character_id=eq.${characterId}`
        }, (payload) => {
            if (state.data.character_buffs && payload.new && 'buff_type' in payload.new) {
                const newBuff = payload.new as DatabaseCharacterBuff;
                state.data.character_buffs = [...state.data.character_buffs.map(buff => 
                    buff.buff_type === newBuff.buff_type
                        ? { ...newBuff, buff_type: newBuff.buff_type } as CharacterBuff
                        : buff
                )];
            }
        })
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

async function fetchSkillData(characterId: number) {
    const state = characterStates.get(characterId);
    if (!state) throw new Error(`No state found for character ${characterId}`);
    if (!state.data.class) {
        throw new Error('Character class is required');
    }

    const [baseSkillsResult, skillRanksResult, classSkillsResult] = await Promise.all([
        supabase.from('base_skills').select('*'),
        supabase.from('character_skill_ranks').select('*').eq('character_id', characterId),
        supabase.from('class_skill_relations').select('*').eq('class_name', state.data.class)
    ]);

    if (baseSkillsResult.error) throw baseSkillsResult.error;
    if (skillRanksResult.error) throw skillRanksResult.error;
    if (classSkillsResult.error) throw classSkillsResult.error;

    state.data.base_skills = baseSkillsResult.data;
    state.data.character_skill_ranks = skillRanksResult.data.map(rank => ({
        ...rank,
        source: (rank.source || 'class') as SkillRankSource
    }));
    state.data.class_skill_relations = classSkillsResult.data;
}

// Data fetching with $effect
async function fetchCharacterData(characterId: number) {
    const state = characterStates.get(characterId);
    if (!state) throw new Error(`No state found for character ${characterId}`);
    
    await fetchSkillData(characterId);
    
    const [fcbResult, ancestryResult] = await Promise.all([
        supabase
            .from('character_favored_class_bonuses')
            .select('*')
            .eq('character_id', characterId),
        supabase
            .from('character_ancestries')
            .select(`
                *,
                ancestry:base_ancestries!inner (
                    id,
                    name,
                    size,
                    base_speed,
                    ability_modifiers,
                    description
                )
            `)
            .eq('character_id', characterId)
    ]);

    if (fcbResult.error) throw fcbResult.error;
    if (ancestryResult.error) throw ancestryResult.error;

    state.data.character_favored_class_bonuses = fcbResult.data;
    state.data.character_ancestries = ancestryResult.data.map(row => ({
        ...row,
        ancestry: row.ancestry || null
    })) as DatabaseCharacterAncestry[];
}

async function toggleBuff(characterId: number, buffType: KnownBuffType, isActive: boolean) {
    const { error } = await supabase
        .from('character_buffs')
        .update({ is_active: isActive })
        .eq('character_id', characterId)
        .eq('buff_type', buffType);
    
    if (error) throw error;
}

async function updateABPBonus(
    characterId: number,
    bonusType: ABPBonusType,
    value: number,
    valueTarget?: string
) {
    const { error } = await supabase
        .from('character_abp_bonuses')
        .update({ 
            value,
            value_target: valueTarget 
        })
        .eq('character_id', characterId)
        .eq('bonus_type', bonusType);

    if (error) throw error;
}

// Cleanup function
function cleanupCharacter(characterId: number) {
    const state = characterStates.get(characterId);
    if (state?.cleanup) {
        state.cleanup();
    }
    characterStates.delete(characterId);
}

// Export everything
export {
    initializeCharacter,
    cleanupCharacter,
    updateBombs,
    updateConsumable,
    updateAttribute,
    updateSkillRank,
    updateHP,
    updateSpellSlot,
    updateExtract,
    updateABPBonus,
    fetchSkillData,
    fetchCharacterData,
    isClassSkill,
    getSkillRanks,
    toggleBuff,
    enqueueCharacterUpdate,
    getCharacter
};

export type { CharacterState };