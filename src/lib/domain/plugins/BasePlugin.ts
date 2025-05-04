/**
 * Base Plugin
 * 
 * This module provides a base implementation for plugins.
 * It handles common functionality like logging and basic validation.
 */

import { Entity, Plugin, Capability, PluginValidationResult } from '../kernel/types';

/**
 * Base plugin options
 */
export interface BasePluginOptions {
  /** Human-readable name */
  name: string;
  
  /** Description */
  description?: string;
  
  /** Whether to enable debug logging */
  debug?: boolean;
  
  /** Plugin version */
  version?: string;
  
  /** Plugin author */
  author?: string;
}

/**
 * Base plugin implementation
 */
export abstract class BasePlugin implements Plugin {
  /** Unique identifier for this plugin */
  public abstract readonly id: string;
  
  /** Human-readable name of this plugin */
  public readonly name: string;
  
  /** Description of what this plugin does */
  public readonly description?: string;
  
  /** List of capability IDs this plugin requires */
  public abstract readonly requiredCapabilities: string[];
  
  /** Whether debug logging is enabled */
  protected readonly debug: boolean;
  
  /** Plugin version */
  public readonly version: string;
  
  /** Plugin author */
  public readonly author?: string;
  
  constructor(options: BasePluginOptions) {
    this.name = options.name;
    this.description = options.description;
    this.debug = options.debug || false;
    this.version = options.version || '1.0.0';
    this.author = options.author;
  }
  
  /**
   * Optional method to validate if the plugin can be applied
   * @param entity The entity to validate against
   * @param capabilities The capabilities available to this plugin
   * @returns Validation result with status and optional reason
   */
  canApply(entity: Entity, capabilities: Record<string, Capability>): PluginValidationResult {
    // Check if all required capabilities are available
    for (const capabilityId of this.requiredCapabilities) {
      if (!capabilities[capabilityId]) {
        return { 
          valid: false, 
          reason: `Missing required capability: ${capabilityId}` 
        };
      }
    }
    
    // Check entity-specific requirements
    return this.validateEntity(entity, capabilities);
  }
  
  /**
   * Validate entity-specific requirements
   * Override this method to implement custom validation
   * @param entity The entity to validate
   * @param capabilities The capabilities available to this plugin
   * @returns Validation result
   */
  protected validateEntity(
    entity: Entity, 
    capabilities: Record<string, Capability>
  ): PluginValidationResult {
    // By default, plugins can be applied if all required capabilities are available
    return { valid: true };
  }
  
  /**
   * Apply this plugin to an entity
   * @param entity The entity to apply the plugin to
   * @param options Options for how to apply the plugin
   * @param capabilities The capabilities available to this plugin
   * @returns Result of applying the plugin
   */
  abstract apply(
    entity: Entity, 
    options: Record<string, any>, 
    capabilities: Record<string, Capability>
  ): any;
  
  /**
   * Log a debug message
   * @param message Message to log
   * @param data Optional data to log
   */
  protected log(message: string, data?: any): void {
    if (this.debug) {
      if (data !== undefined) {
        console.log(`[${this.id}] ${message}`, data);
      } else {
        console.log(`[${this.id}] ${message}`);
      }
    }
  }
  
  /**
   * Log an error message
   * @param message Error message
   * @param error Optional error object
   */
  protected error(message: string, error?: any): void {
    if (error !== undefined) {
      console.error(`[${this.id}] ${message}`, error);
    } else {
      console.error(`[${this.id}] ${message}`);
    }
  }
}