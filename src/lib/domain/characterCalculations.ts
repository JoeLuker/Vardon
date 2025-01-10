/******************************************************************************
 * FILE: src/lib/state/characterCalculations.ts
 *
 * In this version, each attribute/saving throw/etc. is stored as a ValueWithBreakdown
 * object. For example, `character.ac` is not a plain number, but an object:
 *
 *   {
 *     name: "AC",
 *     base: 10,
 *     modifiers: [ { source: "Dex mod", value: 3 }, ... ],
 *     total: 17
 *   }
 *
 * So if you need the numeric total, do `character.ac.total`.
 * If you need details, do `character.ac.modifiers`.
 *****************************************************************************/

import type { CompleteCharacter } from '$lib/db/getCompleteCharacter';

/**
 * The shape of each stat. You can call `.total` to get the numeric result,
 * or look at `.modifiers` to see how that result was computed.
 */
export interface ValueWithBreakdown {
	label: string;
	modifiers: Array<{ source: string; value: number }>;
	total: number;
}

/**
 * A "character" object that merges the raw DB fields with
 * newly computed fields. Instead of plain numbers, we store
 * ValueWithBreakdown for each stat.
 */
export interface EnrichedCharacter extends CompleteCharacter {
	// Abilities
	strength: ValueWithBreakdown;
	dexterity: ValueWithBreakdown;
	constitution: ValueWithBreakdown;
	intelligence: ValueWithBreakdown;
	wisdom: ValueWithBreakdown;
	charisma: ValueWithBreakdown;

	strMod: number;
	dexMod: number;
	conMod: number;
	intMod: number;
	wisMod: number;
	chaMod: number;

	// Derived numeric stats
	saves: {
		fortitude: ValueWithBreakdown;
		reflex: ValueWithBreakdown;
		will: ValueWithBreakdown;
	};

	ac: ValueWithBreakdown;
	touch_ac: ValueWithBreakdown;
	flat_footed_ac: ValueWithBreakdown;
	initiative: ValueWithBreakdown;

	// If you want CMB/CMD as separate ValueWithBreakdown objects, you can do that:
	cmb: ValueWithBreakdown;
	cmd: ValueWithBreakdown;

	/**
	 * skill_modifiers is optional if you prefer a single numeric value,
	 * or you can store each as a ValueWithBreakdown as well in "skills."
	 */
	skills: Record<number, ValueWithBreakdown>;

	// Alternatively, you could do "attributes" or "calculation by name" if you want.

	attacks: {
		melee: ValueWithBreakdown;
		ranged: ValueWithBreakdown;
		bomb: {
			attack: ValueWithBreakdown;
			damage: ValueWithBreakdown;
		};
	};
}

/** Quick helper to get the numeric ability modifier from a score, e.g. 14 -> +2. */
function abilityMod(score: number): number {
	return Math.floor((score - 10) / 2);
}

/**
 * Create a "ValueWithBreakdown" builder. You start with a base (like 10 for AC),
 * then call `.add("Dex mod", 3)`, etc. Finally call `.finalize()` to get the object.
 */
function createStatBuilder(label: string) {
	const modifiers: Array<{ source: string; value: number }> = [];

	return {
		add(source: string, value: number) {
			if (value !== 0) {
				modifiers.push({ source, value });
			}
		},
		finalize(): ValueWithBreakdown {
			const sum = modifiers.reduce((acc, m) => acc + m.value, 0);
			return {
				label,
				modifiers,
				total: sum
			};
		}
	};
}

/**
 * If your database has special ABP bonus types like "physical_prowess_str",
 * you can look them up here. Tweak as needed.
 */
const ABP_MAP_BY_ATTR: Record<string, string> = {
	strength: 'physical_prowess_str',
	dexterity: 'physical_prowess_dex',
	constitution: 'physical_prowess_con',
	intelligence: 'mental_prowess_int',
	wisdom: 'mental_prowess_wis',
	charisma: 'mental_prowess_cha'
};

function getAbpBonusValue(char: CompleteCharacter, abpName: string): number {
	const byName = char.references?.abpBonusTypes?.byName;
	if (!byName) return 0;
	const bonusTypeId = byName[abpName];
	if (!bonusTypeId) return 0;
	const match = char.abpBonuses?.find((b) => b.bonus_type_id === bonusTypeId);
	return match?.value ?? 0;
}

/** Summarize each class as having 'good' or 'poor' saves. Then do 2 + level/2 for good, level/3 for poor. */
function calculateBaseSave(char: CompleteCharacter, type: 'fortitude' | 'reflex' | 'will'): number {
	let total = 0;
	for (const cls of char.classes) {
		const level = cls.level || 1;
		const isGood = cls.base?.[type] === 'good';
		if (isGood) {
			total += 2;
			total += level / 2;
		} else {
			total += level / 3;
		}
	}
	return Math.floor(total);
}

/** Gather the set of skill IDs that are class skills for the character (including multiclass). */
function getClassSkillIds(char: CompleteCharacter): Set<number> {
	const classSkillIds = new Set<number>();
	for (const c of char.classes) {
		if (Array.isArray(c.class_skills)) {
			c.class_skills.forEach((skillId) => classSkillIds.add(skillId));
		}
	}
	return classSkillIds;
}

/**
 * The main function. Takes raw DB data, returns a "CharacterWithStats" with each
 * field as a ValueWithBreakdown object. You can do `myChar.ac.total` or see `myChar.ac.modifiers`.
 */
export function enrichCharacterData(raw: CompleteCharacter): EnrichedCharacter {
	// 1) Build each ability with an ABP-based score
	function buildAbilityStat(attrName: string) {
		const row = raw.attributes?.find((a) => a.base?.name?.toLowerCase() === attrName);
		const baseScore = row?.value || 10;
		const abpName = ABP_MAP_BY_ATTR[attrName];
		const abpValue = abpName ? getAbpBonusValue(raw, abpName) : 0;

		// Capitalize the first letter of the attribute name if we don't have a label
		const defaultLabel = attrName.charAt(0).toUpperCase() + attrName.slice(1);
		const sb = createStatBuilder(row?.label || defaultLabel);
		sb.add('Point Buy', baseScore);
		sb.add('ABP Bonus', abpValue);
		const final = sb.finalize();
		return final;
	}

	const strength = buildAbilityStat('strength');
	const dexterity = buildAbilityStat('dexterity');
	const constitution = buildAbilityStat('constitution');
	const intelligence = buildAbilityStat('intelligence');
	const wisdom = buildAbilityStat('wisdom');
	const charisma = buildAbilityStat('charisma');

	// 2) We'll eventually need the numeric modifiers
	const strMod = abilityMod(strength.total);
	const dexMod = abilityMod(dexterity.total);
	const conMod = abilityMod(constitution.total);
	const wisMod = abilityMod(wisdom.total);
	// intMod, chaMod if needed
	const intMod = abilityMod(intelligence.total);
	const chaMod = abilityMod(charisma.total);

	// 3) Summed character level
	const totalLevel = raw.classes.reduce((acc, c) => acc + (c.level || 1), 0);

	// Get BAB (Base Attack Bonus) - Alchemist uses 3/4 BAB progression
	const bab = Math.floor((totalLevel * 3) / 4);

	// 4) Saves
	const baseFort = calculateBaseSave(raw, 'fortitude');
	const baseRef = calculateBaseSave(raw, 'reflex');
	const baseWill = calculateBaseSave(raw, 'will');
	const abpResistance = getAbpBonusValue(raw, 'resistance');

	function buildSaveStat(label: string, baseVal: number, abilityMod: number) {
		const sb = createStatBuilder(label);
		sb.add('Class Progression', baseVal);
		sb.add('Ability mod', abilityMod);
		sb.add('ABP (Resistance)', abpResistance);
		return sb.finalize();
	}

	const fortitude = buildSaveStat('Fortitude', baseFort, conMod);
	const reflex = buildSaveStat('Reflex', baseRef, dexMod);
	const will = buildSaveStat('Will', baseWill, wisMod);

	// 5) AC. Start with 10, then add Dex, ABP, feats, etc.
	const abpArmorAttunement = getAbpBonusValue(raw, 'armor_attunement');
	const abpDeflection = getAbpBonusValue(raw, 'deflection');

	const hasDodgeFeat = raw.feats.some((f) => {
		const name = f.base?.name?.toLowerCase() ?? '';
		return name === 'dodge';
	});

	// normal AC
	const acBuilder = createStatBuilder('AC');
	acBuilder.add('Base AC', 10);
	acBuilder.add('Dex mod', dexMod);
	acBuilder.add('Armor Attunement (ABP)', abpArmorAttunement);
	acBuilder.add('Deflection (ABP)', abpDeflection);
	acBuilder.add('Dodge feat', hasDodgeFeat ? 1 : 0);
	const ac = acBuilder.finalize();

	// touch AC
	const touchBuilder = createStatBuilder('Touch AC');
	touchBuilder.add('Dex mod', dexMod);
	touchBuilder.add('Deflection (ABP)', abpDeflection);
	touchBuilder.add('Dodge feat', hasDodgeFeat ? 1 : 0);
	const touch_ac = touchBuilder.finalize();

	// flat-footed
	const ffBuilder = createStatBuilder('Flat-Footed AC');
	ffBuilder.add('Armor Attunement (ABP)', abpArmorAttunement);
	ffBuilder.add('Deflection (ABP)', abpDeflection);
	// no dex or dodge
	const flat_footed_ac = ffBuilder.finalize();

	// 6) Initiative (just Dex mod or feats if you have them)
	const initBuilder = createStatBuilder('Initiative');
	initBuilder.add('Dex mod', dexMod);
	// if the character had improved initiative or something, add it
	// initBuilder.add("Improved Initiative feat", 4);
	const initiative = initBuilder.finalize();

	// 7) CMB, CMD
	//   If you want them as ValueWithBreakdown, do it:
	const cmbBuilder = createStatBuilder('CMB');
	cmbBuilder.add('Str mod', strMod);
	cmbBuilder.add('Base Attack', bab); // if you do BAB or just total level
	const cmb = cmbBuilder.finalize();

	const cmdBuilder = createStatBuilder('CMD');
	cmdBuilder.add('Base CMD', 10);
	cmdBuilder.add('Str mod', strMod);
	cmdBuilder.add('Dex mod', dexMod);
	cmdBuilder.add('Base Attack', bab); // if you do BAB or just total level
	const cmd = cmdBuilder.finalize();

	// 8) Skills
	const skillIDs = getClassSkillIds(raw);
	const skillResults: Record<number, ValueWithBreakdown> = {};

	for (const skill of raw.baseSkills) {
		const skillDetail = raw.skillsWithRanks.find((s) => s.skillId === skill.id);
		const ranks = skillDetail?.totalRanks ?? 0;
		// find the relevant ability mod
		let ability = 0;
		switch (skill.ability) {
			case 'str':
				ability = strMod;
				break;
			case 'dex':
				ability = dexMod;
				break;
			case 'con':
				ability = conMod;
				break;
			case 'int':
				ability = intMod;
				break;
			case 'wis':
				ability = wisMod;
				break;
			case 'cha':
				ability = chaMod;
				break;
		}

		const sb = createStatBuilder(skill.label);
		sb.add(`${skill.ability.toUpperCase()} mod`, ability);
		sb.add('Ranks', ranks);

		if (skillIDs.has(skill.id) && ranks > 0) {
			sb.add('Class skill', 3);
		}
		// if there's an armor check penalty, synergy, etc, add them here:
		// sb.add("Armor check penalty", -2);

		const finalSkill = sb.finalize();
		skillResults[skill.id] = finalSkill;
	}

	// Calculate basic attack bonus
	const attackBuilder = createStatBuilder('Attack');
	attackBuilder.add('BAB', bab);
	attackBuilder.add('Str mod', strMod);
	attackBuilder.add('Weapon Attunement (ABP)', getAbpBonusValue(raw, 'weapon_attunement'));
	const baseAttack = attackBuilder.finalize();

	// Calculate ranged attack bonus (for bombs)
	const rangedBuilder = createStatBuilder('Ranged Attack');
	rangedBuilder.add('BAB', bab);
	rangedBuilder.add('Dex mod', dexMod);
	rangedBuilder.add('Weapon Attunement (ABP)', getAbpBonusValue(raw, 'weapon_attunement'));
	const rangedAttack = rangedBuilder.finalize();

	// Calculate bomb damage
	const bombBuilder = createStatBuilder('Bomb Damage');
	bombBuilder.add('Int mod', intMod);
	const bombDamage = bombBuilder.finalize();

	// 9) Return a big object that merges the original data with these new stats
	return {
		...raw,

		// each attribute is now a ValueWithBreakdown
		strength,
		dexterity,
		constitution,
		intelligence,
		wisdom,
		charisma,

		strMod,
		dexMod,
		conMod,
		intMod,
		wisMod,
		chaMod,

		// each save is a ValueWithBreakdown
		saves: {
			fortitude,
			reflex,
			will
		},

		// AC stuff
		ac,
		touch_ac,
		flat_footed_ac,
		initiative,

		// CMB / CMD
		cmb,
		cmd,

		// skill dictionary
		skills: skillResults,

		attacks: {
			melee: baseAttack,
			ranged: rangedAttack,
			bomb: {
				attack: rangedAttack,
				damage: bombDamage
			}
		}
	};
}
