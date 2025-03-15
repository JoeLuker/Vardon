import type { Entity } from '$lib/domain/systems/SystemTypes';
import type { ValueWithBreakdown } from '$lib/domain/systems/SystemTypes';

/**
 * Capability for skill-related operations
 * This provides a focused interface for plugins to interact with skills
 */
export interface SkillCapability {
  // Calculate a skill check result
  calculateSkillCheck(
    entity: Entity, 
    skillId: number, 
    circumstanceBonus?: number
  ): ValueWithBreakdown;
  
  // Check if a skill is a class skill for the entity
  isClassSkill(entity: Entity, skillId: number): boolean;
  
  // Get ranks in a skill
  getSkillRanks(entity: Entity, skillId: number): number;
  
  // Check if entity is trained in a skill
  isTrainedIn(entity: Entity, skillId: number): boolean;
  
  // Get all skills for an entity
  getAllSkills(entity: Entity): Record<number, ValueWithBreakdown>;
  
  // Get the ability modifier used for a skill
  getSkillAbilityModifier(entity: Entity, skillId: number): string;
} 