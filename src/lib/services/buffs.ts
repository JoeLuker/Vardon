// /src/lib/services/buffs.ts
import type { Database } from '$lib/types/supabase';
import { db } from './database';
import type { BuffName, BuffState } from '$lib/types';

type BuffRow = Database['public']['Tables']['character_buffs']['Row'];

export class BuffService {
  async loadBuffs(characterId: number): Promise<BuffState> {
    try {
      const buffs = await db.buffs.get(characterId);
      return {
        ...this.getDefaultBuffState(),
        ...this.transformBuffs(buffs),
        errors: []
      };
    } catch (error) {
      throw new Error(`Failed to load buffs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async toggleBuff(characterId: number, buffName: BuffName): Promise<boolean> {
    try {
      const currentBuffs = await db.buffs.get(characterId);
      const currentBuff = currentBuffs.find(b => b.buff_type === buffName);
      const newIsActive = !currentBuff?.is_active;

      // Handle mutually exclusive buffs
      if (newIsActive) {
        if (buffName === 'cognatogen') {
          await this.deactivateBuff(characterId, 'dex_mutagen');
        } else if (buffName === 'dex_mutagen') {
          await this.deactivateBuff(characterId, 'cognatogen');
        }
      }

      await db.buffs.toggle(characterId, buffName, newIsActive);
      return newIsActive;
    } catch (error) {
      throw new Error(`Failed to toggle buff: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async deactivateBuff(characterId: number, buffName: BuffName): Promise<void> {
    await db.buffs.toggle(characterId, buffName, false);
  }

  private getDefaultBuffState(): Omit<BuffState, 'errors'> {
    return {
      deadly_aim: false,
      two_weapon_fighting: false,
      rapid_shot: false,
      cognatogen: false,
      dex_mutagen: false
    };
  }

  private transformBuffs(buffs: BuffRow[]): Omit<BuffState, 'errors'> {
    if (!Array.isArray(buffs)) return this.getDefaultBuffState();

    return buffs.reduce((acc, buff) => ({
      ...acc,
      [buff.buff_type as BuffName]: buff.is_active
    }), {} as Omit<BuffState, 'errors'>);
  }
}

export const buffService = new BuffService();