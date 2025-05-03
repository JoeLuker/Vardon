import type { Entity } from '../types/EntityTypes';
import type { SkillSubsystem, SkillBreakdown } from '../types/SubsystemTypes';

export class SkillSubsystemImpl implements SkillSubsystem {
  id = 'skill';
  version = '1.0.0';
  
  private skillData: any;
  
  private abilitySubsystem: any;
  private bonusSubsystem: any;
  
  constructor(gameData: any, abilitySubsystem?: any, bonusSubsystem?: any) {
    this.skillData = gameData.skills || [];
    this.abilitySubsystem = abilitySubsystem;
    this.bonusSubsystem = bonusSubsystem;
  }
  
  /**
   * Initialize skills from character data
   */
  initialize(entity: Entity): void {
    if (!entity.character) return;
    
    // Initialize skill ranks from character data
    if (entity.character.game_character_skill_rank) {
      for (const skillRank of entity.character.game_character_skill_rank) {
        const skillId = skillRank.skill_id;
        if (!skillId) continue;
        
        // Get current ranks and increment by 1 for each rank entry
        // (each entry represents 1 rank in most Pathfinder implementations)
        const currentRanks = this.getSkillRanks(entity, skillId);
        this.setSkillRanks(entity, skillId, currentRanks + 1);
      }
    }
    
    // Initialize class skills from character data
    // This assumes class skills are stored in character classes
    if (entity.character.game_character_class) {
      for (const charClass of entity.character.game_character_class) {
        if (!charClass.class) continue;
        
        // Class skills would typically be in a class_skill table
        // For now, we'll just use placeholder data
        // In a real implementation, you'd fetch this from the database
        const classSkills = []; // This would contain skill IDs for this class
        
        for (const skillId of classSkills) {
          this.setClassSkill(entity, skillId, true);
        }
      }
    }
  }
  
  getSkillRanks(entity: Entity, skillId: number): number {
    const character = entity.character || {};
    const skills = character.skills || {};
    return skills[skillId]?.ranks || 0;
  }
  
  setSkillRanks(entity: Entity, skillId: number, ranks: number): void {
    if (!entity.character) entity.character = {};
    if (!entity.character.skills) entity.character.skills = {};
    
    entity.character.skills[skillId] = {
      ...entity.character.skills[skillId],
      ranks
    };
    
    entity.metadata.updatedAt = Date.now();
  }
  
  getSkillBonus(entity: Entity, skillId: number): number {
    const ranks = this.getSkillRanks(entity, skillId);
    const skill = this.skillData.find((s: any) => s.id === skillId);
    if (!skill) return ranks;
    
    // Basic implementation - would need to add ability modifiers and other bonuses
    const classSkillBonus = this.isClassSkill(entity, skillId) && ranks > 0 ? 3 : 0;
    
    return ranks + classSkillBonus;
  }
  
  isClassSkill(entity: Entity, skillId: number): boolean {
    const character = entity.character || {};
    const classSkills = character.classSkills || [];
    return classSkills.includes(skillId);
  }

  setClassSkill(entity: Entity, skillId: number, isClassSkill: boolean): void {
    if (!entity.character) entity.character = {};
    if (!entity.character.classSkills) entity.character.classSkills = [];
    
    if (isClassSkill && !this.isClassSkill(entity, skillId)) {
      entity.character.classSkills.push(skillId);
    } else if (!isClassSkill && this.isClassSkill(entity, skillId)) {
      entity.character.classSkills = entity.character.classSkills.filter(id => id !== skillId);
    }
    
    entity.metadata.updatedAt = Date.now();
  }
  
  getSkillBreakdown(entity: Entity, skillId: number): SkillBreakdown {
    const ranks = this.getSkillRanks(entity, skillId);
    const skill = this.skillData.find((s: any) => s.id === skillId);
    const skillName = skill?.name || `Skill ${skillId}`;
    const isClassSkill = this.isClassSkill(entity, skillId);
    const classSkillBonus = isClassSkill && ranks > 0 ? 3 : 0;
    
    // Get the ability associated with this skill
    const abilityType = skill?.ability?.name?.toLowerCase() || 'dexterity';
    
    // Get the ability modifier from the ability subsystem
    let abilityModifier = 0;
    if (this.abilitySubsystem) {
      abilityModifier = this.abilitySubsystem.getAbilityModifier(entity, abilityType);
    }
    
    // Get any additional bonuses from the bonus subsystem
    let otherBonuses = {
      total: 0,
      base: 0,
      components: []
    };
    
    if (this.bonusSubsystem) {
      otherBonuses = this.bonusSubsystem.getBreakdown(entity, `skill.${skillId}`);
    }
    
    // Calculate the total skill bonus
    const total = ranks + classSkillBonus + abilityModifier + otherBonuses.total;
    
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
      isTrainedOnly: skill?.trainedOnly || false,
      canUseUntrained: !skill?.trainedOnly,
      armorCheckPenalty: 0 // Would be calculated from armor
    };
  }
  
  getAllSkills(entity: Entity): Record<number, SkillBreakdown> {
    const result: Record<number, SkillBreakdown> = {};
    
    // Create breakdown for all skills in the game data
    for (const skill of this.skillData) {
      result[skill.id] = this.getSkillBreakdown(entity, skill.id);
    }
    
    return result;
  }
  
  getAvailableSkillPoints(entity: Entity, level: number): number {
    // Placeholder implementation - would depend on character class, intelligence, etc.
    return 0;
  }
  
  getInvestedSkillPoints(entity: Entity, level?: number): number {
    // Placeholder implementation - would calculate total skill points spent
    return 0;
  }
}
