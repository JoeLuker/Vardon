// FILE: calculations.ts

import type { Database } from '../types/supabase';

// Use database types
type BonusType = Database['public']['Tables']['bonus_types']['Row'];
type BaseSkill = Database['public']['Tables']['base_skills']['Row'];
type CharacterABPBonus = Database['public']['Tables']['character_abp_bonuses']['Row'];
type AncestralTraitBonus = Database['public']['Tables']['ancestral_trait_conditional_bonuses']['Row'];
type CharacterSkillRank = Database['public']['Tables']['character_skill_ranks']['Row'];
type CharacterBuff = Database['public']['Tables']['character_buffs']['Row'];
type WeaponProficiency = Database['public']['Tables']['weapon_proficiencies']['Row'];
type SyncStatus = Database['public']['Enums']['sync_status'];
type CharacterClass = Database['public']['Tables']['base_classes']['Row'];
type NaturalAttack = Database['public']['Tables']['natural_attacks']['Row'];

type NaturalAttackDefinition = NaturalAttack & {
  properties?: Array<{
    property_key: string;
    property_value: string;
  }>;
};

  
/********************************************************************************
 * SECTION 1: DATA INTERFACES
 * These are example interfaces to help define the shape of data we’ll be using.
 * In your real code, you might adapt them to your actual data structures.
 ********************************************************************************/

export interface AbilityScores {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  }
  
  export interface AbilityModifiers {
    strMod: number;
    dexMod: number;
    conMod: number;
    intMod: number;
    wisMod: number;
    chaMod: number;
  }
  
  /** Basic character-level info needed to compute some stats. */
  export interface CharacterLevelInfo {
    level: number;                   // e.g. 5
    hitDie: number;                  // e.g. 8 for d8
    babProgression: BABProgression; // or a numeric formula
    baseSaveProgressions: {
      fort: SaveProgression;
      ref: SaveProgression;
      will: SaveProgression;
    };
  }
  
  /**
   * Favored class bonuses: each level might be +1 HP, +1 skill rank, or “other.”
   * Example from data.yaml:
   *  favored_class_bonuses:
   *    - { level: 1, choice_id: 1 } // means HP
   *    - { level: 2, choice_id: 2 } // means Skill
   *    ...
   */
  export interface FavoredClassBonus {
    id: number;
    character_id: number | null;
    favored_choice_id: number | null;
    level: number;
    sync_status: SyncStatus | null;
    updated_at: string | null;
  }
  
  /**
   * ABP assignments, e.g. “deflection +2,” “resistance +1,” etc.
   * You already have a structure for this, but here’s a minimal shape:
   */
  export interface ABPBonusAssignment {
    id: number;
    character_id: number | null;
    bonus_type_id: number | null;
    value: number;
    sync_status: SyncStatus | null;
    updated_at: string | null;
    targets?: Array<{
      target_key: string;
      target_value: string;
    }>;
  }
  
  /** Aggregated ABP result after applying “only highest” or “sum” rules. */
  export interface ABPModifiers {
    resistance?: number;        // Save bonus
    armorAttunement?: number;   // AC bonus
    weaponAttunement?: number;  // Attack/damage
    deflection?: number;        // Deflection to AC
    mentalProwess?: number;     // INT/WIS/CHA (you might choose which)
    physicalProwess?: number;   // STR/DEX/CON (you might choose which)
    toughening?: number;        // NaturalArmor
    otherBonuses?: Array<{ label: string; value: number }>;
  }
  
  /** A type for “conditional bonuses” such as “+2 to saves vs poison” or “+2 CMD if wielding sword.” */
  export interface ConditionalBonus {
    ancestral_trait_id: number;
    apply_to: string;
    bonus_type: string;
    condition: string | null;
    value: number;
  }
  
  /** 
   * Minimal structure for a piece of armor. In your system you might parse all 
   * properties (armor_bonus, max_dex, armor_check_penalty) into numeric fields.
   */
  export interface ArmorItem {
    id: number;
    name: string;
    armorBonus: number;
    maxDex: number;
    armorCheckPenalty: number;
    equipped: boolean;
  }
  
  /**
   * Minimal structure for a skill definition. You may have more fields. 
   * “abilityKey” is the main ability used (str, dex, etc.). 
   */
  export interface SkillDefinition {
    id: number;
    name: string;
    ability: string;
    ability_key: string;
    trained_only: boolean;
    armor_check_penalty: boolean;
    created_at: string | null;
    updated_at: string | null;
  }
  
  /** Skill ranks assigned to a skill_id by a certain source (class, favored, etc.). */
  export interface SkillRankRecord extends Pick<CharacterSkillRank, 'skill_id' | 'applied_at_level'> {
    source_id: number | null;
  }
  
  /** 
   * Our partial “character stats” shape after all calculations. 
   * You might keep them separate from the “base data” to avoid confusion.
   */
  export interface CharacterFinalStats {
    // Basic
    level: number;
    abilityScores: AbilityScores;
    abilityModifiers: AbilityModifiers;
    maxHP: number;
    currentHP: number;
  
    // Combat
    baseAttackBonus: number;
    meleeAttackBonus: number;
    rangedAttackBonus: number;
    AC: number;
    touchAC: number;
    flatFootedAC: number;
    saves: {
        fort: number;
        ref: number;
        will: number;
    };
    cmd: number;
  
    // Skills (using DB IDs)
    skillBonuses: { [skillId: BaseSkill['id']]: number };
  
    // Proficiencies
    weaponProficiencies: WeaponProficiency['weapon_name'][];
    
    // Natural Attacks
    naturalAttacks: NaturalAttackDefinition[];
  
    // Active Effects
    activeBuffs: CharacterBuff['id'][];
    activeConditions: string[];
  }
  
  /********************************************************************************
   * SECTION 2: HELPER FUNCTIONS (Abilities, ABP, Buffs)
   ********************************************************************************/
  
  /** Standard d20 ability mod: (score - 10)/2, floored. */
  export function computeAbilityModifier(score: number): number {
    return Math.floor((score - 10) / 2);
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
    };
  }
  
  /**
   * consolidateABPBonuses():
   *   Summarizes an array of ABPBonusAssignment into a single ABPModifiers object.
   *   Example: only the highest deflection, but sum up “mental_prowess,” etc.
   */
  export function consolidateABPBonuses(bonuses: ABPBonusAssignment[]): ABPModifiers {
    if (!Array.isArray(bonuses)) {
        throw new Error('Expected array of ABP bonuses');
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
    };
  
    for (const b of bonuses) {
      if (b.bonus_type_id === null) continue;
      
      switch (b.bonus_type_id) {
        case 1: // resistance
          result.resistance = Math.max(result.resistance ?? 0, b.value);
          break;
        case 2: // armor_attunement
          result.armorAttunement = Math.max(result.armorAttunement ?? 0, b.value);
          break;
        case 3: // weapon_attunement
          result.weaponAttunement = Math.max(result.weaponAttunement ?? 0, b.value);
          break;
        case 4: // deflection
          result.deflection = Math.max(result.deflection ?? 0, b.value);
          break;
        case 5: // mental_prowess
          result.mentalProwess = (result.mentalProwess ?? 0) + b.value;
          break;
        case 6: // physical_prowess
          result.physicalProwess = (result.physicalProwess ?? 0) + b.value;
          break;
        case 7: // toughening
          result.toughening = Math.max(result.toughening ?? 0, b.value);
          break;
        default:
          // “other” or custom type
          result.otherBonuses?.push({ label: b.bonus_type_id.toString(), value: b.value });
          break;
      }
    }
  
    return result;
  }
  
  /********************************************************************************
   * SECTION 3: HIT POINTS & FAVORED CLASS BONUSES
   ********************************************************************************/
  
  /**
   * computeMaxHP():
   *   Example logic for summing up HP from Hit Die, Constitution, favored class, etc.
   *   Assumes average or fixed HP per level, or you can adapt to your rolling method.
   */
  export interface ComputeMaxHPArgs {
    level: number;
    hitDie: number;
    conMod: number;
    favoredClassBonuses: Array<{ choiceId: number }>;
  }
  
  export function computeMaxHP(args: ComputeMaxHPArgs): number {
    const { level, hitDie, conMod, favoredClassBonuses } = args;
  
    // 1) Base HP from class Hit Die each level. 
    // Example: first level full, subsequent levels average (PF often uses half+1).
    // Adjust this logic to your house rules.
    let baseHp = 0;
    for (let lvl = 1; lvl <= level; lvl++) {
      if (lvl === 1) {
        baseHp += hitDie; // max at 1st level
      } else {
        baseHp += Math.floor(hitDie / 2) + 1; // average
      }
    }
  
    // 2) Add Constitution mod * level
    const conHp = conMod * level;
  
    // 3) Favored class bonuses that are “+1 HP”
    // Let’s assume choiceId=1 => HP, 2 => skill, 3 => other
    const fcHp = favoredClassBonuses.filter(fcb => fcb.choiceId === 1).length;
  
    // 4) ABP “toughening” might add to HP or DR. Let’s say we add it to HP/level for simplicity
  
    const finalHp = baseHp + conHp + fcHp;
    return finalHp;
  }
  
  /********************************************************************************
   * SECTION 4: SAVE CALCULATIONS
   ********************************************************************************/
  /**
   * For each save (Fort/Ref/Will), PF1e uses:
   *   Good progression = +2 at level 1, then +1/2 level
   *   Poor progression = +0 at level 1, then +1/3 level
   */
  export function getBaseSave(level: number, progression: SaveProgression): number {
    if (progression === 'good') {
      return Math.floor((level * 2) / 3 + 2); // or your exact formula
    }
    // poor
    return Math.floor(level / 3);
  }
  
  export function computeSaves(
    level: number,
    baseSaveProgs: { fort: SaveProgression; ref: SaveProgression; will: SaveProgression },
    abilityMods: AbilityModifiers,
    abpResistance?: number,
    conditionalBonuses?: ConditionalBonus[],
    activeConditions?: string[],
  ): { fort: number; ref: number; will: number } {
    const baseFort = getBaseSave(level, baseSaveProgs.fort);
    const baseRef = getBaseSave(level, baseSaveProgs.ref);
    const baseWill = getBaseSave(level, baseSaveProgs.will);
  
    let fort = baseFort + abilityMods.conMod;
    let ref = baseRef + abilityMods.dexMod;
    let will = baseWill + abilityMods.wisMod;
  
    // Apply ABP “resistance”
    if (abpResistance && abpResistance > 0) {
      fort += abpResistance;
      ref += abpResistance;
      will += abpResistance;
    }
  
    // Apply conditional bonuses if conditions are met (e.g. “+2 vs poison”)
    if (conditionalBonuses && activeConditions) {
      for (const cb of conditionalBonuses) {
        if (cb.apply_to === 'saves' && cb.condition && activeConditions.includes(cb.condition)) {
          // If it's unconditional among the "activeConditions," add it.
          fort += cb.value;
          ref += cb.value;
          will += cb.value;
        }
        // If you store more detailed logic like “Fort vs poison,” you can adapt.
      }
    }
  
    return { fort, ref, will };
  }
  
  /********************************************************************************
   * SECTION 5: BASE ATTACK BONUS & ATTACK CALCULATIONS
   ********************************************************************************/
  /**
   * This function demonstrates how to compute a character’s BAB from level & progression.
   * For PF1e:
   *   - “full” ~ +1/level
   *   - “threeFourths” ~ +3/4 level
   *   - “half” ~ +1/2 level
   */
  export function getBaseAttackBonus(level: number, progression: BABProgression): number {
    switch (progression) {
      case 'full':
        return level;
      case 'threeFourths':
        return Math.floor((3 * level) / 4);
      case 'half':
        return Math.floor(level / 2);
      default:
        return 0;
    }
  }
  
  /**
   * computeAttackBonus():
   *   Example for either melee or ranged.  Typically:
   *   - Start with BAB
   *   - Add relevant ability mod (STR for melee, DEX for ranged, ignoring “finesse” for brevity)
   *   - Add ABP “weaponAttunement” if any
   *   - Subtract or add any feats/buffs (e.g. Power Attack, Deadly Aim, TWF, etc.) 
   *     in your real code you’ll need more robust logic for each feat’s effect.
   */
  export interface ComputeAttackBonusArgs {
    bab: number;
    abilityMod: number;         // STR or DEX
    weaponAttunement?: number;  // from ABP
    buffs?: CharacterBuff[];
    feats?: string[];  // Use DB type for feat names
  }
  
  export function computeAttackBonus(args: ComputeAttackBonusArgs): number {
    let bonus = args.bab + args.abilityMod;
  
    // Apply ABP
    if (args.weaponAttunement && args.weaponAttunement > 0) {
      bonus += args.weaponAttunement;
    }
  
    // Simplified example: if feats includes “Power Attack,” at +5 BAB = -1 to attack, etc.
    // (In real PF1e, Power Attack has a formula based on BAB and so on.)
    if (args.feats?.includes('PowerAttack')) {
      // Example: -1 to attack if BAB<4, else -2 ...
      bonus -= 1;
    }
  
    // Buffs might add typed bonuses or penalties to “attack”. 
    // In your real code, you’d handle typed stacking rules, etc.
    if (args.buffs) {
      for (const b of args.buffs) {
        if (!b.is_active) continue;
        if (b.target_key === 'attack') {
          bonus += b.value;
        }
      }
    }
  
    return bonus;
  }
  
  /********************************************************************************
   * SECTION 6: SKILL CALCULATIONS
   ********************************************************************************/
  /**
   * In PF1e, a skill’s total bonus can be:
   *   ranks + abilityMod + (class skill bonus of +3 if ranks>0) + typed bonuses + armor check penalty + ...
   * This function is a *per-skill* calc. In practice, you’ll iterate over all skills.
   */
  export interface ComputeSkillBonusArgs {
    skill: SkillDefinition;
    totalRanks: number;
    isClassSkill: boolean;
    abilityScores: AbilityScores;
    abilityModifiers: AbilityModifiers;
    armorCheckPenalty: number;
    typedBonuses: Array<{
        bonusType: BonusType['name'];
        value: number;
        appliesTo: string;
    }>;
  }
  
  export function computeSkillBonus(args: ComputeSkillBonusArgs): number {
    const { skill, totalRanks, isClassSkill, abilityModifiers, armorCheckPenalty } = args;
    let bonus = 0;
  
    // 1) Ranks
    bonus += totalRanks;
  
    // 2) Ability mod: typically skill.abilityKey => abilityModifiers
    // If a trait like “Pragmatic Activator” or “Clever Wordplay” changes the mod,
    // handle that before calling this or inside a bigger pipeline.
    const abilityMod = abilityModifiers[`${skill.ability_key}Mod` as keyof AbilityModifiers];
    bonus += abilityMod;
  
    // 3) +3 if it’s a class skill and you have at least 1 rank
    if (isClassSkill && totalRanks > 0) {
      bonus += 3;
    }
  
    // 4) Armor check penalty if skill.armor_check_penalty is true
    if (skill.armor_check_penalty) {
      bonus -= armorCheckPenalty;
    }
  
    // 5) typedBonuses that apply specifically to this skill
    // In your system, you might store skillName in “appliesTo” or skillId, etc.
    for (const tb of args.typedBonuses) {
      if (tb.appliesTo === skill.name) {
        // If it’s “dodge” or “untyped,” you might sum them. If it’s “enhancement,” only highest, etc.
        // For simplicity, we’ll just sum them all.
        bonus += tb.value;
      }
    }
  
    return bonus;
  }
  
  /********************************************************************************
   * SECTION 7: EQUIPMENT (ARMOR) & AC CALCULATIONS
   ********************************************************************************/
  /** 
   * In PF1e, you usually can’t wear multiple armors, but you might have a shield. 
   * Here’s a simple aggregator.
   */
  export interface ArmorStats {
    totalArmorBonus: number;
    maxDex: number;
    armorCheckPenalty: number;
  }
  
  export function computeArmorStats(equippedArmor: ArmorItem[]): ArmorStats {
    // If multiple pieces are equipped, decide how you handle it. 
    // For now, assume only 1 suit of armor is worn at a time, plus maybe 1 shield. 
    // We’ll just sum them if they exist.
    let totalArmorBonus = 0;
    let maxDexList: number[] = [];
    let totalACP = 0;
  
    for (const armor of equippedArmor) {
      if (!armor.equipped) continue;
      totalArmorBonus += armor.armorBonus;
      maxDexList.push(armor.maxDex);
      totalACP += armor.armorCheckPenalty;
    }
  
    // The limiting maxDex is the lowest of the set
    const finalMaxDex = maxDexList.length > 0 ? Math.min(...maxDexList) : 99; // 99 => no real cap
    return {
      totalArmorBonus,
      maxDex: finalMaxDex,
      armorCheckPenalty: totalACP,
    };
  }
  
  /**
   * computeAC():
   *   AC = 10 + armorBonus + shieldBonus + limited Dex + deflection + etc.
   *   You can add more typed fields as needed (natural armor, etc.).
   */
  export interface ComputeACArgs {
    baseDexMod: number;
    armorBonus: number;
    deflectionBonus?: number;
    armorAttunement?: number;
    abilityModifiers: AbilityModifiers;
    size: string;  // Could be an enum from DB if available
    armor: ArmorStats;
    bonuses: ConditionalBonus[];
  }
  
  export function computeAC(args: ComputeACArgs): number {
    const {
      baseDexMod,
      armorBonus,
      deflectionBonus = 0,
      armorAttunement = 0,
      abilityModifiers,
      size,
      armor,
      bonuses,
    } = args;
  
    const dexToAC = baseDexMod >= 0 ? baseDexMod : 0; // If negative Dex, still apply negative if your table does.
  
    // You might have separate fields for “natural armor,” “dodge,” etc.
    let AC = 10 + armorBonus + dexToAC + deflectionBonus + armorAttunement;
    return AC;
  }
  
  /********************************************************************************
   * SECTION 8: CMD CALCULATIONS
   ********************************************************************************/
  /**
   * Typical PF1e formula:
   *   CMD = 10 + BAB + STR mod + DEX mod + size mod + ...
   * Add or skip more typed bonuses as you see fit.
   */
  export interface ComputeCmdArgs {
    baseAttackBonus: number;
    abilityModifiers: AbilityModifiers;
    size: string;
    sizeMod: number;
    bonuses: ConditionalBonus[];
    conditionalBonuses: ConditionalBonus[];
    activeConditions: string[];
  }
  
  export function computeCMD(args: ComputeCmdArgs): number {
    let cmd = 10 + args.baseAttackBonus + args.abilityModifiers.strMod + args.abilityModifiers.dexMod + args.sizeMod;
  
    // Possibly apply conditional bonuses (like “+2 CMD if wielding_sword”)
    if (args.conditionalBonuses && args.activeConditions) {
      for (const cb of args.conditionalBonuses) {
        if (cb.apply_to === 'cmd' && cb.condition && args.activeConditions.includes(cb.condition)) {
          cmd += cb.value;
        }
      }
    }
    return cmd;
  }
  
  /********************************************************************************
   * SECTION 9: FINAL PIPELINE EXAMPLE
   ********************************************************************************/
  /**
   * finalizeCharacter():
   *   Puts it all together. In practice, you might break this down or
   *   create smaller “assemble**” functions. But here’s one possible “big” function.
   */
  export interface FinalizeCharacterArgs {
    // Basic
    levelInfo: CharacterLevelInfo;
    baseAbilityScores: AbilityScores;
    characterClass: Pick<CharacterClass, 'id' | 'name' | 'description'>;
  
    // Favored class
    favoredClassBonuses: Array<{
        level: number;
        choice_id: Database['public']['Tables']['favored_class_choices']['Row']['id'];
    }>;
  
    // ABP
    abpAssignments: Array<Pick<CharacterABPBonus, 'bonus_type_id' | 'value'>>;
  
    // Equipment
    equippedArmor: ArmorItem[];
  
    // Buffs
    activeBuffs: CharacterBuff[];
  
    // Skills
    skillDefinitions: Array<Pick<BaseSkill, 'id' | 'name' | 'ability' | 'trained_only' | 'armor_check_penalty'>>;
    skillRanks: Array<Pick<CharacterSkillRank, 'skill_id' | 'applied_at_level'>>;
    classSkills: BaseSkill['id'][];
  
    // Bonuses and Conditions
    conditionalBonuses: Array<Pick<AncestralTraitBonus, 'bonus_type' | 'value' | 'apply_to' | 'condition'>>;
    activeConditions: string[];
  
    // Current HP
    currentHP: number;
  }
  
  /** 
   * This returns a big “CharacterFinalStats” object with the computed final results. 
   */
  export function finalizeCharacter(args: FinalizeCharacterArgs): CharacterFinalStats {
    // 1) Consolidate ABP
    const abpMods = consolidateABPBonuses(args.abpAssignments as ABPBonusAssignment[]);
  
    // 2) Build final ability scores from ABP "mental_prowess/physical_prowess," buffs, etc.
    let finalAbilityScores = structuredClone(args.baseAbilityScores);
    //   2a) Apply ABP mental/physical prowess 
    if (abpMods.mentalProwess && abpMods.mentalProwess > 0) {
      // If you let the user choose which mental stat to boost, handle that. 
      // For now, assume we put it into INT.
      finalAbilityScores.int += abpMods.mentalProwess;
    }
    if (abpMods.physicalProwess && abpMods.physicalProwess > 0) {
      // Assume we put it into DEX
      finalAbilityScores.dex += abpMods.physicalProwess;
    }
  
    //   2b) Apply buffs that modify ability scores. 
    //       This is a simplified approach; typed stacking rules can get more complex.
    for (const buff of args.activeBuffs) {
      if (!buff.is_active) continue;
      // If buff.target is “str”, “dex”, etc., apply it. 
      // If it’s “multiple”, you’d handle that differently.
      if (
        buff.target_key === 'str' ||
        buff.target_key === 'dex' ||
        buff.target_key === 'con' ||
        buff.target_key === 'int' ||
        buff.target_key === 'wis' ||
        buff.target_key === 'cha'
      ) {
        (finalAbilityScores as any)[buff.target_key] += buff.value;
      }
    }
  
    // 3) Compute ability modifiers
    const finalAbilityMods = computeAllAbilityModifiers(finalAbilityScores);
  
    // 4) Compute HP
    const maxHP = computeMaxHP({
      level: args.levelInfo.level,
      hitDie: args.levelInfo.hitDie,
      conMod: finalAbilityMods.conMod,
      favoredClassBonuses: args.favoredClassBonuses.map(fcb => ({ choiceId: fcb.choice_id })),
      tougheningValue: abpMods.toughening,
      constitutionModifier: 0,
      favoredClassHP: 0,
      bonuses: []
    });
  
    // 5) Compute BAB
    const bab = getBaseAttackBonus(args.levelInfo.level, args.levelInfo.babProgression);
  
    // 6) Compute saves
    const saves = computeSaves(
      args.levelInfo.level,
      args.levelInfo.baseSaveProgressions,
      finalAbilityMods,
      abpMods.resistance,
      args.conditionalBonuses as unknown as ConditionalBonus[],
      args.activeConditions,
    );
  
    // 7) Compute armor stats from equipped items
    const armorStats = computeArmorStats(args.equippedArmor);
  
    // 8) Compute AC
    // Dex to AC is limited by armorStats.maxDex
    const dexToAC = Math.min(finalAbilityMods.dexMod, armorStats.maxDex);
    const baseAC = computeAC({
      baseDexMod: dexToAC,
      armorBonus: armorStats.totalArmorBonus,
      deflectionBonus: abpMods.deflection,
      armorAttunement: abpMods.armorAttunement,
      abilityModifiers: finalAbilityMods,
      size: "medium",
      armor: armorStats,
      bonuses: args.conditionalBonuses as ConditionalBonus[] || []
    });

    // 9) Compute Attack Bonuses (simple approach: one for melee, one for ranged)
    //    Here we ignore TWF, Rapid Shot, etc. or handle them in computeAttackBonus.
    const meleeAttack = computeAttackBonus({
      bab,
      abilityMod: finalAbilityMods.strMod,
      weaponAttunement: abpMods.weaponAttunement,
      buffs: args.activeBuffs,
      feats: args.feats,
      baseAttackBonus: bab,
      abilityModifiers: finalAbilityMods,
      size: "medium",
      bonuses: args.conditionalBonuses || []
    });
    const rangedAttack = computeAttackBonus({
      bab,
      abilityMod: finalAbilityMods.dexMod,
      weaponAttunement: abpMods.weaponAttunement,
      buffs: args.activeBuffs,
      feats: args.feats,
      baseAttackBonus: bab,
      abilityModifiers: finalAbilityMods,
      size: "medium",
      bonuses: args.conditionalBonuses || []
    });
  
    // 10) Compute skills
    const skillBonuses: { [skillId: BaseSkill['id']]: number } = {};
    for (const skillDef of args.skillDefinitions) {
      // find how many ranks the user has in this skill
      const rankRecord = args.skillRanks.find(sr => sr.skillId === skillDef.id);
      const totalRanks = rankRecord?.totalRanks || 0;
      const isClassSkill = args.classSkills.includes(skillDef.id);
      // If you have typed skill bonuses from feats/buffs, pass them in 
      // or handle them in a separate aggregator.
      // For now, we skip typed bonuses or pass an empty array.
      skillBonuses[skillDef.id] = computeSkillBonus({
        skill: {
          id: skillDef.id,
          name: skillDef.name,
          ability: skillDef.ability,
          trained_only: skillDef.trained_only,
          armor_check_penalty: skillDef.armor_check_penalty
        },
        totalRanks,
        isClassSkill,
        abilityScores: finalAbilityScores,
        abilityModifiers: finalAbilityMods,
        armorCheckPenalty: armorStats.armorCheckPenalty,
        typedBonuses: [],
        skillKey: "",
        ranks: 0,
        classSkills: [],
        bonuses: []
      });
    }
  
    // 11) Compute CMD
    const cmd = computeCMD({
      bab,
      strMod: finalAbilityMods.strMod,
      dexMod: finalAbilityMods.dexMod,
      sizeMod: 0,
      conditionalBonuses: args.conditionalBonuses as ConditionalBonus[],
      activeConditions: args.activeConditions,
      baseAttackBonus: bab,
      abilityModifiers: finalAbilityMods,
      size: "medium",
      bonuses: args.conditionalBonuses as ConditionalBonus[] || []
    });
  
    // 12) Build final stats object
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
      touchAC: 10 + finalAbilityMods.dexMod, // ignoring armor, etc., if you want partial
      flatFootedAC: baseAC - finalAbilityMods.dexMod, // or armor-based approach
      saves,
      cmd,
      skillBonuses,
      weaponProficiencies: [],
      naturalAttacks: [],
      activeBuffs: [],
      activeConditions: []
    };
  
    return finalStats;
  }
  
  // Add these type definitions
  export interface ComputeSkillBonusArgs {
    skillKey: string;
    ranks: number;
    abilityModifiers: AbilityModifiers;
    classSkills: string[];
    bonuses: ConditionalBonus[];
  }
  
  export interface ComputeAttackBonusArgs {
    baseAttackBonus: number;
    abilityModifiers: AbilityModifiers;
    size: string;
    bonuses: ConditionalBonus[];
  }
  
  export interface ComputeACArgs {
    abilityModifiers: AbilityModifiers;
    size: string;
    armor: ArmorStats;
    bonuses: ConditionalBonus[];
  }
  
  export interface ComputeCmdArgs {
    baseAttackBonus: number;
    abilityModifiers: AbilityModifiers;
    size: string;
    bonuses: ConditionalBonus[];
  }
  
  export interface ComputeMaxHPArgs {
    level: number;
    constitutionModifier: number;
    hitDie: number;
    favoredClassHP: number;
    bonuses: Array<{
        bonus_type: string;
        value: number;
    }>;
  }
  
  export interface FinalizeCharacterArgs {
    // Add properties based on your needs
    level: number;
    abilityScores: AbilityScores;
    // ... other required properties
  }
  
 
  // Add stacking rules
  export function stackBonuses(bonuses: Array<{ type: string; value: number }>): number {
      const byType: { [type: string]: number[] } = {};
      
      // Group by type
      bonuses.forEach(bonus => {
          if (!byType[bonus.type]) byType[bonus.type] = [];
          byType[bonus.type].push(bonus.value);
      });
      
      let total = 0;
      
      // Apply stacking rules
      Object.entries(byType).forEach(([type, values]) => {
          switch(type) {
              case 'dodge':
              case 'untyped':
                  // These stack
                  total += values.reduce((sum, v) => sum + v, 0);
                  break;
              default:
                  // Only highest applies
                  total += Math.max(...values);
                  break;
          }
      });
      
      return total;
  }
  
  // Add effect processing
  export interface Effect {
      attribute_modifiers?: Array<{
          attribute: string;
          modifier: number;
          type: string;
      }>;
      skill_bonus?: Array<{
          skill_name: string;
          bonus: number;
          type: string;
      }>;
      // ... other effect types
  }
  
  export function processEffects(effects: Effect[], target: any): void {
      effects.forEach(effect => {
          if (effect.attribute_modifiers) {
              effect.attribute_modifiers.forEach(mod => {
                  // Apply to target.attributes or similar
              });
          }
          if (effect.skill_bonus) {
              effect.skill_bonus.forEach(bonus => {
                  // Apply to target.skillBonuses or similar
              });
          }
          // ... handle other effect types
      });
  }
  
  // Add type-safe enums for common values
  export const BAB_PROGRESSION = {
      FULL: 'full',
      THREE_FOURTHS: 'threeFourths',
      HALF: 'half'
  } as const;
  
  export type BABProgression = typeof BAB_PROGRESSION[keyof typeof BAB_PROGRESSION];
  
  export const SAVE_PROGRESSION = {
      GOOD: 'good',
      POOR: 'poor'
  } as const;
  
  export type SaveProgression = typeof SAVE_PROGRESSION[keyof typeof SAVE_PROGRESSION];
  
  // Add type guard for buff validation
  export function isValidBuff(buff: Partial<CharacterBuff>): buff is CharacterBuff {
      return (
          typeof buff.name === 'string' &&
          typeof buff.bonus_type === 'string' &&
          typeof buff.amount === 'number' &&
          typeof buff.target === 'string' &&
          typeof buff.is_active === 'boolean'
      );
  }
  