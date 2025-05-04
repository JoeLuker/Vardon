import { EventBus } from './EventBus';
import { FeatureRegistry } from '../config/FeatureRegistry';
import type { Entity, Subsystem, Feature } from '../types';
import { GenericFeature } from '../features/GenericFeature';

export class GameEngine {
  public readonly events: EventBus = new EventBus();
  private subsystems: Map<string, Subsystem> = new Map();
  private entities: Map<string, Entity> = new Map();
  private featureOrchestrator: any = null; // Will be set by setFeatureOrchestrator
  
  constructor(private featureRegistry: FeatureRegistry) {}
  
  /**
   * Set the FeatureOrchestrator for dynamic feature creation
   * @param orchestrator The FeatureOrchestrator instance
   */
  setFeatureOrchestrator(orchestrator: any): void {
    this.featureOrchestrator = orchestrator;
  }
  
  registerSubsystem(path: string, subsystem: Subsystem): void {
    this.subsystems.set(path, subsystem);
    this.events.emit('subsystem:registered', { path });
  }
  
  getSubsystem<T extends Subsystem>(path: string): T | undefined {
    return this.subsystems.get(path) as T;
  }
  
  /**
   * Get all registered subsystem names
   * @returns Array of registered subsystem names
   */
  getSubsystemNames(): string[] {
    try {
      // Guard against Map not being initialized
      if (!this.subsystems || typeof this.subsystems.keys !== 'function') {
        console.warn('GameEngine.getSubsystemNames: subsystems map is not properly initialized');
        return [];
      }
      
      // Safely get subsystem names
      return Array.from(this.subsystems.keys());
    } catch (error) {
      console.error('Error in GameEngine.getSubsystemNames:', error);
      return [];
    }
  }
  
  registerEntity(entity: Entity): void {
    this.entities.set(entity.id, entity);
    this.events.emit('entity:registered', { entityId: entity.id });
  }
  
  getEntity(id: string): Entity | undefined {
    return this.entities.get(id);
  }
  
  async activateFeature<T>(featureId: string, entity: Entity, options?: any): Promise<T> {
    try {
      console.log(`Attempting to activate feature: ${featureId} for entity: ${entity.id}`);
      
      // Resolve the feature (either finding existing or creating generic)
      const feature = await this.resolveFeature(featureId);
      if (!feature) {
        console.error(`Failed to resolve feature: ${featureId}`);
        
        // Create an emergency fallback feature even if resolveFeature returned undefined
        console.warn(`Creating emergency fallback feature for: ${featureId}`);
        const parts = featureId.split('.');
        const displayName = parts.length > 1 ? 
          parts[1].split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 
          featureId;
        
        const emergencyFeature = GenericFeature.create(
          featureId, 
          displayName, 
          `Emergency fallback feature for ${featureId}`
        );
        
        this.featureRegistry.register(emergencyFeature);
        
        // Try activating with the emergency feature
        return this.activateFeature(featureId, entity, options);
      }
      
      // Check if the feature can be applied using the canApply method
      if (feature.canApply) {
        const subsystemsForValidation = this.getSubsystemsForFeature(feature);
        const validationResult = feature.canApply(entity, subsystemsForValidation);
        
        if (!validationResult || !validationResult.valid) {
          const reason = validationResult?.reason || 'Unknown validation failure';
          console.warn(`Feature ${featureId} cannot be applied to entity ${entity.id}: ${reason}`);
          throw new Error(`Feature ${featureId} cannot be applied to entity ${entity.id}: ${reason}`);
        }
      }
      
      // Get subsystems needed for feature
      const subsystems = this.getSubsystemsForFeature(feature);
      
      // Apply the feature and get result
      console.log(`Applying feature ${featureId} to entity ${entity.id}`);
      const result = feature.apply(entity, options || {}, subsystems);
      
      // Emit event
      this.events.emit('feature:activated', { 
        featureId, 
        entityId: entity.id,
        success: true,
        timestamp: new Date().toISOString()
      });
      
      console.log(`Successfully activated feature: ${featureId} for entity: ${entity.id}`);
      return result as T;
    } catch (error) {
      // Log error and emit failure event
      console.error(`Error activating feature ${featureId} for entity ${entity.id}:`, error);
      this.events.emit('feature:activation_failed', {
        featureId,
        entityId: entity.id,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
      
      // Rethrow so caller can handle
      throw error;
    }
  }
  
  /**
   * Resolve a feature by ID using filesystem discovery when possible
   * @param id The feature ID to resolve
   * @returns Promise resolving to the feature or undefined if not found
   */
  async resolveFeature(id: string): Promise<Feature | undefined> {
    try {
      // First check in the synchronous registry for manually registered features
      let feature = this.featureRegistry.get(id);
      if (feature) {
        console.log(`Found existing feature in manual registry: ${id}`);
        return feature;
      }
      
      // Try async filesystem-based discovery
      console.log(`Attempting to load feature from filesystem: ${id}`);
      feature = await this.featureRegistry.getAsync(id);
      if (feature) {
        console.log(`Successfully loaded feature from filesystem: ${id}`);
        return feature;
      }
      
      // If not found and we have an orchestrator as fallback, try to create it
      if (this.featureOrchestrator) {
        try {
          console.log(`Attempting to create feature via orchestrator for: ${id}`);
          feature = await this.featureOrchestrator.getOrCreateFeature(id);
          if (feature) {
            console.log(`Successfully created feature via orchestrator: ${id}`);
            // Register the feature for future use
            this.featureRegistry.register(feature);
            return feature;
          } else {
            console.warn(`Orchestrator returned null/undefined for feature: ${id}`);
          }
        } catch (orchestratorError) {
          console.warn(`Error creating feature via orchestrator for ${id}:`, orchestratorError);
        }
      }
      
      // Last resort: create a basic generic feature
      console.log(`Creating basic fallback feature for: ${id}`);
      const parts = id.split('.');
      const displayName = parts.length > 1 ? 
        parts[1].split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 
        id;
      
      // Import GenericFeature dynamically if needed
      const { GenericFeature } = await import('../features/GenericFeature');
      const fallbackFeature = GenericFeature.create(id, displayName, `Emergency fallback for ${id}`);
      
      // Register the fallback feature for future use
      this.featureRegistry.register(fallbackFeature);
      return fallbackFeature;
    } catch (error) {
      console.error(`Critical error resolving feature ${id}:`, error);
      return undefined;
    }
  }
  
  private getSubsystemsForFeature(feature: Feature): Record<string, Subsystem> {
    const subsystems: Record<string, Subsystem> = {};
    for (const path of feature.requiredSubsystems || []) {
      const subsystem = this.getSubsystem(path);
      if (!subsystem) throw new Error(`Required subsystem not available: ${path}`);
      subsystems[path] = subsystem;
    }
    return subsystems;
  }
  
  /**
   * Safely shuts down the game engine, cleaning up resources
   * Important for preventing memory leaks in longer-running applications
   */
  shutdown(): void {
    console.log('Shutting down GameEngine');
    
    try {
      // Clear all event listeners
      if (this.events) {
        this.events.removeAllListeners();
        console.log('Cleared all event listeners');
      }
      
      // Clear entity references
      if (this.entities) {
        this.entities.clear();
        console.log('Cleared entity references');
      }
      
      // Give subsystems a chance to clean up
      if (this.subsystems) {
        for (const [name, subsystem] of this.subsystems.entries()) {
          if (subsystem && typeof subsystem.shutdown === 'function') {
            try {
              subsystem.shutdown();
              console.log(`Shut down subsystem: ${name}`);
            } catch (error) {
              console.error(`Error shutting down subsystem ${name}:`, error);
            }
          }
        }
        
        // Clear subsystem references
        this.subsystems.clear();
        console.log('Cleared subsystem references');
      }
      
      // Clear feature orchestrator
      this.featureOrchestrator = null;
      
      console.log('GameEngine shutdown completed successfully');
    } catch (error) {
      console.error('Error during GameEngine shutdown:', error);
    }
  }
}
