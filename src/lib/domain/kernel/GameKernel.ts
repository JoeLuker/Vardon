import { Entity, Capability, Plugin, EventEmitter, KernelOptions, PluginValidationResult } from './types';
import { EventBus } from './EventBus';

/**
 * GameKernel is the core of the system, responsible for:
 * - Managing capabilities (similar to device drivers)
 * - Executing plugins (similar to processes)
 * - Managing entities
 * - Providing an event system (similar to signals)
 * 
 * This follows Unix philosophy by providing a minimal kernel that manages
 * resources but leaves functionality to dedicated components.
 */
export class GameKernel {
  // Core components
  private readonly capabilities: Map<string, Capability> = new Map();
  private readonly entities: Map<string, Entity> = new Map();
  private readonly plugins: Map<string, Plugin> = new Map();
  
  // Configuration
  private readonly debug: boolean;
  
  // Event system
  public readonly events: EventEmitter;
  
  constructor(options: KernelOptions = {}) {
    this.debug = options.debug || false;
    this.events = options.eventEmitter || new EventBus(this.debug);
    
    if (this.debug) {
      console.log('[GameKernel] Initialized');
    }
  }
  
  //=============================================================================
  // Capability Management
  //=============================================================================
  
  /**
   * Register a capability with the kernel
   * @param id Capability ID
   * @param capability Capability implementation
   */
  registerCapability(id: string, capability: Capability): void {
    if (this.capabilities.has(id)) {
      this.log(`Replacing existing capability: ${id}`);
    }
    
    this.capabilities.set(id, capability);
    this.events.emit('capability:registered', { id });
    this.log(`Registered capability: ${id}`);
  }
  
  /**
   * Get a capability by ID
   * @param id Capability ID
   * @returns Capability or undefined if not found
   */
  getCapability<T extends Capability>(id: string): T | undefined {
    return this.capabilities.get(id) as T | undefined;
  }
  
  /**
   * Get all capability IDs
   * @returns Array of capability IDs
   */
  getCapabilityIds(): string[] {
    return Array.from(this.capabilities.keys());
  }
  
  /**
   * Check if a capability is registered
   * @param id Capability ID
   * @returns Whether the capability is registered
   */
  hasCapability(id: string): boolean {
    return this.capabilities.has(id);
  }
  
  //=============================================================================
  // Entity Management
  //=============================================================================
  
  /**
   * Register an entity with the kernel
   * @param entity Entity to register
   */
  registerEntity(entity: Entity): void {
    if (this.entities.has(entity.id)) {
      this.log(`Replacing existing entity: ${entity.id}`);
    }
    
    // Set update timestamp
    entity.metadata.updatedAt = Date.now();
    
    this.entities.set(entity.id, entity);
    this.events.emit('entity:registered', { entityId: entity.id });
    this.log(`Registered entity: ${entity.id}`);
    
    // Initialize all capabilities for this entity
    this.initializeCapabilitiesForEntity(entity);
  }
  
  /**
   * Get an entity by ID
   * @param id Entity ID
   * @returns Entity or undefined if not found
   */
  getEntity(id: string): Entity | undefined {
    return this.entities.get(id);
  }
  
  /**
   * Get all entity IDs
   * @returns Array of entity IDs
   */
  getEntityIds(): string[] {
    return Array.from(this.entities.keys());
  }
  
  /**
   * Update an entity's properties
   * @param id Entity ID
   * @param properties Properties to update
   * @returns Updated entity or undefined if not found
   */
  updateEntity(id: string, properties: Partial<Entity>): Entity | undefined {
    const entity = this.entities.get(id);
    if (!entity) {
      return undefined;
    }
    
    // Update entity properties
    const updatedEntity = {
      ...entity,
      ...properties,
      // Ensure metadata is updated
      metadata: {
        ...entity.metadata,
        updatedAt: Date.now(),
        version: entity.metadata.version + 1
      }
    };
    
    this.entities.set(id, updatedEntity);
    this.events.emit('entity:updated', { entityId: id });
    this.log(`Updated entity: ${id}`);
    
    return updatedEntity;
  }
  
  /**
   * Remove an entity
   * @param id Entity ID
   * @returns Whether the entity was removed
   */
  removeEntity(id: string): boolean {
    if (!this.entities.has(id)) {
      return false;
    }
    
    this.entities.delete(id);
    this.events.emit('entity:removed', { entityId: id });
    this.log(`Removed entity: ${id}`);
    
    return true;
  }
  
  //=============================================================================
  // Plugin Management
  //=============================================================================
  
  /**
   * Register a plugin with the kernel
   * @param plugin Plugin to register
   */
  registerPlugin(plugin: Plugin): void {
    if (this.plugins.has(plugin.id)) {
      this.log(`Replacing existing plugin: ${plugin.id}`);
    }
    
    this.plugins.set(plugin.id, plugin);
    this.events.emit('plugin:registered', { id: plugin.id });
    this.log(`Registered plugin: ${plugin.id}`);
  }
  
  /**
   * Get a plugin by ID
   * @param id Plugin ID
   * @returns Plugin or undefined if not found
   */
  getPlugin(id: string): Plugin | undefined {
    return this.plugins.get(id);
  }
  
  /**
   * Execute a plugin on an entity
   * @param pluginId Plugin ID
   * @param entityId Entity ID
   * @param options Options for plugin execution
   * @returns Result of plugin execution
   */
  async executePlugin<T>(pluginId: string, entityId: string, options: Record<string, any> = {}): Promise<T> {
    // Get plugin and entity
    const plugin = this.plugins.get(pluginId);
    const entity = this.entities.get(entityId);
    
    // Validate inputs
    if (!plugin) {
      const error = `Plugin not found: ${pluginId}`;
      this.error(error);
      this.events.emit('plugin:execution_failed', {
        pluginId,
        entityId,
        error
      });
      throw new Error(error);
    }
    
    if (!entity) {
      const error = `Entity not found: ${entityId}`;
      this.error(error);
      this.events.emit('plugin:execution_failed', {
        pluginId,
        entityId,
        error
      });
      throw new Error(error);
    }
    
    try {
      this.log(`Executing plugin: ${pluginId} for entity: ${entityId}`);
      
      // Get required capabilities
      const capabilities: Record<string, Capability> = {};
      for (const capabilityId of plugin.requiredCapabilities) {
        const capability = this.capabilities.get(capabilityId);
        if (!capability) {
          const error = `Required capability not available: ${capabilityId}`;
          this.error(error);
          this.events.emit('plugin:execution_failed', {
            pluginId,
            entityId,
            error
          });
          throw new Error(error);
        }
        capabilities[capabilityId] = capability;
      }
      
      // Check if plugin can be applied
      if (plugin.canApply) {
        const validationResult = plugin.canApply(entity, capabilities);
        if (!validationResult.valid) {
          const error = `Plugin ${pluginId} cannot be applied to entity ${entityId}: ${validationResult.reason || 'Unknown reason'}`;
          this.error(error);
          this.events.emit('plugin:execution_failed', {
            pluginId,
            entityId,
            error: validationResult.reason || 'Validation failed'
          });
          throw new Error(error);
        }
      }
      
      // Apply plugin
      const result = plugin.apply(entity, options, capabilities);
      
      // Update entity timestamp
      entity.metadata.updatedAt = Date.now();
      
      // Emit success event
      this.events.emit('plugin:executed', {
        pluginId,
        entityId,
        success: true,
        timestamp: new Date().toISOString()
      });
      
      this.log(`Successfully executed plugin: ${pluginId} for entity: ${entityId}`);
      return result as T;
    } catch (error) {
      // Log error and emit failure event
      this.error(`Error executing plugin ${pluginId} for entity ${entityId}:`, error);
      this.events.emit('plugin:execution_failed', {
        pluginId,
        entityId,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
      
      // Rethrow so caller can handle
      throw error;
    }
  }
  
  //=============================================================================
  // Utility Methods
  //=============================================================================
  
  /**
   * Initialize all capabilities for an entity
   * @param entity Entity to initialize capabilities for
   */
  private initializeCapabilitiesForEntity(entity: Entity): void {
    for (const [id, capability] of this.capabilities.entries()) {
      if (capability.initialize) {
        try {
          capability.initialize(entity);
          this.log(`Initialized capability ${id} for entity ${entity.id}`);
        } catch (error) {
          this.error(`Error initializing capability ${id} for entity ${entity.id}:`, error);
        }
      }
    }
  }
  
  /**
   * Shut down the kernel, cleaning up resources
   */
  async shutdown(): Promise<void> {
    this.log('Shutting down GameKernel');
    
    try {
      // Give capabilities a chance to clean up
      for (const [id, capability] of this.capabilities.entries()) {
        if (capability.shutdown) {
          try {
            await capability.shutdown();
            this.log(`Shut down capability: ${id}`);
          } catch (error) {
            this.error(`Error shutting down capability ${id}:`, error);
          }
        }
      }
      
      // Clear capability references
      this.capabilities.clear();
      this.log('Cleared capability references');
      
      // Clear entity references
      this.entities.clear();
      this.log('Cleared entity references');
      
      // Clear plugin references
      this.plugins.clear();
      this.log('Cleared plugin references');
      
      // Clear event listeners
      this.events.removeAllListeners();
      this.log('Cleared event listeners');
      
      this.log('GameKernel shutdown completed successfully');
    } catch (error) {
      this.error('Error during GameKernel shutdown:', error);
      throw error;
    }
  }
  
  /**
   * Log a debug message
   * @param message Message to log
   * @param data Optional data to log
   */
  private log(message: string, data?: any): void {
    if (this.debug) {
      if (data !== undefined) {
        console.log(`[GameKernel] ${message}`, data);
      } else {
        console.log(`[GameKernel] ${message}`);
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
      console.error(`[GameKernel] ${message}`, error);
    } else {
      console.error(`[GameKernel] ${message}`);
    }
  }
}