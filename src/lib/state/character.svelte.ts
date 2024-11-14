// src/lib/state/character.svelte.ts
import { browser } from '$app/environment';
import { supabase } from '$lib/supabaseClient';
import type { 
    Character, 
    CharacterBuff, 
    CharacterSkill, 
    AttributeKey, 
    ConsumableKey,
    KnownBuffType,
    DatabaseCharacterBuff,
    DatabaseCharacterSkill
} from '$lib/types/character';
import { KNOWN_BUFFS } from '$lib/types/character';

// Helper functions
function isKnownBuff(buff: string): buff is KnownBuffType {
    return KNOWN_BUFFS.includes(buff as KnownBuffType);
}

function transformBuff(buff: DatabaseCharacterBuff): CharacterBuff | null {
    return isKnownBuff(buff.buff_type) 
        ? { ...buff, buff_type: buff.buff_type as KnownBuffType }
        : null;
}

function transformSkill(skill: DatabaseCharacterSkill): CharacterSkill {
    return {
        skill_name: skill.skill_name,
        ability: skill.ability,
        class_skill: skill.class_skill ?? false,
        ranks: skill.ranks
    };
}

class CharacterState {
    character = $state<Character>({} as Character);

    componentBuffs = $derived(
        this.character.character_buffs
            ?.map(transformBuff)
            .filter((buff): buff is CharacterBuff => buff !== null) ?? []
    );

    componentSkills = $derived(
        this.character.character_skills?.map(transformSkill) ?? []
    );

    currentHP = $derived(this.character.current_hp ?? 0);

    maxHP = $derived(this.character.max_hp ?? 0);

    attributes = $derived(this.character.character_attributes?.[0] ?? {});

    combatStats = $derived(this.character.character_combat_stats?.[0] ?? {});

    consumables = $derived(this.character.character_consumables?.[0] ?? {});

    spellSlots = $derived(this.character.character_spell_slots ?? []);

    async updateBombs(bombs: number) {
        const { error } = await supabase
            .from('character_combat_stats')
            .update({ bombs_left: bombs })
            .eq('character_id', this.character.id);
        
        if (error) throw error;
        
        if (this.character.character_combat_stats?.[0]) {
            this.character.character_combat_stats[0].bombs_left = bombs;
        }
    }

    async updateConsumable(type: ConsumableKey, value: number) {
        const { error } = await supabase
            .from('character_consumables')
            .update({ [type]: value })
            .eq('character_id', this.character.id);
        
        if (error) throw error;

        if (this.character.character_consumables?.[0]) {
            this.character.character_consumables[0][type] = value;
        }
    }

    async updateAttribute(attr: AttributeKey, value: number) {
        const { error } = await supabase
            .from('character_attributes')
            .update({ [attr]: value })
            .eq('character_id', this.character.id);
        
        if (error) throw error;

        if (this.character.character_attributes?.[0]) {
            this.character.character_attributes[0][attr] = value;
        }
    }

    async updateSkills(skillRanks: Record<string, number>) {
        for (const [skillName, ranks] of Object.entries(skillRanks)) {
            const { error } = await supabase
                .from('character_skills')
                .update({ ranks })
                .eq('character_id', this.character.id)
                .eq('skill_name', skillName);
            
            if (error) throw error;

            const skill = this.character.character_skills?.find(s => s.skill_name === skillName);
            if (skill) {
                skill.ranks = ranks;
            }
        }
    }

    async toggleBuff(buffName: string, active: boolean) {
        const { error } = await supabase
            .from('character_buffs')
            .update({ is_active: active })
            .eq('character_id', this.character.id)
            .eq('buff_type', buffName);
        
        if (error) throw error;

        const buff = this.character.character_buffs?.find(b => b.buff_type === buffName);
        if (buff) {
            buff.is_active = active;
        }
    }

    async updateHP(newValue: number) {
        const { error } = await supabase
            .from('characters')
            .update({ current_hp: newValue })
            .eq('id', this.character.id);
        
        if (error) throw error;

        this.character.current_hp = newValue;
    }

    async updateSpellSlot(level: number, remaining: number) {
        const { error } = await supabase
            .from('character_spell_slots')
            .update({ remaining })
            .eq('character_id', this.character.id)
            .eq('spell_level', level);
        
        if (error) throw error;

        const slot = this.character.character_spell_slots?.find(s => s.spell_level === level);
        if (slot) {
            slot.remaining = remaining;
        }
    }

    initializeCharacter(data: Character) {
        if (!data) {
            throw new Error('Character data is required');
        }
        
        // Create a fresh copy of the data to avoid reference issues
        this.character = { ...data };
        
        if (browser) {
            return setupRealtimeSubscription(data.id);
        }
    }
}

export const characterState = new CharacterState();

// Export everything from the instance
export const { 
    character,
    componentBuffs,
    componentSkills,
    currentHP,
    maxHP,
    attributes,
    combatStats,
    consumables,
    spellSlots,
    updateBombs,
    updateConsumable,
    updateAttribute,
    updateSkills,
    toggleBuff,
    updateHP,
    updateSpellSlot,
    initializeCharacter
} = characterState;

// Move the realtime subscription logic to a separate function
function setupRealtimeSubscription(characterId: number) {
    const channel = supabase.channel(`character-${characterId}`)
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public',
            table: 'characters',
            filter: `id=eq.${characterId}`
        }, (payload) => {
            Object.assign(character, payload.new);
        })
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}