import type { Entity } from '../../types/EntityTypes';
import type { Feature } from '../../types/FeatureTypes';
import type { SkillSubsystem } from '../../types/SubsystemTypes';

export const SkillFocusFeature: Feature = {
  id: 'feat.skill_focus',
  name: 'Skill Focus',
  requiredSubsystems: ['skill'],
  
  apply(entity: Entity, options: { skillId: number }, subsystems: { skill: SkillSubsystem }) {
    const { skillId } = options;
    const { skill } = subsystems;
    
    // Store feat in character data
    if (!entity.character) entity.character = {};
    if (!entity.character.feats) entity.character.feats = [];
    
    entity.character.feats.push({
      id: this.id,
      name: this.name,
      options: { skillId }
    });
    
    // Would normally modify skill bonus calculation
    // This would be handled through a bonus system in a full implementation
    
    return { 
      success: true,
      skill
    };
  }
};
