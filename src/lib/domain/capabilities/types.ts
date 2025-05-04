/**
 * Capability system interfaces
 * 
 * This file defines the core interfaces for capabilities.
 * Capabilities are the primary way for plugins to interact with the system.
 * They provide a well-defined interface to system functionality while
 * hiding implementation details.
 */

import { Capability, Entity } from '../kernel/types';

/**
 * Base capability configuration options
 */
export interface CapabilityOptions {
  /** Whether to enable debug logging */
  debug?: boolean;
  
  /** Version of this capability implementation */
  version?: string;
}

/**
 * Base capability implementation
 * Provides common functionality for all capabilities
 */
export abstract class BaseCapability implements Capability {
  /** Unique identifier for this capability */
  public abstract readonly id: string;
  
  /** Semantic version of this capability implementation */
  public readonly version: string;
  
  /** Whether debug logging is enabled */
  protected readonly debug: boolean;
  
  constructor(options: CapabilityOptions = {}) {
    this.debug = options.debug || false;
    this.version = options.version || '1.0.0';
  }
  
  /**
   * Initialize the capability for the given entity
   * Optional: Not all capabilities need initialization
   */
  initialize?(entity: Entity): void;
  
  /**
   * Clean up resources when shutting down
   * Optional: Not all capabilities need cleanup
   */
  shutdown?(): Promise<void>;
  
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