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