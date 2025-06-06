/**
 * Combat Service - Handles combat-related calculations
 * 
 * Following Unix principle: do one thing well
 * This service is responsible for combat stats calculations
 */

import type { CompleteCharacter } from '../types/supabase';
import type { CombatStats } from '../capabilities/combat/types';
import { AbilityService } from './AbilityService';

export interface SaveBreakdown {
	type: 'fortitude' | 'reflex' | 'will';
	label: string;
	total: number;
	base: number;
	modifiers: Array<{
		source: string;
		value: number;
		type?: string;
	}>;
}

export interface ACBreakdown {
	total: number;
	touch: number;
	flatFooted: number;
	modifiers: Array<{
		source: string;
		value: number;
		type: string;
		appliesToTouch: boolean;
		appliesToFlatFooted: boolean;
	}>;
}

export class CombatService {
	private abilityService: AbilityService;

	constructor() {
		this.abilityService = new AbilityService();
	}

	/**
	 * Get all saves with breakdowns
	 */
	getAllSaves(character: CompleteCharacter): Record<string, SaveBreakdown> {
		return {
			fortitude: this.getFortitudeSave(character),
			reflex: this.getReflexSave(character),
			will: this.getWillSave(character)
		};
	}

	/**
	 * Get Fortitude save with breakdown
	 */
	getFortitudeSave(character: CompleteCharacter): SaveBreakdown {
		const baseSave = character.base_fortitude_save || 0;
		const conScore = this.abilityService.getScore(character, 'constitution');
		const conModifier = conScore.modifier;
		
		const modifiers: SaveBreakdown['modifiers'] = [
			{ source: 'Base Save', value: baseSave, type: 'base' },
			{ source: 'Constitution', value: conModifier, type: 'ability' }
		];

		// Add resistance bonus from ABP if present
		const resistanceBonus = this.getABPResistanceBonus(character);
		if (resistanceBonus > 0) {
			modifiers.push({ source: 'Resistance (ABP)', value: resistanceBonus, type: 'resistance' });
		}

		// Add trait bonuses
		const traitBonus = this.getSaveTraitBonus(character, 'fortitude');
		if (traitBonus > 0) {
			modifiers.push({ source: 'Trait', value: traitBonus, type: 'trait' });
		}

		const total = modifiers.reduce((sum, mod) => sum + mod.value, 0);

		return {
			type: 'fortitude',
			label: 'Fortitude',
			total,
			base: baseSave,
			modifiers
		};
	}

	/**
	 * Get Reflex save with breakdown
	 */
	getReflexSave(character: CompleteCharacter): SaveBreakdown {
		const baseSave = character.base_reflex_save || 0;
		const dexScore = this.abilityService.getScore(character, 'dexterity');
		const dexModifier = dexScore.modifier;
		
		const modifiers: SaveBreakdown['modifiers'] = [
			{ source: 'Base Save', value: baseSave, type: 'base' },
			{ source: 'Dexterity', value: dexModifier, type: 'ability' }
		];

		// Add resistance bonus from ABP if present
		const resistanceBonus = this.getABPResistanceBonus(character);
		if (resistanceBonus > 0) {
			modifiers.push({ source: 'Resistance (ABP)', value: resistanceBonus, type: 'resistance' });
		}

		// Add trait bonuses
		const traitBonus = this.getSaveTraitBonus(character, 'reflex');
		if (traitBonus > 0) {
			modifiers.push({ source: 'Trait', value: traitBonus, type: 'trait' });
		}

		const total = modifiers.reduce((sum, mod) => sum + mod.value, 0);

		return {
			type: 'reflex',
			label: 'Reflex',
			total,
			base: baseSave,
			modifiers
		};
	}

	/**
	 * Get Will save with breakdown
	 */
	getWillSave(character: CompleteCharacter): SaveBreakdown {
		const baseSave = character.base_will_save || 0;
		const wisScore = this.abilityService.getScore(character, 'wisdom');
		const wisModifier = wisScore.modifier;
		
		const modifiers: SaveBreakdown['modifiers'] = [
			{ source: 'Base Save', value: baseSave, type: 'base' },
			{ source: 'Wisdom', value: wisModifier, type: 'ability' }
		];

		// Add resistance bonus from ABP if present
		const resistanceBonus = this.getABPResistanceBonus(character);
		if (resistanceBonus > 0) {
			modifiers.push({ source: 'Resistance (ABP)', value: resistanceBonus, type: 'resistance' });
		}

		// Add trait bonuses
		const traitBonus = this.getSaveTraitBonus(character, 'will');
		if (traitBonus > 0) {
			modifiers.push({ source: 'Trait', value: traitBonus, type: 'trait' });
		}

		const total = modifiers.reduce((sum, mod) => sum + mod.value, 0);

		return {
			type: 'will',
			label: 'Will',
			total,
			base: baseSave,
			modifiers
		};
	}

	/**
	 * Get armor class with breakdown
	 */
	getArmorClass(character: CompleteCharacter): ACBreakdown {
		const dexScore = this.abilityService.getScore(character, 'dexterity');
		const dexModifier = dexScore.modifier;

		const modifiers: ACBreakdown['modifiers'] = [
			{ 
				source: 'Base', 
				value: 10, 
				type: 'base',
				appliesToTouch: true,
				appliesToFlatFooted: true
			},
			{ 
				source: 'Dexterity', 
				value: dexModifier, 
				type: 'dex',
				appliesToTouch: true,
				appliesToFlatFooted: false
			}
		];

		// Add armor bonus
		const armorBonus = this.getArmorBonus(character);
		if (armorBonus > 0) {
			modifiers.push({
				source: 'Armor',
				value: armorBonus,
				type: 'armor',
				appliesToTouch: false,
				appliesToFlatFooted: true
			});
		}

		// Add shield bonus
		const shieldBonus = this.getShieldBonus(character);
		if (shieldBonus > 0) {
			modifiers.push({
				source: 'Shield',
				value: shieldBonus,
				type: 'shield',
				appliesToTouch: false,
				appliesToFlatFooted: true
			});
		}

		// Add natural armor bonus
		const naturalArmorBonus = this.getNaturalArmorBonus(character);
		if (naturalArmorBonus > 0) {
			modifiers.push({
				source: 'Natural Armor',
				value: naturalArmorBonus,
				type: 'natural',
				appliesToTouch: false,
				appliesToFlatFooted: true
			});
		}

		// Add ABP armor bonus
		const abpArmorBonus = this.getABPArmorBonus(character);
		if (abpArmorBonus > 0) {
			modifiers.push({
				source: 'Armor Attunement (ABP)',
				value: abpArmorBonus,
				type: 'armor',
				appliesToTouch: false,
				appliesToFlatFooted: true
			});
		}

		// Calculate totals
		const total = modifiers.reduce((sum, mod) => sum + mod.value, 0);
		const touch = modifiers
			.filter(mod => mod.appliesToTouch)
			.reduce((sum, mod) => sum + mod.value, 0);
		const flatFooted = modifiers
			.filter(mod => mod.appliesToFlatFooted)
			.reduce((sum, mod) => sum + mod.value, 0);

		return {
			total,
			touch,
			flatFooted,
			modifiers
		};
	}

	/**
	 * Get base attack bonus
	 */
	getBaseAttackBonus(character: CompleteCharacter): number {
		// Sum BAB from all classes
		return character.game_character_class?.reduce((total, classEntry) => {
			const level = classEntry.level || 0;
			const babProgression = classEntry.class?.bonus_attack_progression?.name || 'medium';
			
			// Calculate BAB based on progression type
			switch (babProgression) {
				case 'fast':
				case 'full':
					return total + level;
				case 'medium':
				case 'three_quarters':
					return total + Math.floor(level * 0.75);
				case 'slow':
				case 'half':
					return total + Math.floor(level * 0.5);
				default:
					return total;
			}
		}, 0) || 0;
	}

	/**
	 * Get HP total
	 */
	getHitPoints(character: CompleteCharacter): { current: number; max: number } {
		const conScore = this.abilityService.getScore(character, 'constitution');
		const conModifier = conScore.modifier;
		const totalLevel = character.game_character_class?.reduce((sum, c) => sum + (c.level || 0), 0) || 0;

		// Base HP from classes
		let maxHP = 0;
		character.game_character_class?.forEach((classEntry, index) => {
			const level = classEntry.level || 0;
			const hitDie = classEntry.class?.hit_die || 8;
			
			// First level gets max hit die
			if (index === 0 && level > 0) {
				maxHP += hitDie + conModifier;
				// Remaining levels
				maxHP += (level - 1) * (Math.floor(hitDie / 2) + 1 + conModifier);
			} else {
				// All levels for subsequent classes
				maxHP += level * (Math.floor(hitDie / 2) + 1 + conModifier);
			}
		});

		// Add favored class bonus if applicable
		const favoredClassHP = character.game_character_favored_class_bonus?.filter(
			fcb => fcb.benefit === 'hp'
		).length || 0;
		maxHP += favoredClassHP;

		// Current HP would need to be tracked separately
		return {
			current: maxHP, // Default to max
			max: maxHP
		};
	}

	// Helper methods

	private getABPResistanceBonus(character: CompleteCharacter): number {
		if (!character.abpData?.appliedBonuses) return 0;
		
		const resistanceBonus = character.abpData.appliedBonuses.find(
			b => b.target === 'saves' && b.type === 'resistance'
		);
		
		return resistanceBonus?.value || 0;
	}

	private getABPArmorBonus(character: CompleteCharacter): number {
		if (!character.abpData?.appliedBonuses) return 0;
		
		const armorBonus = character.abpData.appliedBonuses.find(
			b => b.target === 'armor' && b.type === 'armor'
		);
		
		return armorBonus?.value || 0;
	}

	private getSaveTraitBonus(character: CompleteCharacter, saveType: string): number {
		// Check character traits for save bonuses
		const traits = character.game_character_trait || [];
		
		// This would need to be expanded based on actual trait data
		// For now, return 0
		return 0;
	}

	private getArmorBonus(character: CompleteCharacter): number {
		// Get equipped armor
		const equippedArmor = character.game_character_armor?.find(a => a.is_equipped);
		return equippedArmor?.armor?.armor_bonus || 0;
	}

	private getShieldBonus(character: CompleteCharacter): number {
		// Get equipped shield
		const equippedShield = character.game_character_armor?.find(
			a => a.is_equipped && a.armor?.name?.toLowerCase().includes('shield')
		);
		return equippedShield?.armor?.shield_bonus || 0;
	}

	private getNaturalArmorBonus(character: CompleteCharacter): number {
		// This would check for natural armor from ancestry, spells, etc.
		// For now, return 0
		return 0;
	}
}