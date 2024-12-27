// FILE: src/lib/domain/calculations/abp.ts

import type { Character } from '$lib/domain/types/character';
import type { DatabaseCharacterAbpBonus } from '$lib/domain/types/character';

/**
 * The recognized types of ABP bonuses in this system.
 * Adjust these to match your actual categories (e.g. “resistance”, “deflection”, etc.).
 */
export type ABPBonusType =
	| 'resistance'
	| 'armor'
	| 'weapon'
	| 'deflection'
	| 'mental_prowess'
	| 'physical_prowess'
	| 'toughening';

/**
 * A convenient structure that holds all ABP bonus values at once.
 * E.g. if you need them all in one go for your math.
 */
export interface ABPBonuses {
	resistance: number;
	armor: number;
	weapon: number;
	deflection: number;
	mental_prowess: number;
	physical_prowess: number;
	toughening: number;
}

/**
 * Given the raw array of ABP bonus rows (from DB or wherever),
 * returns a fully populated object with each ABP bonus at its numeric value (or zero if missing).
 */
export function getABPBonuses(characterAbpBonuses: DatabaseCharacterAbpBonus[]): ABPBonuses {
	const bonuses: ABPBonuses = {
		resistance: 0,
		armor: 0,
		weapon: 0,
		deflection: 0,
		mental_prowess: 0,
		physical_prowess: 0,
		toughening: 0
	};

	characterAbpBonuses.forEach((row) => {
		// row.bonus_type might be 'armor', 'weapon', etc.
		// We ensure it's one of our known ABPBonusType keys
		const type = row.bonus_type as keyof ABPBonuses;
		if (type in bonuses) {
			// If you only store a single value in DB, we directly set it.
			bonuses[type] = row.value;
		}
	});

	return bonuses;
}

/**
 * A handy helper to retrieve a single ABP bonus value (e.g. “armor” or “deflection”)
 * directly from a Character object. If not found, returns 0.
 */
export function getABPValue(character: Character, bonusType: ABPBonusType): number {
	const row = character.character_abp_bonuses?.find((b) => b.bonus_type === bonusType);
	return row?.value ?? 0;
}
