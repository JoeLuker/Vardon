/**
 * Feature Plugin Adapter
 * 
 * This module provides an adapter for legacy features to work with the new plugin system.
 * It follows the Adapter pattern to bridge between two different interfaces.
 */

import type { Entity, Capability, PluginValidationResult } from '../../kernel/types';
import { BasePlugin } from '../BasePlugin';
import type { BasePluginOptions } from '../BasePlugin';
import type { Feature } from '../../types/FeatureTypes';
import type { AbilityCapability } from '../../capabilities/ability/types';
import type { BonusCapability } from '../../capabilities/bonus/types';
import type { SkillCapability } from '../../capabilities/skill/types';

/**
 * Options for the feature plugin adapter
 */
export interface FeaturePluginAdapterOptions extends BasePluginOptions {
  /** Original feature being adapted */
  feature: Feature;
  
  /** Optional plugin ID override */
  pluginId?: string;
}

/**
 * Adapter for legacy features to work with the new plugin system
 */
export class FeaturePluginAdapter extends BasePlugin {
  /** Original feature being adapted */
  private readonly feature: Feature;
  
  /** Plugin ID (based on feature ID) */
  public readonly id: string;
  
  /** Required capabilities (mapped from required subsystems) */
  public readonly requiredCapabilities: string[];
  
  constructor(options: FeaturePluginAdapterOptions) {
    super(options);
    
    this.feature = options.feature;
    
    // Use provided plugin ID or generate from feature ID
    this.id = options.pluginId || this.normalizeFeatureId(this.feature.id);
    
    // Map subsystems to capabilities
    this.requiredCapabilities = this.mapSubsystemsToCapabilities(
      this.feature.requiredSubsystems || []
    );
  }
  
  /**
   * Normalize feature ID to plugin ID format
   * @param featureId Feature ID to normalize
   * @returns Normalized plugin ID
   */
  private normalizeFeatureId(featureId: string): string {
    // Remove common prefixes like 'feat.', 'class.', etc.
    return featureId.replace(/^(feat|class|spell|corruption)\./, '');
  }
  
  /**
   * Map subsystem IDs to capability IDs
   * @param subsystemIds Subsystem IDs to map
   * @returns Capability IDs
   */
  private mapSubsystemsToCapabilities(subsystemIds: string[]): string[] {
    const map: Record<string, string> = {
      'ability': 'ability',
      'bonus': 'bonus',
      'skill': 'skill',
      'combat': 'combat',
      'condition': 'condition',
      'spellcasting': 'spellcasting',
      'prerequisite': 'prerequisite'
    };
    
    return subsystemIds.map(id => map[id] || id);
  }
  
  /**
   * Validate if the plugin can be applied to an entity
   * @param entity Entity to validate against
   * @param capabilities Available capabilities
   * @returns Validation result
   */
  canApply(entity: Entity, capabilities: Record<string, Capability>): PluginValidationResult {
    // First check if all required capabilities are available
    const baseValidation = super.canApply(entity, capabilities);
    if (!baseValidation.valid) {
      return baseValidation;
    }
    
    // Then delegate to the original feature's canApply method if it exists
    if (this.feature.canApply) {
      try {
        // Convert capabilities to subsystems for the legacy feature
        const subsystems = this.convertCapabilitiesToSubsystems(capabilities);
        
        // Call the original feature's canApply method
        return this.feature.canApply(entity, subsystems);
      } catch (error) {
        this.error('Error in canApply:', error);
        return { valid: false, reason: `Error in feature validation: ${error.message}` };
      }
    }
    
    // By default, assume it can be applied
    return { valid: true };
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
    options: Record<string, any>, 
    capabilities: Record<string, Capability>
  ): any {
    this.log(`Applying legacy feature: ${this.feature.id}`);
    
    try {
      // Convert capabilities to subsystems for the legacy feature
      const subsystems = this.convertCapabilitiesToSubsystems(capabilities);
      
      // Call the original feature's apply method
      const result = this.feature.apply(entity, options, subsystems);
      
      // Mark the entity as having this plugin applied
      this.markPluginApplied(entity);
      
      return result;
    } catch (error) {
      this.error(`Error applying feature ${this.feature.id}:`, error);
      throw error;
    }
  }
  
  /**
   * Remove this plugin from an entity
   * @param entity Entity to remove the plugin from
   * @param capabilities Available capabilities
   * @returns Result of removing the plugin
   */
  remove(
    entity: Entity,
    capabilities: Record<string, Capability>
  ): any {
    if (!this.feature.unapply) {
      return { success: false, reason: 'Feature does not support removal' };
    }
    
    this.log(`Removing legacy feature: ${this.feature.id}`);
    
    try {
      // Convert capabilities to subsystems for the legacy feature
      const subsystems = this.convertCapabilitiesToSubsystems(capabilities);
      
      // Call the original feature's unapply method
      const result = this.feature.unapply(entity, {}, subsystems);
      
      // Mark the entity as no longer having this plugin applied
      this.markPluginRemoved(entity);
      
      return result;
    } catch (error) {
      this.error(`Error removing feature ${this.feature.id}:`, error);
      throw error;
    }
  }
  
  /**
   * Mark the plugin as applied to an entity
   * @param entity Entity to mark
   */
  private markPluginApplied(entity: Entity): void {
    // Create appliedPlugins array if it doesn't exist
    if (!entity.properties.appliedPlugins) {
      entity.properties.appliedPlugins = [];
    }
    
    // Add plugin ID if not already applied
    if (!entity.properties.appliedPlugins.includes(this.id)) {
      entity.properties.appliedPlugins.push(this.id);
    }
  }
  
  /**
   * Mark the plugin as removed from an entity
   * @param entity Entity to mark
   */
  private markPluginRemoved(entity: Entity): void {
    // Return if no appliedPlugins array
    if (!entity.properties.appliedPlugins) {
      return;
    }
    
    // Remove plugin ID
    entity.properties.appliedPlugins = entity.properties.appliedPlugins.filter(
      (id: string) => id !== this.id
    );
  }
  
  /**
   * Convert capabilities to subsystems for legacy features
   * @param capabilities Capabilities
   * @returns Subsystems compatible with legacy features
   */
  private convertCapabilitiesToSubsystems(capabilities: Record<string, Capability>): Record<string, any> {
    const subsystems: Record<string, any> = {};
    
    // Convert capabilities to subsystems
    if (capabilities.ability) {
      const ability = capabilities.ability as AbilityCapability;
      subsystems.ability = ability;
    }
    
    if (capabilities.bonus) {
      const bonus = capabilities.bonus as BonusCapability;
      subsystems.bonus = bonus;
    }
    
    if (capabilities.skill) {
      const skill = capabilities.skill as SkillCapability;
      subsystems.skill = skill;
    }
    
    // TODO: Add more subsystem conversions as needed
    
    return subsystems;
  }
}