// FILE: src/lib/domain/calculations/skillBuffs.ts

import type { KnownBuffType } from '$lib/domain/types/character';
import type { Buff } from '$lib/domain/types/buffs';

/**
 * Gathers skill-specific bonuses from all active buffs.
 * Returns an object keyed by skill name (lowercased) => total bonus from buffs.
 *
 * For example, if you had a buff that granted +2 Stealth, it might appear in the
 * final record as { stealth: 2 }.
 */
export function gatherSkillBuffMods(
	activeBuffs: KnownBuffType[],
	allBuffs: Buff[]
): Record<string, number> {
	const result: Record<string, number> = {};

	for (const buffName of activeBuffs) {
		const buffDef = allBuffs.find((buff) => buff.name === buffName);
		if (!buffDef) continue;

		for (const effect of buffDef.effects) {
			// Check for skill bonus in effect properties
			const skillBonus = (effect as any).skill_bonus as
				| { skill: string; value: number }
				| undefined;

			if (skillBonus) {
				const skillName = skillBonus.skill.toLowerCase();
				const bonusValue = skillBonus.value;
				// Accumulate
				result[skillName] = (result[skillName] ?? 0) + bonusValue;
			}
		}
	}

	return result;
}
