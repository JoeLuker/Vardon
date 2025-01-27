import {
    // Core Rules
	abilityApi,
	ancestralTraitApi,
	ancestryApi,
	ancestryAbilityApi,
	archetypeApi,
	archetypeClassFeatureApi,
	archetypeFeatureReplacementApi,
	armorApi,
	classApi,
	classFeatureApi,
	classSkillApi,
	consumableApi,
	corruptionApi,
	corruptionManifestationApi,
	discoveryApi,
	elementApi,
	equipmentApi,
	featApi,
	naturalAttackApi,
	skillApi,
	skillBonusApi,
	spellApi,
	spellConsumableApi,
	traitApi,
	weaponApi,
	weaponProficiencyApi,
	wildTalentApi,
	abpBonusTypeApi,
	abpNodeApi,
	abpNodeBonusApi,
	abpNodeGroupApi,
	bonusTypeApi,
	favoredClassChoiceApi,
	legendaryGiftTypeApi,

} from '$lib/db';

import type {
	AbilityRow,
	AncestralTraitRow,
	AncestryRow,
	AncestryAbilityRow,
	ArchetypeRow,
	ArchetypeClassFeatureRow,
	ArchetypeFeatureReplacementRow,
	ArmorRow,
	ClassRow,
	ClassFeatureRow,
	ClassSkillRow,
	ConsumableRow,
	CorruptionRow,
	CorruptionManifestationRow,
	DiscoveryRow,
	ElementRow,
	EquipmentRow,
	FeatRow,
	NaturalAttackRow,
	SkillRow,
	SkillBonusRow,
	SpellRow,
	SpellConsumableRow,
	TraitRow,
	WeaponRow,
	WeaponProficiencyRow,
	WildTalentRow,
	AbpBonusTypeRow,
	AbpNodeRow,
	AbpNodeBonusRow,
	AbpNodeGroupRow,
	BonusTypeRow,   
	FavoredClassChoiceRow,
	LegendaryGiftTypeRow,
    
} from '$lib/db';

export interface GameRulesData {
    rules: {
        ancestryRows: AncestryRow[];
        classRows: ClassRow[];
        classFeatureRows: ClassFeatureRow[];
        classSkillRows: ClassSkillRow[];
        archetypeClassFeatureRows: ArchetypeClassFeatureRow[];
        featRows: FeatRow[];
        traitRows: TraitRow[];
        corruptionRows: CorruptionRow[];
        wildTalentRows: WildTalentRow[];
        equipmentRows: EquipmentRow[];
        abilityRows: AbilityRow[];
        ancestralTraitRows: AncestralTraitRow[];
        skillRows: SkillRow[];
        discoveryRows: DiscoveryRow[];
        archetypeRows: ArchetypeRow[];
        weaponRows: WeaponRow[];
        armorRows: ArmorRow[];
        spellRows: SpellRow[];
        spellConsumableRows: SpellConsumableRow[];
        consumableRows: ConsumableRow[];
        ancestryAbilityRows: AncestryAbilityRow[];
        corruptionManifestationRows: CorruptionManifestationRow[];
        elementRows: ElementRow[];
    };
    relationships: {
        classes: {
            skills: Record<number, number[]>;
            features: Record<number, ClassFeatureRow[]>;
        };
        archetypes: {
            features: Record<number, ArchetypeClassFeatureRow[]>;
            replacements: Record<number, ArchetypeFeatureReplacementRow[]>;
        };
        skills: {
            bonuses: Record<string, SkillBonusRow[]>;
        };
        weapons: {
            proficiencies: Record<string, WeaponProficiencyRow[]>;
        };
        ancestries: {
            naturalAttacks: Record<string, NaturalAttackRow[]>;
            abilities: Record<number, AncestryAbilityRow[]>;
        };
    };
    references: {
        bonusTypes: BonusTypeRow[];
        abpBonusTypes: AbpBonusTypeRow[];
        favoredClassChoices: FavoredClassChoiceRow[];
        abpNodeGroups: AbpNodeGroupRow[];
        abpNodes: AbpNodeRow[];
        abpNodeBonuses: AbpNodeBonusRow[];
        legendaryGiftTypes: LegendaryGiftTypeRow[];
    };
}

/** Fetch all static game rules and reference data */
export async function getGameRulesData(): Promise<GameRulesData> {
    const [
        // Core rule tables
        ancestryRows,
        classRows,
        classFeatureRows,
        archetypeClassFeatureRows,
        classSkillRows,
        featRows,
        traitRows,
        corruptionRows,
        wildTalentRows,
        equipmentRows,
        abilityRows,
        ancestralTraitRows,
        skillRows,
        discoveryRows,
        archetypeRows,
        weaponRows,
        armorRows,
        spellRows,
        spellConsumableRows,
        consumableRows,
        ancestryAbilityRows,
        corruptionManifestationRows,
        elementRows,


        // Bridging/relationship tables
        classSkills,
        skillBonuses,
        weaponProficiencies,
        naturalAttacks,
        archetypeReplacements,

        // Reference/lookup tables
        bonusTypes,
        abpBonusTypes,
        favoredClassChoices,
        abpNodeGroups,
        abpNodes,
        abpNodeBonuses,
        legendaryGiftTypes,

    ] = await Promise.all([
        // Core rule tables
        ancestryApi.getAllRows(),
        classApi.getAllRows(),
        classFeatureApi.getAllRows(),
        archetypeClassFeatureApi.getAllRows(),
        classSkillApi.getAllRows(),
        featApi.getAllRows(),
        traitApi.getAllRows(),
        corruptionApi.getAllRows(),
        wildTalentApi.getAllRows(),
        equipmentApi.getAllRows(),
        abilityApi.getAllRows(),
        ancestralTraitApi.getAllRows(),
        skillApi.getAllRows(),
        discoveryApi.getAllRows(),
        archetypeApi.getAllRows(),
        weaponApi.getAllRows(),
        armorApi.getAllRows(),
        spellApi.getAllRows(),
        spellConsumableApi.getAllRows(),
        consumableApi.getAllRows(),
        ancestryAbilityApi.getAllRows(),
        corruptionManifestationApi.getAllRows(),
        elementApi.getAllRows(),

        // Bridging tables
        classSkillApi.getAllRows(),
        skillBonusApi.getAllRows(),
        weaponProficiencyApi.getAllRows(),
        naturalAttackApi.getAllRows(),
        archetypeFeatureReplacementApi.getAllRows(),

        // Reference tables
        bonusTypeApi.getAllRows(),
        abpBonusTypeApi.getAllRows(),
        favoredClassChoiceApi.getAllRows(),
        abpNodeGroupApi.getAllRows(),
        abpNodeApi.getAllRows(),
        abpNodeBonusApi.getAllRows(),
        legendaryGiftTypeApi.getAllRows(),
    ]);

    // Build relationship maps
    const classSkillMap: Record<number, number[]> = {};
    for (const cs of classSkills as ClassSkillRow[]) {
        if (!classSkillMap[cs.class_id]) {
            classSkillMap[cs.class_id] = [];
        }
        classSkillMap[cs.class_id].push(cs.skill_id);
    }

    const classFeaturesMap: Record<number, ClassFeatureRow[]> = {};
    for (const cf of classFeatureRows) {
        if (!classFeaturesMap[cf.class_id]) {
            classFeaturesMap[cf.class_id] = [];
        }
        classFeaturesMap[cf.class_id].push(cf);
    }

    const archetypeFeaturesMap: Record<number, ArchetypeClassFeatureRow[]> = {};
    const archetypeReplacementsMap: Record<number, ArchetypeFeatureReplacementRow[]> = {};
    for (const af of archetypeClassFeatureRows) {
        if (!archetypeFeaturesMap[af.archetype_id]) {
            archetypeFeaturesMap[af.archetype_id] = [];
        }
        archetypeFeaturesMap[af.archetype_id].push(af);
    }
    for (const ar of archetypeReplacements) {
        if (!archetypeReplacementsMap[ar.archetype_id]) {
            archetypeReplacementsMap[ar.archetype_id] = [];
        }
        archetypeReplacementsMap[ar.archetype_id].push(ar);
    }

    const skillBonusMap: Record<string, SkillBonusRow[]> = {};
    for (const sb of skillBonuses as SkillBonusRow[]) {
        if (!skillBonusMap[sb.skill_name]) {
            skillBonusMap[sb.skill_name] = [];
        }
        skillBonusMap[sb.skill_name].push(sb);
    }

    const weaponProficiencyMap: Record<string, WeaponProficiencyRow[]> = {};
    for (const wp of weaponProficiencies as WeaponProficiencyRow[]) {
        if (!weaponProficiencyMap[wp.weapon_name]) {
            weaponProficiencyMap[wp.weapon_name] = [];
        }
        weaponProficiencyMap[wp.weapon_name].push(wp);
    }

    const ancestryNaturalAttackMap: Record<string, NaturalAttackRow[]> = {};
    const ancestryAbilityMap: Record<number, AncestryAbilityRow[]> = {};
    for (const na of naturalAttacks as NaturalAttackRow[]) {
        const key = na.attack_type;
        if (!ancestryNaturalAttackMap[key]) {
            ancestryNaturalAttackMap[key] = [];
        }
        ancestryNaturalAttackMap[key].push(na);
    }
    for (const aa of ancestryAbilityRows as AncestryAbilityRow[]) {
        if (!ancestryAbilityMap[aa.ancestry_id]) {
            ancestryAbilityMap[aa.ancestry_id] = [];
        }
        ancestryAbilityMap[aa.ancestry_id].push(aa);
    }

    return {
        rules: {
            ancestryRows,
            classRows,
            featRows,
            traitRows,
            corruptionRows,
            wildTalentRows,
            equipmentRows,
            abilityRows,
            ancestralTraitRows,
            skillRows,
            discoveryRows,
            archetypeRows,
            weaponRows,
            armorRows,
            spellRows,
            spellConsumableRows,
            consumableRows,
            ancestryAbilityRows,
            corruptionManifestationRows,
            elementRows,
            classFeatureRows,
            archetypeClassFeatureRows,
            classSkillRows,
        },
        relationships: {
            classes: {
                skills: classSkillMap,
                features: classFeaturesMap,
            },
            archetypes: {
                features: archetypeFeaturesMap,
                replacements: archetypeReplacementsMap,
            },
            skills: {
                bonuses: skillBonusMap,
            },
            weapons: {
                proficiencies: weaponProficiencyMap,
            },
            ancestries: {
                naturalAttacks: ancestryNaturalAttackMap,
                abilities: ancestryAbilityMap,
            },
        },
        references: {
            bonusTypes,
            abpBonusTypes,
            favoredClassChoices,
            abpNodeGroups,
            abpNodes,
            abpNodeBonuses,
            legendaryGiftTypes,
        }
    };
} 