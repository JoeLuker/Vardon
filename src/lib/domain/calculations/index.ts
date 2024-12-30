// Re-export types
export type {
    // Database-derived types
    BaseSkill,
    CharacterBuff,
    BonusType,
    CharacterClass,
    FavoredClassBonus,
    AncestralTraitBonus,
    CharacterABPBonus,
    CharacterABPBonusTarget,
    CharacterABPBonusWithTargets,
    ABPBonusAssignment,
    CharacterSkillRank,
    SkillDefinition,
    ConditionalBonus,
  
    // Effect types
    Effect,
    BuffWithEffects,
    FeatWithEffects,
  
    // Core interfaces
    AbilityScores,
    AbilityModifiers,
    CharacterLevelInfo,
    ABPModifiers,
    ItemProperty,
    BaseItem,
    ArmorStats,
    WeaponStats,
    CharacterFinalStats,
  
    // Calculation argument types
    ComputeMaxHPArgs,
    ComputeAttackBonusArgs,
    ComputeSkillBonusArgs,
    ComputeACArgs,
    ComputeCmdArgs,
    FinalizeCharacterArgs,
  
    // Additional types
    SkillAbilityReplacement,
    TypedBonus,
    ArmorItem,
    AncestralTrait,
    Ancestry,
    AncestralTraitEffects,
    SaveResults,
  } from './character'
  
  // Re-export constants
  export {
    BAB_PROGRESSION,
    SAVE_PROGRESSION,
    SIZE_CATEGORIES,
    SIZE_MODIFIERS,
    SIZE_SPECIAL_MODIFIERS,
  } from './character'
  
  // Re-export functions
  export {
    // Core calculation functions
    computeAbilityModifier,
    computeAllAbilityModifiers,
    consolidateABPBonuses,
    computeMaxHP,
    getBaseSave,
    computeSaves,
    getBaseAttackBonus,
    computeAttackBonus,
    computeSkillBonus,
    computeAC,
    computeCMD,
    finalizeCharacter,
  
    // Equipment related
    parseNumericProperty,
    parseArmorProperties,
    parseWeaponProperties,
    computeArmorStats,
  
    // Helper functions
    stackBonuses,
    isValidBuff,
    applyAttributeModifiers,
    processSkillBonuses,
    getSizeModifier,
    getSpecialSizeModifier,
    getEffectiveSkillAbility,
    processAncestralTraits,
    processTraitSkillModifiers,
  } from './character'