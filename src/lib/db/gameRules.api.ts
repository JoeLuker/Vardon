
/**
 * Game Rules API
 * Generated 2025-02-14T00:49:14.261641
 * 
 * Provides type-safe access to game rules with relationship handling, CRUD operations, and realtime updates.
 */

 import type { SupabaseClient } from '@supabase/supabase-js';
import { RealtimeChannel } from '@supabase/supabase-js';
import type { Database } from '$lib/domain/types/supabase';

// Base types for database tables
type DbTables = Database['public']['Tables'];

// Generic types for all game rules
export type GameRule<T extends keyof DbTables> = DbTables[T]['Row'];
export type GameRuleInsert<T extends keyof DbTables> = DbTables[T]['Insert'];
export type GameRuleUpdate<T extends keyof DbTables> = Omit<DbTables[T]['Update'], 'id'> & { id: number };

// Realtime event types
export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';
export type RealtimePayload<T> = {
    eventType: RealtimeEvent;
    new: T | null;
    old: T | null;
};

// Specific rule types
export type Ability = GameRule<"ability">;
export type AbilityInsert = GameRuleInsert<"ability">;
export type AbilityUpdate = GameRuleUpdate<"ability">; 
export type AbpBonusType = GameRule<"abp_bonus_type">;
export type AbpBonusTypeInsert = GameRuleInsert<"abp_bonus_type">;
export type AbpBonusTypeUpdate = GameRuleUpdate<"abp_bonus_type">; 
export type AbpNode = GameRule<"abp_node">;
export type AbpNodeInsert = GameRuleInsert<"abp_node">;
export type AbpNodeUpdate = GameRuleUpdate<"abp_node">; 
export type AbpNodeBonus = GameRule<"abp_node_bonus">;
export type AbpNodeBonusInsert = GameRuleInsert<"abp_node_bonus">;
export type AbpNodeBonusUpdate = GameRuleUpdate<"abp_node_bonus">; 
export type AbpNodeGroup = GameRule<"abp_node_group">;
export type AbpNodeGroupInsert = GameRuleInsert<"abp_node_group">;
export type AbpNodeGroupUpdate = GameRuleUpdate<"abp_node_group">; 
export type Ancestry = GameRule<"ancestry">;
export type AncestryInsert = GameRuleInsert<"ancestry">;
export type AncestryUpdate = GameRuleUpdate<"ancestry">; 
export type Archetype = GameRule<"archetype">;
export type ArchetypeInsert = GameRuleInsert<"archetype">;
export type ArchetypeUpdate = GameRuleUpdate<"archetype">; 
export type ArchetypeClassFeature = GameRule<"archetype_class_feature">;
export type ArchetypeClassFeatureInsert = GameRuleInsert<"archetype_class_feature">;
export type ArchetypeClassFeatureUpdate = GameRuleUpdate<"archetype_class_feature">; 
export type Armor = GameRule<"armor">;
export type ArmorInsert = GameRuleInsert<"armor">;
export type ArmorUpdate = GameRuleUpdate<"armor">; 
export type BonusAttackProgression = GameRule<"bonus_attack_progression">;
export type BonusAttackProgressionInsert = GameRuleInsert<"bonus_attack_progression">;
export type BonusAttackProgressionUpdate = GameRuleUpdate<"bonus_attack_progression">; 
export type BonusType = GameRule<"bonus_type">;
export type BonusTypeInsert = GameRuleInsert<"bonus_type">;
export type BonusTypeUpdate = GameRuleUpdate<"bonus_type">; 
export type Class = GameRule<"class">;
export type ClassInsert = GameRuleInsert<"class">;
export type ClassUpdate = GameRuleUpdate<"class">; 
export type ClassFeature = GameRule<"class_feature">;
export type ClassFeatureInsert = GameRuleInsert<"class_feature">;
export type ClassFeatureUpdate = GameRuleUpdate<"class_feature">; 
export type ClassFeatureBenefit = GameRule<"class_feature_benefit">;
export type ClassFeatureBenefitInsert = GameRuleInsert<"class_feature_benefit">;
export type ClassFeatureBenefitUpdate = GameRuleUpdate<"class_feature_benefit">; 
export type ClassSkill = GameRule<"class_skill">;
export type ClassSkillInsert = GameRuleInsert<"class_skill">;
export type ClassSkillUpdate = GameRuleUpdate<"class_skill">; 
export type Consumable = GameRule<"consumable">;
export type ConsumableInsert = GameRuleInsert<"consumable">;
export type ConsumableUpdate = GameRuleUpdate<"consumable">; 
export type Corruption = GameRule<"corruption">;
export type CorruptionInsert = GameRuleInsert<"corruption">;
export type CorruptionUpdate = GameRuleUpdate<"corruption">; 
export type CorruptionManifestation = GameRule<"corruption_manifestation">;
export type CorruptionManifestationInsert = GameRuleInsert<"corruption_manifestation">;
export type CorruptionManifestationUpdate = GameRuleUpdate<"corruption_manifestation">; 
export type Discovery = GameRule<"discovery">;
export type DiscoveryInsert = GameRuleInsert<"discovery">;
export type DiscoveryUpdate = GameRuleUpdate<"discovery">; 
export type Element = GameRule<"element">;
export type ElementInsert = GameRuleInsert<"element">;
export type ElementUpdate = GameRuleUpdate<"element">; 
export type Equipment = GameRule<"equipment">;
export type EquipmentInsert = GameRuleInsert<"equipment">;
export type EquipmentUpdate = GameRuleUpdate<"equipment">; 
export type FavoredClassChoice = GameRule<"favored_class_choice">;
export type FavoredClassChoiceInsert = GameRuleInsert<"favored_class_choice">;
export type FavoredClassChoiceUpdate = GameRuleUpdate<"favored_class_choice">; 
export type Feat = GameRule<"feat">;
export type FeatInsert = GameRuleInsert<"feat">;
export type FeatUpdate = GameRuleUpdate<"feat">; 
export type FeatBenefit = GameRule<"feat_benefit">;
export type FeatBenefitInsert = GameRuleInsert<"feat_benefit">;
export type FeatBenefitUpdate = GameRuleUpdate<"feat_benefit">; 
export type FulfillmentQualificationMapping = GameRule<"fulfillment_qualification_mapping">;
export type FulfillmentQualificationMappingInsert = GameRuleInsert<"fulfillment_qualification_mapping">;
export type FulfillmentQualificationMappingUpdate = GameRuleUpdate<"fulfillment_qualification_mapping">; 
export type GameCharacter = GameRule<"game_character">;
export type GameCharacterInsert = GameRuleInsert<"game_character">;
export type GameCharacterUpdate = GameRuleUpdate<"game_character">; 
export type GameCharacterAbility = GameRule<"game_character_ability">;
export type GameCharacterAbilityInsert = GameRuleInsert<"game_character_ability">;
export type GameCharacterAbilityUpdate = GameRuleUpdate<"game_character_ability">; 
export type GameCharacterAbpChoice = GameRule<"game_character_abp_choice">;
export type GameCharacterAbpChoiceInsert = GameRuleInsert<"game_character_abp_choice">;
export type GameCharacterAbpChoiceUpdate = GameRuleUpdate<"game_character_abp_choice">; 
export type GameCharacterAncestry = GameRule<"game_character_ancestry">;
export type GameCharacterAncestryInsert = GameRuleInsert<"game_character_ancestry">;
export type GameCharacterAncestryUpdate = GameRuleUpdate<"game_character_ancestry">; 
export type GameCharacterArchetype = GameRule<"game_character_archetype">;
export type GameCharacterArchetypeInsert = GameRuleInsert<"game_character_archetype">;
export type GameCharacterArchetypeUpdate = GameRuleUpdate<"game_character_archetype">; 
export type GameCharacterArmor = GameRule<"game_character_armor">;
export type GameCharacterArmorInsert = GameRuleInsert<"game_character_armor">;
export type GameCharacterArmorUpdate = GameRuleUpdate<"game_character_armor">; 
export type GameCharacterClass = GameRule<"game_character_class">;
export type GameCharacterClassInsert = GameRuleInsert<"game_character_class">;
export type GameCharacterClassUpdate = GameRuleUpdate<"game_character_class">; 
export type GameCharacterClassFeature = GameRule<"game_character_class_feature">;
export type GameCharacterClassFeatureInsert = GameRuleInsert<"game_character_class_feature">;
export type GameCharacterClassFeatureUpdate = GameRuleUpdate<"game_character_class_feature">; 
export type GameCharacterConsumable = GameRule<"game_character_consumable">;
export type GameCharacterConsumableInsert = GameRuleInsert<"game_character_consumable">;
export type GameCharacterConsumableUpdate = GameRuleUpdate<"game_character_consumable">; 
export type GameCharacterCorruption = GameRule<"game_character_corruption">;
export type GameCharacterCorruptionInsert = GameRuleInsert<"game_character_corruption">;
export type GameCharacterCorruptionUpdate = GameRuleUpdate<"game_character_corruption">; 
export type GameCharacterCorruptionManifestation = GameRule<"game_character_corruption_manifestation">;
export type GameCharacterCorruptionManifestationInsert = GameRuleInsert<"game_character_corruption_manifestation">;
export type GameCharacterCorruptionManifestationUpdate = GameRuleUpdate<"game_character_corruption_manifestation">; 
export type GameCharacterDiscovery = GameRule<"game_character_discovery">;
export type GameCharacterDiscoveryInsert = GameRuleInsert<"game_character_discovery">;
export type GameCharacterDiscoveryUpdate = GameRuleUpdate<"game_character_discovery">; 
export type GameCharacterEquipment = GameRule<"game_character_equipment">;
export type GameCharacterEquipmentInsert = GameRuleInsert<"game_character_equipment">;
export type GameCharacterEquipmentUpdate = GameRuleUpdate<"game_character_equipment">; 
export type GameCharacterFavoredClassBonus = GameRule<"game_character_favored_class_bonus">;
export type GameCharacterFavoredClassBonusInsert = GameRuleInsert<"game_character_favored_class_bonus">;
export type GameCharacterFavoredClassBonusUpdate = GameRuleUpdate<"game_character_favored_class_bonus">; 
export type GameCharacterFeat = GameRule<"game_character_feat">;
export type GameCharacterFeatInsert = GameRuleInsert<"game_character_feat">;
export type GameCharacterFeatUpdate = GameRuleUpdate<"game_character_feat">; 
export type GameCharacterSkillRank = GameRule<"game_character_skill_rank">;
export type GameCharacterSkillRankInsert = GameRuleInsert<"game_character_skill_rank">;
export type GameCharacterSkillRankUpdate = GameRuleUpdate<"game_character_skill_rank">; 
export type GameCharacterSpell = GameRule<"game_character_spell">;
export type GameCharacterSpellInsert = GameRuleInsert<"game_character_spell">;
export type GameCharacterSpellUpdate = GameRuleUpdate<"game_character_spell">; 
export type GameCharacterTrait = GameRule<"game_character_trait">;
export type GameCharacterTraitInsert = GameRuleInsert<"game_character_trait">;
export type GameCharacterTraitUpdate = GameRuleUpdate<"game_character_trait">; 
export type GameCharacterWeapon = GameRule<"game_character_weapon">;
export type GameCharacterWeaponInsert = GameRuleInsert<"game_character_weapon">;
export type GameCharacterWeaponUpdate = GameRuleUpdate<"game_character_weapon">; 
export type GameCharacterWildTalent = GameRule<"game_character_wild_talent">;
export type GameCharacterWildTalentInsert = GameRuleInsert<"game_character_wild_talent">;
export type GameCharacterWildTalentUpdate = GameRuleUpdate<"game_character_wild_talent">; 
export type LegendaryGiftType = GameRule<"legendary_gift_type">;
export type LegendaryGiftTypeInsert = GameRuleInsert<"legendary_gift_type">;
export type LegendaryGiftTypeUpdate = GameRuleUpdate<"legendary_gift_type">; 
export type MonkUnchainedKiPower = GameRule<"monk_unchained_ki_power">;
export type MonkUnchainedKiPowerInsert = GameRuleInsert<"monk_unchained_ki_power">;
export type MonkUnchainedKiPowerUpdate = GameRuleUpdate<"monk_unchained_ki_power">; 
export type PrerequisiteFulfillment = GameRule<"prerequisite_fulfillment">;
export type PrerequisiteFulfillmentInsert = GameRuleInsert<"prerequisite_fulfillment">;
export type PrerequisiteFulfillmentUpdate = GameRuleUpdate<"prerequisite_fulfillment">; 
export type PrerequisiteRequirement = GameRule<"prerequisite_requirement">;
export type PrerequisiteRequirementInsert = GameRuleInsert<"prerequisite_requirement">;
export type PrerequisiteRequirementUpdate = GameRuleUpdate<"prerequisite_requirement">; 
export type PrerequisiteRequirementFulfillmentMapping = GameRule<"prerequisite_requirement_fulfillment_mapping">;
export type PrerequisiteRequirementFulfillmentMappingInsert = GameRuleInsert<"prerequisite_requirement_fulfillment_mapping">;
export type PrerequisiteRequirementFulfillmentMappingUpdate = GameRuleUpdate<"prerequisite_requirement_fulfillment_mapping">; 
export type PrerequisiteRequirementType = GameRule<"prerequisite_requirement_type">;
export type PrerequisiteRequirementTypeInsert = GameRuleInsert<"prerequisite_requirement_type">;
export type PrerequisiteRequirementTypeUpdate = GameRuleUpdate<"prerequisite_requirement_type">; 
export type QinggongMonkKiPower = GameRule<"qinggong_monk_ki_power">;
export type QinggongMonkKiPowerInsert = GameRuleInsert<"qinggong_monk_ki_power">;
export type QinggongMonkKiPowerUpdate = GameRuleUpdate<"qinggong_monk_ki_power">; 
export type QinggongMonkKiPowerType = GameRule<"qinggong_monk_ki_power_type">;
export type QinggongMonkKiPowerTypeInsert = GameRuleInsert<"qinggong_monk_ki_power_type">;
export type QinggongMonkKiPowerTypeUpdate = GameRuleUpdate<"qinggong_monk_ki_power_type">; 
export type QualificationType = GameRule<"qualification_type">;
export type QualificationTypeInsert = GameRuleInsert<"qualification_type">;
export type QualificationTypeUpdate = GameRuleUpdate<"qualification_type">; 
export type Rule = GameRule<"rule">;
export type RuleInsert = GameRuleInsert<"rule">;
export type RuleUpdate = GameRuleUpdate<"rule">; 
export type Skill = GameRule<"skill">;
export type SkillInsert = GameRuleInsert<"skill">;
export type SkillUpdate = GameRuleUpdate<"skill">; 
export type SorcererBloodline = GameRule<"sorcerer_bloodline">;
export type SorcererBloodlineInsert = GameRuleInsert<"sorcerer_bloodline">;
export type SorcererBloodlineUpdate = GameRuleUpdate<"sorcerer_bloodline">; 
export type Spell = GameRule<"spell">;
export type SpellInsert = GameRuleInsert<"spell">;
export type SpellUpdate = GameRuleUpdate<"spell">; 
export type SpellCastingTime = GameRule<"spell_casting_time">;
export type SpellCastingTimeInsert = GameRuleInsert<"spell_casting_time">;
export type SpellCastingTimeUpdate = GameRuleUpdate<"spell_casting_time">; 
export type SpellCastingTimeMapping = GameRule<"spell_casting_time_mapping">;
export type SpellCastingTimeMappingInsert = GameRuleInsert<"spell_casting_time_mapping">;
export type SpellCastingTimeMappingUpdate = GameRuleUpdate<"spell_casting_time_mapping">; 
export type SpellComponent = GameRule<"spell_component">;
export type SpellComponentInsert = GameRuleInsert<"spell_component">;
export type SpellComponentUpdate = GameRuleUpdate<"spell_component">; 
export type SpellComponentMapping = GameRule<"spell_component_mapping">;
export type SpellComponentMappingInsert = GameRuleInsert<"spell_component_mapping">;
export type SpellComponentMappingUpdate = GameRuleUpdate<"spell_component_mapping">; 
export type SpellComponentType = GameRule<"spell_component_type">;
export type SpellComponentTypeInsert = GameRuleInsert<"spell_component_type">;
export type SpellComponentTypeUpdate = GameRuleUpdate<"spell_component_type">; 
export type SpellConsumable = GameRule<"spell_consumable">;
export type SpellConsumableInsert = GameRuleInsert<"spell_consumable">;
export type SpellConsumableUpdate = GameRuleUpdate<"spell_consumable">; 
export type SpellDuration = GameRule<"spell_duration">;
export type SpellDurationInsert = GameRuleInsert<"spell_duration">;
export type SpellDurationUpdate = GameRuleUpdate<"spell_duration">; 
export type SpellDurationMapping = GameRule<"spell_duration_mapping">;
export type SpellDurationMappingInsert = GameRuleInsert<"spell_duration_mapping">;
export type SpellDurationMappingUpdate = GameRuleUpdate<"spell_duration_mapping">; 
export type SpellList = GameRule<"spell_list">;
export type SpellListInsert = GameRuleInsert<"spell_list">;
export type SpellListUpdate = GameRuleUpdate<"spell_list">; 
export type SpellListClassFeatureBenefitMapping = GameRule<"spell_list_class_feature_benefit_mapping">;
export type SpellListClassFeatureBenefitMappingInsert = GameRuleInsert<"spell_list_class_feature_benefit_mapping">;
export type SpellListClassFeatureBenefitMappingUpdate = GameRuleUpdate<"spell_list_class_feature_benefit_mapping">; 
export type SpellListFeatMapping = GameRule<"spell_list_feat_mapping">;
export type SpellListFeatMappingInsert = GameRuleInsert<"spell_list_feat_mapping">;
export type SpellListFeatMappingUpdate = GameRuleUpdate<"spell_list_feat_mapping">; 
export type SpellListSpellMapping = GameRule<"spell_list_spell_mapping">;
export type SpellListSpellMappingInsert = GameRuleInsert<"spell_list_spell_mapping">;
export type SpellListSpellMappingUpdate = GameRuleUpdate<"spell_list_spell_mapping">; 
export type SpellRange = GameRule<"spell_range">;
export type SpellRangeInsert = GameRuleInsert<"spell_range">;
export type SpellRangeUpdate = GameRuleUpdate<"spell_range">; 
export type SpellRangeMapping = GameRule<"spell_range_mapping">;
export type SpellRangeMappingInsert = GameRuleInsert<"spell_range_mapping">;
export type SpellRangeMappingUpdate = GameRuleUpdate<"spell_range_mapping">; 
export type SpellSchool = GameRule<"spell_school">;
export type SpellSchoolInsert = GameRuleInsert<"spell_school">;
export type SpellSchoolUpdate = GameRuleUpdate<"spell_school">; 
export type SpellSchoolMapping = GameRule<"spell_school_mapping">;
export type SpellSchoolMappingInsert = GameRuleInsert<"spell_school_mapping">;
export type SpellSchoolMappingUpdate = GameRuleUpdate<"spell_school_mapping">; 
export type SpellSorcererBloodlineMapping = GameRule<"spell_sorcerer_bloodline_mapping">;
export type SpellSorcererBloodlineMappingInsert = GameRuleInsert<"spell_sorcerer_bloodline_mapping">;
export type SpellSorcererBloodlineMappingUpdate = GameRuleUpdate<"spell_sorcerer_bloodline_mapping">; 
export type SpellSubdomainMapping = GameRule<"spell_subdomain_mapping">;
export type SpellSubdomainMappingInsert = GameRuleInsert<"spell_subdomain_mapping">;
export type SpellSubdomainMappingUpdate = GameRuleUpdate<"spell_subdomain_mapping">; 
export type SpellTarget = GameRule<"spell_target">;
export type SpellTargetInsert = GameRuleInsert<"spell_target">;
export type SpellTargetUpdate = GameRuleUpdate<"spell_target">; 
export type SpellTargetMapping = GameRule<"spell_target_mapping">;
export type SpellTargetMappingInsert = GameRuleInsert<"spell_target_mapping">;
export type SpellTargetMappingUpdate = GameRuleUpdate<"spell_target_mapping">; 
export type SpellcastingClassFeature = GameRule<"spellcasting_class_feature">;
export type SpellcastingClassFeatureInsert = GameRuleInsert<"spellcasting_class_feature">;
export type SpellcastingClassFeatureUpdate = GameRuleUpdate<"spellcasting_class_feature">; 
export type SpellcastingPreparationType = GameRule<"spellcasting_preparation_type">;
export type SpellcastingPreparationTypeInsert = GameRuleInsert<"spellcasting_preparation_type">;
export type SpellcastingPreparationTypeUpdate = GameRuleUpdate<"spellcasting_preparation_type">; 
export type SpellcastingType = GameRule<"spellcasting_type">;
export type SpellcastingTypeInsert = GameRuleInsert<"spellcasting_type">;
export type SpellcastingTypeUpdate = GameRuleUpdate<"spellcasting_type">; 
export type Subdomain = GameRule<"subdomain">;
export type SubdomainInsert = GameRuleInsert<"subdomain">;
export type SubdomainUpdate = GameRuleUpdate<"subdomain">; 
export type Trait = GameRule<"trait">;
export type TraitInsert = GameRuleInsert<"trait">;
export type TraitUpdate = GameRuleUpdate<"trait">; 
export type Weapon = GameRule<"weapon">;
export type WeaponInsert = GameRuleInsert<"weapon">;
export type WeaponUpdate = GameRuleUpdate<"weapon">; 
export type WildTalent = GameRule<"wild_talent">;
export type WildTalentInsert = GameRuleInsert<"wild_talent">;
export type WildTalentUpdate = GameRuleUpdate<"wild_talent">; 
export type WildTalentType = GameRule<"wild_talent_type">;
export type WildTalentTypeInsert = GameRuleInsert<"wild_talent_type">;
export type WildTalentTypeUpdate = GameRuleUpdate<"wild_talent_type">; 

export interface CompleteCharacter extends GameCharacter {
    game_character_class: Array<GameCharacterClass & { class: Class }>;
    game_character_skill_rank: Array<GameCharacterSkillRank & { skill: Skill }>;
    game_character_ability: Array<GameCharacterAbility & { ability: Ability }>;
    game_character_feat: Array<GameCharacterFeat & { feat: Feat }>;
    game_character_consumable: Array<GameCharacterConsumable & { consumable: Consumable }>;
    game_character_archetype: Array<GameCharacterArchetype & { archetype: Archetype }>;
    game_character_ancestry: Array<GameCharacterAncestry & { ancestry: Ancestry }>;
    game_character_class_feature: Array<GameCharacterClassFeature & { class_feature: ClassFeature }>;
    game_character_corruption: Array<GameCharacterCorruption & { corruption: Corruption }>;
    game_character_corruption_manifestation: Array<GameCharacterCorruptionManifestation & { corruption_manifestation: CorruptionManifestation }>;
    game_character_wild_talent: Array<GameCharacterWildTalent & { wild_talent: WildTalent }>;
    game_character_abp_choice: Array<GameCharacterAbpChoice & { abp_node_group: AbpNodeGroup }>;
    game_character_favored_class_bonus: Array<GameCharacterFavoredClassBonus & { favored_class_choice: FavoredClassChoice }>;
    game_character_equipment: Array<GameCharacterEquipment & { equipment: Equipment }>;
    game_character_armor: Array<GameCharacterArmor & { armor: Armor }>;
    game_character_trait: Array<GameCharacterTrait & { trait: Trait }>;
    game_character_spell: Array<GameCharacterSpell & { spell: Spell }>;
    game_character_discovery: Array<GameCharacterDiscovery & { discovery: Discovery }>;
    game_character_weapon: Array<GameCharacterWeapon & { weapon: Weapon }>;
}

/** Interface for preloading common game data */
export interface PreloadTableData {
    ability?: Ability[];
    abp_bonus_type?: AbpBonusType[];
    abp_node?: AbpNode[];
    abp_node_bonus?: AbpNodeBonus[];
    abp_node_group?: AbpNodeGroup[];
    ancestry?: Ancestry[];
    archetype?: Archetype[];
    archetype_class_feature?: ArchetypeClassFeature[];
    armor?: Armor[];
    bonus_attack_progression?: BonusAttackProgression[];
    bonus_type?: BonusType[];
    classData?: Class[];
    class_feature?: ClassFeature[];
    class_feature_benefit?: ClassFeatureBenefit[];
    class_skill?: ClassSkill[];
    consumable?: Consumable[];
    corruption?: Corruption[];
    corruption_manifestation?: CorruptionManifestation[];
    discovery?: Discovery[];
    element?: Element[];
    equipment?: Equipment[];
    favored_class_choice?: FavoredClassChoice[];
    feat?: Feat[];
    feat_benefit?: FeatBenefit[];
    fulfillment_qualification_mapping?: FulfillmentQualificationMapping[];
    game_character?: GameCharacter[];
    game_character_ability?: GameCharacterAbility[];
    game_character_abp_choice?: GameCharacterAbpChoice[];
    game_character_ancestry?: GameCharacterAncestry[];
    game_character_archetype?: GameCharacterArchetype[];
    game_character_armor?: GameCharacterArmor[];
    game_character_class?: GameCharacterClass[];
    game_character_class_feature?: GameCharacterClassFeature[];
    game_character_consumable?: GameCharacterConsumable[];
    game_character_corruption?: GameCharacterCorruption[];
    game_character_corruption_manifestation?: GameCharacterCorruptionManifestation[];
    game_character_discovery?: GameCharacterDiscovery[];
    game_character_equipment?: GameCharacterEquipment[];
    game_character_favored_class_bonus?: GameCharacterFavoredClassBonus[];
    game_character_feat?: GameCharacterFeat[];
    game_character_skill_rank?: GameCharacterSkillRank[];
    game_character_spell?: GameCharacterSpell[];
    game_character_trait?: GameCharacterTrait[];
    game_character_weapon?: GameCharacterWeapon[];
    game_character_wild_talent?: GameCharacterWildTalent[];
    legendary_gift_type?: LegendaryGiftType[];
    monk_unchained_ki_power?: MonkUnchainedKiPower[];
    prerequisite_fulfillment?: PrerequisiteFulfillment[];
    prerequisite_requirement?: PrerequisiteRequirement[];
    prerequisite_requirement_fulfillment_mapping?: PrerequisiteRequirementFulfillmentMapping[];
    prerequisite_requirement_type?: PrerequisiteRequirementType[];
    qinggong_monk_ki_power?: QinggongMonkKiPower[];
    qinggong_monk_ki_power_type?: QinggongMonkKiPowerType[];
    qualification_type?: QualificationType[];
    rule?: Rule[];
    skill?: Skill[];
    sorcerer_bloodline?: SorcererBloodline[];
    spell?: Spell[];
    spell_casting_time?: SpellCastingTime[];
    spell_casting_time_mapping?: SpellCastingTimeMapping[];
    spell_component?: SpellComponent[];
    spell_component_mapping?: SpellComponentMapping[];
    spell_component_type?: SpellComponentType[];
    spell_consumable?: SpellConsumable[];
    spell_duration?: SpellDuration[];
    spell_duration_mapping?: SpellDurationMapping[];
    spell_list?: SpellList[];
    spell_list_class_feature_benefit_mapping?: SpellListClassFeatureBenefitMapping[];
    spell_list_feat_mapping?: SpellListFeatMapping[];
    spell_list_spell_mapping?: SpellListSpellMapping[];
    spell_range?: SpellRange[];
    spell_range_mapping?: SpellRangeMapping[];
    spell_school?: SpellSchool[];
    spell_school_mapping?: SpellSchoolMapping[];
    spell_sorcerer_bloodline_mapping?: SpellSorcererBloodlineMapping[];
    spell_subdomain_mapping?: SpellSubdomainMapping[];
    spell_target?: SpellTarget[];
    spell_target_mapping?: SpellTargetMapping[];
    spellcasting_class_feature?: SpellcastingClassFeature[];
    spellcasting_preparation_type?: SpellcastingPreparationType[];
    spellcasting_type?: SpellcastingType[];
    subdomain?: Subdomain[];
    trait?: Trait[];
    weapon?: Weapon[];
    wild_talent?: WildTalent[];
    wild_talent_type?: WildTalentType[];
}


/** Relationship cache structure */
export interface GameRuleRelationships {
    abilityByAbilityId: Record<number, Ability[]>;
    abpBonusTypeByBonusTypeId: Record<number, AbpBonusType[]>;
    abpNodeByNodeId: Record<number, AbpNode[]>;
    abpNodeGroupByGroupId: Record<number, AbpNodeGroup[]>;
    ancestryByAncestryId: Record<number, Ancestry[]>;
    archetypeByArchetypeId: Record<number, Archetype[]>;
    armorByArmorId: Record<number, Armor[]>;
    bonusAttackProgressionByBaseAttackBonusProgression: Record<number, BonusAttackProgression[]>;
    bonusTypeByBonusTypeId: Record<number, BonusType[]>;
    classByClassId: Record<number, Class[]>;
    classFeatureByClassFeatureId: Record<number, ClassFeature[]>;
    classFeatureByFeatureId: Record<number, ClassFeature[]>;
    classFeatureBenefitByClassFeatureBenefitId: Record<number, ClassFeatureBenefit[]>;
    consumableByConsumableId: Record<number, Consumable[]>;
    corruptionByCorruptionId: Record<number, Corruption[]>;
    corruptionManifestationByManifestationId: Record<number, CorruptionManifestation[]>;
    discoveryByDiscoveryId: Record<number, Discovery[]>;
    equipmentByEquipmentId: Record<number, Equipment[]>;
    favoredClassChoiceByChoiceId: Record<number, FavoredClassChoice[]>;
    featByFeatId: Record<number, Feat[]>;
    gameCharacterByGameCharacterId: Record<number, GameCharacter[]>;
    prerequisiteFulfillmentByFulfillmentId: Record<number, PrerequisiteFulfillment[]>;
    prerequisiteFulfillmentByPrerequisiteFulfillmentId: Record<number, PrerequisiteFulfillment[]>;
    prerequisiteRequirementByPrerequisiteRequirementId: Record<number, PrerequisiteRequirement[]>;
    prerequisiteRequirementTypeByRequirementTypeId: Record<number, PrerequisiteRequirementType[]>;
    qinggongMonkKiPowerTypeByPowerTypeId: Record<number, QinggongMonkKiPowerType[]>;
    qualificationTypeByQualificationTypeId: Record<number, QualificationType[]>;
    skillBySkillId: Record<number, Skill[]>;
    sorcererBloodlineBySorcererBloodlineId: Record<number, SorcererBloodline[]>;
    spellBySpellId: Record<number, Spell[]>;
    spellCastingTimeBySpellCastingTimeId: Record<number, SpellCastingTime[]>;
    spellComponentBySpellComponentId: Record<number, SpellComponent[]>;
    spellComponentTypeByTypeId: Record<number, SpellComponentType[]>;
    spellDurationBySpellDurationId: Record<number, SpellDuration[]>;
    spellListBySpellListId: Record<number, SpellList[]>;
    spellRangeBySpellRangeId: Record<number, SpellRange[]>;
    spellSchoolBySchoolId: Record<number, SpellSchool[]>;
    spellSchoolBySpellSchoolId: Record<number, SpellSchool[]>;
    spellTargetBySpellTargetId: Record<number, SpellTarget[]>;
    spellcastingPreparationTypeByPreparationType: Record<number, SpellcastingPreparationType[]>;
    spellcastingTypeBySpellcastingType: Record<number, SpellcastingType[]>;
    subdomainBySubdomainId: Record<number, Subdomain[]>;
    traitByTraitId: Record<number, Trait[]>;
    weaponByWeaponId: Record<number, Weapon[]>;
    wildTalentByWildTalentId: Record<number, WildTalent[]>;
    wildTalentTypeByWildTalentTypeId: Record<number, WildTalentType[]>;
}


/** Base class for table operations with caching and realtime updates */
export class TableOperations<T extends { id: number }, TInsert, TUpdate extends { id: number }> {
    private cache = new Map<number, T>();
    private allDataLoaded = false;
    private channel: RealtimeChannel | null = null;

    constructor(
        private supabase: SupabaseClient,
        private tableName: string
    ) {
        if (!tableName) throw new Error('Table name is required');
    }

    /** Get all records from the table with caching */
    async getAll(): Promise<T[]> {
        try {
            if (this.allDataLoaded) {
                return Array.from(this.cache.values());
            }

            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .order('id');
            if (error) throw error;
            
            // Update cache
            data?.forEach(item => this.cache.set(item.id, item as T));
            this.allDataLoaded = true;
            return data as T[] || [];
        } catch (error) {
            console.error(`Error fetching all ${this.tableName}:`, error);
            throw error;
        }
    }

    /** Get a single record by ID with caching */
    async getById(id: number): Promise<T | null> {
        try {
            // Check cache first
            if (this.cache.has(id)) {
                return this.cache.get(id) || null;
            }

            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .eq('id', id)
                .single();
            if (error && error.code !== 'PGRST116') throw error;
            
            // Update cache
            if (data) this.cache.set(data.id, data as T);
            return data as T;
        } catch (error) {
            console.error(`Error fetching ${this.tableName} by id:`, error);
            throw error;
        }
    }

    /** Get multiple records by IDs with caching */
    async getByIds(ids: number[]): Promise<T[]> {
        try {
            if (!ids.length) return [];
            
            // Check which ids we need to fetch
            const uncachedIds = ids.filter(id => !this.cache.has(id));
            
            if (uncachedIds.length > 0) {
                const { data, error } = await this.supabase
                    .from(this.tableName)
                    .select('*')
                    .in('id', uncachedIds);
                if (error) throw error;
                
                // Update cache with new data
                data?.forEach(item => this.cache.set(item.id, item as T));
            }
            
            // Return all requested items from cache
            return ids.map(id => this.cache.get(id)).filter((item): item is T => item != null);
        } catch (error) {
            console.error(`Error fetching ${this.tableName} by ids:`, error);
            throw error;
        }
    }

    /** Create a new record */
    async create(newItem: TInsert): Promise<T> {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .insert(newItem)
                .select()
                .single();
            if (error) throw error;
            if (!data) throw new Error(`Failed to create ${this.tableName}`);
            
            // Update cache
            const result = data as T;
            this.cache.set(result.id, result);
            return result;
        } catch (error) {
            console.error(`Error creating ${this.tableName}:`, error);
            throw error;
        }
    }

    /** Update an existing record */
    async update(changes: TUpdate): Promise<T> {
        try {
            const { id } = changes;
            if (!id) throw new Error(`update${this.tableName}: missing "id" field`);
            
            const { data, error } = await this.supabase
                .from(this.tableName)
                .update(changes)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            if (!data) throw new Error(`Failed to update ${this.tableName}`);
            
            // Update cache
            const result = data as T;
            this.cache.set(result.id, result);
            return result;
        } catch (error) {
            console.error(`Error updating ${this.tableName}:`, error);
            throw error;
        }
    }

    /** Delete a record */
    async delete(id: number): Promise<boolean> {
        try {
            const { error } = await this.supabase
                .from(this.tableName)
                .delete()
                .eq('id', id);
            if (error) throw error;
            
            // Remove from cache
            this.cache.delete(id);
            return true;
        } catch (error) {
            console.error(`Error deleting ${this.tableName}:`, error);
            throw error;
        }
    }

    /** Watch for realtime changes */
    watch(
        onChange: (type: 'insert' | 'update' | 'delete', row: T, oldRow?: T) => void
    ): () => void {
        if (this.channel) {
            this.stopWatch();
        }

        this.channel = this.supabase
            .channel(`${this.tableName}_changes`)
            .on<T>(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: this.tableName
                },
                (payload) => {
                    if (payload.eventType === 'INSERT' && payload.new) {
                        const newRow = payload.new as T;
                        this.cache.set(newRow.id, newRow);
                        onChange('insert', newRow);
                    } else if (payload.eventType === 'UPDATE' && payload.new) {
                        const newRow = payload.new as T;
                        this.cache.set(newRow.id, newRow);
                        onChange('update', newRow, payload.old as T);
                    } else if (payload.eventType === 'DELETE' && payload.old) {
                        const oldRow = payload.old as T;
                        this.cache.delete(oldRow.id);
                        onChange('delete', oldRow);
                    }
                }
            )
            .subscribe();

        return () => this.stopWatch();
    }

    /** Stop watching for realtime changes */
    stopWatch(): void {
        if (this.channel) {
            try {
                this.supabase.removeChannel(this.channel);
            } catch (err) {
                console.error(`Error removing channel for ${this.tableName}:`, err);
            } finally {
                this.channel = null;
            }
        }
    }
}

export class GameRulesAPI {
    [key: string]: any;

    private relationships: GameRuleRelationships = {
        abilityByAbilityId: {},abpBonusTypeByBonusTypeId: {},abpNodeByNodeId: {},abpNodeGroupByGroupId: {},ancestryByAncestryId: {},archetypeByArchetypeId: {},armorByArmorId: {},bonusAttackProgressionByBaseAttackBonusProgression: {},bonusTypeByBonusTypeId: {},classByClassId: {},classFeatureBenefitByClassFeatureBenefitId: {},classFeatureByClassFeatureId: {},classFeatureByFeatureId: {},consumableByConsumableId: {},corruptionByCorruptionId: {},corruptionManifestationByManifestationId: {},discoveryByDiscoveryId: {},equipmentByEquipmentId: {},favoredClassChoiceByChoiceId: {},featByFeatId: {},gameCharacterByGameCharacterId: {},prerequisiteFulfillmentByFulfillmentId: {},prerequisiteFulfillmentByPrerequisiteFulfillmentId: {},prerequisiteRequirementByPrerequisiteRequirementId: {},prerequisiteRequirementTypeByRequirementTypeId: {},qinggongMonkKiPowerTypeByPowerTypeId: {},qualificationTypeByQualificationTypeId: {},skillBySkillId: {},sorcererBloodlineBySorcererBloodlineId: {},spellBySpellId: {},spellCastingTimeBySpellCastingTimeId: {},spellComponentBySpellComponentId: {},spellComponentTypeByTypeId: {},spellDurationBySpellDurationId: {},spellListBySpellListId: {},spellRangeBySpellRangeId: {},spellSchoolBySchoolId: {},spellSchoolBySpellSchoolId: {},spellTargetBySpellTargetId: {},spellcastingPreparationTypeByPreparationType: {},spellcastingTypeBySpellcastingType: {},subdomainBySubdomainId: {},traitByTraitId: {},weaponByWeaponId: {},wildTalentByWildTalentId: {},wildTalentTypeByWildTalentTypeId: {}
    };

    // Watcher management
    private watchers: Array<() => void> = [];

    // Table operations instances
        private abilityOps!: TableOperations<Ability, AbilityInsert, AbilityUpdate>;
    private abp_bonus_typeOps!: TableOperations<AbpBonusType, AbpBonusTypeInsert, AbpBonusTypeUpdate>;
    private abp_nodeOps!: TableOperations<AbpNode, AbpNodeInsert, AbpNodeUpdate>;
    private abp_node_bonusOps!: TableOperations<AbpNodeBonus, AbpNodeBonusInsert, AbpNodeBonusUpdate>;
    private abp_node_groupOps!: TableOperations<AbpNodeGroup, AbpNodeGroupInsert, AbpNodeGroupUpdate>;
    private ancestryOps!: TableOperations<Ancestry, AncestryInsert, AncestryUpdate>;
    private archetypeOps!: TableOperations<Archetype, ArchetypeInsert, ArchetypeUpdate>;
    private archetype_class_featureOps!: TableOperations<ArchetypeClassFeature, ArchetypeClassFeatureInsert, ArchetypeClassFeatureUpdate>;
    private armorOps!: TableOperations<Armor, ArmorInsert, ArmorUpdate>;
    private bonus_attack_progressionOps!: TableOperations<BonusAttackProgression, BonusAttackProgressionInsert, BonusAttackProgressionUpdate>;
    private bonus_typeOps!: TableOperations<BonusType, BonusTypeInsert, BonusTypeUpdate>;
    private classOps!: TableOperations<Class, ClassInsert, ClassUpdate>;
    private class_featureOps!: TableOperations<ClassFeature, ClassFeatureInsert, ClassFeatureUpdate>;
    private class_feature_benefitOps!: TableOperations<ClassFeatureBenefit, ClassFeatureBenefitInsert, ClassFeatureBenefitUpdate>;
    private class_skillOps!: TableOperations<ClassSkill, ClassSkillInsert, ClassSkillUpdate>;
    private consumableOps!: TableOperations<Consumable, ConsumableInsert, ConsumableUpdate>;
    private corruptionOps!: TableOperations<Corruption, CorruptionInsert, CorruptionUpdate>;
    private corruption_manifestationOps!: TableOperations<CorruptionManifestation, CorruptionManifestationInsert, CorruptionManifestationUpdate>;
    private discoveryOps!: TableOperations<Discovery, DiscoveryInsert, DiscoveryUpdate>;
    private elementOps!: TableOperations<Element, ElementInsert, ElementUpdate>;
    private equipmentOps!: TableOperations<Equipment, EquipmentInsert, EquipmentUpdate>;
    private favored_class_choiceOps!: TableOperations<FavoredClassChoice, FavoredClassChoiceInsert, FavoredClassChoiceUpdate>;
    private featOps!: TableOperations<Feat, FeatInsert, FeatUpdate>;
    private feat_benefitOps!: TableOperations<FeatBenefit, FeatBenefitInsert, FeatBenefitUpdate>;
    private fulfillment_qualification_mappingOps!: TableOperations<FulfillmentQualificationMapping, FulfillmentQualificationMappingInsert, FulfillmentQualificationMappingUpdate>;
    private game_characterOps!: TableOperations<GameCharacter, GameCharacterInsert, GameCharacterUpdate>;
    private game_character_abilityOps!: TableOperations<GameCharacterAbility, GameCharacterAbilityInsert, GameCharacterAbilityUpdate>;
    private game_character_abp_choiceOps!: TableOperations<GameCharacterAbpChoice, GameCharacterAbpChoiceInsert, GameCharacterAbpChoiceUpdate>;
    private game_character_ancestryOps!: TableOperations<GameCharacterAncestry, GameCharacterAncestryInsert, GameCharacterAncestryUpdate>;
    private game_character_archetypeOps!: TableOperations<GameCharacterArchetype, GameCharacterArchetypeInsert, GameCharacterArchetypeUpdate>;
    private game_character_armorOps!: TableOperations<GameCharacterArmor, GameCharacterArmorInsert, GameCharacterArmorUpdate>;
    private game_character_classOps!: TableOperations<GameCharacterClass, GameCharacterClassInsert, GameCharacterClassUpdate>;
    private game_character_class_featureOps!: TableOperations<GameCharacterClassFeature, GameCharacterClassFeatureInsert, GameCharacterClassFeatureUpdate>;
    private game_character_consumableOps!: TableOperations<GameCharacterConsumable, GameCharacterConsumableInsert, GameCharacterConsumableUpdate>;
    private game_character_corruptionOps!: TableOperations<GameCharacterCorruption, GameCharacterCorruptionInsert, GameCharacterCorruptionUpdate>;
    private game_character_corruption_manifestationOps!: TableOperations<GameCharacterCorruptionManifestation, GameCharacterCorruptionManifestationInsert, GameCharacterCorruptionManifestationUpdate>;
    private game_character_discoveryOps!: TableOperations<GameCharacterDiscovery, GameCharacterDiscoveryInsert, GameCharacterDiscoveryUpdate>;
    private game_character_equipmentOps!: TableOperations<GameCharacterEquipment, GameCharacterEquipmentInsert, GameCharacterEquipmentUpdate>;
    private game_character_favored_class_bonusOps!: TableOperations<GameCharacterFavoredClassBonus, GameCharacterFavoredClassBonusInsert, GameCharacterFavoredClassBonusUpdate>;
    private game_character_featOps!: TableOperations<GameCharacterFeat, GameCharacterFeatInsert, GameCharacterFeatUpdate>;
    private game_character_skill_rankOps!: TableOperations<GameCharacterSkillRank, GameCharacterSkillRankInsert, GameCharacterSkillRankUpdate>;
    private game_character_spellOps!: TableOperations<GameCharacterSpell, GameCharacterSpellInsert, GameCharacterSpellUpdate>;
    private game_character_traitOps!: TableOperations<GameCharacterTrait, GameCharacterTraitInsert, GameCharacterTraitUpdate>;
    private game_character_weaponOps!: TableOperations<GameCharacterWeapon, GameCharacterWeaponInsert, GameCharacterWeaponUpdate>;
    private game_character_wild_talentOps!: TableOperations<GameCharacterWildTalent, GameCharacterWildTalentInsert, GameCharacterWildTalentUpdate>;
    private legendary_gift_typeOps!: TableOperations<LegendaryGiftType, LegendaryGiftTypeInsert, LegendaryGiftTypeUpdate>;
    private monk_unchained_ki_powerOps!: TableOperations<MonkUnchainedKiPower, MonkUnchainedKiPowerInsert, MonkUnchainedKiPowerUpdate>;
    private prerequisite_fulfillmentOps!: TableOperations<PrerequisiteFulfillment, PrerequisiteFulfillmentInsert, PrerequisiteFulfillmentUpdate>;
    private prerequisite_requirementOps!: TableOperations<PrerequisiteRequirement, PrerequisiteRequirementInsert, PrerequisiteRequirementUpdate>;
    private prerequisite_requirement_fulfillment_mappingOps!: TableOperations<PrerequisiteRequirementFulfillmentMapping, PrerequisiteRequirementFulfillmentMappingInsert, PrerequisiteRequirementFulfillmentMappingUpdate>;
    private prerequisite_requirement_typeOps!: TableOperations<PrerequisiteRequirementType, PrerequisiteRequirementTypeInsert, PrerequisiteRequirementTypeUpdate>;
    private qinggong_monk_ki_powerOps!: TableOperations<QinggongMonkKiPower, QinggongMonkKiPowerInsert, QinggongMonkKiPowerUpdate>;
    private qinggong_monk_ki_power_typeOps!: TableOperations<QinggongMonkKiPowerType, QinggongMonkKiPowerTypeInsert, QinggongMonkKiPowerTypeUpdate>;
    private qualification_typeOps!: TableOperations<QualificationType, QualificationTypeInsert, QualificationTypeUpdate>;
    private ruleOps!: TableOperations<Rule, RuleInsert, RuleUpdate>;
    private skillOps!: TableOperations<Skill, SkillInsert, SkillUpdate>;
    private sorcerer_bloodlineOps!: TableOperations<SorcererBloodline, SorcererBloodlineInsert, SorcererBloodlineUpdate>;
    private spellOps!: TableOperations<Spell, SpellInsert, SpellUpdate>;
    private spell_casting_timeOps!: TableOperations<SpellCastingTime, SpellCastingTimeInsert, SpellCastingTimeUpdate>;
    private spell_casting_time_mappingOps!: TableOperations<SpellCastingTimeMapping, SpellCastingTimeMappingInsert, SpellCastingTimeMappingUpdate>;
    private spell_componentOps!: TableOperations<SpellComponent, SpellComponentInsert, SpellComponentUpdate>;
    private spell_component_mappingOps!: TableOperations<SpellComponentMapping, SpellComponentMappingInsert, SpellComponentMappingUpdate>;
    private spell_component_typeOps!: TableOperations<SpellComponentType, SpellComponentTypeInsert, SpellComponentTypeUpdate>;
    private spell_consumableOps!: TableOperations<SpellConsumable, SpellConsumableInsert, SpellConsumableUpdate>;
    private spell_durationOps!: TableOperations<SpellDuration, SpellDurationInsert, SpellDurationUpdate>;
    private spell_duration_mappingOps!: TableOperations<SpellDurationMapping, SpellDurationMappingInsert, SpellDurationMappingUpdate>;
    private spell_listOps!: TableOperations<SpellList, SpellListInsert, SpellListUpdate>;
    private spell_list_class_feature_benefit_mappingOps!: TableOperations<SpellListClassFeatureBenefitMapping, SpellListClassFeatureBenefitMappingInsert, SpellListClassFeatureBenefitMappingUpdate>;
    private spell_list_feat_mappingOps!: TableOperations<SpellListFeatMapping, SpellListFeatMappingInsert, SpellListFeatMappingUpdate>;
    private spell_list_spell_mappingOps!: TableOperations<SpellListSpellMapping, SpellListSpellMappingInsert, SpellListSpellMappingUpdate>;
    private spell_rangeOps!: TableOperations<SpellRange, SpellRangeInsert, SpellRangeUpdate>;
    private spell_range_mappingOps!: TableOperations<SpellRangeMapping, SpellRangeMappingInsert, SpellRangeMappingUpdate>;
    private spell_schoolOps!: TableOperations<SpellSchool, SpellSchoolInsert, SpellSchoolUpdate>;
    private spell_school_mappingOps!: TableOperations<SpellSchoolMapping, SpellSchoolMappingInsert, SpellSchoolMappingUpdate>;
    private spell_sorcerer_bloodline_mappingOps!: TableOperations<SpellSorcererBloodlineMapping, SpellSorcererBloodlineMappingInsert, SpellSorcererBloodlineMappingUpdate>;
    private spell_subdomain_mappingOps!: TableOperations<SpellSubdomainMapping, SpellSubdomainMappingInsert, SpellSubdomainMappingUpdate>;
    private spell_targetOps!: TableOperations<SpellTarget, SpellTargetInsert, SpellTargetUpdate>;
    private spell_target_mappingOps!: TableOperations<SpellTargetMapping, SpellTargetMappingInsert, SpellTargetMappingUpdate>;
    private spellcasting_class_featureOps!: TableOperations<SpellcastingClassFeature, SpellcastingClassFeatureInsert, SpellcastingClassFeatureUpdate>;
    private spellcasting_preparation_typeOps!: TableOperations<SpellcastingPreparationType, SpellcastingPreparationTypeInsert, SpellcastingPreparationTypeUpdate>;
    private spellcasting_typeOps!: TableOperations<SpellcastingType, SpellcastingTypeInsert, SpellcastingTypeUpdate>;
    private subdomainOps!: TableOperations<Subdomain, SubdomainInsert, SubdomainUpdate>;
    private traitOps!: TableOperations<Trait, TraitInsert, TraitUpdate>;
    private weaponOps!: TableOperations<Weapon, WeaponInsert, WeaponUpdate>;
    private wild_talentOps!: TableOperations<WildTalent, WildTalentInsert, WildTalentUpdate>;
    private wild_talent_typeOps!: TableOperations<WildTalentType, WildTalentTypeInsert, WildTalentTypeUpdate>;
    
    constructor(private supabase: SupabaseClient) {
        if (!supabase) throw new Error('Supabase client is required');
        this.abilityOps = new TableOperations<Ability, AbilityInsert, AbilityUpdate>(supabase, "ability");
        this.abp_bonus_typeOps = new TableOperations<AbpBonusType, AbpBonusTypeInsert, AbpBonusTypeUpdate>(supabase, "abp_bonus_type");
        this.abp_nodeOps = new TableOperations<AbpNode, AbpNodeInsert, AbpNodeUpdate>(supabase, "abp_node");
        this.abp_node_bonusOps = new TableOperations<AbpNodeBonus, AbpNodeBonusInsert, AbpNodeBonusUpdate>(supabase, "abp_node_bonus");
        this.abp_node_groupOps = new TableOperations<AbpNodeGroup, AbpNodeGroupInsert, AbpNodeGroupUpdate>(supabase, "abp_node_group");
        this.ancestryOps = new TableOperations<Ancestry, AncestryInsert, AncestryUpdate>(supabase, "ancestry");
        this.archetypeOps = new TableOperations<Archetype, ArchetypeInsert, ArchetypeUpdate>(supabase, "archetype");
        this.archetype_class_featureOps = new TableOperations<ArchetypeClassFeature, ArchetypeClassFeatureInsert, ArchetypeClassFeatureUpdate>(supabase, "archetype_class_feature");
        this.armorOps = new TableOperations<Armor, ArmorInsert, ArmorUpdate>(supabase, "armor");
        this.bonus_attack_progressionOps = new TableOperations<BonusAttackProgression, BonusAttackProgressionInsert, BonusAttackProgressionUpdate>(supabase, "bonus_attack_progression");
        this.bonus_typeOps = new TableOperations<BonusType, BonusTypeInsert, BonusTypeUpdate>(supabase, "bonus_type");
        this.classOps = new TableOperations<Class, ClassInsert, ClassUpdate>(supabase, "class");
        this.class_featureOps = new TableOperations<ClassFeature, ClassFeatureInsert, ClassFeatureUpdate>(supabase, "class_feature");
        this.class_feature_benefitOps = new TableOperations<ClassFeatureBenefit, ClassFeatureBenefitInsert, ClassFeatureBenefitUpdate>(supabase, "class_feature_benefit");
        this.class_skillOps = new TableOperations<ClassSkill, ClassSkillInsert, ClassSkillUpdate>(supabase, "class_skill");
        this.consumableOps = new TableOperations<Consumable, ConsumableInsert, ConsumableUpdate>(supabase, "consumable");
        this.corruptionOps = new TableOperations<Corruption, CorruptionInsert, CorruptionUpdate>(supabase, "corruption");
        this.corruption_manifestationOps = new TableOperations<CorruptionManifestation, CorruptionManifestationInsert, CorruptionManifestationUpdate>(supabase, "corruption_manifestation");
        this.discoveryOps = new TableOperations<Discovery, DiscoveryInsert, DiscoveryUpdate>(supabase, "discovery");
        this.elementOps = new TableOperations<Element, ElementInsert, ElementUpdate>(supabase, "element");
        this.equipmentOps = new TableOperations<Equipment, EquipmentInsert, EquipmentUpdate>(supabase, "equipment");
        this.favored_class_choiceOps = new TableOperations<FavoredClassChoice, FavoredClassChoiceInsert, FavoredClassChoiceUpdate>(supabase, "favored_class_choice");
        this.featOps = new TableOperations<Feat, FeatInsert, FeatUpdate>(supabase, "feat");
        this.feat_benefitOps = new TableOperations<FeatBenefit, FeatBenefitInsert, FeatBenefitUpdate>(supabase, "feat_benefit");
        this.fulfillment_qualification_mappingOps = new TableOperations<FulfillmentQualificationMapping, FulfillmentQualificationMappingInsert, FulfillmentQualificationMappingUpdate>(supabase, "fulfillment_qualification_mapping");
        this.game_characterOps = new TableOperations<GameCharacter, GameCharacterInsert, GameCharacterUpdate>(supabase, "game_character");
        this.game_character_abilityOps = new TableOperations<GameCharacterAbility, GameCharacterAbilityInsert, GameCharacterAbilityUpdate>(supabase, "game_character_ability");
        this.game_character_abp_choiceOps = new TableOperations<GameCharacterAbpChoice, GameCharacterAbpChoiceInsert, GameCharacterAbpChoiceUpdate>(supabase, "game_character_abp_choice");
        this.game_character_ancestryOps = new TableOperations<GameCharacterAncestry, GameCharacterAncestryInsert, GameCharacterAncestryUpdate>(supabase, "game_character_ancestry");
        this.game_character_archetypeOps = new TableOperations<GameCharacterArchetype, GameCharacterArchetypeInsert, GameCharacterArchetypeUpdate>(supabase, "game_character_archetype");
        this.game_character_armorOps = new TableOperations<GameCharacterArmor, GameCharacterArmorInsert, GameCharacterArmorUpdate>(supabase, "game_character_armor");
        this.game_character_classOps = new TableOperations<GameCharacterClass, GameCharacterClassInsert, GameCharacterClassUpdate>(supabase, "game_character_class");
        this.game_character_class_featureOps = new TableOperations<GameCharacterClassFeature, GameCharacterClassFeatureInsert, GameCharacterClassFeatureUpdate>(supabase, "game_character_class_feature");
        this.game_character_consumableOps = new TableOperations<GameCharacterConsumable, GameCharacterConsumableInsert, GameCharacterConsumableUpdate>(supabase, "game_character_consumable");
        this.game_character_corruptionOps = new TableOperations<GameCharacterCorruption, GameCharacterCorruptionInsert, GameCharacterCorruptionUpdate>(supabase, "game_character_corruption");
        this.game_character_corruption_manifestationOps = new TableOperations<GameCharacterCorruptionManifestation, GameCharacterCorruptionManifestationInsert, GameCharacterCorruptionManifestationUpdate>(supabase, "game_character_corruption_manifestation");
        this.game_character_discoveryOps = new TableOperations<GameCharacterDiscovery, GameCharacterDiscoveryInsert, GameCharacterDiscoveryUpdate>(supabase, "game_character_discovery");
        this.game_character_equipmentOps = new TableOperations<GameCharacterEquipment, GameCharacterEquipmentInsert, GameCharacterEquipmentUpdate>(supabase, "game_character_equipment");
        this.game_character_favored_class_bonusOps = new TableOperations<GameCharacterFavoredClassBonus, GameCharacterFavoredClassBonusInsert, GameCharacterFavoredClassBonusUpdate>(supabase, "game_character_favored_class_bonus");
        this.game_character_featOps = new TableOperations<GameCharacterFeat, GameCharacterFeatInsert, GameCharacterFeatUpdate>(supabase, "game_character_feat");
        this.game_character_skill_rankOps = new TableOperations<GameCharacterSkillRank, GameCharacterSkillRankInsert, GameCharacterSkillRankUpdate>(supabase, "game_character_skill_rank");
        this.game_character_spellOps = new TableOperations<GameCharacterSpell, GameCharacterSpellInsert, GameCharacterSpellUpdate>(supabase, "game_character_spell");
        this.game_character_traitOps = new TableOperations<GameCharacterTrait, GameCharacterTraitInsert, GameCharacterTraitUpdate>(supabase, "game_character_trait");
        this.game_character_weaponOps = new TableOperations<GameCharacterWeapon, GameCharacterWeaponInsert, GameCharacterWeaponUpdate>(supabase, "game_character_weapon");
        this.game_character_wild_talentOps = new TableOperations<GameCharacterWildTalent, GameCharacterWildTalentInsert, GameCharacterWildTalentUpdate>(supabase, "game_character_wild_talent");
        this.legendary_gift_typeOps = new TableOperations<LegendaryGiftType, LegendaryGiftTypeInsert, LegendaryGiftTypeUpdate>(supabase, "legendary_gift_type");
        this.monk_unchained_ki_powerOps = new TableOperations<MonkUnchainedKiPower, MonkUnchainedKiPowerInsert, MonkUnchainedKiPowerUpdate>(supabase, "monk_unchained_ki_power");
        this.prerequisite_fulfillmentOps = new TableOperations<PrerequisiteFulfillment, PrerequisiteFulfillmentInsert, PrerequisiteFulfillmentUpdate>(supabase, "prerequisite_fulfillment");
        this.prerequisite_requirementOps = new TableOperations<PrerequisiteRequirement, PrerequisiteRequirementInsert, PrerequisiteRequirementUpdate>(supabase, "prerequisite_requirement");
        this.prerequisite_requirement_fulfillment_mappingOps = new TableOperations<PrerequisiteRequirementFulfillmentMapping, PrerequisiteRequirementFulfillmentMappingInsert, PrerequisiteRequirementFulfillmentMappingUpdate>(supabase, "prerequisite_requirement_fulfillment_mapping");
        this.prerequisite_requirement_typeOps = new TableOperations<PrerequisiteRequirementType, PrerequisiteRequirementTypeInsert, PrerequisiteRequirementTypeUpdate>(supabase, "prerequisite_requirement_type");
        this.qinggong_monk_ki_powerOps = new TableOperations<QinggongMonkKiPower, QinggongMonkKiPowerInsert, QinggongMonkKiPowerUpdate>(supabase, "qinggong_monk_ki_power");
        this.qinggong_monk_ki_power_typeOps = new TableOperations<QinggongMonkKiPowerType, QinggongMonkKiPowerTypeInsert, QinggongMonkKiPowerTypeUpdate>(supabase, "qinggong_monk_ki_power_type");
        this.qualification_typeOps = new TableOperations<QualificationType, QualificationTypeInsert, QualificationTypeUpdate>(supabase, "qualification_type");
        this.ruleOps = new TableOperations<Rule, RuleInsert, RuleUpdate>(supabase, "rule");
        this.skillOps = new TableOperations<Skill, SkillInsert, SkillUpdate>(supabase, "skill");
        this.sorcerer_bloodlineOps = new TableOperations<SorcererBloodline, SorcererBloodlineInsert, SorcererBloodlineUpdate>(supabase, "sorcerer_bloodline");
        this.spellOps = new TableOperations<Spell, SpellInsert, SpellUpdate>(supabase, "spell");
        this.spell_casting_timeOps = new TableOperations<SpellCastingTime, SpellCastingTimeInsert, SpellCastingTimeUpdate>(supabase, "spell_casting_time");
        this.spell_casting_time_mappingOps = new TableOperations<SpellCastingTimeMapping, SpellCastingTimeMappingInsert, SpellCastingTimeMappingUpdate>(supabase, "spell_casting_time_mapping");
        this.spell_componentOps = new TableOperations<SpellComponent, SpellComponentInsert, SpellComponentUpdate>(supabase, "spell_component");
        this.spell_component_mappingOps = new TableOperations<SpellComponentMapping, SpellComponentMappingInsert, SpellComponentMappingUpdate>(supabase, "spell_component_mapping");
        this.spell_component_typeOps = new TableOperations<SpellComponentType, SpellComponentTypeInsert, SpellComponentTypeUpdate>(supabase, "spell_component_type");
        this.spell_consumableOps = new TableOperations<SpellConsumable, SpellConsumableInsert, SpellConsumableUpdate>(supabase, "spell_consumable");
        this.spell_durationOps = new TableOperations<SpellDuration, SpellDurationInsert, SpellDurationUpdate>(supabase, "spell_duration");
        this.spell_duration_mappingOps = new TableOperations<SpellDurationMapping, SpellDurationMappingInsert, SpellDurationMappingUpdate>(supabase, "spell_duration_mapping");
        this.spell_listOps = new TableOperations<SpellList, SpellListInsert, SpellListUpdate>(supabase, "spell_list");
        this.spell_list_class_feature_benefit_mappingOps = new TableOperations<SpellListClassFeatureBenefitMapping, SpellListClassFeatureBenefitMappingInsert, SpellListClassFeatureBenefitMappingUpdate>(supabase, "spell_list_class_feature_benefit_mapping");
        this.spell_list_feat_mappingOps = new TableOperations<SpellListFeatMapping, SpellListFeatMappingInsert, SpellListFeatMappingUpdate>(supabase, "spell_list_feat_mapping");
        this.spell_list_spell_mappingOps = new TableOperations<SpellListSpellMapping, SpellListSpellMappingInsert, SpellListSpellMappingUpdate>(supabase, "spell_list_spell_mapping");
        this.spell_rangeOps = new TableOperations<SpellRange, SpellRangeInsert, SpellRangeUpdate>(supabase, "spell_range");
        this.spell_range_mappingOps = new TableOperations<SpellRangeMapping, SpellRangeMappingInsert, SpellRangeMappingUpdate>(supabase, "spell_range_mapping");
        this.spell_schoolOps = new TableOperations<SpellSchool, SpellSchoolInsert, SpellSchoolUpdate>(supabase, "spell_school");
        this.spell_school_mappingOps = new TableOperations<SpellSchoolMapping, SpellSchoolMappingInsert, SpellSchoolMappingUpdate>(supabase, "spell_school_mapping");
        this.spell_sorcerer_bloodline_mappingOps = new TableOperations<SpellSorcererBloodlineMapping, SpellSorcererBloodlineMappingInsert, SpellSorcererBloodlineMappingUpdate>(supabase, "spell_sorcerer_bloodline_mapping");
        this.spell_subdomain_mappingOps = new TableOperations<SpellSubdomainMapping, SpellSubdomainMappingInsert, SpellSubdomainMappingUpdate>(supabase, "spell_subdomain_mapping");
        this.spell_targetOps = new TableOperations<SpellTarget, SpellTargetInsert, SpellTargetUpdate>(supabase, "spell_target");
        this.spell_target_mappingOps = new TableOperations<SpellTargetMapping, SpellTargetMappingInsert, SpellTargetMappingUpdate>(supabase, "spell_target_mapping");
        this.spellcasting_class_featureOps = new TableOperations<SpellcastingClassFeature, SpellcastingClassFeatureInsert, SpellcastingClassFeatureUpdate>(supabase, "spellcasting_class_feature");
        this.spellcasting_preparation_typeOps = new TableOperations<SpellcastingPreparationType, SpellcastingPreparationTypeInsert, SpellcastingPreparationTypeUpdate>(supabase, "spellcasting_preparation_type");
        this.spellcasting_typeOps = new TableOperations<SpellcastingType, SpellcastingTypeInsert, SpellcastingTypeUpdate>(supabase, "spellcasting_type");
        this.subdomainOps = new TableOperations<Subdomain, SubdomainInsert, SubdomainUpdate>(supabase, "subdomain");
        this.traitOps = new TableOperations<Trait, TraitInsert, TraitUpdate>(supabase, "trait");
        this.weaponOps = new TableOperations<Weapon, WeaponInsert, WeaponUpdate>(supabase, "weapon");
        this.wild_talentOps = new TableOperations<WildTalent, WildTalentInsert, WildTalentUpdate>(supabase, "wild_talent");
        this.wild_talent_typeOps = new TableOperations<WildTalentType, WildTalentTypeInsert, WildTalentTypeUpdate>(supabase, "wild_talent_type");
    }

    // Ability operations
    getAllAbility = () => this.abilityOps.getAll();
    getAbilityById = (id: number) => this.abilityOps.getById(id);
    createAbility = (newItem: AbilityInsert) => this.abilityOps.create(newItem);
    updateAbility = (changes: AbilityUpdate) => this.abilityOps.update(changes);
    deleteAbility = (id: number) => this.abilityOps.delete(id);
    getAbilitysByIds = (ids: number[]) => this.abilityOps.getByIds(ids);
    watchAbility = (onChange: (type: 'insert' | 'update' | 'delete', row: Ability, oldRow?: Ability) => void) => {
        const unsubscribe = this.abilityOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchAbility = () => this.abilityOps.stopWatch();
    // AbpBonusType operations
    getAllAbpBonusType = () => this.abp_bonus_typeOps.getAll();
    getAbpBonusTypeById = (id: number) => this.abp_bonus_typeOps.getById(id);
    createAbpBonusType = (newItem: AbpBonusTypeInsert) => this.abp_bonus_typeOps.create(newItem);
    updateAbpBonusType = (changes: AbpBonusTypeUpdate) => this.abp_bonus_typeOps.update(changes);
    deleteAbpBonusType = (id: number) => this.abp_bonus_typeOps.delete(id);
    getAbpBonusTypesByIds = (ids: number[]) => this.abp_bonus_typeOps.getByIds(ids);
    watchAbpBonusType = (onChange: (type: 'insert' | 'update' | 'delete', row: AbpBonusType, oldRow?: AbpBonusType) => void) => {
        const unsubscribe = this.abp_bonus_typeOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchAbpBonusType = () => this.abp_bonus_typeOps.stopWatch();
    // AbpNode operations
    getAllAbpNode = () => this.abp_nodeOps.getAll();
    getAbpNodeById = (id: number) => this.abp_nodeOps.getById(id);
    createAbpNode = (newItem: AbpNodeInsert) => this.abp_nodeOps.create(newItem);
    updateAbpNode = (changes: AbpNodeUpdate) => this.abp_nodeOps.update(changes);
    deleteAbpNode = (id: number) => this.abp_nodeOps.delete(id);
    getAbpNodesByIds = (ids: number[]) => this.abp_nodeOps.getByIds(ids);
    watchAbpNode = (onChange: (type: 'insert' | 'update' | 'delete', row: AbpNode, oldRow?: AbpNode) => void) => {
        const unsubscribe = this.abp_nodeOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchAbpNode = () => this.abp_nodeOps.stopWatch();
    // AbpNodeBonus operations
    getAllAbpNodeBonus = () => this.abp_node_bonusOps.getAll();
    getAbpNodeBonusById = (id: number) => this.abp_node_bonusOps.getById(id);
    createAbpNodeBonus = (newItem: AbpNodeBonusInsert) => this.abp_node_bonusOps.create(newItem);
    updateAbpNodeBonus = (changes: AbpNodeBonusUpdate) => this.abp_node_bonusOps.update(changes);
    deleteAbpNodeBonus = (id: number) => this.abp_node_bonusOps.delete(id);
    getAbpNodeBonussByIds = (ids: number[]) => this.abp_node_bonusOps.getByIds(ids);
    watchAbpNodeBonus = (onChange: (type: 'insert' | 'update' | 'delete', row: AbpNodeBonus, oldRow?: AbpNodeBonus) => void) => {
        const unsubscribe = this.abp_node_bonusOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchAbpNodeBonus = () => this.abp_node_bonusOps.stopWatch();
    // AbpNodeGroup operations
    getAllAbpNodeGroup = () => this.abp_node_groupOps.getAll();
    getAbpNodeGroupById = (id: number) => this.abp_node_groupOps.getById(id);
    createAbpNodeGroup = (newItem: AbpNodeGroupInsert) => this.abp_node_groupOps.create(newItem);
    updateAbpNodeGroup = (changes: AbpNodeGroupUpdate) => this.abp_node_groupOps.update(changes);
    deleteAbpNodeGroup = (id: number) => this.abp_node_groupOps.delete(id);
    getAbpNodeGroupsByIds = (ids: number[]) => this.abp_node_groupOps.getByIds(ids);
    watchAbpNodeGroup = (onChange: (type: 'insert' | 'update' | 'delete', row: AbpNodeGroup, oldRow?: AbpNodeGroup) => void) => {
        const unsubscribe = this.abp_node_groupOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchAbpNodeGroup = () => this.abp_node_groupOps.stopWatch();
    // Ancestry operations
    getAllAncestry = () => this.ancestryOps.getAll();
    getAncestryById = (id: number) => this.ancestryOps.getById(id);
    createAncestry = (newItem: AncestryInsert) => this.ancestryOps.create(newItem);
    updateAncestry = (changes: AncestryUpdate) => this.ancestryOps.update(changes);
    deleteAncestry = (id: number) => this.ancestryOps.delete(id);
    getAncestrysByIds = (ids: number[]) => this.ancestryOps.getByIds(ids);
    watchAncestry = (onChange: (type: 'insert' | 'update' | 'delete', row: Ancestry, oldRow?: Ancestry) => void) => {
        const unsubscribe = this.ancestryOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchAncestry = () => this.ancestryOps.stopWatch();
    // Archetype operations
    getAllArchetype = () => this.archetypeOps.getAll();
    getArchetypeById = (id: number) => this.archetypeOps.getById(id);
    createArchetype = (newItem: ArchetypeInsert) => this.archetypeOps.create(newItem);
    updateArchetype = (changes: ArchetypeUpdate) => this.archetypeOps.update(changes);
    deleteArchetype = (id: number) => this.archetypeOps.delete(id);
    getArchetypesByIds = (ids: number[]) => this.archetypeOps.getByIds(ids);
    watchArchetype = (onChange: (type: 'insert' | 'update' | 'delete', row: Archetype, oldRow?: Archetype) => void) => {
        const unsubscribe = this.archetypeOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchArchetype = () => this.archetypeOps.stopWatch();
    // ArchetypeClassFeature operations
    getAllArchetypeClassFeature = () => this.archetype_class_featureOps.getAll();
    getArchetypeClassFeatureById = (id: number) => this.archetype_class_featureOps.getById(id);
    createArchetypeClassFeature = (newItem: ArchetypeClassFeatureInsert) => this.archetype_class_featureOps.create(newItem);
    updateArchetypeClassFeature = (changes: ArchetypeClassFeatureUpdate) => this.archetype_class_featureOps.update(changes);
    deleteArchetypeClassFeature = (id: number) => this.archetype_class_featureOps.delete(id);
    getArchetypeClassFeaturesByIds = (ids: number[]) => this.archetype_class_featureOps.getByIds(ids);
    watchArchetypeClassFeature = (onChange: (type: 'insert' | 'update' | 'delete', row: ArchetypeClassFeature, oldRow?: ArchetypeClassFeature) => void) => {
        const unsubscribe = this.archetype_class_featureOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchArchetypeClassFeature = () => this.archetype_class_featureOps.stopWatch();
    // Armor operations
    getAllArmor = () => this.armorOps.getAll();
    getArmorById = (id: number) => this.armorOps.getById(id);
    createArmor = (newItem: ArmorInsert) => this.armorOps.create(newItem);
    updateArmor = (changes: ArmorUpdate) => this.armorOps.update(changes);
    deleteArmor = (id: number) => this.armorOps.delete(id);
    getArmorsByIds = (ids: number[]) => this.armorOps.getByIds(ids);
    watchArmor = (onChange: (type: 'insert' | 'update' | 'delete', row: Armor, oldRow?: Armor) => void) => {
        const unsubscribe = this.armorOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchArmor = () => this.armorOps.stopWatch();
    // BonusAttackProgression operations
    getAllBonusAttackProgression = () => this.bonus_attack_progressionOps.getAll();
    getBonusAttackProgressionById = (id: number) => this.bonus_attack_progressionOps.getById(id);
    createBonusAttackProgression = (newItem: BonusAttackProgressionInsert) => this.bonus_attack_progressionOps.create(newItem);
    updateBonusAttackProgression = (changes: BonusAttackProgressionUpdate) => this.bonus_attack_progressionOps.update(changes);
    deleteBonusAttackProgression = (id: number) => this.bonus_attack_progressionOps.delete(id);
    getBonusAttackProgressionsByIds = (ids: number[]) => this.bonus_attack_progressionOps.getByIds(ids);
    watchBonusAttackProgression = (onChange: (type: 'insert' | 'update' | 'delete', row: BonusAttackProgression, oldRow?: BonusAttackProgression) => void) => {
        const unsubscribe = this.bonus_attack_progressionOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchBonusAttackProgression = () => this.bonus_attack_progressionOps.stopWatch();
    // BonusType operations
    getAllBonusType = () => this.bonus_typeOps.getAll();
    getBonusTypeById = (id: number) => this.bonus_typeOps.getById(id);
    createBonusType = (newItem: BonusTypeInsert) => this.bonus_typeOps.create(newItem);
    updateBonusType = (changes: BonusTypeUpdate) => this.bonus_typeOps.update(changes);
    deleteBonusType = (id: number) => this.bonus_typeOps.delete(id);
    getBonusTypesByIds = (ids: number[]) => this.bonus_typeOps.getByIds(ids);
    watchBonusType = (onChange: (type: 'insert' | 'update' | 'delete', row: BonusType, oldRow?: BonusType) => void) => {
        const unsubscribe = this.bonus_typeOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchBonusType = () => this.bonus_typeOps.stopWatch();
    // Class operations
    getAllClass = () => this.classOps.getAll();
    getClassById = (id: number) => this.classOps.getById(id);
    createClass = (newItem: ClassInsert) => this.classOps.create(newItem);
    updateClass = (changes: ClassUpdate) => this.classOps.update(changes);
    deleteClass = (id: number) => this.classOps.delete(id);
    getClasssByIds = (ids: number[]) => this.classOps.getByIds(ids);
    watchClass = (onChange: (type: 'insert' | 'update' | 'delete', row: Class, oldRow?: Class) => void) => {
        const unsubscribe = this.classOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchClass = () => this.classOps.stopWatch();
    // ClassFeature operations
    getAllClassFeature = () => this.class_featureOps.getAll();
    getClassFeatureById = (id: number) => this.class_featureOps.getById(id);
    createClassFeature = (newItem: ClassFeatureInsert) => this.class_featureOps.create(newItem);
    updateClassFeature = (changes: ClassFeatureUpdate) => this.class_featureOps.update(changes);
    deleteClassFeature = (id: number) => this.class_featureOps.delete(id);
    getClassFeaturesByIds = (ids: number[]) => this.class_featureOps.getByIds(ids);
    watchClassFeature = (onChange: (type: 'insert' | 'update' | 'delete', row: ClassFeature, oldRow?: ClassFeature) => void) => {
        const unsubscribe = this.class_featureOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchClassFeature = () => this.class_featureOps.stopWatch();
    // ClassFeatureBenefit operations
    getAllClassFeatureBenefit = () => this.class_feature_benefitOps.getAll();
    getClassFeatureBenefitById = (id: number) => this.class_feature_benefitOps.getById(id);
    createClassFeatureBenefit = (newItem: ClassFeatureBenefitInsert) => this.class_feature_benefitOps.create(newItem);
    updateClassFeatureBenefit = (changes: ClassFeatureBenefitUpdate) => this.class_feature_benefitOps.update(changes);
    deleteClassFeatureBenefit = (id: number) => this.class_feature_benefitOps.delete(id);
    getClassFeatureBenefitsByIds = (ids: number[]) => this.class_feature_benefitOps.getByIds(ids);
    watchClassFeatureBenefit = (onChange: (type: 'insert' | 'update' | 'delete', row: ClassFeatureBenefit, oldRow?: ClassFeatureBenefit) => void) => {
        const unsubscribe = this.class_feature_benefitOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchClassFeatureBenefit = () => this.class_feature_benefitOps.stopWatch();
    // ClassSkill operations
    getAllClassSkill = () => this.class_skillOps.getAll();
    getClassSkillById = (id: number) => this.class_skillOps.getById(id);
    createClassSkill = (newItem: ClassSkillInsert) => this.class_skillOps.create(newItem);
    updateClassSkill = (changes: ClassSkillUpdate) => this.class_skillOps.update(changes);
    deleteClassSkill = (id: number) => this.class_skillOps.delete(id);
    getClassSkillsByIds = (ids: number[]) => this.class_skillOps.getByIds(ids);
    watchClassSkill = (onChange: (type: 'insert' | 'update' | 'delete', row: ClassSkill, oldRow?: ClassSkill) => void) => {
        const unsubscribe = this.class_skillOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchClassSkill = () => this.class_skillOps.stopWatch();
    // Consumable operations
    getAllConsumable = () => this.consumableOps.getAll();
    getConsumableById = (id: number) => this.consumableOps.getById(id);
    createConsumable = (newItem: ConsumableInsert) => this.consumableOps.create(newItem);
    updateConsumable = (changes: ConsumableUpdate) => this.consumableOps.update(changes);
    deleteConsumable = (id: number) => this.consumableOps.delete(id);
    getConsumablesByIds = (ids: number[]) => this.consumableOps.getByIds(ids);
    watchConsumable = (onChange: (type: 'insert' | 'update' | 'delete', row: Consumable, oldRow?: Consumable) => void) => {
        const unsubscribe = this.consumableOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchConsumable = () => this.consumableOps.stopWatch();
    // Corruption operations
    getAllCorruption = () => this.corruptionOps.getAll();
    getCorruptionById = (id: number) => this.corruptionOps.getById(id);
    createCorruption = (newItem: CorruptionInsert) => this.corruptionOps.create(newItem);
    updateCorruption = (changes: CorruptionUpdate) => this.corruptionOps.update(changes);
    deleteCorruption = (id: number) => this.corruptionOps.delete(id);
    getCorruptionsByIds = (ids: number[]) => this.corruptionOps.getByIds(ids);
    watchCorruption = (onChange: (type: 'insert' | 'update' | 'delete', row: Corruption, oldRow?: Corruption) => void) => {
        const unsubscribe = this.corruptionOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchCorruption = () => this.corruptionOps.stopWatch();
    // CorruptionManifestation operations
    getAllCorruptionManifestation = () => this.corruption_manifestationOps.getAll();
    getCorruptionManifestationById = (id: number) => this.corruption_manifestationOps.getById(id);
    createCorruptionManifestation = (newItem: CorruptionManifestationInsert) => this.corruption_manifestationOps.create(newItem);
    updateCorruptionManifestation = (changes: CorruptionManifestationUpdate) => this.corruption_manifestationOps.update(changes);
    deleteCorruptionManifestation = (id: number) => this.corruption_manifestationOps.delete(id);
    getCorruptionManifestationsByIds = (ids: number[]) => this.corruption_manifestationOps.getByIds(ids);
    watchCorruptionManifestation = (onChange: (type: 'insert' | 'update' | 'delete', row: CorruptionManifestation, oldRow?: CorruptionManifestation) => void) => {
        const unsubscribe = this.corruption_manifestationOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchCorruptionManifestation = () => this.corruption_manifestationOps.stopWatch();
    // Discovery operations
    getAllDiscovery = () => this.discoveryOps.getAll();
    getDiscoveryById = (id: number) => this.discoveryOps.getById(id);
    createDiscovery = (newItem: DiscoveryInsert) => this.discoveryOps.create(newItem);
    updateDiscovery = (changes: DiscoveryUpdate) => this.discoveryOps.update(changes);
    deleteDiscovery = (id: number) => this.discoveryOps.delete(id);
    getDiscoverysByIds = (ids: number[]) => this.discoveryOps.getByIds(ids);
    watchDiscovery = (onChange: (type: 'insert' | 'update' | 'delete', row: Discovery, oldRow?: Discovery) => void) => {
        const unsubscribe = this.discoveryOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchDiscovery = () => this.discoveryOps.stopWatch();
    // Element operations
    getAllElement = () => this.elementOps.getAll();
    getElementById = (id: number) => this.elementOps.getById(id);
    createElement = (newItem: ElementInsert) => this.elementOps.create(newItem);
    updateElement = (changes: ElementUpdate) => this.elementOps.update(changes);
    deleteElement = (id: number) => this.elementOps.delete(id);
    getElementsByIds = (ids: number[]) => this.elementOps.getByIds(ids);
    watchElement = (onChange: (type: 'insert' | 'update' | 'delete', row: Element, oldRow?: Element) => void) => {
        const unsubscribe = this.elementOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchElement = () => this.elementOps.stopWatch();
    // Equipment operations
    getAllEquipment = () => this.equipmentOps.getAll();
    getEquipmentById = (id: number) => this.equipmentOps.getById(id);
    createEquipment = (newItem: EquipmentInsert) => this.equipmentOps.create(newItem);
    updateEquipment = (changes: EquipmentUpdate) => this.equipmentOps.update(changes);
    deleteEquipment = (id: number) => this.equipmentOps.delete(id);
    getEquipmentsByIds = (ids: number[]) => this.equipmentOps.getByIds(ids);
    watchEquipment = (onChange: (type: 'insert' | 'update' | 'delete', row: Equipment, oldRow?: Equipment) => void) => {
        const unsubscribe = this.equipmentOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchEquipment = () => this.equipmentOps.stopWatch();
    // FavoredClassChoice operations
    getAllFavoredClassChoice = () => this.favored_class_choiceOps.getAll();
    getFavoredClassChoiceById = (id: number) => this.favored_class_choiceOps.getById(id);
    createFavoredClassChoice = (newItem: FavoredClassChoiceInsert) => this.favored_class_choiceOps.create(newItem);
    updateFavoredClassChoice = (changes: FavoredClassChoiceUpdate) => this.favored_class_choiceOps.update(changes);
    deleteFavoredClassChoice = (id: number) => this.favored_class_choiceOps.delete(id);
    getFavoredClassChoicesByIds = (ids: number[]) => this.favored_class_choiceOps.getByIds(ids);
    watchFavoredClassChoice = (onChange: (type: 'insert' | 'update' | 'delete', row: FavoredClassChoice, oldRow?: FavoredClassChoice) => void) => {
        const unsubscribe = this.favored_class_choiceOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchFavoredClassChoice = () => this.favored_class_choiceOps.stopWatch();
    // Feat operations
    getAllFeat = () => this.featOps.getAll();
    getFeatById = (id: number) => this.featOps.getById(id);
    createFeat = (newItem: FeatInsert) => this.featOps.create(newItem);
    updateFeat = (changes: FeatUpdate) => this.featOps.update(changes);
    deleteFeat = (id: number) => this.featOps.delete(id);
    getFeatsByIds = (ids: number[]) => this.featOps.getByIds(ids);
    watchFeat = (onChange: (type: 'insert' | 'update' | 'delete', row: Feat, oldRow?: Feat) => void) => {
        const unsubscribe = this.featOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchFeat = () => this.featOps.stopWatch();
    // FeatBenefit operations
    getAllFeatBenefit = () => this.feat_benefitOps.getAll();
    getFeatBenefitById = (id: number) => this.feat_benefitOps.getById(id);
    createFeatBenefit = (newItem: FeatBenefitInsert) => this.feat_benefitOps.create(newItem);
    updateFeatBenefit = (changes: FeatBenefitUpdate) => this.feat_benefitOps.update(changes);
    deleteFeatBenefit = (id: number) => this.feat_benefitOps.delete(id);
    getFeatBenefitsByIds = (ids: number[]) => this.feat_benefitOps.getByIds(ids);
    watchFeatBenefit = (onChange: (type: 'insert' | 'update' | 'delete', row: FeatBenefit, oldRow?: FeatBenefit) => void) => {
        const unsubscribe = this.feat_benefitOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchFeatBenefit = () => this.feat_benefitOps.stopWatch();
    // FulfillmentQualificationMapping operations
    getAllFulfillmentQualificationMapping = () => this.fulfillment_qualification_mappingOps.getAll();
    getFulfillmentQualificationMappingById = (id: number) => this.fulfillment_qualification_mappingOps.getById(id);
    createFulfillmentQualificationMapping = (newItem: FulfillmentQualificationMappingInsert) => this.fulfillment_qualification_mappingOps.create(newItem);
    updateFulfillmentQualificationMapping = (changes: FulfillmentQualificationMappingUpdate) => this.fulfillment_qualification_mappingOps.update(changes);
    deleteFulfillmentQualificationMapping = (id: number) => this.fulfillment_qualification_mappingOps.delete(id);
    getFulfillmentQualificationMappingsByIds = (ids: number[]) => this.fulfillment_qualification_mappingOps.getByIds(ids);
    watchFulfillmentQualificationMapping = (onChange: (type: 'insert' | 'update' | 'delete', row: FulfillmentQualificationMapping, oldRow?: FulfillmentQualificationMapping) => void) => {
        const unsubscribe = this.fulfillment_qualification_mappingOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchFulfillmentQualificationMapping = () => this.fulfillment_qualification_mappingOps.stopWatch();
    // GameCharacter operations
    getAllGameCharacter = () => this.game_characterOps.getAll();
    getGameCharacterById = (id: number) => this.game_characterOps.getById(id);
    createGameCharacter = (newItem: GameCharacterInsert) => this.game_characterOps.create(newItem);
    updateGameCharacter = (changes: GameCharacterUpdate) => this.game_characterOps.update(changes);
    deleteGameCharacter = (id: number) => this.game_characterOps.delete(id);
    getGameCharactersByIds = (ids: number[]) => this.game_characterOps.getByIds(ids);
    watchGameCharacter = (onChange: (type: 'insert' | 'update' | 'delete', row: GameCharacter, oldRow?: GameCharacter) => void) => {
        const unsubscribe = this.game_characterOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchGameCharacter = () => this.game_characterOps.stopWatch();
    // GameCharacterAbility operations
    getAllGameCharacterAbility = () => this.game_character_abilityOps.getAll();
    getGameCharacterAbilityById = (id: number) => this.game_character_abilityOps.getById(id);
    createGameCharacterAbility = (newItem: GameCharacterAbilityInsert) => this.game_character_abilityOps.create(newItem);
    updateGameCharacterAbility = (changes: GameCharacterAbilityUpdate) => this.game_character_abilityOps.update(changes);
    deleteGameCharacterAbility = (id: number) => this.game_character_abilityOps.delete(id);
    getGameCharacterAbilitysByIds = (ids: number[]) => this.game_character_abilityOps.getByIds(ids);
    watchGameCharacterAbility = (onChange: (type: 'insert' | 'update' | 'delete', row: GameCharacterAbility, oldRow?: GameCharacterAbility) => void) => {
        const unsubscribe = this.game_character_abilityOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchGameCharacterAbility = () => this.game_character_abilityOps.stopWatch();
    // GameCharacterAbpChoice operations
    getAllGameCharacterAbpChoice = () => this.game_character_abp_choiceOps.getAll();
    getGameCharacterAbpChoiceById = (id: number) => this.game_character_abp_choiceOps.getById(id);
    createGameCharacterAbpChoice = (newItem: GameCharacterAbpChoiceInsert) => this.game_character_abp_choiceOps.create(newItem);
    updateGameCharacterAbpChoice = (changes: GameCharacterAbpChoiceUpdate) => this.game_character_abp_choiceOps.update(changes);
    deleteGameCharacterAbpChoice = (id: number) => this.game_character_abp_choiceOps.delete(id);
    getGameCharacterAbpChoicesByIds = (ids: number[]) => this.game_character_abp_choiceOps.getByIds(ids);
    watchGameCharacterAbpChoice = (onChange: (type: 'insert' | 'update' | 'delete', row: GameCharacterAbpChoice, oldRow?: GameCharacterAbpChoice) => void) => {
        const unsubscribe = this.game_character_abp_choiceOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchGameCharacterAbpChoice = () => this.game_character_abp_choiceOps.stopWatch();
    // GameCharacterAncestry operations
    getAllGameCharacterAncestry = () => this.game_character_ancestryOps.getAll();
    getGameCharacterAncestryById = (id: number) => this.game_character_ancestryOps.getById(id);
    createGameCharacterAncestry = (newItem: GameCharacterAncestryInsert) => this.game_character_ancestryOps.create(newItem);
    updateGameCharacterAncestry = (changes: GameCharacterAncestryUpdate) => this.game_character_ancestryOps.update(changes);
    deleteGameCharacterAncestry = (id: number) => this.game_character_ancestryOps.delete(id);
    getGameCharacterAncestrysByIds = (ids: number[]) => this.game_character_ancestryOps.getByIds(ids);
    watchGameCharacterAncestry = (onChange: (type: 'insert' | 'update' | 'delete', row: GameCharacterAncestry, oldRow?: GameCharacterAncestry) => void) => {
        const unsubscribe = this.game_character_ancestryOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchGameCharacterAncestry = () => this.game_character_ancestryOps.stopWatch();
    // GameCharacterArchetype operations
    getAllGameCharacterArchetype = () => this.game_character_archetypeOps.getAll();
    getGameCharacterArchetypeById = (id: number) => this.game_character_archetypeOps.getById(id);
    createGameCharacterArchetype = (newItem: GameCharacterArchetypeInsert) => this.game_character_archetypeOps.create(newItem);
    updateGameCharacterArchetype = (changes: GameCharacterArchetypeUpdate) => this.game_character_archetypeOps.update(changes);
    deleteGameCharacterArchetype = (id: number) => this.game_character_archetypeOps.delete(id);
    getGameCharacterArchetypesByIds = (ids: number[]) => this.game_character_archetypeOps.getByIds(ids);
    watchGameCharacterArchetype = (onChange: (type: 'insert' | 'update' | 'delete', row: GameCharacterArchetype, oldRow?: GameCharacterArchetype) => void) => {
        const unsubscribe = this.game_character_archetypeOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchGameCharacterArchetype = () => this.game_character_archetypeOps.stopWatch();
    // GameCharacterArmor operations
    getAllGameCharacterArmor = () => this.game_character_armorOps.getAll();
    getGameCharacterArmorById = (id: number) => this.game_character_armorOps.getById(id);
    createGameCharacterArmor = (newItem: GameCharacterArmorInsert) => this.game_character_armorOps.create(newItem);
    updateGameCharacterArmor = (changes: GameCharacterArmorUpdate) => this.game_character_armorOps.update(changes);
    deleteGameCharacterArmor = (id: number) => this.game_character_armorOps.delete(id);
    getGameCharacterArmorsByIds = (ids: number[]) => this.game_character_armorOps.getByIds(ids);
    watchGameCharacterArmor = (onChange: (type: 'insert' | 'update' | 'delete', row: GameCharacterArmor, oldRow?: GameCharacterArmor) => void) => {
        const unsubscribe = this.game_character_armorOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchGameCharacterArmor = () => this.game_character_armorOps.stopWatch();
    // GameCharacterClass operations
    getAllGameCharacterClass = () => this.game_character_classOps.getAll();
    getGameCharacterClassById = (id: number) => this.game_character_classOps.getById(id);
    createGameCharacterClass = (newItem: GameCharacterClassInsert) => this.game_character_classOps.create(newItem);
    updateGameCharacterClass = (changes: GameCharacterClassUpdate) => this.game_character_classOps.update(changes);
    deleteGameCharacterClass = (id: number) => this.game_character_classOps.delete(id);
    getGameCharacterClasssByIds = (ids: number[]) => this.game_character_classOps.getByIds(ids);
    watchGameCharacterClass = (onChange: (type: 'insert' | 'update' | 'delete', row: GameCharacterClass, oldRow?: GameCharacterClass) => void) => {
        const unsubscribe = this.game_character_classOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchGameCharacterClass = () => this.game_character_classOps.stopWatch();
    // GameCharacterClassFeature operations
    getAllGameCharacterClassFeature = () => this.game_character_class_featureOps.getAll();
    getGameCharacterClassFeatureById = (id: number) => this.game_character_class_featureOps.getById(id);
    createGameCharacterClassFeature = (newItem: GameCharacterClassFeatureInsert) => this.game_character_class_featureOps.create(newItem);
    updateGameCharacterClassFeature = (changes: GameCharacterClassFeatureUpdate) => this.game_character_class_featureOps.update(changes);
    deleteGameCharacterClassFeature = (id: number) => this.game_character_class_featureOps.delete(id);
    getGameCharacterClassFeaturesByIds = (ids: number[]) => this.game_character_class_featureOps.getByIds(ids);
    watchGameCharacterClassFeature = (onChange: (type: 'insert' | 'update' | 'delete', row: GameCharacterClassFeature, oldRow?: GameCharacterClassFeature) => void) => {
        const unsubscribe = this.game_character_class_featureOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchGameCharacterClassFeature = () => this.game_character_class_featureOps.stopWatch();
    // GameCharacterConsumable operations
    getAllGameCharacterConsumable = () => this.game_character_consumableOps.getAll();
    getGameCharacterConsumableById = (id: number) => this.game_character_consumableOps.getById(id);
    createGameCharacterConsumable = (newItem: GameCharacterConsumableInsert) => this.game_character_consumableOps.create(newItem);
    updateGameCharacterConsumable = (changes: GameCharacterConsumableUpdate) => this.game_character_consumableOps.update(changes);
    deleteGameCharacterConsumable = (id: number) => this.game_character_consumableOps.delete(id);
    getGameCharacterConsumablesByIds = (ids: number[]) => this.game_character_consumableOps.getByIds(ids);
    watchGameCharacterConsumable = (onChange: (type: 'insert' | 'update' | 'delete', row: GameCharacterConsumable, oldRow?: GameCharacterConsumable) => void) => {
        const unsubscribe = this.game_character_consumableOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchGameCharacterConsumable = () => this.game_character_consumableOps.stopWatch();
    // GameCharacterCorruption operations
    getAllGameCharacterCorruption = () => this.game_character_corruptionOps.getAll();
    getGameCharacterCorruptionById = (id: number) => this.game_character_corruptionOps.getById(id);
    createGameCharacterCorruption = (newItem: GameCharacterCorruptionInsert) => this.game_character_corruptionOps.create(newItem);
    updateGameCharacterCorruption = (changes: GameCharacterCorruptionUpdate) => this.game_character_corruptionOps.update(changes);
    deleteGameCharacterCorruption = (id: number) => this.game_character_corruptionOps.delete(id);
    getGameCharacterCorruptionsByIds = (ids: number[]) => this.game_character_corruptionOps.getByIds(ids);
    watchGameCharacterCorruption = (onChange: (type: 'insert' | 'update' | 'delete', row: GameCharacterCorruption, oldRow?: GameCharacterCorruption) => void) => {
        const unsubscribe = this.game_character_corruptionOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchGameCharacterCorruption = () => this.game_character_corruptionOps.stopWatch();
    // GameCharacterCorruptionManifestation operations
    getAllGameCharacterCorruptionManifestation = () => this.game_character_corruption_manifestationOps.getAll();
    getGameCharacterCorruptionManifestationById = (id: number) => this.game_character_corruption_manifestationOps.getById(id);
    createGameCharacterCorruptionManifestation = (newItem: GameCharacterCorruptionManifestationInsert) => this.game_character_corruption_manifestationOps.create(newItem);
    updateGameCharacterCorruptionManifestation = (changes: GameCharacterCorruptionManifestationUpdate) => this.game_character_corruption_manifestationOps.update(changes);
    deleteGameCharacterCorruptionManifestation = (id: number) => this.game_character_corruption_manifestationOps.delete(id);
    getGameCharacterCorruptionManifestationsByIds = (ids: number[]) => this.game_character_corruption_manifestationOps.getByIds(ids);
    watchGameCharacterCorruptionManifestation = (onChange: (type: 'insert' | 'update' | 'delete', row: GameCharacterCorruptionManifestation, oldRow?: GameCharacterCorruptionManifestation) => void) => {
        const unsubscribe = this.game_character_corruption_manifestationOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchGameCharacterCorruptionManifestation = () => this.game_character_corruption_manifestationOps.stopWatch();
    // GameCharacterDiscovery operations
    getAllGameCharacterDiscovery = () => this.game_character_discoveryOps.getAll();
    getGameCharacterDiscoveryById = (id: number) => this.game_character_discoveryOps.getById(id);
    createGameCharacterDiscovery = (newItem: GameCharacterDiscoveryInsert) => this.game_character_discoveryOps.create(newItem);
    updateGameCharacterDiscovery = (changes: GameCharacterDiscoveryUpdate) => this.game_character_discoveryOps.update(changes);
    deleteGameCharacterDiscovery = (id: number) => this.game_character_discoveryOps.delete(id);
    getGameCharacterDiscoverysByIds = (ids: number[]) => this.game_character_discoveryOps.getByIds(ids);
    watchGameCharacterDiscovery = (onChange: (type: 'insert' | 'update' | 'delete', row: GameCharacterDiscovery, oldRow?: GameCharacterDiscovery) => void) => {
        const unsubscribe = this.game_character_discoveryOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchGameCharacterDiscovery = () => this.game_character_discoveryOps.stopWatch();
    // GameCharacterEquipment operations
    getAllGameCharacterEquipment = () => this.game_character_equipmentOps.getAll();
    getGameCharacterEquipmentById = (id: number) => this.game_character_equipmentOps.getById(id);
    createGameCharacterEquipment = (newItem: GameCharacterEquipmentInsert) => this.game_character_equipmentOps.create(newItem);
    updateGameCharacterEquipment = (changes: GameCharacterEquipmentUpdate) => this.game_character_equipmentOps.update(changes);
    deleteGameCharacterEquipment = (id: number) => this.game_character_equipmentOps.delete(id);
    getGameCharacterEquipmentsByIds = (ids: number[]) => this.game_character_equipmentOps.getByIds(ids);
    watchGameCharacterEquipment = (onChange: (type: 'insert' | 'update' | 'delete', row: GameCharacterEquipment, oldRow?: GameCharacterEquipment) => void) => {
        const unsubscribe = this.game_character_equipmentOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchGameCharacterEquipment = () => this.game_character_equipmentOps.stopWatch();
    // GameCharacterFavoredClassBonus operations
    getAllGameCharacterFavoredClassBonus = () => this.game_character_favored_class_bonusOps.getAll();
    getGameCharacterFavoredClassBonusById = (id: number) => this.game_character_favored_class_bonusOps.getById(id);
    createGameCharacterFavoredClassBonus = (newItem: GameCharacterFavoredClassBonusInsert) => this.game_character_favored_class_bonusOps.create(newItem);
    updateGameCharacterFavoredClassBonus = (changes: GameCharacterFavoredClassBonusUpdate) => this.game_character_favored_class_bonusOps.update(changes);
    deleteGameCharacterFavoredClassBonus = (id: number) => this.game_character_favored_class_bonusOps.delete(id);
    getGameCharacterFavoredClassBonussByIds = (ids: number[]) => this.game_character_favored_class_bonusOps.getByIds(ids);
    watchGameCharacterFavoredClassBonus = (onChange: (type: 'insert' | 'update' | 'delete', row: GameCharacterFavoredClassBonus, oldRow?: GameCharacterFavoredClassBonus) => void) => {
        const unsubscribe = this.game_character_favored_class_bonusOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchGameCharacterFavoredClassBonus = () => this.game_character_favored_class_bonusOps.stopWatch();
    // GameCharacterFeat operations
    getAllGameCharacterFeat = () => this.game_character_featOps.getAll();
    getGameCharacterFeatById = (id: number) => this.game_character_featOps.getById(id);
    createGameCharacterFeat = (newItem: GameCharacterFeatInsert) => this.game_character_featOps.create(newItem);
    updateGameCharacterFeat = (changes: GameCharacterFeatUpdate) => this.game_character_featOps.update(changes);
    deleteGameCharacterFeat = (id: number) => this.game_character_featOps.delete(id);
    getGameCharacterFeatsByIds = (ids: number[]) => this.game_character_featOps.getByIds(ids);
    watchGameCharacterFeat = (onChange: (type: 'insert' | 'update' | 'delete', row: GameCharacterFeat, oldRow?: GameCharacterFeat) => void) => {
        const unsubscribe = this.game_character_featOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchGameCharacterFeat = () => this.game_character_featOps.stopWatch();
    // GameCharacterSkillRank operations
    getAllGameCharacterSkillRank = () => this.game_character_skill_rankOps.getAll();
    getGameCharacterSkillRankById = (id: number) => this.game_character_skill_rankOps.getById(id);
    createGameCharacterSkillRank = (newItem: GameCharacterSkillRankInsert) => this.game_character_skill_rankOps.create(newItem);
    updateGameCharacterSkillRank = (changes: GameCharacterSkillRankUpdate) => this.game_character_skill_rankOps.update(changes);
    deleteGameCharacterSkillRank = (id: number) => this.game_character_skill_rankOps.delete(id);
    getGameCharacterSkillRanksByIds = (ids: number[]) => this.game_character_skill_rankOps.getByIds(ids);
    watchGameCharacterSkillRank = (onChange: (type: 'insert' | 'update' | 'delete', row: GameCharacterSkillRank, oldRow?: GameCharacterSkillRank) => void) => {
        const unsubscribe = this.game_character_skill_rankOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchGameCharacterSkillRank = () => this.game_character_skill_rankOps.stopWatch();
    // GameCharacterSpell operations
    getAllGameCharacterSpell = () => this.game_character_spellOps.getAll();
    getGameCharacterSpellById = (id: number) => this.game_character_spellOps.getById(id);
    createGameCharacterSpell = (newItem: GameCharacterSpellInsert) => this.game_character_spellOps.create(newItem);
    updateGameCharacterSpell = (changes: GameCharacterSpellUpdate) => this.game_character_spellOps.update(changes);
    deleteGameCharacterSpell = (id: number) => this.game_character_spellOps.delete(id);
    getGameCharacterSpellsByIds = (ids: number[]) => this.game_character_spellOps.getByIds(ids);
    watchGameCharacterSpell = (onChange: (type: 'insert' | 'update' | 'delete', row: GameCharacterSpell, oldRow?: GameCharacterSpell) => void) => {
        const unsubscribe = this.game_character_spellOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchGameCharacterSpell = () => this.game_character_spellOps.stopWatch();
    // GameCharacterTrait operations
    getAllGameCharacterTrait = () => this.game_character_traitOps.getAll();
    getGameCharacterTraitById = (id: number) => this.game_character_traitOps.getById(id);
    createGameCharacterTrait = (newItem: GameCharacterTraitInsert) => this.game_character_traitOps.create(newItem);
    updateGameCharacterTrait = (changes: GameCharacterTraitUpdate) => this.game_character_traitOps.update(changes);
    deleteGameCharacterTrait = (id: number) => this.game_character_traitOps.delete(id);
    getGameCharacterTraitsByIds = (ids: number[]) => this.game_character_traitOps.getByIds(ids);
    watchGameCharacterTrait = (onChange: (type: 'insert' | 'update' | 'delete', row: GameCharacterTrait, oldRow?: GameCharacterTrait) => void) => {
        const unsubscribe = this.game_character_traitOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchGameCharacterTrait = () => this.game_character_traitOps.stopWatch();
    // GameCharacterWeapon operations
    getAllGameCharacterWeapon = () => this.game_character_weaponOps.getAll();
    getGameCharacterWeaponById = (id: number) => this.game_character_weaponOps.getById(id);
    createGameCharacterWeapon = (newItem: GameCharacterWeaponInsert) => this.game_character_weaponOps.create(newItem);
    updateGameCharacterWeapon = (changes: GameCharacterWeaponUpdate) => this.game_character_weaponOps.update(changes);
    deleteGameCharacterWeapon = (id: number) => this.game_character_weaponOps.delete(id);
    getGameCharacterWeaponsByIds = (ids: number[]) => this.game_character_weaponOps.getByIds(ids);
    watchGameCharacterWeapon = (onChange: (type: 'insert' | 'update' | 'delete', row: GameCharacterWeapon, oldRow?: GameCharacterWeapon) => void) => {
        const unsubscribe = this.game_character_weaponOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchGameCharacterWeapon = () => this.game_character_weaponOps.stopWatch();
    // GameCharacterWildTalent operations
    getAllGameCharacterWildTalent = () => this.game_character_wild_talentOps.getAll();
    getGameCharacterWildTalentById = (id: number) => this.game_character_wild_talentOps.getById(id);
    createGameCharacterWildTalent = (newItem: GameCharacterWildTalentInsert) => this.game_character_wild_talentOps.create(newItem);
    updateGameCharacterWildTalent = (changes: GameCharacterWildTalentUpdate) => this.game_character_wild_talentOps.update(changes);
    deleteGameCharacterWildTalent = (id: number) => this.game_character_wild_talentOps.delete(id);
    getGameCharacterWildTalentsByIds = (ids: number[]) => this.game_character_wild_talentOps.getByIds(ids);
    watchGameCharacterWildTalent = (onChange: (type: 'insert' | 'update' | 'delete', row: GameCharacterWildTalent, oldRow?: GameCharacterWildTalent) => void) => {
        const unsubscribe = this.game_character_wild_talentOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchGameCharacterWildTalent = () => this.game_character_wild_talentOps.stopWatch();
    // LegendaryGiftType operations
    getAllLegendaryGiftType = () => this.legendary_gift_typeOps.getAll();
    getLegendaryGiftTypeById = (id: number) => this.legendary_gift_typeOps.getById(id);
    createLegendaryGiftType = (newItem: LegendaryGiftTypeInsert) => this.legendary_gift_typeOps.create(newItem);
    updateLegendaryGiftType = (changes: LegendaryGiftTypeUpdate) => this.legendary_gift_typeOps.update(changes);
    deleteLegendaryGiftType = (id: number) => this.legendary_gift_typeOps.delete(id);
    getLegendaryGiftTypesByIds = (ids: number[]) => this.legendary_gift_typeOps.getByIds(ids);
    watchLegendaryGiftType = (onChange: (type: 'insert' | 'update' | 'delete', row: LegendaryGiftType, oldRow?: LegendaryGiftType) => void) => {
        const unsubscribe = this.legendary_gift_typeOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchLegendaryGiftType = () => this.legendary_gift_typeOps.stopWatch();
    // MonkUnchainedKiPower operations
    getAllMonkUnchainedKiPower = () => this.monk_unchained_ki_powerOps.getAll();
    getMonkUnchainedKiPowerById = (id: number) => this.monk_unchained_ki_powerOps.getById(id);
    createMonkUnchainedKiPower = (newItem: MonkUnchainedKiPowerInsert) => this.monk_unchained_ki_powerOps.create(newItem);
    updateMonkUnchainedKiPower = (changes: MonkUnchainedKiPowerUpdate) => this.monk_unchained_ki_powerOps.update(changes);
    deleteMonkUnchainedKiPower = (id: number) => this.monk_unchained_ki_powerOps.delete(id);
    getMonkUnchainedKiPowersByIds = (ids: number[]) => this.monk_unchained_ki_powerOps.getByIds(ids);
    watchMonkUnchainedKiPower = (onChange: (type: 'insert' | 'update' | 'delete', row: MonkUnchainedKiPower, oldRow?: MonkUnchainedKiPower) => void) => {
        const unsubscribe = this.monk_unchained_ki_powerOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchMonkUnchainedKiPower = () => this.monk_unchained_ki_powerOps.stopWatch();
    // PrerequisiteFulfillment operations
    getAllPrerequisiteFulfillment = () => this.prerequisite_fulfillmentOps.getAll();
    getPrerequisiteFulfillmentById = (id: number) => this.prerequisite_fulfillmentOps.getById(id);
    createPrerequisiteFulfillment = (newItem: PrerequisiteFulfillmentInsert) => this.prerequisite_fulfillmentOps.create(newItem);
    updatePrerequisiteFulfillment = (changes: PrerequisiteFulfillmentUpdate) => this.prerequisite_fulfillmentOps.update(changes);
    deletePrerequisiteFulfillment = (id: number) => this.prerequisite_fulfillmentOps.delete(id);
    getPrerequisiteFulfillmentsByIds = (ids: number[]) => this.prerequisite_fulfillmentOps.getByIds(ids);
    watchPrerequisiteFulfillment = (onChange: (type: 'insert' | 'update' | 'delete', row: PrerequisiteFulfillment, oldRow?: PrerequisiteFulfillment) => void) => {
        const unsubscribe = this.prerequisite_fulfillmentOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchPrerequisiteFulfillment = () => this.prerequisite_fulfillmentOps.stopWatch();
    // PrerequisiteRequirement operations
    getAllPrerequisiteRequirement = () => this.prerequisite_requirementOps.getAll();
    getPrerequisiteRequirementById = (id: number) => this.prerequisite_requirementOps.getById(id);
    createPrerequisiteRequirement = (newItem: PrerequisiteRequirementInsert) => this.prerequisite_requirementOps.create(newItem);
    updatePrerequisiteRequirement = (changes: PrerequisiteRequirementUpdate) => this.prerequisite_requirementOps.update(changes);
    deletePrerequisiteRequirement = (id: number) => this.prerequisite_requirementOps.delete(id);
    getPrerequisiteRequirementsByIds = (ids: number[]) => this.prerequisite_requirementOps.getByIds(ids);
    watchPrerequisiteRequirement = (onChange: (type: 'insert' | 'update' | 'delete', row: PrerequisiteRequirement, oldRow?: PrerequisiteRequirement) => void) => {
        const unsubscribe = this.prerequisite_requirementOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchPrerequisiteRequirement = () => this.prerequisite_requirementOps.stopWatch();
    // PrerequisiteRequirementFulfillmentMapping operations
    getAllPrerequisiteRequirementFulfillmentMapping = () => this.prerequisite_requirement_fulfillment_mappingOps.getAll();
    getPrerequisiteRequirementFulfillmentMappingById = (id: number) => this.prerequisite_requirement_fulfillment_mappingOps.getById(id);
    createPrerequisiteRequirementFulfillmentMapping = (newItem: PrerequisiteRequirementFulfillmentMappingInsert) => this.prerequisite_requirement_fulfillment_mappingOps.create(newItem);
    updatePrerequisiteRequirementFulfillmentMapping = (changes: PrerequisiteRequirementFulfillmentMappingUpdate) => this.prerequisite_requirement_fulfillment_mappingOps.update(changes);
    deletePrerequisiteRequirementFulfillmentMapping = (id: number) => this.prerequisite_requirement_fulfillment_mappingOps.delete(id);
    getPrerequisiteRequirementFulfillmentMappingsByIds = (ids: number[]) => this.prerequisite_requirement_fulfillment_mappingOps.getByIds(ids);
    watchPrerequisiteRequirementFulfillmentMapping = (onChange: (type: 'insert' | 'update' | 'delete', row: PrerequisiteRequirementFulfillmentMapping, oldRow?: PrerequisiteRequirementFulfillmentMapping) => void) => {
        const unsubscribe = this.prerequisite_requirement_fulfillment_mappingOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchPrerequisiteRequirementFulfillmentMapping = () => this.prerequisite_requirement_fulfillment_mappingOps.stopWatch();
    // PrerequisiteRequirementType operations
    getAllPrerequisiteRequirementType = () => this.prerequisite_requirement_typeOps.getAll();
    getPrerequisiteRequirementTypeById = (id: number) => this.prerequisite_requirement_typeOps.getById(id);
    createPrerequisiteRequirementType = (newItem: PrerequisiteRequirementTypeInsert) => this.prerequisite_requirement_typeOps.create(newItem);
    updatePrerequisiteRequirementType = (changes: PrerequisiteRequirementTypeUpdate) => this.prerequisite_requirement_typeOps.update(changes);
    deletePrerequisiteRequirementType = (id: number) => this.prerequisite_requirement_typeOps.delete(id);
    getPrerequisiteRequirementTypesByIds = (ids: number[]) => this.prerequisite_requirement_typeOps.getByIds(ids);
    watchPrerequisiteRequirementType = (onChange: (type: 'insert' | 'update' | 'delete', row: PrerequisiteRequirementType, oldRow?: PrerequisiteRequirementType) => void) => {
        const unsubscribe = this.prerequisite_requirement_typeOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchPrerequisiteRequirementType = () => this.prerequisite_requirement_typeOps.stopWatch();
    // QinggongMonkKiPower operations
    getAllQinggongMonkKiPower = () => this.qinggong_monk_ki_powerOps.getAll();
    getQinggongMonkKiPowerById = (id: number) => this.qinggong_monk_ki_powerOps.getById(id);
    createQinggongMonkKiPower = (newItem: QinggongMonkKiPowerInsert) => this.qinggong_monk_ki_powerOps.create(newItem);
    updateQinggongMonkKiPower = (changes: QinggongMonkKiPowerUpdate) => this.qinggong_monk_ki_powerOps.update(changes);
    deleteQinggongMonkKiPower = (id: number) => this.qinggong_monk_ki_powerOps.delete(id);
    getQinggongMonkKiPowersByIds = (ids: number[]) => this.qinggong_monk_ki_powerOps.getByIds(ids);
    watchQinggongMonkKiPower = (onChange: (type: 'insert' | 'update' | 'delete', row: QinggongMonkKiPower, oldRow?: QinggongMonkKiPower) => void) => {
        const unsubscribe = this.qinggong_monk_ki_powerOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchQinggongMonkKiPower = () => this.qinggong_monk_ki_powerOps.stopWatch();
    // QinggongMonkKiPowerType operations
    getAllQinggongMonkKiPowerType = () => this.qinggong_monk_ki_power_typeOps.getAll();
    getQinggongMonkKiPowerTypeById = (id: number) => this.qinggong_monk_ki_power_typeOps.getById(id);
    createQinggongMonkKiPowerType = (newItem: QinggongMonkKiPowerTypeInsert) => this.qinggong_monk_ki_power_typeOps.create(newItem);
    updateQinggongMonkKiPowerType = (changes: QinggongMonkKiPowerTypeUpdate) => this.qinggong_monk_ki_power_typeOps.update(changes);
    deleteQinggongMonkKiPowerType = (id: number) => this.qinggong_monk_ki_power_typeOps.delete(id);
    getQinggongMonkKiPowerTypesByIds = (ids: number[]) => this.qinggong_monk_ki_power_typeOps.getByIds(ids);
    watchQinggongMonkKiPowerType = (onChange: (type: 'insert' | 'update' | 'delete', row: QinggongMonkKiPowerType, oldRow?: QinggongMonkKiPowerType) => void) => {
        const unsubscribe = this.qinggong_monk_ki_power_typeOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchQinggongMonkKiPowerType = () => this.qinggong_monk_ki_power_typeOps.stopWatch();
    // QualificationType operations
    getAllQualificationType = () => this.qualification_typeOps.getAll();
    getQualificationTypeById = (id: number) => this.qualification_typeOps.getById(id);
    createQualificationType = (newItem: QualificationTypeInsert) => this.qualification_typeOps.create(newItem);
    updateQualificationType = (changes: QualificationTypeUpdate) => this.qualification_typeOps.update(changes);
    deleteQualificationType = (id: number) => this.qualification_typeOps.delete(id);
    getQualificationTypesByIds = (ids: number[]) => this.qualification_typeOps.getByIds(ids);
    watchQualificationType = (onChange: (type: 'insert' | 'update' | 'delete', row: QualificationType, oldRow?: QualificationType) => void) => {
        const unsubscribe = this.qualification_typeOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchQualificationType = () => this.qualification_typeOps.stopWatch();
    // Rule operations
    getAllRule = () => this.ruleOps.getAll();
    getRuleById = (id: number) => this.ruleOps.getById(id);
    createRule = (newItem: RuleInsert) => this.ruleOps.create(newItem);
    updateRule = (changes: RuleUpdate) => this.ruleOps.update(changes);
    deleteRule = (id: number) => this.ruleOps.delete(id);
    getRulesByIds = (ids: number[]) => this.ruleOps.getByIds(ids);
    watchRule = (onChange: (type: 'insert' | 'update' | 'delete', row: Rule, oldRow?: Rule) => void) => {
        const unsubscribe = this.ruleOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchRule = () => this.ruleOps.stopWatch();
    // Skill operations
    getAllSkill = () => this.skillOps.getAll();
    getSkillById = (id: number) => this.skillOps.getById(id);
    createSkill = (newItem: SkillInsert) => this.skillOps.create(newItem);
    updateSkill = (changes: SkillUpdate) => this.skillOps.update(changes);
    deleteSkill = (id: number) => this.skillOps.delete(id);
    getSkillsByIds = (ids: number[]) => this.skillOps.getByIds(ids);
    watchSkill = (onChange: (type: 'insert' | 'update' | 'delete', row: Skill, oldRow?: Skill) => void) => {
        const unsubscribe = this.skillOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchSkill = () => this.skillOps.stopWatch();
    // SorcererBloodline operations
    getAllSorcererBloodline = () => this.sorcerer_bloodlineOps.getAll();
    getSorcererBloodlineById = (id: number) => this.sorcerer_bloodlineOps.getById(id);
    createSorcererBloodline = (newItem: SorcererBloodlineInsert) => this.sorcerer_bloodlineOps.create(newItem);
    updateSorcererBloodline = (changes: SorcererBloodlineUpdate) => this.sorcerer_bloodlineOps.update(changes);
    deleteSorcererBloodline = (id: number) => this.sorcerer_bloodlineOps.delete(id);
    getSorcererBloodlinesByIds = (ids: number[]) => this.sorcerer_bloodlineOps.getByIds(ids);
    watchSorcererBloodline = (onChange: (type: 'insert' | 'update' | 'delete', row: SorcererBloodline, oldRow?: SorcererBloodline) => void) => {
        const unsubscribe = this.sorcerer_bloodlineOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchSorcererBloodline = () => this.sorcerer_bloodlineOps.stopWatch();
    // Spell operations
    getAllSpell = () => this.spellOps.getAll();
    getSpellById = (id: number) => this.spellOps.getById(id);
    createSpell = (newItem: SpellInsert) => this.spellOps.create(newItem);
    updateSpell = (changes: SpellUpdate) => this.spellOps.update(changes);
    deleteSpell = (id: number) => this.spellOps.delete(id);
    getSpellsByIds = (ids: number[]) => this.spellOps.getByIds(ids);
    watchSpell = (onChange: (type: 'insert' | 'update' | 'delete', row: Spell, oldRow?: Spell) => void) => {
        const unsubscribe = this.spellOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchSpell = () => this.spellOps.stopWatch();
    // SpellCastingTime operations
    getAllSpellCastingTime = () => this.spell_casting_timeOps.getAll();
    getSpellCastingTimeById = (id: number) => this.spell_casting_timeOps.getById(id);
    createSpellCastingTime = (newItem: SpellCastingTimeInsert) => this.spell_casting_timeOps.create(newItem);
    updateSpellCastingTime = (changes: SpellCastingTimeUpdate) => this.spell_casting_timeOps.update(changes);
    deleteSpellCastingTime = (id: number) => this.spell_casting_timeOps.delete(id);
    getSpellCastingTimesByIds = (ids: number[]) => this.spell_casting_timeOps.getByIds(ids);
    watchSpellCastingTime = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellCastingTime, oldRow?: SpellCastingTime) => void) => {
        const unsubscribe = this.spell_casting_timeOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchSpellCastingTime = () => this.spell_casting_timeOps.stopWatch();
    // SpellCastingTimeMapping operations
    getAllSpellCastingTimeMapping = () => this.spell_casting_time_mappingOps.getAll();
    getSpellCastingTimeMappingById = (id: number) => this.spell_casting_time_mappingOps.getById(id);
    createSpellCastingTimeMapping = (newItem: SpellCastingTimeMappingInsert) => this.spell_casting_time_mappingOps.create(newItem);
    updateSpellCastingTimeMapping = (changes: SpellCastingTimeMappingUpdate) => this.spell_casting_time_mappingOps.update(changes);
    deleteSpellCastingTimeMapping = (id: number) => this.spell_casting_time_mappingOps.delete(id);
    getSpellCastingTimeMappingsByIds = (ids: number[]) => this.spell_casting_time_mappingOps.getByIds(ids);
    watchSpellCastingTimeMapping = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellCastingTimeMapping, oldRow?: SpellCastingTimeMapping) => void) => {
        const unsubscribe = this.spell_casting_time_mappingOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchSpellCastingTimeMapping = () => this.spell_casting_time_mappingOps.stopWatch();
    // SpellComponent operations
    getAllSpellComponent = () => this.spell_componentOps.getAll();
    getSpellComponentById = (id: number) => this.spell_componentOps.getById(id);
    createSpellComponent = (newItem: SpellComponentInsert) => this.spell_componentOps.create(newItem);
    updateSpellComponent = (changes: SpellComponentUpdate) => this.spell_componentOps.update(changes);
    deleteSpellComponent = (id: number) => this.spell_componentOps.delete(id);
    getSpellComponentsByIds = (ids: number[]) => this.spell_componentOps.getByIds(ids);
    watchSpellComponent = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellComponent, oldRow?: SpellComponent) => void) => {
        const unsubscribe = this.spell_componentOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchSpellComponent = () => this.spell_componentOps.stopWatch();
    // SpellComponentMapping operations
    getAllSpellComponentMapping = () => this.spell_component_mappingOps.getAll();
    getSpellComponentMappingById = (id: number) => this.spell_component_mappingOps.getById(id);
    createSpellComponentMapping = (newItem: SpellComponentMappingInsert) => this.spell_component_mappingOps.create(newItem);
    updateSpellComponentMapping = (changes: SpellComponentMappingUpdate) => this.spell_component_mappingOps.update(changes);
    deleteSpellComponentMapping = (id: number) => this.spell_component_mappingOps.delete(id);
    getSpellComponentMappingsByIds = (ids: number[]) => this.spell_component_mappingOps.getByIds(ids);
    watchSpellComponentMapping = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellComponentMapping, oldRow?: SpellComponentMapping) => void) => {
        const unsubscribe = this.spell_component_mappingOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchSpellComponentMapping = () => this.spell_component_mappingOps.stopWatch();
    // SpellComponentType operations
    getAllSpellComponentType = () => this.spell_component_typeOps.getAll();
    getSpellComponentTypeById = (id: number) => this.spell_component_typeOps.getById(id);
    createSpellComponentType = (newItem: SpellComponentTypeInsert) => this.spell_component_typeOps.create(newItem);
    updateSpellComponentType = (changes: SpellComponentTypeUpdate) => this.spell_component_typeOps.update(changes);
    deleteSpellComponentType = (id: number) => this.spell_component_typeOps.delete(id);
    getSpellComponentTypesByIds = (ids: number[]) => this.spell_component_typeOps.getByIds(ids);
    watchSpellComponentType = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellComponentType, oldRow?: SpellComponentType) => void) => {
        const unsubscribe = this.spell_component_typeOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchSpellComponentType = () => this.spell_component_typeOps.stopWatch();
    // SpellConsumable operations
    getAllSpellConsumable = () => this.spell_consumableOps.getAll();
    getSpellConsumableById = (id: number) => this.spell_consumableOps.getById(id);
    createSpellConsumable = (newItem: SpellConsumableInsert) => this.spell_consumableOps.create(newItem);
    updateSpellConsumable = (changes: SpellConsumableUpdate) => this.spell_consumableOps.update(changes);
    deleteSpellConsumable = (id: number) => this.spell_consumableOps.delete(id);
    getSpellConsumablesByIds = (ids: number[]) => this.spell_consumableOps.getByIds(ids);
    watchSpellConsumable = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellConsumable, oldRow?: SpellConsumable) => void) => {
        const unsubscribe = this.spell_consumableOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchSpellConsumable = () => this.spell_consumableOps.stopWatch();
    // SpellDuration operations
    getAllSpellDuration = () => this.spell_durationOps.getAll();
    getSpellDurationById = (id: number) => this.spell_durationOps.getById(id);
    createSpellDuration = (newItem: SpellDurationInsert) => this.spell_durationOps.create(newItem);
    updateSpellDuration = (changes: SpellDurationUpdate) => this.spell_durationOps.update(changes);
    deleteSpellDuration = (id: number) => this.spell_durationOps.delete(id);
    getSpellDurationsByIds = (ids: number[]) => this.spell_durationOps.getByIds(ids);
    watchSpellDuration = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellDuration, oldRow?: SpellDuration) => void) => {
        const unsubscribe = this.spell_durationOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchSpellDuration = () => this.spell_durationOps.stopWatch();
    // SpellDurationMapping operations
    getAllSpellDurationMapping = () => this.spell_duration_mappingOps.getAll();
    getSpellDurationMappingById = (id: number) => this.spell_duration_mappingOps.getById(id);
    createSpellDurationMapping = (newItem: SpellDurationMappingInsert) => this.spell_duration_mappingOps.create(newItem);
    updateSpellDurationMapping = (changes: SpellDurationMappingUpdate) => this.spell_duration_mappingOps.update(changes);
    deleteSpellDurationMapping = (id: number) => this.spell_duration_mappingOps.delete(id);
    getSpellDurationMappingsByIds = (ids: number[]) => this.spell_duration_mappingOps.getByIds(ids);
    watchSpellDurationMapping = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellDurationMapping, oldRow?: SpellDurationMapping) => void) => {
        const unsubscribe = this.spell_duration_mappingOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchSpellDurationMapping = () => this.spell_duration_mappingOps.stopWatch();
    // SpellList operations
    getAllSpellList = () => this.spell_listOps.getAll();
    getSpellListById = (id: number) => this.spell_listOps.getById(id);
    createSpellList = (newItem: SpellListInsert) => this.spell_listOps.create(newItem);
    updateSpellList = (changes: SpellListUpdate) => this.spell_listOps.update(changes);
    deleteSpellList = (id: number) => this.spell_listOps.delete(id);
    getSpellListsByIds = (ids: number[]) => this.spell_listOps.getByIds(ids);
    watchSpellList = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellList, oldRow?: SpellList) => void) => {
        const unsubscribe = this.spell_listOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchSpellList = () => this.spell_listOps.stopWatch();
    // SpellListClassFeatureBenefitMapping operations
    getAllSpellListClassFeatureBenefitMapping = () => this.spell_list_class_feature_benefit_mappingOps.getAll();
    getSpellListClassFeatureBenefitMappingById = (id: number) => this.spell_list_class_feature_benefit_mappingOps.getById(id);
    createSpellListClassFeatureBenefitMapping = (newItem: SpellListClassFeatureBenefitMappingInsert) => this.spell_list_class_feature_benefit_mappingOps.create(newItem);
    updateSpellListClassFeatureBenefitMapping = (changes: SpellListClassFeatureBenefitMappingUpdate) => this.spell_list_class_feature_benefit_mappingOps.update(changes);
    deleteSpellListClassFeatureBenefitMapping = (id: number) => this.spell_list_class_feature_benefit_mappingOps.delete(id);
    getSpellListClassFeatureBenefitMappingsByIds = (ids: number[]) => this.spell_list_class_feature_benefit_mappingOps.getByIds(ids);
    watchSpellListClassFeatureBenefitMapping = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellListClassFeatureBenefitMapping, oldRow?: SpellListClassFeatureBenefitMapping) => void) => {
        const unsubscribe = this.spell_list_class_feature_benefit_mappingOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchSpellListClassFeatureBenefitMapping = () => this.spell_list_class_feature_benefit_mappingOps.stopWatch();
    // SpellListFeatMapping operations
    getAllSpellListFeatMapping = () => this.spell_list_feat_mappingOps.getAll();
    getSpellListFeatMappingById = (id: number) => this.spell_list_feat_mappingOps.getById(id);
    createSpellListFeatMapping = (newItem: SpellListFeatMappingInsert) => this.spell_list_feat_mappingOps.create(newItem);
    updateSpellListFeatMapping = (changes: SpellListFeatMappingUpdate) => this.spell_list_feat_mappingOps.update(changes);
    deleteSpellListFeatMapping = (id: number) => this.spell_list_feat_mappingOps.delete(id);
    getSpellListFeatMappingsByIds = (ids: number[]) => this.spell_list_feat_mappingOps.getByIds(ids);
    watchSpellListFeatMapping = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellListFeatMapping, oldRow?: SpellListFeatMapping) => void) => {
        const unsubscribe = this.spell_list_feat_mappingOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchSpellListFeatMapping = () => this.spell_list_feat_mappingOps.stopWatch();
    // SpellListSpellMapping operations
    getAllSpellListSpellMapping = () => this.spell_list_spell_mappingOps.getAll();
    getSpellListSpellMappingById = (id: number) => this.spell_list_spell_mappingOps.getById(id);
    createSpellListSpellMapping = (newItem: SpellListSpellMappingInsert) => this.spell_list_spell_mappingOps.create(newItem);
    updateSpellListSpellMapping = (changes: SpellListSpellMappingUpdate) => this.spell_list_spell_mappingOps.update(changes);
    deleteSpellListSpellMapping = (id: number) => this.spell_list_spell_mappingOps.delete(id);
    getSpellListSpellMappingsByIds = (ids: number[]) => this.spell_list_spell_mappingOps.getByIds(ids);
    watchSpellListSpellMapping = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellListSpellMapping, oldRow?: SpellListSpellMapping) => void) => {
        const unsubscribe = this.spell_list_spell_mappingOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchSpellListSpellMapping = () => this.spell_list_spell_mappingOps.stopWatch();
    // SpellRange operations
    getAllSpellRange = () => this.spell_rangeOps.getAll();
    getSpellRangeById = (id: number) => this.spell_rangeOps.getById(id);
    createSpellRange = (newItem: SpellRangeInsert) => this.spell_rangeOps.create(newItem);
    updateSpellRange = (changes: SpellRangeUpdate) => this.spell_rangeOps.update(changes);
    deleteSpellRange = (id: number) => this.spell_rangeOps.delete(id);
    getSpellRangesByIds = (ids: number[]) => this.spell_rangeOps.getByIds(ids);
    watchSpellRange = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellRange, oldRow?: SpellRange) => void) => {
        const unsubscribe = this.spell_rangeOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchSpellRange = () => this.spell_rangeOps.stopWatch();
    // SpellRangeMapping operations
    getAllSpellRangeMapping = () => this.spell_range_mappingOps.getAll();
    getSpellRangeMappingById = (id: number) => this.spell_range_mappingOps.getById(id);
    createSpellRangeMapping = (newItem: SpellRangeMappingInsert) => this.spell_range_mappingOps.create(newItem);
    updateSpellRangeMapping = (changes: SpellRangeMappingUpdate) => this.spell_range_mappingOps.update(changes);
    deleteSpellRangeMapping = (id: number) => this.spell_range_mappingOps.delete(id);
    getSpellRangeMappingsByIds = (ids: number[]) => this.spell_range_mappingOps.getByIds(ids);
    watchSpellRangeMapping = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellRangeMapping, oldRow?: SpellRangeMapping) => void) => {
        const unsubscribe = this.spell_range_mappingOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchSpellRangeMapping = () => this.spell_range_mappingOps.stopWatch();
    // SpellSchool operations
    getAllSpellSchool = () => this.spell_schoolOps.getAll();
    getSpellSchoolById = (id: number) => this.spell_schoolOps.getById(id);
    createSpellSchool = (newItem: SpellSchoolInsert) => this.spell_schoolOps.create(newItem);
    updateSpellSchool = (changes: SpellSchoolUpdate) => this.spell_schoolOps.update(changes);
    deleteSpellSchool = (id: number) => this.spell_schoolOps.delete(id);
    getSpellSchoolsByIds = (ids: number[]) => this.spell_schoolOps.getByIds(ids);
    watchSpellSchool = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellSchool, oldRow?: SpellSchool) => void) => {
        const unsubscribe = this.spell_schoolOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchSpellSchool = () => this.spell_schoolOps.stopWatch();
    // SpellSchoolMapping operations
    getAllSpellSchoolMapping = () => this.spell_school_mappingOps.getAll();
    getSpellSchoolMappingById = (id: number) => this.spell_school_mappingOps.getById(id);
    createSpellSchoolMapping = (newItem: SpellSchoolMappingInsert) => this.spell_school_mappingOps.create(newItem);
    updateSpellSchoolMapping = (changes: SpellSchoolMappingUpdate) => this.spell_school_mappingOps.update(changes);
    deleteSpellSchoolMapping = (id: number) => this.spell_school_mappingOps.delete(id);
    getSpellSchoolMappingsByIds = (ids: number[]) => this.spell_school_mappingOps.getByIds(ids);
    watchSpellSchoolMapping = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellSchoolMapping, oldRow?: SpellSchoolMapping) => void) => {
        const unsubscribe = this.spell_school_mappingOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchSpellSchoolMapping = () => this.spell_school_mappingOps.stopWatch();
    // SpellSorcererBloodlineMapping operations
    getAllSpellSorcererBloodlineMapping = () => this.spell_sorcerer_bloodline_mappingOps.getAll();
    getSpellSorcererBloodlineMappingById = (id: number) => this.spell_sorcerer_bloodline_mappingOps.getById(id);
    createSpellSorcererBloodlineMapping = (newItem: SpellSorcererBloodlineMappingInsert) => this.spell_sorcerer_bloodline_mappingOps.create(newItem);
    updateSpellSorcererBloodlineMapping = (changes: SpellSorcererBloodlineMappingUpdate) => this.spell_sorcerer_bloodline_mappingOps.update(changes);
    deleteSpellSorcererBloodlineMapping = (id: number) => this.spell_sorcerer_bloodline_mappingOps.delete(id);
    getSpellSorcererBloodlineMappingsByIds = (ids: number[]) => this.spell_sorcerer_bloodline_mappingOps.getByIds(ids);
    watchSpellSorcererBloodlineMapping = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellSorcererBloodlineMapping, oldRow?: SpellSorcererBloodlineMapping) => void) => {
        const unsubscribe = this.spell_sorcerer_bloodline_mappingOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchSpellSorcererBloodlineMapping = () => this.spell_sorcerer_bloodline_mappingOps.stopWatch();
    // SpellSubdomainMapping operations
    getAllSpellSubdomainMapping = () => this.spell_subdomain_mappingOps.getAll();
    getSpellSubdomainMappingById = (id: number) => this.spell_subdomain_mappingOps.getById(id);
    createSpellSubdomainMapping = (newItem: SpellSubdomainMappingInsert) => this.spell_subdomain_mappingOps.create(newItem);
    updateSpellSubdomainMapping = (changes: SpellSubdomainMappingUpdate) => this.spell_subdomain_mappingOps.update(changes);
    deleteSpellSubdomainMapping = (id: number) => this.spell_subdomain_mappingOps.delete(id);
    getSpellSubdomainMappingsByIds = (ids: number[]) => this.spell_subdomain_mappingOps.getByIds(ids);
    watchSpellSubdomainMapping = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellSubdomainMapping, oldRow?: SpellSubdomainMapping) => void) => {
        const unsubscribe = this.spell_subdomain_mappingOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchSpellSubdomainMapping = () => this.spell_subdomain_mappingOps.stopWatch();
    // SpellTarget operations
    getAllSpellTarget = () => this.spell_targetOps.getAll();
    getSpellTargetById = (id: number) => this.spell_targetOps.getById(id);
    createSpellTarget = (newItem: SpellTargetInsert) => this.spell_targetOps.create(newItem);
    updateSpellTarget = (changes: SpellTargetUpdate) => this.spell_targetOps.update(changes);
    deleteSpellTarget = (id: number) => this.spell_targetOps.delete(id);
    getSpellTargetsByIds = (ids: number[]) => this.spell_targetOps.getByIds(ids);
    watchSpellTarget = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellTarget, oldRow?: SpellTarget) => void) => {
        const unsubscribe = this.spell_targetOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchSpellTarget = () => this.spell_targetOps.stopWatch();
    // SpellTargetMapping operations
    getAllSpellTargetMapping = () => this.spell_target_mappingOps.getAll();
    getSpellTargetMappingById = (id: number) => this.spell_target_mappingOps.getById(id);
    createSpellTargetMapping = (newItem: SpellTargetMappingInsert) => this.spell_target_mappingOps.create(newItem);
    updateSpellTargetMapping = (changes: SpellTargetMappingUpdate) => this.spell_target_mappingOps.update(changes);
    deleteSpellTargetMapping = (id: number) => this.spell_target_mappingOps.delete(id);
    getSpellTargetMappingsByIds = (ids: number[]) => this.spell_target_mappingOps.getByIds(ids);
    watchSpellTargetMapping = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellTargetMapping, oldRow?: SpellTargetMapping) => void) => {
        const unsubscribe = this.spell_target_mappingOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchSpellTargetMapping = () => this.spell_target_mappingOps.stopWatch();
    // SpellcastingClassFeature operations
    getAllSpellcastingClassFeature = () => this.spellcasting_class_featureOps.getAll();
    getSpellcastingClassFeatureById = (id: number) => this.spellcasting_class_featureOps.getById(id);
    createSpellcastingClassFeature = (newItem: SpellcastingClassFeatureInsert) => this.spellcasting_class_featureOps.create(newItem);
    updateSpellcastingClassFeature = (changes: SpellcastingClassFeatureUpdate) => this.spellcasting_class_featureOps.update(changes);
    deleteSpellcastingClassFeature = (id: number) => this.spellcasting_class_featureOps.delete(id);
    getSpellcastingClassFeaturesByIds = (ids: number[]) => this.spellcasting_class_featureOps.getByIds(ids);
    watchSpellcastingClassFeature = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellcastingClassFeature, oldRow?: SpellcastingClassFeature) => void) => {
        const unsubscribe = this.spellcasting_class_featureOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchSpellcastingClassFeature = () => this.spellcasting_class_featureOps.stopWatch();
    // SpellcastingPreparationType operations
    getAllSpellcastingPreparationType = () => this.spellcasting_preparation_typeOps.getAll();
    getSpellcastingPreparationTypeById = (id: number) => this.spellcasting_preparation_typeOps.getById(id);
    createSpellcastingPreparationType = (newItem: SpellcastingPreparationTypeInsert) => this.spellcasting_preparation_typeOps.create(newItem);
    updateSpellcastingPreparationType = (changes: SpellcastingPreparationTypeUpdate) => this.spellcasting_preparation_typeOps.update(changes);
    deleteSpellcastingPreparationType = (id: number) => this.spellcasting_preparation_typeOps.delete(id);
    getSpellcastingPreparationTypesByIds = (ids: number[]) => this.spellcasting_preparation_typeOps.getByIds(ids);
    watchSpellcastingPreparationType = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellcastingPreparationType, oldRow?: SpellcastingPreparationType) => void) => {
        const unsubscribe = this.spellcasting_preparation_typeOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchSpellcastingPreparationType = () => this.spellcasting_preparation_typeOps.stopWatch();
    // SpellcastingType operations
    getAllSpellcastingType = () => this.spellcasting_typeOps.getAll();
    getSpellcastingTypeById = (id: number) => this.spellcasting_typeOps.getById(id);
    createSpellcastingType = (newItem: SpellcastingTypeInsert) => this.spellcasting_typeOps.create(newItem);
    updateSpellcastingType = (changes: SpellcastingTypeUpdate) => this.spellcasting_typeOps.update(changes);
    deleteSpellcastingType = (id: number) => this.spellcasting_typeOps.delete(id);
    getSpellcastingTypesByIds = (ids: number[]) => this.spellcasting_typeOps.getByIds(ids);
    watchSpellcastingType = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellcastingType, oldRow?: SpellcastingType) => void) => {
        const unsubscribe = this.spellcasting_typeOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchSpellcastingType = () => this.spellcasting_typeOps.stopWatch();
    // Subdomain operations
    getAllSubdomain = () => this.subdomainOps.getAll();
    getSubdomainById = (id: number) => this.subdomainOps.getById(id);
    createSubdomain = (newItem: SubdomainInsert) => this.subdomainOps.create(newItem);
    updateSubdomain = (changes: SubdomainUpdate) => this.subdomainOps.update(changes);
    deleteSubdomain = (id: number) => this.subdomainOps.delete(id);
    getSubdomainsByIds = (ids: number[]) => this.subdomainOps.getByIds(ids);
    watchSubdomain = (onChange: (type: 'insert' | 'update' | 'delete', row: Subdomain, oldRow?: Subdomain) => void) => {
        const unsubscribe = this.subdomainOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchSubdomain = () => this.subdomainOps.stopWatch();
    // Trait operations
    getAllTrait = () => this.traitOps.getAll();
    getTraitById = (id: number) => this.traitOps.getById(id);
    createTrait = (newItem: TraitInsert) => this.traitOps.create(newItem);
    updateTrait = (changes: TraitUpdate) => this.traitOps.update(changes);
    deleteTrait = (id: number) => this.traitOps.delete(id);
    getTraitsByIds = (ids: number[]) => this.traitOps.getByIds(ids);
    watchTrait = (onChange: (type: 'insert' | 'update' | 'delete', row: Trait, oldRow?: Trait) => void) => {
        const unsubscribe = this.traitOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchTrait = () => this.traitOps.stopWatch();
    // Weapon operations
    getAllWeapon = () => this.weaponOps.getAll();
    getWeaponById = (id: number) => this.weaponOps.getById(id);
    createWeapon = (newItem: WeaponInsert) => this.weaponOps.create(newItem);
    updateWeapon = (changes: WeaponUpdate) => this.weaponOps.update(changes);
    deleteWeapon = (id: number) => this.weaponOps.delete(id);
    getWeaponsByIds = (ids: number[]) => this.weaponOps.getByIds(ids);
    watchWeapon = (onChange: (type: 'insert' | 'update' | 'delete', row: Weapon, oldRow?: Weapon) => void) => {
        const unsubscribe = this.weaponOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchWeapon = () => this.weaponOps.stopWatch();
    // WildTalent operations
    getAllWildTalent = () => this.wild_talentOps.getAll();
    getWildTalentById = (id: number) => this.wild_talentOps.getById(id);
    createWildTalent = (newItem: WildTalentInsert) => this.wild_talentOps.create(newItem);
    updateWildTalent = (changes: WildTalentUpdate) => this.wild_talentOps.update(changes);
    deleteWildTalent = (id: number) => this.wild_talentOps.delete(id);
    getWildTalentsByIds = (ids: number[]) => this.wild_talentOps.getByIds(ids);
    watchWildTalent = (onChange: (type: 'insert' | 'update' | 'delete', row: WildTalent, oldRow?: WildTalent) => void) => {
        const unsubscribe = this.wild_talentOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchWildTalent = () => this.wild_talentOps.stopWatch();
    // WildTalentType operations
    getAllWildTalentType = () => this.wild_talent_typeOps.getAll();
    getWildTalentTypeById = (id: number) => this.wild_talent_typeOps.getById(id);
    createWildTalentType = (newItem: WildTalentTypeInsert) => this.wild_talent_typeOps.create(newItem);
    updateWildTalentType = (changes: WildTalentTypeUpdate) => this.wild_talent_typeOps.update(changes);
    deleteWildTalentType = (id: number) => this.wild_talent_typeOps.delete(id);
    getWildTalentTypesByIds = (ids: number[]) => this.wild_talent_typeOps.getByIds(ids);
    watchWildTalentType = (onChange: (type: 'insert' | 'update' | 'delete', row: WildTalentType, oldRow?: WildTalentType) => void) => {
        const unsubscribe = this.wild_talent_typeOps.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    };
    stopWatchWildTalentType = () => this.wild_talent_typeOps.stopWatch();


    /**
     * Preload common game data into cache
     * @param data Partial data to preload
     * @returns The preloaded data
     */
    preloadCommonData = async (data: Partial<PreloadTableData>): Promise<PreloadTableData> => {
        // Validate input
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data provided to preloadCommonData');
        }

        try {
            // Update cache for each table
            Object.entries(data).forEach(([tableName, items]) => {
                if (Array.isArray(items)) {
                    const opsKey = tableName === 'classData' ? 'classOps' : `${tableName}Ops`;
                    const ops = this[opsKey];
                    if (ops) {
                        items.forEach(item => {
                            if (item && typeof item === 'object' && 'id' in item) {
                                ops.cache.set(item.id, item);
                            }
                        });
                        ops.allDataLoaded = true;
                    }
                }
            });

            return data;
        } catch (error) {
            console.error('Error in preloadCommonData:', error);
            throw error;
        }
    };

    // Relationship functions

    async getBonusAttackProgressionForClass(ids: number[]): Promise<Record<number, BonusAttackProgression[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.bonusAttackProgressionByBaseAttackBonusProgression[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('class')
                .select(`
                    id,
                    base_attack_bonus_progression,
                    bonus_attack_progression_data:bonus_attack_progression(*)
                `)
                .in('base_attack_bonus_progression', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        base_attack_bonus_progression: number;
                        bonus_attack_progression_data: BonusAttackProgression;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching bonus_attack_progression for class: ${error.message}`);
            if (!data) return {};
            
            // Group results by base_attack_bonus_progression
            const results: Record<number, BonusAttackProgression[]> = {};
            data.forEach(row => {
                const id = row.base_attack_bonus_progression;
                if (!results[id]) results[id] = [];
                if (row.bonus_attack_progression_data) {
                    results[id].push(row.bonus_attack_progression_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.bonusAttackProgressionByBaseAttackBonusProgression[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.bonusAttackProgressionByBaseAttackBonusProgression[id] || []
            ])
        );
    }

    async getAbilityForSkill(ids: number[]): Promise<Record<number, Ability[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.abilityByAbilityId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('skill')
                .select(`
                    id,
                    ability_id,
                    ability_data:ability(*)
                `)
                .in('ability_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        ability_id: number;
                        ability_data: Ability;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching ability for skill: ${error.message}`);
            if (!data) return {};
            
            // Group results by ability_id
            const results: Record<number, Ability[]> = {};
            data.forEach(row => {
                const id = row.ability_id;
                if (!results[id]) results[id] = [];
                if (row.ability_data) {
                    results[id].push(row.ability_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.abilityByAbilityId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.abilityByAbilityId[id] || []
            ])
        );
    }

    async getClassForClassFeature(ids: number[]): Promise<Record<number, Class[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.classByClassId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('class_feature')
                .select(`
                    id,
                    class_id,
                    class_data:class(*)
                `)
                .in('class_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        class_id: number;
                        class_data: Class;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching class for class_feature: ${error.message}`);
            if (!data) return {};
            
            // Group results by class_id
            const results: Record<number, Class[]> = {};
            data.forEach(row => {
                const id = row.class_id;
                if (!results[id]) results[id] = [];
                if (row.class_data) {
                    results[id].push(row.class_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.classByClassId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.classByClassId[id] || []
            ])
        );
    }

    async getClassFeatureForClassFeatureBenefit(ids: number[]): Promise<Record<number, ClassFeature[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.classFeatureByClassFeatureId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('class_feature_benefit')
                .select(`
                    id,
                    class_feature_id,
                    class_feature_data:class_feature(*)
                `)
                .in('class_feature_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        class_feature_id: number;
                        class_feature_data: ClassFeature;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching class_feature for class_feature_benefit: ${error.message}`);
            if (!data) return {};
            
            // Group results by class_feature_id
            const results: Record<number, ClassFeature[]> = {};
            data.forEach(row => {
                const id = row.class_feature_id;
                if (!results[id]) results[id] = [];
                if (row.class_feature_data) {
                    results[id].push(row.class_feature_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.classFeatureByClassFeatureId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.classFeatureByClassFeatureId[id] || []
            ])
        );
    }

    async getClassFeatureForSpellcastingClassFeature(ids: number[]): Promise<Record<number, ClassFeature[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.classFeatureByClassFeatureId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('spellcasting_class_feature')
                .select(`
                    id,
                    class_feature_id,
                    class_feature_data:class_feature(*)
                `)
                .in('class_feature_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        class_feature_id: number;
                        class_feature_data: ClassFeature;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching class_feature for spellcasting_class_feature: ${error.message}`);
            if (!data) return {};
            
            // Group results by class_feature_id
            const results: Record<number, ClassFeature[]> = {};
            data.forEach(row => {
                const id = row.class_feature_id;
                if (!results[id]) results[id] = [];
                if (row.class_feature_data) {
                    results[id].push(row.class_feature_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.classFeatureByClassFeatureId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.classFeatureByClassFeatureId[id] || []
            ])
        );
    }

    async getSpellcastingTypeForSpellcastingClassFeature(ids: number[]): Promise<Record<number, SpellcastingType[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.spellcastingTypeBySpellcastingType[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('spellcasting_class_feature')
                .select(`
                    id,
                    spellcasting_type,
                    spellcasting_type_data:spellcasting_type(*)
                `)
                .in('spellcasting_type', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        spellcasting_type: number;
                        spellcasting_type_data: SpellcastingType;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching spellcasting_type for spellcasting_class_feature: ${error.message}`);
            if (!data) return {};
            
            // Group results by spellcasting_type
            const results: Record<number, SpellcastingType[]> = {};
            data.forEach(row => {
                const id = row.spellcasting_type;
                if (!results[id]) results[id] = [];
                if (row.spellcasting_type_data) {
                    results[id].push(row.spellcasting_type_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.spellcastingTypeBySpellcastingType[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.spellcastingTypeBySpellcastingType[id] || []
            ])
        );
    }

    async getSpellcastingPreparationTypeForSpellcastingClassFeature(ids: number[]): Promise<Record<number, SpellcastingPreparationType[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.spellcastingPreparationTypeByPreparationType[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('spellcasting_class_feature')
                .select(`
                    id,
                    preparation_type,
                    spellcasting_preparation_type_data:spellcasting_preparation_type(*)
                `)
                .in('preparation_type', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        preparation_type: number;
                        spellcasting_preparation_type_data: SpellcastingPreparationType;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching spellcasting_preparation_type for spellcasting_class_feature: ${error.message}`);
            if (!data) return {};
            
            // Group results by preparation_type
            const results: Record<number, SpellcastingPreparationType[]> = {};
            data.forEach(row => {
                const id = row.preparation_type;
                if (!results[id]) results[id] = [];
                if (row.spellcasting_preparation_type_data) {
                    results[id].push(row.spellcasting_preparation_type_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.spellcastingPreparationTypeByPreparationType[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.spellcastingPreparationTypeByPreparationType[id] || []
            ])
        );
    }

    async getAbilityForSpellcastingClassFeature(ids: number[]): Promise<Record<number, Ability[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.abilityByAbilityId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('spellcasting_class_feature')
                .select(`
                    id,
                    ability_id,
                    ability_data:ability(*)
                `)
                .in('ability_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        ability_id: number;
                        ability_data: Ability;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching ability for spellcasting_class_feature: ${error.message}`);
            if (!data) return {};
            
            // Group results by ability_id
            const results: Record<number, Ability[]> = {};
            data.forEach(row => {
                const id = row.ability_id;
                if (!results[id]) results[id] = [];
                if (row.ability_data) {
                    results[id].push(row.ability_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.abilityByAbilityId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.abilityByAbilityId[id] || []
            ])
        );
    }

    async getClassForArchetype(ids: number[]): Promise<Record<number, Class[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.classByClassId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('archetype')
                .select(`
                    id,
                    class_id,
                    class_data:class(*)
                `)
                .in('class_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        class_id: number;
                        class_data: Class;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching class for archetype: ${error.message}`);
            if (!data) return {};
            
            // Group results by class_id
            const results: Record<number, Class[]> = {};
            data.forEach(row => {
                const id = row.class_id;
                if (!results[id]) results[id] = [];
                if (row.class_data) {
                    results[id].push(row.class_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.classByClassId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.classByClassId[id] || []
            ])
        );
    }

    async getClassForArchetypeClassFeature(ids: number[]): Promise<Record<number, Class[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.classByClassId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('archetype_class_feature')
                .select(`
                    id,
                    class_id,
                    class_data:class(*)
                `)
                .in('class_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        class_id: number;
                        class_data: Class;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching class for archetype_class_feature: ${error.message}`);
            if (!data) return {};
            
            // Group results by class_id
            const results: Record<number, Class[]> = {};
            data.forEach(row => {
                const id = row.class_id;
                if (!results[id]) results[id] = [];
                if (row.class_data) {
                    results[id].push(row.class_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.classByClassId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.classByClassId[id] || []
            ])
        );
    }

    async getArchetypeForArchetypeClassFeature(ids: number[]): Promise<Record<number, Archetype[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.archetypeByArchetypeId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('archetype_class_feature')
                .select(`
                    id,
                    archetype_id,
                    archetype_data:archetype(*)
                `)
                .in('archetype_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        archetype_id: number;
                        archetype_data: Archetype;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching archetype for archetype_class_feature: ${error.message}`);
            if (!data) return {};
            
            // Group results by archetype_id
            const results: Record<number, Archetype[]> = {};
            data.forEach(row => {
                const id = row.archetype_id;
                if (!results[id]) results[id] = [];
                if (row.archetype_data) {
                    results[id].push(row.archetype_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.archetypeByArchetypeId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.archetypeByArchetypeId[id] || []
            ])
        );
    }

    async getClassFeatureForArchetypeClassFeature(ids: number[]): Promise<Record<number, ClassFeature[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.classFeatureByFeatureId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('archetype_class_feature')
                .select(`
                    id,
                    feature_id,
                    class_feature_data:class_feature(*)
                `)
                .in('feature_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        feature_id: number;
                        class_feature_data: ClassFeature;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching class_feature for archetype_class_feature: ${error.message}`);
            if (!data) return {};
            
            // Group results by feature_id
            const results: Record<number, ClassFeature[]> = {};
            data.forEach(row => {
                const id = row.feature_id;
                if (!results[id]) results[id] = [];
                if (row.class_feature_data) {
                    results[id].push(row.class_feature_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.classFeatureByFeatureId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.classFeatureByFeatureId[id] || []
            ])
        );
    }

    async getCorruptionForCorruptionManifestation(ids: number[]): Promise<Record<number, Corruption[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.corruptionByCorruptionId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('corruption_manifestation')
                .select(`
                    id,
                    corruption_id,
                    corruption_data:corruption(*)
                `)
                .in('corruption_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        corruption_id: number;
                        corruption_data: Corruption;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching corruption for corruption_manifestation: ${error.message}`);
            if (!data) return {};
            
            // Group results by corruption_id
            const results: Record<number, Corruption[]> = {};
            data.forEach(row => {
                const id = row.corruption_id;
                if (!results[id]) results[id] = [];
                if (row.corruption_data) {
                    results[id].push(row.corruption_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.corruptionByCorruptionId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.corruptionByCorruptionId[id] || []
            ])
        );
    }

    async getClassForWildTalent(ids: number[]): Promise<Record<number, Class[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.classByClassId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('wild_talent')
                .select(`
                    id,
                    class_id,
                    class_data:class(*)
                `)
                .in('class_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        class_id: number;
                        class_data: Class;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching class for wild_talent: ${error.message}`);
            if (!data) return {};
            
            // Group results by class_id
            const results: Record<number, Class[]> = {};
            data.forEach(row => {
                const id = row.class_id;
                if (!results[id]) results[id] = [];
                if (row.class_data) {
                    results[id].push(row.class_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.classByClassId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.classByClassId[id] || []
            ])
        );
    }

    async getWildTalentTypeForWildTalent(ids: number[]): Promise<Record<number, WildTalentType[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.wildTalentTypeByWildTalentTypeId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('wild_talent')
                .select(`
                    id,
                    wild_talent_type_id,
                    wild_talent_type_data:wild_talent_type(*)
                `)
                .in('wild_talent_type_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        wild_talent_type_id: number;
                        wild_talent_type_data: WildTalentType;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching wild_talent_type for wild_talent: ${error.message}`);
            if (!data) return {};
            
            // Group results by wild_talent_type_id
            const results: Record<number, WildTalentType[]> = {};
            data.forEach(row => {
                const id = row.wild_talent_type_id;
                if (!results[id]) results[id] = [];
                if (row.wild_talent_type_data) {
                    results[id].push(row.wild_talent_type_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.wildTalentTypeByWildTalentTypeId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.wildTalentTypeByWildTalentTypeId[id] || []
            ])
        );
    }

    async getClassForMonkUnchainedKiPower(ids: number[]): Promise<Record<number, Class[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.classByClassId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('monk_unchained_ki_power')
                .select(`
                    id,
                    class_id,
                    class_data:class(*)
                `)
                .in('class_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        class_id: number;
                        class_data: Class;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching class for monk_unchained_ki_power: ${error.message}`);
            if (!data) return {};
            
            // Group results by class_id
            const results: Record<number, Class[]> = {};
            data.forEach(row => {
                const id = row.class_id;
                if (!results[id]) results[id] = [];
                if (row.class_data) {
                    results[id].push(row.class_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.classByClassId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.classByClassId[id] || []
            ])
        );
    }

    async getBonusTypeForEquipment(ids: number[]): Promise<Record<number, BonusType[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.bonusTypeByBonusTypeId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('equipment')
                .select(`
                    id,
                    bonus_type_id,
                    bonus_type_data:bonus_type(*)
                `)
                .in('bonus_type_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        bonus_type_id: number;
                        bonus_type_data: BonusType;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching bonus_type for equipment: ${error.message}`);
            if (!data) return {};
            
            // Group results by bonus_type_id
            const results: Record<number, BonusType[]> = {};
            data.forEach(row => {
                const id = row.bonus_type_id;
                if (!results[id]) results[id] = [];
                if (row.bonus_type_data) {
                    results[id].push(row.bonus_type_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.bonusTypeByBonusTypeId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.bonusTypeByBonusTypeId[id] || []
            ])
        );
    }

    async getSpellForSpellConsumable(ids: number[]): Promise<Record<number, Spell[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.spellBySpellId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('spell_consumable')
                .select(`
                    id,
                    spell_id,
                    spell_data:spell(*)
                `)
                .in('spell_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        spell_id: number;
                        spell_data: Spell;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching spell for spell_consumable: ${error.message}`);
            if (!data) return {};
            
            // Group results by spell_id
            const results: Record<number, Spell[]> = {};
            data.forEach(row => {
                const id = row.spell_id;
                if (!results[id]) results[id] = [];
                if (row.spell_data) {
                    results[id].push(row.spell_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.spellBySpellId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.spellBySpellId[id] || []
            ])
        );
    }

    async getGameCharacterForGameCharacterClass(ids: number[]): Promise<Record<number, GameCharacter[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.gameCharacterByGameCharacterId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('game_character_class')
                .select(`
                    id,
                    game_character_id,
                    game_character_data:game_character(*)
                `)
                .in('game_character_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        game_character_id: number;
                        game_character_data: GameCharacter;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching game_character for game_character_class: ${error.message}`);
            if (!data) return {};
            
            // Group results by game_character_id
            const results: Record<number, GameCharacter[]> = {};
            data.forEach(row => {
                const id = row.game_character_id;
                if (!results[id]) results[id] = [];
                if (row.game_character_data) {
                    results[id].push(row.game_character_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.gameCharacterByGameCharacterId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.gameCharacterByGameCharacterId[id] || []
            ])
        );
    }

    async getClassForGameCharacterClass(ids: number[]): Promise<Record<number, Class[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.classByClassId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('game_character_class')
                .select(`
                    id,
                    class_id,
                    class_data:class(*)
                `)
                .in('class_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        class_id: number;
                        class_data: Class;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching class for game_character_class: ${error.message}`);
            if (!data) return {};
            
            // Group results by class_id
            const results: Record<number, Class[]> = {};
            data.forEach(row => {
                const id = row.class_id;
                if (!results[id]) results[id] = [];
                if (row.class_data) {
                    results[id].push(row.class_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.classByClassId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.classByClassId[id] || []
            ])
        );
    }

    async getClassForClassSkill(ids: number[]): Promise<Record<number, Class[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.classByClassId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('class_skill')
                .select(`
                    id,
                    class_id,
                    class_data:class(*)
                `)
                .in('class_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        class_id: number;
                        class_data: Class;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching class for class_skill: ${error.message}`);
            if (!data) return {};
            
            // Group results by class_id
            const results: Record<number, Class[]> = {};
            data.forEach(row => {
                const id = row.class_id;
                if (!results[id]) results[id] = [];
                if (row.class_data) {
                    results[id].push(row.class_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.classByClassId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.classByClassId[id] || []
            ])
        );
    }

    async getSkillForClassSkill(ids: number[]): Promise<Record<number, Skill[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.skillBySkillId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('class_skill')
                .select(`
                    id,
                    skill_id,
                    skill_data:skill(*)
                `)
                .in('skill_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        skill_id: number;
                        skill_data: Skill;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching skill for class_skill: ${error.message}`);
            if (!data) return {};
            
            // Group results by skill_id
            const results: Record<number, Skill[]> = {};
            data.forEach(row => {
                const id = row.skill_id;
                if (!results[id]) results[id] = [];
                if (row.skill_data) {
                    results[id].push(row.skill_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.skillBySkillId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.skillBySkillId[id] || []
            ])
        );
    }

    async getGameCharacterForGameCharacterSkillRank(ids: number[]): Promise<Record<number, GameCharacter[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.gameCharacterByGameCharacterId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('game_character_skill_rank')
                .select(`
                    id,
                    game_character_id,
                    game_character_data:game_character(*)
                `)
                .in('game_character_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        game_character_id: number;
                        game_character_data: GameCharacter;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching game_character for game_character_skill_rank: ${error.message}`);
            if (!data) return {};
            
            // Group results by game_character_id
            const results: Record<number, GameCharacter[]> = {};
            data.forEach(row => {
                const id = row.game_character_id;
                if (!results[id]) results[id] = [];
                if (row.game_character_data) {
                    results[id].push(row.game_character_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.gameCharacterByGameCharacterId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.gameCharacterByGameCharacterId[id] || []
            ])
        );
    }

    async getSkillForGameCharacterSkillRank(ids: number[]): Promise<Record<number, Skill[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.skillBySkillId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('game_character_skill_rank')
                .select(`
                    id,
                    skill_id,
                    skill_data:skill(*)
                `)
                .in('skill_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        skill_id: number;
                        skill_data: Skill;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching skill for game_character_skill_rank: ${error.message}`);
            if (!data) return {};
            
            // Group results by skill_id
            const results: Record<number, Skill[]> = {};
            data.forEach(row => {
                const id = row.skill_id;
                if (!results[id]) results[id] = [];
                if (row.skill_data) {
                    results[id].push(row.skill_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.skillBySkillId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.skillBySkillId[id] || []
            ])
        );
    }

    async getGameCharacterForGameCharacterAbility(ids: number[]): Promise<Record<number, GameCharacter[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.gameCharacterByGameCharacterId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('game_character_ability')
                .select(`
                    id,
                    game_character_id,
                    game_character_data:game_character(*)
                `)
                .in('game_character_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        game_character_id: number;
                        game_character_data: GameCharacter;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching game_character for game_character_ability: ${error.message}`);
            if (!data) return {};
            
            // Group results by game_character_id
            const results: Record<number, GameCharacter[]> = {};
            data.forEach(row => {
                const id = row.game_character_id;
                if (!results[id]) results[id] = [];
                if (row.game_character_data) {
                    results[id].push(row.game_character_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.gameCharacterByGameCharacterId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.gameCharacterByGameCharacterId[id] || []
            ])
        );
    }

    async getAbilityForGameCharacterAbility(ids: number[]): Promise<Record<number, Ability[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.abilityByAbilityId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('game_character_ability')
                .select(`
                    id,
                    ability_id,
                    ability_data:ability(*)
                `)
                .in('ability_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        ability_id: number;
                        ability_data: Ability;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching ability for game_character_ability: ${error.message}`);
            if (!data) return {};
            
            // Group results by ability_id
            const results: Record<number, Ability[]> = {};
            data.forEach(row => {
                const id = row.ability_id;
                if (!results[id]) results[id] = [];
                if (row.ability_data) {
                    results[id].push(row.ability_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.abilityByAbilityId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.abilityByAbilityId[id] || []
            ])
        );
    }

    async getGameCharacterForGameCharacterFeat(ids: number[]): Promise<Record<number, GameCharacter[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.gameCharacterByGameCharacterId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('game_character_feat')
                .select(`
                    id,
                    game_character_id,
                    game_character_data:game_character(*)
                `)
                .in('game_character_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        game_character_id: number;
                        game_character_data: GameCharacter;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching game_character for game_character_feat: ${error.message}`);
            if (!data) return {};
            
            // Group results by game_character_id
            const results: Record<number, GameCharacter[]> = {};
            data.forEach(row => {
                const id = row.game_character_id;
                if (!results[id]) results[id] = [];
                if (row.game_character_data) {
                    results[id].push(row.game_character_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.gameCharacterByGameCharacterId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.gameCharacterByGameCharacterId[id] || []
            ])
        );
    }

    async getFeatForGameCharacterFeat(ids: number[]): Promise<Record<number, Feat[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.featByFeatId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('game_character_feat')
                .select(`
                    id,
                    feat_id,
                    feat_data:feat(*)
                `)
                .in('feat_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        feat_id: number;
                        feat_data: Feat;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching feat for game_character_feat: ${error.message}`);
            if (!data) return {};
            
            // Group results by feat_id
            const results: Record<number, Feat[]> = {};
            data.forEach(row => {
                const id = row.feat_id;
                if (!results[id]) results[id] = [];
                if (row.feat_data) {
                    results[id].push(row.feat_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.featByFeatId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.featByFeatId[id] || []
            ])
        );
    }

    async getGameCharacterForGameCharacterConsumable(ids: number[]): Promise<Record<number, GameCharacter[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.gameCharacterByGameCharacterId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('game_character_consumable')
                .select(`
                    id,
                    game_character_id,
                    game_character_data:game_character(*)
                `)
                .in('game_character_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        game_character_id: number;
                        game_character_data: GameCharacter;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching game_character for game_character_consumable: ${error.message}`);
            if (!data) return {};
            
            // Group results by game_character_id
            const results: Record<number, GameCharacter[]> = {};
            data.forEach(row => {
                const id = row.game_character_id;
                if (!results[id]) results[id] = [];
                if (row.game_character_data) {
                    results[id].push(row.game_character_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.gameCharacterByGameCharacterId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.gameCharacterByGameCharacterId[id] || []
            ])
        );
    }

    async getConsumableForGameCharacterConsumable(ids: number[]): Promise<Record<number, Consumable[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.consumableByConsumableId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('game_character_consumable')
                .select(`
                    id,
                    consumable_id,
                    consumable_data:consumable(*)
                `)
                .in('consumable_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        consumable_id: number;
                        consumable_data: Consumable;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching consumable for game_character_consumable: ${error.message}`);
            if (!data) return {};
            
            // Group results by consumable_id
            const results: Record<number, Consumable[]> = {};
            data.forEach(row => {
                const id = row.consumable_id;
                if (!results[id]) results[id] = [];
                if (row.consumable_data) {
                    results[id].push(row.consumable_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.consumableByConsumableId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.consumableByConsumableId[id] || []
            ])
        );
    }

    async getGameCharacterForGameCharacterArchetype(ids: number[]): Promise<Record<number, GameCharacter[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.gameCharacterByGameCharacterId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('game_character_archetype')
                .select(`
                    id,
                    game_character_id,
                    game_character_data:game_character(*)
                `)
                .in('game_character_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        game_character_id: number;
                        game_character_data: GameCharacter;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching game_character for game_character_archetype: ${error.message}`);
            if (!data) return {};
            
            // Group results by game_character_id
            const results: Record<number, GameCharacter[]> = {};
            data.forEach(row => {
                const id = row.game_character_id;
                if (!results[id]) results[id] = [];
                if (row.game_character_data) {
                    results[id].push(row.game_character_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.gameCharacterByGameCharacterId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.gameCharacterByGameCharacterId[id] || []
            ])
        );
    }

    async getArchetypeForGameCharacterArchetype(ids: number[]): Promise<Record<number, Archetype[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.archetypeByArchetypeId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('game_character_archetype')
                .select(`
                    id,
                    archetype_id,
                    archetype_data:archetype(*)
                `)
                .in('archetype_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        archetype_id: number;
                        archetype_data: Archetype;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching archetype for game_character_archetype: ${error.message}`);
            if (!data) return {};
            
            // Group results by archetype_id
            const results: Record<number, Archetype[]> = {};
            data.forEach(row => {
                const id = row.archetype_id;
                if (!results[id]) results[id] = [];
                if (row.archetype_data) {
                    results[id].push(row.archetype_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.archetypeByArchetypeId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.archetypeByArchetypeId[id] || []
            ])
        );
    }

    async getGameCharacterForGameCharacterAncestry(ids: number[]): Promise<Record<number, GameCharacter[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.gameCharacterByGameCharacterId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('game_character_ancestry')
                .select(`
                    id,
                    game_character_id,
                    game_character_data:game_character(*)
                `)
                .in('game_character_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        game_character_id: number;
                        game_character_data: GameCharacter;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching game_character for game_character_ancestry: ${error.message}`);
            if (!data) return {};
            
            // Group results by game_character_id
            const results: Record<number, GameCharacter[]> = {};
            data.forEach(row => {
                const id = row.game_character_id;
                if (!results[id]) results[id] = [];
                if (row.game_character_data) {
                    results[id].push(row.game_character_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.gameCharacterByGameCharacterId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.gameCharacterByGameCharacterId[id] || []
            ])
        );
    }

    async getAncestryForGameCharacterAncestry(ids: number[]): Promise<Record<number, Ancestry[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.ancestryByAncestryId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('game_character_ancestry')
                .select(`
                    id,
                    ancestry_id,
                    ancestry_data:ancestry(*)
                `)
                .in('ancestry_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        ancestry_id: number;
                        ancestry_data: Ancestry;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching ancestry for game_character_ancestry: ${error.message}`);
            if (!data) return {};
            
            // Group results by ancestry_id
            const results: Record<number, Ancestry[]> = {};
            data.forEach(row => {
                const id = row.ancestry_id;
                if (!results[id]) results[id] = [];
                if (row.ancestry_data) {
                    results[id].push(row.ancestry_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.ancestryByAncestryId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.ancestryByAncestryId[id] || []
            ])
        );
    }

    async getGameCharacterForGameCharacterClassFeature(ids: number[]): Promise<Record<number, GameCharacter[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.gameCharacterByGameCharacterId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('game_character_class_feature')
                .select(`
                    id,
                    game_character_id,
                    game_character_data:game_character(*)
                `)
                .in('game_character_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        game_character_id: number;
                        game_character_data: GameCharacter;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching game_character for game_character_class_feature: ${error.message}`);
            if (!data) return {};
            
            // Group results by game_character_id
            const results: Record<number, GameCharacter[]> = {};
            data.forEach(row => {
                const id = row.game_character_id;
                if (!results[id]) results[id] = [];
                if (row.game_character_data) {
                    results[id].push(row.game_character_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.gameCharacterByGameCharacterId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.gameCharacterByGameCharacterId[id] || []
            ])
        );
    }

    async getClassFeatureForGameCharacterClassFeature(ids: number[]): Promise<Record<number, ClassFeature[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.classFeatureByClassFeatureId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('game_character_class_feature')
                .select(`
                    id,
                    class_feature_id,
                    class_feature_data:class_feature(*)
                `)
                .in('class_feature_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        class_feature_id: number;
                        class_feature_data: ClassFeature;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching class_feature for game_character_class_feature: ${error.message}`);
            if (!data) return {};
            
            // Group results by class_feature_id
            const results: Record<number, ClassFeature[]> = {};
            data.forEach(row => {
                const id = row.class_feature_id;
                if (!results[id]) results[id] = [];
                if (row.class_feature_data) {
                    results[id].push(row.class_feature_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.classFeatureByClassFeatureId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.classFeatureByClassFeatureId[id] || []
            ])
        );
    }

    async getGameCharacterForGameCharacterCorruption(ids: number[]): Promise<Record<number, GameCharacter[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.gameCharacterByGameCharacterId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('game_character_corruption')
                .select(`
                    id,
                    game_character_id,
                    game_character_data:game_character(*)
                `)
                .in('game_character_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        game_character_id: number;
                        game_character_data: GameCharacter;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching game_character for game_character_corruption: ${error.message}`);
            if (!data) return {};
            
            // Group results by game_character_id
            const results: Record<number, GameCharacter[]> = {};
            data.forEach(row => {
                const id = row.game_character_id;
                if (!results[id]) results[id] = [];
                if (row.game_character_data) {
                    results[id].push(row.game_character_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.gameCharacterByGameCharacterId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.gameCharacterByGameCharacterId[id] || []
            ])
        );
    }

    async getCorruptionForGameCharacterCorruption(ids: number[]): Promise<Record<number, Corruption[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.corruptionByCorruptionId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('game_character_corruption')
                .select(`
                    id,
                    corruption_id,
                    corruption_data:corruption(*)
                `)
                .in('corruption_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        corruption_id: number;
                        corruption_data: Corruption;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching corruption for game_character_corruption: ${error.message}`);
            if (!data) return {};
            
            // Group results by corruption_id
            const results: Record<number, Corruption[]> = {};
            data.forEach(row => {
                const id = row.corruption_id;
                if (!results[id]) results[id] = [];
                if (row.corruption_data) {
                    results[id].push(row.corruption_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.corruptionByCorruptionId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.corruptionByCorruptionId[id] || []
            ])
        );
    }

    async getGameCharacterForGameCharacterCorruptionManifestation(ids: number[]): Promise<Record<number, GameCharacter[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.gameCharacterByGameCharacterId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('game_character_corruption_manifestation')
                .select(`
                    id,
                    game_character_id,
                    game_character_data:game_character(*)
                `)
                .in('game_character_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        game_character_id: number;
                        game_character_data: GameCharacter;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching game_character for game_character_corruption_manifestation: ${error.message}`);
            if (!data) return {};
            
            // Group results by game_character_id
            const results: Record<number, GameCharacter[]> = {};
            data.forEach(row => {
                const id = row.game_character_id;
                if (!results[id]) results[id] = [];
                if (row.game_character_data) {
                    results[id].push(row.game_character_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.gameCharacterByGameCharacterId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.gameCharacterByGameCharacterId[id] || []
            ])
        );
    }

    async getCorruptionManifestationForGameCharacterCorruptionManifestation(ids: number[]): Promise<Record<number, CorruptionManifestation[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.corruptionManifestationByManifestationId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('game_character_corruption_manifestation')
                .select(`
                    id,
                    manifestation_id,
                    corruption_manifestation_data:corruption_manifestation(*)
                `)
                .in('manifestation_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        manifestation_id: number;
                        corruption_manifestation_data: CorruptionManifestation;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching corruption_manifestation for game_character_corruption_manifestation: ${error.message}`);
            if (!data) return {};
            
            // Group results by manifestation_id
            const results: Record<number, CorruptionManifestation[]> = {};
            data.forEach(row => {
                const id = row.manifestation_id;
                if (!results[id]) results[id] = [];
                if (row.corruption_manifestation_data) {
                    results[id].push(row.corruption_manifestation_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.corruptionManifestationByManifestationId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.corruptionManifestationByManifestationId[id] || []
            ])
        );
    }

    async getGameCharacterForGameCharacterWildTalent(ids: number[]): Promise<Record<number, GameCharacter[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.gameCharacterByGameCharacterId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('game_character_wild_talent')
                .select(`
                    id,
                    game_character_id,
                    game_character_data:game_character(*)
                `)
                .in('game_character_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        game_character_id: number;
                        game_character_data: GameCharacter;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching game_character for game_character_wild_talent: ${error.message}`);
            if (!data) return {};
            
            // Group results by game_character_id
            const results: Record<number, GameCharacter[]> = {};
            data.forEach(row => {
                const id = row.game_character_id;
                if (!results[id]) results[id] = [];
                if (row.game_character_data) {
                    results[id].push(row.game_character_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.gameCharacterByGameCharacterId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.gameCharacterByGameCharacterId[id] || []
            ])
        );
    }

    async getWildTalentForGameCharacterWildTalent(ids: number[]): Promise<Record<number, WildTalent[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.wildTalentByWildTalentId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('game_character_wild_talent')
                .select(`
                    id,
                    wild_talent_id,
                    wild_talent_data:wild_talent(*)
                `)
                .in('wild_talent_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        wild_talent_id: number;
                        wild_talent_data: WildTalent;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching wild_talent for game_character_wild_talent: ${error.message}`);
            if (!data) return {};
            
            // Group results by wild_talent_id
            const results: Record<number, WildTalent[]> = {};
            data.forEach(row => {
                const id = row.wild_talent_id;
                if (!results[id]) results[id] = [];
                if (row.wild_talent_data) {
                    results[id].push(row.wild_talent_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.wildTalentByWildTalentId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.wildTalentByWildTalentId[id] || []
            ])
        );
    }

    async getAbpNodeGroupForAbpNode(ids: number[]): Promise<Record<number, AbpNodeGroup[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.abpNodeGroupByGroupId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('abp_node')
                .select(`
                    id,
                    group_id,
                    abp_node_group_data:abp_node_group(*)
                `)
                .in('group_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        group_id: number;
                        abp_node_group_data: AbpNodeGroup;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching abp_node_group for abp_node: ${error.message}`);
            if (!data) return {};
            
            // Group results by group_id
            const results: Record<number, AbpNodeGroup[]> = {};
            data.forEach(row => {
                const id = row.group_id;
                if (!results[id]) results[id] = [];
                if (row.abp_node_group_data) {
                    results[id].push(row.abp_node_group_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.abpNodeGroupByGroupId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.abpNodeGroupByGroupId[id] || []
            ])
        );
    }

    async getAbpNodeForAbpNodeBonus(ids: number[]): Promise<Record<number, AbpNode[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.abpNodeByNodeId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('abp_node_bonus')
                .select(`
                    id,
                    node_id,
                    abp_node_data:abp_node(*)
                `)
                .in('node_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        node_id: number;
                        abp_node_data: AbpNode;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching abp_node for abp_node_bonus: ${error.message}`);
            if (!data) return {};
            
            // Group results by node_id
            const results: Record<number, AbpNode[]> = {};
            data.forEach(row => {
                const id = row.node_id;
                if (!results[id]) results[id] = [];
                if (row.abp_node_data) {
                    results[id].push(row.abp_node_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.abpNodeByNodeId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.abpNodeByNodeId[id] || []
            ])
        );
    }

    async getAbpBonusTypeForAbpNodeBonus(ids: number[]): Promise<Record<number, AbpBonusType[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.abpBonusTypeByBonusTypeId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('abp_node_bonus')
                .select(`
                    id,
                    bonus_type_id,
                    abp_bonus_type_data:abp_bonus_type(*)
                `)
                .in('bonus_type_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        bonus_type_id: number;
                        abp_bonus_type_data: AbpBonusType;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching abp_bonus_type for abp_node_bonus: ${error.message}`);
            if (!data) return {};
            
            // Group results by bonus_type_id
            const results: Record<number, AbpBonusType[]> = {};
            data.forEach(row => {
                const id = row.bonus_type_id;
                if (!results[id]) results[id] = [];
                if (row.abp_bonus_type_data) {
                    results[id].push(row.abp_bonus_type_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.abpBonusTypeByBonusTypeId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.abpBonusTypeByBonusTypeId[id] || []
            ])
        );
    }

    async getGameCharacterForGameCharacterAbpChoice(ids: number[]): Promise<Record<number, GameCharacter[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.gameCharacterByGameCharacterId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('game_character_abp_choice')
                .select(`
                    id,
                    game_character_id,
                    game_character_data:game_character(*)
                `)
                .in('game_character_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        game_character_id: number;
                        game_character_data: GameCharacter;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching game_character for game_character_abp_choice: ${error.message}`);
            if (!data) return {};
            
            // Group results by game_character_id
            const results: Record<number, GameCharacter[]> = {};
            data.forEach(row => {
                const id = row.game_character_id;
                if (!results[id]) results[id] = [];
                if (row.game_character_data) {
                    results[id].push(row.game_character_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.gameCharacterByGameCharacterId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.gameCharacterByGameCharacterId[id] || []
            ])
        );
    }

    async getAbpNodeGroupForGameCharacterAbpChoice(ids: number[]): Promise<Record<number, AbpNodeGroup[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.abpNodeGroupByGroupId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('game_character_abp_choice')
                .select(`
                    id,
                    group_id,
                    abp_node_group_data:abp_node_group(*)
                `)
                .in('group_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        group_id: number;
                        abp_node_group_data: AbpNodeGroup;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching abp_node_group for game_character_abp_choice: ${error.message}`);
            if (!data) return {};
            
            // Group results by group_id
            const results: Record<number, AbpNodeGroup[]> = {};
            data.forEach(row => {
                const id = row.group_id;
                if (!results[id]) results[id] = [];
                if (row.abp_node_group_data) {
                    results[id].push(row.abp_node_group_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.abpNodeGroupByGroupId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.abpNodeGroupByGroupId[id] || []
            ])
        );
    }

    async getAbpNodeForGameCharacterAbpChoice(ids: number[]): Promise<Record<number, AbpNode[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.abpNodeByNodeId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('game_character_abp_choice')
                .select(`
                    id,
                    node_id,
                    abp_node_data:abp_node(*)
                `)
                .in('node_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        node_id: number;
                        abp_node_data: AbpNode;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching abp_node for game_character_abp_choice: ${error.message}`);
            if (!data) return {};
            
            // Group results by node_id
            const results: Record<number, AbpNode[]> = {};
            data.forEach(row => {
                const id = row.node_id;
                if (!results[id]) results[id] = [];
                if (row.abp_node_data) {
                    results[id].push(row.abp_node_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.abpNodeByNodeId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.abpNodeByNodeId[id] || []
            ])
        );
    }

    async getGameCharacterForGameCharacterFavoredClassBonus(ids: number[]): Promise<Record<number, GameCharacter[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.gameCharacterByGameCharacterId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('game_character_favored_class_bonus')
                .select(`
                    id,
                    game_character_id,
                    game_character_data:game_character(*)
                `)
                .in('game_character_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        game_character_id: number;
                        game_character_data: GameCharacter;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching game_character for game_character_favored_class_bonus: ${error.message}`);
            if (!data) return {};
            
            // Group results by game_character_id
            const results: Record<number, GameCharacter[]> = {};
            data.forEach(row => {
                const id = row.game_character_id;
                if (!results[id]) results[id] = [];
                if (row.game_character_data) {
                    results[id].push(row.game_character_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.gameCharacterByGameCharacterId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.gameCharacterByGameCharacterId[id] || []
            ])
        );
    }

    async getFavoredClassChoiceForGameCharacterFavoredClassBonus(ids: number[]): Promise<Record<number, FavoredClassChoice[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.favoredClassChoiceByChoiceId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('game_character_favored_class_bonus')
                .select(`
                    id,
                    choice_id,
                    favored_class_choice_data:favored_class_choice(*)
                `)
                .in('choice_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        choice_id: number;
                        favored_class_choice_data: FavoredClassChoice;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching favored_class_choice for game_character_favored_class_bonus: ${error.message}`);
            if (!data) return {};
            
            // Group results by choice_id
            const results: Record<number, FavoredClassChoice[]> = {};
            data.forEach(row => {
                const id = row.choice_id;
                if (!results[id]) results[id] = [];
                if (row.favored_class_choice_data) {
                    results[id].push(row.favored_class_choice_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.favoredClassChoiceByChoiceId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.favoredClassChoiceByChoiceId[id] || []
            ])
        );
    }

    async getClassForGameCharacterFavoredClassBonus(ids: number[]): Promise<Record<number, Class[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.classByClassId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('game_character_favored_class_bonus')
                .select(`
                    id,
                    class_id,
                    class_data:class(*)
                `)
                .in('class_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        class_id: number;
                        class_data: Class;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching class for game_character_favored_class_bonus: ${error.message}`);
            if (!data) return {};
            
            // Group results by class_id
            const results: Record<number, Class[]> = {};
            data.forEach(row => {
                const id = row.class_id;
                if (!results[id]) results[id] = [];
                if (row.class_data) {
                    results[id].push(row.class_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.classByClassId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.classByClassId[id] || []
            ])
        );
    }

    async getGameCharacterForGameCharacterEquipment(ids: number[]): Promise<Record<number, GameCharacter[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.gameCharacterByGameCharacterId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('game_character_equipment')
                .select(`
                    id,
                    game_character_id,
                    game_character_data:game_character(*)
                `)
                .in('game_character_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        game_character_id: number;
                        game_character_data: GameCharacter;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching game_character for game_character_equipment: ${error.message}`);
            if (!data) return {};
            
            // Group results by game_character_id
            const results: Record<number, GameCharacter[]> = {};
            data.forEach(row => {
                const id = row.game_character_id;
                if (!results[id]) results[id] = [];
                if (row.game_character_data) {
                    results[id].push(row.game_character_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.gameCharacterByGameCharacterId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.gameCharacterByGameCharacterId[id] || []
            ])
        );
    }

    async getEquipmentForGameCharacterEquipment(ids: number[]): Promise<Record<number, Equipment[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.equipmentByEquipmentId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('game_character_equipment')
                .select(`
                    id,
                    equipment_id,
                    equipment_data:equipment(*)
                `)
                .in('equipment_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        equipment_id: number;
                        equipment_data: Equipment;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching equipment for game_character_equipment: ${error.message}`);
            if (!data) return {};
            
            // Group results by equipment_id
            const results: Record<number, Equipment[]> = {};
            data.forEach(row => {
                const id = row.equipment_id;
                if (!results[id]) results[id] = [];
                if (row.equipment_data) {
                    results[id].push(row.equipment_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.equipmentByEquipmentId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.equipmentByEquipmentId[id] || []
            ])
        );
    }

    async getGameCharacterForGameCharacterArmor(ids: number[]): Promise<Record<number, GameCharacter[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.gameCharacterByGameCharacterId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('game_character_armor')
                .select(`
                    id,
                    game_character_id,
                    game_character_data:game_character(*)
                `)
                .in('game_character_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        game_character_id: number;
                        game_character_data: GameCharacter;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching game_character for game_character_armor: ${error.message}`);
            if (!data) return {};
            
            // Group results by game_character_id
            const results: Record<number, GameCharacter[]> = {};
            data.forEach(row => {
                const id = row.game_character_id;
                if (!results[id]) results[id] = [];
                if (row.game_character_data) {
                    results[id].push(row.game_character_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.gameCharacterByGameCharacterId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.gameCharacterByGameCharacterId[id] || []
            ])
        );
    }

    async getArmorForGameCharacterArmor(ids: number[]): Promise<Record<number, Armor[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.armorByArmorId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('game_character_armor')
                .select(`
                    id,
                    armor_id,
                    armor_data:armor(*)
                `)
                .in('armor_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        armor_id: number;
                        armor_data: Armor;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching armor for game_character_armor: ${error.message}`);
            if (!data) return {};
            
            // Group results by armor_id
            const results: Record<number, Armor[]> = {};
            data.forEach(row => {
                const id = row.armor_id;
                if (!results[id]) results[id] = [];
                if (row.armor_data) {
                    results[id].push(row.armor_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.armorByArmorId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.armorByArmorId[id] || []
            ])
        );
    }

    async getGameCharacterForGameCharacterTrait(ids: number[]): Promise<Record<number, GameCharacter[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.gameCharacterByGameCharacterId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('game_character_trait')
                .select(`
                    id,
                    game_character_id,
                    game_character_data:game_character(*)
                `)
                .in('game_character_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        game_character_id: number;
                        game_character_data: GameCharacter;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching game_character for game_character_trait: ${error.message}`);
            if (!data) return {};
            
            // Group results by game_character_id
            const results: Record<number, GameCharacter[]> = {};
            data.forEach(row => {
                const id = row.game_character_id;
                if (!results[id]) results[id] = [];
                if (row.game_character_data) {
                    results[id].push(row.game_character_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.gameCharacterByGameCharacterId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.gameCharacterByGameCharacterId[id] || []
            ])
        );
    }

    async getTraitForGameCharacterTrait(ids: number[]): Promise<Record<number, Trait[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.traitByTraitId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('game_character_trait')
                .select(`
                    id,
                    trait_id,
                    trait_data:trait(*)
                `)
                .in('trait_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        trait_id: number;
                        trait_data: Trait;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching trait for game_character_trait: ${error.message}`);
            if (!data) return {};
            
            // Group results by trait_id
            const results: Record<number, Trait[]> = {};
            data.forEach(row => {
                const id = row.trait_id;
                if (!results[id]) results[id] = [];
                if (row.trait_data) {
                    results[id].push(row.trait_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.traitByTraitId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.traitByTraitId[id] || []
            ])
        );
    }

    async getGameCharacterForGameCharacterSpell(ids: number[]): Promise<Record<number, GameCharacter[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.gameCharacterByGameCharacterId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('game_character_spell')
                .select(`
                    id,
                    game_character_id,
                    game_character_data:game_character(*)
                `)
                .in('game_character_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        game_character_id: number;
                        game_character_data: GameCharacter;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching game_character for game_character_spell: ${error.message}`);
            if (!data) return {};
            
            // Group results by game_character_id
            const results: Record<number, GameCharacter[]> = {};
            data.forEach(row => {
                const id = row.game_character_id;
                if (!results[id]) results[id] = [];
                if (row.game_character_data) {
                    results[id].push(row.game_character_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.gameCharacterByGameCharacterId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.gameCharacterByGameCharacterId[id] || []
            ])
        );
    }

    async getSpellForGameCharacterSpell(ids: number[]): Promise<Record<number, Spell[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.spellBySpellId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('game_character_spell')
                .select(`
                    id,
                    spell_id,
                    spell_data:spell(*)
                `)
                .in('spell_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        spell_id: number;
                        spell_data: Spell;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching spell for game_character_spell: ${error.message}`);
            if (!data) return {};
            
            // Group results by spell_id
            const results: Record<number, Spell[]> = {};
            data.forEach(row => {
                const id = row.spell_id;
                if (!results[id]) results[id] = [];
                if (row.spell_data) {
                    results[id].push(row.spell_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.spellBySpellId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.spellBySpellId[id] || []
            ])
        );
    }

    async getGameCharacterForGameCharacterDiscovery(ids: number[]): Promise<Record<number, GameCharacter[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.gameCharacterByGameCharacterId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('game_character_discovery')
                .select(`
                    id,
                    game_character_id,
                    game_character_data:game_character(*)
                `)
                .in('game_character_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        game_character_id: number;
                        game_character_data: GameCharacter;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching game_character for game_character_discovery: ${error.message}`);
            if (!data) return {};
            
            // Group results by game_character_id
            const results: Record<number, GameCharacter[]> = {};
            data.forEach(row => {
                const id = row.game_character_id;
                if (!results[id]) results[id] = [];
                if (row.game_character_data) {
                    results[id].push(row.game_character_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.gameCharacterByGameCharacterId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.gameCharacterByGameCharacterId[id] || []
            ])
        );
    }

    async getDiscoveryForGameCharacterDiscovery(ids: number[]): Promise<Record<number, Discovery[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.discoveryByDiscoveryId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('game_character_discovery')
                .select(`
                    id,
                    discovery_id,
                    discovery_data:discovery(*)
                `)
                .in('discovery_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        discovery_id: number;
                        discovery_data: Discovery;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching discovery for game_character_discovery: ${error.message}`);
            if (!data) return {};
            
            // Group results by discovery_id
            const results: Record<number, Discovery[]> = {};
            data.forEach(row => {
                const id = row.discovery_id;
                if (!results[id]) results[id] = [];
                if (row.discovery_data) {
                    results[id].push(row.discovery_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.discoveryByDiscoveryId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.discoveryByDiscoveryId[id] || []
            ])
        );
    }

    async getGameCharacterForGameCharacterWeapon(ids: number[]): Promise<Record<number, GameCharacter[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.gameCharacterByGameCharacterId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('game_character_weapon')
                .select(`
                    id,
                    game_character_id,
                    game_character_data:game_character(*)
                `)
                .in('game_character_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        game_character_id: number;
                        game_character_data: GameCharacter;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching game_character for game_character_weapon: ${error.message}`);
            if (!data) return {};
            
            // Group results by game_character_id
            const results: Record<number, GameCharacter[]> = {};
            data.forEach(row => {
                const id = row.game_character_id;
                if (!results[id]) results[id] = [];
                if (row.game_character_data) {
                    results[id].push(row.game_character_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.gameCharacterByGameCharacterId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.gameCharacterByGameCharacterId[id] || []
            ])
        );
    }

    async getWeaponForGameCharacterWeapon(ids: number[]): Promise<Record<number, Weapon[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.weaponByWeaponId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('game_character_weapon')
                .select(`
                    id,
                    weapon_id,
                    weapon_data:weapon(*)
                `)
                .in('weapon_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        weapon_id: number;
                        weapon_data: Weapon;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching weapon for game_character_weapon: ${error.message}`);
            if (!data) return {};
            
            // Group results by weapon_id
            const results: Record<number, Weapon[]> = {};
            data.forEach(row => {
                const id = row.weapon_id;
                if (!results[id]) results[id] = [];
                if (row.weapon_data) {
                    results[id].push(row.weapon_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.weaponByWeaponId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.weaponByWeaponId[id] || []
            ])
        );
    }

    async getSpellComponentTypeForSpellComponent(ids: number[]): Promise<Record<number, SpellComponentType[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.spellComponentTypeByTypeId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('spell_component')
                .select(`
                    id,
                    type_id,
                    spell_component_type_data:spell_component_type(*)
                `)
                .in('type_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        type_id: number;
                        spell_component_type_data: SpellComponentType;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching spell_component_type for spell_component: ${error.message}`);
            if (!data) return {};
            
            // Group results by type_id
            const results: Record<number, SpellComponentType[]> = {};
            data.forEach(row => {
                const id = row.type_id;
                if (!results[id]) results[id] = [];
                if (row.spell_component_type_data) {
                    results[id].push(row.spell_component_type_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.spellComponentTypeByTypeId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.spellComponentTypeByTypeId[id] || []
            ])
        );
    }

    async getSpellForSpellComponentMapping(ids: number[]): Promise<Record<number, Spell[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.spellBySpellId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('spell_component_mapping')
                .select(`
                    id,
                    spell_id,
                    spell_data:spell(*)
                `)
                .in('spell_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        spell_id: number;
                        spell_data: Spell;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching spell for spell_component_mapping: ${error.message}`);
            if (!data) return {};
            
            // Group results by spell_id
            const results: Record<number, Spell[]> = {};
            data.forEach(row => {
                const id = row.spell_id;
                if (!results[id]) results[id] = [];
                if (row.spell_data) {
                    results[id].push(row.spell_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.spellBySpellId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.spellBySpellId[id] || []
            ])
        );
    }

    async getSpellComponentForSpellComponentMapping(ids: number[]): Promise<Record<number, SpellComponent[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.spellComponentBySpellComponentId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('spell_component_mapping')
                .select(`
                    id,
                    spell_component_id,
                    spell_component_data:spell_component(*)
                `)
                .in('spell_component_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        spell_component_id: number;
                        spell_component_data: SpellComponent;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching spell_component for spell_component_mapping: ${error.message}`);
            if (!data) return {};
            
            // Group results by spell_component_id
            const results: Record<number, SpellComponent[]> = {};
            data.forEach(row => {
                const id = row.spell_component_id;
                if (!results[id]) results[id] = [];
                if (row.spell_component_data) {
                    results[id].push(row.spell_component_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.spellComponentBySpellComponentId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.spellComponentBySpellComponentId[id] || []
            ])
        );
    }

    async getSpellForSpellSorcererBloodlineMapping(ids: number[]): Promise<Record<number, Spell[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.spellBySpellId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('spell_sorcerer_bloodline_mapping')
                .select(`
                    id,
                    spell_id,
                    spell_data:spell(*)
                `)
                .in('spell_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        spell_id: number;
                        spell_data: Spell;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching spell for spell_sorcerer_bloodline_mapping: ${error.message}`);
            if (!data) return {};
            
            // Group results by spell_id
            const results: Record<number, Spell[]> = {};
            data.forEach(row => {
                const id = row.spell_id;
                if (!results[id]) results[id] = [];
                if (row.spell_data) {
                    results[id].push(row.spell_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.spellBySpellId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.spellBySpellId[id] || []
            ])
        );
    }

    async getSorcererBloodlineForSpellSorcererBloodlineMapping(ids: number[]): Promise<Record<number, SorcererBloodline[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.sorcererBloodlineBySorcererBloodlineId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('spell_sorcerer_bloodline_mapping')
                .select(`
                    id,
                    sorcerer_bloodline_id,
                    sorcerer_bloodline_data:sorcerer_bloodline(*)
                `)
                .in('sorcerer_bloodline_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        sorcerer_bloodline_id: number;
                        sorcerer_bloodline_data: SorcererBloodline;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching sorcerer_bloodline for spell_sorcerer_bloodline_mapping: ${error.message}`);
            if (!data) return {};
            
            // Group results by sorcerer_bloodline_id
            const results: Record<number, SorcererBloodline[]> = {};
            data.forEach(row => {
                const id = row.sorcerer_bloodline_id;
                if (!results[id]) results[id] = [];
                if (row.sorcerer_bloodline_data) {
                    results[id].push(row.sorcerer_bloodline_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.sorcererBloodlineBySorcererBloodlineId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.sorcererBloodlineBySorcererBloodlineId[id] || []
            ])
        );
    }

    async getSpellForSpellSubdomainMapping(ids: number[]): Promise<Record<number, Spell[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.spellBySpellId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('spell_subdomain_mapping')
                .select(`
                    id,
                    spell_id,
                    spell_data:spell(*)
                `)
                .in('spell_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        spell_id: number;
                        spell_data: Spell;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching spell for spell_subdomain_mapping: ${error.message}`);
            if (!data) return {};
            
            // Group results by spell_id
            const results: Record<number, Spell[]> = {};
            data.forEach(row => {
                const id = row.spell_id;
                if (!results[id]) results[id] = [];
                if (row.spell_data) {
                    results[id].push(row.spell_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.spellBySpellId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.spellBySpellId[id] || []
            ])
        );
    }

    async getSubdomainForSpellSubdomainMapping(ids: number[]): Promise<Record<number, Subdomain[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.subdomainBySubdomainId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('spell_subdomain_mapping')
                .select(`
                    id,
                    subdomain_id,
                    subdomain_data:subdomain(*)
                `)
                .in('subdomain_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        subdomain_id: number;
                        subdomain_data: Subdomain;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching subdomain for spell_subdomain_mapping: ${error.message}`);
            if (!data) return {};
            
            // Group results by subdomain_id
            const results: Record<number, Subdomain[]> = {};
            data.forEach(row => {
                const id = row.subdomain_id;
                if (!results[id]) results[id] = [];
                if (row.subdomain_data) {
                    results[id].push(row.subdomain_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.subdomainBySubdomainId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.subdomainBySubdomainId[id] || []
            ])
        );
    }

    async getSpellForSpellSchoolMapping(ids: number[]): Promise<Record<number, Spell[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.spellBySpellId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('spell_school_mapping')
                .select(`
                    id,
                    spell_id,
                    spell_data:spell(*)
                `)
                .in('spell_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        spell_id: number;
                        spell_data: Spell;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching spell for spell_school_mapping: ${error.message}`);
            if (!data) return {};
            
            // Group results by spell_id
            const results: Record<number, Spell[]> = {};
            data.forEach(row => {
                const id = row.spell_id;
                if (!results[id]) results[id] = [];
                if (row.spell_data) {
                    results[id].push(row.spell_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.spellBySpellId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.spellBySpellId[id] || []
            ])
        );
    }

    async getSpellSchoolForSpellSchoolMapping(ids: number[]): Promise<Record<number, SpellSchool[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.spellSchoolBySpellSchoolId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('spell_school_mapping')
                .select(`
                    id,
                    spell_school_id,
                    spell_school_data:spell_school(*)
                `)
                .in('spell_school_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        spell_school_id: number;
                        spell_school_data: SpellSchool;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching spell_school for spell_school_mapping: ${error.message}`);
            if (!data) return {};
            
            // Group results by spell_school_id
            const results: Record<number, SpellSchool[]> = {};
            data.forEach(row => {
                const id = row.spell_school_id;
                if (!results[id]) results[id] = [];
                if (row.spell_school_data) {
                    results[id].push(row.spell_school_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.spellSchoolBySpellSchoolId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.spellSchoolBySpellSchoolId[id] || []
            ])
        );
    }

    async getSpellForSpellCastingTimeMapping(ids: number[]): Promise<Record<number, Spell[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.spellBySpellId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('spell_casting_time_mapping')
                .select(`
                    id,
                    spell_id,
                    spell_data:spell(*)
                `)
                .in('spell_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        spell_id: number;
                        spell_data: Spell;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching spell for spell_casting_time_mapping: ${error.message}`);
            if (!data) return {};
            
            // Group results by spell_id
            const results: Record<number, Spell[]> = {};
            data.forEach(row => {
                const id = row.spell_id;
                if (!results[id]) results[id] = [];
                if (row.spell_data) {
                    results[id].push(row.spell_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.spellBySpellId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.spellBySpellId[id] || []
            ])
        );
    }

    async getSpellCastingTimeForSpellCastingTimeMapping(ids: number[]): Promise<Record<number, SpellCastingTime[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.spellCastingTimeBySpellCastingTimeId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('spell_casting_time_mapping')
                .select(`
                    id,
                    spell_casting_time_id,
                    spell_casting_time_data:spell_casting_time(*)
                `)
                .in('spell_casting_time_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        spell_casting_time_id: number;
                        spell_casting_time_data: SpellCastingTime;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching spell_casting_time for spell_casting_time_mapping: ${error.message}`);
            if (!data) return {};
            
            // Group results by spell_casting_time_id
            const results: Record<number, SpellCastingTime[]> = {};
            data.forEach(row => {
                const id = row.spell_casting_time_id;
                if (!results[id]) results[id] = [];
                if (row.spell_casting_time_data) {
                    results[id].push(row.spell_casting_time_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.spellCastingTimeBySpellCastingTimeId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.spellCastingTimeBySpellCastingTimeId[id] || []
            ])
        );
    }

    async getSpellForSpellRangeMapping(ids: number[]): Promise<Record<number, Spell[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.spellBySpellId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('spell_range_mapping')
                .select(`
                    id,
                    spell_id,
                    spell_data:spell(*)
                `)
                .in('spell_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        spell_id: number;
                        spell_data: Spell;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching spell for spell_range_mapping: ${error.message}`);
            if (!data) return {};
            
            // Group results by spell_id
            const results: Record<number, Spell[]> = {};
            data.forEach(row => {
                const id = row.spell_id;
                if (!results[id]) results[id] = [];
                if (row.spell_data) {
                    results[id].push(row.spell_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.spellBySpellId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.spellBySpellId[id] || []
            ])
        );
    }

    async getSpellRangeForSpellRangeMapping(ids: number[]): Promise<Record<number, SpellRange[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.spellRangeBySpellRangeId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('spell_range_mapping')
                .select(`
                    id,
                    spell_range_id,
                    spell_range_data:spell_range(*)
                `)
                .in('spell_range_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        spell_range_id: number;
                        spell_range_data: SpellRange;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching spell_range for spell_range_mapping: ${error.message}`);
            if (!data) return {};
            
            // Group results by spell_range_id
            const results: Record<number, SpellRange[]> = {};
            data.forEach(row => {
                const id = row.spell_range_id;
                if (!results[id]) results[id] = [];
                if (row.spell_range_data) {
                    results[id].push(row.spell_range_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.spellRangeBySpellRangeId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.spellRangeBySpellRangeId[id] || []
            ])
        );
    }

    async getSpellForSpellTargetMapping(ids: number[]): Promise<Record<number, Spell[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.spellBySpellId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('spell_target_mapping')
                .select(`
                    id,
                    spell_id,
                    spell_data:spell(*)
                `)
                .in('spell_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        spell_id: number;
                        spell_data: Spell;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching spell for spell_target_mapping: ${error.message}`);
            if (!data) return {};
            
            // Group results by spell_id
            const results: Record<number, Spell[]> = {};
            data.forEach(row => {
                const id = row.spell_id;
                if (!results[id]) results[id] = [];
                if (row.spell_data) {
                    results[id].push(row.spell_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.spellBySpellId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.spellBySpellId[id] || []
            ])
        );
    }

    async getSpellTargetForSpellTargetMapping(ids: number[]): Promise<Record<number, SpellTarget[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.spellTargetBySpellTargetId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('spell_target_mapping')
                .select(`
                    id,
                    spell_target_id,
                    spell_target_data:spell_target(*)
                `)
                .in('spell_target_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        spell_target_id: number;
                        spell_target_data: SpellTarget;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching spell_target for spell_target_mapping: ${error.message}`);
            if (!data) return {};
            
            // Group results by spell_target_id
            const results: Record<number, SpellTarget[]> = {};
            data.forEach(row => {
                const id = row.spell_target_id;
                if (!results[id]) results[id] = [];
                if (row.spell_target_data) {
                    results[id].push(row.spell_target_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.spellTargetBySpellTargetId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.spellTargetBySpellTargetId[id] || []
            ])
        );
    }

    async getSpellForSpellDurationMapping(ids: number[]): Promise<Record<number, Spell[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.spellBySpellId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('spell_duration_mapping')
                .select(`
                    id,
                    spell_id,
                    spell_data:spell(*)
                `)
                .in('spell_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        spell_id: number;
                        spell_data: Spell;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching spell for spell_duration_mapping: ${error.message}`);
            if (!data) return {};
            
            // Group results by spell_id
            const results: Record<number, Spell[]> = {};
            data.forEach(row => {
                const id = row.spell_id;
                if (!results[id]) results[id] = [];
                if (row.spell_data) {
                    results[id].push(row.spell_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.spellBySpellId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.spellBySpellId[id] || []
            ])
        );
    }

    async getSpellDurationForSpellDurationMapping(ids: number[]): Promise<Record<number, SpellDuration[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.spellDurationBySpellDurationId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('spell_duration_mapping')
                .select(`
                    id,
                    spell_duration_id,
                    spell_duration_data:spell_duration(*)
                `)
                .in('spell_duration_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        spell_duration_id: number;
                        spell_duration_data: SpellDuration;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching spell_duration for spell_duration_mapping: ${error.message}`);
            if (!data) return {};
            
            // Group results by spell_duration_id
            const results: Record<number, SpellDuration[]> = {};
            data.forEach(row => {
                const id = row.spell_duration_id;
                if (!results[id]) results[id] = [];
                if (row.spell_duration_data) {
                    results[id].push(row.spell_duration_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.spellDurationBySpellDurationId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.spellDurationBySpellDurationId[id] || []
            ])
        );
    }

    async getSpellListForSpellListClassFeatureBenefitMapping(ids: number[]): Promise<Record<number, SpellList[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.spellListBySpellListId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('spell_list_class_feature_benefit_mapping')
                .select(`
                    id,
                    spell_list_id,
                    spell_list_data:spell_list(*)
                `)
                .in('spell_list_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        spell_list_id: number;
                        spell_list_data: SpellList;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching spell_list for spell_list_class_feature_benefit_mapping: ${error.message}`);
            if (!data) return {};
            
            // Group results by spell_list_id
            const results: Record<number, SpellList[]> = {};
            data.forEach(row => {
                const id = row.spell_list_id;
                if (!results[id]) results[id] = [];
                if (row.spell_list_data) {
                    results[id].push(row.spell_list_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.spellListBySpellListId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.spellListBySpellListId[id] || []
            ])
        );
    }

    async getClassFeatureBenefitForSpellListClassFeatureBenefitMapping(ids: number[]): Promise<Record<number, ClassFeatureBenefit[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.classFeatureBenefitByClassFeatureBenefitId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('spell_list_class_feature_benefit_mapping')
                .select(`
                    id,
                    class_feature_benefit_id,
                    class_feature_benefit_data:class_feature_benefit(*)
                `)
                .in('class_feature_benefit_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        class_feature_benefit_id: number;
                        class_feature_benefit_data: ClassFeatureBenefit;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching class_feature_benefit for spell_list_class_feature_benefit_mapping: ${error.message}`);
            if (!data) return {};
            
            // Group results by class_feature_benefit_id
            const results: Record<number, ClassFeatureBenefit[]> = {};
            data.forEach(row => {
                const id = row.class_feature_benefit_id;
                if (!results[id]) results[id] = [];
                if (row.class_feature_benefit_data) {
                    results[id].push(row.class_feature_benefit_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.classFeatureBenefitByClassFeatureBenefitId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.classFeatureBenefitByClassFeatureBenefitId[id] || []
            ])
        );
    }

    async getSpellListForSpellListFeatMapping(ids: number[]): Promise<Record<number, SpellList[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.spellListBySpellListId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('spell_list_feat_mapping')
                .select(`
                    id,
                    spell_list_id,
                    spell_list_data:spell_list(*)
                `)
                .in('spell_list_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        spell_list_id: number;
                        spell_list_data: SpellList;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching spell_list for spell_list_feat_mapping: ${error.message}`);
            if (!data) return {};
            
            // Group results by spell_list_id
            const results: Record<number, SpellList[]> = {};
            data.forEach(row => {
                const id = row.spell_list_id;
                if (!results[id]) results[id] = [];
                if (row.spell_list_data) {
                    results[id].push(row.spell_list_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.spellListBySpellListId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.spellListBySpellListId[id] || []
            ])
        );
    }

    async getFeatForSpellListFeatMapping(ids: number[]): Promise<Record<number, Feat[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.featByFeatId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('spell_list_feat_mapping')
                .select(`
                    id,
                    feat_id,
                    feat_data:feat(*)
                `)
                .in('feat_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        feat_id: number;
                        feat_data: Feat;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching feat for spell_list_feat_mapping: ${error.message}`);
            if (!data) return {};
            
            // Group results by feat_id
            const results: Record<number, Feat[]> = {};
            data.forEach(row => {
                const id = row.feat_id;
                if (!results[id]) results[id] = [];
                if (row.feat_data) {
                    results[id].push(row.feat_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.featByFeatId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.featByFeatId[id] || []
            ])
        );
    }

    async getSpellForSpellListSpellMapping(ids: number[]): Promise<Record<number, Spell[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.spellBySpellId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('spell_list_spell_mapping')
                .select(`
                    id,
                    spell_id,
                    spell_data:spell(*)
                `)
                .in('spell_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        spell_id: number;
                        spell_data: Spell;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching spell for spell_list_spell_mapping: ${error.message}`);
            if (!data) return {};
            
            // Group results by spell_id
            const results: Record<number, Spell[]> = {};
            data.forEach(row => {
                const id = row.spell_id;
                if (!results[id]) results[id] = [];
                if (row.spell_data) {
                    results[id].push(row.spell_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.spellBySpellId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.spellBySpellId[id] || []
            ])
        );
    }

    async getSpellListForSpellListSpellMapping(ids: number[]): Promise<Record<number, SpellList[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.spellListBySpellListId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('spell_list_spell_mapping')
                .select(`
                    id,
                    spell_list_id,
                    spell_list_data:spell_list(*)
                `)
                .in('spell_list_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        spell_list_id: number;
                        spell_list_data: SpellList;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching spell_list for spell_list_spell_mapping: ${error.message}`);
            if (!data) return {};
            
            // Group results by spell_list_id
            const results: Record<number, SpellList[]> = {};
            data.forEach(row => {
                const id = row.spell_list_id;
                if (!results[id]) results[id] = [];
                if (row.spell_list_data) {
                    results[id].push(row.spell_list_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.spellListBySpellListId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.spellListBySpellListId[id] || []
            ])
        );
    }

    async getPrerequisiteRequirementTypeForPrerequisiteRequirement(ids: number[]): Promise<Record<number, PrerequisiteRequirementType[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.prerequisiteRequirementTypeByRequirementTypeId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('prerequisite_requirement')
                .select(`
                    id,
                    requirement_type_id,
                    prerequisite_requirement_type_data:prerequisite_requirement_type(*)
                `)
                .in('requirement_type_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        requirement_type_id: number;
                        prerequisite_requirement_type_data: PrerequisiteRequirementType;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching prerequisite_requirement_type for prerequisite_requirement: ${error.message}`);
            if (!data) return {};
            
            // Group results by requirement_type_id
            const results: Record<number, PrerequisiteRequirementType[]> = {};
            data.forEach(row => {
                const id = row.requirement_type_id;
                if (!results[id]) results[id] = [];
                if (row.prerequisite_requirement_type_data) {
                    results[id].push(row.prerequisite_requirement_type_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.prerequisiteRequirementTypeByRequirementTypeId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.prerequisiteRequirementTypeByRequirementTypeId[id] || []
            ])
        );
    }

    async getPrerequisiteFulfillmentForFulfillmentQualificationMapping(ids: number[]): Promise<Record<number, PrerequisiteFulfillment[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.prerequisiteFulfillmentByFulfillmentId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('fulfillment_qualification_mapping')
                .select(`
                    id,
                    fulfillment_id,
                    prerequisite_fulfillment_data:prerequisite_fulfillment(*)
                `)
                .in('fulfillment_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        fulfillment_id: number;
                        prerequisite_fulfillment_data: PrerequisiteFulfillment;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching prerequisite_fulfillment for fulfillment_qualification_mapping: ${error.message}`);
            if (!data) return {};
            
            // Group results by fulfillment_id
            const results: Record<number, PrerequisiteFulfillment[]> = {};
            data.forEach(row => {
                const id = row.fulfillment_id;
                if (!results[id]) results[id] = [];
                if (row.prerequisite_fulfillment_data) {
                    results[id].push(row.prerequisite_fulfillment_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.prerequisiteFulfillmentByFulfillmentId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.prerequisiteFulfillmentByFulfillmentId[id] || []
            ])
        );
    }

    async getQualificationTypeForFulfillmentQualificationMapping(ids: number[]): Promise<Record<number, QualificationType[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.qualificationTypeByQualificationTypeId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('fulfillment_qualification_mapping')
                .select(`
                    id,
                    qualification_type_id,
                    qualification_type_data:qualification_type(*)
                `)
                .in('qualification_type_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        qualification_type_id: number;
                        qualification_type_data: QualificationType;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching qualification_type for fulfillment_qualification_mapping: ${error.message}`);
            if (!data) return {};
            
            // Group results by qualification_type_id
            const results: Record<number, QualificationType[]> = {};
            data.forEach(row => {
                const id = row.qualification_type_id;
                if (!results[id]) results[id] = [];
                if (row.qualification_type_data) {
                    results[id].push(row.qualification_type_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.qualificationTypeByQualificationTypeId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.qualificationTypeByQualificationTypeId[id] || []
            ])
        );
    }

    async getPrerequisiteRequirementForPrerequisiteRequirementFulfillmentMapping(ids: number[]): Promise<Record<number, PrerequisiteRequirement[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.prerequisiteRequirementByPrerequisiteRequirementId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('prerequisite_requirement_fulfillment_mapping')
                .select(`
                    id,
                    prerequisite_requirement_id,
                    prerequisite_requirement_data:prerequisite_requirement(*)
                `)
                .in('prerequisite_requirement_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        prerequisite_requirement_id: number;
                        prerequisite_requirement_data: PrerequisiteRequirement;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching prerequisite_requirement for prerequisite_requirement_fulfillment_mapping: ${error.message}`);
            if (!data) return {};
            
            // Group results by prerequisite_requirement_id
            const results: Record<number, PrerequisiteRequirement[]> = {};
            data.forEach(row => {
                const id = row.prerequisite_requirement_id;
                if (!results[id]) results[id] = [];
                if (row.prerequisite_requirement_data) {
                    results[id].push(row.prerequisite_requirement_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.prerequisiteRequirementByPrerequisiteRequirementId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.prerequisiteRequirementByPrerequisiteRequirementId[id] || []
            ])
        );
    }

    async getPrerequisiteFulfillmentForPrerequisiteRequirementFulfillmentMapping(ids: number[]): Promise<Record<number, PrerequisiteFulfillment[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.prerequisiteFulfillmentByPrerequisiteFulfillmentId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('prerequisite_requirement_fulfillment_mapping')
                .select(`
                    id,
                    prerequisite_fulfillment_id,
                    prerequisite_fulfillment_data:prerequisite_fulfillment(*)
                `)
                .in('prerequisite_fulfillment_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        prerequisite_fulfillment_id: number;
                        prerequisite_fulfillment_data: PrerequisiteFulfillment;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching prerequisite_fulfillment for prerequisite_requirement_fulfillment_mapping: ${error.message}`);
            if (!data) return {};
            
            // Group results by prerequisite_fulfillment_id
            const results: Record<number, PrerequisiteFulfillment[]> = {};
            data.forEach(row => {
                const id = row.prerequisite_fulfillment_id;
                if (!results[id]) results[id] = [];
                if (row.prerequisite_fulfillment_data) {
                    results[id].push(row.prerequisite_fulfillment_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.prerequisiteFulfillmentByPrerequisiteFulfillmentId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.prerequisiteFulfillmentByPrerequisiteFulfillmentId[id] || []
            ])
        );
    }

    async getFeatForFeatBenefit(ids: number[]): Promise<Record<number, Feat[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.featByFeatId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('feat_benefit')
                .select(`
                    id,
                    feat_id,
                    feat_data:feat(*)
                `)
                .in('feat_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        feat_id: number;
                        feat_data: Feat;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching feat for feat_benefit: ${error.message}`);
            if (!data) return {};
            
            // Group results by feat_id
            const results: Record<number, Feat[]> = {};
            data.forEach(row => {
                const id = row.feat_id;
                if (!results[id]) results[id] = [];
                if (row.feat_data) {
                    results[id].push(row.feat_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.featByFeatId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.featByFeatId[id] || []
            ])
        );
    }

    async getSpellSchoolForFeatBenefit(ids: number[]): Promise<Record<number, SpellSchool[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.spellSchoolBySchoolId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('feat_benefit')
                .select(`
                    id,
                    school_id,
                    spell_school_data:spell_school(*)
                `)
                .in('school_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        school_id: number;
                        spell_school_data: SpellSchool;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching spell_school for feat_benefit: ${error.message}`);
            if (!data) return {};
            
            // Group results by school_id
            const results: Record<number, SpellSchool[]> = {};
            data.forEach(row => {
                const id = row.school_id;
                if (!results[id]) results[id] = [];
                if (row.spell_school_data) {
                    results[id].push(row.spell_school_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.spellSchoolBySchoolId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.spellSchoolBySchoolId[id] || []
            ])
        );
    }

    async getQinggongMonkKiPowerTypeForQinggongMonkKiPower(ids: number[]): Promise<Record<number, QinggongMonkKiPowerType[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.qinggongMonkKiPowerTypeByPowerTypeId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('qinggong_monk_ki_power')
                .select(`
                    id,
                    power_type_id,
                    qinggong_monk_ki_power_type_data:qinggong_monk_ki_power_type(*)
                `)
                .in('power_type_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        power_type_id: number;
                        qinggong_monk_ki_power_type_data: QinggongMonkKiPowerType;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching qinggong_monk_ki_power_type for qinggong_monk_ki_power: ${error.message}`);
            if (!data) return {};
            
            // Group results by power_type_id
            const results: Record<number, QinggongMonkKiPowerType[]> = {};
            data.forEach(row => {
                const id = row.power_type_id;
                if (!results[id]) results[id] = [];
                if (row.qinggong_monk_ki_power_type_data) {
                    results[id].push(row.qinggong_monk_ki_power_type_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.qinggongMonkKiPowerTypeByPowerTypeId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.qinggongMonkKiPowerTypeByPowerTypeId[id] || []
            ])
        );
    }

    async getClassForQinggongMonkKiPower(ids: number[]): Promise<Record<number, Class[]>> {
        // Skip if no ids provided
        if (!ids.length) return {};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.classByClassId[id]);
        
        if (uncachedIds.length > 0) {
            // Load uncached relationships in bulk
            const { data, error } = await (this.supabase
                .from('qinggong_monk_ki_power')
                .select(`
                    id,
                    class_id,
                    class_data:class(*)
                `)
                .in('class_id', uncachedIds)) as unknown as {
                    data: Array<{
                        id: number;
                        class_id: number;
                        class_data: Class;
                    }> | null;
                    error: any;
                };
            
            if (error) throw new Error(`Error fetching class for qinggong_monk_ki_power: ${error.message}`);
            if (!data) return {};
            
            // Group results by class_id
            const results: Record<number, Class[]> = {};
            data.forEach(row => {
                const id = row.class_id;
                if (!results[id]) results[id] = [];
                if (row.class_data) {
                    results[id].push(row.class_data);
                }
            });
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {
                const id = Number(idStr);
                this.relationships.classByClassId[id] = value;
            });
        }
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.classByClassId[id] || []
            ])
        );
    }

    // Character grain functions

    async getCompleteCharacterData(characterId: number): Promise<CompleteCharacter | null> {
        const { data, error } = await this.supabase
            .from('game_character')
            .select(`
                *,
                game_character_class:game_character_class(*, class(*)),
                game_character_skill_rank:game_character_skill_rank(*, skill(*)),
                game_character_ability:game_character_ability(*, ability(*)),
                game_character_feat:game_character_feat(*, feat(*)),
                game_character_consumable:game_character_consumable(*, consumable(*)),
                game_character_archetype:game_character_archetype(*, archetype(*)),
                game_character_ancestry:game_character_ancestry(*, ancestry(*)),
                game_character_class_feature:game_character_class_feature(*, class_feature(*)),
                game_character_corruption:game_character_corruption(*, corruption(*)),
                game_character_corruption_manifestation:game_character_corruption_manifestation(*, corruption_manifestation(*)),
                game_character_wild_talent:game_character_wild_talent(*, wild_talent(*)),
                game_character_abp_choice:game_character_abp_choice(*, abp_node_group(*)),
                game_character_favored_class_bonus:game_character_favored_class_bonus(*, favored_class_choice(*)),
                game_character_equipment:game_character_equipment(*, equipment(*)),
                game_character_armor:game_character_armor(*, armor(*)),
                game_character_trait:game_character_trait(*, trait(*)),
                game_character_spell:game_character_spell(*, spell(*)),
                game_character_discovery:game_character_discovery(*, discovery(*)),
                game_character_weapon:game_character_weapon(*, weapon(*))
            `)
            .eq('id', characterId)
            .single();

        if (error) throw error;
        return data;
    }

    async getMultipleCompleteCharacterData(characterIds: number[]): Promise<CompleteCharacter[]> {
        if (!characterIds.length) return [];
        
        const { data, error } = await this.supabase
            .from('game_character')
            .select(`
                *,
                game_character_class:game_character_class(*, class(*)),
                game_character_skill_rank:game_character_skill_rank(*, skill(*)),
                game_character_ability:game_character_ability(*, ability(*)),
                game_character_feat:game_character_feat(*, feat(*)),
                game_character_consumable:game_character_consumable(*, consumable(*)),
                game_character_archetype:game_character_archetype(*, archetype(*)),
                game_character_ancestry:game_character_ancestry(*, ancestry(*)),
                game_character_class_feature:game_character_class_feature(*, class_feature(*)),
                game_character_corruption:game_character_corruption(*, corruption(*)),
                game_character_corruption_manifestation:game_character_corruption_manifestation(*, corruption_manifestation(*)),
                game_character_wild_talent:game_character_wild_talent(*, wild_talent(*)),
                game_character_abp_choice:game_character_abp_choice(*, abp_node_group(*)),
                game_character_favored_class_bonus:game_character_favored_class_bonus(*, favored_class_choice(*)),
                game_character_equipment:game_character_equipment(*, equipment(*)),
                game_character_armor:game_character_armor(*, armor(*)),
                game_character_trait:game_character_trait(*, trait(*)),
                game_character_spell:game_character_spell(*, spell(*)),
                game_character_discovery:game_character_discovery(*, discovery(*)),
                game_character_weapon:game_character_weapon(*, weapon(*))
            `)
            .in('id', characterIds);

        if (error) throw error;
        return data || [];
    }

    // Batch operations

    async getCharacterRelatedData(characterId: number) {
        const { data, error } = await this.supabase
            .from('game_character')
            .select(`
                *,
                game_character_class (*),
                game_character_skill_rank (*),
                game_character_ability (*),
                game_character_feat (*)
            `)
            .eq('id', characterId)
            .single();

        if (error) throw error;
        return data;
    }

    watchCharacterRelatedTables(
        characterId: number,
        onChange: (changes: {
            type: 'insert' | 'update' | 'delete';
            table: string;
            row: any;
            oldRow?: any;
        }) => void
    ) {
        const tables = [
            'game_character',
            'game_character_class',
            'game_character_skill_rank',
            'game_character_ability',
            'game_character_feat'
        ];

        const channels = tables.map(table =>
            this.supabase
                .channel(`${table}_changes_${characterId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table,
                        filter: `game_character_id=eq.${characterId}`
                    },
                    (payload) => {
                        onChange({
                            type: payload.eventType as 'insert' | 'update' | 'delete',
                            table,
                            row: payload.new,
                            oldRow: payload.old
                        });
                    }
                )
                .subscribe()
        );

        return () => channels.forEach(channel => {
            try {
                this.supabase.removeChannel(channel);
            } catch (err) {
                console.error('Error removing channel:', err);
            }
        });
    }


    // Optimized queries with joins

    /** Get ABP cache data with optimized joins */
    async getAbpCacheData(effectiveLevel: number, chosenNodeIds: number[]) {
        const [nodesResult, chosenNodesResult] = await Promise.all([
            this.supabase
                .from('abp_node')
                .select(`
                    *,
                    abp_node_group!inner(*),
                    abp_node_bonus(
                        *,
                        abp_bonus_type(*)
                    )
                `)
                .lt('abp_node_group.level', effectiveLevel),

            this.supabase
                .from('abp_node')
                .select(`
                    *,
                    abp_node_bonus(
                        *,
                        abp_bonus_type(*)
                    )
                `)
                .in('id', chosenNodeIds)
        ]);

        return {
            nodes: nodesResult.data || [],
            chosenNodes: chosenNodesResult.data || []
        };
    }

}
