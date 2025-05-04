/**
 * Feature to Plugin Migrator
 * 
 * This utility helps migrate existing features to the new plugin system.
 * It follows the Unix philosophy by converting between well-defined interfaces.
 */

import { Feature } from '../../types/FeatureTypes';
import { Plugin, Entity, Capability } from '../../kernel/types';
import { BasePlugin, BasePluginOptions } from '../BasePlugin';

/**
 * Options for the feature to plugin migrator
 */
export interface FeatureToPluginMigratorOptions {
  /** Whether to enable debug logging */
  debug?: boolean;
}

/**
 * Utility for migrating features to plugins
 */
export class FeatureToPluginMigrator {
  /** Whether debug logging is enabled */
  private readonly debug: boolean;
  
  constructor(options: FeatureToPluginMigratorOptions = {}) {
    this.debug = options.debug || false;
  }
  
  /**
   * Migrate a feature to a plugin
   * @param feature Feature to migrate
   * @returns Migrated plugin
   */
  migrateFeature(feature: Feature): Plugin {
    this.log(`Migrating feature: ${feature.id}`);
    
    // Create a wrapper plugin
    return new FeaturePluginWrapper(feature, { 
      name: feature.name, 
      description: feature.description,
      debug: this.debug
    });
  }
  
  /**
   * Migrate multiple features to plugins
   * @param features Features to migrate
   * @returns Migrated plugins
   */
  migrateFeatures(features: Feature[]): Plugin[] {
    return features.map(feature => this.migrateFeature(feature));
  }
  
  /**
   * Get a mapping of subsystem IDs to capability IDs
   * This helps translate between old subsystem requirements and new capability requirements
   */
  private static getSubsystemToCapabilityMap(): Record<string, string> {
    return {
      'ability': 'ability',
      'bonus': 'bonus',
      'skill': 'skill',
      'combat': 'combat',
      'condition': 'condition',
      'spellcasting': 'spellcasting',
      'prerequisite': 'prerequisite'
    };
  }
  
  /**
   * Map subsystem IDs to capability IDs
   * @param subsystemIds Subsystem IDs to map
   * @returns Capability IDs
   */
  static mapSubsystemsToCapabilities(subsystemIds: string[]): string[] {
    const map = FeatureToPluginMigrator.getSubsystemToCapabilityMap();
    return subsystemIds.map(id => map[id] || id);
  }
  
  /**
   * Log a debug message
   * @param message Message to log
   * @param data Optional data to log
   */
  private log(message: string, data?: any): void {
    if (this.debug) {
      if (data !== undefined) {
        console.log(`[FeatureToPluginMigrator] ${message}`, data);
      } else {
        console.log(`[FeatureToPluginMigrator] ${message}`);
      }
    }
  }
}

/**
 * Wrapper for legacy features to make them compatible with the new plugin system
 */
class FeaturePluginWrapper extends BasePlugin {
  /** Original feature being wrapped */
  private readonly feature: Feature;
  
  /** Generate plugin ID from feature ID */
  public readonly id: string;
  
  /** Map required subsystems to required capabilities */
  public readonly requiredCapabilities: string[];
  
  constructor(feature: Feature, options: BasePluginOptions) {
    super(options);
    this.feature = feature;
    
    // Convert feature ID to plugin ID by stripping prefixes
    this.id = feature.id.replace(/^(feat|class|spell)\./, '');
    
    // Map subsystems to capabilities
    this.requiredCapabilities = FeatureToPluginMigrator.mapSubsystemsToCapabilities(
      feature.requiredSubsystems || []
    );
  }
  
  /**
   * Validate if the plugin can be applied to an entity
   * @param entity Entity to validate against
   * @param capabilities Available capabilities
   * @returns Validation result
   */
  canApply(entity: Entity, capabilities: Record<string, Capability>) {
    // First check if all required capabilities are available
    const baseValidation = super.canApply(entity, capabilities);
    if (!baseValidation.valid) {
      return baseValidation;
    }
    
    // Then delegate to the original feature's canApply method if it exists
    if (this.feature.canApply) {
      // Convert capabilities back to subsystems for the legacy feature
      const subsystems = this.convertCapabilitiesToSubsystems(capabilities);
      
      return this.feature.canApply(entity, subsystems);
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
    
    // Convert capabilities back to subsystems for the legacy feature
    const subsystems = this.convertCapabilitiesToSubsystems(capabilities);
    
    // Call the original feature's apply method
    return this.feature.apply(entity, options, subsystems);
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
    
    // Convert capabilities back to subsystems for the legacy feature
    const subsystems = this.convertCapabilitiesToSubsystems(capabilities);
    
    // Call the original feature's unapply method
    return this.feature.unapply(entity, {}, subsystems);
  }
  
  /**
   * Convert capabilities to subsystems for legacy features
   * @param capabilities Capabilities
   * @returns Subsystems compatible with legacy features
   */
  private convertCapabilitiesToSubsystems(capabilities: Record<string, Capability>): Record<string, any> {
    const subsystems: Record<string, any> = {};
    
    // Map each capability to a subsystem with the same interface
    for (const [id, capability] of Object.entries(capabilities)) {
      subsystems[id] = capability;
    }
    
    return subsystems;
  }
}