// FILE: src/lib/domain/calculations/attributes.ts

import type { KnownBuffType } from '$lib/domain/types/character';
import type { BuffEffect } from '$lib/domain/types/buffs';

/**
 * Represents the final computed combat stats for a character:
 */
export interface ComputedCombat {
	initiative: number;
	baseAttackBonus: number;
	attacks: {
		melee: {
			bonus: string; // e.g. "+5 / +0"
			damage: string; // e.g. "+3"
		};
		ranged: {
			bonus: string;
			damage: string;
		};
	};
	cmb: number; // Combat Maneuver Bonus
	cmd: number; // Combat Maneuver Defense
}

/**
 * Represents the final AC (armor class) set:
 */
export interface ComputedAC {
	normal: number; // e.g. 18
	touch: number; // e.g. 13
	flatFooted: number; // e.g. 16
}

/**
 * Represents the final saving throw set:
 */
export interface ComputedSaves {
	fortitude: number;
	reflex: number;
	will: number;
}

/**
 * Bundled “defenses” results (AC, saves, etc.).
 */
export interface ComputedDefenses {
	ac: ComputedAC;
	saves: ComputedSaves;
	// Possibly track armorCheckPenalty, naturalArmor, etc. if you like
	armorCheckPenalty: number;
	naturalArmorBonus: number;
}

/* --------------------------------------------------------------------------------
     Helper to compute an ability mod from a raw score (typical PF formula).
  -------------------------------------------------------------------------------- */
export function getAbilityModifier(score: number): number {
	return Math.floor((score - 10) / 2);
}

/**
 * If a buff changes an ability score by some amount, you could do e.g.:
 */
export function calculateModifiedAbility(baseScore: number, buffModifier = 0): number {
	return baseScore + buffModifier;
}

/**
 * A structure collecting partial defense modifiers from buffs or other sources:
 */
export interface DefenseMods {
	acNormal: number;
	acTouch: number;
	acFlatFooted: number;
	fort: number;
	ref: number;
	will: number;
}

/**
 * Initialize a DefenseMods struct with zero everywhere.
 */
function blankDefenseMods(): DefenseMods {
	return {
		acNormal: 0,
		acTouch: 0,
		acFlatFooted: 0,
		fort: 0,
		ref: 0,
		will: 0
	};
}

/**
 * Step through activeBuffs. If any buff modifies AC or saves,
 * accumulate them in a single structure for easy usage.
 */
export function gatherDefenseMods(
	activeBuffs: KnownBuffType[],
	allBuffDefs: Array<{ name: string; effects: BuffEffect[] }>
): DefenseMods {
	const mods = blankDefenseMods();

	activeBuffs.forEach((buffName) => {
		const buffDef = allBuffDefs.find((b) => b.name === buffName);
		if (!buffDef) return;

		buffDef.effects.forEach((effect) => {
			// AC changes
			if ((effect as any).acBonus) {
				mods.acNormal += (effect as any).acBonus;
			}

			// Saves
			if ((effect as any).fortSave) {
				mods.fort += (effect as any).fortSave;
			}
			if ((effect as any).refSave) {
				mods.ref += (effect as any).refSave;
			}
			if ((effect as any).willSave) {
				mods.will += (effect as any).willSave;
			}
		});
	});

	return mods;
}
