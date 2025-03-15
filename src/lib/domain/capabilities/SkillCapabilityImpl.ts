import type { SkillCapability } from './SkillCapability';
import type { Entity } from '$lib/domain/systems/SystemTypes';
import type { ValueWithBreakdown } from '$lib/domain/systems/SystemTypes';
import type { SkillEngine } from '$lib/domain/systems/engines/SkillEngine';
import type { FeatureEffectSystem } from '$lib/domain/systems/FeatureEffectSystem';
import type { CompleteCharacter } from '$lib/db/gameRules.api';

/**
 * Implementation of SkillCapability using explicit dependencies
 */
export class SkillCapabilityImpl implements SkillCapability {
  /**
   * Constructor with explicit dependency injection
   */
  constructor(
    private skillEngine: SkillEngine,
    private featureEffectSystem: FeatureEffectSystem
  ) {}
  
  calculateSkillCheck(
    entity: Entity, 
    skillId: number, 
    circumstanceBonus: number = 0
  ): ValueWithBreakdown {
    // Get base skill calculation from skill engine
    const skillResult = this.skillEngine.calculateSkill(
      entity,
      skillId
    );
    
    // Add circumstance bonus if provided
    if (circumstanceBonus !== 0) {
      skillResult.modifiers.push({
        source: 'Circumstance',
        value: circumstanceBonus
      });
      skillResult.total += circumstanceBonus;
    }
    
    return skillResult;
  }
  
  isClassSkill(entity: Entity, skillId: number): boolean {
    const character = entity.character as CompleteCharacter;
    if (!character?.game_character_class) return false;
    
    // Check if any class has this as a class skill
    for (const charClass of character.game_character_class) {
      if (charClass.class?.class_skill) {
        for (const classSkill of charClass.class.class_skill) {
          if (classSkill.skill_id === skillId) {
            return true;
          }
        }
      }
    }
    
    // Check if there's an effect that makes this a class skill
    const effects = this.featureEffectSystem.getEffectsForTarget(`skill_${skillId}_class_skill`);
    if (effects.some(e => typeof e.value === 'boolean' && e.value === true)) {
      return true;
    }
    
    return false;
  }
  
  getSkillRanks(entity: Entity, skillId: number): number {
    const character = entity.character as CompleteCharacter;
    if (!character?.game_character_skill_rank) return 0;
    
    // Count ranks in this skill
    return character.game_character_skill_rank.filter(
      rank => rank.skill_id === skillId
    ).length;
  }
  
  isTrainedIn(entity: Entity, skillId: number): boolean {
    // Check if the character has ranks in the skill
    const hasRanks = this.getSkillRanks(entity, skillId) > 0;
    if (hasRanks) return true;
    
    // Check if the skill normally requires training
    const requiresTraining = this.skillEngine.skillRequiresTraining(skillId);
    if (!requiresTraining) return true;
    
    // Check for effects that allow untrained use
    const effects = this.featureEffectSystem.getEffectsForTarget(`skill_${skillId}_untrained`);
    return effects.some(e => typeof e.value === 'boolean' && e.value === true);
  }
  
  getAllSkills(entity: Entity): Record<number, ValueWithBreakdown> {
    return this.skillEngine.calculateAllSkills(
      entity,
      this.skillEngine.getAbilityModifiers(entity)
    );
  }
  
  getSkillAbilityModifier(entity: Entity, skillId: number): string {
    // Check for ability overrides
    const overrideEffects = this.featureEffectSystem.getEffectsForTarget(`skill_${skillId}_ability`);
    if (overrideEffects.length > 0) {
      // Sort by priority (highest first)
      const sortedEffects = [...overrideEffects].sort((a, b) => 
        (b.priority || 0) - (a.priority || 0)
      );
      
      // Get the highest priority override
      const topEffect = sortedEffects[0];
      if (typeof topEffect.value === 'string') {
        return topEffect.value;
      }
    }
    
    // Fall back to the default ability for this skill
    return this.skillEngine.getSkillDefaultAbility(skillId);
  }
} 