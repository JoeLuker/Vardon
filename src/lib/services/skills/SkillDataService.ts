/**
 * Skill Data Service - Handles skill data operations
 *
 * Following Unix principle: do one thing well
 * This service is responsible for loading and managing skill data
 */

import type { GameKernel } from '$lib/domain/kernel/GameKernel';
import type { ErrorCode } from '$lib/domain/kernel/ErrorHandler';
import { OpenMode } from '$lib/domain/kernel/types';
import { logger } from '$lib/utils/Logger';

export interface GameCharacterSkillRank {
	id: number;
	game_character_id: number;
	skill_id: number;
	applied_at_level: number;
}

export interface ProcessedSkill {
	id: number;
	name: string;
	label: string;
	ability: string;
	total: number;
	ranks: number;
	trainedOnly: boolean;
	isClassSkill: boolean;
	ranksByLevel: Array<number>;
	overrides?: {
		trained_only?: boolean;
		ability?: {
			original: string;
			override: string;
			source: string;
		};
	};
}

export interface SkillDataResult {
	byAbility: Record<string, ProcessedSkill[]>;
	allSkills: ProcessedSkill[];
}

export class SkillDataService {
	private kernel: GameKernel;
	private cache: Map<string, Map<number, { total: number; ranks: number }>> = new Map();

	constructor(kernel: GameKernel) {
		this.kernel = kernel;
	}

	/**
	 * Load skill data from character
	 */
	async loadSkillsData(character: any): Promise<SkillDataResult> {
		if (!character) {
			return {
				byAbility: {},
				allSkills: []
			};
		}

		try {
			const byAbility: Record<string, ProcessedSkill[]> = {};
			const processedSkills: ProcessedSkill[] = [];

			if (character.skills) {
				for (const [skillIdStr, skillData] of Object.entries(character.skills)) {
					const skillId = parseInt(skillIdStr);

					// Get base skill info from skill definitions
					const baseSkill = character.skill_definitions?.find((s: any) => s.id === skillId);
					if (!baseSkill) continue;

					const baseAbility = baseSkill.ability;
					const abilityName = (
						(skillData as any).overrides?.ability?.override ??
						baseAbility?.label ??
						'MISC'
					).toUpperCase();

					// Check if it's a class skill
					const isClassSkill =
						character.class_skills?.some((cs: any) => cs.skill_id === skillId) ?? false;

					const processed: ProcessedSkill = {
						id: baseSkill.id,
						name: baseSkill.name,
						label: baseSkill.label,
						ability: abilityName,
						total: (skillData as any).total,
						ranks: this.getSkillRanksCount(character, skillId),
						trainedOnly: (skillData as any).overrides?.trained_only ?? baseSkill.trained_only,
						isClassSkill,
						ranksByLevel: [],
						overrides: (skillData as any).overrides
					};

					if (!byAbility[abilityName]) byAbility[abilityName] = [];
					byAbility[abilityName].push(processed);
					processedSkills.push(processed);
				}
			}

			return {
				byAbility,
				allSkills: processedSkills
			};
		} catch (err: any) {
			logger.error('SkillDataService', 'loadSkillsData', 'Failed to load skills', { error: err });
			throw new Error(`Failed to load skills: ${err.message}`);
		}
	}

	/**
	 * Get skill ranks count for a specific skill
	 */
	getSkillRanksCount(character: any, skillId: number): number {
		if (!character) return 0;

		return (
			character.game_character_skill_rank?.filter(
				(rank: GameCharacterSkillRank) => rank.skill_id === skillId
			).length ?? 0
		);
	}

	/**
	 * Check if a skill has a rank at a specific level
	 */
	hasSkillRank(character: any, skillId: number, level: number): boolean {
		if (!character) return false;

		return !!character?.game_character_skill_rank?.some(
			(rank: GameCharacterSkillRank) => rank.skill_id === skillId && rank.applied_at_level === level
		);
	}

	/**
	 * Get cached skill data
	 */
	getCachedSkillData(
		characterId: string,
		skillId: number
	): { total: number; ranks: number } | undefined {
		const charCache = this.cache.get(characterId);
		return charCache?.get(skillId);
	}

	/**
	 * Update cached skill data
	 */
	updateCachedSkillData(
		characterId: string,
		skillId: number,
		data: { total: number; ranks: number }
	): void {
		if (!this.cache.has(characterId)) {
			this.cache.set(characterId, new Map());
		}
		const charCache = this.cache.get(characterId)!;
		charCache.set(skillId, data);
	}

	/**
	 * Clear cache for a character
	 */
	clearCache(characterId?: string): void {
		if (characterId) {
			this.cache.delete(characterId);
		} else {
			this.cache.clear();
		}
	}
}
