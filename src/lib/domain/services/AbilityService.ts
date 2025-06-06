/**
 * AbilityService - Simple service for ability score operations
 * Does ONE thing: manages ability scores
 */

import type { CompleteCharacter } from '../types/supabase';

export interface AbilityScore {
	name: string;
	base: number;
	total: number;
	modifier: number;
	modifiers: Array<{
		source: string;
		value: number;
		type: string;
	}>;
}

export class AbilityService {
	private static readonly ABILITIES = [
		'strength',
		'dexterity', 
		'constitution',
		'intelligence',
		'wisdom',
		'charisma'
	];

	/**
	 * Get all ability scores for a character
	 */
	getAllScores(character: CompleteCharacter): Record<string, AbilityScore> {
		const scores: Record<string, AbilityScore> = {};

		for (const abilityName of AbilityService.ABILITIES) {
			scores[abilityName] = this.getScore(character, abilityName);
		}

		return scores;
	}

	/**
	 * Get a single ability score with breakdown
	 */
	getScore(character: CompleteCharacter, abilityName: string): AbilityScore {
		// Get base value from character abilities
		const base = this.getBaseScore(character, abilityName);
		
		// Get all modifiers
		const modifiers = this.getModifiers(character, abilityName);
		
		// Calculate total
		const total = base + modifiers.reduce((sum, mod) => sum + mod.value, 0);
		
		// Calculate modifier
		const modifier = Math.floor((total - 10) / 2);

		return {
			name: abilityName,
			base,
			total,
			modifier,
			modifiers
		};
	}

	/**
	 * Get base ability score
	 */
	private getBaseScore(character: CompleteCharacter, abilityName: string): number {
		// Find the ability in game_character_ability
		const charAbility = character.game_character_ability?.find(
			(a) => a.ability?.name?.toLowerCase() === abilityName.toLowerCase()
		);

		return charAbility?.value || 10; // Default to 10 if not found
	}

	/**
	 * Get all modifiers for an ability
	 */
	private getModifiers(character: CompleteCharacter, abilityName: string): AbilityScore['modifiers'] {
		const modifiers: AbilityScore['modifiers'] = [];

		// Add ancestry bonuses
		const ancestry = character.game_character_ancestry?.[0]?.ancestry;
		if (ancestry?.name === 'tengu' && abilityName === 'dexterity') {
			modifiers.push({
				source: 'Tengu Ancestry',
				value: 2,
				type: 'racial'
			});
		}
		if (ancestry?.name === 'tengu' && abilityName === 'wisdom') {
			modifiers.push({
				source: 'Tengu Ancestry',
				value: 2,
				type: 'racial'
			});
		}
		if (ancestry?.name === 'tengu' && abilityName === 'constitution') {
			modifiers.push({
				source: 'Tengu Ancestry',
				value: -2,
				type: 'racial'
			});
		}

		// Add level-based ability increases (every 4 levels)
		const level = character.game_character_class?.[0]?.level || 1;
		const abilityIncreases = Math.floor(level / 4);
		// TODO: Track which abilities got the increases

		// Add enhancement bonuses from items
		// TODO: Check equipment for ability-enhancing items

		// Add other bonuses
		// TODO: Check feats, class features, etc.

		return modifiers;
	}

	/**
	 * Calculate ability modifier from score
	 */
	static getModifier(score: number): number {
		return Math.floor((score - 10) / 2);
	}
}