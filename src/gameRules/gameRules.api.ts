
/**
 * Game Rules API
 * Generated 2025-02-11T22:00:48.965814
 * 
 * Provides type-safe access to game rules with relationship handling, CRUD operations, and realtime updates.
 */

import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

// Base types for all game rules
import type { Database } from '$lib/domain/types/supabase';


// // Base types for all game rules
// import type { Database } from '$lib/domain/types/supabase';

type DbTables = Database['public']['Tables'];

export type GameRule<T extends keyof DbTables> = DbTables[T]['Row'];
export type GameRuleInsert<T extends keyof DbTables> = DbTables[T]['Insert'];
export type GameRuleUpdate<T extends keyof DbTables> = DbTables[T]['Update'] & { id?: number };

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

class TableOperations<T extends { id: number }, TInsert, TUpdate> {
    private channel: RealtimeChannel | null = null;

    constructor(
        private supabase: SupabaseClient,
        private tableName: string
    ) {}

    async getAll(): Promise<T[]> {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .order('id');
        if (error) throw error;
        return data;
    }

    async getById(id: number): Promise<T | null> {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .eq('id', id)
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    }

    async create(newItem: TInsert): Promise<T | null> {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .insert(newItem)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    async update(changes: TUpdate & { id?: number }): Promise<T | null> {
        const { id, ...rest } = changes;
        if (!id) throw new Error(`update${this.tableName}: missing "id" field`);
        const { data, error } = await this.supabase
            .from(this.tableName)
            .update(rest)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    async delete(id: number): Promise<boolean> {
        const { error } = await this.supabase
            .from(this.tableName)
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    }

    async getByIds(ids: number[]): Promise<T[]> {
        if (!ids.length) return [];
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .in('id', ids);
        if (error) throw error;
        return data ?? [];
    }

    watch(
        onChange: (type: 'insert' | 'update' | 'delete', row: T, oldRow?: T) => void
    ): void {
        if (this.channel) return;

        this.channel = this.supabase
            .channel(`${this.tableName}_changes`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: this.tableName
                },
                (payload) => {
                    if (payload.eventType === 'INSERT' && payload.new) {
                        onChange('insert', payload.new as T);
                    } else if (payload.eventType === 'UPDATE' && payload.new) {
                        onChange('update', payload.new as T, payload.old as T);
                    } else if (payload.eventType === 'DELETE' && payload.old) {
                        onChange('delete', payload.old as T);
                    }
                }
            )
            .subscribe();
    }

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
    private relationships: GameRuleRelationships = {
                abilityByAbilityId: {},
        abpBonusTypeByBonusTypeId: {},
        abpNodeByNodeId: {},
        abpNodeGroupByGroupId: {},
        ancestryByAncestryId: {},
        archetypeByArchetypeId: {},
        armorByArmorId: {},
        bonusAttackProgressionByBaseAttackBonusProgression: {},
        bonusTypeByBonusTypeId: {},
        classByClassId: {},
        classFeatureBenefitByClassFeatureBenefitId: {},
        classFeatureByClassFeatureId: {},
        classFeatureByFeatureId: {},
        consumableByConsumableId: {},
        corruptionByCorruptionId: {},
        corruptionManifestationByManifestationId: {},
        discoveryByDiscoveryId: {},
        equipmentByEquipmentId: {},
        favoredClassChoiceByChoiceId: {},
        featByFeatId: {},
        gameCharacterByGameCharacterId: {},
        prerequisiteFulfillmentByFulfillmentId: {},
        prerequisiteFulfillmentByPrerequisiteFulfillmentId: {},
        prerequisiteRequirementByPrerequisiteRequirementId: {},
        prerequisiteRequirementTypeByRequirementTypeId: {},
        qinggongMonkKiPowerTypeByPowerTypeId: {},
        qualificationTypeByQualificationTypeId: {},
        skillBySkillId: {},
        sorcererBloodlineBySorcererBloodlineId: {},
        spellBySpellId: {},
        spellCastingTimeBySpellCastingTimeId: {},
        spellComponentBySpellComponentId: {},
        spellComponentTypeByTypeId: {},
        spellDurationBySpellDurationId: {},
        spellListBySpellListId: {},
        spellRangeBySpellRangeId: {},
        spellSchoolBySchoolId: {},
        spellSchoolBySpellSchoolId: {},
        spellTargetBySpellTargetId: {},
        spellcastingPreparationTypeByPreparationType: {},
        spellcastingTypeBySpellcastingType: {},
        subdomainBySubdomainId: {},
        traitByTraitId: {},
        weaponByWeaponId: {},
        wildTalentByWildTalentId: {},
        wildTalentTypeByWildTalentTypeId: {}
    };

    // Table operations instances
    private abilityOps: TableOperations<Ability, AbilityInsert, AbilityUpdate>;
    private abp_bonus_typeOps: TableOperations<AbpBonusType, AbpBonusTypeInsert, AbpBonusTypeUpdate>;
    private abp_nodeOps: TableOperations<AbpNode, AbpNodeInsert, AbpNodeUpdate>;
    private abp_node_bonusOps: TableOperations<AbpNodeBonus, AbpNodeBonusInsert, AbpNodeBonusUpdate>;
    private abp_node_groupOps: TableOperations<AbpNodeGroup, AbpNodeGroupInsert, AbpNodeGroupUpdate>;
    private ancestryOps: TableOperations<Ancestry, AncestryInsert, AncestryUpdate>;
    private archetypeOps: TableOperations<Archetype, ArchetypeInsert, ArchetypeUpdate>;
    private archetype_class_featureOps: TableOperations<ArchetypeClassFeature, ArchetypeClassFeatureInsert, ArchetypeClassFeatureUpdate>;
    private armorOps: TableOperations<Armor, ArmorInsert, ArmorUpdate>;
    private bonus_attack_progressionOps: TableOperations<BonusAttackProgression, BonusAttackProgressionInsert, BonusAttackProgressionUpdate>;
    private bonus_typeOps: TableOperations<BonusType, BonusTypeInsert, BonusTypeUpdate>;
    private classOps: TableOperations<Class, ClassInsert, ClassUpdate>;
    private class_featureOps: TableOperations<ClassFeature, ClassFeatureInsert, ClassFeatureUpdate>;
    private class_feature_benefitOps: TableOperations<ClassFeatureBenefit, ClassFeatureBenefitInsert, ClassFeatureBenefitUpdate>;
    private class_skillOps: TableOperations<ClassSkill, ClassSkillInsert, ClassSkillUpdate>;
    private consumableOps: TableOperations<Consumable, ConsumableInsert, ConsumableUpdate>;
    private corruptionOps: TableOperations<Corruption, CorruptionInsert, CorruptionUpdate>;
    private corruption_manifestationOps: TableOperations<CorruptionManifestation, CorruptionManifestationInsert, CorruptionManifestationUpdate>;
    private discoveryOps: TableOperations<Discovery, DiscoveryInsert, DiscoveryUpdate>;
    private elementOps: TableOperations<Element, ElementInsert, ElementUpdate>;
    private equipmentOps: TableOperations<Equipment, EquipmentInsert, EquipmentUpdate>;
    private favored_class_choiceOps: TableOperations<FavoredClassChoice, FavoredClassChoiceInsert, FavoredClassChoiceUpdate>;
    private featOps: TableOperations<Feat, FeatInsert, FeatUpdate>;
    private feat_benefitOps: TableOperations<FeatBenefit, FeatBenefitInsert, FeatBenefitUpdate>;
    private fulfillment_qualification_mappingOps: TableOperations<FulfillmentQualificationMapping, FulfillmentQualificationMappingInsert, FulfillmentQualificationMappingUpdate>;
    private game_characterOps: TableOperations<GameCharacter, GameCharacterInsert, GameCharacterUpdate>;
    private game_character_abilityOps: TableOperations<GameCharacterAbility, GameCharacterAbilityInsert, GameCharacterAbilityUpdate>;
    private game_character_abp_choiceOps: TableOperations<GameCharacterAbpChoice, GameCharacterAbpChoiceInsert, GameCharacterAbpChoiceUpdate>;
    private game_character_ancestryOps: TableOperations<GameCharacterAncestry, GameCharacterAncestryInsert, GameCharacterAncestryUpdate>;
    private game_character_archetypeOps: TableOperations<GameCharacterArchetype, GameCharacterArchetypeInsert, GameCharacterArchetypeUpdate>;
    private game_character_armorOps: TableOperations<GameCharacterArmor, GameCharacterArmorInsert, GameCharacterArmorUpdate>;
    private game_character_classOps: TableOperations<GameCharacterClass, GameCharacterClassInsert, GameCharacterClassUpdate>;
    private game_character_class_featureOps: TableOperations<GameCharacterClassFeature, GameCharacterClassFeatureInsert, GameCharacterClassFeatureUpdate>;
    private game_character_consumableOps: TableOperations<GameCharacterConsumable, GameCharacterConsumableInsert, GameCharacterConsumableUpdate>;
    private game_character_corruptionOps: TableOperations<GameCharacterCorruption, GameCharacterCorruptionInsert, GameCharacterCorruptionUpdate>;
    private game_character_corruption_manifestationOps: TableOperations<GameCharacterCorruptionManifestation, GameCharacterCorruptionManifestationInsert, GameCharacterCorruptionManifestationUpdate>;
    private game_character_discoveryOps: TableOperations<GameCharacterDiscovery, GameCharacterDiscoveryInsert, GameCharacterDiscoveryUpdate>;
    private game_character_equipmentOps: TableOperations<GameCharacterEquipment, GameCharacterEquipmentInsert, GameCharacterEquipmentUpdate>;
    private game_character_favored_class_bonusOps: TableOperations<GameCharacterFavoredClassBonus, GameCharacterFavoredClassBonusInsert, GameCharacterFavoredClassBonusUpdate>;
    private game_character_featOps: TableOperations<GameCharacterFeat, GameCharacterFeatInsert, GameCharacterFeatUpdate>;
    private game_character_skill_rankOps: TableOperations<GameCharacterSkillRank, GameCharacterSkillRankInsert, GameCharacterSkillRankUpdate>;
    private game_character_spellOps: TableOperations<GameCharacterSpell, GameCharacterSpellInsert, GameCharacterSpellUpdate>;
    private game_character_traitOps: TableOperations<GameCharacterTrait, GameCharacterTraitInsert, GameCharacterTraitUpdate>;
    private game_character_weaponOps: TableOperations<GameCharacterWeapon, GameCharacterWeaponInsert, GameCharacterWeaponUpdate>;
    private game_character_wild_talentOps: TableOperations<GameCharacterWildTalent, GameCharacterWildTalentInsert, GameCharacterWildTalentUpdate>;
    private legendary_gift_typeOps: TableOperations<LegendaryGiftType, LegendaryGiftTypeInsert, LegendaryGiftTypeUpdate>;
    private monk_unchained_ki_powerOps: TableOperations<MonkUnchainedKiPower, MonkUnchainedKiPowerInsert, MonkUnchainedKiPowerUpdate>;
    private prerequisite_fulfillmentOps: TableOperations<PrerequisiteFulfillment, PrerequisiteFulfillmentInsert, PrerequisiteFulfillmentUpdate>;
    private prerequisite_requirementOps: TableOperations<PrerequisiteRequirement, PrerequisiteRequirementInsert, PrerequisiteRequirementUpdate>;
    private prerequisite_requirement_fulfillment_mappingOps: TableOperations<PrerequisiteRequirementFulfillmentMapping, PrerequisiteRequirementFulfillmentMappingInsert, PrerequisiteRequirementFulfillmentMappingUpdate>;
    private prerequisite_requirement_typeOps: TableOperations<PrerequisiteRequirementType, PrerequisiteRequirementTypeInsert, PrerequisiteRequirementTypeUpdate>;
    private qinggong_monk_ki_powerOps: TableOperations<QinggongMonkKiPower, QinggongMonkKiPowerInsert, QinggongMonkKiPowerUpdate>;
    private qinggong_monk_ki_power_typeOps: TableOperations<QinggongMonkKiPowerType, QinggongMonkKiPowerTypeInsert, QinggongMonkKiPowerTypeUpdate>;
    private qualification_typeOps: TableOperations<QualificationType, QualificationTypeInsert, QualificationTypeUpdate>;
    private ruleOps: TableOperations<Rule, RuleInsert, RuleUpdate>;
    private skillOps: TableOperations<Skill, SkillInsert, SkillUpdate>;
    private sorcerer_bloodlineOps: TableOperations<SorcererBloodline, SorcererBloodlineInsert, SorcererBloodlineUpdate>;
    private spellOps: TableOperations<Spell, SpellInsert, SpellUpdate>;
    private spell_casting_timeOps: TableOperations<SpellCastingTime, SpellCastingTimeInsert, SpellCastingTimeUpdate>;
    private spell_casting_time_mappingOps: TableOperations<SpellCastingTimeMapping, SpellCastingTimeMappingInsert, SpellCastingTimeMappingUpdate>;
    private spell_componentOps: TableOperations<SpellComponent, SpellComponentInsert, SpellComponentUpdate>;
    private spell_component_mappingOps: TableOperations<SpellComponentMapping, SpellComponentMappingInsert, SpellComponentMappingUpdate>;
    private spell_component_typeOps: TableOperations<SpellComponentType, SpellComponentTypeInsert, SpellComponentTypeUpdate>;
    private spell_consumableOps: TableOperations<SpellConsumable, SpellConsumableInsert, SpellConsumableUpdate>;
    private spell_durationOps: TableOperations<SpellDuration, SpellDurationInsert, SpellDurationUpdate>;
    private spell_duration_mappingOps: TableOperations<SpellDurationMapping, SpellDurationMappingInsert, SpellDurationMappingUpdate>;
    private spell_listOps: TableOperations<SpellList, SpellListInsert, SpellListUpdate>;
    private spell_list_class_feature_benefit_mappingOps: TableOperations<SpellListClassFeatureBenefitMapping, SpellListClassFeatureBenefitMappingInsert, SpellListClassFeatureBenefitMappingUpdate>;
    private spell_list_feat_mappingOps: TableOperations<SpellListFeatMapping, SpellListFeatMappingInsert, SpellListFeatMappingUpdate>;
    private spell_list_spell_mappingOps: TableOperations<SpellListSpellMapping, SpellListSpellMappingInsert, SpellListSpellMappingUpdate>;
    private spell_rangeOps: TableOperations<SpellRange, SpellRangeInsert, SpellRangeUpdate>;
    private spell_range_mappingOps: TableOperations<SpellRangeMapping, SpellRangeMappingInsert, SpellRangeMappingUpdate>;
    private spell_schoolOps: TableOperations<SpellSchool, SpellSchoolInsert, SpellSchoolUpdate>;
    private spell_school_mappingOps: TableOperations<SpellSchoolMapping, SpellSchoolMappingInsert, SpellSchoolMappingUpdate>;
    private spell_sorcerer_bloodline_mappingOps: TableOperations<SpellSorcererBloodlineMapping, SpellSorcererBloodlineMappingInsert, SpellSorcererBloodlineMappingUpdate>;
    private spell_subdomain_mappingOps: TableOperations<SpellSubdomainMapping, SpellSubdomainMappingInsert, SpellSubdomainMappingUpdate>;
    private spell_targetOps: TableOperations<SpellTarget, SpellTargetInsert, SpellTargetUpdate>;
    private spell_target_mappingOps: TableOperations<SpellTargetMapping, SpellTargetMappingInsert, SpellTargetMappingUpdate>;
    private spellcasting_class_featureOps: TableOperations<SpellcastingClassFeature, SpellcastingClassFeatureInsert, SpellcastingClassFeatureUpdate>;
    private spellcasting_preparation_typeOps: TableOperations<SpellcastingPreparationType, SpellcastingPreparationTypeInsert, SpellcastingPreparationTypeUpdate>;
    private spellcasting_typeOps: TableOperations<SpellcastingType, SpellcastingTypeInsert, SpellcastingTypeUpdate>;
    private subdomainOps: TableOperations<Subdomain, SubdomainInsert, SubdomainUpdate>;
    private traitOps: TableOperations<Trait, TraitInsert, TraitUpdate>;
    private weaponOps: TableOperations<Weapon, WeaponInsert, WeaponUpdate>;
    private wild_talentOps: TableOperations<WildTalent, WildTalentInsert, WildTalentUpdate>;
    private wild_talent_typeOps: TableOperations<WildTalentType, WildTalentTypeInsert, WildTalentTypeUpdate>;

    constructor(private supabase: SupabaseClient) {
        this.abilityOps = new TableOperations(supabase, 'ability');
        this.abp_bonus_typeOps = new TableOperations(supabase, 'abp_bonus_type');
        this.abp_nodeOps = new TableOperations(supabase, 'abp_node');
        this.abp_node_bonusOps = new TableOperations(supabase, 'abp_node_bonus');
        this.abp_node_groupOps = new TableOperations(supabase, 'abp_node_group');
        this.ancestryOps = new TableOperations(supabase, 'ancestry');
        this.archetypeOps = new TableOperations(supabase, 'archetype');
        this.archetype_class_featureOps = new TableOperations(supabase, 'archetype_class_feature');
        this.armorOps = new TableOperations(supabase, 'armor');
        this.bonus_attack_progressionOps = new TableOperations(supabase, 'bonus_attack_progression');
        this.bonus_typeOps = new TableOperations(supabase, 'bonus_type');
        this.classOps = new TableOperations(supabase, 'class');
        this.class_featureOps = new TableOperations(supabase, 'class_feature');
        this.class_feature_benefitOps = new TableOperations(supabase, 'class_feature_benefit');
        this.class_skillOps = new TableOperations(supabase, 'class_skill');
        this.consumableOps = new TableOperations(supabase, 'consumable');
        this.corruptionOps = new TableOperations(supabase, 'corruption');
        this.corruption_manifestationOps = new TableOperations(supabase, 'corruption_manifestation');
        this.discoveryOps = new TableOperations(supabase, 'discovery');
        this.elementOps = new TableOperations(supabase, 'element');
        this.equipmentOps = new TableOperations(supabase, 'equipment');
        this.favored_class_choiceOps = new TableOperations(supabase, 'favored_class_choice');
        this.featOps = new TableOperations(supabase, 'feat');
        this.feat_benefitOps = new TableOperations(supabase, 'feat_benefit');
        this.fulfillment_qualification_mappingOps = new TableOperations(supabase, 'fulfillment_qualification_mapping');
        this.game_characterOps = new TableOperations(supabase, 'game_character');
        this.game_character_abilityOps = new TableOperations(supabase, 'game_character_ability');
        this.game_character_abp_choiceOps = new TableOperations(supabase, 'game_character_abp_choice');
        this.game_character_ancestryOps = new TableOperations(supabase, 'game_character_ancestry');
        this.game_character_archetypeOps = new TableOperations(supabase, 'game_character_archetype');
        this.game_character_armorOps = new TableOperations(supabase, 'game_character_armor');
        this.game_character_classOps = new TableOperations(supabase, 'game_character_class');
        this.game_character_class_featureOps = new TableOperations(supabase, 'game_character_class_feature');
        this.game_character_consumableOps = new TableOperations(supabase, 'game_character_consumable');
        this.game_character_corruptionOps = new TableOperations(supabase, 'game_character_corruption');
        this.game_character_corruption_manifestationOps = new TableOperations(supabase, 'game_character_corruption_manifestation');
        this.game_character_discoveryOps = new TableOperations(supabase, 'game_character_discovery');
        this.game_character_equipmentOps = new TableOperations(supabase, 'game_character_equipment');
        this.game_character_favored_class_bonusOps = new TableOperations(supabase, 'game_character_favored_class_bonus');
        this.game_character_featOps = new TableOperations(supabase, 'game_character_feat');
        this.game_character_skill_rankOps = new TableOperations(supabase, 'game_character_skill_rank');
        this.game_character_spellOps = new TableOperations(supabase, 'game_character_spell');
        this.game_character_traitOps = new TableOperations(supabase, 'game_character_trait');
        this.game_character_weaponOps = new TableOperations(supabase, 'game_character_weapon');
        this.game_character_wild_talentOps = new TableOperations(supabase, 'game_character_wild_talent');
        this.legendary_gift_typeOps = new TableOperations(supabase, 'legendary_gift_type');
        this.monk_unchained_ki_powerOps = new TableOperations(supabase, 'monk_unchained_ki_power');
        this.prerequisite_fulfillmentOps = new TableOperations(supabase, 'prerequisite_fulfillment');
        this.prerequisite_requirementOps = new TableOperations(supabase, 'prerequisite_requirement');
        this.prerequisite_requirement_fulfillment_mappingOps = new TableOperations(supabase, 'prerequisite_requirement_fulfillment_mapping');
        this.prerequisite_requirement_typeOps = new TableOperations(supabase, 'prerequisite_requirement_type');
        this.qinggong_monk_ki_powerOps = new TableOperations(supabase, 'qinggong_monk_ki_power');
        this.qinggong_monk_ki_power_typeOps = new TableOperations(supabase, 'qinggong_monk_ki_power_type');
        this.qualification_typeOps = new TableOperations(supabase, 'qualification_type');
        this.ruleOps = new TableOperations(supabase, 'rule');
        this.skillOps = new TableOperations(supabase, 'skill');
        this.sorcerer_bloodlineOps = new TableOperations(supabase, 'sorcerer_bloodline');
        this.spellOps = new TableOperations(supabase, 'spell');
        this.spell_casting_timeOps = new TableOperations(supabase, 'spell_casting_time');
        this.spell_casting_time_mappingOps = new TableOperations(supabase, 'spell_casting_time_mapping');
        this.spell_componentOps = new TableOperations(supabase, 'spell_component');
        this.spell_component_mappingOps = new TableOperations(supabase, 'spell_component_mapping');
        this.spell_component_typeOps = new TableOperations(supabase, 'spell_component_type');
        this.spell_consumableOps = new TableOperations(supabase, 'spell_consumable');
        this.spell_durationOps = new TableOperations(supabase, 'spell_duration');
        this.spell_duration_mappingOps = new TableOperations(supabase, 'spell_duration_mapping');
        this.spell_listOps = new TableOperations(supabase, 'spell_list');
        this.spell_list_class_feature_benefit_mappingOps = new TableOperations(supabase, 'spell_list_class_feature_benefit_mapping');
        this.spell_list_feat_mappingOps = new TableOperations(supabase, 'spell_list_feat_mapping');
        this.spell_list_spell_mappingOps = new TableOperations(supabase, 'spell_list_spell_mapping');
        this.spell_rangeOps = new TableOperations(supabase, 'spell_range');
        this.spell_range_mappingOps = new TableOperations(supabase, 'spell_range_mapping');
        this.spell_schoolOps = new TableOperations(supabase, 'spell_school');
        this.spell_school_mappingOps = new TableOperations(supabase, 'spell_school_mapping');
        this.spell_sorcerer_bloodline_mappingOps = new TableOperations(supabase, 'spell_sorcerer_bloodline_mapping');
        this.spell_subdomain_mappingOps = new TableOperations(supabase, 'spell_subdomain_mapping');
        this.spell_targetOps = new TableOperations(supabase, 'spell_target');
        this.spell_target_mappingOps = new TableOperations(supabase, 'spell_target_mapping');
        this.spellcasting_class_featureOps = new TableOperations(supabase, 'spellcasting_class_feature');
        this.spellcasting_preparation_typeOps = new TableOperations(supabase, 'spellcasting_preparation_type');
        this.spellcasting_typeOps = new TableOperations(supabase, 'spellcasting_type');
        this.subdomainOps = new TableOperations(supabase, 'subdomain');
        this.traitOps = new TableOperations(supabase, 'trait');
        this.weaponOps = new TableOperations(supabase, 'weapon');
        this.wild_talentOps = new TableOperations(supabase, 'wild_talent');
        this.wild_talent_typeOps = new TableOperations(supabase, 'wild_talent_type');
    }

    // Table operations methods
    // Ability operations
    getAllAbility = () => this.abilityOps.getAll();
    getAbilityById = (id: number) => this.abilityOps.getById(id);
    createAbility = (newItem: AbilityInsert) => this.abilityOps.create(newItem);
    updateAbility = (changes: AbilityUpdate) => this.abilityOps.update(changes);
    deleteAbility = (id: number) => this.abilityOps.delete(id);
    getAbilitysByIds = (ids: number[]) => this.abilityOps.getByIds(ids);
    watchAbility = (onChange: (type: 'insert' | 'update' | 'delete', row: Ability, oldRow?: Ability) => void) => 
        this.abilityOps.watch(onChange);
    stopWatchAbility = () => this.abilityOps.stopWatch();
    // AbpBonusType operations
    getAllAbpBonusType = () => this.abp_bonus_typeOps.getAll();
    getAbpBonusTypeById = (id: number) => this.abp_bonus_typeOps.getById(id);
    createAbpBonusType = (newItem: AbpBonusTypeInsert) => this.abp_bonus_typeOps.create(newItem);
    updateAbpBonusType = (changes: AbpBonusTypeUpdate) => this.abp_bonus_typeOps.update(changes);
    deleteAbpBonusType = (id: number) => this.abp_bonus_typeOps.delete(id);
    getAbpBonusTypesByIds = (ids: number[]) => this.abp_bonus_typeOps.getByIds(ids);
    watchAbpBonusType = (onChange: (type: 'insert' | 'update' | 'delete', row: AbpBonusType, oldRow?: AbpBonusType) => void) => 
        this.abp_bonus_typeOps.watch(onChange);
    stopWatchAbpBonusType = () => this.abp_bonus_typeOps.stopWatch();
    // AbpNode operations
    getAllAbpNode = () => this.abp_nodeOps.getAll();
    getAbpNodeById = (id: number) => this.abp_nodeOps.getById(id);
    createAbpNode = (newItem: AbpNodeInsert) => this.abp_nodeOps.create(newItem);
    updateAbpNode = (changes: AbpNodeUpdate) => this.abp_nodeOps.update(changes);
    deleteAbpNode = (id: number) => this.abp_nodeOps.delete(id);
    getAbpNodesByIds = (ids: number[]) => this.abp_nodeOps.getByIds(ids);
    watchAbpNode = (onChange: (type: 'insert' | 'update' | 'delete', row: AbpNode, oldRow?: AbpNode) => void) => 
        this.abp_nodeOps.watch(onChange);
    stopWatchAbpNode = () => this.abp_nodeOps.stopWatch();
    // AbpNodeBonus operations
    getAllAbpNodeBonus = () => this.abp_node_bonusOps.getAll();
    getAbpNodeBonusById = (id: number) => this.abp_node_bonusOps.getById(id);
    createAbpNodeBonus = (newItem: AbpNodeBonusInsert) => this.abp_node_bonusOps.create(newItem);
    updateAbpNodeBonus = (changes: AbpNodeBonusUpdate) => this.abp_node_bonusOps.update(changes);
    deleteAbpNodeBonus = (id: number) => this.abp_node_bonusOps.delete(id);
    getAbpNodeBonussByIds = (ids: number[]) => this.abp_node_bonusOps.getByIds(ids);
    watchAbpNodeBonus = (onChange: (type: 'insert' | 'update' | 'delete', row: AbpNodeBonus, oldRow?: AbpNodeBonus) => void) => 
        this.abp_node_bonusOps.watch(onChange);
    stopWatchAbpNodeBonus = () => this.abp_node_bonusOps.stopWatch();
    // AbpNodeGroup operations
    getAllAbpNodeGroup = () => this.abp_node_groupOps.getAll();
    getAbpNodeGroupById = (id: number) => this.abp_node_groupOps.getById(id);
    createAbpNodeGroup = (newItem: AbpNodeGroupInsert) => this.abp_node_groupOps.create(newItem);
    updateAbpNodeGroup = (changes: AbpNodeGroupUpdate) => this.abp_node_groupOps.update(changes);
    deleteAbpNodeGroup = (id: number) => this.abp_node_groupOps.delete(id);
    getAbpNodeGroupsByIds = (ids: number[]) => this.abp_node_groupOps.getByIds(ids);
    watchAbpNodeGroup = (onChange: (type: 'insert' | 'update' | 'delete', row: AbpNodeGroup, oldRow?: AbpNodeGroup) => void) => 
        this.abp_node_groupOps.watch(onChange);
    stopWatchAbpNodeGroup = () => this.abp_node_groupOps.stopWatch();
    // Ancestry operations
    getAllAncestry = () => this.ancestryOps.getAll();
    getAncestryById = (id: number) => this.ancestryOps.getById(id);
    createAncestry = (newItem: AncestryInsert) => this.ancestryOps.create(newItem);
    updateAncestry = (changes: AncestryUpdate) => this.ancestryOps.update(changes);
    deleteAncestry = (id: number) => this.ancestryOps.delete(id);
    getAncestrysByIds = (ids: number[]) => this.ancestryOps.getByIds(ids);
    watchAncestry = (onChange: (type: 'insert' | 'update' | 'delete', row: Ancestry, oldRow?: Ancestry) => void) => 
        this.ancestryOps.watch(onChange);
    stopWatchAncestry = () => this.ancestryOps.stopWatch();
    // Archetype operations
    getAllArchetype = () => this.archetypeOps.getAll();
    getArchetypeById = (id: number) => this.archetypeOps.getById(id);
    createArchetype = (newItem: ArchetypeInsert) => this.archetypeOps.create(newItem);
    updateArchetype = (changes: ArchetypeUpdate) => this.archetypeOps.update(changes);
    deleteArchetype = (id: number) => this.archetypeOps.delete(id);
    getArchetypesByIds = (ids: number[]) => this.archetypeOps.getByIds(ids);
    watchArchetype = (onChange: (type: 'insert' | 'update' | 'delete', row: Archetype, oldRow?: Archetype) => void) => 
        this.archetypeOps.watch(onChange);
    stopWatchArchetype = () => this.archetypeOps.stopWatch();
    // ArchetypeClassFeature operations
    getAllArchetypeClassFeature = () => this.archetype_class_featureOps.getAll();
    getArchetypeClassFeatureById = (id: number) => this.archetype_class_featureOps.getById(id);
    createArchetypeClassFeature = (newItem: ArchetypeClassFeatureInsert) => this.archetype_class_featureOps.create(newItem);
    updateArchetypeClassFeature = (changes: ArchetypeClassFeatureUpdate) => this.archetype_class_featureOps.update(changes);
    deleteArchetypeClassFeature = (id: number) => this.archetype_class_featureOps.delete(id);
    getArchetypeClassFeaturesByIds = (ids: number[]) => this.archetype_class_featureOps.getByIds(ids);
    watchArchetypeClassFeature = (onChange: (type: 'insert' | 'update' | 'delete', row: ArchetypeClassFeature, oldRow?: ArchetypeClassFeature) => void) => 
        this.archetype_class_featureOps.watch(onChange);
    stopWatchArchetypeClassFeature = () => this.archetype_class_featureOps.stopWatch();
    // Armor operations
    getAllArmor = () => this.armorOps.getAll();
    getArmorById = (id: number) => this.armorOps.getById(id);
    createArmor = (newItem: ArmorInsert) => this.armorOps.create(newItem);
    updateArmor = (changes: ArmorUpdate) => this.armorOps.update(changes);
    deleteArmor = (id: number) => this.armorOps.delete(id);
    getArmorsByIds = (ids: number[]) => this.armorOps.getByIds(ids);
    watchArmor = (onChange: (type: 'insert' | 'update' | 'delete', row: Armor, oldRow?: Armor) => void) => 
        this.armorOps.watch(onChange);
    stopWatchArmor = () => this.armorOps.stopWatch();
    // BonusAttackProgression operations
    getAllBonusAttackProgression = () => this.bonus_attack_progressionOps.getAll();
    getBonusAttackProgressionById = (id: number) => this.bonus_attack_progressionOps.getById(id);
    createBonusAttackProgression = (newItem: BonusAttackProgressionInsert) => this.bonus_attack_progressionOps.create(newItem);
    updateBonusAttackProgression = (changes: BonusAttackProgressionUpdate) => this.bonus_attack_progressionOps.update(changes);
    deleteBonusAttackProgression = (id: number) => this.bonus_attack_progressionOps.delete(id);
    getBonusAttackProgressionsByIds = (ids: number[]) => this.bonus_attack_progressionOps.getByIds(ids);
    watchBonusAttackProgression = (onChange: (type: 'insert' | 'update' | 'delete', row: BonusAttackProgression, oldRow?: BonusAttackProgression) => void) => 
        this.bonus_attack_progressionOps.watch(onChange);
    stopWatchBonusAttackProgression = () => this.bonus_attack_progressionOps.stopWatch();
    // BonusType operations
    getAllBonusType = () => this.bonus_typeOps.getAll();
    getBonusTypeById = (id: number) => this.bonus_typeOps.getById(id);
    createBonusType = (newItem: BonusTypeInsert) => this.bonus_typeOps.create(newItem);
    updateBonusType = (changes: BonusTypeUpdate) => this.bonus_typeOps.update(changes);
    deleteBonusType = (id: number) => this.bonus_typeOps.delete(id);
    getBonusTypesByIds = (ids: number[]) => this.bonus_typeOps.getByIds(ids);
    watchBonusType = (onChange: (type: 'insert' | 'update' | 'delete', row: BonusType, oldRow?: BonusType) => void) => 
        this.bonus_typeOps.watch(onChange);
    stopWatchBonusType = () => this.bonus_typeOps.stopWatch();
    // Class operations
    getAllClass = () => this.classOps.getAll();
    getClassById = (id: number) => this.classOps.getById(id);
    createClass = (newItem: ClassInsert) => this.classOps.create(newItem);
    updateClass = (changes: ClassUpdate) => this.classOps.update(changes);
    deleteClass = (id: number) => this.classOps.delete(id);
    getClasssByIds = (ids: number[]) => this.classOps.getByIds(ids);
    watchClass = (onChange: (type: 'insert' | 'update' | 'delete', row: Class, oldRow?: Class) => void) => 
        this.classOps.watch(onChange);
    stopWatchClass = () => this.classOps.stopWatch();
    // ClassFeature operations
    getAllClassFeature = () => this.class_featureOps.getAll();
    getClassFeatureById = (id: number) => this.class_featureOps.getById(id);
    createClassFeature = (newItem: ClassFeatureInsert) => this.class_featureOps.create(newItem);
    updateClassFeature = (changes: ClassFeatureUpdate) => this.class_featureOps.update(changes);
    deleteClassFeature = (id: number) => this.class_featureOps.delete(id);
    getClassFeaturesByIds = (ids: number[]) => this.class_featureOps.getByIds(ids);
    watchClassFeature = (onChange: (type: 'insert' | 'update' | 'delete', row: ClassFeature, oldRow?: ClassFeature) => void) => 
        this.class_featureOps.watch(onChange);
    stopWatchClassFeature = () => this.class_featureOps.stopWatch();
    // ClassFeatureBenefit operations
    getAllClassFeatureBenefit = () => this.class_feature_benefitOps.getAll();
    getClassFeatureBenefitById = (id: number) => this.class_feature_benefitOps.getById(id);
    createClassFeatureBenefit = (newItem: ClassFeatureBenefitInsert) => this.class_feature_benefitOps.create(newItem);
    updateClassFeatureBenefit = (changes: ClassFeatureBenefitUpdate) => this.class_feature_benefitOps.update(changes);
    deleteClassFeatureBenefit = (id: number) => this.class_feature_benefitOps.delete(id);
    getClassFeatureBenefitsByIds = (ids: number[]) => this.class_feature_benefitOps.getByIds(ids);
    watchClassFeatureBenefit = (onChange: (type: 'insert' | 'update' | 'delete', row: ClassFeatureBenefit, oldRow?: ClassFeatureBenefit) => void) => 
        this.class_feature_benefitOps.watch(onChange);
    stopWatchClassFeatureBenefit = () => this.class_feature_benefitOps.stopWatch();
    // ClassSkill operations
    getAllClassSkill = () => this.class_skillOps.getAll();
    getClassSkillById = (id: number) => this.class_skillOps.getById(id);
    createClassSkill = (newItem: ClassSkillInsert) => this.class_skillOps.create(newItem);
    updateClassSkill = (changes: ClassSkillUpdate) => this.class_skillOps.update(changes);
    deleteClassSkill = (id: number) => this.class_skillOps.delete(id);
    getClassSkillsByIds = (ids: number[]) => this.class_skillOps.getByIds(ids);
    watchClassSkill = (onChange: (type: 'insert' | 'update' | 'delete', row: ClassSkill, oldRow?: ClassSkill) => void) => 
        this.class_skillOps.watch(onChange);
    stopWatchClassSkill = () => this.class_skillOps.stopWatch();
    // Consumable operations
    getAllConsumable = () => this.consumableOps.getAll();
    getConsumableById = (id: number) => this.consumableOps.getById(id);
    createConsumable = (newItem: ConsumableInsert) => this.consumableOps.create(newItem);
    updateConsumable = (changes: ConsumableUpdate) => this.consumableOps.update(changes);
    deleteConsumable = (id: number) => this.consumableOps.delete(id);
    getConsumablesByIds = (ids: number[]) => this.consumableOps.getByIds(ids);
    watchConsumable = (onChange: (type: 'insert' | 'update' | 'delete', row: Consumable, oldRow?: Consumable) => void) => 
        this.consumableOps.watch(onChange);
    stopWatchConsumable = () => this.consumableOps.stopWatch();
    // Corruption operations
    getAllCorruption = () => this.corruptionOps.getAll();
    getCorruptionById = (id: number) => this.corruptionOps.getById(id);
    createCorruption = (newItem: CorruptionInsert) => this.corruptionOps.create(newItem);
    updateCorruption = (changes: CorruptionUpdate) => this.corruptionOps.update(changes);
    deleteCorruption = (id: number) => this.corruptionOps.delete(id);
    getCorruptionsByIds = (ids: number[]) => this.corruptionOps.getByIds(ids);
    watchCorruption = (onChange: (type: 'insert' | 'update' | 'delete', row: Corruption, oldRow?: Corruption) => void) => 
        this.corruptionOps.watch(onChange);
    stopWatchCorruption = () => this.corruptionOps.stopWatch();
    // CorruptionManifestation operations
    getAllCorruptionManifestation = () => this.corruption_manifestationOps.getAll();
    getCorruptionManifestationById = (id: number) => this.corruption_manifestationOps.getById(id);
    createCorruptionManifestation = (newItem: CorruptionManifestationInsert) => this.corruption_manifestationOps.create(newItem);
    updateCorruptionManifestation = (changes: CorruptionManifestationUpdate) => this.corruption_manifestationOps.update(changes);
    deleteCorruptionManifestation = (id: number) => this.corruption_manifestationOps.delete(id);
    getCorruptionManifestationsByIds = (ids: number[]) => this.corruption_manifestationOps.getByIds(ids);
    watchCorruptionManifestation = (onChange: (type: 'insert' | 'update' | 'delete', row: CorruptionManifestation, oldRow?: CorruptionManifestation) => void) => 
        this.corruption_manifestationOps.watch(onChange);
    stopWatchCorruptionManifestation = () => this.corruption_manifestationOps.stopWatch();
    // Discovery operations
    getAllDiscovery = () => this.discoveryOps.getAll();
    getDiscoveryById = (id: number) => this.discoveryOps.getById(id);
    createDiscovery = (newItem: DiscoveryInsert) => this.discoveryOps.create(newItem);
    updateDiscovery = (changes: DiscoveryUpdate) => this.discoveryOps.update(changes);
    deleteDiscovery = (id: number) => this.discoveryOps.delete(id);
    getDiscoverysByIds = (ids: number[]) => this.discoveryOps.getByIds(ids);
    watchDiscovery = (onChange: (type: 'insert' | 'update' | 'delete', row: Discovery, oldRow?: Discovery) => void) => 
        this.discoveryOps.watch(onChange);
    stopWatchDiscovery = () => this.discoveryOps.stopWatch();
    // Element operations
    getAllElement = () => this.elementOps.getAll();
    getElementById = (id: number) => this.elementOps.getById(id);
    createElement = (newItem: ElementInsert) => this.elementOps.create(newItem);
    updateElement = (changes: ElementUpdate) => this.elementOps.update(changes);
    deleteElement = (id: number) => this.elementOps.delete(id);
    getElementsByIds = (ids: number[]) => this.elementOps.getByIds(ids);
    watchElement = (onChange: (type: 'insert' | 'update' | 'delete', row: Element, oldRow?: Element) => void) => 
        this.elementOps.watch(onChange);
    stopWatchElement = () => this.elementOps.stopWatch();
    // Equipment operations
    getAllEquipment = () => this.equipmentOps.getAll();
    getEquipmentById = (id: number) => this.equipmentOps.getById(id);
    createEquipment = (newItem: EquipmentInsert) => this.equipmentOps.create(newItem);
    updateEquipment = (changes: EquipmentUpdate) => this.equipmentOps.update(changes);
    deleteEquipment = (id: number) => this.equipmentOps.delete(id);
    getEquipmentsByIds = (ids: number[]) => this.equipmentOps.getByIds(ids);
    watchEquipment = (onChange: (type: 'insert' | 'update' | 'delete', row: Equipment, oldRow?: Equipment) => void) => 
        this.equipmentOps.watch(onChange);
    stopWatchEquipment = () => this.equipmentOps.stopWatch();
    // FavoredClassChoice operations
    getAllFavoredClassChoice = () => this.favored_class_choiceOps.getAll();
    getFavoredClassChoiceById = (id: number) => this.favored_class_choiceOps.getById(id);
    createFavoredClassChoice = (newItem: FavoredClassChoiceInsert) => this.favored_class_choiceOps.create(newItem);
    updateFavoredClassChoice = (changes: FavoredClassChoiceUpdate) => this.favored_class_choiceOps.update(changes);
    deleteFavoredClassChoice = (id: number) => this.favored_class_choiceOps.delete(id);
    getFavoredClassChoicesByIds = (ids: number[]) => this.favored_class_choiceOps.getByIds(ids);
    watchFavoredClassChoice = (onChange: (type: 'insert' | 'update' | 'delete', row: FavoredClassChoice, oldRow?: FavoredClassChoice) => void) => 
        this.favored_class_choiceOps.watch(onChange);
    stopWatchFavoredClassChoice = () => this.favored_class_choiceOps.stopWatch();
    // Feat operations
    getAllFeat = () => this.featOps.getAll();
    getFeatById = (id: number) => this.featOps.getById(id);
    createFeat = (newItem: FeatInsert) => this.featOps.create(newItem);
    updateFeat = (changes: FeatUpdate) => this.featOps.update(changes);
    deleteFeat = (id: number) => this.featOps.delete(id);
    getFeatsByIds = (ids: number[]) => this.featOps.getByIds(ids);
    watchFeat = (onChange: (type: 'insert' | 'update' | 'delete', row: Feat, oldRow?: Feat) => void) => 
        this.featOps.watch(onChange);
    stopWatchFeat = () => this.featOps.stopWatch();
    // FeatBenefit operations
    getAllFeatBenefit = () => this.feat_benefitOps.getAll();
    getFeatBenefitById = (id: number) => this.feat_benefitOps.getById(id);
    createFeatBenefit = (newItem: FeatBenefitInsert) => this.feat_benefitOps.create(newItem);
    updateFeatBenefit = (changes: FeatBenefitUpdate) => this.feat_benefitOps.update(changes);
    deleteFeatBenefit = (id: number) => this.feat_benefitOps.delete(id);
    getFeatBenefitsByIds = (ids: number[]) => this.feat_benefitOps.getByIds(ids);
    watchFeatBenefit = (onChange: (type: 'insert' | 'update' | 'delete', row: FeatBenefit, oldRow?: FeatBenefit) => void) => 
        this.feat_benefitOps.watch(onChange);
    stopWatchFeatBenefit = () => this.feat_benefitOps.stopWatch();
    // FulfillmentQualificationMapping operations
    getAllFulfillmentQualificationMapping = () => this.fulfillment_qualification_mappingOps.getAll();
    getFulfillmentQualificationMappingById = (id: number) => this.fulfillment_qualification_mappingOps.getById(id);
    createFulfillmentQualificationMapping = (newItem: FulfillmentQualificationMappingInsert) => this.fulfillment_qualification_mappingOps.create(newItem);
    updateFulfillmentQualificationMapping = (changes: FulfillmentQualificationMappingUpdate) => this.fulfillment_qualification_mappingOps.update(changes);
    deleteFulfillmentQualificationMapping = (id: number) => this.fulfillment_qualification_mappingOps.delete(id);
    getFulfillmentQualificationMappingsByIds = (ids: number[]) => this.fulfillment_qualification_mappingOps.getByIds(ids);
    watchFulfillmentQualificationMapping = (onChange: (type: 'insert' | 'update' | 'delete', row: FulfillmentQualificationMapping, oldRow?: FulfillmentQualificationMapping) => void) => 
        this.fulfillment_qualification_mappingOps.watch(onChange);
    stopWatchFulfillmentQualificationMapping = () => this.fulfillment_qualification_mappingOps.stopWatch();
    // GameCharacter operations
    getAllGameCharacter = () => this.game_characterOps.getAll();
    getGameCharacterById = (id: number) => this.game_characterOps.getById(id);
    createGameCharacter = (newItem: GameCharacterInsert) => this.game_characterOps.create(newItem);
    updateGameCharacter = (changes: GameCharacterUpdate) => this.game_characterOps.update(changes);
    deleteGameCharacter = (id: number) => this.game_characterOps.delete(id);
    getGameCharactersByIds = (ids: number[]) => this.game_characterOps.getByIds(ids);
    watchGameCharacter = (onChange: (type: 'insert' | 'update' | 'delete', row: GameCharacter, oldRow?: GameCharacter) => void) => 
        this.game_characterOps.watch(onChange);
    stopWatchGameCharacter = () => this.game_characterOps.stopWatch();
    // GameCharacterAbility operations
    getAllGameCharacterAbility = () => this.game_character_abilityOps.getAll();
    getGameCharacterAbilityById = (id: number) => this.game_character_abilityOps.getById(id);
    createGameCharacterAbility = (newItem: GameCharacterAbilityInsert) => this.game_character_abilityOps.create(newItem);
    updateGameCharacterAbility = (changes: GameCharacterAbilityUpdate) => this.game_character_abilityOps.update(changes);
    deleteGameCharacterAbility = (id: number) => this.game_character_abilityOps.delete(id);
    getGameCharacterAbilitysByIds = (ids: number[]) => this.game_character_abilityOps.getByIds(ids);
    watchGameCharacterAbility = (onChange: (type: 'insert' | 'update' | 'delete', row: GameCharacterAbility, oldRow?: GameCharacterAbility) => void) => 
        this.game_character_abilityOps.watch(onChange);
    stopWatchGameCharacterAbility = () => this.game_character_abilityOps.stopWatch();
    // GameCharacterAbpChoice operations
    getAllGameCharacterAbpChoice = () => this.game_character_abp_choiceOps.getAll();
    getGameCharacterAbpChoiceById = (id: number) => this.game_character_abp_choiceOps.getById(id);
    createGameCharacterAbpChoice = (newItem: GameCharacterAbpChoiceInsert) => this.game_character_abp_choiceOps.create(newItem);
    updateGameCharacterAbpChoice = (changes: GameCharacterAbpChoiceUpdate) => this.game_character_abp_choiceOps.update(changes);
    deleteGameCharacterAbpChoice = (id: number) => this.game_character_abp_choiceOps.delete(id);
    getGameCharacterAbpChoicesByIds = (ids: number[]) => this.game_character_abp_choiceOps.getByIds(ids);
    watchGameCharacterAbpChoice = (onChange: (type: 'insert' | 'update' | 'delete', row: GameCharacterAbpChoice, oldRow?: GameCharacterAbpChoice) => void) => 
        this.game_character_abp_choiceOps.watch(onChange);
    stopWatchGameCharacterAbpChoice = () => this.game_character_abp_choiceOps.stopWatch();
    // GameCharacterAncestry operations
    getAllGameCharacterAncestry = () => this.game_character_ancestryOps.getAll();
    getGameCharacterAncestryById = (id: number) => this.game_character_ancestryOps.getById(id);
    createGameCharacterAncestry = (newItem: GameCharacterAncestryInsert) => this.game_character_ancestryOps.create(newItem);
    updateGameCharacterAncestry = (changes: GameCharacterAncestryUpdate) => this.game_character_ancestryOps.update(changes);
    deleteGameCharacterAncestry = (id: number) => this.game_character_ancestryOps.delete(id);
    getGameCharacterAncestrysByIds = (ids: number[]) => this.game_character_ancestryOps.getByIds(ids);
    watchGameCharacterAncestry = (onChange: (type: 'insert' | 'update' | 'delete', row: GameCharacterAncestry, oldRow?: GameCharacterAncestry) => void) => 
        this.game_character_ancestryOps.watch(onChange);
    stopWatchGameCharacterAncestry = () => this.game_character_ancestryOps.stopWatch();
    // GameCharacterArchetype operations
    getAllGameCharacterArchetype = () => this.game_character_archetypeOps.getAll();
    getGameCharacterArchetypeById = (id: number) => this.game_character_archetypeOps.getById(id);
    createGameCharacterArchetype = (newItem: GameCharacterArchetypeInsert) => this.game_character_archetypeOps.create(newItem);
    updateGameCharacterArchetype = (changes: GameCharacterArchetypeUpdate) => this.game_character_archetypeOps.update(changes);
    deleteGameCharacterArchetype = (id: number) => this.game_character_archetypeOps.delete(id);
    getGameCharacterArchetypesByIds = (ids: number[]) => this.game_character_archetypeOps.getByIds(ids);
    watchGameCharacterArchetype = (onChange: (type: 'insert' | 'update' | 'delete', row: GameCharacterArchetype, oldRow?: GameCharacterArchetype) => void) => 
        this.game_character_archetypeOps.watch(onChange);
    stopWatchGameCharacterArchetype = () => this.game_character_archetypeOps.stopWatch();
    // GameCharacterArmor operations
    getAllGameCharacterArmor = () => this.game_character_armorOps.getAll();
    getGameCharacterArmorById = (id: number) => this.game_character_armorOps.getById(id);
    createGameCharacterArmor = (newItem: GameCharacterArmorInsert) => this.game_character_armorOps.create(newItem);
    updateGameCharacterArmor = (changes: GameCharacterArmorUpdate) => this.game_character_armorOps.update(changes);
    deleteGameCharacterArmor = (id: number) => this.game_character_armorOps.delete(id);
    getGameCharacterArmorsByIds = (ids: number[]) => this.game_character_armorOps.getByIds(ids);
    watchGameCharacterArmor = (onChange: (type: 'insert' | 'update' | 'delete', row: GameCharacterArmor, oldRow?: GameCharacterArmor) => void) => 
        this.game_character_armorOps.watch(onChange);
    stopWatchGameCharacterArmor = () => this.game_character_armorOps.stopWatch();
    // GameCharacterClass operations
    getAllGameCharacterClass = () => this.game_character_classOps.getAll();
    getGameCharacterClassById = (id: number) => this.game_character_classOps.getById(id);
    createGameCharacterClass = (newItem: GameCharacterClassInsert) => this.game_character_classOps.create(newItem);
    updateGameCharacterClass = (changes: GameCharacterClassUpdate) => this.game_character_classOps.update(changes);
    deleteGameCharacterClass = (id: number) => this.game_character_classOps.delete(id);
    getGameCharacterClasssByIds = (ids: number[]) => this.game_character_classOps.getByIds(ids);
    watchGameCharacterClass = (onChange: (type: 'insert' | 'update' | 'delete', row: GameCharacterClass, oldRow?: GameCharacterClass) => void) => 
        this.game_character_classOps.watch(onChange);
    stopWatchGameCharacterClass = () => this.game_character_classOps.stopWatch();
    // GameCharacterClassFeature operations
    getAllGameCharacterClassFeature = () => this.game_character_class_featureOps.getAll();
    getGameCharacterClassFeatureById = (id: number) => this.game_character_class_featureOps.getById(id);
    createGameCharacterClassFeature = (newItem: GameCharacterClassFeatureInsert) => this.game_character_class_featureOps.create(newItem);
    updateGameCharacterClassFeature = (changes: GameCharacterClassFeatureUpdate) => this.game_character_class_featureOps.update(changes);
    deleteGameCharacterClassFeature = (id: number) => this.game_character_class_featureOps.delete(id);
    getGameCharacterClassFeaturesByIds = (ids: number[]) => this.game_character_class_featureOps.getByIds(ids);
    watchGameCharacterClassFeature = (onChange: (type: 'insert' | 'update' | 'delete', row: GameCharacterClassFeature, oldRow?: GameCharacterClassFeature) => void) => 
        this.game_character_class_featureOps.watch(onChange);
    stopWatchGameCharacterClassFeature = () => this.game_character_class_featureOps.stopWatch();
    // GameCharacterConsumable operations
    getAllGameCharacterConsumable = () => this.game_character_consumableOps.getAll();
    getGameCharacterConsumableById = (id: number) => this.game_character_consumableOps.getById(id);
    createGameCharacterConsumable = (newItem: GameCharacterConsumableInsert) => this.game_character_consumableOps.create(newItem);
    updateGameCharacterConsumable = (changes: GameCharacterConsumableUpdate) => this.game_character_consumableOps.update(changes);
    deleteGameCharacterConsumable = (id: number) => this.game_character_consumableOps.delete(id);
    getGameCharacterConsumablesByIds = (ids: number[]) => this.game_character_consumableOps.getByIds(ids);
    watchGameCharacterConsumable = (onChange: (type: 'insert' | 'update' | 'delete', row: GameCharacterConsumable, oldRow?: GameCharacterConsumable) => void) => 
        this.game_character_consumableOps.watch(onChange);
    stopWatchGameCharacterConsumable = () => this.game_character_consumableOps.stopWatch();
    // GameCharacterCorruption operations
    getAllGameCharacterCorruption = () => this.game_character_corruptionOps.getAll();
    getGameCharacterCorruptionById = (id: number) => this.game_character_corruptionOps.getById(id);
    createGameCharacterCorruption = (newItem: GameCharacterCorruptionInsert) => this.game_character_corruptionOps.create(newItem);
    updateGameCharacterCorruption = (changes: GameCharacterCorruptionUpdate) => this.game_character_corruptionOps.update(changes);
    deleteGameCharacterCorruption = (id: number) => this.game_character_corruptionOps.delete(id);
    getGameCharacterCorruptionsByIds = (ids: number[]) => this.game_character_corruptionOps.getByIds(ids);
    watchGameCharacterCorruption = (onChange: (type: 'insert' | 'update' | 'delete', row: GameCharacterCorruption, oldRow?: GameCharacterCorruption) => void) => 
        this.game_character_corruptionOps.watch(onChange);
    stopWatchGameCharacterCorruption = () => this.game_character_corruptionOps.stopWatch();
    // GameCharacterCorruptionManifestation operations
    getAllGameCharacterCorruptionManifestation = () => this.game_character_corruption_manifestationOps.getAll();
    getGameCharacterCorruptionManifestationById = (id: number) => this.game_character_corruption_manifestationOps.getById(id);
    createGameCharacterCorruptionManifestation = (newItem: GameCharacterCorruptionManifestationInsert) => this.game_character_corruption_manifestationOps.create(newItem);
    updateGameCharacterCorruptionManifestation = (changes: GameCharacterCorruptionManifestationUpdate) => this.game_character_corruption_manifestationOps.update(changes);
    deleteGameCharacterCorruptionManifestation = (id: number) => this.game_character_corruption_manifestationOps.delete(id);
    getGameCharacterCorruptionManifestationsByIds = (ids: number[]) => this.game_character_corruption_manifestationOps.getByIds(ids);
    watchGameCharacterCorruptionManifestation = (onChange: (type: 'insert' | 'update' | 'delete', row: GameCharacterCorruptionManifestation, oldRow?: GameCharacterCorruptionManifestation) => void) => 
        this.game_character_corruption_manifestationOps.watch(onChange);
    stopWatchGameCharacterCorruptionManifestation = () => this.game_character_corruption_manifestationOps.stopWatch();
    // GameCharacterDiscovery operations
    getAllGameCharacterDiscovery = () => this.game_character_discoveryOps.getAll();
    getGameCharacterDiscoveryById = (id: number) => this.game_character_discoveryOps.getById(id);
    createGameCharacterDiscovery = (newItem: GameCharacterDiscoveryInsert) => this.game_character_discoveryOps.create(newItem);
    updateGameCharacterDiscovery = (changes: GameCharacterDiscoveryUpdate) => this.game_character_discoveryOps.update(changes);
    deleteGameCharacterDiscovery = (id: number) => this.game_character_discoveryOps.delete(id);
    getGameCharacterDiscoverysByIds = (ids: number[]) => this.game_character_discoveryOps.getByIds(ids);
    watchGameCharacterDiscovery = (onChange: (type: 'insert' | 'update' | 'delete', row: GameCharacterDiscovery, oldRow?: GameCharacterDiscovery) => void) => 
        this.game_character_discoveryOps.watch(onChange);
    stopWatchGameCharacterDiscovery = () => this.game_character_discoveryOps.stopWatch();
    // GameCharacterEquipment operations
    getAllGameCharacterEquipment = () => this.game_character_equipmentOps.getAll();
    getGameCharacterEquipmentById = (id: number) => this.game_character_equipmentOps.getById(id);
    createGameCharacterEquipment = (newItem: GameCharacterEquipmentInsert) => this.game_character_equipmentOps.create(newItem);
    updateGameCharacterEquipment = (changes: GameCharacterEquipmentUpdate) => this.game_character_equipmentOps.update(changes);
    deleteGameCharacterEquipment = (id: number) => this.game_character_equipmentOps.delete(id);
    getGameCharacterEquipmentsByIds = (ids: number[]) => this.game_character_equipmentOps.getByIds(ids);
    watchGameCharacterEquipment = (onChange: (type: 'insert' | 'update' | 'delete', row: GameCharacterEquipment, oldRow?: GameCharacterEquipment) => void) => 
        this.game_character_equipmentOps.watch(onChange);
    stopWatchGameCharacterEquipment = () => this.game_character_equipmentOps.stopWatch();
    // GameCharacterFavoredClassBonus operations
    getAllGameCharacterFavoredClassBonus = () => this.game_character_favored_class_bonusOps.getAll();
    getGameCharacterFavoredClassBonusById = (id: number) => this.game_character_favored_class_bonusOps.getById(id);
    createGameCharacterFavoredClassBonus = (newItem: GameCharacterFavoredClassBonusInsert) => this.game_character_favored_class_bonusOps.create(newItem);
    updateGameCharacterFavoredClassBonus = (changes: GameCharacterFavoredClassBonusUpdate) => this.game_character_favored_class_bonusOps.update(changes);
    deleteGameCharacterFavoredClassBonus = (id: number) => this.game_character_favored_class_bonusOps.delete(id);
    getGameCharacterFavoredClassBonussByIds = (ids: number[]) => this.game_character_favored_class_bonusOps.getByIds(ids);
    watchGameCharacterFavoredClassBonus = (onChange: (type: 'insert' | 'update' | 'delete', row: GameCharacterFavoredClassBonus, oldRow?: GameCharacterFavoredClassBonus) => void) => 
        this.game_character_favored_class_bonusOps.watch(onChange);
    stopWatchGameCharacterFavoredClassBonus = () => this.game_character_favored_class_bonusOps.stopWatch();
    // GameCharacterFeat operations
    getAllGameCharacterFeat = () => this.game_character_featOps.getAll();
    getGameCharacterFeatById = (id: number) => this.game_character_featOps.getById(id);
    createGameCharacterFeat = (newItem: GameCharacterFeatInsert) => this.game_character_featOps.create(newItem);
    updateGameCharacterFeat = (changes: GameCharacterFeatUpdate) => this.game_character_featOps.update(changes);
    deleteGameCharacterFeat = (id: number) => this.game_character_featOps.delete(id);
    getGameCharacterFeatsByIds = (ids: number[]) => this.game_character_featOps.getByIds(ids);
    watchGameCharacterFeat = (onChange: (type: 'insert' | 'update' | 'delete', row: GameCharacterFeat, oldRow?: GameCharacterFeat) => void) => 
        this.game_character_featOps.watch(onChange);
    stopWatchGameCharacterFeat = () => this.game_character_featOps.stopWatch();
    // GameCharacterSkillRank operations
    getAllGameCharacterSkillRank = () => this.game_character_skill_rankOps.getAll();
    getGameCharacterSkillRankById = (id: number) => this.game_character_skill_rankOps.getById(id);
    createGameCharacterSkillRank = (newItem: GameCharacterSkillRankInsert) => this.game_character_skill_rankOps.create(newItem);
    updateGameCharacterSkillRank = (changes: GameCharacterSkillRankUpdate) => this.game_character_skill_rankOps.update(changes);
    deleteGameCharacterSkillRank = (id: number) => this.game_character_skill_rankOps.delete(id);
    getGameCharacterSkillRanksByIds = (ids: number[]) => this.game_character_skill_rankOps.getByIds(ids);
    watchGameCharacterSkillRank = (onChange: (type: 'insert' | 'update' | 'delete', row: GameCharacterSkillRank, oldRow?: GameCharacterSkillRank) => void) => 
        this.game_character_skill_rankOps.watch(onChange);
    stopWatchGameCharacterSkillRank = () => this.game_character_skill_rankOps.stopWatch();
    // GameCharacterSpell operations
    getAllGameCharacterSpell = () => this.game_character_spellOps.getAll();
    getGameCharacterSpellById = (id: number) => this.game_character_spellOps.getById(id);
    createGameCharacterSpell = (newItem: GameCharacterSpellInsert) => this.game_character_spellOps.create(newItem);
    updateGameCharacterSpell = (changes: GameCharacterSpellUpdate) => this.game_character_spellOps.update(changes);
    deleteGameCharacterSpell = (id: number) => this.game_character_spellOps.delete(id);
    getGameCharacterSpellsByIds = (ids: number[]) => this.game_character_spellOps.getByIds(ids);
    watchGameCharacterSpell = (onChange: (type: 'insert' | 'update' | 'delete', row: GameCharacterSpell, oldRow?: GameCharacterSpell) => void) => 
        this.game_character_spellOps.watch(onChange);
    stopWatchGameCharacterSpell = () => this.game_character_spellOps.stopWatch();
    // GameCharacterTrait operations
    getAllGameCharacterTrait = () => this.game_character_traitOps.getAll();
    getGameCharacterTraitById = (id: number) => this.game_character_traitOps.getById(id);
    createGameCharacterTrait = (newItem: GameCharacterTraitInsert) => this.game_character_traitOps.create(newItem);
    updateGameCharacterTrait = (changes: GameCharacterTraitUpdate) => this.game_character_traitOps.update(changes);
    deleteGameCharacterTrait = (id: number) => this.game_character_traitOps.delete(id);
    getGameCharacterTraitsByIds = (ids: number[]) => this.game_character_traitOps.getByIds(ids);
    watchGameCharacterTrait = (onChange: (type: 'insert' | 'update' | 'delete', row: GameCharacterTrait, oldRow?: GameCharacterTrait) => void) => 
        this.game_character_traitOps.watch(onChange);
    stopWatchGameCharacterTrait = () => this.game_character_traitOps.stopWatch();
    // GameCharacterWeapon operations
    getAllGameCharacterWeapon = () => this.game_character_weaponOps.getAll();
    getGameCharacterWeaponById = (id: number) => this.game_character_weaponOps.getById(id);
    createGameCharacterWeapon = (newItem: GameCharacterWeaponInsert) => this.game_character_weaponOps.create(newItem);
    updateGameCharacterWeapon = (changes: GameCharacterWeaponUpdate) => this.game_character_weaponOps.update(changes);
    deleteGameCharacterWeapon = (id: number) => this.game_character_weaponOps.delete(id);
    getGameCharacterWeaponsByIds = (ids: number[]) => this.game_character_weaponOps.getByIds(ids);
    watchGameCharacterWeapon = (onChange: (type: 'insert' | 'update' | 'delete', row: GameCharacterWeapon, oldRow?: GameCharacterWeapon) => void) => 
        this.game_character_weaponOps.watch(onChange);
    stopWatchGameCharacterWeapon = () => this.game_character_weaponOps.stopWatch();
    // GameCharacterWildTalent operations
    getAllGameCharacterWildTalent = () => this.game_character_wild_talentOps.getAll();
    getGameCharacterWildTalentById = (id: number) => this.game_character_wild_talentOps.getById(id);
    createGameCharacterWildTalent = (newItem: GameCharacterWildTalentInsert) => this.game_character_wild_talentOps.create(newItem);
    updateGameCharacterWildTalent = (changes: GameCharacterWildTalentUpdate) => this.game_character_wild_talentOps.update(changes);
    deleteGameCharacterWildTalent = (id: number) => this.game_character_wild_talentOps.delete(id);
    getGameCharacterWildTalentsByIds = (ids: number[]) => this.game_character_wild_talentOps.getByIds(ids);
    watchGameCharacterWildTalent = (onChange: (type: 'insert' | 'update' | 'delete', row: GameCharacterWildTalent, oldRow?: GameCharacterWildTalent) => void) => 
        this.game_character_wild_talentOps.watch(onChange);
    stopWatchGameCharacterWildTalent = () => this.game_character_wild_talentOps.stopWatch();
    // LegendaryGiftType operations
    getAllLegendaryGiftType = () => this.legendary_gift_typeOps.getAll();
    getLegendaryGiftTypeById = (id: number) => this.legendary_gift_typeOps.getById(id);
    createLegendaryGiftType = (newItem: LegendaryGiftTypeInsert) => this.legendary_gift_typeOps.create(newItem);
    updateLegendaryGiftType = (changes: LegendaryGiftTypeUpdate) => this.legendary_gift_typeOps.update(changes);
    deleteLegendaryGiftType = (id: number) => this.legendary_gift_typeOps.delete(id);
    getLegendaryGiftTypesByIds = (ids: number[]) => this.legendary_gift_typeOps.getByIds(ids);
    watchLegendaryGiftType = (onChange: (type: 'insert' | 'update' | 'delete', row: LegendaryGiftType, oldRow?: LegendaryGiftType) => void) => 
        this.legendary_gift_typeOps.watch(onChange);
    stopWatchLegendaryGiftType = () => this.legendary_gift_typeOps.stopWatch();
    // MonkUnchainedKiPower operations
    getAllMonkUnchainedKiPower = () => this.monk_unchained_ki_powerOps.getAll();
    getMonkUnchainedKiPowerById = (id: number) => this.monk_unchained_ki_powerOps.getById(id);
    createMonkUnchainedKiPower = (newItem: MonkUnchainedKiPowerInsert) => this.monk_unchained_ki_powerOps.create(newItem);
    updateMonkUnchainedKiPower = (changes: MonkUnchainedKiPowerUpdate) => this.monk_unchained_ki_powerOps.update(changes);
    deleteMonkUnchainedKiPower = (id: number) => this.monk_unchained_ki_powerOps.delete(id);
    getMonkUnchainedKiPowersByIds = (ids: number[]) => this.monk_unchained_ki_powerOps.getByIds(ids);
    watchMonkUnchainedKiPower = (onChange: (type: 'insert' | 'update' | 'delete', row: MonkUnchainedKiPower, oldRow?: MonkUnchainedKiPower) => void) => 
        this.monk_unchained_ki_powerOps.watch(onChange);
    stopWatchMonkUnchainedKiPower = () => this.monk_unchained_ki_powerOps.stopWatch();
    // PrerequisiteFulfillment operations
    getAllPrerequisiteFulfillment = () => this.prerequisite_fulfillmentOps.getAll();
    getPrerequisiteFulfillmentById = (id: number) => this.prerequisite_fulfillmentOps.getById(id);
    createPrerequisiteFulfillment = (newItem: PrerequisiteFulfillmentInsert) => this.prerequisite_fulfillmentOps.create(newItem);
    updatePrerequisiteFulfillment = (changes: PrerequisiteFulfillmentUpdate) => this.prerequisite_fulfillmentOps.update(changes);
    deletePrerequisiteFulfillment = (id: number) => this.prerequisite_fulfillmentOps.delete(id);
    getPrerequisiteFulfillmentsByIds = (ids: number[]) => this.prerequisite_fulfillmentOps.getByIds(ids);
    watchPrerequisiteFulfillment = (onChange: (type: 'insert' | 'update' | 'delete', row: PrerequisiteFulfillment, oldRow?: PrerequisiteFulfillment) => void) => 
        this.prerequisite_fulfillmentOps.watch(onChange);
    stopWatchPrerequisiteFulfillment = () => this.prerequisite_fulfillmentOps.stopWatch();
    // PrerequisiteRequirement operations
    getAllPrerequisiteRequirement = () => this.prerequisite_requirementOps.getAll();
    getPrerequisiteRequirementById = (id: number) => this.prerequisite_requirementOps.getById(id);
    createPrerequisiteRequirement = (newItem: PrerequisiteRequirementInsert) => this.prerequisite_requirementOps.create(newItem);
    updatePrerequisiteRequirement = (changes: PrerequisiteRequirementUpdate) => this.prerequisite_requirementOps.update(changes);
    deletePrerequisiteRequirement = (id: number) => this.prerequisite_requirementOps.delete(id);
    getPrerequisiteRequirementsByIds = (ids: number[]) => this.prerequisite_requirementOps.getByIds(ids);
    watchPrerequisiteRequirement = (onChange: (type: 'insert' | 'update' | 'delete', row: PrerequisiteRequirement, oldRow?: PrerequisiteRequirement) => void) => 
        this.prerequisite_requirementOps.watch(onChange);
    stopWatchPrerequisiteRequirement = () => this.prerequisite_requirementOps.stopWatch();
    // PrerequisiteRequirementFulfillmentMapping operations
    getAllPrerequisiteRequirementFulfillmentMapping = () => this.prerequisite_requirement_fulfillment_mappingOps.getAll();
    getPrerequisiteRequirementFulfillmentMappingById = (id: number) => this.prerequisite_requirement_fulfillment_mappingOps.getById(id);
    createPrerequisiteRequirementFulfillmentMapping = (newItem: PrerequisiteRequirementFulfillmentMappingInsert) => this.prerequisite_requirement_fulfillment_mappingOps.create(newItem);
    updatePrerequisiteRequirementFulfillmentMapping = (changes: PrerequisiteRequirementFulfillmentMappingUpdate) => this.prerequisite_requirement_fulfillment_mappingOps.update(changes);
    deletePrerequisiteRequirementFulfillmentMapping = (id: number) => this.prerequisite_requirement_fulfillment_mappingOps.delete(id);
    getPrerequisiteRequirementFulfillmentMappingsByIds = (ids: number[]) => this.prerequisite_requirement_fulfillment_mappingOps.getByIds(ids);
    watchPrerequisiteRequirementFulfillmentMapping = (onChange: (type: 'insert' | 'update' | 'delete', row: PrerequisiteRequirementFulfillmentMapping, oldRow?: PrerequisiteRequirementFulfillmentMapping) => void) => 
        this.prerequisite_requirement_fulfillment_mappingOps.watch(onChange);
    stopWatchPrerequisiteRequirementFulfillmentMapping = () => this.prerequisite_requirement_fulfillment_mappingOps.stopWatch();
    // PrerequisiteRequirementType operations
    getAllPrerequisiteRequirementType = () => this.prerequisite_requirement_typeOps.getAll();
    getPrerequisiteRequirementTypeById = (id: number) => this.prerequisite_requirement_typeOps.getById(id);
    createPrerequisiteRequirementType = (newItem: PrerequisiteRequirementTypeInsert) => this.prerequisite_requirement_typeOps.create(newItem);
    updatePrerequisiteRequirementType = (changes: PrerequisiteRequirementTypeUpdate) => this.prerequisite_requirement_typeOps.update(changes);
    deletePrerequisiteRequirementType = (id: number) => this.prerequisite_requirement_typeOps.delete(id);
    getPrerequisiteRequirementTypesByIds = (ids: number[]) => this.prerequisite_requirement_typeOps.getByIds(ids);
    watchPrerequisiteRequirementType = (onChange: (type: 'insert' | 'update' | 'delete', row: PrerequisiteRequirementType, oldRow?: PrerequisiteRequirementType) => void) => 
        this.prerequisite_requirement_typeOps.watch(onChange);
    stopWatchPrerequisiteRequirementType = () => this.prerequisite_requirement_typeOps.stopWatch();
    // QinggongMonkKiPower operations
    getAllQinggongMonkKiPower = () => this.qinggong_monk_ki_powerOps.getAll();
    getQinggongMonkKiPowerById = (id: number) => this.qinggong_monk_ki_powerOps.getById(id);
    createQinggongMonkKiPower = (newItem: QinggongMonkKiPowerInsert) => this.qinggong_monk_ki_powerOps.create(newItem);
    updateQinggongMonkKiPower = (changes: QinggongMonkKiPowerUpdate) => this.qinggong_monk_ki_powerOps.update(changes);
    deleteQinggongMonkKiPower = (id: number) => this.qinggong_monk_ki_powerOps.delete(id);
    getQinggongMonkKiPowersByIds = (ids: number[]) => this.qinggong_monk_ki_powerOps.getByIds(ids);
    watchQinggongMonkKiPower = (onChange: (type: 'insert' | 'update' | 'delete', row: QinggongMonkKiPower, oldRow?: QinggongMonkKiPower) => void) => 
        this.qinggong_monk_ki_powerOps.watch(onChange);
    stopWatchQinggongMonkKiPower = () => this.qinggong_monk_ki_powerOps.stopWatch();
    // QinggongMonkKiPowerType operations
    getAllQinggongMonkKiPowerType = () => this.qinggong_monk_ki_power_typeOps.getAll();
    getQinggongMonkKiPowerTypeById = (id: number) => this.qinggong_monk_ki_power_typeOps.getById(id);
    createQinggongMonkKiPowerType = (newItem: QinggongMonkKiPowerTypeInsert) => this.qinggong_monk_ki_power_typeOps.create(newItem);
    updateQinggongMonkKiPowerType = (changes: QinggongMonkKiPowerTypeUpdate) => this.qinggong_monk_ki_power_typeOps.update(changes);
    deleteQinggongMonkKiPowerType = (id: number) => this.qinggong_monk_ki_power_typeOps.delete(id);
    getQinggongMonkKiPowerTypesByIds = (ids: number[]) => this.qinggong_monk_ki_power_typeOps.getByIds(ids);
    watchQinggongMonkKiPowerType = (onChange: (type: 'insert' | 'update' | 'delete', row: QinggongMonkKiPowerType, oldRow?: QinggongMonkKiPowerType) => void) => 
        this.qinggong_monk_ki_power_typeOps.watch(onChange);
    stopWatchQinggongMonkKiPowerType = () => this.qinggong_monk_ki_power_typeOps.stopWatch();
    // QualificationType operations
    getAllQualificationType = () => this.qualification_typeOps.getAll();
    getQualificationTypeById = (id: number) => this.qualification_typeOps.getById(id);
    createQualificationType = (newItem: QualificationTypeInsert) => this.qualification_typeOps.create(newItem);
    updateQualificationType = (changes: QualificationTypeUpdate) => this.qualification_typeOps.update(changes);
    deleteQualificationType = (id: number) => this.qualification_typeOps.delete(id);
    getQualificationTypesByIds = (ids: number[]) => this.qualification_typeOps.getByIds(ids);
    watchQualificationType = (onChange: (type: 'insert' | 'update' | 'delete', row: QualificationType, oldRow?: QualificationType) => void) => 
        this.qualification_typeOps.watch(onChange);
    stopWatchQualificationType = () => this.qualification_typeOps.stopWatch();
    // Rule operations
    getAllRule = () => this.ruleOps.getAll();
    getRuleById = (id: number) => this.ruleOps.getById(id);
    createRule = (newItem: RuleInsert) => this.ruleOps.create(newItem);
    updateRule = (changes: RuleUpdate) => this.ruleOps.update(changes);
    deleteRule = (id: number) => this.ruleOps.delete(id);
    getRulesByIds = (ids: number[]) => this.ruleOps.getByIds(ids);
    watchRule = (onChange: (type: 'insert' | 'update' | 'delete', row: Rule, oldRow?: Rule) => void) => 
        this.ruleOps.watch(onChange);
    stopWatchRule = () => this.ruleOps.stopWatch();
    // Skill operations
    getAllSkill = () => this.skillOps.getAll();
    getSkillById = (id: number) => this.skillOps.getById(id);
    createSkill = (newItem: SkillInsert) => this.skillOps.create(newItem);
    updateSkill = (changes: SkillUpdate) => this.skillOps.update(changes);
    deleteSkill = (id: number) => this.skillOps.delete(id);
    getSkillsByIds = (ids: number[]) => this.skillOps.getByIds(ids);
    watchSkill = (onChange: (type: 'insert' | 'update' | 'delete', row: Skill, oldRow?: Skill) => void) => 
        this.skillOps.watch(onChange);
    stopWatchSkill = () => this.skillOps.stopWatch();
    // SorcererBloodline operations
    getAllSorcererBloodline = () => this.sorcerer_bloodlineOps.getAll();
    getSorcererBloodlineById = (id: number) => this.sorcerer_bloodlineOps.getById(id);
    createSorcererBloodline = (newItem: SorcererBloodlineInsert) => this.sorcerer_bloodlineOps.create(newItem);
    updateSorcererBloodline = (changes: SorcererBloodlineUpdate) => this.sorcerer_bloodlineOps.update(changes);
    deleteSorcererBloodline = (id: number) => this.sorcerer_bloodlineOps.delete(id);
    getSorcererBloodlinesByIds = (ids: number[]) => this.sorcerer_bloodlineOps.getByIds(ids);
    watchSorcererBloodline = (onChange: (type: 'insert' | 'update' | 'delete', row: SorcererBloodline, oldRow?: SorcererBloodline) => void) => 
        this.sorcerer_bloodlineOps.watch(onChange);
    stopWatchSorcererBloodline = () => this.sorcerer_bloodlineOps.stopWatch();
    // Spell operations
    getAllSpell = () => this.spellOps.getAll();
    getSpellById = (id: number) => this.spellOps.getById(id);
    createSpell = (newItem: SpellInsert) => this.spellOps.create(newItem);
    updateSpell = (changes: SpellUpdate) => this.spellOps.update(changes);
    deleteSpell = (id: number) => this.spellOps.delete(id);
    getSpellsByIds = (ids: number[]) => this.spellOps.getByIds(ids);
    watchSpell = (onChange: (type: 'insert' | 'update' | 'delete', row: Spell, oldRow?: Spell) => void) => 
        this.spellOps.watch(onChange);
    stopWatchSpell = () => this.spellOps.stopWatch();
    // SpellCastingTime operations
    getAllSpellCastingTime = () => this.spell_casting_timeOps.getAll();
    getSpellCastingTimeById = (id: number) => this.spell_casting_timeOps.getById(id);
    createSpellCastingTime = (newItem: SpellCastingTimeInsert) => this.spell_casting_timeOps.create(newItem);
    updateSpellCastingTime = (changes: SpellCastingTimeUpdate) => this.spell_casting_timeOps.update(changes);
    deleteSpellCastingTime = (id: number) => this.spell_casting_timeOps.delete(id);
    getSpellCastingTimesByIds = (ids: number[]) => this.spell_casting_timeOps.getByIds(ids);
    watchSpellCastingTime = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellCastingTime, oldRow?: SpellCastingTime) => void) => 
        this.spell_casting_timeOps.watch(onChange);
    stopWatchSpellCastingTime = () => this.spell_casting_timeOps.stopWatch();
    // SpellCastingTimeMapping operations
    getAllSpellCastingTimeMapping = () => this.spell_casting_time_mappingOps.getAll();
    getSpellCastingTimeMappingById = (id: number) => this.spell_casting_time_mappingOps.getById(id);
    createSpellCastingTimeMapping = (newItem: SpellCastingTimeMappingInsert) => this.spell_casting_time_mappingOps.create(newItem);
    updateSpellCastingTimeMapping = (changes: SpellCastingTimeMappingUpdate) => this.spell_casting_time_mappingOps.update(changes);
    deleteSpellCastingTimeMapping = (id: number) => this.spell_casting_time_mappingOps.delete(id);
    getSpellCastingTimeMappingsByIds = (ids: number[]) => this.spell_casting_time_mappingOps.getByIds(ids);
    watchSpellCastingTimeMapping = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellCastingTimeMapping, oldRow?: SpellCastingTimeMapping) => void) => 
        this.spell_casting_time_mappingOps.watch(onChange);
    stopWatchSpellCastingTimeMapping = () => this.spell_casting_time_mappingOps.stopWatch();
    // SpellComponent operations
    getAllSpellComponent = () => this.spell_componentOps.getAll();
    getSpellComponentById = (id: number) => this.spell_componentOps.getById(id);
    createSpellComponent = (newItem: SpellComponentInsert) => this.spell_componentOps.create(newItem);
    updateSpellComponent = (changes: SpellComponentUpdate) => this.spell_componentOps.update(changes);
    deleteSpellComponent = (id: number) => this.spell_componentOps.delete(id);
    getSpellComponentsByIds = (ids: number[]) => this.spell_componentOps.getByIds(ids);
    watchSpellComponent = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellComponent, oldRow?: SpellComponent) => void) => 
        this.spell_componentOps.watch(onChange);
    stopWatchSpellComponent = () => this.spell_componentOps.stopWatch();
    // SpellComponentMapping operations
    getAllSpellComponentMapping = () => this.spell_component_mappingOps.getAll();
    getSpellComponentMappingById = (id: number) => this.spell_component_mappingOps.getById(id);
    createSpellComponentMapping = (newItem: SpellComponentMappingInsert) => this.spell_component_mappingOps.create(newItem);
    updateSpellComponentMapping = (changes: SpellComponentMappingUpdate) => this.spell_component_mappingOps.update(changes);
    deleteSpellComponentMapping = (id: number) => this.spell_component_mappingOps.delete(id);
    getSpellComponentMappingsByIds = (ids: number[]) => this.spell_component_mappingOps.getByIds(ids);
    watchSpellComponentMapping = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellComponentMapping, oldRow?: SpellComponentMapping) => void) => 
        this.spell_component_mappingOps.watch(onChange);
    stopWatchSpellComponentMapping = () => this.spell_component_mappingOps.stopWatch();
    // SpellComponentType operations
    getAllSpellComponentType = () => this.spell_component_typeOps.getAll();
    getSpellComponentTypeById = (id: number) => this.spell_component_typeOps.getById(id);
    createSpellComponentType = (newItem: SpellComponentTypeInsert) => this.spell_component_typeOps.create(newItem);
    updateSpellComponentType = (changes: SpellComponentTypeUpdate) => this.spell_component_typeOps.update(changes);
    deleteSpellComponentType = (id: number) => this.spell_component_typeOps.delete(id);
    getSpellComponentTypesByIds = (ids: number[]) => this.spell_component_typeOps.getByIds(ids);
    watchSpellComponentType = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellComponentType, oldRow?: SpellComponentType) => void) => 
        this.spell_component_typeOps.watch(onChange);
    stopWatchSpellComponentType = () => this.spell_component_typeOps.stopWatch();
    // SpellConsumable operations
    getAllSpellConsumable = () => this.spell_consumableOps.getAll();
    getSpellConsumableById = (id: number) => this.spell_consumableOps.getById(id);
    createSpellConsumable = (newItem: SpellConsumableInsert) => this.spell_consumableOps.create(newItem);
    updateSpellConsumable = (changes: SpellConsumableUpdate) => this.spell_consumableOps.update(changes);
    deleteSpellConsumable = (id: number) => this.spell_consumableOps.delete(id);
    getSpellConsumablesByIds = (ids: number[]) => this.spell_consumableOps.getByIds(ids);
    watchSpellConsumable = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellConsumable, oldRow?: SpellConsumable) => void) => 
        this.spell_consumableOps.watch(onChange);
    stopWatchSpellConsumable = () => this.spell_consumableOps.stopWatch();
    // SpellDuration operations
    getAllSpellDuration = () => this.spell_durationOps.getAll();
    getSpellDurationById = (id: number) => this.spell_durationOps.getById(id);
    createSpellDuration = (newItem: SpellDurationInsert) => this.spell_durationOps.create(newItem);
    updateSpellDuration = (changes: SpellDurationUpdate) => this.spell_durationOps.update(changes);
    deleteSpellDuration = (id: number) => this.spell_durationOps.delete(id);
    getSpellDurationsByIds = (ids: number[]) => this.spell_durationOps.getByIds(ids);
    watchSpellDuration = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellDuration, oldRow?: SpellDuration) => void) => 
        this.spell_durationOps.watch(onChange);
    stopWatchSpellDuration = () => this.spell_durationOps.stopWatch();
    // SpellDurationMapping operations
    getAllSpellDurationMapping = () => this.spell_duration_mappingOps.getAll();
    getSpellDurationMappingById = (id: number) => this.spell_duration_mappingOps.getById(id);
    createSpellDurationMapping = (newItem: SpellDurationMappingInsert) => this.spell_duration_mappingOps.create(newItem);
    updateSpellDurationMapping = (changes: SpellDurationMappingUpdate) => this.spell_duration_mappingOps.update(changes);
    deleteSpellDurationMapping = (id: number) => this.spell_duration_mappingOps.delete(id);
    getSpellDurationMappingsByIds = (ids: number[]) => this.spell_duration_mappingOps.getByIds(ids);
    watchSpellDurationMapping = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellDurationMapping, oldRow?: SpellDurationMapping) => void) => 
        this.spell_duration_mappingOps.watch(onChange);
    stopWatchSpellDurationMapping = () => this.spell_duration_mappingOps.stopWatch();
    // SpellList operations
    getAllSpellList = () => this.spell_listOps.getAll();
    getSpellListById = (id: number) => this.spell_listOps.getById(id);
    createSpellList = (newItem: SpellListInsert) => this.spell_listOps.create(newItem);
    updateSpellList = (changes: SpellListUpdate) => this.spell_listOps.update(changes);
    deleteSpellList = (id: number) => this.spell_listOps.delete(id);
    getSpellListsByIds = (ids: number[]) => this.spell_listOps.getByIds(ids);
    watchSpellList = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellList, oldRow?: SpellList) => void) => 
        this.spell_listOps.watch(onChange);
    stopWatchSpellList = () => this.spell_listOps.stopWatch();
    // SpellListClassFeatureBenefitMapping operations
    getAllSpellListClassFeatureBenefitMapping = () => this.spell_list_class_feature_benefit_mappingOps.getAll();
    getSpellListClassFeatureBenefitMappingById = (id: number) => this.spell_list_class_feature_benefit_mappingOps.getById(id);
    createSpellListClassFeatureBenefitMapping = (newItem: SpellListClassFeatureBenefitMappingInsert) => this.spell_list_class_feature_benefit_mappingOps.create(newItem);
    updateSpellListClassFeatureBenefitMapping = (changes: SpellListClassFeatureBenefitMappingUpdate) => this.spell_list_class_feature_benefit_mappingOps.update(changes);
    deleteSpellListClassFeatureBenefitMapping = (id: number) => this.spell_list_class_feature_benefit_mappingOps.delete(id);
    getSpellListClassFeatureBenefitMappingsByIds = (ids: number[]) => this.spell_list_class_feature_benefit_mappingOps.getByIds(ids);
    watchSpellListClassFeatureBenefitMapping = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellListClassFeatureBenefitMapping, oldRow?: SpellListClassFeatureBenefitMapping) => void) => 
        this.spell_list_class_feature_benefit_mappingOps.watch(onChange);
    stopWatchSpellListClassFeatureBenefitMapping = () => this.spell_list_class_feature_benefit_mappingOps.stopWatch();
    // SpellListFeatMapping operations
    getAllSpellListFeatMapping = () => this.spell_list_feat_mappingOps.getAll();
    getSpellListFeatMappingById = (id: number) => this.spell_list_feat_mappingOps.getById(id);
    createSpellListFeatMapping = (newItem: SpellListFeatMappingInsert) => this.spell_list_feat_mappingOps.create(newItem);
    updateSpellListFeatMapping = (changes: SpellListFeatMappingUpdate) => this.spell_list_feat_mappingOps.update(changes);
    deleteSpellListFeatMapping = (id: number) => this.spell_list_feat_mappingOps.delete(id);
    getSpellListFeatMappingsByIds = (ids: number[]) => this.spell_list_feat_mappingOps.getByIds(ids);
    watchSpellListFeatMapping = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellListFeatMapping, oldRow?: SpellListFeatMapping) => void) => 
        this.spell_list_feat_mappingOps.watch(onChange);
    stopWatchSpellListFeatMapping = () => this.spell_list_feat_mappingOps.stopWatch();
    // SpellListSpellMapping operations
    getAllSpellListSpellMapping = () => this.spell_list_spell_mappingOps.getAll();
    getSpellListSpellMappingById = (id: number) => this.spell_list_spell_mappingOps.getById(id);
    createSpellListSpellMapping = (newItem: SpellListSpellMappingInsert) => this.spell_list_spell_mappingOps.create(newItem);
    updateSpellListSpellMapping = (changes: SpellListSpellMappingUpdate) => this.spell_list_spell_mappingOps.update(changes);
    deleteSpellListSpellMapping = (id: number) => this.spell_list_spell_mappingOps.delete(id);
    getSpellListSpellMappingsByIds = (ids: number[]) => this.spell_list_spell_mappingOps.getByIds(ids);
    watchSpellListSpellMapping = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellListSpellMapping, oldRow?: SpellListSpellMapping) => void) => 
        this.spell_list_spell_mappingOps.watch(onChange);
    stopWatchSpellListSpellMapping = () => this.spell_list_spell_mappingOps.stopWatch();
    // SpellRange operations
    getAllSpellRange = () => this.spell_rangeOps.getAll();
    getSpellRangeById = (id: number) => this.spell_rangeOps.getById(id);
    createSpellRange = (newItem: SpellRangeInsert) => this.spell_rangeOps.create(newItem);
    updateSpellRange = (changes: SpellRangeUpdate) => this.spell_rangeOps.update(changes);
    deleteSpellRange = (id: number) => this.spell_rangeOps.delete(id);
    getSpellRangesByIds = (ids: number[]) => this.spell_rangeOps.getByIds(ids);
    watchSpellRange = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellRange, oldRow?: SpellRange) => void) => 
        this.spell_rangeOps.watch(onChange);
    stopWatchSpellRange = () => this.spell_rangeOps.stopWatch();
    // SpellRangeMapping operations
    getAllSpellRangeMapping = () => this.spell_range_mappingOps.getAll();
    getSpellRangeMappingById = (id: number) => this.spell_range_mappingOps.getById(id);
    createSpellRangeMapping = (newItem: SpellRangeMappingInsert) => this.spell_range_mappingOps.create(newItem);
    updateSpellRangeMapping = (changes: SpellRangeMappingUpdate) => this.spell_range_mappingOps.update(changes);
    deleteSpellRangeMapping = (id: number) => this.spell_range_mappingOps.delete(id);
    getSpellRangeMappingsByIds = (ids: number[]) => this.spell_range_mappingOps.getByIds(ids);
    watchSpellRangeMapping = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellRangeMapping, oldRow?: SpellRangeMapping) => void) => 
        this.spell_range_mappingOps.watch(onChange);
    stopWatchSpellRangeMapping = () => this.spell_range_mappingOps.stopWatch();
    // SpellSchool operations
    getAllSpellSchool = () => this.spell_schoolOps.getAll();
    getSpellSchoolById = (id: number) => this.spell_schoolOps.getById(id);
    createSpellSchool = (newItem: SpellSchoolInsert) => this.spell_schoolOps.create(newItem);
    updateSpellSchool = (changes: SpellSchoolUpdate) => this.spell_schoolOps.update(changes);
    deleteSpellSchool = (id: number) => this.spell_schoolOps.delete(id);
    getSpellSchoolsByIds = (ids: number[]) => this.spell_schoolOps.getByIds(ids);
    watchSpellSchool = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellSchool, oldRow?: SpellSchool) => void) => 
        this.spell_schoolOps.watch(onChange);
    stopWatchSpellSchool = () => this.spell_schoolOps.stopWatch();
    // SpellSchoolMapping operations
    getAllSpellSchoolMapping = () => this.spell_school_mappingOps.getAll();
    getSpellSchoolMappingById = (id: number) => this.spell_school_mappingOps.getById(id);
    createSpellSchoolMapping = (newItem: SpellSchoolMappingInsert) => this.spell_school_mappingOps.create(newItem);
    updateSpellSchoolMapping = (changes: SpellSchoolMappingUpdate) => this.spell_school_mappingOps.update(changes);
    deleteSpellSchoolMapping = (id: number) => this.spell_school_mappingOps.delete(id);
    getSpellSchoolMappingsByIds = (ids: number[]) => this.spell_school_mappingOps.getByIds(ids);
    watchSpellSchoolMapping = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellSchoolMapping, oldRow?: SpellSchoolMapping) => void) => 
        this.spell_school_mappingOps.watch(onChange);
    stopWatchSpellSchoolMapping = () => this.spell_school_mappingOps.stopWatch();
    // SpellSorcererBloodlineMapping operations
    getAllSpellSorcererBloodlineMapping = () => this.spell_sorcerer_bloodline_mappingOps.getAll();
    getSpellSorcererBloodlineMappingById = (id: number) => this.spell_sorcerer_bloodline_mappingOps.getById(id);
    createSpellSorcererBloodlineMapping = (newItem: SpellSorcererBloodlineMappingInsert) => this.spell_sorcerer_bloodline_mappingOps.create(newItem);
    updateSpellSorcererBloodlineMapping = (changes: SpellSorcererBloodlineMappingUpdate) => this.spell_sorcerer_bloodline_mappingOps.update(changes);
    deleteSpellSorcererBloodlineMapping = (id: number) => this.spell_sorcerer_bloodline_mappingOps.delete(id);
    getSpellSorcererBloodlineMappingsByIds = (ids: number[]) => this.spell_sorcerer_bloodline_mappingOps.getByIds(ids);
    watchSpellSorcererBloodlineMapping = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellSorcererBloodlineMapping, oldRow?: SpellSorcererBloodlineMapping) => void) => 
        this.spell_sorcerer_bloodline_mappingOps.watch(onChange);
    stopWatchSpellSorcererBloodlineMapping = () => this.spell_sorcerer_bloodline_mappingOps.stopWatch();
    // SpellSubdomainMapping operations
    getAllSpellSubdomainMapping = () => this.spell_subdomain_mappingOps.getAll();
    getSpellSubdomainMappingById = (id: number) => this.spell_subdomain_mappingOps.getById(id);
    createSpellSubdomainMapping = (newItem: SpellSubdomainMappingInsert) => this.spell_subdomain_mappingOps.create(newItem);
    updateSpellSubdomainMapping = (changes: SpellSubdomainMappingUpdate) => this.spell_subdomain_mappingOps.update(changes);
    deleteSpellSubdomainMapping = (id: number) => this.spell_subdomain_mappingOps.delete(id);
    getSpellSubdomainMappingsByIds = (ids: number[]) => this.spell_subdomain_mappingOps.getByIds(ids);
    watchSpellSubdomainMapping = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellSubdomainMapping, oldRow?: SpellSubdomainMapping) => void) => 
        this.spell_subdomain_mappingOps.watch(onChange);
    stopWatchSpellSubdomainMapping = () => this.spell_subdomain_mappingOps.stopWatch();
    // SpellTarget operations
    getAllSpellTarget = () => this.spell_targetOps.getAll();
    getSpellTargetById = (id: number) => this.spell_targetOps.getById(id);
    createSpellTarget = (newItem: SpellTargetInsert) => this.spell_targetOps.create(newItem);
    updateSpellTarget = (changes: SpellTargetUpdate) => this.spell_targetOps.update(changes);
    deleteSpellTarget = (id: number) => this.spell_targetOps.delete(id);
    getSpellTargetsByIds = (ids: number[]) => this.spell_targetOps.getByIds(ids);
    watchSpellTarget = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellTarget, oldRow?: SpellTarget) => void) => 
        this.spell_targetOps.watch(onChange);
    stopWatchSpellTarget = () => this.spell_targetOps.stopWatch();
    // SpellTargetMapping operations
    getAllSpellTargetMapping = () => this.spell_target_mappingOps.getAll();
    getSpellTargetMappingById = (id: number) => this.spell_target_mappingOps.getById(id);
    createSpellTargetMapping = (newItem: SpellTargetMappingInsert) => this.spell_target_mappingOps.create(newItem);
    updateSpellTargetMapping = (changes: SpellTargetMappingUpdate) => this.spell_target_mappingOps.update(changes);
    deleteSpellTargetMapping = (id: number) => this.spell_target_mappingOps.delete(id);
    getSpellTargetMappingsByIds = (ids: number[]) => this.spell_target_mappingOps.getByIds(ids);
    watchSpellTargetMapping = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellTargetMapping, oldRow?: SpellTargetMapping) => void) => 
        this.spell_target_mappingOps.watch(onChange);
    stopWatchSpellTargetMapping = () => this.spell_target_mappingOps.stopWatch();
    // SpellcastingClassFeature operations
    getAllSpellcastingClassFeature = () => this.spellcasting_class_featureOps.getAll();
    getSpellcastingClassFeatureById = (id: number) => this.spellcasting_class_featureOps.getById(id);
    createSpellcastingClassFeature = (newItem: SpellcastingClassFeatureInsert) => this.spellcasting_class_featureOps.create(newItem);
    updateSpellcastingClassFeature = (changes: SpellcastingClassFeatureUpdate) => this.spellcasting_class_featureOps.update(changes);
    deleteSpellcastingClassFeature = (id: number) => this.spellcasting_class_featureOps.delete(id);
    getSpellcastingClassFeaturesByIds = (ids: number[]) => this.spellcasting_class_featureOps.getByIds(ids);
    watchSpellcastingClassFeature = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellcastingClassFeature, oldRow?: SpellcastingClassFeature) => void) => 
        this.spellcasting_class_featureOps.watch(onChange);
    stopWatchSpellcastingClassFeature = () => this.spellcasting_class_featureOps.stopWatch();
    // SpellcastingPreparationType operations
    getAllSpellcastingPreparationType = () => this.spellcasting_preparation_typeOps.getAll();
    getSpellcastingPreparationTypeById = (id: number) => this.spellcasting_preparation_typeOps.getById(id);
    createSpellcastingPreparationType = (newItem: SpellcastingPreparationTypeInsert) => this.spellcasting_preparation_typeOps.create(newItem);
    updateSpellcastingPreparationType = (changes: SpellcastingPreparationTypeUpdate) => this.spellcasting_preparation_typeOps.update(changes);
    deleteSpellcastingPreparationType = (id: number) => this.spellcasting_preparation_typeOps.delete(id);
    getSpellcastingPreparationTypesByIds = (ids: number[]) => this.spellcasting_preparation_typeOps.getByIds(ids);
    watchSpellcastingPreparationType = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellcastingPreparationType, oldRow?: SpellcastingPreparationType) => void) => 
        this.spellcasting_preparation_typeOps.watch(onChange);
    stopWatchSpellcastingPreparationType = () => this.spellcasting_preparation_typeOps.stopWatch();
    // SpellcastingType operations
    getAllSpellcastingType = () => this.spellcasting_typeOps.getAll();
    getSpellcastingTypeById = (id: number) => this.spellcasting_typeOps.getById(id);
    createSpellcastingType = (newItem: SpellcastingTypeInsert) => this.spellcasting_typeOps.create(newItem);
    updateSpellcastingType = (changes: SpellcastingTypeUpdate) => this.spellcasting_typeOps.update(changes);
    deleteSpellcastingType = (id: number) => this.spellcasting_typeOps.delete(id);
    getSpellcastingTypesByIds = (ids: number[]) => this.spellcasting_typeOps.getByIds(ids);
    watchSpellcastingType = (onChange: (type: 'insert' | 'update' | 'delete', row: SpellcastingType, oldRow?: SpellcastingType) => void) => 
        this.spellcasting_typeOps.watch(onChange);
    stopWatchSpellcastingType = () => this.spellcasting_typeOps.stopWatch();
    // Subdomain operations
    getAllSubdomain = () => this.subdomainOps.getAll();
    getSubdomainById = (id: number) => this.subdomainOps.getById(id);
    createSubdomain = (newItem: SubdomainInsert) => this.subdomainOps.create(newItem);
    updateSubdomain = (changes: SubdomainUpdate) => this.subdomainOps.update(changes);
    deleteSubdomain = (id: number) => this.subdomainOps.delete(id);
    getSubdomainsByIds = (ids: number[]) => this.subdomainOps.getByIds(ids);
    watchSubdomain = (onChange: (type: 'insert' | 'update' | 'delete', row: Subdomain, oldRow?: Subdomain) => void) => 
        this.subdomainOps.watch(onChange);
    stopWatchSubdomain = () => this.subdomainOps.stopWatch();
    // Trait operations
    getAllTrait = () => this.traitOps.getAll();
    getTraitById = (id: number) => this.traitOps.getById(id);
    createTrait = (newItem: TraitInsert) => this.traitOps.create(newItem);
    updateTrait = (changes: TraitUpdate) => this.traitOps.update(changes);
    deleteTrait = (id: number) => this.traitOps.delete(id);
    getTraitsByIds = (ids: number[]) => this.traitOps.getByIds(ids);
    watchTrait = (onChange: (type: 'insert' | 'update' | 'delete', row: Trait, oldRow?: Trait) => void) => 
        this.traitOps.watch(onChange);
    stopWatchTrait = () => this.traitOps.stopWatch();
    // Weapon operations
    getAllWeapon = () => this.weaponOps.getAll();
    getWeaponById = (id: number) => this.weaponOps.getById(id);
    createWeapon = (newItem: WeaponInsert) => this.weaponOps.create(newItem);
    updateWeapon = (changes: WeaponUpdate) => this.weaponOps.update(changes);
    deleteWeapon = (id: number) => this.weaponOps.delete(id);
    getWeaponsByIds = (ids: number[]) => this.weaponOps.getByIds(ids);
    watchWeapon = (onChange: (type: 'insert' | 'update' | 'delete', row: Weapon, oldRow?: Weapon) => void) => 
        this.weaponOps.watch(onChange);
    stopWatchWeapon = () => this.weaponOps.stopWatch();
    // WildTalent operations
    getAllWildTalent = () => this.wild_talentOps.getAll();
    getWildTalentById = (id: number) => this.wild_talentOps.getById(id);
    createWildTalent = (newItem: WildTalentInsert) => this.wild_talentOps.create(newItem);
    updateWildTalent = (changes: WildTalentUpdate) => this.wild_talentOps.update(changes);
    deleteWildTalent = (id: number) => this.wild_talentOps.delete(id);
    getWildTalentsByIds = (ids: number[]) => this.wild_talentOps.getByIds(ids);
    watchWildTalent = (onChange: (type: 'insert' | 'update' | 'delete', row: WildTalent, oldRow?: WildTalent) => void) => 
        this.wild_talentOps.watch(onChange);
    stopWatchWildTalent = () => this.wild_talentOps.stopWatch();
    // WildTalentType operations
    getAllWildTalentType = () => this.wild_talent_typeOps.getAll();
    getWildTalentTypeById = (id: number) => this.wild_talent_typeOps.getById(id);
    createWildTalentType = (newItem: WildTalentTypeInsert) => this.wild_talent_typeOps.create(newItem);
    updateWildTalentType = (changes: WildTalentTypeUpdate) => this.wild_talent_typeOps.update(changes);
    deleteWildTalentType = (id: number) => this.wild_talent_typeOps.delete(id);
    getWildTalentTypesByIds = (ids: number[]) => this.wild_talent_typeOps.getByIds(ids);
    watchWildTalentType = (onChange: (type: 'insert' | 'update' | 'delete', row: WildTalentType, oldRow?: WildTalentType) => void) => 
        this.wild_talent_typeOps.watch(onChange);
    stopWatchWildTalentType = () => this.wild_talent_typeOps.stopWatch();

    // Relationship functions

    async getBonusAttackProgressionForClass(id: number): Promise<BonusAttackProgression[]> {
        // Check cache first
        if (this.relationships.bonusAttackProgressionByBaseAttackBonusProgression[id]) {
            return this.relationships.bonusAttackProgressionByBaseAttackBonusProgression[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('class')
            .select(`
                bonus_attack_progression (*)
            `)
            .eq('base_attack_bonus_progression', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['bonus_attack_progression']).flat() || []) as BonusAttackProgression[];
        this.relationships.bonusAttackProgressionByBaseAttackBonusProgression[id] = results;
        return results;
    }

    async getAbilityForSkill(id: number): Promise<Ability[]> {
        // Check cache first
        if (this.relationships.abilityByAbilityId[id]) {
            return this.relationships.abilityByAbilityId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('skill')
            .select(`
                ability (*)
            `)
            .eq('ability_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['ability']).flat() || []) as Ability[];
        this.relationships.abilityByAbilityId[id] = results;
        return results;
    }

    async getClassForClassFeature(id: number): Promise<Class[]> {
        // Check cache first
        if (this.relationships.classByClassId[id]) {
            return this.relationships.classByClassId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('class_feature')
            .select(`
                class (*)
            `)
            .eq('class_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['class']).flat() || []) as Class[];
        this.relationships.classByClassId[id] = results;
        return results;
    }

    async getClassFeatureForClassFeatureBenefit(id: number): Promise<ClassFeature[]> {
        // Check cache first
        if (this.relationships.classFeatureByClassFeatureId[id]) {
            return this.relationships.classFeatureByClassFeatureId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('class_feature_benefit')
            .select(`
                class_feature (*)
            `)
            .eq('class_feature_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['class_feature']).flat() || []) as ClassFeature[];
        this.relationships.classFeatureByClassFeatureId[id] = results;
        return results;
    }

    async getClassFeatureForSpellcastingClassFeature(id: number): Promise<ClassFeature[]> {
        // Check cache first
        if (this.relationships.classFeatureByClassFeatureId[id]) {
            return this.relationships.classFeatureByClassFeatureId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('spellcasting_class_feature')
            .select(`
                class_feature (*)
            `)
            .eq('class_feature_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['class_feature']).flat() || []) as ClassFeature[];
        this.relationships.classFeatureByClassFeatureId[id] = results;
        return results;
    }

    async getSpellcastingTypeForSpellcastingClassFeature(id: number): Promise<SpellcastingType[]> {
        // Check cache first
        if (this.relationships.spellcastingTypeBySpellcastingType[id]) {
            return this.relationships.spellcastingTypeBySpellcastingType[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('spellcasting_class_feature')
            .select(`
                spellcasting_type (*)
            `)
            .eq('spellcasting_type', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['spellcasting_type']).flat() || []) as SpellcastingType[];
        this.relationships.spellcastingTypeBySpellcastingType[id] = results;
        return results;
    }

    async getSpellcastingPreparationTypeForSpellcastingClassFeature(id: number): Promise<SpellcastingPreparationType[]> {
        // Check cache first
        if (this.relationships.spellcastingPreparationTypeByPreparationType[id]) {
            return this.relationships.spellcastingPreparationTypeByPreparationType[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('spellcasting_class_feature')
            .select(`
                spellcasting_preparation_type (*)
            `)
            .eq('preparation_type', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['spellcasting_preparation_type']).flat() || []) as SpellcastingPreparationType[];
        this.relationships.spellcastingPreparationTypeByPreparationType[id] = results;
        return results;
    }

    async getAbilityForSpellcastingClassFeature(id: number): Promise<Ability[]> {
        // Check cache first
        if (this.relationships.abilityByAbilityId[id]) {
            return this.relationships.abilityByAbilityId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('spellcasting_class_feature')
            .select(`
                ability (*)
            `)
            .eq('ability_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['ability']).flat() || []) as Ability[];
        this.relationships.abilityByAbilityId[id] = results;
        return results;
    }

    async getClassForArchetype(id: number): Promise<Class[]> {
        // Check cache first
        if (this.relationships.classByClassId[id]) {
            return this.relationships.classByClassId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('archetype')
            .select(`
                class (*)
            `)
            .eq('class_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['class']).flat() || []) as Class[];
        this.relationships.classByClassId[id] = results;
        return results;
    }

    async getClassForArchetypeClassFeature(id: number): Promise<Class[]> {
        // Check cache first
        if (this.relationships.classByClassId[id]) {
            return this.relationships.classByClassId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('archetype_class_feature')
            .select(`
                class (*)
            `)
            .eq('class_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['class']).flat() || []) as Class[];
        this.relationships.classByClassId[id] = results;
        return results;
    }

    async getArchetypeForArchetypeClassFeature(id: number): Promise<Archetype[]> {
        // Check cache first
        if (this.relationships.archetypeByArchetypeId[id]) {
            return this.relationships.archetypeByArchetypeId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('archetype_class_feature')
            .select(`
                archetype (*)
            `)
            .eq('archetype_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['archetype']).flat() || []) as Archetype[];
        this.relationships.archetypeByArchetypeId[id] = results;
        return results;
    }

    async getClassFeatureForArchetypeClassFeature(id: number): Promise<ClassFeature[]> {
        // Check cache first
        if (this.relationships.classFeatureByFeatureId[id]) {
            return this.relationships.classFeatureByFeatureId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('archetype_class_feature')
            .select(`
                class_feature (*)
            `)
            .eq('feature_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['class_feature']).flat() || []) as ClassFeature[];
        this.relationships.classFeatureByFeatureId[id] = results;
        return results;
    }

    async getCorruptionForCorruptionManifestation(id: number): Promise<Corruption[]> {
        // Check cache first
        if (this.relationships.corruptionByCorruptionId[id]) {
            return this.relationships.corruptionByCorruptionId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('corruption_manifestation')
            .select(`
                corruption (*)
            `)
            .eq('corruption_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['corruption']).flat() || []) as Corruption[];
        this.relationships.corruptionByCorruptionId[id] = results;
        return results;
    }

    async getClassForWildTalent(id: number): Promise<Class[]> {
        // Check cache first
        if (this.relationships.classByClassId[id]) {
            return this.relationships.classByClassId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('wild_talent')
            .select(`
                class (*)
            `)
            .eq('class_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['class']).flat() || []) as Class[];
        this.relationships.classByClassId[id] = results;
        return results;
    }

    async getWildTalentTypeForWildTalent(id: number): Promise<WildTalentType[]> {
        // Check cache first
        if (this.relationships.wildTalentTypeByWildTalentTypeId[id]) {
            return this.relationships.wildTalentTypeByWildTalentTypeId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('wild_talent')
            .select(`
                wild_talent_type (*)
            `)
            .eq('wild_talent_type_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['wild_talent_type']).flat() || []) as WildTalentType[];
        this.relationships.wildTalentTypeByWildTalentTypeId[id] = results;
        return results;
    }

    async getClassForMonkUnchainedKiPower(id: number): Promise<Class[]> {
        // Check cache first
        if (this.relationships.classByClassId[id]) {
            return this.relationships.classByClassId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('monk_unchained_ki_power')
            .select(`
                class (*)
            `)
            .eq('class_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['class']).flat() || []) as Class[];
        this.relationships.classByClassId[id] = results;
        return results;
    }

    async getBonusTypeForEquipment(id: number): Promise<BonusType[]> {
        // Check cache first
        if (this.relationships.bonusTypeByBonusTypeId[id]) {
            return this.relationships.bonusTypeByBonusTypeId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('equipment')
            .select(`
                bonus_type (*)
            `)
            .eq('bonus_type_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['bonus_type']).flat() || []) as BonusType[];
        this.relationships.bonusTypeByBonusTypeId[id] = results;
        return results;
    }

    async getSpellForSpellConsumable(id: number): Promise<Spell[]> {
        // Check cache first
        if (this.relationships.spellBySpellId[id]) {
            return this.relationships.spellBySpellId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('spell_consumable')
            .select(`
                spell (*)
            `)
            .eq('spell_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['spell']).flat() || []) as Spell[];
        this.relationships.spellBySpellId[id] = results;
        return results;
    }

    async getGameCharacterForGameCharacterClass(id: number): Promise<GameCharacter[]> {
        // Check cache first
        if (this.relationships.gameCharacterByGameCharacterId[id]) {
            return this.relationships.gameCharacterByGameCharacterId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('game_character_class')
            .select(`
                game_character (*)
            `)
            .eq('game_character_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['game_character']).flat() || []) as GameCharacter[];
        this.relationships.gameCharacterByGameCharacterId[id] = results;
        return results;
    }

    async getClassForGameCharacterClass(id: number): Promise<Class[]> {
        // Check cache first
        if (this.relationships.classByClassId[id]) {
            return this.relationships.classByClassId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('game_character_class')
            .select(`
                class (*)
            `)
            .eq('class_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['class']).flat() || []) as Class[];
        this.relationships.classByClassId[id] = results;
        return results;
    }

    async getClassForClassSkill(id: number): Promise<Class[]> {
        // Check cache first
        if (this.relationships.classByClassId[id]) {
            return this.relationships.classByClassId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('class_skill')
            .select(`
                class (*)
            `)
            .eq('class_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['class']).flat() || []) as Class[];
        this.relationships.classByClassId[id] = results;
        return results;
    }

    async getSkillForClassSkill(id: number): Promise<Skill[]> {
        // Check cache first
        if (this.relationships.skillBySkillId[id]) {
            return this.relationships.skillBySkillId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('class_skill')
            .select(`
                skill (*)
            `)
            .eq('skill_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['skill']).flat() || []) as Skill[];
        this.relationships.skillBySkillId[id] = results;
        return results;
    }

    async getGameCharacterForGameCharacterSkillRank(id: number): Promise<GameCharacter[]> {
        // Check cache first
        if (this.relationships.gameCharacterByGameCharacterId[id]) {
            return this.relationships.gameCharacterByGameCharacterId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('game_character_skill_rank')
            .select(`
                game_character (*)
            `)
            .eq('game_character_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['game_character']).flat() || []) as GameCharacter[];
        this.relationships.gameCharacterByGameCharacterId[id] = results;
        return results;
    }

    async getSkillForGameCharacterSkillRank(id: number): Promise<Skill[]> {
        // Check cache first
        if (this.relationships.skillBySkillId[id]) {
            return this.relationships.skillBySkillId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('game_character_skill_rank')
            .select(`
                skill (*)
            `)
            .eq('skill_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['skill']).flat() || []) as Skill[];
        this.relationships.skillBySkillId[id] = results;
        return results;
    }

    async getGameCharacterForGameCharacterAbility(id: number): Promise<GameCharacter[]> {
        // Check cache first
        if (this.relationships.gameCharacterByGameCharacterId[id]) {
            return this.relationships.gameCharacterByGameCharacterId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('game_character_ability')
            .select(`
                game_character (*)
            `)
            .eq('game_character_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['game_character']).flat() || []) as GameCharacter[];
        this.relationships.gameCharacterByGameCharacterId[id] = results;
        return results;
    }

    async getAbilityForGameCharacterAbility(id: number): Promise<Ability[]> {
        // Check cache first
        if (this.relationships.abilityByAbilityId[id]) {
            return this.relationships.abilityByAbilityId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('game_character_ability')
            .select(`
                ability (*)
            `)
            .eq('ability_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['ability']).flat() || []) as Ability[];
        this.relationships.abilityByAbilityId[id] = results;
        return results;
    }

    async getGameCharacterForGameCharacterFeat(id: number): Promise<GameCharacter[]> {
        // Check cache first
        if (this.relationships.gameCharacterByGameCharacterId[id]) {
            return this.relationships.gameCharacterByGameCharacterId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('game_character_feat')
            .select(`
                game_character (*)
            `)
            .eq('game_character_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['game_character']).flat() || []) as GameCharacter[];
        this.relationships.gameCharacterByGameCharacterId[id] = results;
        return results;
    }

    async getFeatForGameCharacterFeat(id: number): Promise<Feat[]> {
        // Check cache first
        if (this.relationships.featByFeatId[id]) {
            return this.relationships.featByFeatId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('game_character_feat')
            .select(`
                feat (*)
            `)
            .eq('feat_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['feat']).flat() || []) as Feat[];
        this.relationships.featByFeatId[id] = results;
        return results;
    }

    async getGameCharacterForGameCharacterConsumable(id: number): Promise<GameCharacter[]> {
        // Check cache first
        if (this.relationships.gameCharacterByGameCharacterId[id]) {
            return this.relationships.gameCharacterByGameCharacterId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('game_character_consumable')
            .select(`
                game_character (*)
            `)
            .eq('game_character_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['game_character']).flat() || []) as GameCharacter[];
        this.relationships.gameCharacterByGameCharacterId[id] = results;
        return results;
    }

    async getConsumableForGameCharacterConsumable(id: number): Promise<Consumable[]> {
        // Check cache first
        if (this.relationships.consumableByConsumableId[id]) {
            return this.relationships.consumableByConsumableId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('game_character_consumable')
            .select(`
                consumable (*)
            `)
            .eq('consumable_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['consumable']).flat() || []) as Consumable[];
        this.relationships.consumableByConsumableId[id] = results;
        return results;
    }

    async getGameCharacterForGameCharacterArchetype(id: number): Promise<GameCharacter[]> {
        // Check cache first
        if (this.relationships.gameCharacterByGameCharacterId[id]) {
            return this.relationships.gameCharacterByGameCharacterId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('game_character_archetype')
            .select(`
                game_character (*)
            `)
            .eq('game_character_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['game_character']).flat() || []) as GameCharacter[];
        this.relationships.gameCharacterByGameCharacterId[id] = results;
        return results;
    }

    async getArchetypeForGameCharacterArchetype(id: number): Promise<Archetype[]> {
        // Check cache first
        if (this.relationships.archetypeByArchetypeId[id]) {
            return this.relationships.archetypeByArchetypeId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('game_character_archetype')
            .select(`
                archetype (*)
            `)
            .eq('archetype_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['archetype']).flat() || []) as Archetype[];
        this.relationships.archetypeByArchetypeId[id] = results;
        return results;
    }

    async getGameCharacterForGameCharacterAncestry(id: number): Promise<GameCharacter[]> {
        // Check cache first
        if (this.relationships.gameCharacterByGameCharacterId[id]) {
            return this.relationships.gameCharacterByGameCharacterId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('game_character_ancestry')
            .select(`
                game_character (*)
            `)
            .eq('game_character_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['game_character']).flat() || []) as GameCharacter[];
        this.relationships.gameCharacterByGameCharacterId[id] = results;
        return results;
    }

    async getAncestryForGameCharacterAncestry(id: number): Promise<Ancestry[]> {
        // Check cache first
        if (this.relationships.ancestryByAncestryId[id]) {
            return this.relationships.ancestryByAncestryId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('game_character_ancestry')
            .select(`
                ancestry (*)
            `)
            .eq('ancestry_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['ancestry']).flat() || []) as Ancestry[];
        this.relationships.ancestryByAncestryId[id] = results;
        return results;
    }

    async getGameCharacterForGameCharacterClassFeature(id: number): Promise<GameCharacter[]> {
        // Check cache first
        if (this.relationships.gameCharacterByGameCharacterId[id]) {
            return this.relationships.gameCharacterByGameCharacterId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('game_character_class_feature')
            .select(`
                game_character (*)
            `)
            .eq('game_character_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['game_character']).flat() || []) as GameCharacter[];
        this.relationships.gameCharacterByGameCharacterId[id] = results;
        return results;
    }

    async getClassFeatureForGameCharacterClassFeature(id: number): Promise<ClassFeature[]> {
        // Check cache first
        if (this.relationships.classFeatureByClassFeatureId[id]) {
            return this.relationships.classFeatureByClassFeatureId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('game_character_class_feature')
            .select(`
                class_feature (*)
            `)
            .eq('class_feature_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['class_feature']).flat() || []) as ClassFeature[];
        this.relationships.classFeatureByClassFeatureId[id] = results;
        return results;
    }

    async getGameCharacterForGameCharacterCorruption(id: number): Promise<GameCharacter[]> {
        // Check cache first
        if (this.relationships.gameCharacterByGameCharacterId[id]) {
            return this.relationships.gameCharacterByGameCharacterId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('game_character_corruption')
            .select(`
                game_character (*)
            `)
            .eq('game_character_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['game_character']).flat() || []) as GameCharacter[];
        this.relationships.gameCharacterByGameCharacterId[id] = results;
        return results;
    }

    async getCorruptionForGameCharacterCorruption(id: number): Promise<Corruption[]> {
        // Check cache first
        if (this.relationships.corruptionByCorruptionId[id]) {
            return this.relationships.corruptionByCorruptionId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('game_character_corruption')
            .select(`
                corruption (*)
            `)
            .eq('corruption_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['corruption']).flat() || []) as Corruption[];
        this.relationships.corruptionByCorruptionId[id] = results;
        return results;
    }

    async getGameCharacterForGameCharacterCorruptionManifestation(id: number): Promise<GameCharacter[]> {
        // Check cache first
        if (this.relationships.gameCharacterByGameCharacterId[id]) {
            return this.relationships.gameCharacterByGameCharacterId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('game_character_corruption_manifestation')
            .select(`
                game_character (*)
            `)
            .eq('game_character_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['game_character']).flat() || []) as GameCharacter[];
        this.relationships.gameCharacterByGameCharacterId[id] = results;
        return results;
    }

    async getCorruptionManifestationForGameCharacterCorruptionManifestation(id: number): Promise<CorruptionManifestation[]> {
        // Check cache first
        if (this.relationships.corruptionManifestationByManifestationId[id]) {
            return this.relationships.corruptionManifestationByManifestationId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('game_character_corruption_manifestation')
            .select(`
                corruption_manifestation (*)
            `)
            .eq('manifestation_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['corruption_manifestation']).flat() || []) as CorruptionManifestation[];
        this.relationships.corruptionManifestationByManifestationId[id] = results;
        return results;
    }

    async getGameCharacterForGameCharacterWildTalent(id: number): Promise<GameCharacter[]> {
        // Check cache first
        if (this.relationships.gameCharacterByGameCharacterId[id]) {
            return this.relationships.gameCharacterByGameCharacterId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('game_character_wild_talent')
            .select(`
                game_character (*)
            `)
            .eq('game_character_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['game_character']).flat() || []) as GameCharacter[];
        this.relationships.gameCharacterByGameCharacterId[id] = results;
        return results;
    }

    async getWildTalentForGameCharacterWildTalent(id: number): Promise<WildTalent[]> {
        // Check cache first
        if (this.relationships.wildTalentByWildTalentId[id]) {
            return this.relationships.wildTalentByWildTalentId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('game_character_wild_talent')
            .select(`
                wild_talent (*)
            `)
            .eq('wild_talent_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['wild_talent']).flat() || []) as WildTalent[];
        this.relationships.wildTalentByWildTalentId[id] = results;
        return results;
    }

    async getAbpNodeGroupForAbpNode(id: number): Promise<AbpNodeGroup[]> {
        // Check cache first
        if (this.relationships.abpNodeGroupByGroupId[id]) {
            return this.relationships.abpNodeGroupByGroupId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('abp_node')
            .select(`
                abp_node_group (*)
            `)
            .eq('group_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['abp_node_group']).flat() || []) as AbpNodeGroup[];
        this.relationships.abpNodeGroupByGroupId[id] = results;
        return results;
    }

    async getAbpNodeForAbpNodeBonus(id: number): Promise<AbpNode[]> {
        // Check cache first
        if (this.relationships.abpNodeByNodeId[id]) {
            return this.relationships.abpNodeByNodeId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('abp_node_bonus')
            .select(`
                abp_node (*)
            `)
            .eq('node_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['abp_node']).flat() || []) as AbpNode[];
        this.relationships.abpNodeByNodeId[id] = results;
        return results;
    }

    async getAbpBonusTypeForAbpNodeBonus(id: number): Promise<AbpBonusType[]> {
        // Check cache first
        if (this.relationships.abpBonusTypeByBonusTypeId[id]) {
            return this.relationships.abpBonusTypeByBonusTypeId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('abp_node_bonus')
            .select(`
                abp_bonus_type (*)
            `)
            .eq('bonus_type_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['abp_bonus_type']).flat() || []) as AbpBonusType[];
        this.relationships.abpBonusTypeByBonusTypeId[id] = results;
        return results;
    }

    async getGameCharacterForGameCharacterAbpChoice(id: number): Promise<GameCharacter[]> {
        // Check cache first
        if (this.relationships.gameCharacterByGameCharacterId[id]) {
            return this.relationships.gameCharacterByGameCharacterId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('game_character_abp_choice')
            .select(`
                game_character (*)
            `)
            .eq('game_character_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['game_character']).flat() || []) as GameCharacter[];
        this.relationships.gameCharacterByGameCharacterId[id] = results;
        return results;
    }

    async getAbpNodeGroupForGameCharacterAbpChoice(id: number): Promise<AbpNodeGroup[]> {
        // Check cache first
        if (this.relationships.abpNodeGroupByGroupId[id]) {
            return this.relationships.abpNodeGroupByGroupId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('game_character_abp_choice')
            .select(`
                abp_node_group (*)
            `)
            .eq('group_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['abp_node_group']).flat() || []) as AbpNodeGroup[];
        this.relationships.abpNodeGroupByGroupId[id] = results;
        return results;
    }

    async getAbpNodeForGameCharacterAbpChoice(id: number): Promise<AbpNode[]> {
        // Check cache first
        if (this.relationships.abpNodeByNodeId[id]) {
            return this.relationships.abpNodeByNodeId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('game_character_abp_choice')
            .select(`
                abp_node (*)
            `)
            .eq('node_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['abp_node']).flat() || []) as AbpNode[];
        this.relationships.abpNodeByNodeId[id] = results;
        return results;
    }

    async getGameCharacterForGameCharacterFavoredClassBonus(id: number): Promise<GameCharacter[]> {
        // Check cache first
        if (this.relationships.gameCharacterByGameCharacterId[id]) {
            return this.relationships.gameCharacterByGameCharacterId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('game_character_favored_class_bonus')
            .select(`
                game_character (*)
            `)
            .eq('game_character_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['game_character']).flat() || []) as GameCharacter[];
        this.relationships.gameCharacterByGameCharacterId[id] = results;
        return results;
    }

    async getClassForGameCharacterFavoredClassBonus(id: number): Promise<Class[]> {
        // Check cache first
        if (this.relationships.classByClassId[id]) {
            return this.relationships.classByClassId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('game_character_favored_class_bonus')
            .select(`
                class (*)
            `)
            .eq('class_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['class']).flat() || []) as Class[];
        this.relationships.classByClassId[id] = results;
        return results;
    }

    async getFavoredClassChoiceForGameCharacterFavoredClassBonus(id: number): Promise<FavoredClassChoice[]> {
        // Check cache first
        if (this.relationships.favoredClassChoiceByChoiceId[id]) {
            return this.relationships.favoredClassChoiceByChoiceId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('game_character_favored_class_bonus')
            .select(`
                favored_class_choice (*)
            `)
            .eq('choice_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['favored_class_choice']).flat() || []) as FavoredClassChoice[];
        this.relationships.favoredClassChoiceByChoiceId[id] = results;
        return results;
    }

    async getGameCharacterForGameCharacterEquipment(id: number): Promise<GameCharacter[]> {
        // Check cache first
        if (this.relationships.gameCharacterByGameCharacterId[id]) {
            return this.relationships.gameCharacterByGameCharacterId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('game_character_equipment')
            .select(`
                game_character (*)
            `)
            .eq('game_character_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['game_character']).flat() || []) as GameCharacter[];
        this.relationships.gameCharacterByGameCharacterId[id] = results;
        return results;
    }

    async getEquipmentForGameCharacterEquipment(id: number): Promise<Equipment[]> {
        // Check cache first
        if (this.relationships.equipmentByEquipmentId[id]) {
            return this.relationships.equipmentByEquipmentId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('game_character_equipment')
            .select(`
                equipment (*)
            `)
            .eq('equipment_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['equipment']).flat() || []) as Equipment[];
        this.relationships.equipmentByEquipmentId[id] = results;
        return results;
    }

    async getGameCharacterForGameCharacterArmor(id: number): Promise<GameCharacter[]> {
        // Check cache first
        if (this.relationships.gameCharacterByGameCharacterId[id]) {
            return this.relationships.gameCharacterByGameCharacterId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('game_character_armor')
            .select(`
                game_character (*)
            `)
            .eq('game_character_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['game_character']).flat() || []) as GameCharacter[];
        this.relationships.gameCharacterByGameCharacterId[id] = results;
        return results;
    }

    async getArmorForGameCharacterArmor(id: number): Promise<Armor[]> {
        // Check cache first
        if (this.relationships.armorByArmorId[id]) {
            return this.relationships.armorByArmorId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('game_character_armor')
            .select(`
                armor (*)
            `)
            .eq('armor_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['armor']).flat() || []) as Armor[];
        this.relationships.armorByArmorId[id] = results;
        return results;
    }

    async getGameCharacterForGameCharacterTrait(id: number): Promise<GameCharacter[]> {
        // Check cache first
        if (this.relationships.gameCharacterByGameCharacterId[id]) {
            return this.relationships.gameCharacterByGameCharacterId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('game_character_trait')
            .select(`
                game_character (*)
            `)
            .eq('game_character_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['game_character']).flat() || []) as GameCharacter[];
        this.relationships.gameCharacterByGameCharacterId[id] = results;
        return results;
    }

    async getTraitForGameCharacterTrait(id: number): Promise<Trait[]> {
        // Check cache first
        if (this.relationships.traitByTraitId[id]) {
            return this.relationships.traitByTraitId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('game_character_trait')
            .select(`
                trait (*)
            `)
            .eq('trait_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['trait']).flat() || []) as Trait[];
        this.relationships.traitByTraitId[id] = results;
        return results;
    }

    async getGameCharacterForGameCharacterSpell(id: number): Promise<GameCharacter[]> {
        // Check cache first
        if (this.relationships.gameCharacterByGameCharacterId[id]) {
            return this.relationships.gameCharacterByGameCharacterId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('game_character_spell')
            .select(`
                game_character (*)
            `)
            .eq('game_character_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['game_character']).flat() || []) as GameCharacter[];
        this.relationships.gameCharacterByGameCharacterId[id] = results;
        return results;
    }

    async getSpellForGameCharacterSpell(id: number): Promise<Spell[]> {
        // Check cache first
        if (this.relationships.spellBySpellId[id]) {
            return this.relationships.spellBySpellId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('game_character_spell')
            .select(`
                spell (*)
            `)
            .eq('spell_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['spell']).flat() || []) as Spell[];
        this.relationships.spellBySpellId[id] = results;
        return results;
    }

    async getGameCharacterForGameCharacterDiscovery(id: number): Promise<GameCharacter[]> {
        // Check cache first
        if (this.relationships.gameCharacterByGameCharacterId[id]) {
            return this.relationships.gameCharacterByGameCharacterId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('game_character_discovery')
            .select(`
                game_character (*)
            `)
            .eq('game_character_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['game_character']).flat() || []) as GameCharacter[];
        this.relationships.gameCharacterByGameCharacterId[id] = results;
        return results;
    }

    async getDiscoveryForGameCharacterDiscovery(id: number): Promise<Discovery[]> {
        // Check cache first
        if (this.relationships.discoveryByDiscoveryId[id]) {
            return this.relationships.discoveryByDiscoveryId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('game_character_discovery')
            .select(`
                discovery (*)
            `)
            .eq('discovery_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['discovery']).flat() || []) as Discovery[];
        this.relationships.discoveryByDiscoveryId[id] = results;
        return results;
    }

    async getGameCharacterForGameCharacterWeapon(id: number): Promise<GameCharacter[]> {
        // Check cache first
        if (this.relationships.gameCharacterByGameCharacterId[id]) {
            return this.relationships.gameCharacterByGameCharacterId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('game_character_weapon')
            .select(`
                game_character (*)
            `)
            .eq('game_character_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['game_character']).flat() || []) as GameCharacter[];
        this.relationships.gameCharacterByGameCharacterId[id] = results;
        return results;
    }

    async getWeaponForGameCharacterWeapon(id: number): Promise<Weapon[]> {
        // Check cache first
        if (this.relationships.weaponByWeaponId[id]) {
            return this.relationships.weaponByWeaponId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('game_character_weapon')
            .select(`
                weapon (*)
            `)
            .eq('weapon_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['weapon']).flat() || []) as Weapon[];
        this.relationships.weaponByWeaponId[id] = results;
        return results;
    }

    async getSpellComponentTypeForSpellComponent(id: number): Promise<SpellComponentType[]> {
        // Check cache first
        if (this.relationships.spellComponentTypeByTypeId[id]) {
            return this.relationships.spellComponentTypeByTypeId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('spell_component')
            .select(`
                spell_component_type (*)
            `)
            .eq('type_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['spell_component_type']).flat() || []) as SpellComponentType[];
        this.relationships.spellComponentTypeByTypeId[id] = results;
        return results;
    }

    async getSpellForSpellComponentMapping(id: number): Promise<Spell[]> {
        // Check cache first
        if (this.relationships.spellBySpellId[id]) {
            return this.relationships.spellBySpellId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('spell_component_mapping')
            .select(`
                spell (*)
            `)
            .eq('spell_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['spell']).flat() || []) as Spell[];
        this.relationships.spellBySpellId[id] = results;
        return results;
    }

    async getSpellComponentForSpellComponentMapping(id: number): Promise<SpellComponent[]> {
        // Check cache first
        if (this.relationships.spellComponentBySpellComponentId[id]) {
            return this.relationships.spellComponentBySpellComponentId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('spell_component_mapping')
            .select(`
                spell_component (*)
            `)
            .eq('spell_component_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['spell_component']).flat() || []) as SpellComponent[];
        this.relationships.spellComponentBySpellComponentId[id] = results;
        return results;
    }

    async getSpellForSpellSorcererBloodlineMapping(id: number): Promise<Spell[]> {
        // Check cache first
        if (this.relationships.spellBySpellId[id]) {
            return this.relationships.spellBySpellId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('spell_sorcerer_bloodline_mapping')
            .select(`
                spell (*)
            `)
            .eq('spell_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['spell']).flat() || []) as Spell[];
        this.relationships.spellBySpellId[id] = results;
        return results;
    }

    async getSorcererBloodlineForSpellSorcererBloodlineMapping(id: number): Promise<SorcererBloodline[]> {
        // Check cache first
        if (this.relationships.sorcererBloodlineBySorcererBloodlineId[id]) {
            return this.relationships.sorcererBloodlineBySorcererBloodlineId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('spell_sorcerer_bloodline_mapping')
            .select(`
                sorcerer_bloodline (*)
            `)
            .eq('sorcerer_bloodline_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['sorcerer_bloodline']).flat() || []) as SorcererBloodline[];
        this.relationships.sorcererBloodlineBySorcererBloodlineId[id] = results;
        return results;
    }

    async getSpellForSpellSubdomainMapping(id: number): Promise<Spell[]> {
        // Check cache first
        if (this.relationships.spellBySpellId[id]) {
            return this.relationships.spellBySpellId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('spell_subdomain_mapping')
            .select(`
                spell (*)
            `)
            .eq('spell_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['spell']).flat() || []) as Spell[];
        this.relationships.spellBySpellId[id] = results;
        return results;
    }

    async getSubdomainForSpellSubdomainMapping(id: number): Promise<Subdomain[]> {
        // Check cache first
        if (this.relationships.subdomainBySubdomainId[id]) {
            return this.relationships.subdomainBySubdomainId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('spell_subdomain_mapping')
            .select(`
                subdomain (*)
            `)
            .eq('subdomain_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['subdomain']).flat() || []) as Subdomain[];
        this.relationships.subdomainBySubdomainId[id] = results;
        return results;
    }

    async getSpellForSpellSchoolMapping(id: number): Promise<Spell[]> {
        // Check cache first
        if (this.relationships.spellBySpellId[id]) {
            return this.relationships.spellBySpellId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('spell_school_mapping')
            .select(`
                spell (*)
            `)
            .eq('spell_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['spell']).flat() || []) as Spell[];
        this.relationships.spellBySpellId[id] = results;
        return results;
    }

    async getSpellSchoolForSpellSchoolMapping(id: number): Promise<SpellSchool[]> {
        // Check cache first
        if (this.relationships.spellSchoolBySpellSchoolId[id]) {
            return this.relationships.spellSchoolBySpellSchoolId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('spell_school_mapping')
            .select(`
                spell_school (*)
            `)
            .eq('spell_school_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['spell_school']).flat() || []) as SpellSchool[];
        this.relationships.spellSchoolBySpellSchoolId[id] = results;
        return results;
    }

    async getSpellForSpellCastingTimeMapping(id: number): Promise<Spell[]> {
        // Check cache first
        if (this.relationships.spellBySpellId[id]) {
            return this.relationships.spellBySpellId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('spell_casting_time_mapping')
            .select(`
                spell (*)
            `)
            .eq('spell_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['spell']).flat() || []) as Spell[];
        this.relationships.spellBySpellId[id] = results;
        return results;
    }

    async getSpellCastingTimeForSpellCastingTimeMapping(id: number): Promise<SpellCastingTime[]> {
        // Check cache first
        if (this.relationships.spellCastingTimeBySpellCastingTimeId[id]) {
            return this.relationships.spellCastingTimeBySpellCastingTimeId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('spell_casting_time_mapping')
            .select(`
                spell_casting_time (*)
            `)
            .eq('spell_casting_time_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['spell_casting_time']).flat() || []) as SpellCastingTime[];
        this.relationships.spellCastingTimeBySpellCastingTimeId[id] = results;
        return results;
    }

    async getSpellForSpellRangeMapping(id: number): Promise<Spell[]> {
        // Check cache first
        if (this.relationships.spellBySpellId[id]) {
            return this.relationships.spellBySpellId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('spell_range_mapping')
            .select(`
                spell (*)
            `)
            .eq('spell_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['spell']).flat() || []) as Spell[];
        this.relationships.spellBySpellId[id] = results;
        return results;
    }

    async getSpellRangeForSpellRangeMapping(id: number): Promise<SpellRange[]> {
        // Check cache first
        if (this.relationships.spellRangeBySpellRangeId[id]) {
            return this.relationships.spellRangeBySpellRangeId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('spell_range_mapping')
            .select(`
                spell_range (*)
            `)
            .eq('spell_range_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['spell_range']).flat() || []) as SpellRange[];
        this.relationships.spellRangeBySpellRangeId[id] = results;
        return results;
    }

    async getSpellForSpellTargetMapping(id: number): Promise<Spell[]> {
        // Check cache first
        if (this.relationships.spellBySpellId[id]) {
            return this.relationships.spellBySpellId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('spell_target_mapping')
            .select(`
                spell (*)
            `)
            .eq('spell_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['spell']).flat() || []) as Spell[];
        this.relationships.spellBySpellId[id] = results;
        return results;
    }

    async getSpellTargetForSpellTargetMapping(id: number): Promise<SpellTarget[]> {
        // Check cache first
        if (this.relationships.spellTargetBySpellTargetId[id]) {
            return this.relationships.spellTargetBySpellTargetId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('spell_target_mapping')
            .select(`
                spell_target (*)
            `)
            .eq('spell_target_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['spell_target']).flat() || []) as SpellTarget[];
        this.relationships.spellTargetBySpellTargetId[id] = results;
        return results;
    }

    async getSpellForSpellDurationMapping(id: number): Promise<Spell[]> {
        // Check cache first
        if (this.relationships.spellBySpellId[id]) {
            return this.relationships.spellBySpellId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('spell_duration_mapping')
            .select(`
                spell (*)
            `)
            .eq('spell_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['spell']).flat() || []) as Spell[];
        this.relationships.spellBySpellId[id] = results;
        return results;
    }

    async getSpellDurationForSpellDurationMapping(id: number): Promise<SpellDuration[]> {
        // Check cache first
        if (this.relationships.spellDurationBySpellDurationId[id]) {
            return this.relationships.spellDurationBySpellDurationId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('spell_duration_mapping')
            .select(`
                spell_duration (*)
            `)
            .eq('spell_duration_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['spell_duration']).flat() || []) as SpellDuration[];
        this.relationships.spellDurationBySpellDurationId[id] = results;
        return results;
    }

    async getSpellListForSpellListClassFeatureBenefitMapping(id: number): Promise<SpellList[]> {
        // Check cache first
        if (this.relationships.spellListBySpellListId[id]) {
            return this.relationships.spellListBySpellListId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('spell_list_class_feature_benefit_mapping')
            .select(`
                spell_list (*)
            `)
            .eq('spell_list_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['spell_list']).flat() || []) as SpellList[];
        this.relationships.spellListBySpellListId[id] = results;
        return results;
    }

    async getClassFeatureBenefitForSpellListClassFeatureBenefitMapping(id: number): Promise<ClassFeatureBenefit[]> {
        // Check cache first
        if (this.relationships.classFeatureBenefitByClassFeatureBenefitId[id]) {
            return this.relationships.classFeatureBenefitByClassFeatureBenefitId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('spell_list_class_feature_benefit_mapping')
            .select(`
                class_feature_benefit (*)
            `)
            .eq('class_feature_benefit_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['class_feature_benefit']).flat() || []) as ClassFeatureBenefit[];
        this.relationships.classFeatureBenefitByClassFeatureBenefitId[id] = results;
        return results;
    }

    async getSpellListForSpellListFeatMapping(id: number): Promise<SpellList[]> {
        // Check cache first
        if (this.relationships.spellListBySpellListId[id]) {
            return this.relationships.spellListBySpellListId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('spell_list_feat_mapping')
            .select(`
                spell_list (*)
            `)
            .eq('spell_list_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['spell_list']).flat() || []) as SpellList[];
        this.relationships.spellListBySpellListId[id] = results;
        return results;
    }

    async getFeatForSpellListFeatMapping(id: number): Promise<Feat[]> {
        // Check cache first
        if (this.relationships.featByFeatId[id]) {
            return this.relationships.featByFeatId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('spell_list_feat_mapping')
            .select(`
                feat (*)
            `)
            .eq('feat_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['feat']).flat() || []) as Feat[];
        this.relationships.featByFeatId[id] = results;
        return results;
    }

    async getSpellForSpellListSpellMapping(id: number): Promise<Spell[]> {
        // Check cache first
        if (this.relationships.spellBySpellId[id]) {
            return this.relationships.spellBySpellId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('spell_list_spell_mapping')
            .select(`
                spell (*)
            `)
            .eq('spell_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['spell']).flat() || []) as Spell[];
        this.relationships.spellBySpellId[id] = results;
        return results;
    }

    async getSpellListForSpellListSpellMapping(id: number): Promise<SpellList[]> {
        // Check cache first
        if (this.relationships.spellListBySpellListId[id]) {
            return this.relationships.spellListBySpellListId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('spell_list_spell_mapping')
            .select(`
                spell_list (*)
            `)
            .eq('spell_list_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['spell_list']).flat() || []) as SpellList[];
        this.relationships.spellListBySpellListId[id] = results;
        return results;
    }

    async getPrerequisiteRequirementTypeForPrerequisiteRequirement(id: number): Promise<PrerequisiteRequirementType[]> {
        // Check cache first
        if (this.relationships.prerequisiteRequirementTypeByRequirementTypeId[id]) {
            return this.relationships.prerequisiteRequirementTypeByRequirementTypeId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('prerequisite_requirement')
            .select(`
                prerequisite_requirement_type (*)
            `)
            .eq('requirement_type_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['prerequisite_requirement_type']).flat() || []) as PrerequisiteRequirementType[];
        this.relationships.prerequisiteRequirementTypeByRequirementTypeId[id] = results;
        return results;
    }

    async getPrerequisiteFulfillmentForFulfillmentQualificationMapping(id: number): Promise<PrerequisiteFulfillment[]> {
        // Check cache first
        if (this.relationships.prerequisiteFulfillmentByFulfillmentId[id]) {
            return this.relationships.prerequisiteFulfillmentByFulfillmentId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('fulfillment_qualification_mapping')
            .select(`
                prerequisite_fulfillment (*)
            `)
            .eq('fulfillment_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['prerequisite_fulfillment']).flat() || []) as PrerequisiteFulfillment[];
        this.relationships.prerequisiteFulfillmentByFulfillmentId[id] = results;
        return results;
    }

    async getQualificationTypeForFulfillmentQualificationMapping(id: number): Promise<QualificationType[]> {
        // Check cache first
        if (this.relationships.qualificationTypeByQualificationTypeId[id]) {
            return this.relationships.qualificationTypeByQualificationTypeId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('fulfillment_qualification_mapping')
            .select(`
                qualification_type (*)
            `)
            .eq('qualification_type_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['qualification_type']).flat() || []) as QualificationType[];
        this.relationships.qualificationTypeByQualificationTypeId[id] = results;
        return results;
    }

    async getPrerequisiteRequirementForPrerequisiteRequirementFulfillmentMapping(id: number): Promise<PrerequisiteRequirement[]> {
        // Check cache first
        if (this.relationships.prerequisiteRequirementByPrerequisiteRequirementId[id]) {
            return this.relationships.prerequisiteRequirementByPrerequisiteRequirementId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('prerequisite_requirement_fulfillment_mapping')
            .select(`
                prerequisite_requirement (*)
            `)
            .eq('prerequisite_requirement_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['prerequisite_requirement']).flat() || []) as PrerequisiteRequirement[];
        this.relationships.prerequisiteRequirementByPrerequisiteRequirementId[id] = results;
        return results;
    }

    async getPrerequisiteFulfillmentForPrerequisiteRequirementFulfillmentMapping(id: number): Promise<PrerequisiteFulfillment[]> {
        // Check cache first
        if (this.relationships.prerequisiteFulfillmentByPrerequisiteFulfillmentId[id]) {
            return this.relationships.prerequisiteFulfillmentByPrerequisiteFulfillmentId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('prerequisite_requirement_fulfillment_mapping')
            .select(`
                prerequisite_fulfillment (*)
            `)
            .eq('prerequisite_fulfillment_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['prerequisite_fulfillment']).flat() || []) as PrerequisiteFulfillment[];
        this.relationships.prerequisiteFulfillmentByPrerequisiteFulfillmentId[id] = results;
        return results;
    }

    async getFeatForFeatBenefit(id: number): Promise<Feat[]> {
        // Check cache first
        if (this.relationships.featByFeatId[id]) {
            return this.relationships.featByFeatId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('feat_benefit')
            .select(`
                feat (*)
            `)
            .eq('feat_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['feat']).flat() || []) as Feat[];
        this.relationships.featByFeatId[id] = results;
        return results;
    }

    async getSpellSchoolForFeatBenefit(id: number): Promise<SpellSchool[]> {
        // Check cache first
        if (this.relationships.spellSchoolBySchoolId[id]) {
            return this.relationships.spellSchoolBySchoolId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('feat_benefit')
            .select(`
                spell_school (*)
            `)
            .eq('school_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['spell_school']).flat() || []) as SpellSchool[];
        this.relationships.spellSchoolBySchoolId[id] = results;
        return results;
    }

    async getQinggongMonkKiPowerTypeForQinggongMonkKiPower(id: number): Promise<QinggongMonkKiPowerType[]> {
        // Check cache first
        if (this.relationships.qinggongMonkKiPowerTypeByPowerTypeId[id]) {
            return this.relationships.qinggongMonkKiPowerTypeByPowerTypeId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('qinggong_monk_ki_power')
            .select(`
                qinggong_monk_ki_power_type (*)
            `)
            .eq('power_type_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['qinggong_monk_ki_power_type']).flat() || []) as QinggongMonkKiPowerType[];
        this.relationships.qinggongMonkKiPowerTypeByPowerTypeId[id] = results;
        return results;
    }

    async getClassForQinggongMonkKiPower(id: number): Promise<Class[]> {
        // Check cache first
        if (this.relationships.classByClassId[id]) {
            return this.relationships.classByClassId[id];
        }

        // Load from database
        const { data, error } = await this.supabase
            .from('qinggong_monk_ki_power')
            .select(`
                class (*)
            `)
            .eq('class_id', id);
        
        if (error) throw error;
        
        // Cache and return results
        const results = (data?.map(r => r['class']).flat() || []) as Class[];
        this.relationships.classByClassId[id] = results;
        return results;
    }
}
