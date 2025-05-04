/**
 * Plugin Manager
 * 
 * This module implements the plugin manager, which is responsible for
 * registering, loading, and executing plugins.
 * 
 * It follows Unix philosophy by:
 * 1. Keeping a clean interface to plugins
 * 2. Managing dependencies between plugins and capabilities
 * 3. Providing a standard way to register and execute plugins
 */

import { Entity, Plugin, Capability, PluginValidationResult } from '../kernel/types';
import { PluginMetadata } from './types';

/**
 * Options for the plugin manager
 */
export interface PluginManagerOptions {
  /** Whether to enable debug logging */
  debug?: boolean;
}

/**
 * Implementation of the plugin manager
 */
export class PluginManager {
  /** Whether debug logging is enabled */
  private readonly debug: boolean;
  
  /** Map of registered plugins by ID */
  private readonly plugins: Map<string, Plugin> = new Map();
  
  /** Map of registered capabilities by ID */
  private readonly capabilities: Map<string, Capability> = new Map();
  
  constructor(options: PluginManagerOptions = {}) {
    this.debug = options.debug || false;
  }
  
  /**
   * Register a plugin
   * @param plugin Plugin to register
   */
  registerPlugin(plugin: Plugin): void {
    if (this.plugins.has(plugin.id)) {
      this.error(`Plugin with ID ${plugin.id} is already registered`);
      return;
    }
    
    this.plugins.set(plugin.id, plugin);
    this.log(`Registered plugin: ${plugin.id} (${plugin.name})`);
  }
  
  /**
   * Register a capability
   * @param capability Capability to register
   */
  registerCapability(capability: Capability): void {
    if (this.capabilities.has(capability.id)) {
      this.error(`Capability with ID ${capability.id} is already registered`);
      return;
    }
    
    this.capabilities.set(capability.id, capability);
    this.log(`Registered capability: ${capability.id} (${capability.version})`);
  }
  
  /**
   * Get a plugin by ID
   * @param pluginId Plugin ID
   * @returns Plugin instance or undefined if not found
   */
  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }
  
  /**
   * Get a capability by ID
   * @param capabilityId Capability ID
   * @returns Capability instance or undefined if not found
   */
  getCapability(capabilityId: string): Capability | undefined {
    return this.capabilities.get(capabilityId);
  }
  
  /**
   * Check if a plugin is registered
   * @param pluginId Plugin ID
   * @returns Whether the plugin is registered
   */
  hasPlugin(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }
  
  /**
   * Check if a capability is registered
   * @param capabilityId Capability ID
   * @returns Whether the capability is registered
   */
  hasCapability(capabilityId: string): boolean {
    return this.capabilities.has(capabilityId);
  }
  
  /**
   * Get metadata for all registered plugins
   * @returns Array of plugin metadata
   */
  getAllPluginMetadata(): PluginMetadata[] {
    return Array.from(this.plugins.values()).map(plugin => ({
      id: plugin.id,
      name: plugin.name,
      description: plugin.description,
      requiredCapabilities: plugin.requiredCapabilities,
      version: (plugin as any).version || '1.0.0',
      author: (plugin as any).author
    }));
  }
  
  /**
   * Get all registered plugins
   * @returns Array of all registered plugins
   */
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }
  
  /**
   * Get all registered capabilities
   * @returns Array of all registered capabilities
   */
  getAllCapabilities(): Capability[] {
    return Array.from(this.capabilities.values());
  }
  
  /**
   * Get plugins that require a capability
   * @param capabilityId Capability ID
   * @returns Array of plugins that require this capability
   */
  getPluginsByCapability(capabilityId: string): Plugin[] {
    return this.getAllPlugins().filter(plugin => 
      plugin.requiredCapabilities.includes(capabilityId)
    );
  }
  
  /**
   * Initialize an entity with all capabilities
   * @param entity Entity to initialize
   */
  initializeEntity(entity: Entity): void {
    for (const capability of this.capabilities.values()) {
      try {
        capability.initialize?.(entity);
      } catch (error) {
        this.error(`Error initializing capability ${capability.id} for entity ${entity.id}`, error);
      }
    }
    
    this.log(`Initialized entity: ${entity.id}`);
  }
  
  /**
   * Check if a plugin can be applied to an entity
   * @param entity Entity to check
   * @param pluginId Plugin ID
   * @returns Validation result
   */
  canApplyPlugin(entity: Entity, pluginId: string): PluginValidationResult {
    const plugin = this.getPlugin(pluginId);
    if (!plugin) {
      return { valid: false, reason: `Plugin not found: ${pluginId}` };
    }
    
    // Check if required capabilities are available
    for (const capabilityId of plugin.requiredCapabilities) {
      if (!this.hasCapability(capabilityId)) {
        return { 
          valid: false,
          reason: `Missing required capability: ${capabilityId}`
        };
      }
    }
    
    // Get required capabilities
    const requiredCapabilities: Record<string, Capability> = {};
    for (const capabilityId of plugin.requiredCapabilities) {
      const capability = this.getCapability(capabilityId);
      if (capability) {
        requiredCapabilities[capabilityId] = capability;
      }
    }
    
    // Ask plugin if it can be applied
    if (plugin.canApply) {
      return plugin.canApply(entity, requiredCapabilities);
    }
    
    // By default, plugins can be applied if all required capabilities are available
    return { valid: true };
  }
  
  /**
   * Apply a plugin to an entity
   * @param entity Entity to apply the plugin to
   * @param pluginId Plugin ID
   * @param options Options for how to apply the plugin
   * @returns Result of applying the plugin
   */
  applyPlugin(entity: Entity, pluginId: string, options: Record<string, any> = {}): any {
    const plugin = this.getPlugin(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }
    
    // Validate if plugin can be applied
    const validation = this.canApplyPlugin(entity, pluginId);
    if (!validation.valid) {
      throw new Error(`Cannot apply plugin ${pluginId}: ${validation.reason}`);
    }
    
    // Get required capabilities
    const requiredCapabilities: Record<string, Capability> = {};
    for (const capabilityId of plugin.requiredCapabilities) {
      const capability = this.getCapability(capabilityId);
      if (capability) {
        requiredCapabilities[capabilityId] = capability;
      }
    }
    
    // Apply the plugin
    this.log(`Applying plugin ${pluginId} to entity ${entity.id}`);
    try {
      const result = plugin.apply(entity, options, requiredCapabilities);
      
      // Update entity timestamp
      entity.metadata.updatedAt = Date.now();
      
      return result;
    } catch (error) {
      this.error(`Error applying plugin ${pluginId} to entity ${entity.id}`, error);
      throw error;
    }
  }
  
  /**
   * Shutdown all capabilities
   */
  async shutdown(): Promise<void> {
    for (const capability of this.capabilities.values()) {
      try {
        await capability.shutdown?.();
      } catch (error) {
        this.error(`Error shutting down capability ${capability.id}`, error);
      }
    }
    
    this.log('Plugin manager shut down');
  }
  
  /**
   * Log a debug message
   * @param message Message to log
   * @param data Optional data to log
   */
  private log(message: string, data?: any): void {
    if (this.debug) {
      if (data !== undefined) {
        console.log(`[PluginManager] ${message}`, data);
      } else {
        console.log(`[PluginManager] ${message}`);
      }
    }
  }
  
  /**
   * Log an error message
   * @param message Error message
   * @param error Optional error object
   */
  private error(message: string, error?: any): void {
    if (error !== undefined) {
      console.error(`[PluginManager] ${message}`, error);
    } else {
      console.error(`[PluginManager] ${message}`);
    }
  }
}