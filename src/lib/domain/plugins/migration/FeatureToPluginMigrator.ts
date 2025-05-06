/**
 * Feature to Plugin Migrator
 * 
 * This utility helps migrate existing features to the new plugin system.
 * It follows the Unix philosophy by converting between well-defined interfaces.
 */

import type { Feature } from '../../types/FeatureTypes';
import type { Plugin } from '../../kernel/types';
import { FeaturePluginAdapter } from './FeaturePluginAdapter';

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
   * @param pluginId Optional plugin ID override
   * @returns Migrated plugin
   */
  migrateFeature(feature: Feature, pluginId?: string): Plugin {
    this.log(`Migrating feature: ${feature.id}`);
    
    // Create an adapter to wrap the feature
    return new FeaturePluginAdapter({
      feature,
      pluginId,
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