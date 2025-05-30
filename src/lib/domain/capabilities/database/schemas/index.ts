/**
 * Schema Index
 * 
 * This module exports all schema descriptors for database entities.
 * It follows Unix principles by providing a single entry point for schema access.
 */

import { StandardSchemas } from '../SchemaDescriptor';
import { SpellSchema, CharacterSpellSchema, CharacterSpellSlotSchema, SpellListSchema, SpellListSpellSchema } from './SpellSchemas';
import { CharacterSchemas } from './CharacterSchemas';

/**
 * Combined schemas from all sources
 */
export const Schemas = {
  // Standard schemas
  ...StandardSchemas,
  
  // Character schemas
  ...CharacterSchemas,
  
  // Spell schemas
  Spell: SpellSchema,
  CharacterSpell: CharacterSpellSchema,
  CharacterSpellSlot: CharacterSpellSlotSchema,
  SpellList: SpellListSchema,
  SpellListSpell: SpellListSpellSchema
};