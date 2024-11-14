// src/lib/state/character.svelte.ts
import { browser } from '$app/environment';
import { supabase } from '$lib/supabaseClient';
import type { 
    Character, 
    AttributeKey, 
    ConsumableKey,
    KnownBuffType,
    CharacterBuff,
    SpellSlot,
    KnownSpell,
    CharacterDiscovery,
    CharacterClassFeature,
    CharacterFeat,
    DatabaseCharacterSkill
} from '$lib/types/character';

// Single source of truth for character data
const character = $state<Character>({} as Character);

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

async function updateSkills(skillRanks: Record<string, number>) {
    for (const [skillName, ranks] of Object.entries(skillRanks)) {
        const { error } = await supabase
            .from('character_skills')
            .update({ ranks })
            .eq('character_id', character.id)
            .eq('skill_name', skillName);
        
        if (error) throw error;
    }
}

async function toggleBuff(buffType: KnownBuffType, isActive: boolean) {
    const { error } = await supabase
        .from('character_buffs')
        .update({ is_active: isActive })
        .eq('character_id', character.id)
        .eq('buff_type', buffType);
    
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

function initializeCharacter(data: Character) {
    if (!data) {
        throw new Error('Character data is required');
    }
    
    Object.assign(character, data);
    
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
            table: 'character_skills',
            filter: `character_id=eq.${characterId}`
        }, (payload) => {
            if (character.character_skills) {
                const index = character.character_skills.findIndex(
                    s => s.skill_name === (payload.new as DatabaseCharacterSkill).skill_name
                );
                if (index >= 0) {
                    character.character_skills[index] = payload.new as DatabaseCharacterSkill;
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
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

// Export only what's necessary
export { 
    character,
    updateBombs,
    updateConsumable,
    updateAttribute,
    updateSkills,
    toggleBuff,
    updateHP,
    updateSpellSlot,
    initializeCharacter
};