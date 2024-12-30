// FILE: src/lib/db/index.ts

export type {
  CharacterRow,
  CharacterAttributesRow,
  RPGEntityRow,
  CharacterRPGEntityRow,
  EntityChoiceRow,
  CharacterEntityChoiceRow,
  EntityPrerequisiteRow,
  CharacterWithRelations,
  CharacterChangeEvent
} from './core';

export {
  watchCharacter,
  getCharacter,
  listCharacters,
  createCharacter,
  updateCharacter,
  updateCharacterAttributes,
  deleteCharacter,
  addCharacterEntity,
  updateCharacterEntity,
  removeCharacterEntity,
  addCharacterEntityChoice,
  updateCharacterEntityChoice,
  removeCharacterEntityChoice,
  watchEntityPrerequisites,
  getEntityPrerequisites,
  addEntityPrerequisite,
  updateEntityPrerequisite,
  removeEntityPrerequisite
} from './core';



export type {
    ABPBonusRow,
    ABPBonusTargetsRow,
    ABPBonusTypeRow,
    ABPBonusWithRelations,
    ABPBonusChangeEvent
} from './abp';

export {
    watchABPBonusesForCharacter,
    getABPBonusesForCharacter,
    addABPBonus,
    updateABPBonus,
    removeABPBonus,
    addBonusTarget,
    updateBonusTarget,
    removeBonusTarget,
    addBonusType,
    updateBonusType,
    removeBonusType
} from './abp'


// Types
export type {
  AncestryRow,
  AncestralTraitRow,
  AltAncestralTraitRow,
  AncestryAbilityModifierRow,
  CharacterAncestryRow,
  CharacterAncestralTraitRow,
  CharacterAltTraitRow,
  TraitBonusFeatRow,
  TraitConditionalBonusRow,
  TraitNaturalAttackRow,
  TraitSkillBonusRow,
  TraitSpecialRow,
  TraitVisionRow,
  TraitWeaponProficiencyRow,
  AltTraitReplacementRow,
  AncestralTraitWithDetails,
  AncestryWithRelations,
  CharacterAncestryChangeEvent,
  TraitChangeEvent
} from './ancestries';

// Error Classes
export { AncestryError, ValidationError, ConflictError } from './ancestries';

// Functions
export {
  watchTraitChanges,
  watchCharacterAncestry,
  checkAltTraitConflicts,
  validateTraitRequirements,
  traitComponents,
  listAncestries,
  getAncestry,
  getAvailableAltTraits,
  getCharacterAncestry,
  setCharacterAncestry,
  addCharacterAncestralTrait,
  removeCharacterAncestralTrait,
  bulkUpdateCharacterTraits,
  addCharacterAltAncestralTrait,
  removeCharacterAltAncestralTrait,
  canReplaceTraitWithAlt,
  getReplacedTraitsForAltTrait,
  isTraitSelected
} from './ancestries';


export type {
  // Core class types
  ClassRow,
  ClassFeatureRow,
  ClassProgressionRow,
  ClassSkillRelationRow,
  
  // Character-specific types
  CharacterClassFeatureRow,
  CharacterClassFeaturePropertyRow,
  
  // Extended interfaces
  ClassFeatureWithDetails,
  ClassWithRelations,
  
  // Real-time types
  ClassFeatureChangeEvent,
} from './rpgClasses';

export {
  // Real-time Subscriptions
  watchCharacterClassFeatures,
  
  // Core Class Operations
  listClasses,
  getClass,
  
  // Character Class Features
  getCharacterClassFeatures,
  addCharacterClassFeature,
  updateCharacterClassFeature,
  removeCharacterClassFeature,
  
  // Feature Properties
  addFeatureProperty,
  updateFeatureProperty,
  removeFeatureProperty,
  
  // Class Skill Relations
  getClassSkills,
} from './rpgClasses';


// Types
export type { 
  ArchetypeRow,
  ArchetypeFeatureReplacementRow,
  ArchetypeWithRelations,
  ArchetypeChangeEvent
} from './archetypes';

export { 
  // Real-time Subscriptions
  watchArchetype,

// Core Operations
  listArchetypes,
  getArchetype,
  getArchetypesForClass,

// Feature Replacements
  getArchetypeFeatureReplacements,
  getReplacedFeaturesAtLevel,
  isFeatureReplacedAtLevel,
  getReplacementFeature,


// Validation Helpers
  isArchetypeCompatibleWithClass,
  getArchetypeReplacedFeatures
} from './archetypes';


export type {
  SkillRow,
  CharacterSkillRankRow,
  SkillRankSourceRow,
  SkillBonusRow,
  // ClassSkillRelationRow,
  SkillWithRelations,
  CharacterSkillWithDetails,
  SkillRankChangeEvent
} from './skills';

export {
  // Real-time Subscriptions
  watchCharacterSkillRanks,

  // Core Skill Operations
  listSkills,
  getSkill,
  // getClassSkills,

  // Character Skill Operations
  getCharacterSkillRanks,
  addSkillRank,
  removeSkillRank,
  getSkillRankTotal,

  // Skill Rank Sources
  listSkillRankSources,
  getSkillRanksFromSource,

  // Bulk Operations
  bulkAddSkillRanks,
  distributeSkillRanks,

  // Validation Helpers
  canAddSkillRank,
  isClassSkill,
  getSkillAbilityModifier
} from './skills';


// All Types
export type {
  // CharacterRow,
  // CharacterAttributesRow,
  // CharacterRPGEntityRow,
  CharacterEquipmentRow,
  CharacterEquipmentPropertyRow,
  CharacterConsumableRow,
  CharacterWithAttributes,
  CharacterEquipmentWithProperties,
  // CharacterChangeEvent
} from './characters';

// All Functions
export {
  // watchCharacter,
  // createCharacter,
  // getCharacter,
  // listCharacters,
  // updateCharacter,
  // deleteCharacter,
  updateAttributes,
  getCharacterEquipment,
  addEquipment,
  toggleEquipment,
  removeEquipment,
  getCharacterConsumables,
  addConsumable,
  updateConsumableQuantity,
  removeConsumable,
  updateCurrentHP,
  updateMaxHP
} from './characters';



// Types
export type {
  // CharacterEquipmentRow,
  // CharacterEquipmentPropertyRow,
  // CharacterConsumableRow,
  EquipmentWithProperties,
  EquipmentChangeEvent,
  ConsumableChangeEvent
} from './equipment';

export {

  // Real-time Subscriptions

  watchCharacterEquipment,
  watchCharacterConsumables,

// Equipment Operations

  getEquipment,
  getEquipmentByType,
  // addEquipment,
  getEquipmentById,
  updateEquipment,
  // removeEquipment,

// Equipment Properties

  addEquipmentProperty,
  updateEquipmentProperty,
  removeEquipmentProperty,

// Consumables
  getConsumables
  // addConsumable,
  // updateConsumableQuantity,
  // removeConsumable
} from './equipment';


// Types
export type {
  CharacterFeatRow,
  CharacterFeatPropertyRow,
  FeatWithProperties,
  FeatChangeEvent
} from './feats';

// Functions
export {
  watchCharacterFeats,
  getFeats,
  addFeat,
  getFeatById,
  removeFeat,
  addFeatProperty,
  updateFeatProperty,
  removeFeatProperty
} from './feats';


// Types
export type {
  KnownSpellRow,
  SpellSlotRow,
  ExtractRow,
  KnownSpellChangeEvent,
  SpellSlotChangeEvent,
  ExtractChangeEvent
} from './magic';

// Real-time Subscriptions
export {
  watchKnownSpellsForCharacter,
  watchSpellSlotsForCharacter,
  watchExtractsForCharacter,

// Known Spells CRUD
  getKnownSpellsForCharacter,
  addKnownSpell,
  updateKnownSpell,
  removeKnownSpell,

// Spell Slots CRUD
  getSpellSlotsForCharacter,
  updateSpellSlot,
  bulkUpsertSpellSlots,

// Extracts CRUD

  getExtractsForCharacter,
  addExtract,
  updateExtract,
  removeExtract
} from './magic';


// Types
export type {
  BaseCorruptionRow,
  CharacterCorruptionRow,
  CorruptionManifestationRow,
  CorruptionChangeEvent,
  CorruptionManifestationChangeEvent
} from './corruptions';

export {
  // Real-time Subscriptions
  watchCorruptionForCharacter,
  watchCorruptionManifestationsForCharacter,

// Base Corruptions
  getBaseCorruptions,
  getBaseCorruptionById,

// Character Corruptions CRUD
  getCorruptionForCharacter,
  addCorruption,
  updateCorruption,
  removeCorruption,

// Corruption Manifestations CRUD
  getCorruptionManifestationsForCharacter,
  addCorruptionManifestation,
  updateCorruptionManifestation,
  removeCorruptionManifestation
} from './corruptions';



export type {
  // Types
  CharacterDiscoveryRow,
  CharacterDiscoveryPropertyRow,
  DiscoveryWithProperties,
  DiscoveryChangeEvent,
  DiscoveryPropertyChangeEvent,
} from './discoveries';

export {
  // Real-time Subscriptions
  watchCharacterDiscoveries,
  watchDiscoveryProperties,

  // Discovery CRUD
  getDiscoveriesForCharacter,
  getDiscoveryById,
  addDiscovery,
  updateDiscovery,
  removeDiscovery,

  // Discovery Properties CRUD
  getDiscoveryProperties,
  addDiscoveryProperty,
  updateDiscoveryProperty,
  removeDiscoveryProperty,
} from './discoveries';


// Types
export type {
  NaturalAttackRow,
  CharacterBombRow,
  NaturalAttackChangeEvent,
  CharacterBombChangeEvent
} from './combat';

export {
  // Real-time Subscriptions
  watchNaturalAttacksForEntity,
  watchCharacterBombs,

// Natural Attacks CRUD

  getNaturalAttacksForEntity,
  addNaturalAttack,
  updateNaturalAttack,
  removeNaturalAttack,

// Character Bombs CRUD
  getBombsForCharacter,
  addBomb,
  updateBomb,
  removeBomb
} from './combat';


// Types
export type {
  FavoredClassChoiceRow,
  CharacterFavoredClassBonusRow,
  FavoredClassChoiceChangeEvent,
  CharacterFavoredClassBonusChangeEvent
} from './advancement';

export {

// Real-time Subscriptions
  watchFavoredClassChoices,
  watchCharacterFavoredClassBonuses,

// Favored Class Choices CRUD
  listFavoredClassChoices,
  getFavoredClassChoiceById,
  addFavoredClassChoice,
  updateFavoredClassChoice,
  removeFavoredClassChoice,

// Character Favored Class Bonuses CRUD
  getFavoredClassBonusesForCharacter,
  addFavoredClassBonus,
  updateFavoredClassBonus,
  removeFavoredClassBonus
} from './advancement';

export type {
  BuffRow,
  BuffTypeRow,
  BuffWithRelations,
  BuffChangeEvent
} from './buffs';

export {
  watchBuffsForCharacter,
  getBuffsForCharacter,
  getBuffTypes,
  addBuff,
  updateBuff,
  removeBuff
} from './buffs';