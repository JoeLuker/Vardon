// Improved TypeScript type definitions for Supabase schema
import { Database } from '../../database.types';

/**
 * Shorthand for accessing table types
 */
export type Tables<T extends keyof Database['public']['Tables']> =
	Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
	Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
	Database['public']['Tables'][T]['Update'];

/**
 * Character-related types
 */
export type Character = Tables<'game_character'>;
export type CharacterAbility = Tables<'game_character_ability'>;
export type CharacterClass = Tables<'game_character_class'>;
export type CharacterFeat = Tables<'game_character_feat'>;
export type CharacterSkill = Tables<'game_character_skill_rank'>;
export type CharacterAncestry = Tables<'game_character_ancestry'>;

/**
 * Core game system types
 */
export type Ability = Tables<'ability'>;
export type Class = Tables<'class'>;
export type Feat = Tables<'feat'>;
export type Skill = Tables<'skill'>;
export type Ancestry = Tables<'ancestry'>;
export type ClassFeature = Tables<'class_feature'>;
export type Spell = Tables<'spell'>;

/**
 * Complete character data type with joined relations
 */
export interface CompleteCharacter extends Character {
	game_character_ability: (CharacterAbility & {
		ability: Ability;
	})[];
	game_character_class: (CharacterClass & {
		class: Class & {
			class_feature?: ClassFeature[];
		};
	})[];
	game_character_ancestry: (CharacterAncestry & {
		ancestry: Ancestry;
	})[];
	game_character_feat?: (CharacterFeat & {
		feat: Feat;
	})[];
	game_character_skill_rank?: (CharacterSkill & {
		skill: Skill & {
			ability: Ability;
		};
	})[];
	// Add other relevant character relations as needed
}

/**
 * Database Helper Types
 */
export type Json = Database['public']['Tables']['rule']['Row']['content'];
