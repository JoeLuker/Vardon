import type { Entity } from '../../types/EntityTypes';
import type { Feature } from '../../types/FeatureTypes';
import type { SkillSubsystem, BonusSubsystem } from '../../types/SubsystemTypes';

// Helper function to check if character already has Skill Focus for a specific skill
function hasSkillFocusForSkill(entity: Entity, skillId: number, featureId: string): boolean {
  if (!entity.character?.feats) return false;
  
  return entity.character.feats.some(feat => 
    feat.id === featureId && 
    feat.options?.skillId === skillId
  );
}

export const SkillFocusFeature: Feature = {
  id: 'feat.skill_focus',
  name: 'Skill Focus',
  requiredSubsystems: ['skill', 'bonus'],
  description: 'You get a +3 bonus on all checks involving the chosen skill. If you have 10 or more ranks in that skill, this bonus increases to +6.',
  category: 'general',
  persistent: true,
  
  apply(entity: Entity, options: { skillId: number }, subsystems: { skill: SkillSubsystem, bonus: BonusSubsystem }) {
    const { skillId } = options;
    const { skill, bonus } = subsystems;
    
    // Validate that a skill ID was provided
    if (skillId === undefined) {
      throw new Error('Skill Focus feat requires a skill selection');
    }
    
    // Check for duplicate feat using a locally-defined helper
    if (hasSkillFocusForSkill(entity, skillId, this.id)) {
      throw new Error(`Character already has Skill Focus for skill ID ${skillId}`);
    }
    
    // Store feat in character data
    if (!entity.character) entity.character = {};
    if (!entity.character.feats) entity.character.feats = [];
    
    entity.character.feats.push({
      id: this.id,
      name: this.name,
      options: { skillId }
    });
    
    // Get the current ranks in the skill
    const ranks = skill.getSkillRanks(entity, skillId);
    
    // Apply the appropriate bonus based on ranks
    // +3 for less than 10 ranks, +6 for 10+ ranks
    const bonusValue = ranks >= 10 ? 6 : 3;
    
    // Apply the bonus through the bonus subsystem
    bonus.addBonus(
      entity,
      `skill.${skillId}`,
      bonusValue,
      'untyped',
      'Skill Focus'
    );
    
    return { 
      success: true,
      skillId,
      bonusApplied: bonusValue
    };
  },
  
  unapply(entity: Entity, options: { skillId: number }, subsystems: { bonus: BonusSubsystem }) {
    const { skillId } = options;
    const { bonus } = subsystems;
    
    // Remove the skill focus bonus
    bonus.removeBonus(entity, `skill.${skillId}`, 'Skill Focus');
    
    return {
      success: true
    };
  }
};
