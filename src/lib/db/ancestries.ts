// FILE: src/lib/db/ancestries.ts

import { supabase } from '$lib/db/supabaseClient';
import { readable, type Readable } from 'svelte/store';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { parseRow } from '$lib/db/utils';
import type { Database } from '$lib/domain/types/supabase';

// -----------------------------
// Type Definitions
// -----------------------------

// Core ancestry types
export type AncestryRow = Database['public']['Tables']['base_ancestries']['Row'];
export type AncestralTraitRow = Database['public']['Tables']['base_ancestral_traits']['Row'];
export type AltAncestralTraitRow = Database['public']['Tables']['base_alt_ancestral_traits']['Row'];
export type AncestryAbilityModifierRow = Database['public']['Tables']['ancestry_ability_modifiers']['Row'];

// Character-specific types
export type CharacterAncestryRow = Database['public']['Tables']['character_ancestries']['Row'];
export type CharacterAncestralTraitRow = Database['public']['Tables']['character_ancestral_traits']['Row'];
export type CharacterAltTraitRow = Database['public']['Tables']['character_alt_ancestral_traits']['Row'];

// Trait component types
export type TraitBonusFeatRow = Database['public']['Tables']['ancestral_trait_bonus_feats']['Row'];
export type TraitConditionalBonusRow = Database['public']['Tables']['ancestral_trait_conditional_bonuses']['Row'];
export type TraitNaturalAttackRow = Database['public']['Tables']['ancestral_trait_natural_attacks']['Row'];
export type TraitSkillBonusRow = Database['public']['Tables']['ancestral_trait_skill_bonuses']['Row'];
export type TraitSpecialRow = Database['public']['Tables']['ancestral_trait_specials']['Row'];
export type TraitVisionRow = Database['public']['Tables']['ancestral_trait_visions']['Row'];
export type TraitWeaponProficiencyRow = Database['public']['Tables']['ancestral_trait_weapon_proficiencies']['Row'];
export type AltTraitReplacementRow = Database['public']['Tables']['alt_trait_replacements']['Row'];

// Extended interfaces for related data
export interface AncestralTraitWithDetails extends AncestralTraitRow {
  bonus_feats: TraitBonusFeatRow[];
  conditional_bonuses: TraitConditionalBonusRow[];
  natural_attacks: TraitNaturalAttackRow[];
  skill_bonuses: TraitSkillBonusRow[];
  specials: TraitSpecialRow[];
  visions: TraitVisionRow[];
  weapon_proficiencies: TraitWeaponProficiencyRow[];
}

export interface AncestryWithRelations extends AncestryRow {
  ability_modifiers: AncestryAbilityModifierRow[];
  ancestral_traits: AncestralTraitWithDetails[];
  alt_ancestral_traits: (AltAncestralTraitRow & {
    replacements: AltTraitReplacementRow[];
  })[];
}

// Real-time types
export interface CharacterAncestryChangeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  newRow: CharacterAncestryRow | null;
  oldRow: CharacterAncestryRow | null;
}

// Error hierarchy for better error handling
export class AncestryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AncestryError';
  }
}

export class ValidationError extends AncestryError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ConflictError extends AncestryError {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

// -----------------------------
// Real-time Subscriptions
// -----------------------------

export interface TraitChangeEvent {
  type: 'add' | 'remove' | 'update';
  traitId: number;
  characterId: number;
  timestamp: Date;
}

export function watchTraitChanges(characterId: number): Readable<TraitChangeEvent[]> {
  return readable<TraitChangeEvent[]>([], (_set) => {
    const channel = supabase.channel(`trait_changes_${characterId}`);

    // Implementation here
    return () => {
      channel.unsubscribe();
    };
  });
}

export function watchCharacterAncestry(characterId: number): Readable<CharacterAncestryChangeEvent[]> {
  return readable<CharacterAncestryChangeEvent[]>([], (set) => {
    let internalArray: CharacterAncestryChangeEvent[] = [];
    const channel = supabase.channel(`character_ancestry_${characterId}`);
    
    const handlePayload = (payload: RealtimePostgresChangesPayload<Partial<CharacterAncestryRow>>) => {
      const newRow = parseRow<CharacterAncestryRow>(payload.new);
      const oldRow = parseRow<CharacterAncestryRow>(payload.old);
      
      const event: CharacterAncestryChangeEvent = {
        eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
        newRow,
        oldRow
      };
      
      internalArray = [...internalArray, event];
      set(internalArray);
    };

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'character_ancestries',
        filter: `character_id=eq.${characterId}`
      },
      handlePayload
    ).subscribe();

    return () => {
      channel.unsubscribe();
    };
  });
}

/**
 * Check if a character has any conflicting alternative traits
 */
export async function checkAltTraitConflicts(
  characterId: number,
  altTraitId: number
): Promise<number[]> {
  const replacedTraitIds = await getReplacedTraitsForAltTrait(altTraitId);
  
  const { data, error } = await supabase
    .from('character_ancestral_traits')
    .select('ancestral_trait_id')
    .eq('character_id', characterId)
    .in('ancestral_trait_id', replacedTraitIds);

  if (error) throw new Error(error.message);
  return (data ?? [])
    .map(row => row.ancestral_trait_id)
    .filter((id): id is number => id !== null);
}

/**
 * Validate if a character meets the requirements for an ancestral trait
 */
export async function validateTraitRequirements(
  characterId: number,
  traitId: number
): Promise<boolean> {
  const { data: trait, error: traitError } = await supabase
    .from('base_ancestral_traits')
    .select('*')
    .eq('id', traitId)
    .single();

  if (traitError) throw new Error(traitError.message);

  const { data: charAncestry, error: ancestryError } = await supabase
    .from('character_ancestries')
    .select('ancestry_id')
    .eq('character_id', characterId)
    .single();

  if (ancestryError) throw new Error(ancestryError.message);

  return trait.ancestry_name === charAncestry.ancestry_id;
}

// -----------------------------
// Trait Components
// -----------------------------

export const traitComponents = {
  bonusFeat: {
    add: async (traitId: number, featName: string): Promise<TraitBonusFeatRow> => {
      const { data, error } = await supabase
        .from('ancestral_trait_bonus_feats')
        .insert({ ancestral_trait_id: traitId, feat_name: featName })
        .select()
        .single();

      if (error) throw new ValidationError(`Failed to add bonus feat: ${error.message}`);
      return data;
    },
    remove: async (id: number): Promise<void> => {
      const { error } = await supabase
        .from('ancestral_trait_bonus_feats')
        .delete()
        .eq('id', id);

      if (error) throw new ValidationError(`Failed to remove bonus feat: ${error.message}`);
    }
  },

  naturalAttack: {
    add: async (
      traitId: number, 
      attackType: string, 
      damage: string, 
      attackCount?: number
    ): Promise<TraitNaturalAttackRow> => {
      if (!await traitComponents.naturalAttack.validate(damage)) {
        throw new ValidationError('Invalid damage format');
      }

      const { data, error } = await supabase
        .from('ancestral_trait_natural_attacks')
        .insert({
          ancestral_trait_id: traitId,
          attack_type: attackType,
          damage,
          attack_count: attackCount
        })
        .select()
        .single();

      if (error) throw new ValidationError(`Failed to add natural attack: ${error.message}`);
      return data;
    },
    remove: async (id: number): Promise<void> => {
      const { error } = await supabase
        .from('ancestral_trait_natural_attacks')
        .delete()
        .eq('id', id);

      if (error) throw new ValidationError(`Failed to remove natural attack: ${error.message}`);
    },
    validate: async (damage: string): Promise<boolean> => {
      // Validate damage string format (e.g., "1d6", "2d8+4")
      const damagePattern = /^\d+d\d+(?:[+-]\d+)?$/;
      return damagePattern.test(damage);
    }
  },

  skillBonus: {
    add: async (
      traitId: number,
      skillName: string,
      bonus: number
    ): Promise<TraitSkillBonusRow> => {
      if (!await traitComponents.skillBonus.validate(skillName, bonus)) {
        throw new ValidationError('Invalid skill bonus parameters');
      }

      const { data, error } = await supabase
        .from('ancestral_trait_skill_bonuses')
        .insert({
          ancestral_trait_id: traitId,
          skill_name: skillName,
          bonus
        })
        .select()
        .single();

      if (error) throw new ValidationError(`Failed to add skill bonus: ${error.message}`);
      return data;
    },
    remove: async (id: number): Promise<void> => {
      const { error } = await supabase
        .from('ancestral_trait_skill_bonuses')
        .delete()
        .eq('id', id);

      if (error) throw new ValidationError(`Failed to remove skill bonus: ${error.message}`);
    },
    validate: async (skillName: string, bonus: number): Promise<boolean> => {
      if (bonus < -4 || bonus > 4) return false;
      
      const { data } = await supabase
        .from('base_skills')
        .select('name')
        .eq('name', skillName)
        .single();

      return !!data;
    }
  }
} as const;


/**
 * List all available ancestries (basic info only)
 */
export async function listAncestries(): Promise<AncestryRow[]> {
  const { data, error } = await supabase
    .from('base_ancestries')
    .select('*')
    .order('name');

  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Get detailed ancestry information including all related data
 */
export async function getAncestry(ancestryId: number): Promise<AncestryWithRelations> {
  const { data, error } = await supabase
    .from('base_ancestries')
    .select(`
      *,
      ability_modifiers(*),
      ancestral_traits:base_ancestral_traits(
        *,
        bonus_feats:ancestral_trait_bonus_feats(*),
        conditional_bonuses:ancestral_trait_conditional_bonuses(*),
        natural_attacks:ancestral_trait_natural_attacks(*),
        skill_bonuses:ancestral_trait_skill_bonuses(*),
        specials:ancestral_trait_specials(*),
        visions:ancestral_trait_visions(*),
        weapon_proficiencies:ancestral_trait_weapon_proficiencies(*)
      ),
      alt_ancestral_traits:base_alt_ancestral_traits(
        *,
        replacements:alt_trait_replacements(*)
      )
    `)
    .eq('id', ancestryId)
    .single();

  if (error) throw new Error(error.message);
  return data as AncestryWithRelations;
}

/**
 * Get available alternative traits for an ancestry
 */
export async function getAvailableAltTraits(ancestryId: number): Promise<AltAncestralTraitRow[]> {
  const { data, error } = await supabase
    .from('base_alt_ancestral_traits')
    .select('*')
    .eq('ancestry_id', ancestryId)
    .eq('is_optional', true)
    .order('name');

  if (error) throw new Error(error.message);
  return data ?? [];
}

// -----------------------------
// Character Ancestry Operations
// -----------------------------

/**
 * Get a character's full ancestry information
 */
export async function getCharacterAncestry(characterId: number): Promise<{
  ancestry: AncestryWithRelations;
  selected_traits: CharacterAncestralTraitRow[];
  selected_alt_traits: CharacterAltTraitRow[];
}> {
  const { data: charAncestry, error: charError } = await supabase
    .from('character_ancestries')
    .select('*, ancestry:ancestry_id(*)')
    .eq('character_id', characterId)
    .single();

  if (charError) throw new Error(charError.message);
  if (!charAncestry?.ancestry_id) throw new Error('No ancestry found for character');

  const ancestry = await getAncestry(charAncestry.ancestry_id);

  const { data: traits, error: traitsError } = await supabase
    .from('character_ancestral_traits')
    .select('*')
    .eq('character_id', characterId);

  if (traitsError) throw new Error(traitsError.message);

  const { data: altTraits, error: altTraitsError } = await supabase
    .from('character_alt_ancestral_traits')
    .select('*')
    .eq('character_id', characterId);

  if (altTraitsError) throw new Error(altTraitsError.message);

  return {
    ancestry,
    selected_traits: traits ?? [],
    selected_alt_traits: altTraits ?? []
  };
}

/**
 * Set a character's ancestry
 */
export async function setCharacterAncestry(
  characterId: number,
  ancestryId: number,
  isPrimary: boolean = true
): Promise<CharacterAncestryRow> {
  const { data, error } = await supabase
    .from('character_ancestries')
    .upsert({
      character_id: characterId,
      ancestry_id: ancestryId,
      is_primary: isPrimary,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// -----------------------------
// Trait Management
// -----------------------------

/**
 * Add an ancestral trait to a character
 */
export async function addCharacterAncestralTrait(
  characterId: number,
  traitId: number
): Promise<CharacterAncestralTraitRow> {
  const { data, error } = await supabase
    .from('character_ancestral_traits')
    .insert({
      character_id: characterId,
      ancestral_trait_id: traitId,
      sync_status: 'pending'
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Remove an ancestral trait from a character
 */
export async function removeCharacterAncestralTrait(
  characterId: number,
  traitId: number
): Promise<void> {
  const { error } = await supabase
    .from('character_ancestral_traits')
    .delete()
    .eq('character_id', characterId)
    .eq('ancestral_trait_id', traitId);

  if (error) throw new Error(error.message);
}

/**
 * Bulk update character's ancestral traits
 */
export async function bulkUpdateCharacterTraits(
  characterId: number,
  traitIds: number[]
): Promise<void> {
  const { error: removeError } = await supabase
    .from('character_ancestral_traits')
    .delete()
    .eq('character_id', characterId);

  if (removeError) throw new Error(removeError.message);

  if (traitIds.length > 0) {
    const { error: addError } = await supabase
      .from('character_ancestral_traits')
      .insert(
        traitIds.map(traitId => ({
          character_id: characterId,
          ancestral_trait_id: traitId,
          sync_status: 'pending' as const
        }))
      );

    if (addError) throw new Error(addError.message);
  }
}

// -----------------------------
// Alternative Trait Management
// -----------------------------

/**
 * Add an alternative ancestral trait to a character
 */
export async function addCharacterAltAncestralTrait(
  characterId: number,
  altTraitId: number
): Promise<CharacterAltTraitRow> {
  const { data: replacements, error: replError } = await supabase
    .from('alt_trait_replacements')
    .select('replaced_trait_id')
    .eq('alt_trait_id', altTraitId);

  if (replError) throw new Error(replError.message);

  const { data, error } = await supabase
    .from('character_alt_ancestral_traits')
    .insert({
      character_id: characterId,
      alt_trait_id: altTraitId
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (replacements && replacements.length > 0) {
    for (const replacement of replacements) {
      await removeCharacterAncestralTrait(characterId, replacement.replaced_trait_id);
    }
  }

  return data;
}

/**
 * Remove an alternative ancestral trait from a character
 */
export async function removeCharacterAltAncestralTrait(
  characterId: number,
  altTraitId: number
): Promise<void> {
  const { error } = await supabase
    .from('character_alt_ancestral_traits')
    .delete()
    .eq('character_id', characterId)
    .eq('alt_trait_id', altTraitId);

  if (error) throw new Error(error.message);
}

// -----------------------------
// Validation & Utility Functions
// -----------------------------

/**
 * Check if a trait can be replaced by an alternative trait
 */
export async function canReplaceTraitWithAlt(
  traitId: number,
  altTraitId: number
): Promise<boolean> {
  const { data, error } = await supabase
    .from('alt_trait_replacements')
    .select('*')
    .eq('alt_trait_id', altTraitId)
    .eq('replaced_trait_id', traitId)
    .single();

  if (error) return false;
  return !!data;
}

/**
 * Get all replaceable traits for an alternative trait
 */
export async function getReplacedTraitsForAltTrait(altTraitId: number): Promise<number[]> {
  const { data, error } = await supabase
    .from('alt_trait_replacements')
    .select('replaced_trait_id')
    .eq('alt_trait_id', altTraitId);

  if (error) throw new Error(error.message);
  return (data ?? []).map(row => row.replaced_trait_id).filter((id): id is number => id !== null);
}

/**
 * Check if a character already has a trait selected
 */
export async function isTraitSelected(
  characterId: number,
  traitId: number
): Promise<boolean> {
  const { data, error } = await supabase
    .from('character_ancestral_traits')
    .select('*')
    .eq('character_id', characterId)
    .eq('ancestral_trait_id', traitId)
    .single();

  if (error) return false;
  return !!data;
}