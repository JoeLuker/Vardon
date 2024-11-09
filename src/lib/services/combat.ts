// /src/lib/services/combat.ts
import { db } from './database';
import type { CombatStats } from '$lib/types/character';
import type { Database } from '$lib/types/supabase';

type CombatStatsRow = Database['public']['Tables']['character_combat_stats']['Row'];
type CombatStatsInsert = Database['public']['Tables']['character_combat_stats']['Insert'];
type CharacterInsert = Database['public']['Tables']['characters']['Insert'];

export class CombatService {
  async loadCombatStats(characterId: number): Promise<CombatStats> {
    try {
      const [combatStats, character] = await Promise.all([
        db.combatStats.get(characterId),
        db.characters.get(characterId)
      ]);

      // If no combat stats exist, create initial record
      if (!combatStats) {
        const initialStats = await this.initializeCombatStats(characterId);
        return this.transformCombatStats(initialStats, character?.current_hp);
      }

      return this.transformCombatStats(combatStats, character?.current_hp);
    } catch (error) {
      console.error('Failed to load combat stats:', error);
      throw error;
    }
  }

  private async initializeCombatStats(characterId: number): Promise<CombatStatsRow> {
    const data = {
      character_id: characterId,
      bombs_left: 8,
      base_attack_bonus: 3,
      sync_status: 'synced' as const,
      updated_at: new Date().toISOString() as string
    } satisfies CombatStatsInsert;

    const result = await db.combatStats.upsert(data);
    if (!result) {
      throw new Error('Failed to initialize combat stats');
    }

    return result;
  }

  async updateBombs(characterId: number, bombsLeft: number): Promise<void> {
    try {
      // Ensure valid input
      const validBombsLeft = Math.max(0, Math.round(bombsLeft));

      // Get existing combat stats
      const stats = await db.combatStats.get(characterId);
      
      if (!stats) {
        // Initialize if not exists
        await this.initializeCombatStats(characterId);
      }

      const data = {
        character_id: characterId,
        bombs_left: validBombsLeft,
        base_attack_bonus: stats?.base_attack_bonus ?? 3,
        sync_status: 'synced' as const,
        updated_at: new Date().toISOString() as string
      } satisfies CombatStatsInsert;

      await db.combatStats.upsert(data);
    } catch (error) {
      console.error('Failed to update bombs:', error);
      throw error;
    }
  }

  async updateHP(characterId: number, currentHP: number): Promise<void> {
    try {
      // First get the existing character data
      const character = await db.characters.get(characterId);
      
      if (!character) {
        throw new Error('Character not found');
      }

      // Ensure valid HP value
      const validHP = Math.max(0, Math.round(currentHP));

      const data = {
        name: character.name,
        class: character.class,
        race: character.race,
        level: character.level,
        current_hp: validHP
      } satisfies CharacterInsert;

      await db.characters.update(characterId, data);
    } catch (error) {
      console.error('Failed to update HP:', error);
      throw error;
    }
  }

  async reset(characterId: number): Promise<void> {
    try {
      const character = await db.characters.get(characterId);
      
      if (!character) {
        throw new Error('Character not found');
      }

      await Promise.all([
        // Reset combat stats
        db.combatStats.upsert({
          character_id: characterId,
          bombs_left: 8,
          base_attack_bonus: 3,
          sync_status: 'synced' as const,
          updated_at: new Date().toISOString() as string
        }),
        // Reset HP
        db.characters.update(characterId, {
          name: character.name,
          class: character.class,
          race: character.race,
          level: character.level,
          current_hp: 45
        })
      ]);
    } catch (error) {
      console.error('Failed to reset combat stats:', error);
      throw error;
    }
  }

  private transformCombatStats(
    combatStats: CombatStatsRow | null,
    currentHP: number = 45
  ): CombatStats {
    return {
      currentHP: Math.max(0, Math.round(currentHP)),
      bombsLeft: combatStats?.bombs_left ?? 8,
      baseAttackBonus: combatStats?.base_attack_bonus ?? 3
    };
  }
}

export const combatService = new CombatService();