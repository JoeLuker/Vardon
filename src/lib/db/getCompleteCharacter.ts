/******************************************************************************
 * FILE: src/lib/db/getCompleteCharacter.ts
 *
 * Fetch and assemble a "CompleteCharacter" object with:
 *   - The main Character row
 *   - Sub-entities (ancestry, classes, feats, buffs, etc.)
 *   - Bridging properties (level, selected sub-features, etc.)
 *   - References (bonusTypes, buffTypes, etc.) if desired
 *****************************************************************************/

import {
	// DB APIs
	gameCharacterApi,
	gameCharacterAncestryApi,
	gameCharacterClassApi,
	gameCharacterFeatApi,
	gameCharacterSkillRankApi,
	ancestryApi,
	classApi,
	featApi,
	traitApi,
	buffApi,
	corruptionApi,
	wildTalentApi,
	equipmentApi,
	abilityApi,
	ancestralTraitApi,
	skillApi,
	classFeatureApi,
	discoveryApi,
	archetypeApi,
	bonusTypeApi,
	skillRankSourceApi,
	buffTypeApi,
	abpBonusTypeApi,
	favoredClassChoiceApi,
	archetypeFeatureReplacementApi,
	skillBonusApi,
	weaponProficiencyApi,
	naturalAttackApi,
	gameCharacterWildTalentApi,
	gameCharacterEquipmentApi,
	gameCharacterAbilityApi,
	gameCharacterClassFeatureApi,
	gameCharacterCorruptionApi,
	classSkillApi,
	// gameCharacterTraitApi,
	// gameCharacterBuffApi,
	// gameCharacterAncestralTraitApi,
	// gameCharacterDiscoveryApi,
	gameCharacterArchetypeApi,
	gameCharacterAbpChoiceApi,
	abpNodeGroupApi,
	abpNodeApi,
	abpNodeBonusApi,
	gameCharacterArmorApi,
	armorApi
} from '$lib/db';

import type {
	GameCharacterRow,
	AncestryRow,
	ClassRow,
	ArchetypeRow,
	FeatRow,
	TraitRow,
	BuffRow,
	CorruptionRow,
	DiscoveryRow,
	WildTalentRow,
	EquipmentRow,
	AbilityRow,
	AncestralTraitRow,
	ClassFeatureRow,
	SkillRow,
	SkillBonusRow,
	WeaponProficiencyRow,
	NaturalAttackRow,
	ArchetypeFeatureReplacementRow,
	BonusTypeRow,
	SkillRankSourceRow,	
	BuffTypeRow,
	AbpBonusTypeRow,
	FavoredClassChoiceRow,
	GameCharacterSkillRankRow,
	GameCharacterAbpChoiceRow,
	AbpNodeGroupRow,
	AbpNodeRow,
	AbpNodeBonusRow,
	ArmorRow,
	GameCharacterArmorRow
} from '$lib/db';

// -----------------------------------------------------------------------------
// 1) Cleanup Helpers
// -----------------------------------------------------------------------------
/** Omit specific keys (e.g. timestamps) from deeply nested objects. */
function omitKeysDeep<T>(obj: T, keysToOmit: string[]): T {
	if (Array.isArray(obj)) {
		return obj.map((item) => omitKeysDeep(item, keysToOmit)) as unknown as T;
	}
	if (obj && typeof obj === 'object') {
		const newObj: Record<string, any> = {};
		for (const [key, value] of Object.entries(obj)) {
			if (!keysToOmit.includes(key)) {
				newObj[key] = omitKeysDeep(value, keysToOmit);
			}
		}
		return newObj as T;
	}
	return obj;
}

/** Remove timestamps. Uncomment extra lines if you want to remove empty arrays too. */
function cleanUpObject<T extends Record<string, any>>(obj: T): T {
	// removeEmptyArrays(obj);
	return omitKeysDeep(obj, ['created_at', 'updated_at']);
}

// -----------------------------------------------------------------------------
// 2) Data Shape
// -----------------------------------------------------------------------------
export interface CompleteCharacter extends Omit<GameCharacterRow, 'created_at' | 'updated_at'> {
	ancestry: {
		base: AncestryRow;
		[key: string]: any;
	} | null;

	classes: Array<{
		base: ClassRow;
		class_skills: number[];
		[key: string]: any;
	}>;

	feats: Array<{ base: FeatRow; [key: string]: any }>;
	// traits: Array<{ base: TraitRow; [key: string]: any }>;
	// buffs: Array<{ base: BuffRow; [key: string]: any }>;
	corruption: Array<{ base: CorruptionRow; [key: string]: any }>;
	wildTalents: Array<{ base: WildTalentRow; [key: string]: any }>;
	equipment: Array<{ base: EquipmentRow; [key: string]: any }>;
	// ancestralTraits: Array<{ base: AncestralTraitRow; [key: string]: any }>;
	abilities: Array<{ base: AbilityRow; [key: string]: any }>;
	classFeatures: Array<{ base: ClassFeatureRow; [key: string]: any }>;
	// discoveries: Array<{ base: DiscoveryRow; [key: string]: any }>;
	// archetypes: Array<{ base: ArchetypeRow; [key: string]: any }>;

	skillBonuses: Array<SkillBonusRow>;
	weaponProficiencies: Array<WeaponProficiencyRow>;
	naturalAttacks: Array<NaturalAttackRow>;
	archetypeReplacements: Array<ArchetypeFeatureReplacementRow>;

	baseSkills: Array<
		SkillRow & {
			name: string;
			label: string;
		}
	>;
	skillsWithRanks: Array<{
		skillId: number;	
		name: string;
		label: string;
		ability_label: string;
		totalRanks: number;
		rankSources: Array<
			{
				sourceName: string;
				sourceLabel: string;
			} & GameCharacterSkillRankRow
		>;
	}>;

	references: {
		bonusTypes: Record<BonusTypeRow['id'], BonusTypeRow['name']>;
		skillRankSources: Record<SkillRankSourceRow['id'], SkillRankSourceRow['name']>;
		buffTypes: Record<BuffTypeRow['id'], BuffTypeRow['name']>;
		abpBonusTypes: {
			byId: Record<AbpBonusTypeRow['id'], AbpBonusTypeRow['name']>;
			byName: Record<string, number>;
		};
		favoredClassChoices: Record<
			`${FavoredClassChoiceRow['id']}-${FavoredClassChoiceRow['id']}`,
			NonNullable<FavoredClassChoiceRow['name']>
		>;
		abpNodes: Array<AbpNodeRow>;
		abpNodeGroups: Array<AbpNodeGroupRow>;
		abpNodeBonuses: Array<AbpNodeBonusRow>;
	};

	abpChoices: Array<{
		group: AbpNodeGroupRow;
		node: AbpNodeRow & {
			bonuses: AbpNodeBonusRow[];
		};
	}>;

	armor: Array<{
		base: ArmorRow;
		equipped: boolean;
		enhancement?: number;
	}>;
}

// -----------------------------------------------------------------------------
// 3) getCompleteCharacter
// -----------------------------------------------------------------------------
export async function getCompleteCharacter(characterId: number): Promise<CompleteCharacter | null> {
	// 1) Main character
	const charRow = await gameCharacterApi.getRowById(characterId);
	if (!charRow) return null;

	// 2) Fetch bridging data & references in parallel
	const [
		charAncestries,
		charClasses,
		charFeats,
		charSkillRanks,
		ancestryRows,
		classRows,
		featRows,
		traitRows,
		buffRows,
		corruptionRows,
		wildTalentRows,
		equipmentRows,
		abilityRows,
		ancestralTraitRows,
		skillRows,
		discoveryRows,
		archetypeRows,
		bonusTypes,
		skillRankSources,
		buffTypes,
		abpBonusTypes,
		favoredClassChoices,
		archetypeReplacements,
		// Additional bridging data:
		skillBonuses,
		weaponProficiencies,
		naturalAttacks,
		gameCharAbpChoices,
		gameCharWildTalents,
		gameCharEquipment,
		gameCharAbilities,
		gameCharClassFeatures,
		gameCharCorruptions,
		classSkills,
		gameCharacterTraits,
		abpNodeGroups,
		abpNodes,
		abpNodeBonuses,
		gameCharacterArmor,
		armorRows
		// gameCharacterBuffs,
		// gameCharacterAncestralTraits,
		// gameCharacterDiscoveries,
		// gameCharacterArchetypes
	] = await Promise.all([
		gameCharacterAncestryApi.getAllRows(),
		gameCharacterClassApi.getAllRows(),
		gameCharacterFeatApi.getAllRows(),
		gameCharacterSkillRankApi.getAllRows(),
		ancestryApi.getAllRows(),
		classApi.getAllRows(),
		featApi.getAllRows(),
		traitApi.getAllRows(),
		buffApi.getAllRows(),
		corruptionApi.getAllRows(),
		wildTalentApi.getAllRows(),
		equipmentApi.getAllRows(),
		abilityApi.getAllRows(),
		ancestralTraitApi.getAllRows(),
		skillApi.getAllRows(),
		discoveryApi.getAllRows(),
		archetypeApi.getAllRows(),
		bonusTypeApi.getAllRows(),
		skillRankSourceApi.getAllRows(),
		buffTypeApi.getAllRows(),
		abpBonusTypeApi.getAllRows(),
		favoredClassChoiceApi.getAllRows(),
		archetypeFeatureReplacementApi.getAllRows(),
		// Additional bridging data
		skillBonusApi.getAllRows(),
		weaponProficiencyApi.getAllRows(),
		naturalAttackApi.getAllRows(),
		gameCharacterAbpChoiceApi.getAllRows(),
		gameCharacterWildTalentApi.getAllRows(),
		gameCharacterEquipmentApi.getAllRows(),
		gameCharacterAbilityApi.getAllRows(),
		gameCharacterClassFeatureApi.getAllRows(),
		gameCharacterCorruptionApi.getAllRows(),
		classSkillApi.getAllRows(),
		// gameCharacterTraitApi.getAllRows(),
		// gameCharacterBuffApi.getAllRows(),
		// gameCharacterAncestralTraitApi.getAllRows(),
		// gameCharacterDiscoveryApi.getAllRows(),
		gameCharacterArchetypeApi.getAllRows(),
		abpNodeGroupApi.getAllRows(),
		abpNodeApi.getAllRows(),
		abpNodeBonusApi.getAllRows(),
		gameCharacterArmorApi.getAllRows(),
		armorApi.getAllRows()
	]);

	// 3) Filter bridging data for this character
	const charAncestriesForThisChar = charAncestries.filter(
		(a) => a.game_character_id === charRow.id
	);
	const charClassesForThisChar = charClasses.filter((c) => c.game_character_id === charRow.id);
	const charFeatsForThisChar = charFeats.filter((f) => f.game_character_id === charRow.id);
	const skillRanksForThisChar = charSkillRanks.filter((sr) => sr.game_character_id === charRow.id);

	// 4) Create lookup maps
	const ancestryMap = new Map(ancestryRows.map((r) => [r.id, r]));
	const classMap = new Map(classRows.map((r) => [r.id, r]));
	const featMap = new Map(featRows.map((r) => [r.id, r]));
	const traitMap = new Map(traitRows.map((r) => [r.id, r]));
	const buffMap = new Map(buffRows.map((r) => [r.id, r]));
	const corruptionMap = new Map(corruptionRows.map((r) => [r.id, r]));
	const wildTalentMap = new Map(wildTalentRows.map((r) => [r.id, r]));
	const equipmentMap = new Map(equipmentRows.map((r) => [r.id, r]));
	const abilityMap = new Map(abilityRows.map((r) => [r.id, r]));
	const ancestralTraitMap = new Map(ancestralTraitRows.map((r) => [r.id, r]));
	const skillMap = new Map(skillRows.map((r) => [r.id, r]));
	const discoveryMap = new Map(discoveryRows.map((r) => [r.id, r]));
	const archetypeMap = new Map(archetypeRows.map((r) => [r.id, r]));

	const bonusTypeMap = new Map(bonusTypes.map((bt) => [bt.id, bt.name]));
	const skillSourceMap = new Map(skillRankSources.map((s) => [s.id, s.name]));
	const buffTypeMap = new Map(buffTypes.map((bt) => [bt.id, bt.name]));
	const abpMap = new Map(abpBonusTypes.map((bt) => [bt.id, bt.name]));
	const favoredMap = new Map(favoredClassChoices.map((fcc) => [fcc.id, fcc.name ?? '']));

	// 5) Build "class -> class_skills" map
	const classSkillsMap = new Map<number, number[]>();
	for (const cs of classSkills) {
		if (!classSkillsMap.has(cs.class_id)) {
			classSkillsMap.set(cs.class_id, []);
		}
		classSkillsMap.get(cs.class_id)!.push(cs.skill_id);
	}

	// 6) Build ancestry
	const ancestry =
		charAncestriesForThisChar.length > 0
			? {
					base: ancestryMap.get(charAncestriesForThisChar[0].ancestry_id)!
					// bridging props if needed
				}
			: null;

	// 7) Build classes
	const classes = charClassesForThisChar.map((cc) => ({
		base: classMap.get(cc.class_id)!,
		class_skills: classSkillsMap.get(cc.class_id) || [],
		level: cc.level
	}));

	// 8) Build feats
	const feats = charFeatsForThisChar.map((cf) => ({
		base: featMap.get(cf.feat_id)!,
		level_obtained: cf.level_obtained
	}));

	// 9) Build skill data
	const skillsWithRanks = skillRows.map((skillDef) => {
		const relevantRanks = skillRanksForThisChar.filter((sr) => sr.skill_id === skillDef.id);
		const ability = abilityMap.get(skillDef.ability_id);
		return {
			skillId: skillDef.id,
			name: skillDef.name,
			label: skillDef.label ?? skillDef.name,
			ability_label: ability?.label ?? ability?.name ?? 'Unknown',
			totalRanks: relevantRanks.length,
			rankSources: relevantRanks.map((sr) => ({
				...sr,
				sourceName: skillSourceMap.get(sr.source_id || 0) || '',
				sourceLabel: skillSourceMap.get(sr.source_id || 0) || ''
			}))
		};
	});

	// 10) Build references
	const abpBonusTypesByName = abpBonusTypes.reduce<Record<string, number>>((acc, row) => {
		acc[row.name] = row.id;
		return acc;
	}, {});

	const references = {
		bonusTypes: Object.fromEntries(bonusTypeMap),
		skillRankSources: Object.fromEntries(skillSourceMap),
		buffTypes: Object.fromEntries(buffTypeMap),
		abpBonusTypes: {
			byId: Object.fromEntries(abpMap),
			byName: abpBonusTypesByName
		},
		favoredClassChoices: Object.fromEntries(
			[...favoredMap.entries()].map(([id, name]) => [`${id}-${id}`, name])
		),
		abpNodes: abpNodes,
		abpNodeGroups: abpNodeGroups,
		abpNodeBonuses: abpNodeBonuses
	};

	// 11) Build arrays for everything else
	const corruption = gameCharCorruptions
		.filter((c) => c.game_character_id === charRow.id)
		.map((c) => ({
			base: corruptionMap.get(c.corruption_id)!,
			manifestation_level: c.manifestation_level
			// stain: c.stain
		}));

	const wildTalents = gameCharWildTalents
		.filter((wt) => wt.game_character_id === charRow.id)
		.map((wt) => ({
			base: wildTalentMap.get(wt.wild_talent_id)!,
			level_obtained: wt.level_obtained
		}));

	const equipment = gameCharEquipment
		.filter((eq) => eq.game_character_id === charRow.id)
		.map((eq) => ({
			base: equipmentMap.get(eq.equipment_id)!,
			equipped: eq.equipped
		}));

	const abilities = gameCharAbilities
		.filter((a) => a.game_character_id === charRow.id)
		.map((a) => ({
			base: abilityMap.get(a.ability_id)!,
			value: a.value
		}));

	// Example: classFeatures built from both bridging data + an inline getAllRows:
	//   (If you want, you can unify the "classFeatureApi.getAllRows()" outside.)
	const allClassFeatures = await classFeatureApi.getAllRows();
	const classFeatureMap = new Map(allClassFeatures.map((cf) => [cf.id, cf]));
	const classFeatures = gameCharClassFeatures
		.filter((cf) => cf.game_character_id === charRow.id)
		.map((cf) => ({
			base: classFeatureMap.get(cf.class_feature_id)!,
			level_gained: cf.level_obtained
		}));

	// 12) ABP bonuses
	const abpNodeGroupMap = new Map(abpNodeGroups.map(g => [g.id, g]));
	const abpNodeMap = new Map(abpNodes.map(n => [n.id, n]));

	const abpChoicesForThisChar = gameCharAbpChoices.filter(ch => 
		ch.game_character_id === charRow.id
	);

	const nodeBonusMap = new Map<number, AbpNodeBonusRow[]>();
	for (const bonus of abpNodeBonuses) {
		if (!nodeBonusMap.has(bonus.node_id)) {
			nodeBonusMap.set(bonus.node_id, []);
		}
		nodeBonusMap.get(bonus.node_id)!.push(bonus);
	}

	const abpChoices = abpChoicesForThisChar.map(ch => ({
		group: abpNodeGroupMap.get(ch.group_id)!,
		node: {
			...abpNodeMap.get(ch.node_id)!,
			bonuses: nodeBonusMap.get(ch.node_id) ?? []
		}
	}));

	// 13) Final assembly
	const armorMap = new Map(armorRows.map((r) => [r.id, r]));

	const armor = gameCharacterArmor
		.filter((a) => a.game_character_id === charRow.id)
		.map((a) => ({
			base: armorMap.get(a.armor_id)!,
			equipped: a.equipped,
			// enhancement: a.enhancement
		}));

	const finalCharacter: CompleteCharacter = {
		// Base character properties
		id: charRow.id,
		name: charRow.name,
		label: charRow.label,
		user_id: charRow.user_id,
		current_hp: charRow.current_hp,
		max_hp: charRow.max_hp,
		is_offline: charRow.is_offline,

		// Entity collections
		ancestry,
		classes,
		feats,
		corruption,
		wildTalents,
		equipment,
		abilities,
		classFeatures,
		
		// Additional arrays
		skillBonuses,
		weaponProficiencies,
		naturalAttacks,
		archetypeReplacements,

		// Skill data
		baseSkills: skillRows.map((s) => ({
			...s,
			name: s.name ?? '',
			label: s.label ?? ''
		})),
		skillsWithRanks,
		
		// References and ABP
		references,
		abpChoices,
		armor
	};

	// 14) Cleanup timestamps
	return cleanUpObject(finalCharacter);
}
