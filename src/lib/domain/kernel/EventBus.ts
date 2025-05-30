import type { EventEmitter, EventListener, EventSubscription } from './types';

/**
 * EventBus implements a simple pub/sub event system
 * This follows Unix philosophy by providing a simple way for components to communicate
 * without direct dependencies
 */
export class EventBus implements EventEmitter {
  private subscriptions: Map<string, EventSubscription> = new Map();
  private eventListeners: Map<string, Set<string>> = new Map();
  private debug: boolean;
  
  constructor(debug: boolean = false) {
    this.debug = debug;
  }
  
  /**
   * Check if an event has any listeners
   * @param event Event name
   * @returns True if the event has at least one listener
   */
  hasListeners(event: string): boolean {
    const listeners = this.eventListeners.get(event);
    return !!listeners && listeners.size > 0;
  }
  
  /**
   * Emit an event to all subscribers
   * @param event Event name
   * @param data Event data
   */
  emit(event: string, data: any): void {
    // Check if there are any listeners first to avoid unnecessary work
    // Only log the emission if there are listeners or debugging is enabled
    const hasListeners = this.hasListeners(event);
    
    if (this.debug) {
      console.log(`[EventBus] Emitting event: ${event}`, data);
      
      // Only log "No listeners" message in debug mode
      if (!hasListeners) {
        console.log(`[EventBus] No listeners for event: ${event}`);
      }
    }
    
    // Skip further processing if no listeners
    if (!hasListeners) {
      return;
    }
    
    // Get all subscription IDs for this event
    const subscriptionIds = this.eventListeners.get(event)!;
    
    // Call each listener
    for (const id of subscriptionIds) {
      const subscription = this.subscriptions.get(id);
      if (subscription) {
        try {
          subscription.listener(data);
        } catch (error) {
          console.error(`[EventBus] Error in listener for event ${event}:`, error);
        }
      }
    }
  }
  
  /**
   * Subscribe to an event
   * @param event Event name
   * @param listener Listener function
   * @returns Subscription ID
   */
  on(event: string, listener: EventListener): string {
    // Generate unique ID for this subscription
    const id = `${event}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Create subscription
    const subscription: EventSubscription = { id, event, listener };
    this.subscriptions.set(id, subscription);
    
    // Add to event listeners map
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(id);
    
    if (this.debug) {
      console.log(`[EventBus] Added listener for event: ${event}, id: ${id}`);
    }
    
    return id;
  }
  
  /**
   * Unsubscribe from an event
   * @param id Subscription ID
   */
  off(id: string): void {
    const subscription = this.subscriptions.get(id);
    if (!subscription) {
      return;
    }
    
    // Remove from subscriptions map
    this.subscriptions.delete(id);
    
    // Remove from event listeners map
    const event = subscription.event;
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(id);
      if (listeners.size === 0) {
        this.eventListeners.delete(event);
      }
    }
    
    if (this.debug) {
      console.log(`[EventBus] Removed listener for event: ${event}, id: ${id}`);
    }
  }
  
  /**
   * Remove all event listeners
   */
  removeAllListeners(): void {
    this.subscriptions.clear();
    this.eventListeners.clear();
    
    if (this.debug) {
      console.log(`[EventBus] Removed all listeners`);
    }
  }
  
  /**
   * Get the number of listeners for a specific event
   * @param event Event name
   * @returns Number of listeners
   */
  listenerCount(event: string): number {
    const listeners = this.eventListeners.get(event);
    return listeners ? listeners.size : 0;
  }
}