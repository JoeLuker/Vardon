type EventListener<T = any> = (data: T) => void;

/**
 * Simple event bus for cross-plugin communication
 */
export class EventBus {
  private listeners: Map<string, EventListener[]> = new Map();
  
  /**
   * Subscribe to an event
   */
  on<T>(eventType: string, listener: EventListener<T>): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    
    this.listeners.get(eventType)!.push(listener);
    
    // Return unsubscribe function
    return () => this.off(eventType, listener);
  }
  
  /**
   * Unsubscribe from an event
   */
  off(eventType: string, listener: EventListener): void {
    if (!this.listeners.has(eventType)) return;
    
    const eventListeners = this.listeners.get(eventType)!;
    const index = eventListeners.indexOf(listener);
    
    if (index !== -1) {
      eventListeners.splice(index, 1);
    }
  }
  
  /**
   * Emit an event
   */
  emit<T>(eventType: string, data: T): void {
    if (!this.listeners.has(eventType)) return;
    
    this.listeners.get(eventType)!.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for ${eventType}:`, error);
      }
    });
  }
} 