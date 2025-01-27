/******************************************************************************
 * FILE: src/lib/db/getCompleteCharacter.ts
 *
 * Fetch and assemble a "CompleteCharacter" object with:
 *   - The main Character row
 *   - Sub-entities (ancestry, classes, feats, etc.)
 *   - Bridging properties (level, selected sub-features, etc.)
 *   - References (bonusTypes, etc.) if desired
 *****************************************************************************/

import {

	// Character-Specific

	gameCharacterApi,

	gameCharacterAbilityApi,
	gameCharacterAbpChoiceApi,
	gameCharacterAncestryApi,
	gameCharacterArchetypeApi,
	gameCharacterArmorApi,
	gameCharacterClassApi,
	gameCharacterClassFeatureApi,
	gameCharacterConsumableApi,
	gameCharacterCorruptionApi,
	gameCharacterCorruptionManifestationApi,
	gameCharacterEquipmentApi,
	gameCharacterFavoredClassBonusApi,
	gameCharacterFeatApi,
	gameCharacterSkillRankApi,
	gameCharacterTraitApi,
	gameCharacterWildTalentApi,

	gameCharacterSpellApi,
	gameCharacterDiscoveryApi,
	gameCharacterWeaponApi,

} from '$lib/db';

import type {

	// Core Rules
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

	// Character-Specific
	GameCharacterAbilityRow,
	GameCharacterAbpChoiceRow,
	GameCharacterAncestryRow,
	GameCharacterArchetypeRow,
	GameCharacterArmorRow,
	GameCharacterClassRow,
	GameCharacterClassFeatureRow,
	GameCharacterConsumableRow,
	GameCharacterCorruptionRow,
	GameCharacterCorruptionManifestationRow,
	GameCharacterEquipmentRow,
	GameCharacterFavoredClassBonusRow,
	GameCharacterFeatRow,
	GameCharacterSkillRankRow,
	GameCharacterTraitRow,
	GameCharacterWildTalentRow,
	GameCharacterSpellRow,
	GameCharacterDiscoveryRow,
	GameCharacterWeaponRow,

	GameCharacterRow,
	
} from '$lib/db';
import { getGameRulesData } from './getGameRulesData';

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

function buildCharacterCollection<
	BaseRow extends { id: number },
	CharacterRow extends { game_character_id: number }
>(
	characterRows: CharacterRow[],
	baseRows: BaseRow[],
	getBaseId: (charRow: CharacterRow) => number,
): Array<{
	base: BaseRow;
} & CharacterRow> {
	return characterRows.map(charRow => ({
		base: baseRows.find(baseRow => baseRow.id === getBaseId(charRow))!,
		...charRow
	}));
}


// -----------------------------------------------------------------------------
// 2) Data Shape
// -----------------------------------------------------------------------------
export interface CompleteCharacter extends Omit<GameCharacterRow, 'created_at' | 'updated_at'> {
    ancestries: Array<{
        base: AncestryRow;
    } & GameCharacterAncestryRow>;

    abilities: Array<{
        base: AbilityRow;
    } & GameCharacterAbilityRow>;

    abpChoices: Array<{
        base: AbpNodeRow;
    } & GameCharacterAbpChoiceRow>;

    archetypes: Array<{
        base: ArchetypeRow;
    } & GameCharacterArchetypeRow>;

    armor: Array<{
        base: ArmorRow;
    } & GameCharacterArmorRow>;

    classes: Array<{
        base: ClassRow;
    } & GameCharacterClassRow>;

    classFeatures: Array<{
        base: ClassFeatureRow;
    } & GameCharacterClassFeatureRow>;

    consumables: Array<{
        base: ConsumableRow;
    } & GameCharacterConsumableRow>;

    corruption: Array<{
        base: CorruptionRow;
    } & GameCharacterCorruptionRow>;

    corruptionManifestations: Array<{
        base: CorruptionManifestationRow;
    } & GameCharacterCorruptionManifestationRow>;

    discoveries: Array<{
        base: DiscoveryRow;
    } & GameCharacterDiscoveryRow>;

    equipment: Array<{
        base: EquipmentRow;
    } & GameCharacterEquipmentRow>;

    favoredClassBonuses: Array<{
        base: FavoredClassChoiceRow;
    } & GameCharacterFavoredClassBonusRow>;

    feats: Array<{
        base: FeatRow;
    } & GameCharacterFeatRow>;

    skillRanks: Array<{
        base: SkillRow;
    } & GameCharacterSkillRankRow>;

    spells: Array<{
        base: SpellRow;
    } & GameCharacterSpellRow>;

    traits: Array<{
        base: TraitRow;
    } & GameCharacterTraitRow>;

    weapons: Array<{
        base: WeaponRow;
    } & GameCharacterWeaponRow>;

    wildTalents: Array<{
        base: WildTalentRow;
    } & GameCharacterWildTalentRow>;
}


// -----------------------------------------------------------------------------
// 3) getCompleteCharacter
// -----------------------------------------------------------------------------
export async function getCompleteCharacter(characterId: number): Promise<CompleteCharacter | null> {
	// 1) Get base character and game rules data in parallel
	const [charRow, gameRules] = await Promise.all([
		gameCharacterApi.getRowById(characterId),
		getGameRulesData()
	]);
	
	if (!charRow) return null;

	// 2) Fetch all character-specific data in parallel
	const [
		gameCharacterAbilities,
		gameCharacterAbpChoices,
		gameCharacterAncestries,
		gameCharacterArchetypes,
		gameCharacterArmors,
		gameCharacterClasses,
		gameCharacterClassFeatures,
		gameCharacterConsumables,
		gameCharacterCorruptions,
		gameCharacterCorruptionManifestations,
		gameCharacterEquipment,
		gameCharacterFavoredClassBonuses,
		gameCharacterFeats,
		gameCharacterSkillRanks,
		gameCharacterTraits,
		gameCharacterWildTalents,
		gameCharacterSpells,
		gameCharacterDiscoveries,
		gameCharacterWeapons,
	] = await Promise.all([
		gameCharacterAbilityApi.getRowsByFilter({ game_character_id: charRow.id }),
		gameCharacterAbpChoiceApi.getRowsByFilter({ game_character_id: charRow.id }),
		gameCharacterAncestryApi.getRowsByFilter({ game_character_id: charRow.id }),
		gameCharacterArchetypeApi.getRowsByFilter({ game_character_id: charRow.id }),
		gameCharacterArmorApi.getRowsByFilter({ game_character_id: charRow.id }),
		gameCharacterClassApi.getRowsByFilter({ game_character_id: charRow.id }),
		gameCharacterClassFeatureApi.getRowsByFilter({ game_character_id: charRow.id }),
		gameCharacterConsumableApi.getRowsByFilter({ game_character_id: charRow.id }),
		gameCharacterCorruptionApi.getRowsByFilter({ game_character_id: charRow.id }),
		gameCharacterCorruptionManifestationApi.getRowsByFilter({ game_character_id: charRow.id }),
		gameCharacterEquipmentApi.getRowsByFilter({ game_character_id: charRow.id }),
		gameCharacterFavoredClassBonusApi.getRowsByFilter({ game_character_id: charRow.id }),
		gameCharacterFeatApi.getRowsByFilter({ game_character_id: charRow.id }),
		gameCharacterSkillRankApi.getRowsByFilter({ game_character_id: charRow.id }),
		gameCharacterTraitApi.getRowsByFilter({ game_character_id: charRow.id }),
		gameCharacterWildTalentApi.getRowsByFilter({ game_character_id: charRow.id }),
		gameCharacterSpellApi.getRowsByFilter({ game_character_id: charRow.id }),
		gameCharacterDiscoveryApi.getRowsByFilter({ game_character_id: charRow.id }),
		gameCharacterWeaponApi.getRowsByFilter({ game_character_id: charRow.id }),
	]);

	// 4) Build the complete character object
	const finalCharacter: CompleteCharacter = {
		// Base character properties
		...charRow,

		// Handle ancestry separately since it's nullable and singular
		ancestries: buildCharacterCollection(
			gameCharacterAncestries,
			gameRules.rules.ancestryRows,
			row => row.ancestry_id
		),

		abilities: buildCharacterCollection(
			gameCharacterAbilities,
			gameRules.rules.abilityRows,
			row => row.ability_id
		),

		abpChoices: buildCharacterCollection(
			gameCharacterAbpChoices,
			gameRules.references.abpNodes,
			row => row.node_id
		),

		archetypes: buildCharacterCollection(
			gameCharacterArchetypes,
			gameRules.rules.archetypeRows,
			row => row.archetype_id
		),

		armor: buildCharacterCollection(
			gameCharacterArmors,
			gameRules.rules.armorRows,
			row => row.armor_id
		),

		classes: buildCharacterCollection(
			gameCharacterClasses,
			gameRules.rules.classRows,
			row => row.class_id
		),

		classFeatures: buildCharacterCollection(
			gameCharacterClassFeatures,
			gameRules.rules.classFeatureRows,
			row => row.class_feature_id
		),

		consumables: buildCharacterCollection(
			gameCharacterConsumables,
			gameRules.rules.consumableRows,
			row => row.consumable_id
		),

		corruption: buildCharacterCollection(
			gameCharacterCorruptions,
			gameRules.rules.corruptionRows,
			row => row.corruption_id
		),

		corruptionManifestations: buildCharacterCollection(
			gameCharacterCorruptionManifestations,
			gameRules.rules.corruptionManifestationRows,
			row => row.manifestation_id
		),

		discoveries: buildCharacterCollection(
			gameCharacterDiscoveries,
			gameRules.rules.discoveryRows,
			row => row.discovery_id
		),

		equipment: buildCharacterCollection(
			gameCharacterEquipment,
			gameRules.rules.equipmentRows,
			row => row.equipment_id
		),

		favoredClassBonuses: buildCharacterCollection(
			gameCharacterFavoredClassBonuses,
			gameRules.references.favoredClassChoices,
			row => row.choice_id
		),

		feats: buildCharacterCollection(
			gameCharacterFeats,
			gameRules.rules.featRows,
			row => row.feat_id
		),

		skillRanks: buildCharacterCollection(
			gameCharacterSkillRanks,
			gameRules.rules.skillRows,
			row => row.skill_id
		),

		spells: buildCharacterCollection(
			gameCharacterSpells,
			gameRules.rules.spellRows,
			row => row.spell_id
		),

		traits: buildCharacterCollection(
			gameCharacterTraits,
			gameRules.rules.traitRows,
			row => row.trait_id
		),

		weapons: buildCharacterCollection(
			gameCharacterWeapons,
			gameRules.rules.weaponRows,
			row => row.weapon_id
		),

		wildTalents: buildCharacterCollection(
			gameCharacterWildTalents,
			gameRules.rules.wildTalentRows,
			row => row.wild_talent_id
		),
	};

	return cleanUpObject(finalCharacter);
}
