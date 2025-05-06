/**
 * PluginLoader
 * 
 * This module implements a Unix-style dynamic plugin loader, similar to how dynamically
 * linked libraries (.so files) are loaded in Unix systems. It follows the Unix principle
 * of treating everything as a file, where plugins are accessed via paths.
 * 
 * It provides the ability to:
 * 1. Load plugins from filesystem paths
 * 2. Dynamically resolve plugin dependencies
 * 3. Manage plugin lifecycle
 */

import type { GameKernel } from '../kernel/GameKernel';
import type { Plugin } from '../kernel/types';
import { OpenMode, ErrorCode } from '../kernel/types';
import { PLUGIN_PATHS } from './PluginFilesystem';

/**
 * Plugin loading options
 */
export interface PluginLoadOptions {
  /** Whether to resolve dependencies */
  resolveDependencies?: boolean;
  
  /** Whether to validate device requirements */
  validateDevices?: boolean;
  
  /** Additional initialization options */
  initOptions?: Record<string, any>;
}

/**
 * Result of a plugin load operation
 */
export interface PluginLoadResult {
  /** Whether the load was successful */
  success: boolean;
  
  /** The loaded plugin, if successful */
  plugin?: Plugin;
  
  /** Error code if unsuccessful */
  errorCode?: number;
  
  /** Error message if unsuccessful */
  errorMessage?: string;
  
  /** Resolved dependencies if any */
  dependencies?: string[];
}

/**
 * Plugin loader service that handles dynamic loading and dependency resolution
 */
export class PluginLoader {
  /** Reference to the kernel */
  private readonly kernel: GameKernel;
  
  /** Debug logging flag */
  private readonly debug: boolean;
  
  /** Cache of loaded plugins */
  private readonly loadedPlugins = new Map<string, Plugin>();
  
  /**
   * Create a new plugin loader
   * @param kernel Kernel instance
   * @param debug Whether to enable debug logging
   */
  constructor(kernel: GameKernel, debug = false) {
    this.kernel = kernel;
    this.debug = debug;
  }
  
  /**
   * Load a plugin by path
   * @param pluginPath Path to the plugin executable
   * @param options Loading options
   * @returns Plugin load result
   */
  async loadPlugin(pluginPath: string, options: PluginLoadOptions = {}): Promise<PluginLoadResult> {
    try {
      const resolveDependencies = options.resolveDependencies !== false;
      const validateDevices = options.validateDevices !== false;
      
      // Verify pluginPath format
      if (!pluginPath.startsWith(PLUGIN_PATHS.BIN)) {
        const fullPath = `${PLUGIN_PATHS.BIN}/${pluginPath}`;
        return this.loadPlugin(fullPath, options);
      }
      
      // Extract plugin ID from path
      const pluginId = pluginPath.substring(PLUGIN_PATHS.BIN.length + 1);
      
      // Check if already loaded
      if (this.loadedPlugins.has(pluginId)) {
        this.log(`Plugin already loaded: ${pluginId}`);
        return {
          success: true,
          plugin: this.loadedPlugins.get(pluginId)
        };
      }
      
      // Check if plugin exists by attempting to open it
      const fd = this.kernel.open(pluginPath, OpenMode.READ);
      if (fd < 0) {
        this.error(`Plugin not found: ${pluginPath}`);
        return {
          success: false,
          errorCode: ErrorCode.ENOENT,
          errorMessage: `Plugin not found: ${pluginId}`
        };
      }
      
      // Read plugin metadata from /proc/plugins
      const metadataPath = `${PLUGIN_PATHS.PROC_PLUGINS}/${pluginId}`;
      const metadataFd = this.kernel.open(metadataPath, OpenMode.READ);
      
      if (metadataFd < 0) {
        this.kernel.close(fd);
        this.error(`Plugin metadata not found: ${metadataPath}`);
        return {
          success: false,
          errorCode: ErrorCode.ENOENT,
          errorMessage: `Plugin metadata not found: ${pluginId}`
        };
      }
      
      // Read metadata
      const [metadataResult, metadata] = this.kernel.read(metadataFd);
      this.kernel.close(metadataFd);
      
      if (metadataResult !== 0) {
        this.kernel.close(fd);
        this.error(`Failed to read plugin metadata: ${metadataPath}`);
        return {
          success: false,
          errorCode: metadataResult,
          errorMessage: `Failed to read plugin metadata: ${pluginId}`
        };
      }
      
      // Check required devices if validation is enabled
      if (validateDevices) {
        const missingDevices = [];
        for (const devicePath of metadata.requiredDevices || []) {
          if (!this.kernel.exists(devicePath)) {
            missingDevices.push(devicePath);
          }
        }
        
        if (missingDevices.length > 0) {
          this.kernel.close(fd);
          this.error(`Missing required devices for plugin ${pluginId}: ${missingDevices.join(', ')}`);
          return {
            success: false,
            errorCode: ErrorCode.ENODEV,
            errorMessage: `Missing required devices: ${missingDevices.join(', ')}`
          };
        }
      }
      
      // Load dependencies if enabled
      const loadedDependencies: string[] = [];
      if (resolveDependencies && metadata.dependencies) {
        for (const depId of metadata.dependencies) {
          const depPath = `${PLUGIN_PATHS.BIN}/${depId}`;
          
          // Recursively load dependency
          const depResult = await this.loadPlugin(depPath, {
            ...options,
            resolveDependencies: true // Always resolve nested dependencies
          });
          
          if (!depResult.success) {
            this.kernel.close(fd);
            this.error(`Failed to load dependency ${depId} for plugin ${pluginId}: ${depResult.errorMessage}`);
            return {
              success: false,
              errorCode: depResult.errorCode,
              errorMessage: `Failed to load dependency ${depId}: ${depResult.errorMessage}`
            };
          }
          
          loadedDependencies.push(depId);
        }
      }
      
      // Read the plugin code
      const [result, pluginData] = this.kernel.read(fd);
      this.kernel.close(fd);
      
      if (result !== 0) {
        this.error(`Failed to read plugin: ${pluginPath}`);
        return {
          success: false,
          errorCode: result,
          errorMessage: `Failed to read plugin: ${pluginId}`
        };
      }
      
      // Get the plugin instance
      const plugin = pluginData as Plugin;
      if (!plugin) {
        this.error(`Invalid plugin data: ${pluginId}`);
        return {
          success: false,
          errorCode: ErrorCode.EINVAL,
          errorMessage: `Invalid plugin data: ${pluginId}`
        };
      }
      
      // Store in loaded plugins cache
      this.loadedPlugins.set(pluginId, plugin);
      
      // Return success result
      this.log(`Successfully loaded plugin: ${pluginId}`);
      return {
        success: true,
        plugin,
        dependencies: loadedDependencies.length > 0 ? loadedDependencies : undefined
      };
    } catch (error) {
      this.error(`Error loading plugin: ${error}`);
      return {
        success: false,
        errorCode: ErrorCode.EIO,
        errorMessage: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Unload a plugin by ID
   * @param pluginId Plugin ID to unload
   * @returns Whether the unload was successful
   */
  unloadPlugin(pluginId: string): boolean {
    try {
      // Check if plugin is loaded
      if (!this.loadedPlugins.has(pluginId)) {
        this.error(`Plugin not loaded: ${pluginId}`);
        return false;
      }
      
      // Get the plugin
      const plugin = this.loadedPlugins.get(pluginId);
      
      // Call plugin's onUnload method if it exists
      if (plugin && typeof (plugin as any).onUnload === 'function') {
        (plugin as any).onUnload();
      }
      
      // Remove from loaded plugins
      this.loadedPlugins.delete(pluginId);
      
      this.log(`Unloaded plugin: ${pluginId}`);
      return true;
    } catch (error) {
      this.error(`Error unloading plugin ${pluginId}:`, error);
      return false;
    }
  }
  
  /**
   * Load all plugins in a directory
   * @param directoryPath Directory path to load plugins from
   * @param options Loading options
   * @returns Map of plugin IDs to load results
   */
  async loadAllPlugins(directoryPath: string = PLUGIN_PATHS.BIN, options: PluginLoadOptions = {}): Promise<Map<string, PluginLoadResult>> {
    const results = new Map<string, PluginLoadResult>();
    
    try {
      // Get list of plugins from kernel
      const pluginIds = this.kernel.listPlugins();
      
      // Load each plugin
      for (const pluginId of pluginIds) {
        const pluginPath = `${PLUGIN_PATHS.BIN}/${pluginId}`;
        const result = await this.loadPlugin(pluginPath, options);
        results.set(pluginId, result);
      }
    } catch (error) {
      this.error(`Error loading all plugins: ${error}`);
    }
    
    return results;
  }
  
  /**
   * Get a loaded plugin by ID
   * @param pluginId Plugin ID
   * @returns Plugin or undefined if not loaded
   */
  getPlugin(pluginId: string): Plugin | undefined {
    return this.loadedPlugins.get(pluginId);
  }
  
  /**
   * Check if a plugin is loaded
   * @param pluginId Plugin ID
   * @returns Whether the plugin is loaded
   */
  isLoaded(pluginId: string): boolean {
    return this.loadedPlugins.has(pluginId);
  }
  
  /**
   * Get all loaded plugins
   * @returns Map of plugin IDs to plugins
   */
  getAllLoadedPlugins(): Map<string, Plugin> {
    return new Map(this.loadedPlugins);
  }
  
  /**
   * Unload all plugins
   */
  unloadAllPlugins(): void {
    const pluginIds = Array.from(this.loadedPlugins.keys());
    
    for (const pluginId of pluginIds) {
      this.unloadPlugin(pluginId);
    }
    
    this.log(`Unloaded all plugins (${pluginIds.length})`);
  }
  
  /**
   * Log a debug message
   * @param message Message to log
   * @param data Optional data to log
   */
  private log(message: string, data?: any): void {
    if (this.debug) {
      if (data !== undefined) {
        console.log(`[PluginLoader] ${message}`, data);
      } else {
        console.log(`[PluginLoader] ${message}`);
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
      console.error(`[PluginLoader] ${message}`, error);
    } else {
      console.error(`[PluginLoader] ${message}`);
    }
  }
}