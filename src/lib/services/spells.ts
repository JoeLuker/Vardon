import type { Database } from '$lib/types/supabase';
import { db } from './database';
import type { SpellSlots } from '$lib/types/character';

type SpellSlotRow = Database['public']['Tables']['character_spell_slots']['Row'];
type KnownSpellRow = Database['public']['Tables']['character_known_spells']['Row'];

export class SpellService {
  async loadSpells(characterId: number): Promise<{
    slots: SpellSlots;
    knownSpells: Record<string, string[]>;
  }> {
    try {
      const [slotRows, knownRows] = await Promise.all([
        this.ensureSpellSlots(characterId),
        db.knownSpells.get(characterId)
      ]);

      const slots = this.transformSpellSlots(slotRows);
      const knownSpells = this.transformKnownSpells(knownRows);

      return { slots, knownSpells };
    } catch (error) {
      console.error('Failed to load spells:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to load spells');
    }
  }

  private async ensureSpellSlots(characterId: number): Promise<SpellSlotRow[]> {
    const existingSlots = await db.spellSlots.get(characterId);

    // If slots already exist, return them
    if (existingSlots.length > 0) {
      return existingSlots;
    }

    // Initialize spell slots for each level
    const levels = [1, 2];
    const slotPromises = levels.map(level => {
      const data: Omit<SpellSlotRow, 'id'> = {
        character_id: characterId,
        spell_level: level,
        remaining: this.getBaseSlots(level),
        total: this.getBaseSlots(level),
        sync_status: 'synced',
        updated_at: new Date().toISOString()
      };
      return db.spellSlots.upsert(data);
    });

    return await Promise.all(slotPromises);
  }

  async updateSpellSlot(characterId: number, level: number, remaining: number): Promise<void> {
    try {
      const slots = await db.spellSlots.get(characterId);
      const slot = slots.find(s => s.spell_level === level);
      
      const total = slot?.total || this.getBaseSlots(level);
      const validRemaining = Math.max(0, Math.min(remaining, total));

      const data: Omit<SpellSlotRow, 'id'> = {
        character_id: characterId,
        spell_level: level,
        remaining: validRemaining,
        total,
        sync_status: 'synced',
        updated_at: new Date().toISOString()
      };

      await db.spellSlots.upsert(data);
    } catch (error) {
      console.error('Failed to update spell slot:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to update spell slot');
    }
  }

  async updateKnownSpells(characterId: number, level: number, spells: string[]): Promise<void> {
    try {
      // Get existing spells
      const existingSpells = await db.knownSpells.get(characterId);
      
      // Delete spells of this level
      for (const spell of existingSpells) {
        if (spell.spell_level === level) {
          await db.knownSpells.delete(characterId, spell.spell_name);
        }
      }

      // Add new spells
      const insertPromises = spells.map(spellName => {
        const data: Omit<KnownSpellRow, 'id'> = {
          character_id: characterId,
          spell_level: level,
          spell_name: spellName.trim(),
          sync_status: 'synced',
          created_at: new Date().toISOString()
        };
        return db.knownSpells.upsert(data);
      });

      await Promise.all(insertPromises);
    } catch (error) {
      console.error('Failed to update known spells:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to update known spells');
    }
  }

  async resetSpellSlots(characterId: number): Promise<void> {
    try {
      const levels = [1, 2];
      
      // Reset all spell slots to their base values
      const resetPromises = levels.map(level => {
        const data: Omit<SpellSlotRow, 'id'> = {
          character_id: characterId,
          spell_level: level,
          remaining: this.getBaseSlots(level),
          total: this.getBaseSlots(level),
          sync_status: 'synced',
          updated_at: new Date().toISOString()
        };
        return db.spellSlots.upsert(data);
      });

      await Promise.all(resetPromises);
    } catch (error) {
      console.error('Failed to reset spells:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to reset spells');
    }
  }

  private getBaseSlots(level: number): number {
    const baseSlots: Record<number, number> = {
      1: 4,
      2: 2
    };
    return baseSlots[level] || 0;
  }

  private transformSpellSlots(rows: SpellSlotRow[]): SpellSlots {
    if (!Array.isArray(rows) || rows.length === 0) {
      return {};
    }

    return rows.reduce((slots, row) => ({
      ...slots,
      [row.spell_level]: {
        total: row.total,
        remaining: row.remaining,
        bonus: 0,  // Calculated in store based on INT modifier
        dc: 10 + row.spell_level  // Base DC, modified in store
      }
    }), {} as SpellSlots);
  }

  private transformKnownSpells(rows: KnownSpellRow[]): Record<string, string[]> {
    if (!Array.isArray(rows) || rows.length === 0) {
      return {};
    }

    return rows.reduce((spells, row) => ({
      ...spells,
      [row.spell_level]: [
        ...(spells[row.spell_level] || []),
        row.spell_name
      ]
    }), {} as Record<string, string[]>);
  }
}

export const spellService = new SpellService();