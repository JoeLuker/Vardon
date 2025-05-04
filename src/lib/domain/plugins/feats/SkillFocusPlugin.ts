/**
 * Skill Focus Plugin
 * 
 * This plugin implements the Skill Focus feat, which gives a bonus to a specific skill.
 * It demonstrates proper capability usage following Unix philosophy.
 */

import { Entity, Capability } from '../../kernel/types';
import { FeatPlugin, FeatPluginOptions } from './FeatPlugin';
import { SkillCapability } from '../../capabilities/skill/types';

/**
 * Skill Focus options
 */
export interface SkillFocusOptions extends FeatPluginOptions {
  /** Default skill ID to apply the feat to */
  defaultSkillId?: number;
}

/**
 * Options when applying Skill Focus
 */
export interface ApplySkillFocusOptions {
  /** Skill ID to apply the feat to */
  skillId: number;
}

/**
 * Implementation of the Skill Focus feat
 */
export class SkillFocusPlugin extends FeatPlugin {
  /** Plugin ID */
  public readonly id = 'skill-focus';
  
  /** Required capabilities */
  public readonly requiredCapabilities = ['skill'];
  
  /** Default skill ID */
  private readonly defaultSkillId?: number;
  
  constructor(options: SkillFocusOptions = {
    name: 'Skill Focus',
    description: 'You are particularly adept at a specific skill.',
    prerequisites: 'None.',
    benefit: 'You get a +3 bonus on all checks involving the chosen skill. If you have 10 or more ranks in that skill, this bonus increases to +6.',
    isRepeatable: true
  }) {
    super(options);
    this.defaultSkillId = options.defaultSkillId;
  }
  
  /**
   * Apply this plugin to an entity
   * @param entity Entity to apply the plugin to
   * @param options Options for how to apply the plugin
   * @param capabilities Available capabilities
   * @returns Result of applying the plugin
   */
  apply(
    entity: Entity,
    options: Partial<ApplySkillFocusOptions>,
    capabilities: Record<string, Capability>
  ): { applied: boolean; skillId: number } {
    // Get the skill capability
    const skillCapability = capabilities.skill as SkillCapability;
    if (!skillCapability) {
      throw new Error('Skill capability not available');
    }
    
    // Get the skill ID from options or default
    const skillId = options.skillId || this.defaultSkillId;
    if (skillId === undefined) {
      throw new Error('Skill ID not specified');
    }
    
    // Add the feat to the entity
    this.addFeatToEntity(entity);
    
    // Track which skill this instance of the feat applies to
    if (!entity.properties.featOptions) {
      entity.properties.featOptions = {};
    }
    if (!entity.properties.featOptions[this.id]) {
      entity.properties.featOptions[this.id] = [];
    }
    
    // Store the option for this instance
    const instanceIndex = this.getFeatCount(entity) - 1;
    entity.properties.featOptions[this.id][instanceIndex] = { skillId };
    
    // Apply the skill bonus based on ranks
    const ranks = skillCapability.getSkillRanks(entity, skillId);
    const bonusValue = ranks >= 10 ? 6 : 3;
    
    // Create a unique source identifier for this instance
    const source = `${this.id}-${instanceIndex}`;
    
    // Apply the bonus to the skill
    skillCapability.applySkillBonus(
      entity,
      skillId,
      bonusValue,
      'competence',
      source
    );
    
    this.log(`Applied Skill Focus to skill ${skillId} with a +${bonusValue} bonus for entity ${entity.id}`);
    
    return { applied: true, skillId };
  }
  
  /**
   * Remove this feat from an entity
   * @param entity Entity to remove the feat from
   * @param capabilities Available capabilities
   * @returns Result of removing the feat
   */
  remove(
    entity: Entity,
    capabilities: Record<string, Capability>
  ): { removed: boolean } {
    // Get the skill capability
    const skillCapability = capabilities.skill as SkillCapability;
    if (!skillCapability) {
      throw new Error('Skill capability not available');
    }
    
    // Get the count before removal
    const count = this.getFeatCount(entity);
    if (count === 0) {
      return { removed: false };
    }
    
    // Get the options for all instances
    const options = entity.properties.featOptions?.[this.id] || [];
    
    // Remove bonuses for all instances
    for (let i = 0; i < count; i++) {
      const option = options[i];
      if (option?.skillId) {
        // Create the same source identifier used when applying
        const source = `${this.id}-${i}`;
        
        // Remove the bonus
        skillCapability.removeSkillBonus(entity, option.skillId, source);
      }
    }
    
    // Remove the feat from the entity
    this.removeFeatFromEntity(entity);
    
    // Remove the options
    if (entity.properties.featOptions?.[this.id]) {
      delete entity.properties.featOptions[this.id];
    }
    
    this.log(`Removed Skill Focus feat from entity ${entity.id}`);
    
    return { removed: true };
  }
}