// FILE: src/lib/domain/calculations/attributes.ts

import type {
	Character,
	KnownBuffType,
	CharacterEquipmentProperties
} from '$lib/domain/types/character';
import type { BuffEffect } from '$lib/domain/types/buffs';
import { isArmorEffect } from '$lib/domain/types/buffs';
import { getABPBonuses } from '$lib/domain/types/abp';

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

/* --------------------------------------------------------------------------------
     1) COMBAT HELPER FUNCTIONS (formatting multi-attack strings, etc.)
  -------------------------------------------------------------------------------- */

/**
 * Takes a total bonus (like +7), the base attack bonus, and how many extra iterative attacks.
 * Returns a string like “+7 / +2 / +2” (depending on your iterative logic).
 */
export function formatAttackBonus(totalBonus: number, bab: number, extraAttacks = 0): string {
	const sign = totalBonus >= 0 ? '+' : '';
	let display = `${sign}${totalBonus}`;

	// Example formula: if BAB >= 6 => you get 2 attacks, >=11 => 3, etc.
	const iterations = Math.floor(bab / 5);
	// e.g. BAB=8 => iterations=1 => second attack is totalBonus - 5

	for (let i = 1; i < iterations; i++) {
		const iterativeBonus = totalBonus - i * 5;
		display += ` / ${iterativeBonus >= 0 ? '+' : ''}${iterativeBonus}`;
	}

	// Extra attacks from e.g. Rapid Shot or TWF
	for (let i = 0; i < extraAttacks; i++) {
		display += ` / ${sign}${totalBonus}`;
	}

	return display;
}

/**
 * For damage bonuses, we might format “+4” or “-2”. If zero => empty string.
 */
export function formatDamageBonus(bonus: number): string {
	if (bonus === 0) return '';
	return bonus > 0 ? `+${bonus}` : `${bonus}`;
}

/**
 * Tracks how many extra attacks we get for melee vs. ranged, e.g. from TWF vs. Rapid Shot.
 */
export interface ExtraAttacks {
	melee: number;
	ranged: number;
}

/**
 * A structure collecting partial combat modifiers from buffs or other sources:
 */
export interface CombatMods {
	initiative: number;
	attack: number;
	damage: number;
	extraAttacks: ExtraAttacks;
	cmb: number;
	cmd: number;
	acNormal: number;
	acTouch: number;
	acFlatFooted: number;
	fort: number;
	ref: number;
	will: number;
}

/**
 * Initialize a CombatMods struct with zero everywhere.
 */
function blankCombatMods(): CombatMods {
	return {
		initiative: 0,
		attack: 0,
		damage: 0,
		extraAttacks: { melee: 0, ranged: 0 },
		cmb: 0,
		cmd: 0,
		acNormal: 0,
		acTouch: 0,
		acFlatFooted: 0,
		fort: 0,
		ref: 0,
		will: 0
	};
}

/**
 * Step through activeBuffs. If any buff modifies AC, initiative, grants extra attacks, etc.,
 * accumulate them in a single structure for easy usage.
 */
export function gatherCombatMods(
	activeBuffs: KnownBuffType[],
	allBuffDefs: Array<{ name: string; effects: BuffEffect[] }>
): CombatMods {
	const mods = blankCombatMods();

	activeBuffs.forEach((buffName) => {
		const buffDef = allBuffDefs.find((b) => b.name === buffName);
		if (!buffDef) return;

		buffDef.effects.forEach((effect) => {
			// Attack / Damage
			if (effect.attackRoll) {
				mods.attack += effect.attackRoll;
			}
			if (effect.damageRoll) {
				mods.damage += effect.damageRoll;
			}
			if (effect.extraAttack) {
				// e.g. +1 to both melee & ranged, or do separate logic if needed.
				mods.extraAttacks.melee += 1;
				mods.extraAttacks.ranged += 1;
			}

			// Initiative
			if ((effect as any).initiativeBonus) {
				mods.initiative += (effect as any).initiativeBonus;
			}

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

			// CMB/CMD
			if ((effect as any).cmbBonus) {
				mods.cmb += (effect as any).cmbBonus;
			}
			if ((effect as any).cmdBonus) {
				mods.cmd += (effect as any).cmdBonus;
			}
		});
	});

	return mods;
}

/* --------------------------------------------------------------------------------
     2) EXAMPLE COMBAT CALCULATIONS (like we had in “combat.ts”)
  -------------------------------------------------------------------------------- */

/**
 * Simple function to guess base saves from class/level (for demonstration).
 */
function guessBaseSaves(character: Character) {
	// e.g. if level 5: fort=+4, ref=+4, will=+1
	return { baseFort: 4, baseRef: 4, baseWill: 1 };
}

/**
 * A function to compute how much “armor” the character’s worn gear grants,
 * plus check for maxDex, armor_check_penalty, etc.
 */
function computeEquipmentArmorBonus(character: Character) {
	let totalArmor = 0;
	let bestMaxDex: number | null = null;
	let totalCheckPenalty = 0;

	for (const eq of character.character_equipment ?? []) {
		if (!eq.equipped) continue;
		if (eq.type !== 'armor' && eq.type !== 'shield') continue;

		const props = eq.properties as Record<string, number>;
		totalArmor += props.armor_bonus ?? 0;

		const itemMaxDex = props.max_dex ?? null;
		if (itemMaxDex !== null) {
			if (bestMaxDex === null) bestMaxDex = itemMaxDex;
			else bestMaxDex = Math.min(bestMaxDex, itemMaxDex);
		}
		if (props.armor_check_penalty) {
			totalCheckPenalty += props.armor_check_penalty;
		}
	}

	return { armor: totalArmor, maxDex: bestMaxDex, checkPenalty: totalCheckPenalty };
}

/**
 * Example “computeDefenses” function that calculates final AC, saves, etc.
 */
export function computeDefenses(
	character: Character,
	dexMod: number,
	conMod: number,
	wisMod: number,
	activeBuffs: KnownBuffType[],
	allBuffDefs: Array<{ name: string; effects: BuffEffect[] }>
): ComputedDefenses {
	// 1) gather partial mods from buffs
	const mods = gatherCombatMods(activeBuffs, allBuffDefs);

	// 2) get ABP
	const abp = getABPBonuses(character.character_abp_bonuses ?? []);

	// 3) equipment armor
	const eqArmorBonus = computeEquipmentArmorBonus(character);
	const totalArmorBonus = eqArmorBonus.armor;
	const maxDex = eqArmorBonus.maxDex;
	const armorCheckPenalty = eqArmorBonus.checkPenalty;

	// 4) figure out if we have any buff-based natural armor
	let naturalArmor = 0;
	// Suppose we check for “isArmorEffect” or just read from effects individually:
	for (const buffName of activeBuffs) {
		const def = allBuffDefs.find((b) => b.name === buffName);
		if (!def) continue;

		def.effects.forEach((effect) => {
			if (isArmorEffect(effect)) {
				// effect.naturalArmor might be undefined, so check first:
				if (typeof effect.naturalArmor === 'number') {
					// If you choose to take the highest or sum them, your call:
					if (effect.naturalArmor > naturalArmor) {
						naturalArmor = effect.naturalArmor;
					}
				}
			}
		});
	}

	// 5) effective dex for AC
	const effectiveDexMod = maxDex === null ? dexMod : Math.min(dexMod, maxDex);

	// 6) final AC
	const normalAC =
		10 +
		effectiveDexMod +
		totalArmorBonus +
		abp.armor +
		abp.deflection +
		naturalArmor +
		mods.acNormal;

	const touchAC = 10 + effectiveDexMod + abp.deflection + mods.acTouch;

	const flatFootedAC =
		10 + totalArmorBonus + abp.armor + abp.deflection + naturalArmor + mods.acFlatFooted;

	// 7) saves
	const { baseFort, baseRef, baseWill } = guessBaseSaves(character);
	const fortitude = baseFort + conMod + abp.resistance + mods.fort;
	const reflex = baseRef + effectiveDexMod + abp.resistance + mods.ref;
	const will = baseWill + wisMod + abp.resistance + mods.will;

	return {
		ac: {
			normal: normalAC,
			touch: touchAC,
			flatFooted: flatFootedAC
		},
		saves: {
			fortitude,
			reflex,
			will
		},
		armorCheckPenalty,
		naturalArmorBonus: naturalArmor
	};
}
