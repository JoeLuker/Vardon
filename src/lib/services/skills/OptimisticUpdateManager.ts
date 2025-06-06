/**
 * Optimistic Update Manager - Manages optimistic updates for skill ranks
 *
 * Following Unix principle: do one thing well
 * This service manages optimistic state updates while operations are pending
 */

import type { GameCharacterSkillRank } from './SkillDataService';

export class OptimisticUpdateManager {
	private optimisticRanks: Map<string, boolean> = new Map();
	private optimisticPoints: Map<number, number> = new Map();

	/**
	 * Apply optimistic update for a skill rank
	 */
	applyOptimisticUpdate(skillId: number, level: number, hasRank: boolean): void {
		const key = this.getSkillLevelKey(skillId, level);
		this.optimisticRanks.set(key, hasRank);
	}

	/**
	 * Apply optimistic update for skill points
	 */
	updateOptimisticPoints(level: number, points: number): void {
		this.optimisticPoints.set(level, points);
	}

	/**
	 * Check if skill has rank considering optimistic state
	 */
	hasSkillRank(character: any, skillId: number, level: number): boolean {
		const key = this.getSkillLevelKey(skillId, level);

		// Check optimistic state first
		if (this.optimisticRanks.has(key)) {
			return this.optimisticRanks.get(key)!;
		}

		// Fall back to actual data
		return !!character?.game_character_skill_rank?.some(
			(rank: GameCharacterSkillRank) => rank.skill_id === skillId && rank.applied_at_level === level
		);
	}

	/**
	 * Get skill ranks count considering optimistic state
	 */
	getSkillRanksCount(character: any, skillId: number): number {
		if (!character) return 0;

		// Count from actual character data
		const baseCount =
			character.game_character_skill_rank?.filter(
				(rank: GameCharacterSkillRank) => rank.skill_id === skillId
			).length ?? 0;

		// Adjust for optimistic changes
		let delta = 0;
		for (let level = 1; level <= (character.totalLevel ?? 0); level++) {
			const key = this.getSkillLevelKey(skillId, level);

			// Check if we have this rank in server data
			const serverHasRank =
				character.game_character_skill_rank?.some(
					(rank: GameCharacterSkillRank) =>
						rank.skill_id === skillId && rank.applied_at_level === level
				) ?? false;

			// Check if we have an optimistic update for this key
			if (this.optimisticRanks.has(key)) {
				const optimisticValue = this.optimisticRanks.get(key);

				if (optimisticValue && !serverHasRank) {
					// We want a rank that server doesn't have
					delta++;
				} else if (!optimisticValue && serverHasRank) {
					// We don't want a rank that server has
					delta--;
				}
			}
		}

		return baseCount + delta;
	}

	/**
	 * Clear optimistic update for a specific skill/level
	 */
	clearOptimisticUpdate(skillId: number, level: number): void {
		const key = this.getSkillLevelKey(skillId, level);
		this.optimisticRanks.delete(key);
	}

	/**
	 * Clear all optimistic updates
	 */
	clearAllOptimistic(): void {
		this.optimisticRanks.clear();
		this.optimisticPoints.clear();
	}

	/**
	 * Get optimistic ranks map
	 */
	getOptimisticRanks(): Map<string, boolean> {
		return new Map(this.optimisticRanks);
	}

	/**
	 * Get optimistic points map
	 */
	getOptimisticPoints(): Map<number, number> {
		return new Map(this.optimisticPoints);
	}

	/**
	 * Rollback optimistic update
	 */
	rollbackOptimisticUpdate(skillId: number, level: number): void {
		this.clearOptimisticUpdate(skillId, level);
	}

	/**
	 * Get key for skill-level pair
	 */
	private getSkillLevelKey(skillId: number, level: number): string {
		return `${skillId}-${level}`;
	}
}
