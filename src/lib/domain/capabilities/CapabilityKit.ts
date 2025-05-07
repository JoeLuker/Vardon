/**
 * Capability Kit
 * 
 * This module provides a set of utilities for implementing capabilities
 * using composition rather than inheritance. This approach follows Unix principles
 * of composing small, focused tools into larger systems.
 * 
 * Instead of inheriting from a base class, capabilities can compose operations
 * from independent utility functions and specialized services.
 */

import type { Entity } from '../kernel/types';
import { ErrorCode, OpenMode } from '../kernel/types';

/**
 * Options for creating a capability
 */
export interface CapabilityOptions {
  /** Unique identifier for this capability */
  id: string;
  
  /** Whether to enable debug logging */
  debug?: boolean;
  
  /** Version of this capability implementation */
  version?: string;
  
  /** Optional on-mount handler */
  onMount?: (kernel: any) => void;
  
  /** Optional read handler */
  onRead?: (fd: number, buffer: any, context: CapabilityContext) => number;
  
  /** Optional write handler */
  onWrite?: (fd: number, buffer: any, context: CapabilityContext) => number;
  
  /** Optional ioctl handler */
  onIoctl?: (fd: number, request: number, arg: any, context: CapabilityContext) => number;
  
  /** Optional shutdown handler */
  onShutdown?: (context: CapabilityContext) => Promise<void>;
}

/**
 * Capability context shared by all operation handlers
 */
export interface CapabilityContext {
  /** Unique identifier */
  id: string;
  
  /** Whether debug logging is enabled */
  debug: boolean;
  
  /** Capability version */
  version: string;
  
  /** Reference to the kernel */
  kernel: any;
  
  /** Device-specific storage */
  storage: Map<string, any>;
  
  /** Open file descriptors */
  openFiles: Map<number, { path: string, buffer: any }>;
  
  /** Custom context data */
  [key: string]: any;
}

/**
 * Creates a capability from individual operation handlers
 * @param options Capability options
 * @returns A capability implementation
 */
export function createCapability(options: CapabilityOptions): any {
  // Create shared context for all operations
  const context: CapabilityContext = {
    id: options.id,
    debug: options.debug || false,
    version: options.version || '1.0.0',
    kernel: null,
    storage: new Map(),
    openFiles: new Map()
  };
  
  return {
    // Basic capability properties
    id: options.id,
    version: context.version,
    
    // Standard capability operations
    onMount(kernel: any): void {
      context.kernel = kernel;
      log(context, 'Device mounted');
      
      // Call custom onMount handler if provided
      if (options.onMount) {
        options.onMount(kernel);
      }
    },
    
    read(fd: number, buffer: any): number {
      log(context, `Read from fd ${fd}`);
      
      // Use custom read handler if provided, otherwise return error
      if (options.onRead) {
        return options.onRead(fd, buffer, context);
      }
      
      return ErrorCode.EINVAL;
    },
    
    write(fd: number, buffer: any): number {
      log(context, `Write to fd ${fd}`);
      
      // Use custom write handler if provided, otherwise return error
      if (options.onWrite) {
        return options.onWrite(fd, buffer, context);
      }
      
      return ErrorCode.EINVAL;
    },
    
    ioctl(fd: number, request: number, arg: any): number {
      log(context, `IOCTL on fd ${fd}, request ${request}`);
      
      // Use custom ioctl handler if provided, otherwise return error
      if (options.onIoctl) {
        return options.onIoctl(fd, request, arg, context);
      }
      
      return ErrorCode.EINVAL;
    },
    
    async shutdown(): Promise<void> {
      log(context, 'Device unmounting');
      
      // Call custom shutdown handler if provided
      if (options.onShutdown) {
        await options.onShutdown(context);
      }
      
      // Standard cleanup
      context.storage.clear();
      context.openFiles.clear();
      log(context, 'Device unmounted');
    }
  };
}

/**
 * Log a debug message for a capability
 * @param context Capability context
 * @param message Message to log
 * @param data Optional data to log
 */
export function log(context: CapabilityContext, message: string, data?: any): void {
  if (context.debug) {
    if (data !== undefined) {
      console.log(`[${context.id}] ${message}`, data);
    } else {
      console.log(`[${context.id}] ${message}`);
    }
  }
}

/**
 * Log an error message for a capability
 * @param context Capability context
 * @param message Error message
 * @param error Optional error object
 */
export function error(context: CapabilityContext, message: string, error?: any): void {
  if (error !== undefined) {
    console.error(`[${context.id}] ${message}`, error);
  } else {
    console.error(`[${context.id}] ${message}`);
  }
}

/**
 * Perform an entity file operation with proper resource management
 * @param context Capability context
 * @param entityId Entity ID
 * @param operation Operation function that performs the actual work
 * @returns Result of the operation
 */
export async function withEntity<T>(
  context: CapabilityContext, 
  entityId: string,
  operation: (entity: Entity, fd: number) => Promise<T>
): Promise<T | null> {
  const kernel = context.kernel;
  if (!kernel) {
    error(context, 'Kernel not available');
    return null;
  }
  
  // Path to the entity file
  const entityPath = `/entity/${entityId}`;
  
  // Verify entity exists
  if (!kernel.exists(entityPath)) {
    error(context, `Entity not found: ${entityPath}`);
    return null;
  }
  
  // Open the entity file
  const fd = kernel.open(entityPath, OpenMode.READ_WRITE);
  if (fd < 0) {
    error(context, `Failed to open entity file: ${entityPath}`);
    return null;
  }
  
  try {
    // Read entity data
    const [result, entity] = kernel.read(fd);
    
    if (result !== 0) {
      error(context, `Failed to read entity: ${entityPath}, error code: ${result}`);
      return null;
    }
    
    // Perform the operation with the entity
    return await operation(entity as Entity, fd);
  } finally {
    // Always close the file descriptor
    kernel.close(fd);
  }
}

/**
 * Initialize an entity with a capability
 * Common utility for capabilities to initialize entity data
 * @param context Capability context
 * @param entity The entity to initialize
 * @param initializer Function that performs initialization
 * @returns The updated entity or null if error
 */
export async function initializeEntity(
  context: CapabilityContext,
  entity: Entity,
  initializer: (entity: Entity) => void
): Promise<Entity | null> {
  try {
    // Call the provided initializer
    initializer(entity);
    
    // Update entity in filesystem
    const entityPath = `/entity/${entity.id}`;
    const fd = context.kernel.open(entityPath, OpenMode.WRITE);
    
    if (fd < 0) {
      error(context, `Failed to open entity for writing: ${entityPath}`);
      return null;
    }
    
    try {
      // Write updated entity
      const writeResult = context.kernel.write(fd, entity);
      
      if (writeResult !== 0) {
        error(context, `Failed to write entity: ${entityPath}, error code: ${writeResult}`);
        return null;
      }
      
      return entity;
    } finally {
      // Always close the file descriptor
      context.kernel.close(fd);
    }
  } catch (err) {
    error(context, `Error initializing entity ${entity.id}:`, err);
    return null;
  }
}

/**
 * Create a streaming pipeline for entity operations
 * @param operations Array of operations to perform in sequence
 * @returns Function that processes an entity through the pipeline
 */
export function pipe<T>(
  ...operations: Array<(input: T) => T>
): (input: T) => T {
  return (input: T) => operations.reduce((value, op) => op(value), input);
}

/**
 * Perform an entity operation with path-based access
 * Common utility for IOCTL operations that operate directly on entity paths
 * @param context Capability context
 * @param entityPath Path to the entity
 * @param operation Operation function that performs the actual work
 * @param mode File open mode (defaults to READ_WRITE)
 * @returns Error code
 */
export function performEntityOperation(
  context: CapabilityContext,
  entityPath: string,
  operation: (entity: Entity) => void,
  mode: OpenMode = OpenMode.READ_WRITE
): number {
  try {
    const kernel = context.kernel;
    if (!kernel) {
      error(context, 'Kernel not available');
      return ErrorCode.ENODEV;
    }
    
    // Open the entity file
    const fd = kernel.open(entityPath, mode);
    if (fd < 0) {
      error(context, `Failed to open entity file: ${entityPath}`);
      return ErrorCode.ENOENT;
    }
    
    try {
      // Read entity data
      const [result, entity] = kernel.read(fd);
      
      if (result !== 0) {
        error(context, `Failed to read entity: ${entityPath}, error code: ${result}`);
        return result;
      }
      
      // Perform the operation with the entity
      operation(entity as Entity);
      
      // If in read-only mode, don't write back
      if (mode === OpenMode.READ) {
        return ErrorCode.SUCCESS;
      }
      
      // Write updated entity
      const writeResult = kernel.write(fd, entity);
      
      if (writeResult !== 0) {
        error(context, `Failed to write entity: ${entityPath}, error code: ${writeResult}`);
        return writeResult;
      }
      
      return ErrorCode.SUCCESS;
    } finally {
      // Always close the file descriptor
      kernel.close(fd);
    }
  } catch (err) {
    error(context, `Error processing entity operation: ${err}`);
    return ErrorCode.EIO;
  }
}

/**
 * Bonus/modifier object used in calculations
 */
export interface Modifier {
  /** Numeric value of the modifier */
  value: number;
  
  /** Source of the modifier (e.g., 'Power Attack', 'Rage') */
  source: string;
  
  /** Type of the modifier (e.g., 'enhancement', 'morale', 'untyped') */
  type?: string;
}

/**
 * Detailed breakdown of a value calculation
 */
export interface ModifierBreakdown {
  /** Base value before modifiers */
  base: number;
  
  /** List of applied modifiers */
  appliedModifiers: Modifier[];
  
  /** List of modifiers that were not applied (due to stacking rules) */
  unappliedModifiers?: Modifier[];
  
  /** Total value after applying modifiers */
  total: number;
}

/**
 * Default stacking rules for bonuses
 * By default, most bonus types do not stack (only the highest applies),
 * but certain types (like untyped, circumstance, and dodge) do stack.
 */
export const DEFAULT_STACKING_RULES: Record<string, boolean> = {
  'untyped': true,      // Untyped bonuses always stack
  'circumstance': true, // Circumstance bonuses stack
  'dodge': true,        // Dodge bonuses stack
  'penalty': true       // Penalties always stack (negative values)
};

/**
 * Calculate a modified value with bonus stacking rules
 * @param baseValue Base value before modifiers
 * @param modifiers Array of modifiers to apply
 * @param stackingRules Rules for which bonus types stack
 * @returns Breakdown of the calculation including total
 */
export function calculateModifiedValue(
  baseValue: number,
  modifiers: Modifier[],
  stackingRules: Record<string, boolean> = DEFAULT_STACKING_RULES
): ModifierBreakdown {
  // Group modifiers by type
  const modifiersByType: Record<string, Modifier[]> = {};
  
  // Initialize result
  const result: ModifierBreakdown = {
    base: baseValue,
    appliedModifiers: [],
    unappliedModifiers: [],
    total: baseValue
  };
  
  // Sort modifiers into groups by type
  for (const modifier of modifiers) {
    const type = modifier.type || 'untyped';
    
    if (!modifiersByType[type]) {
      modifiersByType[type] = [];
    }
    
    modifiersByType[type].push(modifier);
  }
  
  // Process each type according to stacking rules
  for (const [type, typeModifiers] of Object.entries(modifiersByType)) {
    const doesStack = stackingRules[type] ?? false;
    
    // Special case: all penalties stack regardless of type
    const arePenalties = typeModifiers.every(m => m.value < 0);
    const shouldStack = doesStack || arePenalties;
    
    if (shouldStack) {
      // This type stacks - apply all modifiers
      for (const modifier of typeModifiers) {
        result.total += modifier.value;
        result.appliedModifiers.push(modifier);
      }
    } else {
      // This type doesn't stack - find the best one
      let bestModifier: Modifier | null = null;
      let bestValue = 0;
      
      for (const modifier of typeModifiers) {
        // For bonuses we want the highest value, for penalties the lowest (most negative)
        const isBetter = modifier.value > 0 
          ? modifier.value > bestValue 
          : modifier.value < bestValue;
        
        if (!bestModifier || isBetter) {
          bestModifier = modifier;
          bestValue = modifier.value;
        }
      }
      
      // Apply the best modifier
      if (bestModifier) {
        result.total += bestModifier.value;
        result.appliedModifiers.push(bestModifier);
        
        // Add the others to unapplied
        for (const modifier of typeModifiers) {
          if (modifier !== bestModifier) {
            result.unappliedModifiers.push(modifier);
          }
        }
      }
    }
  }
  
  return result;
}

/**
 * Operation handler for IOCTL operations
 * Handles a specific IOCTL operation for a capability
 */
export type IoctlOperationHandler = (
  context: CapabilityContext,
  entityPath: string,
  args: any
) => number;

/**
 * Create a generic IOCTL handler for common capability operations
 * @param context Capability context
 * @param operationHandlers Map of operation names to handler functions
 * @returns An IOCTL handler function
 */
export function createIoctlHandler(
  context: CapabilityContext,
  operationHandlers: Record<string, IoctlOperationHandler>
): (fd: number, request: number, arg: any) => number {
  return (fd: number, request: number, arg: any): number => {
    // Basic validation
    if (!arg || typeof arg !== 'object' || !arg.operation) {
      error(context, 'Invalid IOCTL arguments: missing operation');
      return ErrorCode.EINVAL;
    }
    
    const { operation } = arg;
    
    // Check if we have a handler for this operation
    if (!operationHandlers[operation]) {
      error(context, `Unknown operation: ${operation}`);
      return ErrorCode.EINVAL;
    }
    
    try {
      // Most operations require an entity path
      if (!arg.entityPath && operation !== 'getConfig' && operation !== 'setConfig') {
        error(context, `Missing entityPath for operation: ${operation}`);
        return ErrorCode.EINVAL;
      }
      
      // Call the operation handler
      return operationHandlers[operation](context, arg.entityPath, arg);
    } catch (err) {
      error(context, `Error in IOCTL operation ${operation}:`, err);
      return ErrorCode.EIO;
    }
  };
}

/**
 * Standard IOCTL operation to initialize an entity
 * @param context Capability context
 * @param entityPath Path to the entity
 * @param initializer Function to initialize the entity
 * @returns Error code
 */
export function handleInitializeOperation(
  context: CapabilityContext,
  entityPath: string,
  initializer: (entity: Entity) => void
): number {
  return performEntityOperation(context, entityPath, (entity) => {
    initializer(entity);
  });
}