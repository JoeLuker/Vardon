import type { Feature } from '../types/FeatureTypes';

export class FeatureRegistry {
  private features: Map<string, Feature> = new Map();
  
  register(feature: Feature): void {
    this.features.set(feature.id, feature);
  }
  
  get(id: string): Feature | undefined {
    return this.features.get(id);
  }
  
  getAll(): Feature[] {
    return Array.from(this.features.values());
  }
}
