import type { Entity } from './EntityTypes';

/**
 * Base subsystem interface
 */
export interface Subsystem {
  id: string;
  version: string;
  initialize?(entity: Entity): void;
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
    source: string, 
    type?: string
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
  getAllBonuses(entity: Entity): Record<string, any>;
  
  /**
   * Get components of a bonus
   */
  getComponents(entity: Entity, target: string): Array<{ source: string; value: number; type?: string }>;
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
  otherBonuses: {
    total: number;
    base: number;
    components: Array<{ source: string; value: number; type?: string }>;
  };
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
  otherBonuses: {
    total: number;
    base: number;
    components: Array<{ source: string; value: number; type?: string }>;
  };
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
  otherBonuses: {
    total: number;
    base: number;
    components: Array<{ source: string; value: number; type?: string }>;
  };
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
   * Get spell slots for a class and level
   */
  getSpellSlots(
    entity: Entity, 
    classId: number, 
    spellLevel: number
  ): { total: number; used: number; remaining: number };
  
  /**
   * Get all spell slots for an entity
   */
  getAllSpellSlots(
    entity: Entity
  ): Record<number, Record<number, { total: number; used: number; remaining: number }>>;
  
  /**
   * Get prepared spells for a class and level
   */
  getPreparedSpells(entity: Entity, classId: number, spellLevel: number): any[];
  
  /**
   * Get all prepared spells for an entity
   */
  getAllPreparedSpells(entity: Entity): Record<number, Record<number, any[]>>;
  
  /**
   * Prepare a spell
   */
  prepareSpell(entity: Entity, classId: number, spellId: number, spellLevel: number): boolean;
  
  /**
   * Unprepare a spell
   */
  unprepareSpell(entity: Entity, classId: number, spellId: number, spellLevel: number): boolean;
  
  /**
   * Cast a spell
   */
  castSpell(entity: Entity, classId: number, spellId: number, spellLevel: number): boolean;
  
  /**
   * Reset spell slots (e.g. after resting)
   */
  resetSpellSlots(entity: Entity, classId?: number): boolean;
  
  /**
   * Reset prepared spells (e.g. after resting)
   */
  resetPreparedSpells(entity: Entity, classId?: number): boolean;
  
  /**
   * Add a bonus spell slot
   */
  addBonusSpellSlot(entity: Entity, classId: number, spellLevel: number, count?: number): boolean;
}

/**
 * Prerequisite subsystem interface
 * 
 * This subsystem handles checking if entities meet prerequisites for features, spells, etc.
 * Prerequisites can be class features, character levels, ability scores, etc.
 * 
 * This follows the Unix philosophy by separating the concern of prerequisite checking
 * from feature activation or validation.
 */
export interface PrerequisiteSubsystem extends Subsystem {
  /**
   * Check if an entity meets a specific prerequisite requirement
   * @param entity The entity to check
   * @param requirementId The ID of the prerequisite requirement
   * @returns True if the prerequisite is met, false otherwise
   */
  checkRequirement(entity: Entity, requirementId: number): Promise<boolean>;
  
  /**
   * Check if an entity meets all specified prerequisite requirements
   * @param entity The entity to check
   * @param requirementIds Array of prerequisite requirement IDs to check
   * @returns True if all prerequisites are met, false otherwise
   */
  meetsAllRequirements(entity: Entity, requirementIds: number[]): Promise<boolean>;
  
  /**
   * Get a list of requirements the entity doesn't meet
   * @param entity The entity to check
   * @param requirementIds The requirements to check
   * @returns Array of requirement details that are not met
   */
  getMissingRequirements(
    entity: Entity, 
    requirementIds: number[]
  ): Promise<Array<{id: number, type: string, description: string}>>;
  
  /**
   * Register a custom prerequisite checker for a specific requirement type
   * @param type The type of prerequisite requirement to check (e.g. 'ability_score', 'class_level')
   * @param checker Function that checks if the requirement is met
   */
  registerRequirementChecker(
    type: string, 
    checker: (entity: Entity, requirementId: number) => Promise<boolean>
  ): void;
  
  /**
   * Check if an entity meets prerequisites for a feature
   * @param entity The entity to check
   * @param featureType The type of feature to check (e.g. 'feat', 'spell')
   * @param featureId The ID of the feature to check
   * @returns True if all prerequisites are met, false otherwise
   */
  canUseFeature(entity: Entity, featureType: string, featureId: number): Promise<boolean>;
  
  /**
   * Get a detailed explanation of why a feature can or cannot be used
   * @param entity The entity to check
   * @param featureType The type of feature to check
   * @param featureId The ID of the feature to check
   * @returns Object with status and detailed explanation
   */
  explainFeatureRequirements(
    entity: Entity, 
    featureType: string, 
    featureId: number
  ): Promise<{
    canUse: boolean,
    metRequirements: Array<{id: number, type: string, description: string}>,
    missingRequirements: Array<{id: number, type: string, description: string}>
  }>;
}
