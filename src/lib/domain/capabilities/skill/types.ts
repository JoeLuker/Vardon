/**
 * Skill Capability Types
 * 
 * This file defines the interfaces for the skill capability,
 * which provides access to skill calculations.
 */

import { Entity } from '../../kernel/types';
import { BaseCapability, CapabilityOptions } from '../types';

/**
 * Skill bonus calculation breakdown
 */
export interface SkillBreakdown {
  /** Skill ID */
  skillId: number;
  
  /** Skill name */
  skillName: string;
  
  /** Skill ranks invested */
  ranks: number;
  
  /** Ability modifier applied to this skill */
  abilityModifier: number;
  
  /** Ability type (e.g. 'strength', 'dexterity') */
  abilityType: string;
  
  /** Whether this is a class skill */
  classSkill: boolean;
  
  /** Class skill bonus */
  classSkillBonus: number;
  
  /** Other bonuses applied to this skill */
  otherBonuses: {
    total: number;
    base: number;
    components: Array<{ source: string; value: number; type?: string }>;
  };
  
  /** Total skill bonus */
  total: number;
  
  /** Whether this skill requires training to use */
  isTrainedOnly: boolean;
  
  /** Whether this skill can be used untrained */
  canUseUntrained: boolean;
  
  /** Armor check penalty applied to this skill (if any) */
  armorCheckPenalty: number;
}

/**
 * Skill capability options
 */
export interface SkillCapabilityOptions extends CapabilityOptions {
  /** Initial skill data to use */
  skills?: Array<{
    id: number;
    name: string;
    abilityType: string;
    isTrainedOnly: boolean;
    hasArmorCheckPenalty: boolean;
  }>;
}

/**
 * Skill capability interface
 */
export interface SkillCapability extends BaseCapability {
  /** Unique identifier for this capability */
  readonly id: string;
  
  /**
   * Get the skill ranks invested
   * @param entity Entity to get skill ranks for
   * @param skillId Skill ID
   * @returns Skill ranks
   */
  getSkillRanks(entity: Entity, skillId: number): number;
  
  /**
   * Set skill ranks
   * @param entity Entity to set skill ranks for
   * @param skillId Skill ID
   * @param ranks Number of ranks
   */
  setSkillRanks(entity: Entity, skillId: number, ranks: number): void;
  
  /**
   * Get the total skill bonus including ranks, ability mod, and bonuses
   * @param entity Entity to get skill bonus for
   * @param skillId Skill ID
   * @returns Total skill bonus
   */
  getSkillBonus(entity: Entity, skillId: number): number;
  
  /**
   * Check if a skill is a class skill for the character
   * @param entity Entity to check class skill for
   * @param skillId Skill ID
   * @returns Whether the skill is a class skill
   */
  isClassSkill(entity: Entity, skillId: number): boolean;
  
  /**
   * Mark a skill as a class skill
   * @param entity Entity to set class skill for
   * @param skillId Skill ID
   * @param isClassSkill Whether the skill should be a class skill
   */
  setClassSkill(entity: Entity, skillId: number, isClassSkill: boolean): void;
  
  /**
   * Get a detailed breakdown of skill bonus calculation
   * @param entity Entity to get skill breakdown for
   * @param skillId Skill ID
   * @returns Skill breakdown
   */
  getSkillBreakdown(entity: Entity, skillId: number): SkillBreakdown;
  
  /**
   * Get all skills with their current values
   * @param entity Entity to get skills for
   * @returns Record of skill breakdowns by skill ID
   */
  getAllSkills(entity: Entity): Record<number, SkillBreakdown>;
  
  /**
   * Apply a bonus to a skill
   * @param entity Entity to apply bonus to
   * @param skillId Skill ID
   * @param value Bonus value
   * @param type Bonus type (e.g. 'enhancement', 'competence')
   * @param source Source of the bonus (e.g. 'Skill Focus', 'Cloak of Competence')
   */
  applySkillBonus(
    entity: Entity,
    skillId: number,
    value: number,
    type: string,
    source: string
  ): void;
  
  /**
   * Remove a bonus from a skill
   * @param entity Entity to remove bonus from
   * @param skillId Skill ID
   * @param source Source of the bonus to remove
   */
  removeSkillBonus(entity: Entity, skillId: number, source: string): void;
  
  /**
   * Get the total available skill points for a level
   * @param entity Entity to get skill points for
   * @param level Character level
   * @returns Total available skill points
   */
  getAvailableSkillPoints(entity: Entity, level: number): number;
  
  /**
   * Get all invested skill points by level
   * @param entity Entity to get invested skill points for
   * @param level Optional level to filter by
   * @returns Total invested skill points
   */
  getInvestedSkillPoints(entity: Entity, level?: number): number;
}