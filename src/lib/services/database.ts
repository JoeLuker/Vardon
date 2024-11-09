// src/lib/services/database.ts
import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase';
import type { Database } from '$lib/types/supabase';

export const errors = writable<string[]>([]);

// Define specific table types
type CharacterAttributes = Database['public']['Tables']['character_attributes']['Row'];
type CharacterBuffs = Database['public']['Tables']['character_buffs']['Row'];
type CharacterCombatStats = Database['public']['Tables']['character_combat_stats']['Row'];
type CharacterConsumables = Database['public']['Tables']['character_consumables']['Row'];
type CharacterSpellSlots = Database['public']['Tables']['character_spell_slots']['Row'];
type CharacterKnownSpells = Database['public']['Tables']['character_known_spells']['Row'];
type CharacterSkills = Database['public']['Tables']['character_skills']['Row'];
type Character = Database['public']['Tables']['characters']['Row'];

export const db = {
  characters: {
    async get(id: number): Promise<Character | null> {
      const { data, error } = await supabase
        .from('characters')
        .select()
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },

    async update(id: number, updates: Omit<Partial<Character>, 'id'>): Promise<void> {
      const { error } = await supabase
        .from('characters')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    }
  },

  attributes: {
    async get(characterId: number): Promise<CharacterAttributes[]> {
      const { data, error } = await supabase
        .from('character_attributes')
        .select()
        .eq('character_id', characterId);
      
      if (error) throw error;
      return data || [];
    },

    async upsert(data: Omit<CharacterAttributes, 'id'>): Promise<CharacterAttributes> {
      const { data: result, error } = await supabase
        .from('character_attributes')
        .upsert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    }
  },

  buffs: {
    async get(characterId: number): Promise<CharacterBuffs[]> {
      const { data, error } = await supabase
        .from('character_buffs')
        .select()
        .eq('character_id', characterId);
      
      if (error) throw error;
      return data || [];
    },

    async toggle(characterId: number, buffType: string, isActive: boolean): Promise<void> {
      const { error } = await supabase
        .from('character_buffs')
        .update({ is_active: isActive })
        .eq('character_id', characterId)
        .eq('buff_type', buffType);
      
      if (error) throw error;
    }
  },

  combatStats: {
    async get(characterId: number): Promise<CharacterCombatStats | null> {
      const { data, error } = await supabase
        .from('character_combat_stats')
        .select()
        .eq('character_id', characterId)
        .single();
      
      if (error) throw error;
      return data;
    },

    async upsert(data: Omit<CharacterCombatStats, 'id'>): Promise<CharacterCombatStats> {
      const { data: result, error } = await supabase
        .from('character_combat_stats')
        .upsert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    }
  },

  consumables: {
    async get(characterId: number): Promise<CharacterConsumables | null> {
      const { data, error } = await supabase
        .from('character_consumables')
        .select()
        .eq('character_id', characterId)
        .single();
      
      if (error) throw error;
      return data;
    },

    async upsert(data: Omit<CharacterConsumables, 'id'>): Promise<CharacterConsumables> {
      const { data: result, error } = await supabase
        .from('character_consumables')
        .upsert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    }
  },

  spellSlots: {
    async get(characterId: number): Promise<CharacterSpellSlots[]> {
      const { data, error } = await supabase
        .from('character_spell_slots')
        .select()
        .eq('character_id', characterId);
      
      if (error) throw error;
      return data || [];
    },

    async upsert(data: Omit<CharacterSpellSlots, 'id'>): Promise<CharacterSpellSlots> {
      const { data: result, error } = await supabase
        .from('character_spell_slots')
        .upsert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    }
  },

  knownSpells: {
    async get(characterId: number): Promise<CharacterKnownSpells[]> {
      const { data, error } = await supabase
        .from('character_known_spells')
        .select()
        .eq('character_id', characterId);
      
      if (error) throw error;
      return data || [];
    },

    async upsert(data: Omit<CharacterKnownSpells, 'id'>): Promise<CharacterKnownSpells> {
      const { data: result, error } = await supabase
        .from('character_known_spells')
        .upsert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },

    async delete(characterId: number, spellName: string): Promise<void> {
      const { error } = await supabase
        .from('character_known_spells')
        .delete()
        .eq('character_id', characterId)
        .eq('spell_name', spellName);
      
      if (error) throw error;
    }
  },

  skills: {
    async get(characterId: number): Promise<CharacterSkills[]> {
      const { data, error } = await supabase
        .from('character_skills')
        .select()
        .eq('character_id', characterId);
      
      if (error) throw error;
      return data || [];
    },

    async upsert(data: Omit<CharacterSkills, 'id'>): Promise<CharacterSkills> {
      const { data: result, error } = await supabase
        .from('character_skills')
        .upsert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    }
  }
};

// Export type helpers
export type {
  Character,
  CharacterAttributes,
  CharacterBuffs,
  CharacterCombatStats,
  CharacterConsumables,
  CharacterSpellSlots,
  CharacterKnownSpells,
  CharacterSkills
};