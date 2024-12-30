// FILE: calculations.ts

import type { Database } from '../types/supabase'

// -----------------------------------------------------------------------------
// 1) RE-USE THE DB ROW TYPES INSTEAD OF DUPLICATING
// -----------------------------------------------------------------------------

// Re-use your DB row (and enum) types so you don’t redefine them manually.
export type BaseSkill = Database['public']['Tables']['base_skills']['Row']
export type CharacterBuff = Database['public']['Tables']['character_buffs']['Row']
export type BonusType = Database['public']['Tables']['bonus_types']['Row']
// type WeaponProficiency = Database['public']['Tables']['weapon_proficiencies']['Row']
export type CharacterClass = Database['public']['Tables']['base_classes']['Row']
// type NaturalAttack = Database['public']['Tables']['natural_attacks']['Row']
export type FavoredClassBonus = Database['public']['Tables']['character_favored_class_bonuses']['Row']
export type AncestralTraitBonus = Database['public']['Tables']['ancestral_trait_conditional_bonuses']['Row']

// ABP bonus row + optional child row (character_abp_bonus_targets)
export type CharacterABPBonus = Database['public']['Tables']['character_abp_bonuses']['Row']
export type CharacterABPBonusTarget = Database['public']['Tables']['character_abp_bonus_targets']['Row']
export type CharacterABPBonusWithTargets = CharacterABPBonus & {
  targets?: CharacterABPBonusTarget[]
  choices?: Array<{
    key: string
    value: string
  }>
}

// If you want to unify both forms (with/without targets) under a single alias:
export type ABPBonusAssignment = CharacterABPBonusWithTargets

// If you store skill ranks in character_skill_ranks
export type CharacterSkillRank = Database['public']['Tables']['character_skill_ranks']['Row']

// Instead of re-declaring “SkillDefinition”, we’ll *extend* BaseSkill if needed.
export type SkillDefinition = BaseSkill & {
  // If you want an extra field that doesn’t exist in your DB row:
  ability_key?: string
}

// If you have “conditional bonuses” from multiple tables, you can union them,
// but for now we’ll treat them as the same shape as AncestralTraitBonus:
export type ConditionalBonus = AncestralTraitBonus

// -----------------------------------------------------------------------------
// 1) EFFECT TYPES FROM DB
// -----------------------------------------------------------------------------

type BaseBuffEffect = Database['public']['Tables']['base_buff_effects']['Row']
// type FeatEffect = Database['public']['Tables']['feat_effects']['Row']
// type SkillBonus = Database['public']['Tables']['skill_bonuses']['Row']

/** Unified interface for effects from different sources */
export interface Effect {
  effect_type: string
  target?: string | null
  modifier?: number | null
  description?: string | null
  bonus_type?: string
}

/** Extended buff type that includes its effects */
export interface BuffWithEffects {
  id: number
  is_active: boolean
  buff_type_id: number | null
  effects?: BaseBuffEffect[]
}

/** Extended feat type that includes its effects */
export interface FeatWithEffects {
  id: number
  name: string
  effects?: Array<{
    effect_type: any
    type: string
    value: number
    target?: string
  }>
}

// -----------------------------------------------------------------------------
// 2) SIMPLE / NON-DB INTERFACES
// -----------------------------------------------------------------------------

/** Simple representation of a character’s 6 ability scores. */
export interface AbilityScores {
  str: number
  dex: number
  con: number
  int: number
  wis: number
  cha: number
}

/** The 6 derived ability modifiers. */
export interface AbilityModifiers {
  strMod: number
  dexMod: number
  conMod: number
  intMod: number
  wisMod: number
  chaMod: number
}

/** PF1-like BAB progression. */
export const BAB_PROGRESSION = {
  FULL: 'full',
  THREE_FOURTHS: 'threeFourths',
  HALF: 'half',
} as const
export type BABProgression = typeof BAB_PROGRESSION[keyof typeof BAB_PROGRESSION]

/** PF1-like save progression. */
export const SAVE_PROGRESSION = {
  GOOD: 'good',
  POOR: 'poor',
} as const
export type SaveProgression = typeof SAVE_PROGRESSION[keyof typeof SAVE_PROGRESSION]

/** Summarizes a character’s class-level info. */
export interface CharacterLevelInfo {
  level: number
  hitDie: number
  babProgression: BABProgression
  baseSaveProgressions: {
    fort: SaveProgression
    ref: SaveProgression
    will: SaveProgression
  }
}

/**
 * For final ABP results after applying “sum” or “take highest”.
 * Not stored in DB, purely computed.
 */
export interface ABPModifiers {
  resistance?: number
  armorAttunement?: number
  weaponAttunement?: number
  deflection?: number
  mentalProwess?: number
  physicalProwess?: number
  toughening?: number
  otherBonuses?: Array<{ label: string; value: number }>
  mentalProwessChoice?: keyof AbilityScores
  physicalProwessChoice?: keyof AbilityScores
}

/** Generic property interface matching your YAML/DB structure */
export interface ItemProperty {
  property_key: string
  property_value: string
  property_type?: string
}

/** Base interface for equipment items */
export interface BaseItem {
  id: number
  name: string
  type: string
  equipped?: boolean
  properties: ItemProperty[]
}

/** Parsed armor stats from properties */
export interface ArmorStats {
  totalArmorBonus: number
  maxDex: number
  armorCheckPenalty: number
  spellFailure?: number
  speed?: {
    base30?: number
    base20?: number
  }
}

/**
 * Parse numeric property value, with fallback
 */
export function parseNumericProperty(
  properties: ItemProperty[],
  key: string,
  defaultValue: number = 0
): number {
  const prop = properties.find(p => p.property_key === key)
  return prop ? Number(prop.property_value) || defaultValue : defaultValue
}

/**
 * Parse armor properties into structured data
 */
export function parseArmorProperties(item: BaseItem): ArmorStats {
  const armorBonus = parseNumericProperty(item.properties, 'armor_bonus')
  const maxDex = parseNumericProperty(item.properties, 'max_dex', 99)
  const armorCheckPenalty = parseNumericProperty(item.properties, 'armor_check_penalty')
  const spellFailure = parseNumericProperty(item.properties, 'spell_failure')
  
  // Parse speed modifications if present
  const speed30Prop = item.properties.find(p => p.property_key === 'speed_30')
  const speed20Prop = item.properties.find(p => p.property_key === 'speed_20')
  
  const speed = speed30Prop || speed20Prop ? {
    base30: speed30Prop ? Number(speed30Prop.property_value) : undefined,
    base20: speed20Prop ? Number(speed20Prop.property_value) : undefined
  } : undefined

  return {
    totalArmorBonus: armorBonus,
    maxDex,
    armorCheckPenalty,
    spellFailure,
    speed
  }
}

/**
 * Parse weapon properties into structured data
 */
export interface WeaponStats {
  damage: string
  criticalRange?: number
  criticalMultiplier?: number
  damageType?: string[]
  range?: number
  special?: string[]
}

export function parseWeaponProperties(item: BaseItem): WeaponStats {
  const damage = item.properties.find(p => p.property_key === 'damage')?.property_value || '1d4'
  const critRange = parseNumericProperty(item.properties, 'critical_range', 20)
  const critMult = parseNumericProperty(item.properties, 'critical_multiplier', 2)
  const range = parseNumericProperty(item.properties, 'range')
  
  // Parse damage types (e.g., "S,P" for slash and pierce)
  const damageTypeProp = item.properties.find(p => p.property_key === 'damage_type')
  const damageType = damageTypeProp?.property_value.split(',').map(t => t.trim())
  
  // Parse special properties (e.g., "brace,reach")
  const specialProp = item.properties.find(p => p.property_key === 'special')
  const special = specialProp?.property_value.split(',').map(s => s.trim())

  return {
    damage,
    criticalRange: critRange,
    criticalMultiplier: critMult,
    damageType,
    range,
    special
  }
}

/** 
 * Aggregates equipped armor's total bonus, the min "maxDex," sum of ACP, etc.
 */
export function computeArmorStats(equippedItems: ArmorItem[]): ArmorStats {
  let totalArmorBonus = 0
  let maxDexList: number[] = []
  let totalACP = 0

  for (const item of equippedItems) {
    if (!item.equipped) continue
    totalArmorBonus += item.armorBonus
    maxDexList.push(item.maxDex)
    totalACP += item.armorCheckPenalty
  }

  // The limiting maxDex is the smallest among the equipped pieces
  const finalMaxDex = maxDexList.length > 0 ? Math.min(...maxDexList) : 99

  return {
    totalArmorBonus,
    maxDex: finalMaxDex,
    armorCheckPenalty: totalACP,
  }
}

/** 
 * A final "computed" stats shape that you might store in Redux or pass 
 * around your front-end. 
 */
export interface CharacterFinalStats {
  level: number
  abilityScores: AbilityScores
  abilityModifiers: AbilityModifiers
  maxHP: number
  currentHP: number
  baseAttackBonus: number
  meleeAttackBonus: number
  rangedAttackBonus: number
  AC: number
  touchAC: number
  flatFootedAC: number
  saves: SaveResults
  cmd: number
  skillBonuses: { [skillId: number]: number }
  weaponProficiencies: string[]
  naturalAttacks: Array<{
    id: number
    type: string
    count: number
    damage: string
    entity_id: number
    created_at: string | null
    updated_at: string | null
    properties: Array<{
      property_key: string
      property_value: string
    }>
  }>
  visions: string[]
  specialAbilities: string[]
  activeBuffs: number[]
  activeConditions: string[]
  equippedWeapons: any[] // Replace 'any' with proper weapon type
}

// -----------------------------------------------------------------------------
// 3) BASIC HELPER FUNCTIONS
// -----------------------------------------------------------------------------

/** Standard PF1-ish ability mod formula: floor((score - 10)/2). */
export function computeAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

/** Compute all 6 modifiers at once. */
export function computeAllAbilityModifiers(abilities: AbilityScores): AbilityModifiers {
  return {
    strMod: computeAbilityModifier(abilities.str),
    dexMod: computeAbilityModifier(abilities.dex),
    conMod: computeAbilityModifier(abilities.con),
    intMod: computeAbilityModifier(abilities.int),
    wisMod: computeAbilityModifier(abilities.wis),
    chaMod: computeAbilityModifier(abilities.cha),
  }
}

/**
 * Combine an array of ABP bonuses into a single object. 
 * For example, "deflection" is take-highest, "physical_prowess" is sum, etc.
 */
export function consolidateABPBonuses(bonuses: ABPBonusAssignment[]): ABPModifiers {
  if (!Array.isArray(bonuses)) {
    throw new Error('Expected array of ABP bonuses')
  }

  const result: ABPModifiers = {
    resistance: 0,
    armorAttunement: 0,
    weaponAttunement: 0,
    deflection: 0,
    mentalProwess: 0,
    physicalProwess: 0,
    toughening: 0,
    otherBonuses: [],
    mentalProwessChoice: undefined,
    physicalProwessChoice: undefined,
  }

  for (const b of bonuses) {
    if (b.bonus_type_id == null) continue

    switch (b.bonus_type_id) {
      case 1: // resistance
        result.resistance = Math.max(result.resistance || 0, b.value)
        break
      case 2: // armor_attunement
        result.armorAttunement = Math.max(result.armorAttunement || 0, b.value)
        break
      case 3: // weapon_attunement
        result.weaponAttunement = Math.max(result.weaponAttunement || 0, b.value)
        break
      case 4: // deflection
        result.deflection = Math.max(result.deflection || 0, b.value)
        break
      case 5: // mental_prowess
        result.mentalProwess = (result.mentalProwess || 0) + b.value
        break
      case 6: // mental_prowess_choice
        result.mentalProwess = (result.mentalProwess || 0) + b.value
        if (b.choices && b.choices.length > 0) {
          const choice = b.choices.find(c => c.key === 'target')
          if (choice) {
            result.mentalProwessChoice = choice.value as keyof AbilityScores
          }
        }
        break
      case 7: // physical_prowess
        result.physicalProwess = (result.physicalProwess || 0) + b.value
        break
      case 8: // physical_prowess_choice
        result.physicalProwess = (result.physicalProwess || 0) + b.value
        if (b.choices && b.choices.length > 0) {
          const choice = b.choices.find(c => c.key === 'target')
          if (choice) {
            result.physicalProwessChoice = choice.value as keyof AbilityScores
          }
        }
        break
      case 9: // toughening
        result.toughening = Math.max(result.toughening || 0, b.value)
        break
      default:
        result.otherBonuses?.push({ label: b.bonus_type_id.toString(), value: b.value })
        break
    }
  }

  return result
}

// -----------------------------------------------------------------------------
// 4) HIT POINTS & FAVORED CLASS BONUSES
// -----------------------------------------------------------------------------

export interface ComputeMaxHPArgs {
  level: number
  hitDie: number
  conMod: number
  favoredClassBonuses: Array<{ choiceId: number }>
}

/**
 * Basic example logic for summing up HP from class Hit Die, Con, favored class, etc.
 * Adjust for your house rules or rolling method.
 */
export function computeMaxHP(args: ComputeMaxHPArgs): number {
  const { level, hitDie, conMod, favoredClassBonuses } = args

  let baseHp = 0
  for (let lvl = 1; lvl <= level; lvl++) {
    if (lvl === 1) {
      baseHp += hitDie // full at level 1
    } else {
      baseHp += Math.floor(hitDie / 2) + 1 // average
    }
  }
  const conHp = conMod * level
  // Example assumption: favored_choice_id = 1 => +1 HP
  const fcHp = favoredClassBonuses.filter((fcb) => fcb.choiceId === 1).length

  return baseHp + conHp + fcHp
}

// -----------------------------------------------------------------------------
// 5) SAVE CALCULATIONS
// -----------------------------------------------------------------------------

/** Simple "good" vs "poor" progression for Fort/Ref/Will. Adjust as needed. */
export function getBaseSave(level: number, progression: SaveProgression): number {
  if (progression === 'good') {
    return Math.floor((level * 2) / 3 + 2)
  } else {
    return Math.floor(level / 3)
  }
}

/**
 * Consolidates base saves, ability mods, ABP "resistance," and 
 * conditional bonuses if the conditions are active.
 */
export function computeSaves(
  level: number,
  baseSaveProgs: { fort: SaveProgression; ref: SaveProgression; will: SaveProgression },
  abilityMods: AbilityModifiers,
  abpResistance?: number,
  conditionalBonuses?: ConditionalBonus[],
  activeConditions?: string[],
): { fort: number; ref: number; will: number } {
  const baseFort = getBaseSave(level, baseSaveProgs.fort)
  const baseRef = getBaseSave(level, baseSaveProgs.ref)
  const baseWill = getBaseSave(level, baseSaveProgs.will)

  let fort = baseFort + abilityMods.conMod
  let ref = baseRef + abilityMods.dexMod
  let will = baseWill + abilityMods.wisMod

  // Apply ABP "resistance" to all saves
  if (abpResistance && abpResistance > 0) {
    fort += abpResistance
    ref += abpResistance
    will += abpResistance
  }

  // Apply conditional bonuses if conditions are met
  if (conditionalBonuses && activeConditions) {
    for (const cb of conditionalBonuses) {
      if (
        cb.apply_to === 'saves' &&
        cb.condition &&
        activeConditions.includes(cb.condition)
      ) {
        fort += cb.value
        ref += cb.value
        will += cb.value
      }
    }
  }

  return { fort, ref, will }
}

// -----------------------------------------------------------------------------
// 6) BASE ATTACK BONUS & ATTACK CALCULATIONS
// -----------------------------------------------------------------------------

/**
 * PF1 typical:
 * - full = +1 / level
 * - threeFourths = +3/4 per level
 * - half = +1/2 per level
 */
export function getBaseAttackBonus(level: number, progression: BABProgression): number {
  switch (progression) {
    case 'full':
      return level
    case 'threeFourths':
      return Math.floor((3 * level) / 4)
    case 'half':
      return Math.floor(level / 2)
    default:
      return 0
  }
}

export interface ComputeAttackBonusArgs {
  bab: number
  abilityMod: number
  weaponAttunement?: number
  buffs?: BuffWithEffects[]
  feats?: FeatWithEffects[]
  sizeModifier?: number
}

/**
 * Start with BAB + ability mod, add ABP "weaponAttunement," 
 * factor in feats or buffs. 
 */
export function computeAttackBonus(args: ComputeAttackBonusArgs): number {
  let bonus = args.bab + args.abilityMod

  if (args.weaponAttunement && args.weaponAttunement > 0) {
    bonus += args.weaponAttunement
  }
  // Very simplified: e.g. if feats includes "PowerAttack," -1 to attack
  if (args.feats?.some(feat => feat.name === 'PowerAttack')) {
    bonus -= 1
  }

  // Buffs might store extra attack bonuses in a related table (e.g. base_buff_effects).
  // You’d look them up, sum them, etc. Here’s a trivial placeholder:
  if (args.buffs) {
    for (const b of args.buffs) {
      if (!b.is_active) continue
      // If you have e.g. a "target_key = 'attack'" or "effect_type = 'attack'", 
      // then add it. We skip the details since it depends on your DB structure.
    }
  }

  // Apply size modifier if provided
  if (args.sizeModifier) {
    bonus += args.sizeModifier
  }

  return bonus
}

// -----------------------------------------------------------------------------
// 7) SKILL CALCULATIONS
// -----------------------------------------------------------------------------

/** Represents a skill's ability score replacement from a trait/feat/etc. */
export interface SkillAbilityReplacement {
  skillName: string
  fromAbility: keyof AbilityScores
  toAbility: keyof AbilityScores
  source?: string // e.g. "trait:clever_wordplay"
}

/** Extended args for skill bonus computation */
export interface ComputeSkillBonusArgs {
  skill: SkillDefinition
  totalRanks: number
  isClassSkill: boolean
  abilityModifiers: AbilityModifiers
  armorCheckPenalty: number
  typedBonuses: Array<{
    bonusType: BonusType['name']
    value: number
    appliesTo: string
  }>
  // Add new field for ability replacements
  abilityReplacements?: SkillAbilityReplacement[]
}

/**
 * Determines which ability modifier to use for a skill, accounting for
 * traits/feats that might replace the default ability.
 */
export function getEffectiveSkillAbility(
  skill: SkillDefinition,
  replacements?: SkillAbilityReplacement[]
): keyof AbilityScores {
  if (!replacements?.length) {
    return skill.ability.toLowerCase() as keyof AbilityScores
  }

  // Find any replacement that matches this skill
  const replacement = replacements.find(
    (r) => r.skillName.toLowerCase() === skill.name.toLowerCase() && 
          r.fromAbility === skill.ability.toLowerCase()
  )

  return replacement?.toAbility || (skill.ability.toLowerCase() as keyof AbilityScores)
}

/**
 * A single skill's total bonus = ranks + abilityMod + (class skill +3) + typed bonuses - ACP...
 */
export function computeSkillBonus(args: ComputeSkillBonusArgs): number {
  const { 
    skill, 
    totalRanks, 
    isClassSkill, 
    abilityModifiers, 
    armorCheckPenalty,
    abilityReplacements 
  } = args

  let bonus = 0
  bonus += totalRanks

  // Get the effective ability after any replacements
  const effectiveAbility = getEffectiveSkillAbility(skill, abilityReplacements)
  
  // Use the appropriate ability modifier
  const abilityMod = abilityModifiers[`${effectiveAbility}Mod` as keyof AbilityModifiers] || 0
  bonus += abilityMod

  // Class skill +3 if ranks > 0
  if (isClassSkill && totalRanks > 0) {
    bonus += 3
  }

  // Armor check penalty if skill.armor_check_penalty is true
  if (skill.armor_check_penalty) {
    bonus -= armorCheckPenalty
  }

  // Additional typed bonuses if they specifically apply to skill.name
  for (const tb of args.typedBonuses) {
    if (tb.appliesTo === skill.name) {
      // The rules for stacking might differ by bonusType
      bonus += tb.value
    }
  }

  return bonus
}

/**
 * Process trait effects that modify skill ability scores.
 * Returns an array of ability replacements to apply.
 */
export function processTraitSkillModifiers(
  traits: Array<{ 
    id: number
    name: string
    effects?: { 
      skill_modifier_replacements?: Array<{
        skill_name: string
        from_ability: string
        to_ability: string
      }>
    }
  }>
): SkillAbilityReplacement[] {
  const replacements: SkillAbilityReplacement[] = []

  for (const trait of traits) {
    const mods = trait.effects?.skill_modifier_replacements
    if (!mods?.length) continue

    for (const mod of mods) {
      replacements.push({
        skillName: mod.skill_name,
        fromAbility: mod.from_ability.toLowerCase() as keyof AbilityScores,
        toAbility: mod.to_ability.toLowerCase() as keyof AbilityScores,
        source: `trait:${trait.name.toLowerCase()}`
      })
    }
  }

  return replacements
}

// -----------------------------------------------------------------------------
// 8) EQUIPMENT (ARMOR) & AC CALCULATIONS
// -----------------------------------------------------------------------------

export interface ComputeACArgs {
  baseDexMod: number
  armorBonus: number
  deflectionBonus?: number
  armorAttunement?: number
  abilityModifiers: AbilityModifiers
  size: SizeCategory
  armor: ArmorStats
  bonuses: ConditionalBonus[]
}

/**
 * Basic AC formula: 10 + armorBonus + Dex + deflection + size modifier + etc.
 */
export function computeAC(args: ComputeACArgs): number {
  const {
    baseDexMod,
    armorBonus,
    deflectionBonus = 0,
    armorAttunement = 0,
    size
  } = args

  // Add size modifier to AC
  const sizeModifier = getSizeModifier(size)
  
  const AC = 10 + 
    armorBonus + 
    baseDexMod + 
    deflectionBonus + 
    armorAttunement +
    sizeModifier

  return AC
}

// -----------------------------------------------------------------------------
// 9) CMD CALCULATIONS
// -----------------------------------------------------------------------------

export interface ComputeCmdArgs {
  baseAttackBonus: number
  abilityModifiers: AbilityModifiers
  size: SizeCategory
  conditionalBonuses: ConditionalBonus[]
  activeConditions: string[]
}

/**
 * PF1 typical: CMD = 10 + BAB + STR mod + DEX mod + size special modifier
 */
export function computeCMD(args: ComputeCmdArgs): number {
  const sizeModifier = getSpecialSizeModifier(args.size)
  
  let cmd =
    10 +
    args.baseAttackBonus +
    args.abilityModifiers.strMod +
    args.abilityModifiers.dexMod +
    sizeModifier

  // Apply conditional bonuses
  for (const cb of args.conditionalBonuses) {
    if (cb.apply_to === 'cmd' && cb.condition && args.activeConditions.includes(cb.condition)) {
      cmd += cb.value
    }
  }

  return cmd
}

// -----------------------------------------------------------------------------
// 10) FINAL PIPELINE EXAMPLE
// -----------------------------------------------------------------------------

/** Types for ancestry traits and their effects */
export interface AncestralTrait {
  id: number
  name: string
  effects?: {
    natural_armor: undefined
    racial_bonuses: any
    skill_bonuses?: Array<{
      skill_name: string
      bonus: number
      type?: string
    }>
    conditional_bonuses?: Array<{
      apply_to: string
      bonus_type: string
      condition?: string
      value: number
    }>
    visions?: Array<{
      vision_label: string
    }>
    natural_attacks?: Array<{
      attack_type: string
      damage: string
      attack_count: number
    }>
    weapon_proficiencies?: Array<{
      weapon_name: string
    }>
    specials?: Array<{
      special_label: string
    }>
  }
}

/** Extended ancestry interface with traits */
export interface Ancestry {
  id: number
  name: string
  size: SizeCategory
  base_speed: number
  traits: AncestralTrait[]
  // Add other ancestry fields as needed
}

/** Extended ancestry effects interface */
export interface AncestryEffects {
  skillBonuses: Array<{ skillName: string; bonus: number; type?: string }>
  conditionalBonuses: ConditionalBonus[]
  visions: string[]
  naturalAttacks: Array<{ type: string; damage: string; count: number }>
  weaponProficiencies: string[]
  specialAbilities: string[]
  // Add new properties for natural armor and other racial bonuses
  naturalArmor?: number
  racialBonuses: Array<{
    type: string
    value: number
    target: string
  }>
}

/**
 * Enhanced ancestry trait processing
 */
export function processAncestralTraits(ancestry: Ancestry): AncestryEffects {
  const result = {
    skillBonuses: [] as Array<{ skillName: string; bonus: number; type?: string }>,
    conditionalBonuses: [] as ConditionalBonus[],
    visions: [] as string[],
    naturalAttacks: [] as Array<{ type: string; damage: string; count: number }>,
    weaponProficiencies: [] as string[],
    specialAbilities: [] as string[],
    naturalArmor: undefined,
    racialBonuses: [] as Array<{ type: string; value: number; target: string }>
  }

  // Process each trait's effects
  for (const trait of ancestry.traits) {
    if (!trait.effects) continue

    // Skill bonuses (e.g., Sneaky giving +2 Stealth)
    if (trait.effects.skill_bonuses) {
      result.skillBonuses.push(
        ...trait.effects.skill_bonuses.map(sb => ({
          skillName: sb.skill_name,
          bonus: sb.bonus,
          type: sb.type || 'racial'
        }))
      )
    }

    // Conditional bonuses (e.g., +2 vs. fear effects)
    if (trait.effects.conditional_bonuses) {
      result.conditionalBonuses.push(
        ...trait.effects.conditional_bonuses.map(cb => ({
          ancestral_trait_id: trait.id,
          apply_to: cb.apply_to,
          bonus_type: cb.bonus_type,
          condition: cb.condition || null,
          value: cb.value,
          created_at: null,
          updated_at: null,
          id: 0,
          sync_status: null
        }))
      )
    }

    // Vision types (e.g., Low-Light Vision)
    if (trait.effects.visions) {
      result.visions.push(
        ...trait.effects.visions.map(v => v.vision_label)
      )
    }

    // Natural attacks (e.g., Bite)
    if (trait.effects.natural_attacks) {
      result.naturalAttacks.push(
        ...trait.effects.natural_attacks.map(na => ({
          type: na.attack_type,
          damage: na.damage,
          count: na.attack_count
        }))
      )
    }

    // Weapon proficiencies (e.g., Tengu Sword Training)
    if (trait.effects.weapon_proficiencies) {
      result.weaponProficiencies.push(
        ...trait.effects.weapon_proficiencies.map(wp => wp.weapon_name)
      )
    }

    // Special abilities (e.g., Gifted Linguist)
    if (trait.effects.specials) {
      result.specialAbilities.push(
        ...trait.effects.specials.map(s => s.special_label)
      )
    }

    // Add natural armor processing
    if (trait.effects?.natural_armor) {
      result.naturalArmor = trait.effects.natural_armor
    }

    // Add racial bonus processing
    if (trait.effects?.racial_bonuses) {
      result.racialBonuses.push(
        ...trait.effects.racial_bonuses.map((rb: { type: string; value: number; target: string }) => ({
          type: rb.type,
          value: rb.value,
          target: rb.target
        }))
      )
    }
  }

  return result
}

export interface FinalizeCharacterArgs {
  // Basic
  levelInfo: CharacterLevelInfo
  baseAbilityScores: AbilityScores
  characterClass: CharacterClass

  // Favored class
  favoredClassBonuses: Array<FavoredClassBonus> 

  // ABP
  abpAssignments: ABPBonusAssignment[]

  // Equipment
  equippedArmor: ArmorItem[]
  equippedWeapons?: BaseItem[]

  // Buffs
  activeBuffs: BuffWithEffects[]

  // Skills
  skillDefinitions: SkillDefinition[]
  skillRanks: CharacterSkillRank[]
  classSkills: number[] // i.e. array of skill IDs

  // Bonuses & Conditions
  conditionalBonuses: ConditionalBonus[]
  activeConditions: string[]

  // Current HP
  currentHP: number

  // Feats, etc.
  feats?: Array<FeatWithEffects | string>

  // Traits
  traits?: Array<{
    id: number
    name: string
    effects?: {
      skill_modifier_replacements?: Array<{
        skill_name: string
        from_ability: string
        to_ability: string
      }>
    }
  }>

  // Ancestry
  ancestry: Ancestry
}

/**
 * A "big" function that ties everything together. 
 * In practice, you might prefer smaller steps or a pipeline, 
 * but here’s one approach.
 */
export function finalizeCharacter(args: FinalizeCharacterArgs): CharacterFinalStats {
  // 1) Consolidate ABP
  const abpMods = consolidateABPBonuses(args.abpAssignments)

  // 2) Build final ability scores
  const finalAbilityScores = structuredClone(args.baseAbilityScores)

  // 2a) ABP prowess bonuses (unchanged)
  if (abpMods.mentalProwess) {
    const targetAbility = abpMods.mentalProwessChoice || 'int'
    finalAbilityScores[targetAbility] += abpMods.mentalProwess
  }
  
  if (abpMods.physicalProwess) {
    const targetAbility = abpMods.physicalProwessChoice || 'dex'
    finalAbilityScores[targetAbility] += abpMods.physicalProwess
  }

  // 2b) Buff-based ability score changes
  for (const buff of args.activeBuffs) {
    if (!buff.is_active || !buff.effects) continue
    
    // Apply attribute modifiers from buff effects
    applyAttributeModifiers(finalAbilityScores, buff.effects, `buff:${buff.id}`)
  }

  // 2c) Feat-based ability score changes
  for (const feat of args.feats || []) {
    if (typeof feat === 'string') {
      // Handle string-based feat references
      continue
    }
    if (!feat.effects) continue
    // Process feat effects...
  }

  // 3) Compute final ability modifiers
  const finalAbilityMods = computeAllAbilityModifiers(finalAbilityScores)

  // 4) Compute HP
  const maxHP = computeMaxHP({
    level: args.levelInfo.level,
    hitDie: args.levelInfo.hitDie,
    conMod: finalAbilityMods.conMod,
    favoredClassBonuses: args.favoredClassBonuses.map((fcb) => ({
      choiceId: fcb.favored_choice_id || 0,
    })),
  })

  // 5) Base Attack Bonus
  const bab = getBaseAttackBonus(args.levelInfo.level, args.levelInfo.babProgression)

  // 6) Saves
  const saves = computeSaves(
    args.levelInfo.level,
    args.levelInfo.baseSaveProgressions,
    finalAbilityMods,
    abpMods.resistance,
    args.conditionalBonuses,
    args.activeConditions,
  )

  // 7) Armor stats - now using property-based parsing
  const armorStats = computeArmorStats(args.equippedArmor)

  // Process equipped weapons if present
  const weaponStats = args.equippedWeapons?.map(parseWeaponProperties) || []

  // 8) AC
  const dexToAC = Math.min(finalAbilityMods.dexMod, armorStats.maxDex)
  const baseAC = computeAC({
    baseDexMod: dexToAC,
    armorBonus: armorStats.totalArmorBonus,
    deflectionBonus: abpMods.deflection,
    armorAttunement: abpMods.armorAttunement,
    abilityModifiers: finalAbilityMods,
    size: args.ancestry.size,
    armor: armorStats,
    bonuses: args.conditionalBonuses,
  })

  // 9) Attack Bonuses
  const sizeModifier = getSizeModifier(args.ancestry.size)
  const meleeAttack = computeAttackBonus({
    bab,
    abilityMod: finalAbilityMods.strMod,
    weaponAttunement: abpMods.weaponAttunement,
    buffs: args.activeBuffs,
    feats: args.feats?.filter((feat): feat is FeatWithEffects => typeof feat !== 'string'),
    sizeModifier
  })
  const rangedAttack = computeAttackBonus({
    bab,
    abilityMod: finalAbilityMods.dexMod,
    weaponAttunement: abpMods.weaponAttunement,
    buffs: args.activeBuffs,
    feats: args.feats?.filter((feat): feat is FeatWithEffects => typeof feat !== 'string'),
    sizeModifier
  })

  // Process trait-based skill ability replacements
  const skillAbilityReplacements = processTraitSkillModifiers(args.traits || [])

  // 10) Skills with effect-based bonuses
  const skillBonuses: { [skillId: number]: number } = {}
  
  // Collect all skill bonuses from various sources
  const allSkillBonuses: Array<{ skillName: string; bonus: number; type?: string }> = []

  // Add buff-based skill bonuses
  for (const buff of args.activeBuffs) {
    if (!buff.is_active || !buff.effects) continue
    allSkillBonuses.push(...processSkillBonuses(buff.effects))
  }

  // Add feat-based skill bonuses
  for (const feat of args.feats || []) {
    if (typeof feat === 'string') {
      // Handle string-based feat references
      continue
    }
    if (!feat.effects) continue
    const processedEffects = feat.effects.map(effect => ({
      value: effect.value,
      target: effect.target,
      effect_type: effect.effect_type
    }))
    allSkillBonuses.push(...processSkillBonuses(processedEffects))
  }

  // Process ancestry traits early to get all effects
  const ancestryEffects = processAncestralTraits(args.ancestry)

  // Add ancestry-based skill bonuses to the pool
  allSkillBonuses.push(...ancestryEffects.skillBonuses)

  // Add ancestry-based conditional bonuses
  const allConditionalBonuses = [
    ...args.conditionalBonuses,
    ...ancestryEffects.conditionalBonuses
  ]

  // Process each skill with ancestry bonuses included
  for (const skillDef of args.skillDefinitions) {
    const totalRanks = args.skillRanks.filter((sr) => sr.skill_id === skillDef.id).length
    const isClassSkill = args.classSkills.includes(skillDef.id)

    // Get relevant bonuses for this skill
    const relevantBonuses = allSkillBonuses
      .filter(b => b.skillName === skillDef.name)
      .map(b => ({
        bonusType: b.type || 'untyped',
        value: b.bonus,
        appliesTo: b.skillName
      }))

    skillBonuses[skillDef.id] = computeSkillBonus({
      skill: skillDef,
      totalRanks,
      isClassSkill,
      abilityModifiers: finalAbilityMods,
      armorCheckPenalty: armorStats.armorCheckPenalty,
      typedBonuses: relevantBonuses,
      abilityReplacements: skillAbilityReplacements
    })
  }

  // 11) CMD
  const cmd = computeCMD({
    baseAttackBonus: bab,
    abilityModifiers: finalAbilityMods,
    size: args.ancestry.size,
    conditionalBonuses: allConditionalBonuses,
    activeConditions: args.activeConditions,
  })

  // 12) Construct the final stats object
  const finalStats: CharacterFinalStats = {
    level: args.levelInfo.level,
    abilityScores: finalAbilityScores,
    abilityModifiers: finalAbilityMods,
    maxHP,
    currentHP: Math.min(args.currentHP, maxHP),
    baseAttackBonus: bab,
    meleeAttackBonus: meleeAttack,
    rangedAttackBonus: rangedAttack,
    AC: baseAC,
    touchAC: 10 + finalAbilityMods.dexMod,
    flatFootedAC: baseAC - finalAbilityMods.dexMod,
    saves,
    cmd,
    skillBonuses,
    weaponProficiencies: ancestryEffects.weaponProficiencies,
    naturalAttacks: ancestryEffects.naturalAttacks?.map(na => ({
      id: 0,
      type: na.type,
      count: na.count,
      damage: na.damage,
      entity_id: 0,
      created_at: null,
      updated_at: null,
      properties: []
    })) || [],
    visions: ancestryEffects.visions || [],
    specialAbilities: ancestryEffects.specialAbilities,
    activeBuffs: args.activeBuffs.map(b => b.id),
    activeConditions: args.activeConditions,
    equippedWeapons: weaponStats
  }

  return finalStats
}

// -----------------------------------------------------------------------------
// 11) EXTRAS: STACKING RULES, EFFECT PROCESSING, ETC.
// -----------------------------------------------------------------------------

/** 
 * Example: how you might handle multiple typed bonuses. 
 * "dodge" & "untyped" stack; everything else takes only the highest. 
 */
export function stackBonuses(bonuses: Array<{ type: string; value: number }>): number {
  const byType: Record<string, number[]> = {}

  for (const bonus of bonuses) {
    if (!byType[bonus.type]) {
      byType[bonus.type] = []
    }
    byType[bonus.type].push(bonus.value)
  }

  let total = 0
  for (const [type, values] of Object.entries(byType)) {
    switch (type) {
      case 'dodge':
      case 'untyped':
        // These stack fully
        total += values.reduce((sum, v) => sum + v, 0)
        break
      default:
        // Only take the highest
        total += Math.max(...values)
        break
    }
  }
  return total
}

// /**
//  * Example of applying "Effects." If your DB stores them differently, 
//  * adapt this logic to read & apply them in one pass.
//  */
// export interface Effect {
//   attribute_modifiers?: Array<{
//     attribute: string
//     modifier: number
//     type: string
//   }>
//   skill_bonus?: Array<{
//     skill_name: string
//     bonus: number
//     type: string
//   }>
//   // Add more fields for spells, etc.
// }

// export function processEffects(effects: Effect[], target: any): void {
//   for (const effect of effects) {
//     if (!effect.effect_type) continue

//     switch (effect.effect_type) {
//       case 'attribute_modifier':
//         if (effect.target && effect.modifier) {
//           // Process attribute modification
//         }
//         break
//       case 'skill_bonus':
//         if (effect.target && effect.modifier) {
//           // Process skill bonus
//         }
//         break
//       // ... other effect types ...
//     }
//   }
// }

/**
 * Example type guard if you want to confirm a "buff" 
 * object from the DB is valid in TS.
 */
export function isValidBuff(buff: Partial<CharacterBuff>): buff is CharacterBuff {
  return (
    typeof buff.id === 'number' &&
    typeof buff.is_active === 'boolean'
    // And so on, checking whichever fields you expect from your schema
  )
}

/** Represents a typed bonus that may or may not stack */
export interface TypedBonus {
  value: number
  type: string
  source?: string
}

/** Groups bonuses by type and handles stacking rules */
function consolidateTypedBonuses(bonuses: TypedBonus[]): number {
  // Group bonuses by type
  const byType: Record<string, TypedBonus[]> = {}
  
  for (const bonus of bonuses) {
    if (!byType[bonus.type]) {
      byType[bonus.type] = []
    }
    byType[bonus.type].push(bonus)
  }

  let total = 0
  
  // Apply stacking rules for each type
  for (const [type, values] of Object.entries(byType)) {
    switch (type.toLowerCase()) {
      // These bonus types always stack
      case 'dodge':
      case 'circumstance':
      case 'untyped':
        total += values.reduce((sum, b) => sum + b.value, 0)
        break
        
      // These bonus types take highest only
      case 'enhancement':
      case 'morale':
      case 'sacred':
      case 'profane':
      case 'insight':
      case 'resistance':
      case 'competence':
      case 'luck':
      case 'racial':
        total += Math.max(...values.map(b => b.value))
        break
        
      // Alchemical and size typically don't stack either
      case 'alchemical':
      case 'size':
        total += Math.max(...values.map(b => b.value))
        break
        
      // Default to non-stacking for unknown types
      default:
        total += Math.max(...values.map(b => b.value))
        break
    }
  }
  
  return total
}

/**
 * Updated version that respects bonus types and stacking rules
 */
export function applyAttributeModifiers(
  scores: AbilityScores,
  effects: Effect[],
  source?: string
): void {
  // Track typed bonuses for each ability score
  const bonusesByAttribute: Record<keyof AbilityScores, TypedBonus[]> = {
    str: [],
    dex: [],
    con: [],
    int: [],
    wis: [],
    cha: []
  }

  // Collect all bonuses first
  for (const effect of effects) {
    if (
      effect.effect_type !== 'attribute_modifier' || 
      !effect.target || 
      !effect.modifier
    ) continue

    const attribute = effect.target.toLowerCase() as keyof AbilityScores
    if (attribute in scores) {
      bonusesByAttribute[attribute].push({
        value: effect.modifier,
        type: effect.bonus_type || 'untyped',
        source: source
      })
    }
  }

  // Apply consolidated bonuses to each ability score
  for (const [attribute, bonuses] of Object.entries(bonusesByAttribute)) {
    if (bonuses.length > 0) {
      scores[attribute as keyof AbilityScores] += consolidateTypedBonuses(bonuses)
    }
  }
}

/**
 * Updated version that handles typed skill bonuses
 */
export function processSkillBonuses(
  effects: Effect[]
): Array<{ skillName: string; bonus: number; type: string }> {
  // Group effects by skill first
  const bonusesBySkill: Record<string, TypedBonus[]> = {}

  for (const effect of effects) {
    if (
      effect.effect_type !== 'skill_bonus' || 
      !effect.target || 
      !effect.modifier
    ) continue

    if (!bonusesBySkill[effect.target]) {
      bonusesBySkill[effect.target] = []
    }

    bonusesBySkill[effect.target].push({
      value: effect.modifier,
      type: effect.bonus_type || 'untyped'
    })
  }

  // Consolidate bonuses for each skill
  const result: Array<{ skillName: string; bonus: number; type: string }> = []
  
  for (const [skillName, bonuses] of Object.entries(bonusesBySkill)) {
    const totalBonus = consolidateTypedBonuses(bonuses)
    if (totalBonus !== 0) {
      result.push({
        skillName,
        bonus: totalBonus,
        type: 'consolidated' // Or handle type differently if needed
      })
    }
  }

  return result
}

/** Standard size categories and their modifiers */
export const SIZE_CATEGORIES = {
  FINE: 'fine',
  DIMINUTIVE: 'diminutive',
  TINY: 'tiny',
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
  HUGE: 'huge',
  GARGANTUAN: 'gargantuan',
  COLOSSAL: 'colossal'
} as const

export type SizeCategory = typeof SIZE_CATEGORIES[keyof typeof SIZE_CATEGORIES]

/** Size modifiers for AC and attack rolls */
export const SIZE_MODIFIERS: Record<SizeCategory, number> = {
  [SIZE_CATEGORIES.FINE]: 8,
  [SIZE_CATEGORIES.DIMINUTIVE]: 4,
  [SIZE_CATEGORIES.TINY]: 2,
  [SIZE_CATEGORIES.SMALL]: 1,
  [SIZE_CATEGORIES.MEDIUM]: 0,
  [SIZE_CATEGORIES.LARGE]: -1,
  [SIZE_CATEGORIES.HUGE]: -2,
  [SIZE_CATEGORIES.GARGANTUAN]: -4,
  [SIZE_CATEGORIES.COLOSSAL]: -8
}

/** Special size modifiers for Combat Maneuver Bonus/Defense */
export const SIZE_SPECIAL_MODIFIERS: Record<SizeCategory, number> = {
  [SIZE_CATEGORIES.FINE]: -8,
  [SIZE_CATEGORIES.DIMINUTIVE]: -4,
  [SIZE_CATEGORIES.TINY]: -2,
  [SIZE_CATEGORIES.SMALL]: -1,
  [SIZE_CATEGORIES.MEDIUM]: 0,
  [SIZE_CATEGORIES.LARGE]: 1,
  [SIZE_CATEGORIES.HUGE]: 2,
  [SIZE_CATEGORIES.GARGANTUAN]: 4,
  [SIZE_CATEGORIES.COLOSSAL]: 8
}

/** Get the standard size modifier for AC and attack rolls */
export function getSizeModifier(size: SizeCategory): number {
  return SIZE_MODIFIERS[size] || 0
}

/** Get the special size modifier for CMB/CMD */
export function getSpecialSizeModifier(size: SizeCategory): number {
  return SIZE_SPECIAL_MODIFIERS[size] || 0
}

export interface ArmorItem {
  id: number
  armorBonus: number
  maxDex: number
  armorCheckPenalty: number
  equipped: boolean
  properties?: Array<{
    property_key: string
    property_value: string
  }>
}

export interface AncestralTraitEffects {
  skill_bonuses?: Array<{
    skill_name: string
    bonus: number
    type?: string
  }>
  conditional_bonuses?: Array<{
    apply_to: string
    bonus_type: string
    condition?: string
    value: number
  }>
  visions?: Array<{ vision_label: string }>
  natural_attacks?: Array<{
    attack_type: string
    damage: string
    attack_count: number
  }>
  weapon_proficiencies?: Array<{ weapon_name: string }>
  natural_armor?: number
  racial_bonuses?: Array<{
    type: string
    value: number
    target: string
  }>
}

export interface SaveResults {
  fort: number
  ref: number
  will: number
}
