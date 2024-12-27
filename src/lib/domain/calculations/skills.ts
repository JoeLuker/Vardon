// FILE: src/lib/domain/calculations/skills.ts

import type { Character, CharacterAttributes } from '$lib/domain/types/character';
import type { KnownBuffType } from '$lib/domain/types/character';
import { getAbilityModifier } from './attributes';
import type { Buff } from '$lib/domain/types/buffs';

// Structures that define the final computed skill.
export interface ComputedSkill {
	skillId: number;
	name: string;
	ability: string; // e.g. "dex" or "int"
	totalBonus: number; // final total e.g. +9
	ranks: number; // e.g. 3
	abilityMod: number; // e.g. +2 from DEX
	classSkillBonus: number;
	armorCheckPenalty: number;
	miscBonus: number; // leftover buff or trait bonuses
	trainedOnly: boolean;
	isClassSkill: boolean;
}

/**
 * Main function to compute all skills bonuses for a character.
 */
export function computeAllSkills(
	character: Character,
	finalAttributes: CharacterAttributes,
	activeBuffs: KnownBuffType[],
	allBuffs: Buff[]
): ComputedSkill[] {
	const results: ComputedSkill[] = [];

	// Gather potential skill buffs or misc mods from active buffs
	const buffSkillMods = gatherSkillBuffMods(activeBuffs, allBuffs);

	// For armor check penalty from worn gear:
	const armorCheckPenalty = computeArmorCheckPenalty(character);

	// Ensure we have a list of base skills
	const baseSkills = character.base_skills ?? [];
	// skill ranks
	const skillRanks = character.character_skill_ranks ?? [];
	// class skill relations
	const classSkillRelations = character.class_skill_relations ?? [];

	// For convenience, put all class-skill skill_ids in a set
	const classSkillIds = new Set<number>();
	for (const rel of classSkillRelations) {
		// If rel.class_name == character.class (?), or if we always treat these as class skills for the character
		if (rel.class_name.toLowerCase() === character.class.toLowerCase()) {
			if (typeof rel.skill_id === 'number') {
				classSkillIds.add(rel.skill_id);
			}
		}
	}

	// Build a map of skill_id => total ranks
	// (some systems let you apply multiple rank entries at different levels)
	const rankMap = new Map<number, number>();
	for (const sr of skillRanks) {
		if (!sr.skill_id) continue;
		// sum them
		const oldVal = rankMap.get(sr.skill_id) ?? 0;
		rankMap.set(sr.skill_id, oldVal + sr.ranks);
	}

	for (const skill of baseSkills) {
		const skillId = skill.id;
		const skillName = skill.name;
		const skillAbility = skill.ability; // e.g. "dex","int" ...
		const isClass = classSkillIds.has(skill.id);
		const ranks = rankMap.get(skill.id) ?? 0;
		const abilityMod = getAbilityModifier(
			finalAttributes[skillAbility as keyof CharacterAttributes] || 10
		);

		// If the skill is a “trained-only” skill but character has 0 ranks => total = just ability? Or 0?
		// Typically in PF, if you have 0 ranks in a trained-only skill, you can’t roll it.
		// So you might set total to 0, or disclaim it. We'll keep calculating anyway.

		// The classic “+3 class skill bonus” if ranks>0 in PF
		let classSkillBonus = 0;
		if (isClass && ranks > 0) {
			classSkillBonus = 3;
		}

		// Armor check penalty if skill.armor_check_penalty == true
		let acp = 0;
		if (skill.armor_check_penalty) {
			acp = armorCheckPenalty;
		}

		// If you have buff-based skill mods, e.g. “Stealth +5 from chameleon power,” handle here:
		const buffBonus = buffSkillMods[skillName.toLowerCase()] ?? 0;

		// Additional "misc" or "trait" or "feat" bonuses could be read from feats or traits
		// For brevity, we skip them or do a small placeholder:
		const featOrTraitBonus = 0;

		// Now sum them
		const total = ranks + abilityMod + classSkillBonus + buffBonus + featOrTraitBonus - acp;

		results.push({
			skillId,
			name: skillName,
			ability: skillAbility,
			totalBonus: total,
			ranks,
			abilityMod,
			classSkillBonus,
			armorCheckPenalty: acp,
			miscBonus: buffBonus + featOrTraitBonus, // or separate them
			trainedOnly: skill.trained_only ?? false,
			isClassSkill: isClass
		});
	}

	return results;
}

/**
 * Example function to compute the total armor check penalty from
 * all worn equipment that might have an armor_check_penalty property.
 */
function computeArmorCheckPenalty(character: Character): number {
	let penalty = 0;
	for (const eq of character.character_equipment ?? []) {
		if (!eq.equipped) continue;
		if (eq.type === 'armor' || eq.type === 'shield') {
			const props = eq.properties as Record<string, number>;
			if (props?.armor_check_penalty) {
				penalty += props.armor_check_penalty;
			}
		}
	}
	return penalty;
}

/**
 * Gathers skill-specific bonuses from all active buffs.
 * Returns an object keyed by skillName (lowercased) => total bonus from buffs.
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
