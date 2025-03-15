/**
 * Registry for managing system dependencies
 * This provides a cleaner way to access systems than direct references
 * or using the context in the FeatureEffectSystem
 */
export class SystemRegistry {
  private systems: Map<string, any> = new Map();
  
  /**
   * Register a system in the registry
   * @param key The key to identify the system
   * @param system The system instance to register
   */
  register<T>(key: string, system: T): void {
    this.systems.set(key, system);
  }
  
  /**
   * Get a system from the registry
   * @param key The key of the system to retrieve
   * @returns The system instance or undefined if not found
   */
  get<T>(key: string): T | undefined {
    return this.systems.get(key) as T;
  }
  
  /**
   * Check if a system exists in the registry
   * @param key The key to check
   * @returns True if the system exists
   */
  has(key: string): boolean {
    return this.systems.has(key);
  }
  
  /**
   * Get all registered systems as a record
   * @returns A record of all registered systems
   */
  getAll(): Record<string, any> {
    return Object.fromEntries(this.systems.entries());
  }
  
  /**
   * Clear all registered systems
   */
  clear(): void {
    this.systems.clear();
  }
} 