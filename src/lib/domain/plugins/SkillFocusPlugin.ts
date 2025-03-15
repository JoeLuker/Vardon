import type { Entity } from '$lib/domain/systems/SystemTypes';
import type { SkillCapability } from '$lib/domain/capabilities/SkillCapability';

/**
 * Plugin for Skill Focus feat
 */
export const SkillFocusPlugin = {
  id: 'feat_skill_focus',
  name: 'Skill Focus',
  
  // Explicitly request the skill capability
  requiredCapabilities: ['skill'],
  
  // Data-driven effects for most cases
  effects: [
    // These would be added dynamically based on the chosen skill
  ],
  
  // Activate the plugin with explicit capabilities
  onActivate(entity: Entity, skillId: number, capabilities: { skill: SkillCapability }) {
    // Get the skill capability
    const skillCapability = capabilities.skill;
    
    // Check if entity has ranks in the skill
    const ranks = skillCapability.getSkillRanks(entity, skillId);
    
    // Skill Focus gives +3 bonus, or +6 if you have 10+ ranks
    const bonusValue = ranks >= 10 ? 6 : 3;
    
    // Log the action
    console.log(`Skill Focus active: +${bonusValue} to skill ${skillId} for entity ${entity.id}`);
    
    // Return bonus info (could be used by caller)
    return {
      skillId,
      bonus: bonusValue
    };
  }
}; 