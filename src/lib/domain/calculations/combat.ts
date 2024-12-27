// FILE: src/lib/domain/calculations/combat.ts

import type { Character, KnownBuffType } from '$lib/domain/types/character';
import type { Buff } from '$lib/domain/types/buffs';
import type { CharacterAttributes } from '$lib/domain/types/character';
import { getAbilityModifier } from '$lib/domain/calculations/attributes';
import { getABPValue } from '$lib/domain/calculations/abp';

/**
 * A structure for final, computed combat stats that includes
 * attack bonuses, AC, saves, CMB, CMD, and more.
 *
 * You can expand or rename fields based on your system's needs.
 */
export interface CombatStats {
	// Basic Attack Info
	baseAttackBonus: number;
	meleeAttack: string; // e.g. “+6 / +1 (Power Attack)”
	rangedAttack: string; // e.g. “+7 / +2 / +2 (Rapid Shot)”

	// AC Computation
	acNormal: number;
	acTouch: number;
	acFlatFooted: number;

	// Special or derived values
	initiative: number;
	cmb: number;
	cmd: number;

	// Saving Throws
	fort: number;
	ref: number;
	will: number;
}

/**
 * Main entry point to compute final combat stats:
 *  1) Ensure you have final attributes (after ancestry, ABP, buffs).
 *  2) This function collects size mods, ABP armor/weapon attunements,
 *     feats like Power Attack or Deadly Aim, plus BFS for dynamic buffs.
 *  3) Returns a `CombatStats` object with your final numbers:
 *     - Attack strings (iterative plus extras)
 *     - AC (normal, touch, flat-footed)
 *     - Saves (Fort, Ref, Will)
 *     - CMB, CMD
 */
export function computeAllCombatStats(
	character: Character,
	finalAttributes: CharacterAttributes,
	activeBuffNames: KnownBuffType[],
	allBuffs: Buff[] // <-- pass in the loaded buffs from DB
): CombatStats {
	// 1) Basic references to your final ability modifiers
	const strMod = getAbilityModifier(finalAttributes.str);
	const dexMod = getAbilityModifier(finalAttributes.dex);
	const conMod = getAbilityModifier(finalAttributes.con);
	const wisMod = getAbilityModifier(finalAttributes.wis);

	// 2) Identify the base attack bonus.
	const bab = character.character_combat_stats?.[0]?.base_attack_bonus ?? 0;

	// 3) Determine size modifiers if any
	const sizeCategory = deriveSizeCategory(character, activeBuffNames);
	const sizeMod = getSizeModifier(sizeCategory);

	// 4) Gather ABP bonuses relevant to combat
	const deflectionBonus = getABPValue(character, 'deflection'); 
	const armorAttunement = getABPValue(character, 'armor');

	// 5) Collect feats (e.g. "Power Attack", "Rapid Shot")
	const featSet = new Set(
		character.character_feats?.map((f) => {
			// Now TypeScript knows about the joined base_feats data
			return (f.base_feats?.name ?? '').toLowerCase();
		}) ?? []
	);

	// 6) Buff-based mods: +attack, +damage, +AC, +saves, etc.
	const buffMods = collectBuffCombatMods(activeBuffNames, allBuffs);

	// 7) Calculate base attack modifiers (melee & ranged)
	const { powerAttackAttackMod } = computePowerAttack(bab, featSet);
	const { deadlyAimAttackMod } = computeDeadlyAim(bab, featSet);
	const { rapidShotAttackMod, rapidShotExtraAttack } = computeRapidShot(featSet);
	const { twfAttackMod, twfExtraAttack } = computeTwoWeaponFighting(featSet);

	const meleeAttackTotal =
		bab + strMod + sizeMod + buffMods.attackBonus + powerAttackAttackMod + twfAttackMod;
	const rangedAttackTotal =
		bab + dexMod + sizeMod + buffMods.attackBonus + deadlyAimAttackMod + rapidShotAttackMod;

	// 8) Generate iterative attack strings
	const meleeAttackString =
		formatIterativeAttackString(meleeAttackTotal, bab) +
		buildExtraAttacksString(twfExtraAttack + buffMods.extraAttacksMelee);

	const rangedAttackString =
		formatIterativeAttackString(rangedAttackTotal, bab) +
		buildExtraAttacksString(rapidShotExtraAttack + buffMods.extraAttacksRanged);

	// 9) Compute AC
	let dodgeBonus = 0;
	if (featSet.has('dodge')) {
		dodgeBonus += 1;
	}
	const eqArmorBonus = computeEquipmentArmorBonus(character);
	const eqMaxDex = eqArmorBonus.maxDex;
	const finalDexModForAC = eqMaxDex === null ? dexMod : Math.min(dexMod, eqMaxDex);
	const totalArmorValue = eqArmorBonus.armor + armorAttunement;
	const natArmorBonus = buffMods.naturalArmor;

	const acNormal =
		10 +
		finalDexModForAC +
		sizeMod +
		dodgeBonus +
		totalArmorValue +
		natArmorBonus +
		deflectionBonus;

	const acTouch = 10 + finalDexModForAC + sizeMod + dodgeBonus + deflectionBonus;

	const acFlatFooted = 10 + sizeMod + totalArmorValue + natArmorBonus + deflectionBonus;

	// 10) Compute Saves (placeholder logic)
	const { baseFort, baseRef, baseWill } = guessBaseSaves(character);
	const abpResistance = getABPValue(character, 'resistance');
	const fort = baseFort + conMod + buffMods.saveBonus.fort + abpResistance;
	const ref = baseRef + dexMod + buffMods.saveBonus.ref + abpResistance;
	const will = baseWill + wisMod + buffMods.saveBonus.will + abpResistance;

	// 11) CMB & CMD
	const cmb = bab + strMod + sizeMod + buffMods.cmbBonus;
	const cmd =
		10 + bab + strMod + dexMod + sizeMod + buffMods.cmdBonus + (featSet.has('dodge') ? 1 : 0);

	// 12) Initiative
	let initiative = dexMod + buffMods.initiativeBonus;
	if (featSet.has('improved initiative')) {
		initiative += 4;
	}

	// Final object
	return {
		baseAttackBonus: bab,
		meleeAttack: meleeAttackString,
		rangedAttack: rangedAttackString,
		acNormal,
		acTouch,
		acFlatFooted,
		initiative,
		cmb,
		cmd,
		fort,
		ref,
		will
	};
}

/* ------------------------------------------------------------------------------
   Helper to gather buffs for combat (attack, AC, saves, etc.).
------------------------------------------------------------------------------ */
function blankCombatMods(): {
	attackBonus: number;
	damageBonus: number;
	naturalArmor: number;
	initiativeBonus: number;
	saveBonus: { fort: number; ref: number; will: number };
	extraAttacksMelee: number;
	extraAttacksRanged: number;
	cmbBonus: number;
	cmdBonus: number;
} {
	return {
		attackBonus: 0,
		damageBonus: 0,
		naturalArmor: 0,
		initiativeBonus: 0,
		saveBonus: { fort: 0, ref: 0, will: 0 },
		extraAttacksMelee: 0,
		extraAttacksRanged: 0,
		cmbBonus: 0,
		cmdBonus: 0
	};
}

/**
 * Gathers a variety of buff-based changes from the given Buff array.
 * Instead of referencing a hardcoded BUFF_CONFIG, we find each buff in `allBuffs`.
 */
function collectBuffCombatMods(
	activeBuffs: KnownBuffType[],
	allBuffs: Buff[] // pass in the loaded Buff array
): ReturnType<typeof blankCombatMods> {
	const mods = blankCombatMods();

	for (const buffName of activeBuffs) {
		// find the Buff definition in the array
		const buffDef = allBuffs.find((b) => b.name === buffName);
		if (!buffDef) continue;

		for (const eff of buffDef.effects) {
			// Attack / Damage
			if (typeof eff.attackRoll === 'number') {
				mods.attackBonus += eff.attackRoll;
			}
			if (typeof eff.damageRoll === 'number') {
				mods.damageBonus += eff.damageRoll;
			}
			if (eff.extraAttack) {
				// +1 extra to both melee & ranged
				mods.extraAttacksMelee += 1;
				mods.extraAttacksRanged += 1;
			}
			// Natural Armor
			if (typeof eff.naturalArmor === 'number') {
				mods.naturalArmor = Math.max(mods.naturalArmor, eff.naturalArmor);
			}
			// Initiative
			if (typeof eff.initiativeBonus === 'number') {
				mods.initiativeBonus += eff.initiativeBonus;
			}
			// Saves
			if (typeof eff.fortSave === 'number') {
				mods.saveBonus.fort += eff.fortSave;
			}
			if (typeof eff.refSave === 'number') {
				mods.saveBonus.ref += eff.refSave;
			}
			if (typeof eff.willSave === 'number') {
				mods.saveBonus.will += eff.willSave;
			}
			// CMB / CMD
			if (typeof eff.cmbBonus === 'number') {
				mods.cmbBonus += eff.cmbBonus;
			}
			if (typeof eff.cmdBonus === 'number') {
				mods.cmdBonus += eff.cmdBonus;
			}
		}
	}

	return mods;
}

/**
 * Summaries of “Power Attack” logic (just the penalty to attack).
 */
function computePowerAttack(
	bab: number,
	featSet: Set<string>
): {
	powerAttackAttackMod: number;
} {
	if (!featSet.has('power attack')) {
		return { powerAttackAttackMod: 0 };
	}
	const penaltySteps = Math.floor(bab / 4) + 1;
	const attackMod = -penaltySteps;
	return {
		powerAttackAttackMod: attackMod
	};
}

/**
 * “Deadly Aim” for ranged attacks: -1 penalty per step.
 */
function computeDeadlyAim(
	bab: number,
	featSet: Set<string>
): {
	deadlyAimAttackMod: number;
} {
	if (!featSet.has('deadly aim')) {
		return { deadlyAimAttackMod: 0 };
	}
	const penaltySteps = Math.floor(bab / 4) + 1;
	const attackMod = -penaltySteps;
	return { deadlyAimAttackMod: attackMod };
}

/**
 * “Rapid Shot”: -2 to all ranged attacks, +1 extra ranged attack
 */
function computeRapidShot(featSet: Set<string>): {
	rapidShotAttackMod: number;
	rapidShotExtraAttack: number;
} {
	if (!featSet.has('rapid shot')) {
		return { rapidShotAttackMod: 0, rapidShotExtraAttack: 0 };
	}
	return {
		rapidShotAttackMod: -2,
		rapidShotExtraAttack: 1
	};
}

/**
 * “Two-Weapon Fighting”: -2 to all attacks, +1 extra off-hand
 */
function computeTwoWeaponFighting(featSet: Set<string>): {
	twfAttackMod: number;
	twfExtraAttack: number;
} {
	if (!featSet.has('two weapon fighting') && !featSet.has('two-weapon fighting')) {
		return { twfAttackMod: 0, twfExtraAttack: 0 };
	}
	return {
		twfAttackMod: -2,
		twfExtraAttack: 1
	};
}

/**
 * Iterative attacks => +6/+1, +11/+6/+1, etc.
 */
function formatIterativeAttackString(attackTotal: number, bab: number): string {
	const sign = attackTotal >= 0 ? '+' : '';
	const lines: string[] = [];

	let totalAttacksFromBAB = 1;
	if (bab >= 6) totalAttacksFromBAB++;
	if (bab >= 11) totalAttacksFromBAB++;
	if (bab >= 16) totalAttacksFromBAB++;

	let current = attackTotal;
	for (let i = 0; i < totalAttacksFromBAB; i++) {
		if (i === 0) {
			lines.push(`${sign}${current}`);
		} else {
			current -= 5;
			const prefix = current >= 0 ? '+' : '';
			lines.push(`${prefix}${current}`);
		}
	}
	return lines.join('/');
}

/**
 * Appends lines for extra attacks at the same top bonus, e.g. “/+7/+7”.
 */
function buildExtraAttacksString(extraAttacks: number): string {
	if (extraAttacks <= 0) return '';
	let result = '';
	for (let i = 0; i < extraAttacks; i++) {
		result += '/+0'; // placeholder—tweak as needed
	}
	return result;
}

/**
 * Derives size category from ancestry or from “enlarge person”/“reduce person” buffs.
 */
function deriveSizeCategory(character: Character, activeBuffs: KnownBuffType[]): string {
	const ancestryName = (character.ancestry ?? '').toLowerCase();
	let size = 'medium';

	if (ancestryName.includes('halfling') || ancestryName.includes('gnome')) {
		size = 'small';
	} else if (ancestryName.includes('ogre') || ancestryName.includes('giant')) {
		size = 'large';
	}

	if (activeBuffs.includes('enlarge_person')) {
		size = size === 'medium' ? 'large' : 'huge';
	}
	if (activeBuffs.includes('reduce_person')) {
		size = size === 'medium' ? 'small' : 'tiny';
	}

	return size;
}

/**
 * Returns the numeric size modifier for attack/CMB, AC, etc.
 */
function getSizeModifier(size: string): number {
	switch (size.toLowerCase()) {
		case 'fine':
			return +8;
		case 'diminutive':
			return +4;
		case 'tiny':
			return +2;
		case 'small':
			return +1;
		case 'medium':
			return 0;
		case 'large':
			return -1;
		case 'huge':
			return -2;
		case 'gargantuan':
			return -4;
		case 'colossal':
			return -8;
		default:
			return 0;
	}
}

/**
 * Quick helper for computing base save, given “good” or “poor” progression.
 * (A simplified formula for Pathfinder-like systems.)
 */
function getBaseSave(progression: 'good' | 'poor', level: number): number {
	// Good progression => 2 + floor(level / 2)
	// Poor progression => floor(level / 3)
	if (progression === 'good') {
	  return 2 + Math.floor(level / 2);
	} else {
	  return Math.floor(level / 3);
	}
  }
  
  /**
   * We only have two classes here (plus a default fallback):
   */
  const CLASS_SAVE_PROFILES: Record<
	string,
	{ fort: 'good' | 'poor'; ref: 'good' | 'poor'; will: 'good' | 'poor' }
  > = {
	// Both Alchemist & Kineticist have good Fort, good Ref, poor Will
	alchemist: { fort: 'good', ref: 'good', will: 'poor' },
	kineticist: { fort: 'good', ref: 'good', will: 'poor' },
  
	// Fallback for unrecognized class
	default: { fort: 'poor', ref: 'poor', will: 'poor' }
  };
  
  /**
   * Example function to compute base saves from a character’s class & level.
   * This is more than a placeholder, but still simplified to only handle
   * Alchemist & Kineticist in this demonstration.
   */
  function guessBaseSaves(character: Character): {
	baseFort: number;
	baseRef: number;
	baseWill: number;
  } {
	const level = character.level || 1;
  
	// For safety, get the class name in lower case. If unrecognized, use “default”.
	const classKey = (character.class || '').toLowerCase();
	const saveProfile = CLASS_SAVE_PROFILES[classKey] ?? CLASS_SAVE_PROFILES.default;
  
	return {
	  baseFort: getBaseSave(saveProfile.fort, level),
	  baseRef: getBaseSave(saveProfile.ref, level),
	  baseWill: getBaseSave(saveProfile.will, level)
	};
  }
  
/**
 * Example function to compute how much “armor” the character’s worn equipment grants.
 */
function computeEquipmentArmorBonus(character: Character): {
	armor: number;
	maxDex: number | null;
	checkPenalty: number;
} {
	let totalArmor = 0;
	let bestMaxDex: number | null = null;
	let totalCheckPenalty = 0;

	for (const eq of character.character_equipment ?? []) {
		if (!eq.equipped) continue;
		if (eq.type !== 'armor' && eq.type !== 'shield') continue;

		const props = eq.properties as Record<string, number>;
		const armorBonus = props?.armor_bonus ?? 0;
		totalArmor += armorBonus;

		const itemMaxDex = props?.max_dex ?? null;
		if (itemMaxDex !== null) {
			if (bestMaxDex === null) {
				bestMaxDex = itemMaxDex;
			} else {
				bestMaxDex = Math.min(bestMaxDex, itemMaxDex);
			}
		}
		const penalty = props?.armor_check_penalty ?? 0;
		totalCheckPenalty += penalty;
	}

	return {
		armor: totalArmor,
		maxDex: bestMaxDex,
		checkPenalty: totalCheckPenalty
	};
}
