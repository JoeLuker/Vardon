// /src/lib/services/character.ts
import { db } from './database';
import { supabase } from '../supabase';
import type { Character, CharacterStats, Attributes, CombatStats, Consumables, Skills, BuffState } from '$lib/types/character';
import type { Database } from '$lib/types/supabase';

type CharacterRow = Database['public']['Tables']['characters']['Row'];
type CharacterInsert = Database['public']['Tables']['characters']['Insert'];

export class CharacterService {
  async getFirstCharacterId(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('id')
        .limit(1)
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No characters found in database');
      }

      return data.id;
    } catch (error) {
      console.error('Error fetching character ID:', error);
      throw error;
    }
  }

  async load(id: number): Promise<Character> {
    try {
      const character = await db.characters.get(id);

      if (!character) {
        throw new Error('Character not found');
      }

      return this.transformCharacter(character);
    } catch (error) {
      console.error('Error loading character:', error);
      throw error;
    }
  }

  async loadStats(id: number): Promise<CharacterStats> {
    try {
      // Execute all queries in parallel
      const [
        attributes,
        combatStats,
        consumables,
        spellSlots,
        knownSpells,
        buffs,
        skills,
        character
      ] = await Promise.all([
        db.attributes.get(id).then(attrs => attrs.find(a => !a.is_temporary)),
        db.combatStats.get(id),
        db.consumables.get(id),
        db.spellSlots.get(id),
        db.knownSpells.get(id),
        db.buffs.get(id),
        db.skills.get(id),
        db.characters.get(id)
      ]);

      if (!character) {
        throw new Error('Character not found');
      }

      const tempAttrs = await db.attributes.get(id).then(attrs => attrs.find(a => a.is_temporary));

      return {
        id,
        character_id: id,
        base_attributes: this.transformAttributes(attributes),
        current_attributes: this.transformAttributes(tempAttrs || attributes),
        combat_stats: this.transformCombatStats(combatStats, character.current_hp),
        consumables: this.transformConsumables(consumables),
        spell_slots: this.transformSpellSlots(spellSlots),
        known_spells: this.transformKnownSpells(knownSpells),
        buffs: this.transformBuffs(buffs),
        skills: this.transformSkills(skills),
        current_hp: character.current_hp,
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error loading stats:', error);
      throw error;
    }
  }

  async update(id: number, updates: Partial<Character>): Promise<Character> {
    try {
      const character = await db.characters.get(id);
      if (!character) {
        throw new Error('Character not found');
      }

      const data = {
        name: updates.name ?? character.name,
        class: updates.class ?? character.class,
        race: updates.race ?? character.race,
        level: updates.level ?? character.level,
        current_hp: updates.current_hp ?? character.current_hp,
        updated_at: new Date().toISOString() as string
      } satisfies CharacterInsert;

      await db.characters.update(id, data);
      return this.transformCharacter({ ...character, ...data });
    } catch (error) {
      console.error('Error updating character:', error);
      throw error;
    }
  }

  private transformCharacter(data: CharacterRow): Character {
    return {
      id: data.id,
      name: data.name,
      class: data.class,
      race: data.race,
      level: data.level,
      current_hp: data.current_hp,
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString()
    };
  }

  private transformAttributes(data: Database['public']['Tables']['character_attributes']['Row'] | null | undefined): Attributes {
    const defaultAttributes: Attributes = {
      str: 12,
      dex: 16,
      con: 12,
      int: 20,
      wis: 10,
      cha: 8
    };

    if (!data) return defaultAttributes;

    return {
      str: data.str ?? defaultAttributes.str,
      dex: data.dex ?? defaultAttributes.dex,
      con: data.con ?? defaultAttributes.con,
      int: data.int ?? defaultAttributes.int,
      wis: data.wis ?? defaultAttributes.wis,
      cha: data.cha ?? defaultAttributes.cha
    };
  }

  private transformCombatStats(data: Database['public']['Tables']['character_combat_stats']['Row'] | null, currentHP: number): CombatStats {
    return {
      currentHP,
      bombsLeft: data?.bombs_left ?? 8,
      baseAttackBonus: data?.base_attack_bonus ?? 3
    };
  }

  private transformConsumables(data: Database['public']['Tables']['character_consumables']['Row'] | null): Consumables {
    return {
      alchemistFire: data?.alchemist_fire ?? 0,
      acid: data?.acid ?? 0,
      tanglefoot: data?.tanglefoot ?? 0
    };
  }

  private transformSpellSlots(data: Database['public']['Tables']['character_spell_slots']['Row'][] | null) {
    if (!Array.isArray(data)) return {};
    return data.reduce((acc, slot) => ({
      ...acc,
      [slot?.spell_level ?? 0]: {
        remaining: slot?.remaining ?? 0,
        total: slot?.total ?? 0,
        bonus: 0,
        dc: 10 + (slot?.spell_level ?? 0)
      }
    }), {});
  }

  private transformKnownSpells(data: Database['public']['Tables']['character_known_spells']['Row'][] | null) {
    if (!Array.isArray(data)) return {};
    return data.reduce((acc, spell) => {
      const level = spell?.spell_level?.toString() ?? '0';
      return {
        ...acc,
        [level]: [...(acc[level] ?? []), spell?.spell_name].filter(Boolean)
      };
    }, {} as Record<string, string[]>);
  }

  private transformSkills(data: Database['public']['Tables']['character_skills']['Row'][] | null): Skills {
    if (!Array.isArray(data)) return {} as Skills;
    return data.reduce((acc, skill) => ({
      ...acc,
      [skill?.skill_name ?? '']: {
        ability: skill?.ability ?? 'int',
        classSkill: skill?.class_skill ?? false,
        ranks: skill?.ranks ?? 0
      }
    }), {} as Skills);
  }

  private transformBuffs(data: Database['public']['Tables']['character_buffs']['Row'][] | null): BuffState {
    if (!Array.isArray(data)) return this.getDefaultBuffState();
    
    return {
      deadly_aim: data.some(b => b.buff_type === 'deadly_aim' && b.is_active),
      two_weapon_fighting: data.some(b => b.buff_type === 'two_weapon_fighting' && b.is_active),
      rapid_shot: data.some(b => b.buff_type === 'rapid_shot' && b.is_active),
      cognatogen: data.some(b => b.buff_type === 'cognatogen' && b.is_active),
      dex_mutagen: data.some(b => b.buff_type === 'dex_mutagen' && b.is_active),
      errors: []
    };
  }

  private getDefaultBuffState(): BuffState {
    return {
      deadly_aim: false,
      two_weapon_fighting: false,
      rapid_shot: false,
      cognatogen: false,
      dex_mutagen: false,
      errors: []
    };
  }
}

export const characterService = new CharacterService();