/**
 * Process Kit
 * 
 * This module provides utilities for building plugins using a Unix process metaphor.
 * Instead of inheritance, it uses composition of small, focused functions.
 * 
 * In this model:
 * - Plugins are like processes that execute against files
 * - Each plugin has a specific task it performs
 * - Plugins communicate through the filesystem
 * - Plugins use standard I/O operations to read and write data
 */

import type { Entity, Plugin, Capability, PluginValidationResult } from '../kernel/types';
import { OpenMode } from '../kernel/types'; 
import type { GameKernel } from '../kernel/GameKernel';

/**
 * Plugin process options
 */
export interface PluginProcessOptions {
  /** Unique plugin ID */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** Description */
  description?: string;
  
  /** Debug logging */
  debug?: boolean;
  
  /** Plugin version */
  version?: string;
  
  /** Plugin author */
  author?: string;
  
  /** Required device paths */
  requiredDevices: string[];
  
  /** Entity validator function */
  validateEntity?: (entity: Entity, context: PluginContext) => PluginValidationResult;
  
  /** Main plugin execution function */
  execute: (kernel: GameKernel, entityPath: string, options?: Record<string, any>) => Promise<number>;
}

/**
 * Plugin execution context
 */
export interface PluginContext {
  /** Unique plugin ID */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** Debug logging flag */
  debug: boolean;
  
  /** Custom context data */
  [key: string]: any;
}

/**
 * Create a plugin process that follows Unix principles
 * @param options Plugin process options
 * @returns A plugin implementation
 */
export function createPluginProcess(options: PluginProcessOptions): Plugin {
  // Create plugin context
  const context: PluginContext = {
    id: options.id,
    name: options.name,
    debug: options.debug || false
  };
  
  return {
    id: options.id,
    name: options.name,
    description: options.description,
    version: options.version || '1.0.0',
    author: options.author,
    requiredDevices: options.requiredDevices,
    
    // Main execution function
    async execute(kernel: GameKernel, entityPath: string, opts: Record<string, any> = {}): Promise<number> {
      try {
        return await options.execute(kernel, entityPath, opts);
      } catch (error) {
        logError(context, `Error executing plugin: ${error}`);
        return 1; // Error exit code
      }
    },
    
    // Validation function
    canApply(entity: Entity): PluginValidationResult {
      // If custom validator is provided, use it
      if (options.validateEntity) {
        return options.validateEntity(entity, context);
      }
      
      // Default validation always passes
      return { valid: true };
    }
  };
}

/**
 * Create a standard file-processing plugin
 * @param options Basic plugin options
 * @param processor The function that processes the entity file
 * @returns A plugin implementation
 */
export function createFileProcessor(
  options: Omit<PluginProcessOptions, 'execute'>,
  processor: (entity: Entity, context: PluginContext, opts?: Record<string, any>) => Promise<Entity>
): Plugin {
  return createPluginProcess({
    ...options,
    
    // Standard file processing execution
    async execute(kernel: GameKernel, entityPath: string, opts: Record<string, any> = {}): Promise<number> {
      const context: PluginContext = {
        id: options.id,
        name: options.name,
        debug: options.debug || false
      };
      
      try {
        // Check if entity exists
        if (!kernel.exists(entityPath)) {
          logError(context, `Entity not found: ${entityPath}`);
          return 2; // No such file error code
        }
        
        // Open the entity file
        const fd = kernel.open(entityPath, OpenMode.READ_WRITE);
        if (fd < 0) {
          logError(context, `Failed to open entity file: ${entityPath}`);
          return 3; // Permission error code
        }
        
        try {
          // Read entity data
          const [readResult, entityData] = kernel.read(fd);
          
          if (readResult !== 0) {
            logError(context, `Failed to read entity: ${entityPath}, error code: ${readResult}`);
            return 4; // Read error code
          }
          
          // Process the entity
          log(context, `Processing entity: ${entityPath}`);
          const updatedEntity = await processor(entityData as Entity, context, opts);
          
          // Write the updated entity
          const writeResult = kernel.write(fd, updatedEntity);
          
          if (writeResult !== 0) {
            logError(context, `Failed to write entity: ${entityPath}, error code: ${writeResult}`);
            return 5; // Write error code
          }
          
          log(context, `Successfully processed entity: ${entityPath}`);
          return 0; // Success
        } finally {
          // Always close the file descriptor
          kernel.close(fd);
        }
      } catch (error) {
        logError(context, `Error processing entity: ${error}`);
        return 1; // General error code
      }
    }
  });
}

/**
 * Create a filter plugin that processes entity data
 * @param options Basic plugin options
 * @param filter The function that filters/transforms entity data
 * @returns A plugin implementation
 */
export function createFilter(
  options: Omit<PluginProcessOptions, 'execute'>,
  filter: (entity: Entity, context: PluginContext, opts?: Record<string, any>) => any
): Plugin {
  return createFileProcessor(options, async (entity, context, opts) => {
    // Apply the filter to transform the entity
    const result = filter(entity, context, opts);
    
    // If the filter returns a Promise, await it
    if (result instanceof Promise) {
      return await result;
    }
    
    // Otherwise return the result directly
    return result;
  });
}

/**
 * Create a pipeline plugin that runs multiple operations in sequence
 * @param options Basic plugin options
 * @param operations Array of operations to perform in sequence
 * @returns A plugin implementation
 */
export function createPipeline(
  options: Omit<PluginProcessOptions, 'execute'>,
  operations: Array<(entity: Entity, context: PluginContext, opts?: Record<string, any>) => Promise<Entity>>
): Plugin {
  return createFileProcessor(options, async (entity, context, opts) => {
    // Initialize result with the input entity
    let result = entity;
    
    // Apply each operation in sequence
    for (const operation of operations) {
      result = await operation(result, context, opts);
    }
    
    return result;
  });
}

/**
 * Log a debug message
 * @param context Plugin context
 * @param message Message to log
 * @param data Optional data to log
 */
export function log(context: PluginContext, message: string, data?: any): void {
  if (context.debug) {
    if (data !== undefined) {
      console.log(`[${context.id}] ${message}`, data);
    } else {
      console.log(`[${context.id}] ${message}`);
    }
  }
}

/**
 * Log an error message
 * @param context Plugin context
 * @param message Error message
 * @param error Optional error object
 */
export function logError(context: PluginContext, message: string, error?: any): void {
  if (error !== undefined) {
    console.error(`[${context.id}] ${message}`, error);
  } else {
    console.error(`[${context.id}] ${message}`);
  }
}

/**
 * Helper function to read a device file
 * @param kernel Kernel instance
 * @param devicePath Path to the device
 * @returns [success, data]
 */
export async function readDevice(kernel: GameKernel, devicePath: string): Promise<[boolean, any]> {
  // Open the device
  const fd = kernel.open(devicePath, OpenMode.READ);
  if (fd < 0) {
    return [false, null];
  }
  
  try {
    // Read data
    const [result, data] = kernel.read(fd);
    
    if (result !== 0) {
      return [false, null];
    }
    
    return [true, data];
  } finally {
    // Always close the file descriptor
    kernel.close(fd);
  }
}

/**
 * Helper function to write to a device file
 * @param kernel Kernel instance
 * @param devicePath Path to the device
 * @param data Data to write
 * @returns Success flag
 */
export async function writeDevice(kernel: GameKernel, devicePath: string, data: any): Promise<boolean> {
  // Open the device
  const fd = kernel.open(devicePath, OpenMode.WRITE);
  if (fd < 0) {
    return false;
  }
  
  try {
    // Write data
    const result = kernel.write(fd, data);
    
    return result === 0;
  } finally {
    // Always close the file descriptor
    kernel.close(fd);
  }
}

/**
 * Helper function to perform device control
 * @param kernel Kernel instance
 * @param devicePath Path to the device
 * @param request Control request
 * @param arg Control argument
 * @returns Success flag
 */
export async function controlDevice(
  kernel: GameKernel, 
  devicePath: string, 
  request: number, 
  arg: any
): Promise<boolean> {
  // Open the device
  const fd = kernel.open(devicePath, OpenMode.READ_WRITE);
  if (fd < 0) {
    return false;
  }
  
  try {
    // Send control request
    const result = kernel.ioctl(fd, request, arg);
    
    return result === 0;
  } finally {
    // Always close the file descriptor
    kernel.close(fd);
  }
}

/**
 * Options for creating a capability wrapper plugin
 */
export interface CapabilityWrapperOptions extends Omit<PluginProcessOptions, 'execute' | 'requiredDevices'> {
  /**
   * Capability path to wrap
   */
  capabilityPath: string;
  
  /**
   * Additional required devices
   */
  additionalDevices?: string[];
  
  /**
   * Pre-processing function
   */
  preProcess?: (entity: Entity, context: PluginContext, opts?: Record<string, any>) => Promise<Entity>;
  
  /**
   * Post-processing function
   */
  postProcess?: (entity: Entity, context: PluginContext, opts?: Record<string, any>) => Promise<Entity>;
}

/**
 * Create a plugin that wraps a capability
 * This allows plugins to extend existing capabilities without inheritance
 * @param options Capability wrapper options
 * @returns A plugin implementation
 */
export function createCapabilityWrapper(options: CapabilityWrapperOptions): Plugin {
  // Define required devices (capability + additional)
  const requiredDevices = [
    options.capabilityPath,
    ...(options.additionalDevices || [])
  ];
  
  return createFileProcessor(
    {
      ...options,
      requiredDevices
    },
    async (entity, context, opts) => {
      // Get the kernel from context
      const kernel = opts.kernel as GameKernel;
      if (!kernel) {
        throw new Error('Kernel not provided in execution options');
      }
      
      // Pre-process the entity if needed
      let processedEntity = entity;
      if (options.preProcess) {
        processedEntity = await options.preProcess(processedEntity, context, opts);
      }
      
      // Open the wrapped capability
      const [success, capability] = await readDevice(kernel, options.capabilityPath);
      if (!success || !capability) {
        throw new Error(`Failed to access capability at ${options.capabilityPath}`);
      }
      
      // Get the operations of the capability
      const operations = Object.keys(capability)
        .filter(key => typeof capability[key] === 'function')
        .reduce((acc, key) => {
          acc[key] = capability[key].bind(capability);
          return acc;
        }, {} as Record<string, Function>);
      
      // Add capability operations to context
      const enrichedContext = {
        ...context,
        capability: operations
      };
      
      // Apply the capability operations to the entity
      // Note: The actual implementation will depend on the specific capability
      
      // Post-process the entity if needed
      if (options.postProcess) {
        processedEntity = await options.postProcess(processedEntity, enrichedContext, opts);
      }
      
      return processedEntity;
    }
  );
}

/**
 * Signal types for inter-plugin communication
 */
export enum SignalType {
  // Standard Unix signals
  SIGHUP = 1,   // Hangup detected
  SIGINT = 2,   // Interrupt from keyboard
  SIGQUIT = 3,  // Quit from keyboard
  SIGILL = 4,   // Illegal instruction
  SIGTRAP = 5,  // Trace/breakpoint trap
  SIGABRT = 6,  // Abort signal
  SIGTERM = 15, // Termination signal
  
  // Custom signals
  SIGUSR1 = 10, // User-defined signal 1
  SIGUSR2 = 12, // User-defined signal 2
  
  // Game-specific signals
  SIGINIT = 100,    // Initialization complete
  SIGREFRESH = 101, // Entity data refreshed
  SIGUPDATE = 102,  // Entity data updated
  SIGACTION = 103,  // Game action performed
}

/**
 * Signal handler type
 */
export type SignalHandler = (signal: SignalType, source: string, data?: any) => void;

/**
 * Options for creating a plugin with signal handling
 */
export interface SignalPluginOptions extends Omit<PluginProcessOptions, 'execute'> {
  /**
   * Signal handlers
   */
  handlers: Record<SignalType, SignalHandler>;
  
  /**
   * Main plugin execution
   */
  execute: (kernel: GameKernel, entityPath: string, options?: Record<string, any>) => Promise<number>;
}

/**
 * Create a plugin that can handle signals
 * @param options Signal plugin options
 * @returns A plugin implementation
 */
export function createSignalPlugin(options: SignalPluginOptions): Plugin {
  return createPluginProcess({
    ...options,
    async execute(kernel: GameKernel, entityPath: string, opts: Record<string, any> = {}): Promise<number> {
      // Register signal handlers with the kernel
      const signalPath = `/proc/signals/${options.id}`;
      
      // Create a signal processor function
      const processSignal = (signal: SignalType, source: string, data?: any) => {
        const handler = options.handlers[signal];
        if (handler) {
          handler(signal, source, data);
        }
      };
      
      // Register the signal processor
      kernel.registerSignalHandler(options.id, processSignal);
      
      try {
        // Execute the plugin logic
        return await options.execute(kernel, entityPath, opts);
      } finally {
        // Unregister signal handlers when done
        kernel.unregisterSignalHandler(options.id);
      }
    }
  });
}

/**
 * Send a signal to a plugin
 * @param kernel Kernel instance
 * @param targetPluginId Target plugin ID
 * @param signal Signal type
 * @param sourcePluginId Source plugin ID
 * @param data Optional signal data
 * @returns Success flag
 */
export async function sendSignal(
  kernel: GameKernel,
  targetPluginId: string,
  signal: SignalType,
  sourcePluginId: string,
  data?: any
): Promise<boolean> {
  return kernel.sendSignal(targetPluginId, signal, sourcePluginId, data);
}