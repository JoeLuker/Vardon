/******************************************************************************
 * FILE: src/lib/state/characterCalculations.ts
 *****************************************************************************/
import { GameRulesAPI } from '../db/gameRules.api';
import type { ProcessedClassFeature, CompleteCharacter } from '../db/gameRules.api';
import type { Database } from '$lib/domain/types/supabase';

type Tables = Database['public']['Tables']
type Row<T extends keyof Tables> = Tables[T]['Row']

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
			bombDice: number;
		};
	};

	skillPoints: {
		total: Record<number, ValueWithBreakdown>;      // Changed from number to ValueWithBreakdown
		remaining: Record<number, number>;
	};
	totalLevel: number;
	skillsWithRanks: SkillWithRanks[];
	processedClassFeatures: ProcessedClassFeature[];
}

interface BonusEntry {
	source: string;
	value: number;
	type: string;
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
	name: string;
	label: string | null;
	description: string | null;
	requires_choice: boolean;
	created_at: string | null;
	updated_at: string | null;
	bonuses: Array<{
		id: number;
		node_id: number;
		bonus_type_id: number;
		value: number;
		target_specifier: string | null;
		created_at: string | null;
		updated_at: string | null;
		bonus_type: {
			id: number;
			name: string;
			label: string | null;
			created_at: string | null;
			updated_at: string | null;
		};
	}>;
}

interface AbpCache {
	nodes: AbpNodeWithBonuses[];
	bonusTypes: Record<number, string>;
}

interface CharacterCache {
	abp: AbpCache;
	classSkillIds: Set<number>;
	ancestryTraits: {
		bonusesByTarget: Record<string, BonusEntry[]>;
	};
}

interface SizeData {
	baseSize: string;
	effectiveSize: string;
	modifier: number;
	modifiers: Array<{ source: string; value: number }>;
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

async function getArmorBonus(
	char: CompleteCharacter, 
	cache: CharacterCache
): Promise<number> {
	const armor = char.game_character_armor?.[0]?.armor;
	if (!armor) return 0;
	
	const baseBonus = armor.armor_bonus ?? 0;
	const abpBonus = getAbpBonusFromCache(cache.abp, 'armor_attunement');
	
	return baseBonus + abpBonus;
}

function getNaturalArmor(char: CompleteCharacter): number {
	const ancestry = char.game_character_ancestry?.[0]?.ancestry;
	if (!ancestry) return 0;
	
	// Use the ancestry parameter to check for natural armor bonuses
	const ancestralNaturalArmor = 0; // TODO: Implement actual natural armor lookup from bonuses
	return ancestralNaturalArmor;
}

async function getNaturalArmorEnhancement(
	cache: CharacterCache
): Promise<number> {
	return getAbpBonusFromCache(cache.abp, 'toughening');
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

//
// =====================  ABP-RELATED HELPERS  =====================
//

/** Sum up all ABP bonuses of `abpName` from auto-granted + chosen nodes. */
async function getAbpBonusFromNodes(
	char: CompleteCharacter,
	gameRules: GameRulesAPI, 
	abpName: string
): Promise<number> {
	// Get the cache
	const cache = await loadCharacterCache(char, gameRules);
	const chosenNodeIds = char.game_character_abp_choice?.map(c => c.node_id) || [];
	
	// Use the cached version
	return getAbpBonusFromCache(cache.abp, abpName, chosenNodeIds);
}

// Modify getAbpCache to use the cache
function getAbpBonusFromCache(
    abpCache: AbpCache,
    abpName: string,
    chosenNodeIds: number[] = []
): number {
    const bonuses: BonusEntry[] = [];
    
    for (const node of abpCache.nodes) {
        // Skip choice nodes that weren't chosen
        if (node.requires_choice && !chosenNodeIds.includes(node.id)) {
            continue;
        }

        // Skip non-choice nodes in choice groups if a choice was made
        if (!node.requires_choice && node.group_id) {
            const groupHasChoice = abpCache.nodes.some(n => 
                n.group_id === node.group_id && n.requires_choice
            );
            const choiceMadeInGroup = chosenNodeIds.some(chosenId => 
                abpCache.nodes.some(n => 
                    n.id === chosenId && n.group_id === node.group_id
                )
            );
            if (groupHasChoice && choiceMadeInGroup) {
                continue;
            }
        }

        // Add bonuses from valid nodes
        for (const bonus of node.bonuses) {
            if (bonus.bonus_type.name === abpName) {
                bonuses.push({
                    source: `ABP Node: ${node.label}`,
                    value: bonus.value,
                    type: bonus.bonus_type.name
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


// Update ancestry trait bonus checks
function getAncestryTraitBonuses(
    cache: CharacterCache,
    targetSubtype?: string
): BonusEntry[] {
	
    return cache.ancestryTraits.bonusesByTarget[targetSubtype?.toLowerCase() ?? ''] ?? [];
}

async function buildAbilityScore(
    abilityName: string,	
    char: CompleteCharacter,
    cache: CharacterCache
): Promise<ValueWithBreakdown> {
    // Find the character's ability score from game_character_ability
    const charAbility = char.game_character_ability?.find(a => 
        a.ability.name.toLowerCase() === abilityName.toLowerCase()
    );

    const baseValue = charAbility?.value ?? 10;
    const abilityLabel = charAbility?.ability.label ?? abilityName;

    const bonuses = [
        { source: 'Base Score', value: baseValue, type: 'base' }
    ];

    // Get chosen node IDs from character
    const chosenNodeIds = char.game_character_abp_choice?.map(c => c.node_id) || [];

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
        const bonus = getAbpBonusFromCache(cache.abp, abpType, chosenNodeIds);
        maxAbpBonus = Math.max(maxAbpBonus, bonus);
    }

    if (maxAbpBonus > 0) {
        bonuses.push({ 
            source: 'ABP Enhancement', 
            value: maxAbpBonus, 
            type: 'enhancement' 
        });
    }

    // Add ancestry bonuses with correct target
    bonuses.push(...getAncestryTraitBonuses(cache, abilityName));

    return buildGenericStat(abilityLabel, bonuses);
}

// -------------------------------------------------------------------------
// 2) SAVES
// -------------------------------------------------------------------------

/** Builds the final Fort/Ref/Will stat. */
function buildSave(
	cache: CharacterCache,
	label: string,
	baseVal: number,
	abilityMod: number,
	resistanceBonus: number,
	abilityLabel: string
): ValueWithBreakdown {
	const bonuses: BonusEntry[] = [
		{ source: 'Base Save', value: baseVal, type: 'base' },
		{ source: `${abilityLabel} modifier`, value: abilityMod, type: 'ability' },
		{ source: 'ABP (Resistance)', value: resistanceBonus, type: 'resistance' },
		...getAncestryTraitBonuses(cache, label.toLowerCase())
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
	allBonuses: BonusEntry[];
}

async function calculateSize(
	char: CompleteCharacter
): Promise<SizeData> {
	// Access size through the ancestry object instead of trait
	const baseSize = char.game_character_ancestry?.[0]?.ancestry?.size?.toLowerCase() ?? 'medium';
	
	// Size step values (from smallest to largest)
	const sizeSteps = ['fine', 'diminutive', 'tiny', 'small', 'medium', 'large', 'huge', 'gargantuan', 'colossal'];
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

	// Collect size modifiers (e.g., from spells, effects, etc.)
	const modifiers: Array<{ source: string; value: number }> = [];
	
	// Example: Check for Reduce/Enlarge Person effects
	// TODO: Add actual effect checking logic here
	
	// Calculate total size steps adjustment
	const totalStepChange = modifiers.reduce((sum, mod) => sum + mod.value, 0);
	
	// Find base size index and apply changes
	const baseSizeIndex = sizeSteps.indexOf(baseSize);
	if (baseSizeIndex === -1) return {
		baseSize: 'medium',
		effectiveSize: 'medium',
		modifier: 0,
		modifiers: []
	};
	
	// Calculate new size index (clamped to valid sizes)
	const effectiveSizeIndex = Math.max(0, Math.min(sizeSteps.length - 1, baseSizeIndex + totalStepChange));
	const effectiveSize = sizeSteps[effectiveSizeIndex];
	
	return {
		baseSize,
		effectiveSize,
		modifier: sizeModifiers[effectiveSize] ?? 0,
		modifiers
	};
}

async function computeACStats(
	char: CompleteCharacter,
	gameRules: GameRulesAPI,
	dexMod: number,
	wisMod: number,
	cache: CharacterCache
): Promise<ACParts> {
	const sizeData = await calculateSize(char);
	const maxDexBonus = getMaxDexBonus(char);
	const effectiveDexMod = Math.min(dexMod, maxDexBonus);

	const armorLabel = char.game_character_armor?.[0]?.armor?.label;
	
	// Get armor bonus including enhancements
	const armorBonus = await getArmorBonus(char, cache);

	const baseNaturalArmor = getNaturalArmor(char);
	const naturalArmorEnhancement = await getNaturalArmorEnhancement(cache);
	const totalNaturalBonus = baseNaturalArmor + naturalArmorEnhancement;

	const deflection = await getAbpBonusFromNodes(char, gameRules, 'deflection');
	const hasDodgeFeat = char.game_character_feat?.some(f => f.feat?.name === 'dodge') ?? false;

	// Check for Ascetic AC bonus feature
	const hasAsceticACBonus = char.processedClassFeatures?.some(f => 
		f.name === 'ac_bonus_ascetic'
	) ?? false;

	// Define all possible AC components
	const acComponents = {
		base: { source: 'Base', value: 10 , type: 'base'},
		armor: { source: `Armor (${armorLabel} ${armorBonus > 0 ? `+${armorBonus}` : ''})`, 
				value: armorBonus, 
				type: 'armor' },
		shield: { source: 'Shield', value: getShieldBonus(char), type: 'shield' },
		dex: { source: 'Dex mod', value: effectiveDexMod, type: 'dex' },
		wisdom: { source: 'Wisdom mod (Ascetic)', value: wisMod, type: 'wisdom' },
		size: { source: 'Size', value: sizeData.modifier, type: 'size' },
		natural: { source: `Natural Armor (${naturalArmorEnhancement > 0 ? `+${naturalArmorEnhancement}` : ''})`, 
				  value: totalNaturalBonus, 
				  type: 'natural' },
		deflection: { source: 'Deflection', value: deflection, type: 'deflection' },
		dodge: { source: 'Dodge feat', value: hasDodgeFeat ? 1 : 0, type: 'dodge' }
	};

	// Add Wisdom modifier if character has Ascetic AC bonus
	if (hasAsceticACBonus) {
		acComponents.wisdom = { 
			source: 'Wisdom mod (Ascetic)', 
			value: wisMod, 
			type: 'wisdom' 
		};
	}

	const allBonuses = [
		...Object.values(acComponents).filter(b => b.value !== 0),
		...getAncestryTraitBonuses(cache, 'ac'),
		...getClassFeatureBonuses(char, 'ac')
	];

	const touchAcBonuses = [
		...getAncestryTraitBonuses(cache, 'touch_ac'),
		...getClassFeatureBonuses(char, 'touch_ac')
	];
	const flatFootedAcBonuses = [
		...getAncestryTraitBonuses(cache, 'flat_footed_ac'),
		...getClassFeatureBonuses(char, 'flat_footed_ac')
	];

	return {
		ac: buildGenericStat('AC', allBonuses),
		touch_ac: buildGenericStat('Touch AC', [
			...allBonuses.filter(bonus => {
				const type = bonus.type?.toLowerCase();
				// Exclude bonus types that don't apply to touch AC
				return type !== 'armor' && 
					   type !== 'shield' && 
					   type !== 'natural';
			}),
			...touchAcBonuses
		]),
		flat_footed_ac: buildGenericStat('Flat-Footed AC', [
			...allBonuses.filter(bonus => {
				const type = bonus.type?.toLowerCase();
				// Exclude dex and dodge bonuses for flat-footed
				return type !== 'dex' && type !== 'dodge';
			}),
			...flatFootedAcBonuses
		]),
		allBonuses
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
	attackBonuses: AttackBonuses,
	strMod: number,
	dexMod: number,
	acBonuses: BonusEntry[],
	cache: CharacterCache,
	size: string = 'medium'
): CombatManeuverParts {
	// Size modifier mapping
	const sizeModifiers: Record<string, number> = {
		fine: -8,
		diminutive: -4,
		tiny: -2,
		small: -1,
		medium: 0,
		large: 1,
		huge: 2,
		gargantuan: 4,
		colossal: 8
	};

	const sizeModifier = sizeModifiers[size.toLowerCase()] ?? 0;
	const isSmallOrLarger = !['fine', 'diminutive', 'tiny'].includes(size.toLowerCase());
	
	// For Tiny or smaller creatures, use Dex instead of Str
	const attributeModifier = isSmallOrLarger ? strMod : dexMod;
	const attributeName = isSmallOrLarger ? 'Strength' : 'Dexterity';

	const cmbBonuses = [
		{ source: `${attributeName} modifier`, value: attributeModifier, type: 'ability' },
		{ source: 'Base Attack', value: attackBonuses.baseAttackBonus, type: 'base' },
		{ source: 'Weapon Attunement', value: attackBonuses.weaponAttunement, type: 'attunement' },
		{ source: 'ABP Enhancement', value: attackBonuses.enhancement, type: 'enhancement' },
		{ source: 'Size modifier', value: sizeModifier, type: 'size' },
		...getAncestryTraitBonuses(cache, 'combat_maneuver_bonus')
	];

	const cmb = buildGenericStat('CMB', cmbBonuses);

	const cmdBonuses = [
		{ source: 'Base 10', value: 10, type: 'base' },
		{ source: 'Strength modifier', value: strMod, type: 'ability' },
		{ source: 'Dexterity modifier', value: dexMod, type: 'ability' },
		{ source: 'BAB', value: attackBonuses.baseAttackBonus, type: 'base' },
		{ source: 'Size modifier', value: sizeModifier, type: 'size' },
		...getAncestryTraitBonuses(cache, 'combat_maneuver_defense')
	];

	// Add applicable AC bonuses
	const applicableTypes = ['circumstance', 'deflection', 'dodge', 'insight', 'luck', 'morale', 'profane', 'sacred', 'penalty'];
	const filteredBonuses = acBonuses.filter(bonus => 
		!bonus.type || applicableTypes.includes(bonus.type)
	);
	cmdBonuses.push(...filteredBonuses);

	const cmd = buildGenericStat('CMD', cmdBonuses);

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
	cache: CharacterCache
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
	const hasPerfectRecall = char.processedClassFeatures?.some(f => 
		f.name === 'perfect_recall' 
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
		const abilities = await gameRules.getAllAbility();
		const baseAbility = abilities.find(a => a.id === skill.ability_id);
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

		const skillBonuses: BonusEntry[] = [
			{ source: `${abilityModSource} modifier`, value: abilityScoreMod, type: 'ability' },
			{ source: 'Ranks', value: ranks, type: 'ranks' },
			...getAncestryTraitBonuses(cache, skill.name?.toLowerCase())
		];
		
		// Add second INT bonus for Knowledge skills with Perfect Recall
		if (hasPerfectRecall && skill.knowledge_skill) {
			skillBonuses.push({ 
				source: 'Perfect Recall (Int)', 
				value: intMod, 
				type: 'ability_again' 
			});
		}
		
		if (cache.classSkillIds.has(skill.id) && ranks > 0) {
			skillBonuses.push({ 
				source: 'Class skill', 
				value: 3, 
				type: 'class_skill' 
			});
		}

		if (hasGenerallyEducated && skill.knowledge_skill) {
			skillBonuses.push({ 
				source: 'Generally Educated', 
				value: 2, 
				type: 'feat' 
			});
		}

		// Add Vampiric Grace Stealth bonus
		if (hasVampiricGrace && skill.name?.toLowerCase() === 'stealth') {
			skillBonuses.push({
				source: 'Vampiric Grace',
				value: 2,
				type: 'racial'
			});
		}

		// Add Allure social skill bonuses
		if (hasAllure) {
			const skillName = skill.name?.toLowerCase();
			if (skillName === 'bluff' || skillName === 'diplomacy' || skillName === 'intimidate') {
				skillBonuses.push({
					source: 'Allure',
					value: allureBonus,
					type: 'racial'
				});
			}
		}

		// Add Children of the Night penalty
		if (hasChildrenOfNight) {
			const skillName = skill.name?.toLowerCase();
			if (skillName === 'handle_animal' || skillName === 'ride') {
				skillBonuses.push({
					source: 'Children of the Night (vs normal animals)',
					value: -3,
					type: 'penalty'
				});
			}
		}

		const skillStat = buildGenericStat(skill.label ?? 'Unknown', skillBonuses);
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
		bombDice: number;
	};
	cmb: ValueWithBreakdown;
	cmd: ValueWithBreakdown;
}

interface AttackBonuses {
    baseAttackBonus: number;
    weaponAttunement: number;
    enhancement: number;
    iterativeAttacks: number[];
}

async function calculateAttackBonuses(
    char: CompleteCharacter,
    gameRules: GameRulesAPI
): Promise<AttackBonuses> {
    const babProgression = await calculateBAB(char);
    const weaponAttune = await getAbpBonusFromNodes(char, gameRules, 'weapon_attunement');
    const weaponEnhancement = await getAbpBonusFromNodes(char, gameRules, 'weapon_enhancement');

    return {
        baseAttackBonus: babProgression[0],
        weaponAttunement: weaponAttune,
        enhancement: weaponEnhancement,
        iterativeAttacks: babProgression
    };
}

async function computeAttacks(
	char: CompleteCharacter,
	gameRules: GameRulesAPI,
	strMod: number,
	dexMod: number,
	intMod: number,
	wisMod: number,
	cache: CharacterCache
): Promise<AttackParts> {
	const attackBonuses = await calculateAttackBonuses(char, gameRules);
	const sizeData = await calculateSize(char);
	const { allBonuses } = await computeACStats(char, gameRules, dexMod, wisMod, cache);

	function buildAttack(label: string, abilityModifier: number, abilityName: string): ValueWithBreakdown {
		const bonuses: BonusEntry[] = [
			{ source: 'Base Attack', value: attackBonuses.baseAttackBonus, type: 'base' },
			{ source: `${abilityName} modifier`, value: abilityModifier, type: 'ability' },
			{ source: 'Weapon Attunement', value: attackBonuses.weaponAttunement, type: 'attunement' },
			...getAncestryTraitBonuses(cache, 'attack_rolls')
		];

		// Add iterative attacks to the label if they exist
		if (attackBonuses.iterativeAttacks.length > 1) {
			const totalBonus = abilityModifier + attackBonuses.weaponAttunement + attackBonuses.enhancement;
			const iteratives = attackBonuses.iterativeAttacks
				.slice(1)
				.map(bab => bab + totalBonus)
				.join('/');
			label = `${label} (${bonuses[0].value + totalBonus}/${iteratives})`;
		}

		return buildGenericStat(label, bonuses);
	}

	const melee = buildAttack('Melee Attack', strMod, 'Strength');
	const ranged = buildAttack('Ranged Attack', dexMod, 'Dexterity');
	const bombAttack = buildAttack('Bomb Attack', dexMod, 'Dexterity');
	const bombDamage = buildGenericStat('Bomb Damage', [
		{ source: 'Intelligence modifier', value: intMod, type: 'ability' },
		...getAncestryTraitBonuses(cache, 'bomb_damage')
	]);

	const { cmb, cmd } = computeCombatManeuvers(
		attackBonuses,
		strMod,
		dexMod,
		allBonuses,
		cache,
		sizeData.effectiveSize
	);

	return {
		melee,
		ranged,
		bomb: {
			attack: bombAttack,
			damage: bombDamage,
			bombDice: Math.floor((calculateTotalLevel(char) + 1) / 2)
		},
		cmb,
		cmd
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
	char: CompleteCharacter,
	intMod: number
): Record<number, ValueWithBreakdown> {
	const skillPointsTotal: Record<number, ValueWithBreakdown> = {};
	
	// Get base skill points from class
	for (const charClass of (char.game_character_class ?? [])) {
		const classSkillPoints = charClass.class.skill_ranks_per_level ?? 0;
		const maxLevel = charClass.level ?? 1;
		
		// Calculate for each level up to current
		for (let level = 1; level <= maxLevel; level++) {
			const baseAndInt = Math.max(1, classSkillPoints + intMod);
			const bonuses = [
				{ 
					source: `${charClass.class.label ?? 'Unknown'} Base ${classSkillPoints} + Int Mod ${intMod}`,
					value: baseAndInt,
					type: 'base'
				},
				{ 
					source: 'Intelligence modifier',
					value: intMod,
					type: 'ability'
				},
				{ 
					source: 'Class base',
					value: classSkillPoints,
					type: 'class'
				}
			];

			// Add favored class bonus if this class was chosen for the level
			const hasFavoredClassSkillBonus = char.game_character_favored_class_bonus?.some(fcb => 
				fcb.class_id === charClass.class_id && 
				fcb.level === level && 
				fcb.favored_class_choice?.name === 'skill'
			);

			if (hasFavoredClassSkillBonus) {
				bonuses.push({ 
					source: 'Favored Class Bonus', 
					value: 1, 
					type: 'favored_class' 
				});
			}

			skillPointsTotal[level] = buildGenericStat(`Level ${level} Skill Points`, bonuses);
		}
	}
	
	return skillPointsTotal;
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
	
	// Get all skills once
	const allSkills = await gameRules.getAllSkill();
	const skillMap = new Map(allSkills.map(s => [s.id, s]));
	
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
		const skill = skillMap.get(skillId);
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



async function processClassFeatures(
	char: CompleteCharacter,
	gameRules: GameRulesAPI
): Promise<ProcessedClassFeature[]> {
	return await gameRules.getProcessedClassFeatures(
		char.id, 
		calculateTotalLevel(char)
	);
}

//
// =====================  MAIN ENRICHING FUNCTION  =====================
//

export async function enrichCharacterData(
	char: CompleteCharacter,
	gameRules: GameRulesAPI
): Promise<EnrichedCharacter> {
	
	// Load all cache data once at the start
	const cache = await loadCharacterCache(char, gameRules);

	// Use cache in all subsequent calls
	const strength = await buildAbilityScore('strength', char, cache);
	const dexterity = await buildAbilityScore('dexterity', char, cache);
	const constitution = await buildAbilityScore('constitution', char, cache);
	const intelligence = await buildAbilityScore('intelligence', char, cache);
	const wisdom = await buildAbilityScore('wisdom', char, cache);
	const charisma = await buildAbilityScore('charisma', char, cache);

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
	const fortitude = buildSave(cache, 'Fortitude', baseFort, conMod, resistance, 'Constitution');
	const reflex = buildSave(cache, 'Reflex', baseRef, dexMod, resistance, 'Dexterity');
	const will = buildSave(cache, 'Will', baseWill, wisMod, resistance, 'Wisdom');

	// 4) Compute AC stats with corrected dexMod
	const { ac, touch_ac, flat_footed_ac } = await computeACStats(char, gameRules, dexMod, wisMod, cache);

	// 5) Initiative (single stat)
	const initiative = buildGenericStat('Initiative', [
		{ source: 'Dexterity modifier', value: dexMod, type: 'ability' },
		...getAncestryTraitBonuses(cache, 'initiative')
	]);

	// 6) Compute BAB & Maneuvers with corrected ability mods

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
		cache
	);
	const skillsWithRanks = await getSkillsWithRanks(char, gameRules, cache.classSkillIds);

	// 8) Attacks with corrected ability mods
	const attacks = await computeAttacks(char, gameRules, strMod, dexMod, intMod, wisMod, cache);

	// Process class features with gameRules
	const processedClassFeatures = char.processedClassFeatures ?? [];

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
		cmb: attacks.cmb,
		cmd: attacks.cmd,

		// Skills
		skills,

		// Attacks
		attacks,

		// Skill points
		skillPoints: {
			total: calculateSkillPointsTotal(char, intMod),
			remaining: calculateSkillPointsRemaining(char, calculateSkillPointsTotal(char, intMod))
		},
		totalLevel: calculateTotalLevel(char),
		skillsWithRanks,

		// Add processed class features
		processedClassFeatures
	};

	return enriched;
}

// Update loadCharacterCache to use processClassFeatures
async function loadCharacterCache(
	char: CompleteCharacter,
	gameRules: GameRulesAPI
): Promise<CharacterCache> {
	// Get all ABP data in a single call
	const abpCache = await gameRules.getAbpCacheData(calculateTotalLevel(char) + 2);
	const classSkillIds = await getClassSkillIds(char, gameRules);

	// Get processed class features
	const processedFeatures = await processClassFeatures(char, gameRules);
	char.processedClassFeatures = processedFeatures;

	// Pre-process all ancestry trait bonuses
	const bonusesByTarget: Record<string, BonusEntry[]> = {};
	
	const standardTraits = char.game_character_ancestry?.[0]?.ancestry?.ancestry_trait ?? [];
	const alternateTraits = char.game_character_ancestry_trait ?? [];
	
	const allTraits = [
		...standardTraits,
		...alternateTraits.map((at) => at.ancestry_trait)
	].filter((trait): trait is (Row<'ancestry_trait'> & {
		ancestry_trait_benefit: Array<Row<'ancestry_trait_benefit'> & {
			ancestry_trait_benefit_bonus: Array<Row<'ancestry_trait_benefit_bonus'> & {
				bonus_type: Row<'bonus_type'>;
				target_specifier: Row<'target_specifier'>;
			}>;
		}>;
	}) => 
		!!trait && Array.isArray(trait.ancestry_trait_benefit)
	);

	for (const trait of allTraits) {
		const benefits = trait.ancestry_trait_benefit;
		
		for (const benefit of benefits) {
			const traitBonuses = benefit.ancestry_trait_benefit_bonus || [];
			
			for (const bonus of traitBonuses) {
				const targetName = bonus.target_specifier?.name?.toLowerCase() ?? '';

				if (!bonusesByTarget[targetName]) {
					bonusesByTarget[targetName] = [];
				}

				bonusesByTarget[targetName].push({
					source: `${benefit.label}`,
					value: bonus.value,
					type: bonus.bonus_type?.name ?? 'untyped'
				});
			}
		}
	}

	return {
		abp: abpCache,
		classSkillIds,
		ancestryTraits: {
			bonusesByTarget
		}
	};
}

// Add this near the top with other calculation functions
async function calculateBAB(char: CompleteCharacter): Promise<number[]> {
    let totalBAB = 0;

    // Calculate BAB for each class
    for (const charClass of char.game_character_class ?? []) {
        const level = charClass.level ?? 0;
        const progression = charClass.class?.base_attack_bonus_progression ?? 2; // Default to 3/4 BAB if missing

        // Apply BAB based on progression type
        switch (progression) {
            case 1: // Full BAB
                totalBAB += level;
                break;
            case 2: // 3/4 BAB
                totalBAB += Math.floor((level * 3) / 4);
                break;
            case 3: // 1/2 BAB
                totalBAB += Math.floor(level / 2);
                break;
        }
    }

    // Calculate iterative attacks
    const attacks: number[] = [totalBAB];
    let iterative = totalBAB;
    while (iterative > 5) {
        iterative -= 5;
        attacks.push(iterative);
    }

    return attacks;
}

// Remove ProcessedFeature interface and use ProcessedClassFeature instead
export type ProcessedFeature = ProcessedClassFeature;

/** Extract bonuses from class features targeting a specific stat */
function getClassFeatureBonuses(
    char: CompleteCharacter,
    targetName: string
): BonusEntry[] {
    // Track highest bonus per source
    const bonusesBySource: Record<string, BonusEntry> = {};
    
    // Safely access processedClassFeatures with optional chaining
    const features = char.processedClassFeatures ?? [];
    
    for (const feature of features) {
        for (const benefit of (feature.class_feature_benefit ?? [])) {
            for (const bonus of (benefit.class_feature_benefit_bonus ?? [])) {
                if (bonus.target_specifier.name.toLowerCase() === targetName.toLowerCase()) {
                    const source = feature.label;
                    const newBonus = {
                        source: source,
                        value: bonus.value,
                        type: bonus.bonus_type.name ?? 'untyped'
                    };
                    
                    // Only keep highest value bonus for each source
                    if (!bonusesBySource[source] || bonusesBySource[source].value < newBonus.value) {
                        bonusesBySource[source] = newBonus;
                    }
                }
            }
        }
    }
	console.log(bonusesBySource);

    return Object.values(bonusesBySource);
}

// Add module augmentation to declare processedClassFeatures on CompleteCharacter
declare module '../db/gameRules.api' {
    interface CompleteCharacter {
        processedClassFeatures?: ProcessedClassFeature[];
    }
}




