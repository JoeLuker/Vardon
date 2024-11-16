// src/lib/state/character.svelte.ts
import { browser } from '$app/environment';
import { supabase } from '$lib/supabaseClient';
import type { Database } from '$lib/types/supabase';
import type { 
    Character,
    CharacterBuff,
    CharacterSkillRank,
    DatabaseBaseSkill,
    DatabaseCharacterAttribute,
    DatabaseCharacterAbpBonus,
    DatabaseCharacterClassFeature,
    DatabaseCharacterCombatStats,
    DatabaseCharacterConsumables,
    DatabaseCharacterCorruptionManifestation,
    DatabaseCharacterCorruption,
    DatabaseCharacterDiscovery,
    DatabaseCharacterEquipment,
    DatabaseCharacterExtract,
    DatabaseCharacterFavoredClassBonus,
    DatabaseCharacterFeat,
    DatabaseCharacterKnownSpell,
    DatabaseCharacterSpellSlot,
    DatabaseCharacterTrait,
    DatabaseClassSkillRelation,
    SkillRankSource,
    AttributeKey,
    ConsumableKey,
    CharacterTraitWithBase,
    DatabaseCharacterAncestry,
    DatabaseCharacterAncestralTrait
} from '$lib/types/character';
import { 
    isKnownBuff, 
    isValidSkillRankSource 
} from '$lib/types/character';
import { createOptimisticUpdate, type OptimisticUpdateConfig } from '$lib/utils/optimisticUpdate';
import { updateQueue } from '$lib/utils/updateQueue.svelte';
import type { ABPBonusType } from '$lib/types/abp';

type Tables = Database['public']['Tables']


// Add these type aliases
type DatabaseCharacterBuff = Tables['character_buffs']['Row'];
type DatabaseCharacterSkillRank = Tables['character_skill_ranks']['Row'];
// Single source of truth for character data
const character = $state<Character>({
    // Initialize with empty character data
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
    // Initialize all optional arrays
    base_skills: [] as DatabaseBaseSkill[],
    character_skill_ranks: [] as CharacterSkillRank[],
    class_skill_relations: [] as DatabaseClassSkillRelation[],
    character_attributes: [] as DatabaseCharacterAttribute[],
    character_buffs: [] as CharacterBuff[],
    character_combat_stats: [] as DatabaseCharacterCombatStats[],
    character_consumables: [] as DatabaseCharacterConsumables[],
    character_spell_slots: [] as DatabaseCharacterSpellSlot[],
    character_known_spells: [] as DatabaseCharacterKnownSpell[],
    character_class_features: [] as DatabaseCharacterClassFeature[],
    character_discoveries: [] as DatabaseCharacterDiscovery[],
    character_equipment: [] as DatabaseCharacterEquipment[],
    character_feats: [] as DatabaseCharacterFeat[],
    character_extracts: [] as DatabaseCharacterExtract[],
    character_favored_class_bonuses: [] as DatabaseCharacterFavoredClassBonus[],
    character_traits: [] as CharacterTraitWithBase[],
    character_abp_bonuses: [] as DatabaseCharacterAbpBonus[],
    character_corruption_manifestations: [] as DatabaseCharacterCorruptionManifestation[],
    character_corruptions: [] as DatabaseCharacterCorruption[],
    character_ancestries: [] as DatabaseCharacterAncestry[],
    character_ancestral_traits: [] as DatabaseCharacterAncestralTrait[]
} satisfies Character);

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

async function updateExtract(extractId: number, updates: Omit<Partial<Tables['character_extracts']['Row']>, 'id'>) {
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

function initializeCharacter(data: Tables['characters']['Row'] & Partial<Character>) {
    if (!data) {
        throw new Error('Character data is required');
    }
    
    const fullCharacter: Character = {
        ...data,
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
    };
    
    Object.assign(character, fullCharacter);
    
    if (browser) {
        return setupRealtimeSubscription(data.id);
    }
}

// Enhanced real-time subscription helper
function setupRealtimeSubscription(characterId: number) {
    const channel = supabase
        .channel(`character-${characterId}`)
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
                    b => b.buff_type === (payload.new as DatabaseCharacterBuff).buff_type
                );
                if (index >= 0) {
                    // Assert the payload as CharacterBuff after validating buff_type
                    const newBuff = payload.new as DatabaseCharacterBuff;
                    if (isKnownBuff(newBuff.buff_type)) {
                        character.character_buffs[index] = {
                            ...newBuff,
                            buff_type: newBuff.buff_type
                        } as CharacterBuff;
                    }
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
                    s => s.id === (payload.new as Tables['base_skills']['Row']).id
                );
                if (index >= 0) {
                    character.base_skills[index] = payload.new as Tables['base_skills']['Row'];
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
                const newRank = payload.new as DatabaseCharacterSkillRank;
                if (isValidSkillRankSource(newRank.source)) {
                    const index = character.character_skill_ranks.findIndex(
                        s => s.skill_id === newRank.skill_id
                    );
                    if (index >= 0) {
                        character.character_skill_ranks[index] = {
                            ...newRank,
                            source: newRank.source
                        } as CharacterSkillRank;
                    }
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
                    s => s.spell_level === (payload.new as Tables['character_spell_slots']['Row']).spell_level
                );
                if (index >= 0) {
                    character.character_spell_slots[index] = payload.new as Tables['character_spell_slots']['Row'];
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
                    s => s.spell_name === (payload.new as Tables['character_known_spells']['Row']).spell_name
                );
                if (index >= 0) {
                    character.character_known_spells[index] = payload.new as Tables['character_known_spells']['Row'];
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
                    f => f.feature_name === (payload.new as Tables['character_class_features']['Row']).feature_name
                );
                if (index >= 0) {
                    character.character_class_features[index] = payload.new as Tables['character_class_features']['Row'];
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
                    d => d.discovery_name === (payload.new as Tables['character_discoveries']['Row']).discovery_name
                );
                if (index >= 0) {
                    character.character_discoveries[index] = payload.new as Tables['character_discoveries']['Row'];
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
                    f => f.feat_name === (payload.new as Tables['character_feats']['Row']).feat_name
                );
                if (index >= 0) {
                    character.character_feats[index] = payload.new as Tables['character_feats']['Row'];
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
                        character.class_skill_relations.push(payload.new as Tables['class_skill_relations']['Row']);
                        break;
                    case 'UPDATE':
                        const updateIndex = character.class_skill_relations.findIndex(
                            relation => relation.id === (payload.new as Tables['class_skill_relations']['Row']).id
                        );
                        if (updateIndex >= 0) {
                            character.class_skill_relations[updateIndex] = payload.new as Tables['class_skill_relations']['Row'];
                        }
                        break;
                    case 'DELETE':
                        const deleteIndex = character.class_skill_relations.findIndex(
                            relation => relation.id === (payload.old as Tables['class_skill_relations']['Row']).id
                        );
                        if (deleteIndex >= 0) {
                            character.class_skill_relations.splice(deleteIndex, 1);
                        }
                        break;
                }
            }
        })
        // Add FCB subscription
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'character_favored_class_bonuses',
            filter: `character_id=eq.${characterId}`
        }, (payload) => {
            if (character.character_favored_class_bonuses) {
                const index = character.character_favored_class_bonuses.findIndex(
                    fcb => fcb.level === (payload.new as Tables['character_favored_class_bonuses']['Row']).level
                );
                if (index >= 0) {
                    character.character_favored_class_bonuses[index] = payload.new as Tables['character_favored_class_bonuses']['Row'];
                } else {
                    character.character_favored_class_bonuses.push(payload.new as Tables['character_favored_class_bonuses']['Row']);
                }
            }
        })
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'character_traits',
            filter: `character_id=eq.${characterId}`
        }, (payload) => {
            if (character.character_traits) {
                const index = character.character_traits.findIndex(
                    t => t.id === (payload.new as DatabaseCharacterTrait).id
                );
                if (index >= 0) {
                    character.character_traits[index] = payload.new as CharacterTraitWithBase;
                }
            }
        })
        // Add ancestry subscription
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'character_ancestries',
            filter: `character_id=eq.${characterId}`
        }, (payload) => {
            if (character.character_ancestries) {
                const newAncestry = payload.new as DatabaseCharacterAncestry;
                const index = character.character_ancestries.findIndex(
                    a => a.id === newAncestry.id
                );
                if (index >= 0) {
                    character.character_ancestries[index] = newAncestry;
                } else {
                    character.character_ancestries.push(newAncestry);
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
    if (!character.class) {
        throw new Error('Character class is required');
    }

    const [baseSkillsResult, skillRanksResult, classSkillsResult] = await Promise.all([
        supabase.from('base_skills').select('*'),
        supabase.from('character_skill_ranks').select('*').eq('character_id', characterId),
        supabase.from('class_skill_relations').select('*').eq('class_name', character.class)
    ]);

    if (baseSkillsResult.error) throw baseSkillsResult.error;
    if (skillRanksResult.error) throw skillRanksResult.error;
    if (classSkillsResult.error) throw classSkillsResult.error;


    character.base_skills = baseSkillsResult.data;
    character.character_skill_ranks = skillRanksResult.data.map(rank => ({
        ...rank,
        source: (rank.source || 'class') as SkillRankSource
    }));
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

async function fetchCharacterData(characterId: number) {
    // ... existing fetches ...

    // Add skill data fetch
    await fetchSkillData(characterId);

    // Add FCB fetch
    const fcbResult = await supabase
        .from('character_favored_class_bonuses')
        .select('*')
        .eq('character_id', characterId);

    if (fcbResult.error) throw fcbResult.error;
    
    // Update character state
    character.character_favored_class_bonuses = fcbResult.data as Tables['character_favored_class_bonuses']['Row'][];

    // Add ancestry fetch with full relationship data
    const ancestryResult = await supabase
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
        .eq('character_id', characterId);

    if (ancestryResult.error) throw ancestryResult.error;
    
    // Update character state with ancestry data
    character.character_ancestries = ancestryResult.data.map(row => ({
        ...row,
        ancestry: row.ancestry || null
    })) as DatabaseCharacterAncestry[];

}

async function updateABPBonus(
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
    .eq('character_id', character.id)
    .eq('bonus_type', bonusType);

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
    toggleBuff,
    fetchCharacterData,
    updateABPBonus
};
