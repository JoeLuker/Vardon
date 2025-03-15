import { EventBus } from './EventBus';
import { FeatureRegistry } from '../config/FeatureRegistry';
import type { Entity, Subsystem, Feature } from '../types';

export class GameEngine {
  public readonly events: EventBus = new EventBus();
  private subsystems: Map<string, Subsystem> = new Map();
  private entities: Map<string, Entity> = new Map();
  
  constructor(private featureRegistry: FeatureRegistry) {}
  
  registerSubsystem(path: string, subsystem: Subsystem): void {
    this.subsystems.set(path, subsystem);
    this.events.emit('subsystem:registered', { path });
  }
  
  getSubsystem<T extends Subsystem>(path: string): T | undefined {
    return this.subsystems.get(path) as T;
  }
  
  registerEntity(entity: Entity): void {
    this.entities.set(entity.id, entity);
    this.events.emit('entity:registered', { entityId: entity.id });
  }
  
  getEntity(id: string): Entity | undefined {
    return this.entities.get(id);
  }
  
  activateFeature<T>(featureId: string, entity: Entity, options?: any): T {
    const feature = this.resolveFeature(featureId);
    if (!feature) throw new Error(`Feature not found: ${featureId}`);
    
    // Check if the feature can be applied
    if (feature.canApply && !feature.canApply(entity, this.getSubsystemsForFeature(feature))) {
      throw new Error(`Feature ${featureId} cannot be applied to entity ${entity.id}`);
    }
    
    const subsystems = this.getSubsystemsForFeature(feature);
    
    const result = feature.apply(entity, options || {}, subsystems);
    this.events.emit('feature:activated', { featureId, entityId: entity.id });
    
    return result as T;
  }
  
  resolveFeature(id: string): Feature | undefined {
    return this.featureRegistry.get(id);
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
}
