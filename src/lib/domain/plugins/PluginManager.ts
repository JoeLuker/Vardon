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
import { DefaultPluginFilesystem, PLUGIN_PATHS, type PluginFilesystem } from './PluginFilesystem';

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
  
  /** Reference to the kernel for file operations */
  private readonly kernel: GameKernel;
  
  /** The plugin filesystem abstraction */
  private readonly filesystem: PluginFilesystem;
  
  /** Map of open file descriptors by path */
  private readonly openFiles: Map<string, number> = new Map();
  
  constructor(options: PluginManagerOptions) {
    this.debug = options.debug || false;
    
    if (!options.kernel) {
      throw new Error('PluginManager requires a GameKernel instance');
    }
    
    this.kernel = options.kernel;
    
    // Initialize the plugin filesystem
    this.filesystem = new DefaultPluginFilesystem(this.kernel, this.debug);
    
    this.log('Plugin Manager initialized');
  }
  
  /**
   * Register a plugin in the filesystem
   * @param plugin Plugin to register
   */
  registerPlugin(plugin: Plugin): void {
    // Mount the plugin in the filesystem
    const result = this.filesystem.mountPlugin(plugin);
    
    if (result !== 0) {
      this.error(`Failed to register plugin ${plugin.id}: error code ${result}`);
      return;
    }
    
    this.log(`Registered plugin: ${plugin.id} (${plugin.name})`);
  }
  
  /**
   * Get a plugin by ID
   * @param pluginId Plugin ID
   * @returns Plugin instance or undefined if not found
   */
  getPlugin(pluginId: string): Plugin | undefined {
    // Create the path to the plugin executable
    const pluginPath = `${PLUGIN_PATHS.BIN}/${pluginId}`;
    
    // Check if the plugin exists
    if (!this.filesystem.existsPlugin(pluginPath)) {
      return undefined;
    }
    
    // Get plugin metadata
    const metadata = this.filesystem.getPluginMetadata(pluginPath);
    if (!metadata) {
      return undefined;
    }
    
    // Since we can't directly return the plugin object (filesystem abstraction),
    // we need to use the kernel to get the actual plugin instance
    // This is a temporary bridge during refactoring
    return this.kernel.getPlugin(pluginId);
  }
  
  /**
   * Check if a plugin is registered
   * @param pluginId Plugin ID
   * @returns Whether the plugin is registered
   */
  hasPlugin(pluginId: string): boolean {
    // Create the path to the plugin executable
    const pluginPath = `${PLUGIN_PATHS.BIN}/${pluginId}`;
    
    // Check if the plugin exists in the filesystem
    return this.filesystem.existsPlugin(pluginPath);
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
    // Get all plugin paths in /bin
    const pluginPaths = this.filesystem.listPlugins(PLUGIN_PATHS.BIN);
    
    // Map paths to metadata
    return pluginPaths
      .map(path => this.filesystem.getPluginMetadata(path))
      .filter((metadata): metadata is PluginMetadata => metadata !== null);
  }
  
  /**
   * Get all registered plugins
   * @returns Array of all registered plugins
   */
  getAllPlugins(): Plugin[] {
    // Get all plugin paths in /bin
    const pluginPaths = this.filesystem.listPlugins(PLUGIN_PATHS.BIN);
    
    // Map paths to plugin instances
    return pluginPaths
      .map(path => {
        const pluginId = path.substring(PLUGIN_PATHS.BIN.length + 1);
        return this.kernel.getPlugin(pluginId);
      })
      .filter((plugin): plugin is Plugin => plugin !== undefined);
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
    // Get all plugin metadata
    const allMetadata = this.getAllPluginMetadata();
    
    // Filter plugins that require this device
    const pluginIds = allMetadata
      .filter(metadata => metadata.requiredDevices.includes(devicePath))
      .map(metadata => metadata.id);
    
    // Get plugin instances
    return pluginIds
      .map(id => this.getPlugin(id))
      .filter((plugin): plugin is Plugin => plugin !== undefined);
  }
  
  /**
   * Check required devices for a plugin
   * @param pluginId Plugin ID
   * @returns Array of missing device paths, empty if all available
   */
  checkRequiredDevices(pluginId: string): string[] {
    // Get plugin metadata
    const pluginPath = `${PLUGIN_PATHS.BIN}/${pluginId}`;
    const metadata = this.filesystem.getPluginMetadata(pluginPath);
    
    if (!metadata) {
      return [`Plugin not found: ${pluginId}`];
    }
    
    // Check if required devices are available
    const missingDevices: string[] = [];
    for (const devicePath of metadata.requiredDevices) {
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
    // Create the paths
    const pluginPath = `${PLUGIN_PATHS.BIN}/${pluginId}`;
    const entityPath = `/entity/${entityId}`;
    
    // Check if plugin exists
    if (!this.filesystem.existsPlugin(pluginPath)) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }
    
    // Check required devices
    const missingDevices = this.checkRequiredDevices(pluginId);
    if (missingDevices.length > 0) {
      throw new Error(`Missing required devices for plugin ${pluginId}: ${missingDevices.join(', ')}`);
    }
    
    // Check if entity exists
    if (!this.kernel.exists(entityPath)) {
      throw new Error(`Entity not found: ${entityId}`);
    }
    
    this.log(`Executing plugin ${pluginId} on entity ${entityId}`);
    
    // Execute the plugin using the filesystem abstraction
    return this.filesystem.executePlugin(pluginPath, entityPath, options);
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
    
    // Unmount all plugins
    const pluginPaths = this.filesystem.listPlugins(PLUGIN_PATHS.BIN);
    for (const path of pluginPaths) {
      const pluginId = path.substring(PLUGIN_PATHS.BIN.length + 1);
      this.filesystem.unmountPlugin(pluginId);
    }
    
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
      const [result, entityData] = this.kernel.read(fd);
      
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