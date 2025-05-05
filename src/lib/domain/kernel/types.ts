/**
 * Core type definitions for the kernel module
 * Following Unix philosophy of small, focused components with explicit interfaces
 */

/**
 * Entity is the base unit of gameplay. It could be a character, item, etc.
 */
export interface Entity {
  id: string;
  type: string;
  name: string;
  properties: Record<string, any>;
  metadata: {
    createdAt: number;
    updatedAt: number;
    version: number;
  };
}

/**
 * Capability is the interface for accessing system functionality
 * Similar to Unix device drivers, capabilities expose specific functionality
 * while hiding implementation details
 */
export interface Capability {
  /** Unique identifier for this capability */
  readonly id: string;
  
  /** Semantic version of this capability implementation */
  readonly version: string;
  
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
}

/**
 * Plugin is the interface for components that implement game features
 * Similar to Unix processes, plugins operate through capabilities
 */
export interface Plugin {
  /** Unique identifier for this plugin */
  id: string;
  
  /** Human-readable name of this plugin */
  name: string;
  
  /** Description of what this plugin does */
  description?: string;
  
  /** List of capability IDs this plugin requires */
  requiredCapabilities: string[];
  
  /**
   * Optional method to validate if the plugin can be applied
   * @param entity The entity to validate against
   * @param capabilities The capabilities available to this plugin
   * @returns Validation result with status and optional reason
   */
  canApply?(entity: Entity, capabilities: Record<string, Capability>): PluginValidationResult;
  
  /**
   * Apply this plugin to an entity
   * @param entity The entity to apply the plugin to
   * @param options Options for how to apply the plugin
   * @param capabilities The capabilities available to this plugin
   * @returns Result of applying the plugin
   */
  apply(
    entity: Entity, 
    options: Record<string, any>, 
    capabilities: Record<string, Capability>
  ): any;
  
  /**
   * Remove this plugin from an entity
   * @param entity The entity to remove the plugin from
   * @param capabilities The capabilities available to this plugin
   * @returns Result of removing the plugin
   */
  remove?(
    entity: Entity,
    capabilities: Record<string, Capability>
  ): any;
}

/**
 * Result of validating a plugin
 */
export interface PluginValidationResult {
  /** Whether the plugin can be applied */
  valid: boolean;
  
  /** If not valid, reason why */
  reason?: string;
}

/**
 * EventListener for kernel events
 */
export type EventListener = (data: any) => void;

/**
 * Event subscription information
 */
export interface EventSubscription {
  /** Unique identifier for this subscription */
  id: string;
  
  /** Event name this subscription is for */
  event: string;
  
  /** Listener function */
  listener: EventListener;
}

/**
 * EventEmitter for kernel events
 */
export interface EventEmitter {
  /** 
   * Emit an event
   * @param event Event name
   * @param data Event data
   */
  emit(event: string, data: any): void;
  
  /**
   * Subscribe to an event
   * @param event Event name
   * @param listener Listener function
   * @returns Subscription ID
   */
  on(event: string, listener: EventListener): string;
  
  /**
   * Unsubscribe from an event
   * @param id Subscription ID
   */
  off(id: string): void;
  
  /**
   * Remove all event listeners
   */
  removeAllListeners(): void;
}

/**
 * KernelOptions for configuring a kernel instance
 */
export interface KernelOptions {
  /** Whether to show debug logs */
  debug?: boolean;
  
  /** Custom event emitter implementation */
  eventEmitter?: EventEmitter;
}