/******************************************************************************
 * FILE: src/lib/state/characterCalculations.ts
 *****************************************************************************/
import type { CompleteCharacter, GameRulesAPI } from '$lib/db/gameRules.api';
import type { 
	AbpNode,
	AbpNodeBonus
} from '$lib/db/gameRules.api';

//
// =====================  INTERFACES & TYPES  =====================
//

export interface ValueWithBreakdown {
	label: string;
	modifiers: Array<{ source: string; value: number }>;
	total: number;
	overrides?: {
		trained_only?: boolean;
		ability?: {
			original: string;
			override: string;
			source: string;
		};
		// We can add more override types here in the future!
		// For example:
		// proficiency?: { ... }
		// size?: { ... }
		// etc.
	};
}

export interface SkillWithRanks {
	skillId: number;
	name: string;
	isClassSkill: boolean;
	skillRanks: Array<{ level: number; rank: number }>;
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
		total: Record<number, ValueWithBreakdown>;      // Changed from number to ValueWithBreakdown
		remaining: Record<number, number>;
	};
	totalLevel: number;
	skillsWithRanks: SkillWithRanks[];
	processedClassFeatures: ProcessedFeature[];
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

interface AbpNodeWithBonuses {
	id: number;
	group_id: number;
	abp_node_bonus?: Array<{
		node_id: number;
		bonus_type_id: number;
		value: number;
		abp_bonus_type?: {
			id: number;
			name: string;
		};
	}>;
}

interface AbpCache {
	nodes: Array<{
		id: number;
		group_id: number;
		bonuses: Array<{
			node_id: number;
			bonus_type_id: number;
			value: number;
		}>;
	}>;
	bonusTypes: Record<number, string>;
}

interface CharacterCache {
	abp: AbpCache;
	classSkillIds: Set<number>;
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
	const penalties: BonusEntry[] = [];

	for (const bonus of bonuses) {
		if (bonus.value < 0) {
			// Collect penalties separately - they always stack
			penalties.push(bonus);
		} else {
			// Handle positive bonuses normally
			addBonus(acc, bonus.type, bonus.value);
		}
	}

	const total =
		Object.values(acc.typedBonuses).reduce((sum, v) => sum + v, 0) +
		acc.sumOfDodges +
		acc.sumOfCircumstance +
		acc.sumOfUntyped +
		// Add all penalties
		penalties.reduce((sum, p) => sum + p.value, 0);

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
	const armor = char.game_character_armor?.[0]?.armor;
	return armor?.max_dex ?? Infinity;
}

async function getArmorBonus(char: CompleteCharacter, gameRules: GameRulesAPI): Promise<number> {
	const armor = char.game_character_armor?.[0]?.armor;
	if (!armor) return 0;
	
	const baseBonus = armor.armor_bonus ?? 0;
	const abpBonus = await getAbpBonusFromNodes(char, gameRules, 'armor_attunement');
	
	return baseBonus + abpBonus;
}

function getNaturalArmor(char: CompleteCharacter): number {
	const ancestry = char.game_character_ancestry?.[0]?.ancestry;
	if (!ancestry) return 0;
	
	// Use the ancestry parameter to check for natural armor bonuses
	const ancestralNaturalArmor = 0; // TODO: Implement actual natural armor lookup from bonuses
	return ancestralNaturalArmor;
}

async function getNaturalArmorEnhancement(char: CompleteCharacter, gameRules: GameRulesAPI): Promise<number> {
	const abpBonus = await getAbpBonusFromNodes(char, gameRules, 'toughening');
	return abpBonus;
}

function getShieldBonus(char: CompleteCharacter): number {
	const shield = char.game_character_equipment?.find(e => 
		e.equipment?.equipment_category === 'shield' && 
		e.equipment?.equippable === true
	);
	if (!shield) return 0;
	
	const baseBonus = shield.equipment?.bonus ?? 0;
	// Enhancement bonuses will come from a different source
	return baseBonus;
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
	
	const size = char.game_character_ancestry?.[0]?.ancestry?.size?.toLowerCase() ?? 'medium';
	return sizeModifiers[size] ?? 0;
}

//
// =====================  ABP-RELATED HELPERS  =====================
//

async function getAllAutoNodes(
	gameRules: GameRulesAPI,
	effectiveABPLevel: number
): Promise<Array<AbpNode & { bonuses: AbpNodeBonus[] }>> {
	const [abpNodes, abpNodeGroups, abpNodeBonuses] = await Promise.all([
		gameRules.getAllAbpNode(),
		gameRules.getAllAbpNodeGroup(),
		gameRules.getAllAbpNodeBonus()
	]);

	// Build a map: nodeId -> all its BonusRows
	const nodeBonusMap = new Map<number, AbpNodeBonus[]>();
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
async function getAbpBonusFromNodes(
	char: CompleteCharacter,
	gameRules: GameRulesAPI, 
	abpName: string
): Promise<number> {
	const totalLevel = (char.game_character_class ?? []).reduce((acc, c) => acc + (c.level || 1), 0);
	const effectiveLevel = totalLevel + 2;

	// Get auto-granted nodes
	const autoNodes = await getAllAutoNodes(gameRules, effectiveLevel);

	// Get chosen nodes
	const chosenNodeIds = char.game_character_abp_choice?.map(c => c.node_id) || [];
	const chosenNodes = await Promise.all(
		chosenNodeIds.map(id => gameRules.getAbpNodeById(id))
	);
	const validChosenNodes = chosenNodes.filter((node): node is NonNullable<typeof node> => node != null);

	// Combine auto and chosen nodes
	const allNodes = [...autoNodes, ...validChosenNodes];

	// Get all bonus data in a single query
	const nodeBonuses = await gameRules.getAllAbpNodeBonus();
	const bonusTypes = await gameRules.getAllAbpBonusType();

	const bonuses: BonusEntry[] = [];
	for (const node of allNodes) {
		const bonusesForNode = nodeBonuses.filter(b => b.node_id === node.id);
		for (const bonus of bonusesForNode) {
			const bonusType = bonusTypes.find(bt => bt.id === bonus.bonus_type_id);
			if (bonusType?.name === abpName) {
				bonuses.push({
					source: `ABP Node ${node.id}`,
					value: bonus.value,
					type: bonusType.name
				});
			}
		}
	}

	return calculateStackedBonuses(bonuses).total;
}

// Modify getAbpCache to use the cache
function getAbpBonusFromCache(
	abpCache: AbpCache,
	abpName: string
): number {
	const bonuses: BonusEntry[] = [];
	
	for (const node of abpCache.nodes) {
		for (const bonus of node.bonuses) {
			const bonusType = abpCache.bonusTypes[bonus.bonus_type_id];
			if (bonusType === abpName) {
				bonuses.push({
					source: `ABP Node ${node.id}`,
					value: bonus.value,
					type: bonusType
				});
			}
		}
	}

	return calculateStackedBonuses(bonuses).total;
}

//
// =====================  SAVES & CLASS HELPERS  =====================
//

function calculateBaseSave(
	char: CompleteCharacter, 
	type: 'fortitude' | 'reflex' | 'will'
): number {
	return (char.game_character_class ?? []).reduce((acc, charClass) => {
		const level = charClass.level ?? 1;
		const isGood = charClass.class[type] === 'good';
		return acc + (isGood ? 2 + Math.floor(level / 2) : Math.floor(level / 3));
	}, 0);
}

// Update getClassSkillIds to use GameRulesAPI methods
async function getClassSkillIds(
	char: CompleteCharacter,
	gameRules: GameRulesAPI
): Promise<Set<number>> {
	const classIds = (char.game_character_class ?? []).map(c => c.class.id);
	const classSkills = await gameRules.getAllClassSkill();
	
	return new Set(
		classSkills
			.filter(cs => classIds.includes(cs.class_id))
			.map(cs => cs.skill_id)
	);
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

async function computeACStats(
	char: CompleteCharacter,
	gameRules: GameRulesAPI,
	dexMod: number
): Promise<ACParts> {
	const maxDexBonus = getMaxDexBonus(char);
	const effectiveDexMod = Math.min(dexMod, maxDexBonus);

	const armorLabel = char.game_character_armor?.[0]?.armor?.label;
	
	// Get armor bonus including enhancements
	const armorBonus = await getArmorBonus(char, gameRules);

	const baseNaturalArmor = getNaturalArmor(char);
	const naturalArmorEnhancement = await getNaturalArmorEnhancement(char, gameRules);
	const totalNaturalBonus = baseNaturalArmor + naturalArmorEnhancement;

	const deflection = await getAbpBonusFromNodes(char, gameRules, 'deflection');
	const hasDodgeFeat = char.game_character_feat?.some(f => f.feat?.name === 'dodge') ?? false;

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

async function computeSkills(
	char: CompleteCharacter,
	gameRules: GameRulesAPI,
	strMod: number,
	dexMod: number,
	conMod: number,
	intMod: number,
	wisMod: number,
	chaMod: number,
	classSkillIds: Set<number>
): Promise<Record<number, ValueWithBreakdown>> {
	const skills: Record<number, ValueWithBreakdown> = {};
	
	// Check for feats
	const hasGenerallyEducated = char.game_character_feat?.some(f => 
		f.feat?.name === 'generally_educated'
	) ?? false;

	// Check for traits
	const hasPragmaticActivator = char.game_character_trait?.some(t => 
		t.trait?.name === 'trait_pragmatic_activator'
	) ?? false;

	// Check for Perfect Recall (Mindchemist)
	const hasPerfectRecall = char.game_character_class_feature?.some(f => 
		f.class_feature?.name === 'perfect_recall' && 
		f.level_obtained <= calculateTotalLevel(char)
	) ?? false;

	// Add Vampiric Grace Stealth bonus
	const manifestations = char.game_character_corruption_manifestation ?? [];
	const corruptions = char.game_character_corruption ?? [];
	const hasVampiricGrace = manifestations.some(m => 
		m.corruption_manifestation?.name === 'vampiric_grace' && m.active
	);
	const hasAllure = manifestations.some(m => 
		m.corruption_manifestation?.name === 'allure' && m.active
	);
	const hasChildrenOfNight = manifestations.some(m => 
		m.corruption_manifestation?.name === 'children_of_the_night' && m.active
	);
	
	// Get manifestation level for Allure bonus
	const vampirism = corruptions.find(c => c.corruption?.name === 'vampirism');
	const manifestationLevel = vampirism?.manifestation_level ?? 0;
	const allureBonus = manifestationLevel >= 3 ? 4 : 2;

	// Get all skills from gameRules
	const allSkills = await gameRules.getAllSkill();
	
	for (const skill of allSkills) {
		// Count ranks for this skill
		const ranks = (char.game_character_skill_rank ?? [])
			.filter(sr => sr.skill_id === skill.id)
			.length;

		// Determine which ability modifier to use
		let abilityScoreMod = 0;
		const baseAbility = await gameRules.getAbilityById(skill.ability_id);
		const baseAbilityName = baseAbility?.name?.toLowerCase() ?? '';
		const baseAbilityLabel = baseAbility?.label ?? 'Unknown';

		// Check if we should use INT instead of CHA for this skill
		const isUMD = skill.name?.toLowerCase() === 'use_magic_device';
		const isDiplomacy = skill.name?.toLowerCase() === 'diplomacy';
		
		let overrides = undefined;
		
		if (baseAbilityName === 'charisma') {
			if (isUMD && hasPragmaticActivator) {
				abilityScoreMod = intMod;
				overrides = {
					ability: {
						original: baseAbilityLabel,
						override: 'Intelligence',
						source: 'Pragmatic Activator'
					}
				};
			} else if (isDiplomacy && char.game_character_trait?.some(t => 
				t.trait?.name === 'trait_clever_wordplay_diplomacy'
			)) {
				abilityScoreMod = intMod;
				overrides = {
					ability: {
						original: baseAbilityLabel,
						override: 'Intelligence',
						source: 'Clever Wordplay'
					}
				};
			} else {
				abilityScoreMod = chaMod;
			}
		} else {
			switch (baseAbilityName) {
				case 'strength': abilityScoreMod = strMod; break;
				case 'dexterity': abilityScoreMod = dexMod; break;
				case 'constitution': abilityScoreMod = conMod; break;
				case 'intelligence': abilityScoreMod = intMod; break;
				case 'wisdom': abilityScoreMod = wisMod; break;
			}
		}

		// Determine the ability modifier source label based on overrides
		let abilityModSource = baseAbilityLabel;
		if (overrides?.ability) {
			abilityModSource = overrides.ability.override;
		}

		const bonuses: BonusEntry[] = [
			{ source: `${abilityModSource} Mod`, value: abilityScoreMod },
			{ source: 'Ranks', value: ranks }
		];
		
		// Add second INT bonus for Knowledge skills with Perfect Recall
		if (hasPerfectRecall && skill.knowledge_skill) {
			bonuses.push({ source: 'Perfect Recall (Int)', value: intMod });
		}
		
		if (classSkillIds.has(skill.id) && ranks > 0) {
			bonuses.push({ source: 'Class skill', value: 3 });
		}

		if (hasGenerallyEducated && skill.knowledge_skill) {
			bonuses.push({ source: 'Generally Educated', value: 2 });
		}

		// Add Vampiric Grace Stealth bonus
		if (hasVampiricGrace && skill.name?.toLowerCase() === 'stealth') {
			bonuses.push({
				source: 'Vampiric Grace',
				value: 2,
				type: 'ancestral'
			});
		}

		// Add Allure social skill bonuses
		if (hasAllure) {
			const skillName = skill.name?.toLowerCase();
			if (skillName === 'bluff' || skillName === 'diplomacy' || skillName === 'intimidate') {
				bonuses.push({
					source: 'Allure',
					value: allureBonus,
					type: 'ancestral'
				});
			}
		}

		// Add Children of the Night penalty
		if (hasChildrenOfNight) {
			const skillName = skill.name?.toLowerCase();
			if (skillName === 'handle_animal' || skillName === 'ride') {
				bonuses.push({
					source: 'Children of the Night (vs normal animals)',
					value: -3,
					type: 'penalty'
				});
			}
		}

		const skillStat = buildGenericStat(skill.label ?? 'Unknown', bonuses);
		const effectiveTrainedOnly = skill.trained_only && !(hasGenerallyEducated && skill.knowledge_skill);
		
		skills[skill.id] = {
			...skillStat,
			overrides: {
				...overrides,
				trained_only: effectiveTrainedOnly ?? undefined
			}
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
/** Calculate base attack bonus including all iterative attacks */
async function calculateBAB(
	char: CompleteCharacter
): Promise<number[]> {
	// Get all character classes and their BAB progression IDs
	const charClasses = char.game_character_class ?? [];

	// Calculate base BAB based on progression type
	let baseBAB = 0;
	for (const charClass of charClasses) {
		const classLevel = charClass.level ?? 1;
		const progressionId = charClass.class.base_attack_bonus_progression;
		
		if (progressionId) {
			// Handle different BAB progression types
			switch (progressionId) {
				case 1: // Full BAB
					baseBAB += classLevel;
					break;
				case 2: // 3/4 BAB
					baseBAB += Math.floor(classLevel * 0.75);
					break;
				case 3: // 1/2 BAB
					baseBAB += Math.floor(classLevel * 0.5);
					break;
				default:
					console.warn(`Unknown BAB progression ID: ${progressionId}`);
			}
		}
	}

	// Calculate iterative attacks
	const attacks: number[] = [baseBAB];
	
	// Add iterative attacks at -5 penalties
	let iterativeBAB = baseBAB;
	while (iterativeBAB > 5) {
		iterativeBAB -= 5;
		attacks.push(iterativeBAB);
	}

	return attacks;
}

// Update computeAttacks to use the new BAB calculation
async function computeAttacks(
	char: CompleteCharacter,
	gameRules: GameRulesAPI,
	strMod: number,
	dexMod: number,
	intMod: number
): Promise<AttackParts> {
	const weaponAttune = await getAbpBonusFromNodes(char, gameRules, 'weapon_attunement');
	const babProgression = await calculateBAB(char);

	function buildAttack(label: string, abilityModifier: number): ValueWithBreakdown {
		const bonuses: BonusEntry[] = [
			{ source: 'Base Attack', value: babProgression[0] },
			{ source: 'Ability mod', value: abilityModifier },
			{ source: 'Weapon Attunement', value: weaponAttune }
		];

		// Add iterative attacks to the label if they exist
		if (babProgression.length > 1) {
			const iteratives = babProgression
				.slice(1)
				.map(bab => bab + abilityModifier + weaponAttune)
				.join('/');
			label = `${label} (${bonuses[0].value + abilityModifier + weaponAttune}/${iteratives})`;
		}

		return buildGenericStat(label, bonuses);
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
	return (char.game_character_class ?? []).reduce((acc: number, cls) => acc + (cls.level || 1), 0);
}

export function calculateSkillPointsTotal(
	char: CompleteCharacter
): Record<number, ValueWithBreakdown> {
	const skillPointsTotal: Record<number, ValueWithBreakdown> = {};
	
	// Get base skill points from class
	for (const charClass of (char.game_character_class ?? [])) {
		const classSkillPoints = charClass.class.skill_ranks_per_level ?? 0;
		const maxLevel = charClass.level ?? 1;
		
		// Calculate for each level up to current
		for (let level = 1; level <= maxLevel; level++) {
			const intBonus = getAbilityModifier(char, 'intelligence');
			const ancestralBonus = 0;
			
			skillPointsTotal[level] = buildGenericStat(`Level ${level} Skill Points`, [
				{ source: `${charClass.class.label ?? 'Unknown'} Base`, value: classSkillPoints },
				{ source: 'Intelligence Modifier', value: intBonus },
				{ source: 'Ancestral Bonus', value: ancestralBonus }
			]);
		}
	}
	
	return skillPointsTotal;
}

function getAbilityModifier(
	char: CompleteCharacter,
	abilityName: string
): number {
	const ability = char.game_character_ability?.find(
		a => a.ability?.name?.toLowerCase() === abilityName.toLowerCase()
	);
	return ability ? abilityMod(ability.value) : 0;
}

function calculateSkillPointsRemaining(
	char: CompleteCharacter,
	totalPoints: Record<number, ValueWithBreakdown>
): Record<number, number> {
	const remaining: Record<number, number> = {};
	
	// Calculate spent points per level
	const spentByLevel = new Map<number, number>();
	for (const rank of (char.game_character_skill_rank ?? [])) {
		const level = rank.applied_at_level;
		spentByLevel.set(level, (spentByLevel.get(level) ?? 0) + 1);
	}
	
	// Calculate remaining points
	for (const [level, points] of Object.entries(totalPoints)) {
		remaining[Number(level)] = points.total - (spentByLevel.get(Number(level)) ?? 0);
	}
	
	return remaining;
}

async function getSkillsWithRanks(
	char: CompleteCharacter,
	gameRules: GameRulesAPI,
	classSkillIds: Set<number>
): Promise<SkillWithRanks[]> {
	const skillsWithRanks: SkillWithRanks[] = [];
	
	// Group ranks by skill
	const ranksBySkill = new Map<number, Array<{ level: number; rank: number }>>();
	for (const rank of (char.game_character_skill_rank ?? [])) {
		if (!ranksBySkill.has(rank.skill_id)) {
			ranksBySkill.set(rank.skill_id, []);
		}
		ranksBySkill.get(rank.skill_id)!.push({
			level: rank.applied_at_level,
			rank: 1 // Assuming 1 rank per entry
		});
	}

	// Convert to SkillWithRanks array
	for (const [skillId, ranks] of ranksBySkill) {
		const skill = await gameRules.getSkillById(skillId);
		if (skill) {
			skillsWithRanks.push({
				skillId,
				name: skill.name ?? '',
				isClassSkill: classSkillIds.has(skillId),
				skillRanks: ranks.sort((a, b) => a.level - b.level)
			});
		}
	}

	return skillsWithRanks;
}

export interface ProcessedFeature {
	id: number;
	name: string;
	label: string;
	description: string | null;
	type: string | null;
	level: number;
	className: string;
}

export function processClassFeatures(char: CompleteCharacter): ProcessedFeature[] {
	if (!char.game_character_class_feature) return [];

	const uniqueFeatures = new Map();
	char.game_character_class_feature.forEach(feature => {
		if (!uniqueFeatures.has(feature.class_feature_id)) {
			uniqueFeatures.set(feature.class_feature_id, {
				id: feature.class_feature.id,
				name: feature.class_feature.name,
				label: feature.class_feature.label ?? feature.class_feature.name,
				description: parseNewlines(feature.class_feature.description),
				type: feature.class_feature.type,
				level: feature.level_obtained,
				className: char.game_character_class[0].class.label ?? char.game_character_class[0].class.name
			});
		}
	});

	return Array.from(uniqueFeatures.values())
		.sort((a, b) => a.level - b.level);
}

function parseNewlines(text: string | null): string {
	if (!text) return '';
	return text.replace(/\\n/g, '\n');
}

//
// =====================  MAIN ENRICHING FUNCTION  =====================
//

export async function enrichCharacterData(
	char: CompleteCharacter,
	gameRules: GameRulesAPI
): Promise<EnrichedCharacter> {
	// Load all cache data at once
	const cache = await loadCharacterCache(char, gameRules);

	// Get abilities from character data
	const abilities = char.game_character_ability?.map(a => ({
		name: a.ability?.name?.toLowerCase() ?? '',
		value: a.value,
		label: a.ability?.label ?? ''
	})) ?? [];

	// Build ability scores using local data
	const buildAbilityScore = (abilityName: string): ValueWithBreakdown => {
		const ability = abilities.find(a => a.name === abilityName.toLowerCase());
		const bonuses = [
			{ source: 'Base Score', value: ability?.value ?? 10, type: 'base' }
		];

		// Get ABP bonuses from cache
		const abpMap: Record<string, string[]> = {
			strength: ['physical_prowess_str', 'physical_prowess_all'],
			dexterity: ['physical_prowess_dex', 'physical_prowess_all'],
			constitution: ['physical_prowess_con', 'physical_prowess_all'],
			intelligence: ['mental_prowess_int', 'mental_prowess_all'],
			wisdom: ['mental_prowess_wis', 'mental_prowess_all'],
			charisma: ['mental_prowess_cha', 'mental_prowess_all']
		};

		const abpTypes = abpMap[abilityName.toLowerCase()] ?? [];
		let maxAbpBonus = 0;
		for (const abpType of abpTypes) {
			const bonus = getAbpBonusFromCache(cache.abp, abpType);
			maxAbpBonus = Math.max(maxAbpBonus, bonus);
		}

		if (maxAbpBonus > 0) {
			bonuses.push({ 
				source: 'ABP Enhancement', 
				value: maxAbpBonus, 
				type: 'enhancement' 
			});
		}

		return buildGenericStat(ability?.label ?? abilityName, bonuses);
	};

	// Calculate all ability scores at once
	const [strength, dexterity, constitution, intelligence, wisdom, charisma] = [
		'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'
	].map(buildAbilityScore);

	// Calculate ability modifiers correctly using abilityMod function
	const strMod = abilityMod(strength.total);
	const dexMod = abilityMod(dexterity.total);
	const conMod = abilityMod(constitution.total);
	const intMod = abilityMod(intelligence.total);
	const wisMod = abilityMod(wisdom.total);
	const chaMod = abilityMod(charisma.total);

	// Get resistance bonus
	const resistance = getAbpBonusFromCache(cache.abp, 'resistance');

	// Build saves with awaited resistance value and corrected ability mods
	const baseFort = calculateBaseSave(char, 'fortitude');
	const baseRef = calculateBaseSave(char, 'reflex');
	const baseWill = calculateBaseSave(char, 'will');
	const fortitude = buildSave('Fortitude', baseFort, conMod, resistance);
	const reflex = buildSave('Reflex', baseRef, dexMod, resistance);
	const will = buildSave('Will', baseWill, wisMod, resistance);

	// 4) Compute AC stats with corrected dexMod
	const { ac, touch_ac, flat_footed_ac } = await computeACStats(char, gameRules, dexMod);

	// 5) Initiative (single stat)
	const initiative = buildGenericStat('Initiative', [
		{ source: 'Dex mod', value: dexMod }
	]);

	// 6) Compute BAB & Maneuvers with corrected ability mods
	const bab = Math.floor((calculateTotalLevel(char) * 3) / 4); // e.g. 3/4 progression
	const { cmb, cmd } = computeCombatManeuvers(bab, strMod, dexMod);

	// 7) Skills and skill ranks with corrected ability mods
	const skills = await computeSkills(
		char, 
		gameRules,
		strMod, 
		dexMod, 
		conMod, 
		intMod, 
		wisMod, 
		chaMod,
		cache.classSkillIds
	);
	const skillsWithRanks = await getSkillsWithRanks(char, gameRules, cache.classSkillIds);

	// 8) Attacks with corrected ability mods
	const attacks = await computeAttacks(char, gameRules, strMod, dexMod, intMod);

	// Process class features
	const processedClassFeatures = processClassFeatures(char);

	// 9) Collate final result with corrected ability mods
	const enriched: EnrichedCharacter = {
		...char,
		
		// Abilities and their modifiers
		strength,
		dexterity,
		constitution,
		intelligence,
		wisdom,
		charisma,

		// Store the correctly calculated ability modifiers
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

		// AC values
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
			total: calculateSkillPointsTotal(char),
			remaining: calculateSkillPointsRemaining(char, calculateSkillPointsTotal(char))
		},
		totalLevel: calculateTotalLevel(char),
		skillsWithRanks,

		// Add processed class features
		processedClassFeatures
	};

	return enriched;
}

// Update loadCharacterCache to use the new methods
async function loadCharacterCache(
	char: CompleteCharacter,
	gameRules: GameRulesAPI
): Promise<CharacterCache> {
	const [abp, classSkillIds] = await Promise.all([
		getAbpCache(char, gameRules),
		getClassSkillIds(char, gameRules)
	]);

	return {
		abp,
		classSkillIds
	};
}

async function getAbpCache(
	char: CompleteCharacter,
	gameRules: GameRulesAPI
): Promise<AbpCache> {
	const totalLevel = calculateTotalLevel(char);
	const effectiveLevel = totalLevel + 2;
	const chosenNodeIds = char.game_character_abp_choice?.map(c => c.node_id) || [];

	const { nodes, chosenNodes } = await gameRules.getAbpCacheData(effectiveLevel, chosenNodeIds);

	// Process the data
	const bonusTypeMap: Record<number, string> = {};
	const processedNodes = nodes.map((node: AbpNodeWithBonuses) => {
		const bonuses = node.abp_node_bonus || [];
		bonuses.forEach((bonus) => {
			if (bonus.abp_bonus_type) {
				bonusTypeMap[bonus.abp_bonus_type.id] = bonus.abp_bonus_type.name;
			}
		});
		return {
			...node,
			bonuses: bonuses.map((b) => ({
				node_id: b.node_id,
				bonus_type_id: b.bonus_type_id,
				value: b.value
			}))
		};
	});

	const processedChosenNodes = chosenNodes.map((node: AbpNodeWithBonuses) => {
		const bonuses = node.abp_node_bonus || [];
		bonuses.forEach((bonus) => {
			if (bonus.abp_bonus_type) {
				bonusTypeMap[bonus.abp_bonus_type.id] = bonus.abp_bonus_type.name;
			}
		});
		return {
			...node,
			bonuses: bonuses.map((b) => ({
				node_id: b.node_id,
				bonus_type_id: b.bonus_type_id,
				value: b.value
			}))
		};
	});

	return {
		nodes: [...processedNodes, ...processedChosenNodes],
		bonusTypes: bonusTypeMap
	};
}





