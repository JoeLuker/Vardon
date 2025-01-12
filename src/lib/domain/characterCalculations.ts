/******************************************************************************
 * FILE: src/lib/state/characterCalculations.ts
 *****************************************************************************/
import type { CompleteCharacter } from '$lib/db/getCompleteCharacter';
import type { RefAbpNodeBonusRow, RefAbpNodeRow } from '$lib/db/references';

//
// =====================  INTERFACES & TYPES  =====================
//

export interface ValueWithBreakdown {
	label: string;
	modifiers: Array<{ source: string; value: number }>;
	total: number;
}

export interface EnrichedCharacter extends CompleteCharacter {
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

	saves: {
		fortitude: ValueWithBreakdown;
		reflex: ValueWithBreakdown;
		will: ValueWithBreakdown;
	};

	ac: ValueWithBreakdown;
	touch_ac: ValueWithBreakdown;
	flat_footed_ac: ValueWithBreakdown;
	initiative: ValueWithBreakdown;

	cmb: ValueWithBreakdown;
	cmd: ValueWithBreakdown;

	skills: Record<number, ValueWithBreakdown>;

	attacks: {
		melee: ValueWithBreakdown;
		ranged: ValueWithBreakdown;
		bomb: {
			attack: ValueWithBreakdown;
			damage: ValueWithBreakdown;
		};
	};
}

interface BonusEntry {
	source: string;
	value: number;
	type?: string;
}

interface StackingAccumulator {
	typedBonuses: Record<string, number>;
	sumOfDodges: number;
	sumOfCircumstance: number;
	sumOfUntyped: number;
}

//
// =====================  CORE UTILITY FUNCTIONS  =====================
//

function abilityMod(score: number): number {
	return Math.floor((score - 10) / 2);
}

function buildGenericStat(label: string, bonuses: BonusEntry[]): ValueWithBreakdown {
	return {
		label,
		...calculateStackedBonuses(bonuses)
	};
}

function calculateStackedBonuses(bonuses: BonusEntry[]): {
	total: number;
	modifiers: Array<{ source: string; value: number }>;
} {
	const acc = createStackingAccumulator();

	for (const bonus of bonuses) {
		addBonus(acc, bonus.type, bonus.value);
	}

	const total =
		Object.values(acc.typedBonuses).reduce((sum, v) => sum + v, 0) +
		acc.sumOfDodges +
		acc.sumOfCircumstance +
		acc.sumOfUntyped;

	const modifiers = bonuses
		.filter((b) => b.value !== 0)
		.map(({ source, value }) => ({ source, value }));

	return { total, modifiers };
}

function createStackingAccumulator(): StackingAccumulator {
	return {
		typedBonuses: {},
		sumOfDodges: 0,
		sumOfCircumstance: 0,
		sumOfUntyped: 0
	};
}

function addBonus(acc: StackingAccumulator, type: string | undefined, value: number) {
	if (value === 0) return;

	if (!type) {
		acc.sumOfUntyped += value;
	} else if (type === 'dodge') {
		acc.sumOfDodges += value;
	} else if (type === 'circumstance') {
		acc.sumOfCircumstance += value;
	} else {
		acc.typedBonuses[type] = Math.max(acc.typedBonuses[type] || 0, value);
	}
}




function getMaxDexBonus(char: CompleteCharacter): number {
	const wornArmor = char.equipment?.find(e => e.slot === 'armor' && e.equipped);
	// return wornArmor?.base?.max_dex ?? Infinity; // No limit if no armor or no max_dex specified
	return wornArmor?.max_dex ?? Infinity; // No limit if no armor or no max_dex specified

}

function getArmorEnhancement(char: CompleteCharacter): number {
	// First check for ABP armor enhancement
	const abpBonus = getAbpBonusFromNodes(char, 'armor_enhancement');
	
	// Then check equipped armor's enhancement
	const wornArmor = char.equipment?.find(e => e.slot === 'armor' && e.equipped);
	const itemBonus = wornArmor?.enhancement ?? 0;
	
	// Return the higher of the two
	return Math.max(abpBonus, itemBonus);
}

function getNaturalArmor(char: CompleteCharacter): number {
	// Check racial natural armor
	const racialNA = char.ancestry?.natural_armor ?? 0;
	
	// Could add other sources of natural armor here (class features, etc)
	return racialNA;
}

function getNaturalArmorEnhancement(char: CompleteCharacter): number {
	// First check for ABP natural armor enhancement
	const abpBonus = getAbpBonusFromNodes(char, 'natural_armor_enhancement');
	
	// // Check for amulet of natural armor or similar items
	// const amulet = char.equipment?.find(e => 
	// 	e.slot === 'neck' && 
	// 	e.equipped && 
	// 	e.base?.enhances === 'natural_armor'
	// );
	// const itemBonus = amulet?.enhancement ?? 0;
	
	// // Return the higher of the two
	// return Math.max(abpBonus, itemBonus);
	return abpBonus;
}

function getShieldBonus(char: CompleteCharacter): number {
	const shield = char.equipment?.find(e => e.slot === 'shield' && e.equipped);
	if (!shield) return 0;
	
	const baseBonus = shield.base?.bonus ?? 0;
	const enhancement = shield.enhancement ?? 0;
	
	return baseBonus + enhancement;
}

function getSizeModifier(char: CompleteCharacter): number {
	const sizeModifiers: Record<string, number> = {
		'fine': 8,
		'diminutive': 4,
		'tiny': 2,
		'small': 1,
		'medium': 0,
		'large': -1,
		'huge': -2,
		'gargantuan': -4,
		'colossal': -8
	};
	
	return sizeModifiers[char.ancestry?.size?.toLowerCase() ?? 'medium'] ?? 0;
}



//
// =====================  ABP-RELATED HELPERS  =====================
//

function getAllAutoNodes(
	char: CompleteCharacter,
	effectiveABPLevel: number
): Array<RefAbpNodeRow & { bonuses: RefAbpNodeBonusRow[] }> {
	const { abpNodes, abpNodeGroups, abpNodeBonuses } = char.references;

	// Build a map: nodeId -> all its BonusRows
	const nodeBonusMap = new Map<number, RefAbpNodeBonusRow[]>();
	for (const b of abpNodeBonuses) {
		if (!nodeBonusMap.has(b.node_id)) {
			nodeBonusMap.set(b.node_id, []);
		}
		nodeBonusMap.get(b.node_id)!.push(b);
	}

	return abpNodes
		.filter((node) => {
			const group = abpNodeGroups.find((g) => g.id === node.group_id);
			return group && !group.requires_choice && group.level <= effectiveABPLevel;
		})
		.map((node) => ({
			...node,
			bonuses: nodeBonusMap.get(node.id) ?? []
		}));
}

/** Sum up all ABP bonuses of `abpName` from auto-granted + chosen nodes. */
function getAbpBonusFromNodes(char: CompleteCharacter, abpName: string): number {
	const totalLevel = char.classes.reduce((acc, c) => acc + (c.level || 1), 0);
	const effectiveLevel = totalLevel + 2; // custom logic

	const explicitNodes = char.abpChoices?.map((c) => c.node) || [];
	const autoNodes = getAllAutoNodes(char, effectiveLevel);
	const allNodes = [...explicitNodes, ...autoNodes];

	const bonuses: BonusEntry[] = [];
	for (const node of allNodes) {
		for (const bonus of node?.bonuses || []) {
			const bonusTypeName = char.references.abpBonusTypes.byId[bonus.bonus_type_id];
			if (bonusTypeName === abpName) {
				bonuses.push({
					source: `ABP Node ${node.id}`,
					value: bonus.value,
					type: bonusTypeName
				});
			}
		}
	}

	return calculateStackedBonuses(bonuses).total;
}

//
// =====================  SAVES & CLASS HELPERS  =====================
//

function calculateBaseSave(char: CompleteCharacter, type: 'fortitude' | 'reflex' | 'will'): number {
	return char.classes.reduce((acc, cls) => {
		const level = cls.level || 1;
		const isGood = cls.base?.[type] === 'good';
		return acc + (isGood ? 2 + level / 2 : level / 3);
	}, 0) | 0; // floor
}

function getClassSkillIds(char: CompleteCharacter): Set<number> {
	const classSkillIds = new Set<number>();
	for (const cls of char.classes) {
		if (Array.isArray(cls.class_skills)) {
			cls.class_skills.forEach((skillId) => classSkillIds.add(skillId));
		}
	}
	return classSkillIds;
}

//
// =====================  EQUIPMENT  =====================
//

function getWornArmorBonus(char: CompleteCharacter): { base: number; type: string } {
	// Placeholder for real logic
	return { base: 4, type: 'armor' };
}

//
// =====================  FUNCTIONAL COMPUTATION STEPS  =====================
//
// Each step is a pure function that returns the "raw" bonuses or final stats.
// Then, in enrichCharacterData, we compose them.
//
// -------------------------------------------------------------------------
// 1) ABILITIES
// -------------------------------------------------------------------------

function computeAbilityBonuses(char: CompleteCharacter, attrName: string): BonusEntry[] {
	const row = char.attributes?.find((a) => a.base?.name?.toLowerCase() === attrName);
	const baseScore = row?.value ?? 10;

	const abpMap: Record<string, string> = {
		strength: 'physical_prowess_str',
		dexterity: 'physical_prowess_dex',
		constitution: 'physical_prowess_con',
		intelligence: 'mental_prowess_int',
		wisdom: 'mental_prowess_wis',
		charisma: 'mental_prowess_cha'
	};

	const abpName = abpMap[attrName];
	const abpValue = abpName ? getAbpBonusFromNodes(char, abpName) : 0;

	const bonuses: BonusEntry[] = [
		{ source: 'Base Score', value: baseScore }
	];
	if (abpValue !== 0) {
		bonuses.push({ source: 'ABP Node', value: abpValue });
	}

	return bonuses;
}

function buildAbilityScore(
	char: CompleteCharacter,
	attrName: string
): ValueWithBreakdown {
	const label =
		char.attributes?.find((a) => a.base?.name?.toLowerCase() === attrName)?.base?.label ??
		attrName[0].toUpperCase() + attrName.slice(1);
	const bonuses = computeAbilityBonuses(char, attrName);
	return buildGenericStat(label, bonuses);
}

// -------------------------------------------------------------------------
// 2) SAVES
// -------------------------------------------------------------------------

/** Builds the final Fort/Ref/Will stat. */
function buildSave(
	label: string,
	baseVal: number,
	abilityMod: number,
	resistanceBonus: number
): ValueWithBreakdown {
	const bonuses: BonusEntry[] = [
		{ source: 'Base Save', value: baseVal },
		{ source: 'Ability mod', value: abilityMod },
		{ source: 'ABP (Resistance)', value: resistanceBonus, type: 'resistance' }
	];
	return buildGenericStat(label, bonuses);
}

// -------------------------------------------------------------------------
// 3) AC
// -------------------------------------------------------------------------

interface ACParts {
	ac: ValueWithBreakdown;
	touch_ac: ValueWithBreakdown;
	flat_footed_ac: ValueWithBreakdown;
}

function computeACStats(
	char: CompleteCharacter,
	dexMod: number
): ACParts {
	const maxDexBonus = getMaxDexBonus(char);
	const effectiveDexMod = Math.min(dexMod, maxDexBonus);
	
	// Calculate enhanced armor values
	const wornArmor = char.equipment?.find(e => e.slot === 'armor' && e.equipped);
	const baseArmorBonus = wornArmor?.base?.bonus ?? 0;
	const armorEnhancement = getArmorEnhancement(char);
	const totalArmorBonus = baseArmorBonus + armorEnhancement;

	const baseNaturalArmor = getNaturalArmor(char);
	const naturalArmorEnhancement = getNaturalArmorEnhancement(char);
	const totalNaturalBonus = baseNaturalArmor + naturalArmorEnhancement;

	const deflection = getAbpBonusFromNodes(char, 'deflection');
	const hasDodgeFeat = char.feats?.some(f => f.name === 'dodge');

	// Define all possible AC components
	const acComponents = {
		base: { source: 'Base', value: 10 , type: 'base'},
		armor: { source: `Armor (${armorEnhancement > 0 ? `+${armorEnhancement}` : ''})`, 
				value: totalArmorBonus, 
				type: 'armor' },
		shield: { source: 'Shield', value: getShieldBonus(char), type: 'shield' },
		dex: { source: 'Dex mod', value: effectiveDexMod, type: 'dex' },
		size: { source: 'Size', value: getSizeModifier(char), type: 'size' },
		natural: { source: `Natural Armor (${naturalArmorEnhancement > 0 ? `+${naturalArmorEnhancement}` : ''})`, 
				  value: totalNaturalBonus, 
				  type: 'natural' },
		deflection: { source: 'Deflection', value: deflection, type: 'deflection' },
		dodge: { source: 'Dodge feat', value: hasDodgeFeat ? 1 : 0, type: 'dodge' }
	};

	const allBonuses = Object.values(acComponents);

	return {
		ac: buildGenericStat('AC', allBonuses),
		
		// Touch AC excludes armor, shield, and natural armor
		touch_ac: buildGenericStat('Touch AC', 
			allBonuses.filter(bonus => 
				!['armor', 'shield', 'natural'].includes(bonus.type ?? '')
			)
		),
		
		// Flat-footed excludes dex and dodge bonuses
		flat_footed_ac: buildGenericStat('Flat-Footed AC',
			allBonuses.filter(bonus => 
				bonus.source !== 'Dex mod' && bonus.type !== 'dodge'
			)
		)
	};
}

// -------------------------------------------------------------------------
// 4) CMB/CMD
// -------------------------------------------------------------------------

interface CombatManeuverParts {
	cmb: ValueWithBreakdown;
	cmd: ValueWithBreakdown;
}

function computeCombatManeuvers(
	bab: number,
	strMod: number,
	dexMod: number
): CombatManeuverParts {
	const cmb = buildGenericStat('CMB', [
		{ source: 'Str mod', value: strMod },
		{ source: 'BAB', value: bab }
	]);

	const cmd = buildGenericStat('CMD', [
		{ source: 'Base 10', value: 10 },
		{ source: 'Str mod', value: strMod },
		{ source: 'Dex mod', value: dexMod },
		{ source: 'BAB', value: bab }
	]);

	return { cmb, cmd };
}

// -------------------------------------------------------------------------
// 5) Skills
// -------------------------------------------------------------------------

function computeSkills(
	char: CompleteCharacter,
	strMod: number,
	dexMod: number,
	conMod: number,
	intMod: number,
	wisMod: number,
	chaMod: number
): Record<number, ValueWithBreakdown> {
	const skills: Record<number, ValueWithBreakdown> = {};
	const classSkillIds = getClassSkillIds(char);

	for (const skill of char.baseSkills) {
		const skillDetail = char.skillsWithRanks.find((s) => s.skillId === skill.id);
		const ranks = skillDetail?.totalRanks ?? 0;

		let abilityScoreMod = 0;
		switch (skill.ability) {
			case 'str': abilityScoreMod = strMod; break;
			case 'dex': abilityScoreMod = dexMod; break;
			case 'con': abilityScoreMod = conMod; break;
			case 'int': abilityScoreMod = intMod; break;
			case 'wis': abilityScoreMod = wisMod; break;
			case 'cha': abilityScoreMod = chaMod; break;
		}

		const bonuses: BonusEntry[] = [
			{ source: `${skill.ability.toUpperCase()} mod`, value: abilityScoreMod },
			{ source: 'Ranks', value: ranks }
		];
		if (classSkillIds.has(skill.id) && ranks > 0) {
			bonuses.push({ source: 'Class skill', value: 3 });
		}

		skills[skill.id] = buildGenericStat(skill.label, bonuses);
	}

	return skills;
}

// -------------------------------------------------------------------------
// 6) Attacks
// -------------------------------------------------------------------------

interface AttackParts {
	melee: ValueWithBreakdown;
	ranged: ValueWithBreakdown;
	bomb: {
		attack: ValueWithBreakdown;
		damage: ValueWithBreakdown;
	};
}

function computeAttacks(
	char: CompleteCharacter,
	bab: number,
	strMod: number,
	dexMod: number,
	intMod: number
): AttackParts {
	const weaponAttune = getAbpBonusFromNodes(char, 'weapon_attunement');

	function buildAttack(label: string, abilityModifier: number): ValueWithBreakdown {
		return buildGenericStat(label, [
			{ source: 'BAB', value: bab },
			{ source: 'Ability mod', value: abilityModifier },
			{ source: 'Weapon Attunement', value: weaponAttune }
		]);
	}

	const melee = buildAttack('Melee Attack', strMod);
	const ranged = buildAttack('Ranged Attack', dexMod);

	const bombAttack = buildAttack('Bomb Attack', dexMod);
	const bombDamage = buildGenericStat('Bomb Damage', [
		{ source: 'Int mod', value: intMod }
	]);

	return {
		melee,
		ranged,
		bomb: {
			attack: bombAttack,
			damage: bombDamage
		}
	};
}

//
// =====================  MAIN ENRICHING FUNCTION  =====================
//

export function enrichCharacterData(raw: CompleteCharacter): EnrichedCharacter {
	// 1) Compute each ability score
	const strength = buildAbilityScore(raw, 'strength');
	const dexterity = buildAbilityScore(raw, 'dexterity');
	const constitution = buildAbilityScore(raw, 'constitution');
	const intelligence = buildAbilityScore(raw, 'intelligence');
	const wisdom = buildAbilityScore(raw, 'wisdom');
	const charisma = buildAbilityScore(raw, 'charisma');

	// 2) Get numeric modifiers
	const strMod = abilityMod(strength.total);
	const dexMod = abilityMod(dexterity.total);
	const conMod = abilityMod(constitution.total);
	const intMod = abilityMod(intelligence.total);
	const wisMod = abilityMod(wisdom.total);
	const chaMod = abilityMod(charisma.total);

	// 3) Derive base saves, then build final saves
	const baseFort = calculateBaseSave(raw, 'fortitude');
	const baseRef = calculateBaseSave(raw, 'reflex');
	const baseWill = calculateBaseSave(raw, 'will');
	const resistance = getAbpBonusFromNodes(raw, 'resistance'); // Reused in each save

	const fortitude = buildSave('Fortitude', baseFort, conMod, resistance);
	const reflex = buildSave('Reflex', baseRef, dexMod, resistance);
	const will = buildSave('Will', baseWill, wisMod, resistance);

	// 4) Compute AC stats
	const { ac, touch_ac, flat_footed_ac } = computeACStats(raw, dexMod);

	// 5) Initiative (single stat)
	const initiative = buildGenericStat('Initiative', [
		{ source: 'Dex mod', value: dexMod }
	]);

	// 6) Compute BAB & Maneuvers
	const totalLevel = raw.classes.reduce((acc, c) => acc + (c.level || 1), 0);
	const bab = Math.floor((totalLevel * 3) / 4); // e.g. 3/4 progression
	const { cmb, cmd } = computeCombatManeuvers(bab, strMod, dexMod);

	// 7) Skills
	const skills = computeSkills(raw, strMod, dexMod, conMod, intMod, wisMod, chaMod);

	// 8) Attacks
	const attacks = computeAttacks(raw, bab, strMod, dexMod, intMod);

	// 9) Collate final result
	const enriched: EnrichedCharacter = {
		...raw,

		// Abilities
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

		// Saves
		saves: {
			fortitude,
			reflex,
			will
		},

		// AC
		ac,
		touch_ac,
		flat_footed_ac,
		initiative,

		// Combat Maneuvers
		cmb,
		cmd,

		// Skills
		skills,

		// Attacks
		attacks
	};

	// Single debug call at the end (optional)
	// debug('Final enriched character', enriched);

	return enriched;
}
