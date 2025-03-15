import type { Entity } from './EntityTypes';

/**
 * Base subsystem interface
 */
export interface Subsystem {
  id: string;
  version: string;
  initialize?(): Promise<void>;
  shutdown?(): Promise<void>;
}

/**
 * Ability score subsystem interface
 */
export interface AbilitySubsystem extends Subsystem {
  /**
   * Get the total ability score including all bonuses
   */
  getAbilityScore(entity: Entity, ability: string): number;
  
  /**
   * Get the ability modifier calculated from the total score
   */
  getAbilityModifier(entity: Entity, ability: string): number;
  
  /**
   * Set the base ability score
   */
  setAbilityScore(entity: Entity, ability: string, value: number): void;
  
  /**
   * Get the base ability score before bonuses
   */
  getBaseAbilityScore(entity: Entity, ability: string): number;
  
  /**
   * Get a detailed breakdown of an ability score
   */
  getAbilityBreakdown(entity: Entity, ability: string): AbilityBreakdown;
}

/**
 * Ability score calculation breakdown
 */
export interface AbilityBreakdown {
  ability: string;
  base: number;
  total: number;
  modifier: number;
  bonuses: BonusBreakdown;
}

/**
 * Skill subsystem interface
 */
export interface SkillSubsystem extends Subsystem {
  /**
   * Get the skill ranks invested
   */
  getSkillRanks(entity: Entity, skillId: number): number;
  
  /**
   * Set skill ranks
   */
  setSkillRanks(entity: Entity, skillId: number, ranks: number): void;
  
  /**
   * Get the total skill bonus including ranks, ability mod, and bonuses
   */
  getSkillBonus(entity: Entity, skillId: number): number;
  
  /**
   * Check if a skill is a class skill for the character
   */
  isClassSkill(entity: Entity, skillId: number): boolean;
  
  /**
   * Mark a skill as a class skill
   */
  setClassSkill(entity: Entity, skillId: number, isClassSkill: boolean): void;
  
  /**
   * Get a detailed breakdown of skill bonus calculation
   */
  getSkillBreakdown(entity: Entity, skillId: number): SkillBreakdown;
  
  /**
   * Get all skills with their current values
   */
  getAllSkills(entity: Entity): Record<number, SkillBreakdown>;
  
  /**
   * Get the total available skill points for a level
   */
  getAvailableSkillPoints(entity: Entity, level: number): number;
  
  /**
   * Get all invested skill points by level
   */
  getInvestedSkillPoints(entity: Entity, level?: number): number;
}

/**
 * Skill bonus calculation breakdown
 */
export interface SkillBreakdown {
  skillId: number;
  skillName: string;
  ranks: number;
  abilityModifier: number;
  abilityType: string;
  classSkill: boolean;
  classSkillBonus: number;
  otherBonuses: BonusBreakdown;
  total: number;
  isTrainedOnly: boolean;
  canUseUntrained: boolean;
  armorCheckPenalty: number;
}

/**
 * Bonus subsystem interface
 */
export interface BonusSubsystem extends Subsystem {
  /**
   * Add a bonus to a specific target
   */
  addBonus(
    entity: Entity, 
    target: string, 
    value: number, 
    type?: string, 
    source?: string
  ): void;
  
  /**
   * Remove all bonuses from a specific source
   */
  removeBonus(entity: Entity, target: string, source: string): void;
  
  /**
   * Calculate the total bonus value after applying stacking rules
   */
  calculateTotal(entity: Entity, target: string): number;
  
  /**
   * Get a detailed breakdown of bonus calculations
   */
  getBreakdown(entity: Entity, target: string): BonusBreakdown;
  
  /**
   * Check if a specific bonus exists
   */
  hasBonus(entity: Entity, target: string, source: string): boolean;
  
  /**
   * Get all bonuses for an entity
   */
  getAllBonuses(entity: Entity): Record<string, BonusBreakdown>;
}

/**
 * Bonus calculation breakdown
 */
export interface BonusBreakdown {
  total: number;
  base: number;
  components: Array<{
    value: number;
    type: string;
    source: string;
  }>;
}

/**
 * Combat subsystem interface
 */
export interface CombatSubsystem extends Subsystem {
  /**
   * Get normal armor class
   */
  getArmorClass(entity: Entity): number;
  
  /**
   * Get touch AC (no armor, shield, natural armor)
   */
  getTouchAC(entity: Entity): number;
  
  /**
   * Get flat-footed AC (no Dex bonus)
   */
  getFlatFootedAC(entity: Entity): number;
  
  /**
   * Get attack bonus based on attack type
   */
  getAttackBonus(entity: Entity, attackType: string): number;
  
  /**
   * Get saving throw bonus
   */
  getSavingThrow(entity: Entity, saveType: string): number;
  
  /**
   * Get combat maneuver bonus
   */
  getCMB(entity: Entity): number;
  
  /**
   * Get combat maneuver defense
   */
  getCMD(entity: Entity): number;
  
  /**
   * Get initiative bonus
   */
  getInitiative(entity: Entity): number;
  
  /**
   * Get AC breakdown
   */
  getACBreakdown(entity: Entity): ACBreakdown;
  
  /**
   * Get attack bonus breakdown
   */
  getAttackBreakdown(entity: Entity, attackType: string): AttackBreakdown;
  
  /**
   * Get saving throw breakdown
   */
  getSaveBreakdown(entity: Entity, saveType: string): SaveBreakdown;
}

/**
 * Armor class calculation breakdown
 */
export interface ACBreakdown {
  base: number;
  armorBonus: number;
  shieldBonus: number;
  dexModifier: number;
  sizeModifier: number;
  naturalArmor: number;
  deflectionBonus: number;
  dodgeBonus: number;
  otherBonuses: BonusBreakdown;
  total: number;
  touch: number;
  flatFooted: number;
}

/**
 * Attack bonus breakdown
 */
export interface AttackBreakdown {
  baseAttackBonus: number;
  abilityModifier: number;
  abilityUsed: string;
  sizeModifier: number;
  otherBonuses: BonusBreakdown;
  total: number;
}

/**
 * Saving throw breakdown
 */
export interface SaveBreakdown {
  saveType: string;
  baseSave: number;
  abilityModifier: number;
  abilityUsed: string;
  otherBonuses: BonusBreakdown;
  total: number;
}

/**
 * Condition subsystem interface
 */
export interface ConditionSubsystem extends Subsystem {
  validateCondition(condition: string): boolean;
  applyCondition(entity: Entity, condition: string, duration?: number): void;
  removeCondition(entity: Entity, condition: string): void;
  hasCondition(entity: Entity, condition: string): boolean;
  getActiveConditions(entity: Entity): string[];
  getConditionEffect(condition: string): ConditionEffect;
  updateDurations(entity: Entity): string[];
}

/**
 * Condition effect details
 */
export interface ConditionEffect {
  name: string;
  description: string;
  effects: Record<string, any>;
}

/**
 * Spellcasting subsystem interface
 */
export interface SpellcastingSubsystem extends Subsystem {
  /**
   * Get available spell slots for a level
   */
  getSpellSlots(entity: Entity, classId: string, level: number): number;
  
  /**
   * Get spell DC for a spell level
   */
  getSpellDC(entity: Entity, classId: string, level: number): number;
  
  /**
   * Get caster level
   */
  getCasterLevel(entity: Entity, classId: string): number;
  
  /**
   * Add a spell to known spells
   */
  addKnownSpell(entity: Entity, classId: string, level: number, spellId: string): void;
  
  /**
   * Prepare a spell
   */
  prepareSpell(entity: Entity, classId: string, level: number, spellId: string): void;
  
  /**
   * Cast a spell (use a spell slot)
   */
  castSpell(entity: Entity, classId: string, level: number, spellId: string): void;
}
