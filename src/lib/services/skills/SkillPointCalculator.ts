/**
 * Skill Point Calculator - Handles skill point calculations
 *
 * Following Unix principle: do one thing well
 * This service is responsible for calculating skill points and remaining points
 */

import type { GameCharacterSkillRank } from './SkillDataService';

export interface SkillPointData {
	total: Record<number, { total: number }>;
	remaining: Record<number, number>;
}

export class SkillPointCalculator {
	/**
	 * Calculate remaining skill points for a level
	 */
	getRemainingPoints(
		character: any,
		level: number,
		optimisticPoints?: Map<number, number>
	): number {
		if (!character?.skillPoints?.remaining) return 0;

		// If we have an optimistic value for this level, use it
		if (optimisticPoints?.has(level)) {
			return optimisticPoints.get(level) as number;
		}

		// Otherwise use actual data
		return character.skillPoints.remaining[level] ?? 0;
	}

	/**
	 * Calculate total skill points for a level
	 */
	getTotalPoints(character: any, level: number): number {
		return character?.skillPoints?.total[level]?.total ?? 0;
	}

	/**
	 * Get skill ranks at a specific level
	 */
	getRanksAtLevel(character: any, level: number): GameCharacterSkillRank[] {
		return (
			character?.game_character_skill_rank?.filter(
				(rank: GameCharacterSkillRank) => rank.applied_at_level === level
			) ?? []
		);
	}

	/**
	 * Calculate used skill points for a level
	 */
	getUsedPoints(character: any, level: number, optimisticPoints?: Map<number, number>): number {
		const total = this.getTotalPoints(character, level);
		const remaining = this.getRemainingPoints(character, level, optimisticPoints);
		return total - remaining;
	}

	/**
	 * Calculate percentage of skill points used
	 */
	getUsedPercentage(character: any, level: number, optimisticPoints?: Map<number, number>): number {
		const total = this.getTotalPoints(character, level);
		if (total <= 0) return 0;

		const used = this.getUsedPoints(character, level, optimisticPoints);
		return (used / total) * 100;
	}

	/**
	 * Check if character has enough skill points to add a rank
	 */
	canAddRank(character: any, level: number, optimisticPoints?: Map<number, number>): boolean {
		return this.getRemainingPoints(character, level, optimisticPoints) > 0;
	}

	/**
	 * Get skill point allocation summary for all levels
	 */
	getSkillPointSummary(character: any): Array<{
		level: number;
		total: number;
		used: number;
		remaining: number;
		percentage: number;
		ranksCount: number;
	}> {
		if (!character?.totalLevel) return [];

		const summary = [];
		for (let level = 1; level <= character.totalLevel; level++) {
			const total = this.getTotalPoints(character, level);
			const remaining = this.getRemainingPoints(character, level);
			const used = total - remaining;
			const percentage = total > 0 ? (used / total) * 100 : 0;
			const ranks = this.getRanksAtLevel(character, level);

			summary.push({
				level,
				total,
				used,
				remaining,
				percentage,
				ranksCount: ranks.length
			});
		}

		return summary;
	}
}
