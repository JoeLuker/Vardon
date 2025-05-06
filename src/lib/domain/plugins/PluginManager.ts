/**
 * Plugin Manager
 * 
 * This module implements the plugin manager, which manages processes (plugins)
 * in our Unix-like system. It is responsible for:
 * 
 * 1. Registering executable plugins (like /bin directory in Unix)
 * 2. Orchestrating plugin execution (like init/systemd in Unix)
 * 3. Managing plugin dependencies on devices (like checking device availability)
 * 
 * The plugin manager delegates actual file access to the kernel.
 */

import type { 
  Entity, 
  Plugin, 
  Capability, 
  OpenMode,
  ErrorCode
} from '../kernel/types';
import type { PluginMetadata } from './types';
import { GameKernel } from '../kernel/GameKernel';

/**
 * Options for the plugin manager
 */
export interface PluginManagerOptions {
  /** Whether to enable debug logging */
  debug?: boolean;
  
  /** Required reference to the GameKernel */
  kernel: GameKernel;
}

/**
 * Implementation of the plugin manager (similar to Unix process manager)
 */
export class PluginManager {
  /** Whether debug logging is enabled */
  private readonly debug: boolean;
  
  /** Map of registered plugins by ID (like executables in /bin) */
  private readonly plugins: Map<string, Plugin> = new Map();
  
  /** Reference to the kernel for file operations */
  private readonly kernel: GameKernel;
  
  /** Map of open file descriptors by path */
  private readonly openFiles: Map<string, number> = new Map();
  
  constructor(options: PluginManagerOptions) {
    this.debug = options.debug || false;
    
    if (!options.kernel) {
      throw new Error('PluginManager requires a GameKernel instance');
    }
    
    this.kernel = options.kernel;
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
   * Get a plugin by ID
   * @param pluginId Plugin ID
   * @returns Plugin instance or undefined if not found
   */
  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
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
   * Check if a device (capability) is mounted at the specified path
   * @param devicePath Device path
   * @returns Whether the device exists
   */
  hasDevice(devicePath: string): boolean {
    return this.kernel.exists(devicePath);
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
      requiredDevices: plugin.requiredDevices,
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
   * Get all mounted devices (capabilities)
   * @returns Array of device paths
   */
  getAllDevicePaths(): string[] {
    // Get all paths in /dev directory
    return this.kernel.getCapabilityIds().map(id => `/dev/${id}`);
  }
  
  /**
   * Get plugins that require a specific device
   * @param devicePath Device path
   * @returns Array of plugins that require this device
   */
  getPluginsByDevice(devicePath: string): Plugin[] {
    return this.getAllPlugins().filter(plugin => 
      plugin.requiredDevices.includes(devicePath)
    );
  }
  
  /**
   * Check required devices for a plugin
   * @param pluginId Plugin ID
   * @returns Array of missing device paths, empty if all available
   */
  checkRequiredDevices(pluginId: string): string[] {
    const plugin = this.getPlugin(pluginId);
    if (!plugin) {
      return [`Plugin not found: ${pluginId}`];
    }
    
    // Check if required devices are available
    const missingDevices: string[] = [];
    for (const devicePath of plugin.requiredDevices) {
      if (!this.hasDevice(devicePath)) {
        missingDevices.push(devicePath);
      }
    }
    
    return missingDevices;
  }
  
  /**
   * Execute a plugin on an entity
   * @param entityId Entity ID
   * @param pluginId Plugin ID
   * @param options Options for plugin execution
   * @returns Result of execution
   */
  async executePlugin(entityId: string, pluginId: string, options: Record<string, any> = {}): Promise<any> {
    const plugin = this.getPlugin(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }
    
    // Check required devices
    const missingDevices = this.checkRequiredDevices(pluginId);
    if (missingDevices.length > 0) {
      throw new Error(`Missing required devices for plugin ${pluginId}: ${missingDevices.join(', ')}`);
    }
    
    // Full path to entity file
    const entityPath = `/entity/${entityId}`;
    
    // Check if entity exists
    if (!this.kernel.exists(entityPath)) {
      throw new Error(`Entity not found: ${entityId}`);
    }
    
    this.log(`Executing plugin ${pluginId} on entity ${entityId}`);
    
    try {
      // Execute the plugin
      const exitCode = await plugin.execute(this.kernel, entityPath, options);
      
      if (exitCode !== 0) {
        throw new Error(`Plugin exited with code: ${exitCode}`);
      }
      
      // Get updated entity by opening and reading file
      const fd = this.kernel.open(entityPath, OpenMode.READ);
      if (fd < 0) {
        throw new Error(`Failed to open entity file: ${entityPath}`);
      }
      
      try {
        // Read entity data
        const entityData = {};
        const result = this.kernel.read(fd, entityData);
        
        if (result !== 0) {
          throw new Error(`Failed to read entity data: ${result}`);
        }
        
        return entityData;
      } finally {
        // Always close the file descriptor
        this.kernel.close(fd);
      }
    } catch (error) {
      this.error(`Error executing plugin ${pluginId} on entity ${entityId}`, error);
      throw error;
    }
  }
  
  /**
   * Shutdown the plugin manager
   */
  async shutdown(): Promise<void> {
    this.log('Shutting down PluginManager');
    
    // Close any open files
    for (const [path, fd] of this.openFiles.entries()) {
      try {
        this.kernel.close(fd);
        this.log(`Closed file: ${path}`);
      } catch (error) {
        this.error(`Error closing file ${path}`, error);
      }
    }
    
    // Clear file tracking
    this.openFiles.clear();
    
    // Note: Kernel is responsible for shutting down devices
    
    this.log('Plugin manager shut down');
  }
  
  /**
   * Helper method to get an entity by path
   * Opens, reads, and immediately closes the file
   * @param entityPath Path to entity file
   * @returns Entity data or null if error
   */
  getEntityData(entityPath: string): Entity | null {
    // Open the file
    const fd = this.kernel.open(entityPath, OpenMode.READ);
    if (fd < 0) {
      this.error(`Failed to open entity file: ${entityPath}`);
      return null;
    }
    
    try {
      // Read entity data
      const entityData = {};
      const result = this.kernel.read(fd, entityData);
      
      if (result !== 0) {
        this.error(`Failed to read entity data: ${result}`);
        return null;
      }
      
      return entityData as Entity;
    } finally {
      // Always close the file descriptor
      this.kernel.close(fd);
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