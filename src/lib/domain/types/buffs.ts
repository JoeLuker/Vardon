import type { KNOWN_BUFFS } from '$lib/domain/types/character';

export type KnownBuffType = (typeof KNOWN_BUFFS)[number];

export interface BuffEffect {
	// Base effect properties
	description: string;

	// Attribute modifications
	attribute?: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
	modifier?: number;

	// Combat modifications
	attackRoll?: number;
	damageRoll?: number;
	extraAttack?: boolean;
	initiativeBonus?: number;

	// Defense modifications
	acBonus?: number;
	naturalArmor?: number;

	// Saves modifications
	fortSave?: number;
	refSave?: number;
	willSave?: number;

	// Combat maneuver modifications
	cmbBonus?: number;
	cmdBonus?: number;
}

export interface Buff {
	name: string;
	label: string;
	effects: BuffEffect[];
	description: string;
}

// Type guards
export function isAttributeEffect(effect: BuffEffect): boolean {
	return 'attribute' in effect && 'modifier' in effect;
}

export function isArmorEffect(effect: BuffEffect): boolean {
	return 'naturalArmor' in effect || 'acBonus' in effect;
}

export function isCombatEffect(effect: BuffEffect): boolean {
	return 'attackRoll' in effect || 'damageRoll' in effect || 'extraAttack' in effect;
}
