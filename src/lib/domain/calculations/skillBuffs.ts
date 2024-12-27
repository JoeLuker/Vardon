// FILE: src/lib/domain/calculations/skillBuffs.ts

import type { KnownBuffType } from '$lib/domain/types/character';
import { BUFF_CONFIG } from '$lib/domain/config/buffs';
// or wherever your Buff definitions are
import type { BuffEffect } from '$lib/domain/types/buffs';

/**
 * Gathers skill-specific bonuses from all active buffs.
 * Returns an object keyed by skill name (lowercased) => total bonus from buffs.
 *
 * For example, if you had a buff that granted +2 Stealth, it might appear in the
 * final record as { stealth: 2 }.
 */
export function gatherSkillBuffMods(activeBuffs: KnownBuffType[]): Record<string, number> {
	const result: Record<string, number> = {};

	for (const buffName of activeBuffs) {
		const buffDef = BUFF_CONFIG.find((b) => b.name === buffName);
		if (!buffDef) continue;

		for (const effect of buffDef.effects) {
			// Suppose your BuffEffect can optionally have a `skill_bonus` field like:
			//   { skill_bonus: { skill: 'Stealth', value: 3 } }
			// If so, parse it here and accumulate.
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
