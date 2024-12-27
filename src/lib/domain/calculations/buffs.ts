import type { KnownBuffType } from '$lib/domain/types/character';

/**
 * The BuffEffect union, reflecting all the ways a buff might alter the character.
 *
 * If you'd like to split these into multiple interfaces (AttributeEffect, AttackEffect, etc.),
 * you absolutely can. For now, I'm merging them into a single interface with optional fields,
 * mirroring what your code has done so far.
 */
export interface BuffEffect {
	// attribute modifications
	attribute?: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
	modifier?: number;

	// natural armor or other AC changes
	naturalArmor?: number;

	// Attack/damage changes
	attackRoll?: number;
	damageRoll?: number;
	mainHandPenalty?: number;
	offHandPenalty?: number;
	extraAttack?: boolean;

	// Possibly other fields like "saveFort", "saveRef", "saveWill" if you ever store them
	// in your Buff config

	// textual display
	description?: string;
}

/**
 * A Buff defines one named effect.
 * - `name`: unique internal key
 * - `label`: displayed to the user
 * - `effects`: array of BuffEffect
 * - `conflicts`: optional list of other buff keys that can’t coexist
 * - `description`: short user-friendly text
 */
export interface Buff {
	name: KnownBuffType;
	label: string;
	effects: BuffEffect[];
	conflicts?: KnownBuffType[];
	description: string;
}

/**
 * Find the Buff definition for a given name.
 */
export function getBuffDefinition(name: KnownBuffType, allBuffs: Buff[]): Buff | undefined {
	return allBuffs.find((buff) => buff.name === name);
}

/**
 * Check if buff1 conflicts with buff2.
 */
export function doBuffsConflict(buffA: KnownBuffType, buffB: KnownBuffType, allBuffs: Buff[]): boolean {
	const buff = getBuffDefinition(buffA, allBuffs);
	if (!buff?.conflicts) return false;
	return buff.conflicts.includes(buffB);
}

/**
 * Gather all BuffEffect objects from an array of active buff names.
 */
export function gatherBuffEffects(activeBuffs: KnownBuffType[], allBuffs: Buff[]): BuffEffect[] {
	const effects: BuffEffect[] = [];
	for (const name of activeBuffs) {
		const def = getBuffDefinition(name, allBuffs);
		if (def) {
			effects.push(...def.effects);
		}
	}
	return effects;
}

/**
 * Validate a newly activated buff, checking conflict with the current set of buffs.
 */
export function validateNewBuff(
	newBuff: KnownBuffType,
	activeBuffs: KnownBuffType[],
	allBuffs: Buff[]
): { conflictWith: KnownBuffType } | null {
	for (const active of activeBuffs) {
		if (doBuffsConflict(newBuff, active, allBuffs)) {
			return { conflictWith: active };
		}
	}
	return null;
}
