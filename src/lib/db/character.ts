// FILE: src/lib/db/character.ts

import { error } from '@sveltejs/kit';
import { supabase } from '$lib/db/supabaseClient';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

import type { Character } from '$lib/domain/types/character';
import type { ConsumableKey, KnownBuffType, AttributeKey } from '$lib/domain/types/character';
import type { Database } from '$lib/domain/types/supabase';
import type { ABPBonusType } from '$lib/domain/types/abp';

/**
 * Helper type for referencing your auto-generated supabase definitions if needed.
 * If not used, you can remove it, but we’ll keep it here for clarity.
 */
type Tables = Database['public']['Tables'];

/* ---------------------------------------------------------------------------
   1) Fetching a Character and its sub-data in one go
--------------------------------------------------------------------------- */

/**
 * Fetch the main character row (the record in 'characters' table).
 * Throws an HTTP-style error if not found or if a query error occurs.
 */
async function dbGetCharacterRow(characterId: number) {
  const { data, error: dbError } = await supabase
    .from('characters')
    .select('*')
    .eq('id', characterId)
    .single();

  if (dbError) {
    console.error('Error loading main character row:', dbError);
    throw error(500, 'Error loading main character row');
  }
  if (!data) {
    throw error(404, 'Character not found');
  }
  return data;
}

/**
 * getFullCharacterData()
 *
 * Returns a fully-hydrated Character object, combining:
 *  - the 'characters' table row, plus
 *  - sub-data from all relevant child tables (like 'character_attributes', 'character_buffs', etc.)
 *
 * In projects where you have separate `db/*.ts` modules (e.g., `buffs.ts`, `feats.ts`, etc.),
 * you can inline those calls here if you want to unify everything in one function.
 */
export async function getFullCharacterData(characterId: number): Promise<Character> {
  console.log('🔄 [character.ts] Loading full character data...');

  // 1) fetch the main row from "characters"
  const mainCharacterRow = await dbGetCharacterRow(characterId);

  // 2) fetch sub-tables in parallel. Below is an example that inlines queries
  //    for each sub-table. If you have separate `db/*.ts` files that export
  //    getXxxForCharacter calls, you can do that instead. For now, let’s do it inline:
  const [
    { data: attributes, error: attrErr },
    { data: buffs, error: buffsErr },
    { data: skillRanks, error: skillRanksErr },
    { data: feats, error: featsErr },
    { data: consumables, error: consErr },
    { data: combatStats, error: combatErr },
    { data: equipment, error: equipErr },
    { data: knownSpells, error: knownSpellsErr },
    { data: spellSlots, error: spellSlotsErr },
    { data: extracts, error: extractsErr },
    { data: corruptionManifests, error: corrManErr },
    { data: corruptions, error: corrErr },
    { data: traits, error: traitsErr },
    { data: ancestries, error: ancestryErr },
    { data: ancestralTraits, error: ancestralTraitsErr },
    // ...any other sub-tables you want
  ] = await Promise.all([
    supabase.from('character_attributes').select('*').eq('character_id', characterId),
    supabase.from('character_buffs').select('*').eq('character_id', characterId),
    supabase.from('character_skill_ranks').select('*').eq('character_id', characterId),
    supabase.from('character_feats').select('*').eq('character_id', characterId),
    supabase.from('character_consumables').select('*').eq('character_id', characterId),
    supabase.from('character_combat_stats').select('*').eq('character_id', characterId),
    supabase.from('character_equipment').select('*').eq('character_id', characterId),
    supabase.from('character_known_spells').select('*').eq('character_id', characterId),
    supabase.from('character_spell_slots').select('*').eq('character_id', characterId),
    supabase.from('character_extracts').select('*').eq('character_id', characterId),
    supabase
      .from('character_corruption_manifestations')
      .select('*')
      .eq('character_id', characterId),
    supabase.from('character_corruptions').select('*').eq('character_id', characterId),
    supabase.from('character_traits').select('*, base_traits(*)').eq('character_id', characterId),
    supabase
      .from('character_ancestries')
      .select(
        `
          *,
          ancestry:base_ancestries!inner (
            id,
            name,
            size,
            base_speed,
            ability_modifiers,
            description
          )
        `
      )
      .eq('character_id', characterId),
    supabase.from('character_ancestral_traits').select('*').eq('character_id', characterId),
  ]);

  // 3) Check for any query errors:
  const errorsFound = [
    attrErr,
    buffsErr,
    skillRanksErr,
    featsErr,
    consErr,
    combatErr,
    equipErr,
    knownSpellsErr,
    spellSlotsErr,
    extractsErr,
    corrManErr,
    corrErr,
    traitsErr,
    ancestryErr,
    ancestralTraitsErr,
  ].filter(Boolean);

  if (errorsFound.length > 0) {
    console.error('❌ [character.ts] Sub-query error(s):', errorsFound);
    throw error(500, 'Error loading sub-data for character');
  }

  // 4) Build final Character object
  //    (assuming your “Character” interface has all these fields)
  const character: Character = {
    ...mainCharacterRow,

    // sub-data assignments:
    character_attributes: attributes ?? [],
    character_buffs: (buffs ?? []).map((b) => ({
      ...b,
      // if your DB uses base_buff_id to reference the Buff type, cast to KnownBuffType as needed
      buff_type: b.base_buff_id?.toString() as KnownBuffType,
    })),
    character_skill_ranks: skillRanks ?? [],
    character_feats: feats ?? [],
    character_consumables: consumables ?? [],
    character_combat_stats: combatStats ?? [],
    character_equipment: equipment ?? [],
    character_known_spells: knownSpells ?? [],
    character_spell_slots: spellSlots ?? [],
    character_extracts: extracts ?? [],
    character_corruption_manifestations: corruptionManifests ?? [],
    character_corruptions: corruptions ?? [],
    character_traits: (traits ?? []).map((t) => ({
      ...t,
      // if there's a joined base_trait, rename or keep it as is:
      base_traits: t.base_traits || undefined,
    })),
    character_ancestries: (ancestries ?? []).map((a) => ({
      ...a,
      ancestry: a.ancestry
        ? {
            ...a.ancestry,
            ability_modifiers: isValidAbilityModifiers(a.ancestry.ability_modifiers)
              ? a.ancestry.ability_modifiers
              : {},
          }
        : undefined,
    })),
    character_ancestral_traits: ancestralTraits ?? [],

    // If you track base_skills or class_skill_relations, you can do that here:
    base_skills: [],
    class_skill_relations: [],
    // Possibly add other fields if your “Character” type demands them
    // (like character_abp_bonuses, or anything else).
    // For brevity we’ll skip or default them. E.g.:
    character_abp_bonuses: [],
    // ...
  };

  console.log('✅ [character.ts] Full Character data loaded successfully.');
  return character;
}

/* ---------------------------------------------------------------------------
   2) Real-time subscription for changes in 'characters' or sub-tables.
--------------------------------------------------------------------------- */

/**
 * Setup a real-time subscription for the given characterId,
 * passing changes to your callback functions for relevant tables.
 */
export function dbSetupRealtimeSubscription(
  characterId: number,
  onCharactersChange: (payload: RealtimePostgresChangesPayload<any>) => void,
  onAttrChange: (payload: RealtimePostgresChangesPayload<any>) => void,
  onCombatChange: (payload: RealtimePostgresChangesPayload<any>) => void,
  onConsumablesChange: (payload: RealtimePostgresChangesPayload<any>) => void,
  onBuffsChange: (payload: RealtimePostgresChangesPayload<any>) => void
): () => void {
  const channel = supabase.channel(`character-${characterId}`);

  channel
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'characters',
        filter: `id=eq.${characterId}`,
      },
      onCharactersChange
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'character_attributes',
        filter: `character_id=eq.${characterId}`,
      },
      onAttrChange
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'character_combat_stats',
        filter: `character_id=eq.${characterId}`,
      },
      onCombatChange
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'character_consumables',
        filter: `character_id=eq.${characterId}`,
      },
      onConsumablesChange
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'character_buffs',
        filter: `character_id=eq.${characterId}`,
      },
      onBuffsChange
    )
    .subscribe();

  // Provide an unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}

/* ---------------------------------------------------------------------------
   3) Various single-field updates (non-aggregated).
--------------------------------------------------------------------------- */

/** Update bombs_left in character_combat_stats */
export async function dbUpdateBombs(characterId: number, bombs: number) {
  const { error: err } = await supabase
    .from('character_combat_stats')
    .update({ bombs_left: bombs })
    .eq('character_id', characterId);

  if (err) throw new Error(err.message);
}

/** Update a single consumable item by key */
export async function dbUpdateConsumable(characterId: number, type: ConsumableKey, value: number) {
  const { error: err } = await supabase
    .from('character_consumables')
    .update({ [type]: value })
    .eq('character_id', characterId);

  if (err) throw new Error(err.message);
}

/** Update a single attribute (STR, DEX, etc.) */
export async function dbUpdateAttribute(characterId: number, attr: AttributeKey, value: number) {
  const { error: err } = await supabase
    .from('character_attributes')
    .update({ [attr]: value })
    .eq('character_id', characterId);

  if (err) throw new Error(err.message);
}

/** Update skill ranks for a given skill_id */
export async function dbUpdateSkillRank(characterId: number, skillId: number, ranks: number) {
  const { error: err } = await supabase
    .from('character_skill_ranks')
    .update({ ranks })
    .eq('character_id', characterId)
    .eq('skill_id', skillId);

  if (err) throw new Error(err.message);
}

/** Update current HP in the characters table */
export async function dbUpdateHP(characterId: number, newValue: number) {
  const { error: err } = await supabase
    .from('characters')
    .update({ current_hp: newValue })
    .eq('id', characterId);

  if (err) throw new Error(err.message);
}

/** Update a single spell slot's remaining count */
export async function dbUpdateSpellSlot(characterId: number, level: number, remaining: number) {
  const { error: err } = await supabase
    .from('character_spell_slots')
    .update({ remaining })
    .eq('character_id', characterId)
    .eq('spell_level', level);

  if (err) throw new Error(err.message);
}

/** Update a single extract row (partial) */
export async function dbUpdateExtract(
  characterId: number,
  extractId: number,
  updates: Omit<Partial<Tables['character_extracts']['Row']>, 'id'>
) {
  const { error: err } = await supabase
    .from('character_extracts')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
      // if we want to enforce default 0 for prepared/used if not provided:
      prepared: updates.prepared ?? 0,
      used: updates.used ?? 0,
    })
    .eq('id', extractId)
    .eq('character_id', characterId);

  if (err) throw new Error(err.message);
}

/** Toggle a buff on or off */
export async function dbToggleBuff(characterId: number, buffType: KnownBuffType, isActive: boolean) {
  const { error: err } = await supabase
    .from('character_buffs')
    .update({ is_active: isActive })
    .eq('character_id', characterId)
    .eq('buff_type', buffType);

  if (err) throw new Error(err.message);
}

/* ---------------------------------------------------------------------------
   4) Example of specialized ABP bonus update
--------------------------------------------------------------------------- */

/** Update an ABP bonus */
export async function dbUpdateABPBonus(
  characterId: number,
  bonusType: ABPBonusType,
  value: number,
  valueTarget?: string
) {
  const { error: err } = await supabase
    .from('character_abp_bonuses')
    .update({
      value,
      value_target: valueTarget,
    })
    .eq('character_id', characterId)
    .eq('bonus_type', bonusType);

  if (err) throw new Error(err.message);
}

/**
 * Example partial fetch: skill data
 * (If needed in-lieu of or in addition to getFullCharacterData)
 */
export async function dbFetchSkillData(characterId: number, characterClass: string | null) {
  if (!characterClass) {
    throw new Error('characterClass is required to fetch skill data');
  }

  const [baseSkillsRes, skillRanksRes, classSkillsRes] = await Promise.all([
    supabase.from('base_skills').select('*'),
    supabase.from('character_skill_ranks').select('*').eq('character_id', characterId),
    supabase.from('class_skill_relations').select('*').eq('class_name', characterClass),
  ]);

  const errs = [baseSkillsRes.error, skillRanksRes.error, classSkillsRes.error].filter(Boolean);
  if (errs.length > 0) {
    throw new Error(`Error fetching skill data: ${JSON.stringify(errs)}`);
  }

  return {
    baseSkills: baseSkillsRes.data ?? [],
    skillRanks: skillRanksRes.data ?? [],
    classSkillRelations: classSkillsRes.data ?? [],
  };
}

/**
 * Example partial fetch: favored class bonuses & ancestry data
 */
export async function dbFetchPartialCharacterData(characterId: number) {
  const [fcbRes, ancestryRes] = await Promise.all([
    supabase.from('character_favored_class_bonuses').select('*').eq('character_id', characterId),
    supabase
      .from('character_ancestries')
      .select(
        `
          *,
          ancestry:base_ancestries!inner (
            id,
            name,
            size,
            base_speed,
            ability_modifiers,
            description
          )
        `
      )
      .eq('character_id', characterId),
  ]);

  const errs = [fcbRes.error, ancestryRes.error].filter(Boolean);
  if (errs.length > 0) {
    throw new Error(`Error fetching partial data: ${JSON.stringify(errs)}`);
  }

  return {
    favoredClassBonuses: fcbRes.data ?? [],
    ancestryRows: ancestryRes.data ?? [],
  };
}

function isValidAbilityModifiers(value: unknown): value is Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  
  return Object.entries(value).every(
    ([key, val]) => typeof key === 'string' && typeof val === 'number'
  );
}
