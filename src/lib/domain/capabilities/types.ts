/**
 * Capability system interfaces
 * 
 * This file defines the core interfaces for capabilities.
 * Capabilities are the primary way for plugins to interact with the system.
 * They provide a well-defined interface to system functionality while
 * hiding implementation details.
 */

/**
 * Interface for capability providers
 * Capability providers are responsible for creating capability instances
 */
export interface CapabilityProvider {
  /** Unique identifier for the capability */
  readonly id: string;
  
  /** Create the capability */
  createCapability(): any;
}