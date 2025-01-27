/******************************************************************************
 * FILE: src/lib/state/characterCalculations.ts
 *****************************************************************************/
import type { CompleteCharacter } from '$lib/db/getCompleteCharacter';
import type { AbpNodeBonusRow, AbpNodeRow } from '$lib/db/references';
import type { GameRulesData } from '$lib/db/getGameRulesData';

//
// =====================  INTERFACES & TYPES  =====================
//

export interface ValueWithBreakdown {
	label: string;
	modifiers: Array<{ source: string; value: number }>;
	total: number;
	trained_only?: boolean;
}

export interface SkillWithRanks {
	skillId: number;
	name: string;
	label: string;
	ability_label: string;
	totalRanks: number;
	ranksByLevel: Array<number>;
	isClassSkill: boolean;
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

	skillPoints: {
        total: Record<number, number>;      // level -> total points
        remaining: Record<number, number>;   // level -> remaining points
    };
    totalLevel: number;
    skillsWithRanks: SkillWithRanks[];
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
	const armor = char.armor?.[0];  // Take first armor if it exists
	return armor?.base?.max_dex ?? Infinity;
}

function getArmorBonus(char: CompleteCharacter, gameRules: GameRulesData): number {
	const armor = char.armor?.[0];  // Take first armor if it exists
	if (!armor) return 0;
	
	const baseBonus = armor.base?.armor_bonus ?? 0;
	
	// Get enhancement from ABP
	const abpBonus = getAbpBonusFromNodes(char, gameRules, 'armor_attunement');
	
	return baseBonus + abpBonus;
}

function getNaturalArmor(char: CompleteCharacter): number {
	// Check racial natural armor from first ancestry
	// const ancestry = char.ancestries[0]?.base;
	// Since natural_armor isn't in the type, we'll need to check for a bonus
	// that represents natural armor from the ancestry bonuses
	const racialNA = 0; // TODO: Implement actual natural armor lookup from bonuses
	
	return racialNA;
}

function getNaturalArmorEnhancement(char: CompleteCharacter, gameRules: GameRulesData): number {
	// First check for ABP natural armor enhancement
	// const abpBonus = getAbpBonusFromNodes(char, 'natural_armor_enhancement');

	// // Check for amulet of natural armor or similar items
	// const amulet = char.equipment?.find(e => 
	// 	e.slot === 'neck' && 
	// 	e.equipped && 
	// 	e.base?.enhances === 'natural_armor'
	// );
	// const itemBonus = amulet?.enhancement ?? 0;
	
	// // Return the higher of the two
	// return Math.max(abpBonus, itemBonus);
	const abpBonus = getAbpBonusFromNodes(char, gameRules, 'toughening');

	return abpBonus;
}

function getShieldBonus(char: CompleteCharacter): number {
	const shield = char.equipment?.find(e => 
		e.base?.equipment_category === 'shield' && 
		e.base?.equippable === true
	);
	if (!shield) return 0;
	
	const baseBonus = shield.base?.bonus ?? 0;
	// Since enhancement isn't in the type, we'll need to get it from another source
	const enhancement = 0; // TODO: Implement enhancement bonus lookup
	
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
	
	return sizeModifiers[char.ancestries[0]?.base?.size?.toLowerCase() ?? 'medium'] ?? 0;
}

//
// =====================  ABP-RELATED HELPERS  =====================
//

function getAllAutoNodes(
	gameRules: GameRulesData,
	effectiveABPLevel: number
): Array<AbpNodeRow & { bonuses: AbpNodeBonusRow[] }> {
	const { abpNodes, abpNodeGroups, abpNodeBonuses } = gameRules.references;

	// Build a map: nodeId -> all its BonusRows
	const nodeBonusMap = new Map<number, AbpNodeBonusRow[]>();
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
function getAbpBonusFromNodes(
	char: CompleteCharacter,
	gameRules: GameRulesData, 
	abpName: string
): number {
	const totalLevel = char.classes.reduce((acc, c) => acc + (c.level || 1), 0);
	const effectiveLevel = totalLevel + 2;

	const explicitNodes = char.abpChoices?.map((c) => c.base) || [];
	const autoNodes = getAllAutoNodes(gameRules, effectiveLevel);
	const allNodes = [...explicitNodes, ...autoNodes];

	const bonuses: BonusEntry[] = [];
	for (const node of allNodes) {
		// Get bonuses from gameRules instead of node
		const nodeBonuses = gameRules.references.abpNodeBonuses.filter(b => b.node_id === node.id);
		for (const bonus of nodeBonuses) {
			const bonusTypeName = gameRules.references.abpBonusTypes.find(
				bt => bt.id === bonus.bonus_type_id
			)?.name;
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

function getClassSkillIds(char: CompleteCharacter, gameRules: GameRulesData): Set<number> {
	const classSkillIds = new Set<number>();
	
	// Get class skills from relationships
	for (const cls of char.classes) {
		const classSkills = gameRules.relationships.classes.skills[cls.base.id] || [];
		classSkills.forEach(skillId => classSkillIds.add(skillId));
	}
	
	return classSkillIds;
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

function computeAbilityBonuses(
	char: CompleteCharacter,
	gameRules: GameRulesData,
	abilityName: string
): BonusEntry[] {
	const row = char.abilities?.find((a) => a.base?.name?.toLowerCase() === `${abilityName}`);
	const baseScore = row?.value ?? 10;

	const abpMap: Record<string, string> = {
		strength: 'physical_prowess_str',
		dexterity: 'physical_prowess_dex',
		constitution: 'physical_prowess_con',
		intelligence: 'mental_prowess_int',
		wisdom: 'mental_prowess_wis',
		charisma: 'mental_prowess_cha'
	};

	const abpName = abpMap[abilityName];
	const abpValue = abpName ? getAbpBonusFromNodes(char, gameRules, abpName) : 0;

	const bonuses: BonusEntry[] = [
		{ source: 'Base Score', value: baseScore, type: 'base' }
	];
	if (abpValue !== 0) {
		bonuses.push({ 
			source: 'ABP Node', 
			value: abpValue, 
			type: 'enhancement'  // ABP bonuses are enhancement type
		});
	}

	return bonuses;
}

function buildAbilityScore(
	char: CompleteCharacter,
	gameRules: GameRulesData,
	abilityName: string
): ValueWithBreakdown {
	const label =
		char.abilities?.find((a) => a.base?.name?.toLowerCase() === abilityName)?.base?.label ??
		abilityName[0].toUpperCase() + abilityName.slice(1);
	const bonuses = computeAbilityBonuses(char, gameRules, abilityName);
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
	gameRules: GameRulesData,
	dexMod: number
): ACParts {
	const maxDexBonus = getMaxDexBonus(char);
	const effectiveDexMod = Math.min(dexMod, maxDexBonus);

	const armorLabel = char.armor?.[0]?.base?.label;
	
	// Get armor bonus including enhancements
	const armorBonus = getArmorBonus(char, gameRules);

	const baseNaturalArmor = getNaturalArmor(char);
	const naturalArmorEnhancement = getNaturalArmorEnhancement(char, gameRules);
	const totalNaturalBonus = baseNaturalArmor + naturalArmorEnhancement;

	const deflection = getAbpBonusFromNodes(char, gameRules, 'deflection');
	const hasDodgeFeat = char.feats?.some(f => f.base?.name === 'dodge') ?? false;

	// Define all possible AC components
	const acComponents = {
		base: { source: 'Base', value: 10 , type: 'base'},
		armor: { source: `Armor (${armorLabel} ${armorBonus > 0 ? `+${armorBonus}` : ''})`, 
				value: armorBonus, 
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

	const allBonuses = Object.values(acComponents).filter(b => b.value !== 0);

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
	gameRules: GameRulesData,
	strMod: number,
	dexMod: number,
	conMod: number,
	intMod: number,
	wisMod: number,
	chaMod: number
): Record<number, ValueWithBreakdown> {
	const skills: Record<number, ValueWithBreakdown> = {};
	const classSkillIds = getClassSkillIds(char, gameRules);

	// Check for Generally Educated feat
	const hasGenerallyEducated = char.feats?.some(f => f.base?.name === 'generally_educated') ?? false;

	// Get all base skills from game rules
	for (const skill of gameRules.rules.skillRows) {
		// Find the character's ranks for this skill
		const ranks = char.skillRanks?.filter(sr => sr.base.id === skill.id).length ?? 0;

		let abilityScoreMod = 0;
		const abilityName = gameRules.rules.abilityRows.find(a => a.id === skill.ability_id)?.name?.toLowerCase() ?? '';
		switch (abilityName) {
			case 'strength': abilityScoreMod = strMod; break;
			case 'dexterity': abilityScoreMod = dexMod; break;
			case 'constitution': abilityScoreMod = conMod; break;
			case 'intelligence': abilityScoreMod = intMod; break;
			case 'wisdom': abilityScoreMod = wisMod; break;
			case 'charisma': abilityScoreMod = chaMod; break;
		}

		const abilityLabel = gameRules.rules.abilityRows.find(a => a.id === skill.ability_id)?.label ?? 'Unknown';

		const bonuses: BonusEntry[] = [
			{ source: `${abilityLabel} mod`, value: abilityScoreMod },
			{ source: 'Ranks', value: ranks }
		];
		
		if (classSkillIds.has(skill.id) && ranks > 0) {
			bonuses.push({ source: 'Class skill', value: 3 });
		}

		// Add Generally Educated bonus for Knowledge skills
		const isKnowledgeSkill = skill.name?.toLowerCase().startsWith('knowledge');
		if (hasGenerallyEducated && isKnowledgeSkill) {
			bonuses.push({ source: 'Generally Educated', value: 2 });
		}

		// Create the skill with a special property for trained_only override
		const skillStat = buildGenericStat(skill.label ?? 'Unknown', bonuses);
		
		// Add metadata about whether this skill should be treated as trained only
		const effectiveTrainedOnly = skill.trained_only && !(hasGenerallyEducated && isKnowledgeSkill);
		
		skills[skill.id] = {
			...skillStat,
			trained_only: effectiveTrainedOnly || undefined
		};
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
	gameRules: GameRulesData,
	bab: number,
	strMod: number,
	dexMod: number,
	intMod: number
): AttackParts {
	const weaponAttune = getAbpBonusFromNodes(char, gameRules, 'weapon_attunement');

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
// =====================  SKILL RANK CALCULATIONS  =====================
//

export interface SkillRanksByLevel {
	skillId: number;
	ranksByLevel: Array<number>
}

export function calculateTotalLevel(char: CompleteCharacter): number {
	return char.classes.reduce((acc, cls) => acc + (cls.level || 1), 0);
}

export function calculateSkillPointsByLevel(char: CompleteCharacter): Map<number, number> {
	const points = new Map<number, number>();
	let currentLevel = 0;
	
	// Get intelligence modifier from the ability scores
	const intScore = char.abilities?.find(a => 
		a.base?.name?.toLowerCase() === 'intelligence'
	)?.value ?? 10;
	const intMod = abilityMod(intScore);
	
	for (const cls of char.classes) {
		const basePoints = cls.base?.skill_ranks_per_level || 0;
		const pointsPerLevel = Math.max(1, basePoints + intMod);
		
		for (let i = 0; i < (cls.level || 0); i++) {
			currentLevel++;
			points.set(currentLevel, pointsPerLevel);
		}
	}
	
	return points;
}


function computeSkillsWithRanks(
	char: CompleteCharacter,
	gameRules: GameRulesData
): SkillWithRanks[] {
	const result: SkillWithRanks[] = [];
	
	// Get class skill IDs for all character classes
	const classSkillIds = new Set<number>();
	for (const charClass of char.classes) {
		const classSkills = gameRules.relationships.classes.skills[charClass.base?.id ?? 0] ?? [];
		classSkills.forEach(skillId => classSkillIds.add(skillId));
	}
	
	// Process each skill from rules
	for (const skill of gameRules.rules.skillRows) {
		// Get ability label
		const ability = gameRules.rules.abilityRows.find(a => a.id === skill.ability_id);
		const ability_label = ability?.label ?? 'Unknown';

		// Build ranks by level map and calculate total ranks
		const ranksByLevel: Array<number> = [];
		let totalRanks = 0;
		
		// Process each skill rank entry for this skill
		char.skillRanks?.forEach(rank => {
			if (rank.base.id === skill.id) {
				ranksByLevel.push(rank.applied_at_level);
				totalRanks++;
			}
		});

		result.push({
			skillId: skill.id,
			name: skill.name ?? 'Unknown',
			label: skill.label ?? 'Unknown Skill',
			ability_label,
			totalRanks,
			ranksByLevel,
			isClassSkill: classSkillIds.has(skill.id)
		});
	}

	return result;
}

//
// =====================  MAIN ENRICHING FUNCTION  =====================
//

export function enrichCharacterData(
	raw: CompleteCharacter, 
	gameRules: GameRulesData
): EnrichedCharacter {
	// 1) Compute each ability score
	const strength = buildAbilityScore(raw, gameRules, 'strength');
	const dexterity = buildAbilityScore(raw, gameRules, 'dexterity');
	const constitution = buildAbilityScore(raw, gameRules, 'constitution');
	const intelligence = buildAbilityScore(raw, gameRules, 'intelligence');
	const wisdom = buildAbilityScore(raw, gameRules, 'wisdom');
	const charisma = buildAbilityScore(raw, gameRules, 'charisma');

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
	const resistance = getAbpBonusFromNodes(raw, gameRules, 'resistance');

	const fortitude = buildSave('Fortitude', baseFort, conMod, resistance);
	const reflex = buildSave('Reflex', baseRef, dexMod, resistance);
	const will = buildSave('Will', baseWill, wisMod, resistance);

	// 4) Compute AC stats
	const { ac, touch_ac, flat_footed_ac } = computeACStats(raw, gameRules, dexMod);

	// 5) Initiative (single stat)
	const initiative = buildGenericStat('Initiative', [
		{ source: 'Dex mod', value: dexMod }
	]);

	// 6) Compute BAB & Maneuvers
	const totalLevel = raw.classes.reduce((acc, c) => acc + (c.level || 1), 0);
	const bab = Math.floor((totalLevel * 3) / 4); // e.g. 3/4 progression
	const { cmb, cmd } = computeCombatManeuvers(bab, strMod, dexMod);

	// 7) Skills and skill ranks
	const skillsWithRanks = computeSkillsWithRanks(raw, gameRules);
	const skills = computeSkills(
		raw, 
		gameRules,
		strMod, 
		dexMod, 
		conMod, 
		intMod, 
		wisMod, 
		chaMod
	);

	// 8) Attacks
	const attacks = computeAttacks(raw, gameRules, bab, strMod, dexMod, intMod);

	// 9) Calculate skill points per level
	const skillPointsTotal: Record<number, number> = {};
	let currentLevel = 0;
	
	for (const cls of raw.classes) {
		const basePoints = cls.base?.skill_ranks_per_level || 0;
		const pointsPerLevel = Math.max(1, basePoints + intMod);
		
		for (let i = 0; i < (cls.level || 0); i++) {
			currentLevel++;
			skillPointsTotal[currentLevel] = pointsPerLevel;
		}
	}

	// 10) Calculate remaining points per level
	const skillPointsRemaining: Record<number, number> = {};
	for (let level = 1; level <= totalLevel; level++) {
		const totalPoints = skillPointsTotal[level] || 0;
		const usedPoints = raw.skillRanks
			?.filter(skill => skill.applied_at_level === level)
			.length ?? 0;
		skillPointsRemaining[level] = totalPoints - usedPoints;
	}

	// 11) Collate final result
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
		attacks,

		// Skill points
		skillPoints: {
			total: skillPointsTotal,
			remaining: skillPointsRemaining
		},
		totalLevel,
		skillsWithRanks
	};

	// Single debug call at the end (optional)
	// debug('Final enriched character', enriched);

	return enriched;
}


