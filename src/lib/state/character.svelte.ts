// src/lib/state/character.svelte.ts
import { browser } from '$app/environment';
import { supabase } from '$lib/supabaseClient';
import type { 
    Character, 
    AttributeKey, 
    ConsumableKey,
    CharacterBuff,
    SpellSlot,
    KnownSpell,
    CharacterDiscovery,
    CharacterClassFeature,
    CharacterFeat,
    CharacterExtract,
    BaseSkill,
    CharacterSkillRank,
    ClassSkillRelation
} from '$lib/types/character';

import { updateQueue } from '$lib/utils/updateQueue.svelte';
import { createOptimisticUpdate, type OptimisticUpdateConfig } from '$lib/utils/optimisticUpdate';

// Single source of truth for character data
const character = $state<Character & {
    base_skills?: BaseSkill[];
    character_skill_ranks?: CharacterSkillRank[];
    class_skill_relations?: ClassSkillRelation[];
}>({} as Character);

// Core update functions
async function updateBombs(bombs: number) {
    const { error } = await supabase
        .from('character_combat_stats')
        .update({ bombs_left: bombs })
        .eq('character_id', character.id);
    
    if (error) throw error;
}

async function updateConsumable(type: ConsumableKey, value: number) {
    const { error } = await supabase
        .from('character_consumables')
        .update({ [type]: value })
        .eq('character_id', character.id);
    
    if (error) throw error;
}

async function updateAttribute(attr: AttributeKey, value: number) {
    const { error } = await supabase
        .from('character_attributes')
        .update({ [attr]: value })
        .eq('character_id', character.id);
    
    if (error) throw error;
}

async function updateSkillRank(skillId: number, ranks: number) {
    const { error } = await supabase
        .from('character_skill_ranks')
        .update({ ranks })
        .eq('character_id', character.id)
        .eq('skill_id', skillId);
    
    if (error) throw error;
}

async function updateHP(newValue: number) {
    const { error } = await supabase
        .from('characters')
        .update({ current_hp: newValue })
        .eq('id', character.id);
    
    if (error) throw error;
}

async function updateSpellSlot(level: number, remaining: number) {
    const { error } = await supabase
        .from('character_spell_slots')
        .update({ remaining })
        .eq('character_id', character.id)
        .eq('spell_level', level);
    
    if (error) throw error;
}

async function updateExtract(extractId: number, updates: Omit<Partial<CharacterExtract>, 'id'>) {
    const { error } = await supabase
        .from('character_extracts')
        .update({
            ...updates,
            prepared: typeof updates.prepared === 'number' ? updates.prepared : 0,
            used: typeof updates.used === 'number' ? updates.used : 0,
            updated_at: new Date().toISOString()
        })
        .eq('id', extractId);
    
    if (error) throw error;
}

function initializeCharacter(data: Character) {
    if (!data) {
        throw new Error('Character data is required');
    }
    
    // Ensure we're copying all the skill-related data with default empty arrays
    Object.assign(character, {
        ...data,
        base_skills: data.base_skills || [],
        character_skill_ranks: data.character_skill_ranks || [],
        class_skill_relations: data.class_skill_relations || []
    });
    
    if (browser) {
        return setupRealtimeSubscription(data.id);
    }
}

// Enhanced real-time subscription helper
function setupRealtimeSubscription(characterId: number) {
    const channel = supabase.channel(`character-${characterId}`)
        // Main character table
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public',
            table: 'characters',
            filter: `id=eq.${characterId}`
        }, (payload) => {
            Object.assign(character, payload.new);
        })
        // Attributes
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'character_attributes',
            filter: `character_id=eq.${characterId}`
        }, (payload) => {
            if (character.character_attributes?.[0]) {
                Object.assign(character.character_attributes[0], payload.new);
            }
        })
        // Combat stats
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'character_combat_stats',
            filter: `character_id=eq.${characterId}`
        }, (payload) => {
            if (character.character_combat_stats?.[0]) {
                Object.assign(character.character_combat_stats[0], payload.new);
            }
        })
        // Consumables
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'character_consumables',
            filter: `character_id=eq.${characterId}`
        }, (payload) => {
            if (character.character_consumables?.[0]) {
                Object.assign(character.character_consumables[0], payload.new);
            }
        })
        // Buffs
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'character_buffs',
            filter: `character_id=eq.${characterId}`
        }, (payload) => {
            if (character.character_buffs) {
                const index = character.character_buffs.findIndex(
                    b => b.buff_type === (payload.new as CharacterBuff).buff_type
                );
                if (index >= 0) {
                    character.character_buffs[index] = payload.new as CharacterBuff;
                }
            }
        })
        // Skills
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'base_skills',
        }, (payload) => {
            if (character.base_skills) {
                const index = character.base_skills.findIndex(
                    s => s.id === (payload.new as BaseSkill).id
                );
                if (index >= 0) {
                    character.base_skills[index] = payload.new as BaseSkill;
                }
            }
        })
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'character_skill_ranks',
            filter: `character_id=eq.${characterId}`
        }, (payload) => {
            if (character.character_skill_ranks) {
                const index = character.character_skill_ranks.findIndex(
                    s => s.skill_id === (payload.new as CharacterSkillRank).skill_id
                );
                if (index >= 0) {
                    character.character_skill_ranks[index] = payload.new as CharacterSkillRank;
                }
            }
        })
        // Spell slots
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'character_spell_slots',
            filter: `character_id=eq.${characterId}`
        }, (payload) => {
            if (character.character_spell_slots) {
                const index = character.character_spell_slots.findIndex(
                    s => s.spell_level === (payload.new as SpellSlot).spell_level
                );
                if (index >= 0) {
                    character.character_spell_slots[index] = payload.new as SpellSlot;
                }
            }
        })
        // Known spells
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'character_known_spells',
            filter: `character_id=eq.${characterId}`
        }, (payload) => {
            if (character.character_known_spells) {
                const index = character.character_known_spells.findIndex(
                    s => s.spell_name === (payload.new as KnownSpell).spell_name
                );
                if (index >= 0) {
                    character.character_known_spells[index] = payload.new as KnownSpell;
                }
            }
        })
        // Class features
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'character_class_features',
            filter: `character_id=eq.${characterId}`
        }, (payload) => {
            if (character.character_class_features) {
                const index = character.character_class_features.findIndex(
                    f => f.feature_name === (payload.new as CharacterClassFeature).feature_name
                );
                if (index >= 0) {
                    character.character_class_features[index] = payload.new as CharacterClassFeature;
                }
            }
        })
        // Discoveries
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'character_discoveries',
            filter: `character_id=eq.${characterId}`
        }, (payload) => {
            if (character.character_discoveries) {
                const index = character.character_discoveries.findIndex(
                    d => d.discovery_name === (payload.new as CharacterDiscovery).discovery_name
                );
                if (index >= 0) {
                    character.character_discoveries[index] = payload.new as CharacterDiscovery;
                }
            }
        })
        // Feats
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'character_feats',
            filter: `character_id=eq.${characterId}`
        }, (payload) => {
            if (character.character_feats) {
                const index = character.character_feats.findIndex(
                    f => f.feat_name === (payload.new as CharacterFeat).feat_name
                );
                if (index >= 0) {
                    character.character_feats[index] = payload.new as CharacterFeat;
                }
            }
        })
        // Add new skill-related subscriptions
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'class_skill_relations',
            filter: `class_name=eq.${character.class}`
        }, (payload) => {
            if (character.class_skill_relations) {
                switch (payload.eventType) {
                    case 'INSERT':
                        character.class_skill_relations.push(payload.new as ClassSkillRelation);
                        break;
                    case 'UPDATE':
                        const updateIndex = character.class_skill_relations.findIndex(
                            relation => relation.id === (payload.new as ClassSkillRelation).id
                        );
                        if (updateIndex >= 0) {
                            character.class_skill_relations[updateIndex] = payload.new as ClassSkillRelation;
                        }
                        break;
                    case 'DELETE':
                        const deleteIndex = character.class_skill_relations.findIndex(
                            relation => relation.id === (payload.old as ClassSkillRelation).id
                        );
                        if (deleteIndex >= 0) {
                            character.class_skill_relations.splice(deleteIndex, 1);
                        }
                        break;
                }
            }
        })
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}
// Add this helper function
export async function enqueueCharacterUpdate<T>({ 
    key, 
    execute, 
    optimisticUpdate, 
    rollback 
}: OptimisticUpdateConfig<T>) {
    return updateQueue.enqueue(
        createOptimisticUpdate({
            key,
            execute,
            optimisticUpdate,
            rollback
        })
    );
}

// Add new skill data fetching function
async function fetchSkillData(characterId: number) {
    const [baseSkillsResult, skillRanksResult, classSkillsResult] = await Promise.all([
        supabase.from('base_skills').select('*'),
        supabase.from('character_skill_ranks').select('*').eq('character_id', characterId),
        supabase.from('class_skill_relations').select('*').eq('class_name', character.class)
    ]);

    if (baseSkillsResult.error) throw baseSkillsResult.error;
    if (skillRanksResult.error) throw skillRanksResult.error;
    if (classSkillsResult.error) throw classSkillsResult.error;

    character.base_skills = baseSkillsResult.data;
    character.character_skill_ranks = skillRanksResult.data;
    character.class_skill_relations = classSkillsResult.data;
}

// Add helper functions
function isClassSkill(skillId: number): boolean {
    return character.class_skill_relations?.some(
        relation => relation.skill_id === skillId
    ) ?? false;
}

function getSkillRanks(skillId: number): number {
    return character.character_skill_ranks?.find(
        rank => rank.skill_id === skillId
    )?.ranks ?? 0;
}

// Add this function before the exports
async function toggleBuff(buffType: string, isActive: boolean) {
    const { error } = await supabase
        .from('character_buffs')
        .update({ is_active: isActive })
        .eq('character_id', character.id)
        .eq('buff_type', buffType);
    
    if (error) throw error;
}

// Export only what's necessary
export { 
    character,
    updateBombs,
    updateConsumable,
    updateAttribute,
    updateSkillRank,
    updateHP,
    updateSpellSlot,
    initializeCharacter,
    updateExtract,
    fetchSkillData,
    isClassSkill,
    getSkillRanks,
    toggleBuff
};