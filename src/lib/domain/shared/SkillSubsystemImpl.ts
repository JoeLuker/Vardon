import type { Entity } from '../types/EntityTypes';
import type { SkillSubsystem } from '../types/SubsystemTypes';

export class SkillSubsystemImpl implements SkillSubsystem {
  id = 'skill';
  version = '1.0.0';
  
  private skillData: any;
  
  constructor(gameData: any) {
    this.skillData = gameData.skills || [];
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
}
