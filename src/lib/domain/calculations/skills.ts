// FILE: src/lib/domain/calculations/skills.ts

import type { Character, CharacterSkillRank, DatabaseBaseSkill } from '$lib/domain/types/character';
import type { CharacterAttributes } from '$lib/domain/types/character';
import { getAbilityModifier } from './attributes'; // or wherever your getAbilityModifier is exported
import type { KnownBuffType } from '$lib/domain/types/character';
import { gatherSkillBuffMods } from './skillBuffs';
// ^ If you want to handle buff-based skill mods, define a helper. See sample below.

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
 * Main function to compute all skill bonuses for a character.
 *
 * 1) We gather each known skill from `base_skills`.
 * 2) We find how many ranks the character has in that skill (from `character_skill_ranks`).
 * 3) We check if it's a class skill (using `class_skill_relations`).
 * 4) We compute the final ability mod from the given finalAttributes.
 * 5) We handle possible armor check penalty if skill.armor_check_penalty == true
 * 6) We check for buff-based bonuses, or trait/feat-based bonuses, etc.
 * 7) Return a list of `ComputedSkill`.
 */
export function computeAllSkills(
	character: Character,
	finalAttributes: CharacterAttributes,
	activeBuffs: KnownBuffType[]
): ComputedSkill[] {
	const results: ComputedSkill[] = [];

	// Gather potential skill buffs or misc mods from active buffs
	const buffSkillMods = gatherSkillBuffMods(activeBuffs);
	// an object like { "Stealth": +2, "Perception": +3 } or something similar

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
 * Sample function that collects skill-specific bonuses from active buffs.
 * Maybe your Buff definitions or effect objects specify a skill by name or ID.
 *
 * This example returns an object keyed by skillName (lowercased) => numeric bonus.
 */
function gatherSkillBuffMods(activeBuffs: KnownBuffType[]): Record<string, number> {
	// In a real system, you’d read BuffEffect objects that mention skill_name or a general “skillBonus” field.
	// For now, a stub:
	const result: Record<string, number> = {};

	// e.g. if a buff says “+2 to Stealth,” do:
	// result['stealth'] = (result['stealth'] ?? 0) + 2;

	// Adapt this logic to your system’s buff effect structure.
	// ...
	return result;
}
