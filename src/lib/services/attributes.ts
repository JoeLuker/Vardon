// /src/lib/services/attributes.ts
import { db } from './database';
import type { Attributes } from '$lib/types';
import type { Database } from '$lib/types/supabase';

type AttributeRow = Database['public']['Tables']['character_attributes']['Row'];
type AttributeInsert = Database['public']['Tables']['character_attributes']['Insert'];

export interface AttributeData {
  base: Attributes;
  current: Attributes;
}

export interface AttributeService {
  getAttributes(characterId: number): Promise<AttributeData>;
  updateAttributes(characterId: number, attrs: Partial<Attributes>, isTemporary?: boolean): Promise<void>;
  loadAttributes(characterId: number): Promise<AttributeData>;
  init(characterId: number, data: AttributeData): Promise<void>;
}

export class AttributeServiceImpl implements AttributeService {
  private defaultAttributes: Attributes = {
    str: 12,
    dex: 16,
    con: 12,
    int: 20,
    wis: 10,
    cha: 8
  };

  async getAttributes(characterId: number): Promise<AttributeData> {
    try {
      const [baseAttrs, tempAttrs] = await Promise.all([
        db.attributes.get(characterId).then(attrs => attrs.find(a => !a.is_temporary)),
        db.attributes.get(characterId).then(attrs => attrs.find(a => a.is_temporary))
      ]);

      const base = this.transformAttributes(baseAttrs);
      const current = tempAttrs ? this.transformAttributes(tempAttrs) : base;

      return { base, current };
    } catch (error) {
      throw new Error(`Failed to load attributes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async loadAttributes(characterId: number): Promise<AttributeData> {
    return this.getAttributes(characterId);
  }

  async init(characterId: number, data: AttributeData): Promise<void> {
    try {
      await Promise.all([
        this.updateAttributes(characterId, data.base, false),
        this.updateAttributes(characterId, data.current, true)
      ]);
    } catch (error) {
      throw new Error(`Failed to initialize attributes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateAttributes(characterId: number, attrs: Partial<Attributes>, isTemporary = false): Promise<void> {
    try {
      const existingAttrs = await db.attributes.get(characterId);
      const currentAttrs = existingAttrs.find(a => a.is_temporary === isTemporary);

      const data = {
        character_id: characterId,
        is_temporary: isTemporary,
        sync_status: 'synced' as const,
        created_at: new Date().toISOString() as string,
        str: attrs.str ?? (currentAttrs?.str ?? this.defaultAttributes.str),
        dex: attrs.dex ?? (currentAttrs?.dex ?? this.defaultAttributes.dex),
        con: attrs.con ?? (currentAttrs?.con ?? this.defaultAttributes.con),
        int: attrs.int ?? (currentAttrs?.int ?? this.defaultAttributes.int),
        wis: attrs.wis ?? (currentAttrs?.wis ?? this.defaultAttributes.wis),
        cha: attrs.cha ?? (currentAttrs?.cha ?? this.defaultAttributes.cha)
      } satisfies AttributeInsert;

      await db.attributes.upsert(data);
    } catch (error) {
      throw new Error(`Failed to update attributes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private transformAttributes(row: AttributeRow | null | undefined): Attributes {
    if (!row) return this.defaultAttributes;

    return {
      str: row.str,
      dex: row.dex,
      con: row.con,
      int: row.int,
      wis: row.wis,
      cha: row.cha
    };
  }
}

export const attributeService = new AttributeServiceImpl();