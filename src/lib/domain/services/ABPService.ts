/**
 * ABP Service - Handles Automatic Bonus Progression calculations
 * 
 * Following Unix principle: do one thing well
 * This service is responsible for ABP-related calculations and data
 */

import type { CompleteCharacter } from '../types/supabase';

export interface ABPBonus {
	target: string;
	type: string;
	value: number;
	source?: string;
}

export interface ABPNode {
	id: string;
	name: string;
	label: string;
	level: number;
}

export interface ABPData {
	nodes: ABPNode[];
	appliedBonuses: ABPBonus[];
	currentLevel: number;
	nextLevel: number;
}

export class ABPService {
	/**
	 * Get all ABP data for a character
	 */
	getABPData(character: CompleteCharacter): ABPData {
		const totalLevel = this.getTotalLevel(character);
		const nodes = this.getActiveNodes(character);
		const appliedBonuses = this.getAppliedBonuses(character);
		const nextLevel = this.getNextABPLevel(totalLevel);

		return {
			nodes,
			appliedBonuses,
			currentLevel: totalLevel,
			nextLevel
		};
	}

	/**
	 * Get total character level
	 */
	getTotalLevel(character: CompleteCharacter): number {
		return character.game_character_class?.reduce((sum, c) => sum + (c.level || 0), 0) || 1;
	}

	/**
	 * Get active ABP nodes for the character
	 */
	getActiveNodes(character: CompleteCharacter): ABPNode[] {
		// Get ABP choices made by the character
		const abpChoices = character.game_character_abp_choice || [];
		
		return abpChoices.map(choice => ({
			id: choice.id,
			name: choice.abp_node?.name || 'Unknown',
			label: choice.abp_node?.label || choice.abp_node?.name || 'Unknown',
			level: choice.abp_node?.level || 1
		}));
	}

	/**
	 * Get applied bonuses from ABP
	 */
	getAppliedBonuses(character: CompleteCharacter): ABPBonus[] {
		const bonuses: ABPBonus[] = [];
		const totalLevel = this.getTotalLevel(character);

		// Get bonuses from ABP choices
		const abpChoices = character.game_character_abp_choice || [];
		
		for (const choice of abpChoices) {
			const node = choice.abp_node;
			if (!node || node.level > totalLevel) continue;

			// Get bonuses from this node
			const nodeBonuses = node.abp_node_bonus || [];
			for (const nodeBonus of nodeBonuses) {
				const bonus = nodeBonus.abp_bonus_type;
				if (bonus) {
					bonuses.push({
						target: bonus.target || 'unknown',
						type: bonus.type || 'enhancement',
						value: nodeBonus.value || 0,
						source: `${node.name} (Level ${node.level})`
					});
				}
			}
		}

		// Add level-based bonuses that don't require choices
		bonuses.push(...this.getLevelBasedBonuses(totalLevel));

		return bonuses;
	}

	/**
	 * Get next ABP level
	 */
	getNextABPLevel(currentLevel: number): number {
		const abpLevels = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 18, 19];
		const nextLevel = abpLevels.find(l => l > currentLevel);
		return nextLevel || 20;
	}

	/**
	 * Get level-based bonuses that don't require choices
	 */
	private getLevelBasedBonuses(level: number): ABPBonus[] {
		const bonuses: ABPBonus[] = [];

		// Armor attunement bonuses
		if (level >= 3) {
			bonuses.push({
				target: 'armor',
				type: 'armor',
				value: Math.floor((level - 1) / 4) + 1,
				source: 'Armor Attunement'
			});
		}

		// Shield attunement bonuses  
		if (level >= 4) {
			bonuses.push({
				target: 'shield',
				type: 'shield',
				value: Math.floor((level - 2) / 4) + 1,
				source: 'Shield Attunement'
			});
		}

		// Resistance bonuses
		if (level >= 5) {
			bonuses.push({
				target: 'saves',
				type: 'resistance',
				value: Math.floor((level - 3) / 4) + 1,
				source: 'Resistance Attunement'
			});
		}

		return bonuses;
	}

	/**
	 * Group bonuses by type for display
	 */
	groupBonusesByType(bonuses: ABPBonus[]): Map<string, ABPBonus[]> {
		const groups = new Map<string, ABPBonus[]>();

		for (const bonus of bonuses) {
			const type = bonus.type || 'untyped';
			if (!groups.has(type)) {
				groups.set(type, []);
			}
			groups.get(type)!.push(bonus);
		}

		return groups;
	}

	/**
	 * Check if character qualifies for ABP bonuses
	 */
	isABPEligible(character: CompleteCharacter): boolean {
		return this.getTotalLevel(character) >= 3;
	}

	/**
	 * Get ABP progression summary
	 */
	getProgressionSummary(character: CompleteCharacter): {
		current: string;
		next: string;
		eligible: boolean;
	} {
		const level = this.getTotalLevel(character);
		const eligible = this.isABPEligible(character);
		const nextLevel = this.getNextABPLevel(level);

		let current: string;
		let next: string;

		if (level < 3) {
			current = 'No ABP bonuses yet';
			next = 'ABP bonuses begin at level 3';
		} else if (level >= 19) {
			current = 'Maximum ABP progression reached';
			next = 'No further progression';
		} else {
			current = `Level ${level} ABP bonuses active`;
			next = `Next ABP bonus at level ${nextLevel}`;
		}

		return { current, next, eligible };
	}
}