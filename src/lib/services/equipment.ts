// /src/lib/services/equipment.ts
import type { Database } from '$lib/types/supabase';
import { db } from './database';
import type { Consumables } from '$lib/types/character';

type ConsumableRow = Database['public']['Tables']['character_consumables']['Row'];
type ConsumableInsert = Database['public']['Tables']['character_consumables']['Insert'];

export class EquipmentService {
  async loadConsumables(characterId: number): Promise<Consumables> {
    try {
      const consumables = await db.consumables.get(characterId);
      return this.transformConsumables(consumables);
    } catch (error) {
      console.error('Failed to load consumables:', error);
      throw error;
    }
  }

  async updateConsumable(
    characterId: number,
    type: keyof Consumables,
    amount: number
  ): Promise<void> {
    try {
      const dbFieldMap = this.getConsumableFieldMap();
      const validatedAmount = Math.max(0, Math.round(amount));

      const data = {
        character_id: characterId,
        acid: type === 'acid' ? validatedAmount : 0,
        alchemist_fire: type === 'alchemistFire' ? validatedAmount : 0,
        tanglefoot: type === 'tanglefoot' ? validatedAmount : 0,
        sync_status: 'synced' as const,
        updated_at: new Date().toISOString() as string
      } satisfies ConsumableInsert;

      await db.consumables.upsert(data);
    } catch (error) {
      console.error('Failed to update consumable:', error);
      throw error;
    }
  }

  async useConsumable(
    characterId: number,
    type: keyof Consumables
  ): Promise<number> {
    try {
      const current = await this.loadConsumables(characterId);
      const newAmount = Math.max(0, current[type] - 1);
      
      await this.updateConsumable(characterId, type, newAmount);
      return newAmount;
    } catch (error) {
      console.error('Failed to use consumable:', error);
      throw error;
    }
  }

  async reset(characterId: number): Promise<void> {
    try {
      const data = {
        character_id: characterId,
        alchemist_fire: 3,
        acid: 3,
        tanglefoot: 3,
        sync_status: 'synced' as const,
        updated_at: new Date().toISOString() as string
      } satisfies ConsumableInsert;

      await db.consumables.upsert(data);
    } catch (error) {
      console.error('Failed to reset consumables:', error);
      throw error;
    }
  }

  private getConsumableFieldMap(): Record<keyof Consumables, string> {
    return {
      alchemistFire: 'alchemist_fire',
      acid: 'acid',
      tanglefoot: 'tanglefoot'
    };
  }

  private transformConsumables(row: ConsumableRow | null): Consumables {
    return {
      alchemistFire: row?.alchemist_fire || 0,
      acid: row?.acid || 0,
      tanglefoot: row?.tanglefoot || 0
    };
  }
}

export const equipmentService = new EquipmentService();