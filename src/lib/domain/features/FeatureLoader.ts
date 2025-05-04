import type { Feature } from '../types/FeatureTypes';
import { GenericFeature } from './GenericFeature';

/**
 * FeatureLoader provides a Unix-style directory-based approach to feature discovery.
 * Instead of a central registry, features are discovered through filesystem patterns.
 * This follows Unix philosophy of having small, focused components that do one thing well.
 */
export class FeatureLoader {
  // Cache of loaded features to avoid redundant imports
  private loadedFeatures: Map<string, Feature> = new Map();
  
  // Base directory for features (relative to the import context)
  private readonly basePath = '$lib/domain/features';
  
  /**
   * Get a feature by ID, loading it dynamically if needed
   * @param featureId The ID of the feature to load
   * @returns The feature or undefined if not found
   */
  async getFeature(featureId: string): Promise<Feature | undefined> {
    // Check cache first
    if (this.loadedFeatures.has(featureId)) {
      return this.loadedFeatures.get(featureId);
    }
    
    // Extract category and name from feature ID
    const parts = featureId.split('.');
    if (parts.length < 2) {
      console.error(`Invalid feature ID format: ${featureId}`);
      return undefined;
    }
    
    const [category, ...nameParts] = parts;
    const name = nameParts.join('.');
    
    try {
      // First try to load from explicit feature file
      const feature = await this.loadFeatureFromFiles(category, name);
      if (feature) {
        this.loadedFeatures.set(featureId, feature);
        return feature;
      }
      
      // If not found, create a generic feature
      return await this.createGenericFeature(featureId, category, name);
    } catch (error) {
      console.error(`Error loading feature ${featureId}:`, error);
      return undefined;
    }
  }
  
  /**
   * Load a feature from filesystem by category and name
   * @param category Feature category (feat, class, etc.)
   * @param name Feature name
   * @returns The loaded feature or undefined if not found
   */
  private async loadFeatureFromFiles(category: string, name: string): Promise<Feature | undefined> {
    // Convert name from snake_case to PascalCase for file matching
    const pascalName = name.split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
    
    // Check potential file locations based on convention
    const potentialPaths = [
      // Specific feature file (e.g., features/feats/PowerAttackFeature)
      `${this.basePath}/${category}s/${pascalName}Feature`,
      
      // Feature with more specific name (e.g., weapon_focus_longsword)
      // For cases like weapon_focus_longsword, we try WeaponFocusFeature with special handling
      `${this.basePath}/${category}s/${name.split('_')[0].charAt(0).toUpperCase() + name.split('_')[0].slice(1)}${name.indexOf('_') > -1 ? 'Focus' : ''}Feature`,
      
      // Generic category module with named exports
      `${this.basePath}/${category}s/index`
    ];
    
    // Special case for certain feature patterns
    if (name.includes('focus_')) {
      const baseType = name.split('_')[0];
      potentialPaths.push(`${this.basePath}/${category}s/${baseType.charAt(0).toUpperCase() + baseType.slice(1)}FocusFeature`);
    }
    
    for (const path of potentialPaths) {
      try {
        // Dynamic import to load the feature module
        const module = await import(path);
        
        // Check if the module exports the feature directly
        const exportName = `${pascalName}Feature`;
        if (module[exportName]) {
          return module[exportName];
        }
        
        // Check if the module has a default export
        if (module.default && 
            typeof module.default === 'object' && 
            module.default.id === `${category}.${name}`) {
          return module.default;
        }
        
        // For generic features like weapon_focus_*, check if there's a factory method
        if (name.includes('_') && module.createSpecialized) {
          const specialized = module.createSpecialized(name);
          if (specialized) {
            return specialized;
          }
        }
        
        // For index modules, check all exports for matching feature id
        for (const [exportName, exportValue] of Object.entries(module)) {
          if (exportValue && 
              typeof exportValue === 'object' && 
              exportValue.id === `${category}.${name}`) {
            return exportValue as Feature;
          }
        }
      } catch (importError) {
        // Silently continue to next path
        continue;
      }
    }
    
    // Feature file not found
    return undefined;
  }
  
  /**
   * Create a generic feature if no specific implementation is found
   * @param featureId Full feature ID
   * @param category Feature category
   * @param name Feature name
   * @returns A generic feature implementation
   */
  private async createGenericFeature(featureId: string, category: string, name: string): Promise<Feature | undefined> {
    try {
      // Create display name from feature name
      const displayName = name.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      // Generate a generic feature
      console.log(`Creating generic feature for ${featureId}`);
      return GenericFeature.create(featureId, displayName, `Generic ${category} feature`);
    } catch (error) {
      console.error(`Error creating generic feature for ${featureId}:`, error);
      return undefined;
    }
  }
  
  /**
   * Load all features in a specific category
   * @param category The category to load (feat, class, etc.)
   * @returns Array of features in the category
   */
  async loadFeaturesByCategory(category: string): Promise<Feature[]> {
    const features: Feature[] = [];
    
    try {
      // Try to import the index file for this category if it exists
      try {
        const indexModule = await import(`${this.basePath}/${category}s/index`);
        
        // Add all exports that match Feature interface
        for (const [exportName, exportValue] of Object.entries(indexModule)) {
          if (
            exportValue && 
            typeof exportValue === 'object' && 
            typeof exportValue.id === 'string' &&
            typeof exportValue.name === 'string' &&
            typeof exportValue.apply === 'function'
          ) {
            features.push(exportValue as Feature);
            this.loadedFeatures.set(exportValue.id, exportValue as Feature);
          }
        }
      } catch (indexError) {
        // No index file, proceed with individual modules
        console.info(`No index file found for category ${category}. Using direct imports instead.`);
      }
      
      // In a production environment, you would:
      // 1. Either use a build-time generated list of modules
      // 2. Or use a server-side API to get available modules
      // 3. Or use a webpack context to require all files in a directory
      
      // For this implementation, we'll assume the calling code knows the specific
      // features it wants to load, and will call getFeature() for each one
      
    } catch (error) {
      console.error(`Error loading features for category ${category}:`, error);
    }
    
    return features;
  }
  
  /**
   * Preload specific features by ID
   * @param featureIds Array of feature IDs to preload
   */
  async preloadFeatures(featureIds: string[]): Promise<void> {
    const loadPromises = featureIds.map(id => this.getFeature(id));
    await Promise.all(loadPromises);
  }
  
  /**
   * Clear the cache of loaded features
   */
  clearCache(): void {
    this.loadedFeatures.clear();
  }
}