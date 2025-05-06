/**
 * Skill Capability Provider
 * 
 * This module implements the skill capability, which provides
 * access to skill calculations and management.
 * 
 * It follows Unix philosophy by:
 * 1. Having explicit dependencies on other capabilities
 * 2. Focusing on a single responsibility (skill management)
 * 3. Using standard interfaces for interoperability
 */

import type { Entity } from '../../kernel/types';
import { BaseCapability } from '../BaseCapability';
import type { SkillCapability, SkillCapabilityOptions, SkillBreakdown } from './types';
import type { AbilityCapability } from '../ability/types';
import type { BonusCapability } from '../bonus/types';

/**
 * Implementation of the skill capability
 */
export class SkillCapabilityProvider extends BaseCapability implements SkillCapability {
  /** Capability ID */
  public readonly id = 'skill';
  
  /** Skills data */
  private readonly skills: Array<{
    id: number;
    name: string;
    abilityType: string;
    isTrainedOnly: boolean;
    hasArmorCheckPenalty: boolean;
  }>;
  
  /** Ability capability reference */
  private readonly abilityCapability: AbilityCapability;
  
  /** Bonus capability reference */
  private readonly bonusCapability: BonusCapability;
  
  constructor(
    abilityCapability: AbilityCapability,
    bonusCapability: BonusCapability,
    options: SkillCapabilityOptions = {}
  ) {
    super(options);
    
    // Store capability references explicitly
    this.abilityCapability = abilityCapability;
    this.bonusCapability = bonusCapability;
    
    // Initialize skills data
    this.skills = options.skills || [];
    
    // Log the initialization
    this.log(`Initialized skill capability with ${this.skills.length} skills`);
  }
  
  /**
   * Initialize skills from character data
   * @param entity Entity to initialize skills for
   */
  initialize(entity: Entity): void {
    // Ensure the skills property exists
    if (!entity.properties.skills) {
      entity.properties.skills = {};
    }
    
    // Ensure the classSkills property exists
    if (!entity.properties.classSkills) {
      entity.properties.classSkills = [];
    }
    
    // Initialize skill ranks from character data
    if (entity.properties.character?.game_character_skill_rank) {
      for (const skillRank of entity.properties.character.game_character_skill_rank) {
        const skillId = skillRank.skill_id;
        if (!skillId) continue;
        
        // Get current ranks and increment by 1 for each rank entry
        const currentRanks = this.getSkillRanks(entity, skillId);
        this.setSkillRanks(entity, skillId, currentRanks + 1);
      }
    }
    
    // Initialize class skills from character data
    if (entity.properties.character?.game_character_class) {
      for (const charClass of entity.properties.character.game_character_class) {
        if (!charClass.class) continue;
        
        // In a real implementation, you'd fetch class skills from the database
        // For now, use a placeholder implementation
        const classSkills = entity.properties.character.class_skills || [];
        
        for (const skillId of classSkills) {
          this.setClassSkill(entity, skillId, true);
        }
      }
    }
    
    this.log(`Initialized skills for entity: ${entity.id}`);
  }
  
  /**
   * Get the skill ranks invested
   * @param entity Entity to get skill ranks for
   * @param skillId Skill ID
   * @returns Skill ranks
   */
  getSkillRanks(entity: Entity, skillId: number): number {
    if (!entity.properties.skills) return 0;
    return entity.properties.skills[skillId]?.ranks || 0;
  }
  
  /**
   * Set skill ranks
   * @param entity Entity to set skill ranks for
   * @param skillId Skill ID
   * @param ranks Number of ranks
   */
  setSkillRanks(entity: Entity, skillId: number, ranks: number): void {
    // Ensure the skills property exists
    if (!entity.properties.skills) {
      entity.properties.skills = {};
    }
    
    // Set the skill ranks
    entity.properties.skills[skillId] = {
      ...entity.properties.skills[skillId],
      ranks
    };
    
    // Update entity timestamp
    entity.metadata.updatedAt = Date.now();
    
    this.log(`Set ranks for skill ${skillId} to ${ranks} for entity ${entity.id}`);
  }
  
  /**
   * Get the total skill bonus including ranks, ability mod, and bonuses
   * @param entity Entity to get skill bonus for
   * @param skillId Skill ID
   * @returns Total skill bonus
   */
  getSkillBonus(entity: Entity, skillId: number): number {
    const breakdown = this.getSkillBreakdown(entity, skillId);
    return breakdown.total;
  }
  
  /**
   * Check if a skill is a class skill for the character
   * @param entity Entity to check class skill for
   * @param skillId Skill ID
   * @returns Whether the skill is a class skill
   */
  isClassSkill(entity: Entity, skillId: number): boolean {
    if (!entity.properties.classSkills) return false;
    return entity.properties.classSkills.includes(skillId);
  }
  
  /**
   * Mark a skill as a class skill
   * @param entity Entity to set class skill for
   * @param skillId Skill ID
   * @param isClassSkill Whether the skill should be a class skill
   */
  setClassSkill(entity: Entity, skillId: number, isClassSkill: boolean): void {
    // Ensure the classSkills property exists
    if (!entity.properties.classSkills) {
      entity.properties.classSkills = [];
    }
    
    if (isClassSkill && !this.isClassSkill(entity, skillId)) {
      // Add to class skills
      entity.properties.classSkills.push(skillId);
    } else if (!isClassSkill && this.isClassSkill(entity, skillId)) {
      // Remove from class skills
      entity.properties.classSkills = entity.properties.classSkills.filter(id => id !== skillId);
    }
    
    // Update entity timestamp
    entity.metadata.updatedAt = Date.now();
    
    this.log(`Set class skill status for skill ${skillId} to ${isClassSkill} for entity ${entity.id}`);
  }
  
  /**
   * Get a detailed breakdown of skill bonus calculation
   * @param entity Entity to get skill breakdown for
   * @param skillId Skill ID
   * @returns Skill breakdown
   */
  getSkillBreakdown(entity: Entity, skillId: number): SkillBreakdown {
    // Get skill ranks
    const ranks = this.getSkillRanks(entity, skillId);
    
    // Find skill data
    const skill = this.skills.find(s => s.id === skillId);
    const skillName = skill?.name || `Skill ${skillId}`;
    
    // Check if it's a class skill
    const isClassSkill = this.isClassSkill(entity, skillId);
    const classSkillBonus = isClassSkill && ranks > 0 ? 3 : 0;
    
    // Get the ability associated with this skill
    const abilityType = skill?.abilityType?.toLowerCase() || 'dexterity';
    
    // Get the ability modifier from the ability capability
    let abilityModifier = 0;
    try {
      abilityModifier = this.abilityCapability.getAbilityModifier(entity, abilityType);
    } catch (error) {
      this.error(`Error getting ability modifier for ${abilityType}`, error);
    }
    
    // Get any additional bonuses from the bonus capability
    let otherBonuses = {
      total: 0,
      base: 0,
      components: []
    };
    
    try {
      otherBonuses = this.bonusCapability.getBreakdown(entity, `skill.${skillId}`);
    } catch (error) {
      this.error(`Error getting bonus breakdown for skill ${skillId}`, error);
    }
    
    // Calculate the total skill bonus
    const total = ranks + classSkillBonus + abilityModifier + otherBonuses.total;
    
    // Calculate armor check penalty if applicable
    let armorCheckPenalty = 0;
    // In a real implementation, this would be calculated from armor
    
    return {
      skillId,
      skillName,
      ranks,
      abilityModifier,
      abilityType,
      classSkill: isClassSkill,
      classSkillBonus,
      otherBonuses,
      total,
      isTrainedOnly: skill?.isTrainedOnly || false,
      canUseUntrained: !skill?.isTrainedOnly,
      armorCheckPenalty
    };
  }
  
  /**
   * Get all skills with their current values
   * @param entity Entity to get skills for
   * @returns Record of skill breakdowns by skill ID
   */
  getAllSkills(entity: Entity): Record<number, SkillBreakdown> {
    const result: Record<number, SkillBreakdown> = {};
    
    // Create breakdown for all skills in the game data
    for (const skill of this.skills) {
      result[skill.id] = this.getSkillBreakdown(entity, skill.id);
    }
    
    return result;
  }
  
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
  ): void {
    try {
      this.bonusCapability.addBonus(entity, `skill.${skillId}`, value, type, source);
      this.log(`Applied ${type} bonus of ${value} to skill ${skillId} for entity ${entity.id} from ${source}`);
    } catch (error) {
      this.error(`Failed to apply bonus to skill ${skillId}`, error);
    }
  }
  
  /**
   * Remove a bonus from a skill
   * @param entity Entity to remove bonus from
   * @param skillId Skill ID
   * @param source Source of the bonus to remove
   */
  removeSkillBonus(entity: Entity, skillId: number, source: string): void {
    try {
      this.bonusCapability.removeBonus(entity, `skill.${skillId}`, source);
      this.log(`Removed bonus from skill ${skillId} for entity ${entity.id} from ${source}`);
    } catch (error) {
      this.error(`Failed to remove bonus from skill ${skillId}`, error);
    }
  }
  
  /**
   * Get the total available skill points for a level
   * @param entity Entity to get skill points for
   * @param level Character level
   * @returns Total available skill points
   */
  getAvailableSkillPoints(entity: Entity, level: number): number {
    // Get base skill points from character class
    let baseSkillPoints = 0;
    
    if (entity.properties.character?.game_character_class) {
      for (const charClass of entity.properties.character.game_character_class) {
        if (charClass.class && charClass.level === level) {
          baseSkillPoints += charClass.class.skill_ranks_per_level || 0;
        }
      }
    }
    
    // Add Intelligence modifier (if positive)
    let intModifier = 0;
    try {
      intModifier = this.abilityCapability.getAbilityModifier(entity, 'intelligence');
      intModifier = Math.max(0, intModifier); // Only use positive INT modifier
    } catch (error) {
      this.error('Error getting intelligence modifier', error);
    }
    
    // Add skill ranks from favored class bonuses
    let fcbSkillRanks = 0;
    if (entity.properties.character?.favoredClassBonuses?.skillRanks) {
      // Get favored class bonuses for this level
      const fcbForLevel = entity.properties.character.favoredClassChoices?.filter(
        (fcb: any) => fcb.level === level && fcb.favored_class_choice?.name === 'skill'
      ) || [];
      
      fcbSkillRanks = fcbForLevel.length;
    }
    
    return baseSkillPoints + intModifier + fcbSkillRanks;
  }
  
  /**
   * Get all invested skill points, optionally filtered by level
   * @param entity Entity to get invested skill points for
   * @param level Optional level to filter by
   * @returns Total invested skill points
   */
  getInvestedSkillPoints(entity: Entity, level?: number): number {
    // If level is provided, count ranks invested at that level
    if (level !== undefined) {
      const ranksAtLevel = entity.properties.character?.game_character_skill_rank?.filter(
        (rank: any) => rank.applied_at_level === level
      ) || [];
      
      return ranksAtLevel.length;
    }
    
    // Otherwise, count all ranks
    let totalRanks = 0;
    
    for (const skill of this.skills) {
      totalRanks += this.getSkillRanks(entity, skill.id);
    }
    
    return totalRanks;
  }
  
  /**
   * Clean up resources when shutting down
   */
  async shutdown(): Promise<void> {
    this.log('Shutting down skill capability');
  }
}