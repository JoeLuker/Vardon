import type { Feature } from '../types/FeatureTypes';
import { FeatureLoader } from '../features/FeatureLoader';

/**
 * FeatureRegistry provides a Unix-style approach to feature management.
 * Features are discovered through filesystem patterns when possible,
 * with manual registration as a fallback for compatibility.
 * 
 * This follows the Unix philosophy by separating concerns:
 * - Feature files contain only their own implementation
 * - The registry doesn't manage features, just helps find them
 * - Each component does one thing well
 */
export class FeatureRegistry {
  // Manual registry for backward compatibility and runtime-registered features
  private manualFeatures: Map<string, Feature> = new Map();
  
  // Feature loader for filesystem-based feature discovery
  private featureLoader: FeatureLoader;
  
  constructor() {
    this.featureLoader = new FeatureLoader();
  }
  
  /**
   * Register a feature manually
   * @param feature The feature to register
   */
  register(feature: Feature): void {
    this.manualFeatures.set(feature.id, feature);
  }
  
  /**
   * Get a feature by ID
   * Checks manual registry first, then tries filesystem discovery
   * @param id The feature ID
   * @returns The feature or undefined if not found
   */
  get(id: string): Feature | undefined {
    // Check manual registry first (synchronous operation)
    const manualFeature = this.manualFeatures.get(id);
    if (manualFeature) {
      return manualFeature;
    }
    
    // No manual feature found - return undefined for now
    // The caller should use getAsync for filesystem-based discovery
    return undefined;
  }
  
  /**
   * Get a feature by ID asynchronously
   * Checks manual registry first, then tries filesystem discovery
   * @param id The feature ID
   * @returns Promise resolving to the feature or undefined
   */
  async getAsync(id: string): Promise<Feature | undefined> {
    // Check manual registry first
    const manualFeature = this.manualFeatures.get(id);
    if (manualFeature) {
      return manualFeature;
    }
    
    // Try to load from filesystem
    return await this.featureLoader.getFeature(id);
  }
  
  /**
   * Get all manually registered features
   * @returns Array of manually registered features
   */
  getAll(): Feature[] {
    return Array.from(this.manualFeatures.values());
  }
  
  /**
   * Load all features in a category
   * @param category The category to load (e.g., 'feat', 'class')
   * @returns Promise resolving to array of features
   */
  async loadCategory(category: string): Promise<Feature[]> {
    return await this.featureLoader.loadFeaturesByCategory(category);
  }
  
  /**
   * Preload specific features by ID
   * @param featureIds Array of feature IDs to preload
   */
  async preloadFeatures(featureIds: string[]): Promise<void> {
    await this.featureLoader.preloadFeatures(featureIds);
  }
  
  /**
   * Clear the feature loader cache
   */
  clearCache(): void {
    this.featureLoader.clearCache();
  }
}
