// FILE: calculations.ts

/******************************************************************************
 * S U P A B A S E   T Y P E   I M P O R T S
 *****************************************************************************/

/**
 * We'll assume your Supabase types are in `../types/supabase.ts`, 
 * which exports a `Database` interface. 
 */
import type { Database } from '../types/supabase'

/******************************************************************************
 * 1) DB ROW TYPE ALIASES
 ******************************************************************************
 * These alias definitions let us talk about your actual DB rows by name, 
 * e.g. `CharacterBuff`, `FavoredClassBonus`, etc., 
 * without rewriting them from scratch.
 *****************************************************************************/

/** Example: A single skill row from `base_skills`. */
export type BaseSkill = Database['public']['Tables']['base_skills']['Row']

/** A row from your `bonus_types` table. */
export type BonusType = Database['public']['Tables']['bonus_types']['Row']

/** Example: A row from `base_classes`. */
export type CharacterClass = Database['public']['Tables']['base_classes']['Row']



/**
 * If you store skill ranks in `character_skill_ranks`:
 */
export type CharacterSkillRank = Database['public']['Tables']['character_skill_ranks']['Row']


/**
 * Example of referencing a future `base_buff_effects` table:
 */
// type BaseBuffEffect = Database['public']['Tables']['base_buff_effects']['Row']
// But let's define a more general interface below instead

/******************************************************************************
 * 2) EFFECTS & EXTENDED BUFF/FEAT INTERFACES
 *****************************************************************************/

/**
 * In many PF1-style systems, we have "effects" that do things like 
 * "attribute_modifier," "skill_bonus," etc. 
 * 
 * You might store them in e.g. base_buff_effects, feat_effects, or 
 * anywhere else, each with a DB schema. For now, define 
 * a simplified `Effect` interface that merges them.
 */
export interface Effect {
  effect_type: string        // e.g. "attribute_modifier" | "skill_bonus" | "attack_bonus" ...
  target?: string | null     // e.g. "dex", "stealth", "attack", etc.
  modifier?: number | null   // numeric amount
  description?: string | null
  bonus_type?: string        // e.g. "enhancement", "dodge", etc.
}

/**
 * A "buff" that includes an array of Effects. 
 * In a real schema, you'd join `character_buffs` with `base_buff_effects`.
 */
export interface BuffWithEffects {
  /** The buff row ID. */
  id: number

  /** Whether the buff is active. */
  is_active: boolean

  /** Type references the buff_types table or something. */
  buff_type_id: number | null

  /** The array of effects from a join. */
  effects?: Effect[]
}

/**
 * A "feat" that includes an array of Effects. 
 */
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

/******************************************************************************
 * 3) SIMPLE/NON-DB INTERFACES (PF1-LIKE)
 *****************************************************************************/

/** Standard 6 ability scores. */
export interface AbilityScores {
  str: number
  dex: number
  con: number
  int: number
  wis: number
  cha: number
}

/** The derived modifiers for each ability. */
export interface AbilityModifiers {
  strMod: number
  dexMod: number
  conMod: number
  intMod: number
  wisMod: number
  chaMod: number
}

/** PF1-like BAB progressions. */
export const BAB_PROGRESSION = {
  FULL: 'full',
  THREE_FOURTHS: 'threeFourths',
  HALF: 'half',
} as const
export type BABProgression = typeof BAB_PROGRESSION[keyof typeof BAB_PROGRESSION]

/** PF1-like save progressions. */
export const SAVE_PROGRESSION = {
  GOOD: 'good',
  POOR: 'poor',
} as const
export type SaveProgression = typeof SAVE_PROGRESSION[keyof typeof SAVE_PROGRESSION]

/**
 * Summarizes a single class's level details: 
 * - what level (1..20?), 
 * - the class's hitDie (e.g. d8 => 8),
 * - babProgression, etc.
 */
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
 * For the ABP system: after we collect ABP from DB and unify them, 
 * the final result is this structure. 
 */
export interface ABPModifiers {
  resistance?: number
  armorAttunement?: number
  weaponAttunement?: number
  deflection?: number
  mentalProwess?: number
  physicalProwess?: number
  toughening?: number

  /** If you have other weird ABP bonuses. */
  otherBonuses?: Array<{ label: string; value: number }>

  /** For mental/physical prowess if the user selected a specific ability. */
  mentalProwessChoice?: keyof AbilityScores
  physicalProwessChoice?: keyof AbilityScores
}

/** Generic property interface used by items. */
export interface ItemProperty {
  property_key: string
  property_value: string
  property_type?: string
}

/** A base item (weapon, armor, gear, etc.). */
export interface BaseItem {
  id: number
  name: string
  type: string
  equipped?: boolean
  properties: ItemProperty[]
}

/******************************************************************************
 * 3A) ARMOR & WEAPON STATS PARSING
 *****************************************************************************/

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
 * Parse a numeric property from an item’s property list. 
 * e.g. parse the integer value from property_key="armor_bonus".
 */
export function parseNumericProperty(
  properties: ItemProperty[],
  key: string,
  defaultValue: number = 0
): number {
  const prop = properties.find(p => p.property_key === key)
  if (!prop) return defaultValue
  const numeric = Number(prop.property_value)
  return Number.isNaN(numeric) ? defaultValue : numeric
}

/** 
 * Parse an item’s properties to produce an ArmorStats. 
 * E.g. from a chain shirt: armor_bonus=4, max_dex=6, etc.
 */
export function parseArmorProperties(item: BaseItem): ArmorStats {
  const armorBonus = parseNumericProperty(item.properties, 'armor_bonus')
  const maxDex = parseNumericProperty(item.properties, 'max_dex', 99)
  const armorCheckPenalty = parseNumericProperty(item.properties, 'armor_check_penalty')
  const spellFailure = parseNumericProperty(item.properties, 'spell_failure')

  // Maybe parse special "speed_30" or "speed_20" if the armor reduces movement.
  const speed30 = item.properties.find(p => p.property_key === 'speed_30')
  const speed20 = item.properties.find(p => p.property_key === 'speed_20')
  const speed = (speed30 || speed20)
    ? {
        base30: speed30 ? Number(speed30.property_value) : undefined,
        base20: speed20 ? Number(speed20.property_value) : undefined
      }
    : undefined

  return {
    totalArmorBonus: armorBonus,
    maxDex,
    armorCheckPenalty,
    spellFailure: spellFailure || undefined,
    speed
  }
}

/** 
 * For weapons, we might parse damage, crit range, etc.
 */
export interface WeaponStats {
  damage: string
  criticalRange?: number
  criticalMultiplier?: number
  damageType?: string[]
  range?: number
  special?: string[]
}

/**
 * Example function to parse weapon properties. 
 * This is purely domain logic, ignoring actual DB calls.
 */
export function parseWeaponProperties(item: BaseItem): WeaponStats {
  const damage = 
    item.properties.find(p => p.property_key === 'damage')?.property_value || '1d4'
  const criticalRange = parseNumericProperty(item.properties, 'critical_range', 20)
  const criticalMultiplier = parseNumericProperty(item.properties, 'critical_multiplier', 2)
  const range = parseNumericProperty(item.properties, 'range')

  const damageTypeProp = item.properties.find(p => p.property_key === 'damage_type')
  const damageType = damageTypeProp
    ? damageTypeProp.property_value.split(',').map(s => s.trim())
    : undefined

  const specialProp = item.properties.find(p => p.property_key === 'special')
  const special = specialProp
    ? specialProp.property_value.split(',').map(s => s.trim())
    : undefined

  return {
    damage,
    criticalRange,
    criticalMultiplier,
    damageType,
    range,
    special
  }
}

/**
 * If you have multiple armor items equipped (like armor + shield),
 * sum them up.
 */
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

/**
 * Combine an array of equipped armor items:
 * - sum totalArmorBonus
 * - min of all maxDex
 * - sum of all armor check penalty
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

  const finalMaxDex = maxDexList.length ? Math.min(...maxDexList) : 99
  return {
    totalArmorBonus,
    maxDex: finalMaxDex,
    armorCheckPenalty: totalACP
  }
}

/******************************************************************************
 * 4) ABILITY SCORES & MODIFIERS
 *****************************************************************************/

/** Standard PF formula for ability mod: floor((score - 10)/2). */
export function computeAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

/** Apply that function to all six abilities. */
export function computeAllAbilityModifiers(abilities: AbilityScores): AbilityModifiers {
  return {
    strMod: computeAbilityModifier(abilities.str),
    dexMod: computeAbilityModifier(abilities.dex),
    conMod: computeAbilityModifier(abilities.con),
    intMod: computeAbilityModifier(abilities.int),
    wisMod: computeAbilityModifier(abilities.wis),
    chaMod: computeAbilityModifier(abilities.cha)
  }
}


/******************************************************************************
 * 6) HIT POINTS & FAVORED CLASS
 *****************************************************************************/

/** 
 * Example logic for calculating max HP from class, level, CON, and favored 
 * class bonus. You can adapt this if you do rolling vs. fixed hp, etc.
 */
export interface ComputeMaxHPArgs {
  level: number
  hitDie: number
  conMod: number
  /** e.g. a row array from `character_favored_class_bonuses`. */
  favoredClassBonuses: Array<{ choiceId: number }>
}

/**
 * Summation logic:
 * - level 1 => full HD
 * - subsequent => average
 * - + CON*level
 * - +1 for each favored_class HP choice
 */
export function computeMaxHP(args: ComputeMaxHPArgs): number {
  const { level, hitDie, conMod, favoredClassBonuses } = args

  let baseHp = 0
  for (let lvl = 1; lvl <= level; lvl++) {
    if (lvl === 1) {
      baseHp += hitDie
    } else {
      baseHp += Math.floor(hitDie / 2) + 1
    }
  }
  const conHp = conMod * level

  // Suppose favored_class HP = choiceId=1
  const fcHp = favoredClassBonuses.filter(f => f.choiceId === 1).length

  return baseHp + conHp + fcHp
}

/******************************************************************************
 * 7) SAVES
 *****************************************************************************/

/** 
 * PF1 typical “good” progression => +2 at level 1, up to +12 at level 20. 
 * “poor” => start at +0, up to +6 at level 20. 
 */
export function getBaseSave(level: number, progression: SaveProgression): number {
  if (progression === 'good') {
    // e.g. +2 at L1, each 2 levels => +1 
    // formula: floor(level*2/3 + 2)
    return Math.floor((level * 2) / 3 + 2)
  } else {
    // “poor” => floor(level/3)
    return Math.floor(level / 3)
  }
}

export interface SaveResults {
  fort: number
  ref: number
  will: number
}

/** 
 * Summation logic for saves:
 * - base from class 
 * - + ability mod 
 * - + ABP resistance 
 * - + conditional if condition is active
 */
export function computeSaves(
  level: number,
  baseSaveProgs: { fort: SaveProgression; ref: SaveProgression; will: SaveProgression },
  abilityMods: AbilityModifiers,
): SaveResults {
  const { fort: fortProg, ref: refProg, will: willProg } = baseSaveProgs

  let fort = getBaseSave(level, fortProg) + abilityMods.conMod
  let ref = getBaseSave(level, refProg) + abilityMods.dexMod
  let will = getBaseSave(level, willProg) + abilityMods.wisMod



  return { fort, ref, will }
}

/******************************************************************************
 * 8) ATTACK BONUSES
 *****************************************************************************/

/** 
 * PF1 standard:
 * - full = +1/level 
 * - 3/4 
 * - 1/2 
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
 * Basic approach: 
 *   totalAttack = bab + abilityMod + weaponAttunement + (size) + ...
 *   minus any feats like Power Attack, plus any buffs that apply.
 */
export function computeAttackBonus(args: ComputeAttackBonusArgs): number {
  let bonus = args.bab + args.abilityMod

  // ABP
  if (args.weaponAttunement) {
    bonus += args.weaponAttunement
  }

  // e.g. if we detect “PowerAttack” among feats => -1
  if (args.feats?.some(f => f.name === 'PowerAttack')) {
    bonus -= 1
  }

  // size
  if (args.sizeModifier) {
    bonus += args.sizeModifier
  }

  // if buffs are relevant to Attack bonus, you could sum them. 
  // This is highly dependent on how you store the buff effect data
  if (args.buffs) {
    for (const b of args.buffs) {
      if (!b.is_active || !b.effects) continue
      // e.g. check if effect_type = 'attack_bonus' => add effect.modifier
    }
  }

  return bonus
}

/******************************************************************************
 * 9) SKILL CALCULATIONS
 *****************************************************************************/

/** 
 * If you want each skill to store e.g. skill.ability = "int" 
 * plus an optional `ability_key`.
 */
export type SkillDefinition = BaseSkill & {
  // e.g. if you want extra fields not in DB
  ability_key?: string
  name: string
}

/** 
 * Some feats/traits let you use Int instead of Cha for a skill. 
 * We'll define a small interface to represent that replacement.
 */
export interface SkillAbilityReplacement {
  skillName: string            // e.g. "Use Magic Device"
  fromAbility: keyof AbilityScores
  toAbility: keyof AbilityScores
  source?: string
}

/** 
 * The extended arguments to compute a single skill bonus. 
 */
export interface ComputeSkillBonusArgs {
  skill: SkillDefinition
  totalRanks: number
  isClassSkill: boolean
  abilityModifiers: AbilityModifiers
  armorCheckPenalty: number
  typedBonuses: Array<{
    bonusType: string
    value: number
    appliesTo: string
  }>
  abilityReplacements?: SkillAbilityReplacement[]
}

/**
 * Sometimes a skill’s DB row might store `.ability = "int"`. 
 * This helper picks the correct ability to use for that skill, 
 * factoring in optional replacements. 
 */
export function getEffectiveSkillAbility(
  skill: SkillDefinition,
  replacements?: SkillAbilityReplacement[]
): keyof AbilityScores {
  // If no replacements, fallback to skill.ability
  const defaultAbility = (skill.ability?.toLowerCase() ||
                          skill.ability_key ||
                          'int') as keyof AbilityScores

  if (!replacements || replacements.length === 0) {
    return defaultAbility
  }

  // If we find a matching replacement, use that
  const found = replacements.find(r => 
    r.skillName.toLowerCase() === skill.name.toLowerCase() &&
    r.fromAbility === defaultAbility
  )
  return found?.toAbility || defaultAbility
}

/**
 * A single skill’s total = ranks + abilityMod + classSkill + typedBonuses - ACP
 */
export function computeSkillBonus(args: ComputeSkillBonusArgs): number {
  let bonus = 0
  bonus += args.totalRanks

  // if ranks > 0 and isClassSkill => +3
  if (args.isClassSkill && args.totalRanks > 0) {
    bonus += 3
  }

  // check if the skill uses an alternate ability mod
  const effAbility = getEffectiveSkillAbility(args.skill, args.abilityReplacements)
  const abilityMod = args.abilityModifiers[`${effAbility}Mod` as keyof AbilityModifiers] || 0
  bonus += abilityMod

  // if skill has armor check penalty
  if (args.skill.armor_check_penalty) {
    bonus -= args.armorCheckPenalty
  }

  // typed bonuses that specifically apply to skillName
  for (const tb of args.typedBonuses) {
    if (tb.appliesTo.toLowerCase() === args.skill.name.toLowerCase()) {
      // PF rules: some typed bonuses might not stack. 
      // For simplicity, just sum them. 
      bonus += tb.value
    }
  }

  return bonus
}

/** 
 * If you have traits that do e.g. “Use Int for UMD instead of Cha,” 
 * gather them into an array of replacements. 
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
  const result: SkillAbilityReplacement[] = []
  for (const t of traits) {
    if (!t.effects?.skill_modifier_replacements) continue
    for (const rep of t.effects.skill_modifier_replacements) {
      result.push({
        skillName: rep.skill_name,
        fromAbility: rep.from_ability.toLowerCase() as keyof AbilityScores,
        toAbility: rep.to_ability.toLowerCase() as keyof AbilityScores,
        source: t.name
      })
    }
  }
  return result
}

/******************************************************************************
 * 10) SIZE CATEGORIES
 *****************************************************************************/

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

/** Standard size modifiers for AC, Attack, Stealth, etc. */
export const SIZE_MODIFIERS: Record<SizeCategory, number> = {
  fine: 8,
  diminutive: 4,
  tiny: 2,
  small: 1,
  medium: 0,
  large: -1,
  huge: -2,
  gargantuan: -4,
  colossal: -8
}

/** For CMB/CMD, the sign flips. */
export const SIZE_SPECIAL_MODIFIERS: Record<SizeCategory, number> = {
  fine: -8,
  diminutive: -4,
  tiny: -2,
  small: -1,
  medium: 0,
  large: 1,
  huge: 2,
  gargantuan: 4,
  colossal: 8
}

/** AC & Attack get this. */
export function getSizeModifier(size: SizeCategory): number {
  return SIZE_MODIFIERS[size] ?? 0
}

/** CMD uses the special version. */
export function getSpecialSizeModifier(size: SizeCategory): number {
  return SIZE_SPECIAL_MODIFIERS[size] ?? 0
}

/******************************************************************************
 * 11) ARMOR CLASS
 *****************************************************************************/

export interface ComputeACArgs {
  baseDexMod: number
  armorBonus: number
  deflectionBonus?: number
  armorAttunement?: number
  abilityModifiers: AbilityModifiers
  size: SizeCategory
  armor: ArmorStats
}

/**
 * Basic AC formula:
 * AC = 10 + armorBonus + Dex + deflection + armorAttunement + size ...
 */
export function computeAC(args: ComputeACArgs): number {
  const sizeMod = getSizeModifier(args.size)
  let ac = 10 + args.armorBonus + args.baseDexMod + sizeMod
  if (args.deflectionBonus) ac += args.deflectionBonus
  if (args.armorAttunement) ac += args.armorAttunement

  // You can also factor in conditionalBonuses if they apply to “ac” or “armor_class”
  // for (const cond of args.bonuses) { ... }

  return ac
}

/******************************************************************************
 * 12) CMD
 *****************************************************************************/

export interface ComputeCmdArgs {
  baseAttackBonus: number
  abilityModifiers: AbilityModifiers
  size: SizeCategory
  activeConditions: string[]
}

/**
 * PF1 typical: 
 *   CMD = 10 + BAB + STR + DEX + sizeSpecial
 */
export function computeCMD(args: ComputeCmdArgs): number {
  const specialSizeMod = getSpecialSizeModifier(args.size)
  let cmd = 10 + args.baseAttackBonus 
              + args.abilityModifiers.strMod 
              + args.abilityModifiers.dexMod 
              + specialSizeMod



  return cmd
}

/******************************************************************************
 * 13) ANCESTRAL TRAITS 
 *****************************************************************************/

/** 
 * Example shape of a single ancestry trait, with subfields 
 * that might add skill bonuses, vision, natural attacks, etc. 
 */
export interface AncestralTrait {
  id: number
  name: string
  effects?: {
    natural_armor?: number
    racial_bonuses?: any
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

/** 
 * A full ancestry containing multiple traits. 
 */
export interface Ancestry {
  id: number
  name: string
  size: SizeCategory
  base_speed: number
  traits: AncestralTrait[]
}

/** The consolidated effects from an ancestry’s traits. */
export interface AncestryEffects {
  skillBonuses: Array<{ skillName: string; bonus: number; type?: string }>
  visions: string[]
  naturalAttacks: Array<{ type: string; damage: string; count: number }>
  weaponProficiencies: string[]
  specialAbilities: string[]
  naturalArmor?: number
  racialBonuses: Array<{ type: string; value: number; target: string }>
}

/**
 * For each trait in the ancestry, gather skill/conditional bonuses, vision, 
 * naturalAttacks, etc.
 */
export function processAncestralTraits(ancestry: Ancestry): AncestryEffects {
  const result: AncestryEffects = {
    skillBonuses: [],
    visions: [],
    naturalAttacks: [],
    weaponProficiencies: [],
    specialAbilities: [],
    naturalArmor: undefined,
    racialBonuses: []
  }

  for (const trait of ancestry.traits) {
    if (!trait.effects) continue

    // skill_bonuses
    if (trait.effects.skill_bonuses) {
      for (const sb of trait.effects.skill_bonuses) {
        result.skillBonuses.push({
          skillName: sb.skill_name,
          bonus: sb.bonus,
          type: sb.type || 'racial'
        })
      }
    }

    // visions
    if (trait.effects.visions) {
      for (const v of trait.effects.visions) {
        result.visions.push(v.vision_label)
      }
    }

    // natural_attacks
    if (trait.effects.natural_attacks) {
      for (const na of trait.effects.natural_attacks) {
        result.naturalAttacks.push({
          type: na.attack_type,
          damage: na.damage,
          count: na.attack_count
        })
      }
    }

    // weapon_proficiencies
    if (trait.effects.weapon_proficiencies) {
      for (const wp of trait.effects.weapon_proficiencies) {
        result.weaponProficiencies.push(wp.weapon_name)
      }
    }

    // specials => e.g. "Gifted Linguist", "Skilled", etc.
    if (trait.effects.specials) {
      for (const s of trait.effects.specials) {
        result.specialAbilities.push(s.special_label)
      }
    }

    // natural_armor 
    if (typeof trait.effects.natural_armor === 'number') {
      result.naturalArmor = trait.effects.natural_armor
    }

    // racial_bonuses 
    if (trait.effects.racial_bonuses) {
      // You might define how you interpret "racial_bonuses"
      // If it's an array, parse them
    }
  }

  return result
}

/******************************************************************************
 * 14) FINAL CHARACTER STATS
 *****************************************************************************/

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
  skillBonuses: Record<number, number> // keyed by skillId => total bonus

  weaponProficiencies: string[]
  naturalAttacks: Array<{
    id: number
    type: string
    count: number
    damage: string
    entity_id: number
    created_at: string | null
    updated_at: string | null
    properties: Array<{ property_key: string; property_value: string }>
  }>
  visions: string[]
  specialAbilities: string[]
  activeBuffs: number[]
  activeConditions: string[]
  equippedWeapons: any[] // or replace "any" with your real typed structure
}

/******************************************************************************
 * 15) THE "BIG" FINALIZE FUNCTION
 *****************************************************************************/

/** 
 * We define the shape of inputs needed to produce the final stats. 
 * 
 * Typically, your store would gather data from DB, supply them here, 
 * then get a `CharacterFinalStats`.
 */
export interface FinalizeCharacterArgs {
  // Basic
  levelInfo: CharacterLevelInfo
  baseAbilityScores: AbilityScores
  characterClass: CharacterClass


  // Equipment
  equippedArmor: ArmorItem[]
  equippedWeapons?: BaseItem[]

  // Buffs
  activeBuffs: BuffWithEffects[]

  // Skills
  skillDefinitions: SkillDefinition[]
  skillRanks: CharacterSkillRank[]
  classSkills: number[] // skill IDs that are "class skills"

  // Bonuses & Conditions
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
 * The "pipeline" that unifies everything:
 *   1) Consolidate ABP 
 *   2) Build final ability scores 
 *   3) Compute HP 
 *   4) Compute saves 
 *   5) Compute AC 
 *   6) Attack bonuses 
 *   7) Skills 
 *   8) CMD 
 *   9) Return a big `CharacterFinalStats` object
 */
export function finalizeCharacter(args: FinalizeCharacterArgs): CharacterFinalStats {


  // 2) Build final ability scores from base
  const finalScores = structuredClone(args.baseAbilityScores) as AbilityScores



  // 2b) Buff-based ability modifiers
  for (const b of args.activeBuffs) {
    if (!b.is_active || !b.effects) continue
    applyAttributeModifiers(finalScores, b.effects, `buff:${b.id}`)
  }

  // 2c) Feats could also apply attribute modifiers
  // (In PF1, it’s rare that feats directly raise an ability, 
  // but you might have a homebrew.)
  // for (const ft of args.feats || []) { ... }

  // 3) Compute final ability mods
  const finalMods = computeAllAbilityModifiers(finalScores)

  // 4) HP
  const maxHP = computeMaxHP({
    level: args.levelInfo.level,
    hitDie: args.levelInfo.hitDie,
    conMod: finalMods.conMod,
    favoredClassBonuses: []
  })

  // 5) Base Attack Bonus
  const bab = getBaseAttackBonus(args.levelInfo.level, args.levelInfo.babProgression)

  // 6) Saves
  const saves = computeSaves(
    args.levelInfo.level,
    args.levelInfo.baseSaveProgressions,
    finalMods
  )

  // 7) Armor
  const armorStats = computeArmorStats(args.equippedArmor)
  const dexToAC = Math.min(finalMods.dexMod, armorStats.maxDex)
  const baseAC = computeAC({
    baseDexMod: dexToAC,
    armorBonus: armorStats.totalArmorBonus,
    deflectionBonus: 0,
    armorAttunement: 0,
    abilityModifiers: finalMods,
    size: args.ancestry.size,
    armor: armorStats,
  })

  // 8) Attack Bonuses (melee = STR mod, ranged = DEX mod)
  const sizeMod = getSizeModifier(args.ancestry.size)
  const meleeAttack = computeAttackBonus({
    bab,
    abilityMod: finalMods.strMod,
    buffs: args.activeBuffs,
    feats: (args.feats || []).filter((f): f is FeatWithEffects => typeof f !== 'string'),
    sizeModifier: sizeMod
  })
  const rangedAttack = computeAttackBonus({
    bab,
    abilityMod: finalMods.dexMod,
    buffs: args.activeBuffs,
    feats: (args.feats || []).filter((f): f is FeatWithEffects => typeof f !== 'string'),
    sizeModifier: sizeMod
  })

  // 9) Trait-based skill ability replacements
  const skillAbilityReps = args.traits ? processTraitSkillModifiers(args.traits) : []

  // We'll gather skill bonuses from buffs, feats, ancestry, etc.
  const globalSkillBonuses: Array<{ skillName: string; bonus: number; type?: string }> = []

  // 9a) Buff-based skill bonuses
  for (const b of args.activeBuffs) {
    if (!b.is_active || !b.effects) continue
    // We'll parse skill bonuses from those effects
    globalSkillBonuses.push(...processSkillBonuses(b.effects))
  }

  // 9b) Feat-based skill bonuses
  for (const ft of args.feats || []) {
    if (typeof ft === 'string') continue
    if (!ft.effects) continue
    // adapt to a common shape
    const eArr = ft.effects.map(e => ({
      effect_type: e.effect_type,
      target: e.target || '',
      modifier: e.value,
      bonus_type: e.type
    }))
    globalSkillBonuses.push(...processSkillBonuses(eArr))
  }

  // 9c) Ancestry-based bonuses 
  const ancestryEffects = processAncestralTraits(args.ancestry)
  globalSkillBonuses.push(...ancestryEffects.skillBonuses)

  // 10) Actually compute skill bonuses
  const skillBonuses: Record<number, number> = {}

  for (const skillDef of args.skillDefinitions) {
    // how many ranks in this skill?
    const totalRanks = args.skillRanks.filter(sr => sr.skill_id === skillDef.id).length
    const isClassSkill = args.classSkills.includes(skillDef.id)

    // gather typed bonuses for this skill
    const typedBonuses = globalSkillBonuses
      .filter(x => x.skillName.toLowerCase() === skillDef.name.toLowerCase())
      .map(x => ({
        bonusType: x.type || 'untyped',
        value: x.bonus,
        appliesTo: x.skillName
      }))

    skillBonuses[skillDef.id] = computeSkillBonus({
      skill: skillDef,
      totalRanks,
      isClassSkill,
      abilityModifiers: finalMods,
      armorCheckPenalty: armorStats.armorCheckPenalty,
      typedBonuses,
      abilityReplacements: skillAbilityReps
    })
  }

  // 11) CMD
  const cmd = computeCMD({
    baseAttackBonus: bab,
    abilityModifiers: finalMods,
    size: args.ancestry.size,
    activeConditions: []
  })

  // 12) Weapons
  const weaponStats = args.equippedWeapons?.map(parseWeaponProperties) || []

  // 13) Construct final stats
  const final: CharacterFinalStats = {
    level: args.levelInfo.level,
    abilityScores: finalScores,
    abilityModifiers: finalMods,
    maxHP,
    currentHP: Math.min(args.currentHP, maxHP),
    baseAttackBonus: bab,
    meleeAttackBonus: meleeAttack,
    rangedAttackBonus: rangedAttack,
    AC: baseAC,
    touchAC: 10 + finalMods.dexMod,
    flatFootedAC: baseAC - finalMods.dexMod,
    saves,
    cmd,
    skillBonuses,
    weaponProficiencies: ancestryEffects.weaponProficiencies,
    naturalAttacks: ancestryEffects.naturalAttacks.map(na => ({
      id: 0, // or real ID
      type: na.type,
      count: na.count,
      damage: na.damage,
      entity_id: 0,
      created_at: null,
      updated_at: null,
      properties: []
    })),
    visions: ancestryEffects.visions,
    specialAbilities: ancestryEffects.specialAbilities,
    activeBuffs: args.activeBuffs.map(b => b.id),
    activeConditions: args.activeConditions,
    equippedWeapons: weaponStats
  }

  return final
}

/******************************************************************************
 * 16) STACKING RULES & EFFECT HELPERS
 *****************************************************************************/

/** 
 * Example: "dodge" & "untyped" stack fully. 
 * "enhancement"/"morale"/"insight" => only highest. 
 */
export function stackBonuses(bonuses: Array<{ type: string; value: number }>): number {
  const byType: Record<string, number[]> = {}

  for (const b of bonuses) {
    if (!byType[b.type]) byType[b.type] = []
    byType[b.type].push(b.value)
  }

  let total = 0
  for (const [type, values] of Object.entries(byType)) {
    const lower = type.toLowerCase()
    switch (lower) {
      case 'dodge':
      case 'untyped':
      case 'circumstance':
        // sum them up
        total += values.reduce((a, b) => a + b, 0)
        break
      default:
        // only highest
        total += Math.max(...values)
        break
    }
  }

  return total
}

/** 
 * If a buff has effect_type="attribute_modifier", we accumulate them. 
 */
export interface TypedBonus {
  value: number
  type: string
  source?: string
}

/**
 * Combine typed bonuses by stacking rules. 
 */
function consolidateTypedBonuses(bonuses: TypedBonus[]): number {
  // group by type
  const byType: Record<string, number[]> = {}
  for (const bonus of bonuses) {
    const t = bonus.type.toLowerCase()
    if (!byType[t]) byType[t] = []
    byType[t].push(bonus.value)
  }

  let total = 0
  for (const [type, arr] of Object.entries(byType)) {
    switch (type) {
      case 'dodge':
      case 'circumstance':
      case 'untyped':
        total += arr.reduce((a, b) => a + b, 0)
        break
      default:
        total += Math.max(...arr)
        break
    }
  }

  return total
}

/**
 * Gathers `attribute_modifier` effects from e.g. a buff 
 * and applies them to the ability scores in place.
 */
export function applyAttributeModifiers(
  scores: AbilityScores,
  effects: Effect[],
  source?: string
): void {
  // We'll track typed bonuses for each ability
  const bonusesByAttr: Record<keyof AbilityScores, TypedBonus[]> = {
    str: [],
    dex: [],
    con: [],
    int: [],
    wis: [],
    cha: []
  }

  for (const e of effects) {
    if (e.effect_type !== 'attribute_modifier') continue
    if (!e.target || !e.modifier) continue

    const attribute = e.target.toLowerCase() as keyof AbilityScores
    if (!scores[attribute]) continue

    bonusesByAttr[attribute].push({
      value: e.modifier,
      type: e.bonus_type || 'untyped',
      source
    })
  }

  // Now sum them per attribute
  for (const [attr, arr] of Object.entries(bonusesByAttr)) {
    if (arr.length === 0) continue
    scores[attr as keyof AbilityScores] += consolidateTypedBonuses(arr)
  }
}

/**
 * Gathers `skill_bonus` effects from e.g. a buff 
 * and returns them in a simpler array. 
 */
export function processSkillBonuses(effects: Effect[]): Array<{ skillName: string; bonus: number; type?: string }> {
  // We'll group by skillName
  const result: Array<{ skillName: string; bonus: number; type?: string }> = []

  for (const e of effects) {
    if (e.effect_type !== 'skill_bonus') continue
    if (!e.target || !e.modifier) continue

    result.push({
      skillName: e.target,
      bonus: e.modifier,
      type: e.bonus_type || 'untyped'
    })
  }

  return result
}


/******************************************************************************
 * E N D
 *****************************************************************************/
