import type { Feature } from '../types/FeatureTypes';
import type { GameKernel } from '../kernel/GameKernel';
import { GenericFeature } from './GenericFeature';
import { OpenMode, ErrorCode } from '../kernel/types';
import { createFileProcessor, log as logProcess, logError as logErrorProcess } from '../plugins/ProcessKit';

/**
 * Constants for feature filesystem paths
 */
export const FEATURE_PATHS = {
  /** Base path for features */
  FEATURES_DIR: '/usr/lib/features',
  
  /** Feature modules by category */
  CATEGORIES: {
    FEAT: '/usr/lib/features/feats',
    CLASS: '/usr/lib/features/classes',
    SPELL: '/usr/lib/features/spells',
    CORRUPTION: '/usr/lib/features/corruptions'
  }
};

/**
 * Feature metadata interface
 */
export interface FeatureMetadata {
  /** Unique identifier */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** Feature description */
  description: string;
  
  /** Feature category */
  category: string;
  
  /** Module path containing implementation */
  implementationPath: string;
  
  /** Additional properties */
  [key: string]: any;
}

/**
 * FeatureLoader provides a Unix-style filesystem approach to feature discovery.
 * Features are accessed through paths in a virtual filesystem, with 
 * directories organized by category.
 * 
 * This follows Unix philosophy of having everything represented as a file.
 */
export class FeatureLoader {
  // Reference to the kernel
  private readonly kernel: GameKernel;
  
  // Whether to enable debug logging
  private readonly debug: boolean;
  
  // Cache of loaded features to avoid redundant imports
  private loadedFeatures: Map<string, Feature> = new Map();
  
  /**
   * Create a new feature loader
   * @param kernel Kernel instance
   * @param debug Whether to enable debug logging
   */
  constructor(kernel: GameKernel, debug = false) {
    this.kernel = kernel;
    this.debug = debug;
    
    // Initialize the feature filesystem
    this.initializeFileSystem();
  }
  
  /**
   * Initialize the feature filesystem structure
   */
  private initializeFileSystem(): void {
    // Create base feature directory
    if (!this.kernel.exists(FEATURE_PATHS.FEATURES_DIR)) {
      this.kernel.mkdir(FEATURE_PATHS.FEATURES_DIR);
    }
    
    // Create category directories
    for (const category of Object.values(FEATURE_PATHS.CATEGORIES)) {
      if (!this.kernel.exists(category)) {
        this.kernel.mkdir(category);
      }
    }
    
    this.log('Feature filesystem initialized');
  }
  
  /**
   * Register a feature with the filesystem
   * @param feature Feature to register
   * @returns Path to the feature
   */
  registerFeature(feature: Feature): string {
    if (!feature || !feature.id) {
      this.error('Cannot register feature: missing ID');
      return '';
    }
    
    // Parse the feature ID to determine category
    const [category, ...nameParts] = feature.id.split('.');
    const name = nameParts.join('.');
    
    // Determine the proper path based on category
    let categoryPath: string;
    switch (category.toLowerCase()) {
      case 'feat':
        categoryPath = FEATURE_PATHS.CATEGORIES.FEAT;
        break;
      case 'class':
        categoryPath = FEATURE_PATHS.CATEGORIES.CLASS;
        break;
      case 'spell':
        categoryPath = FEATURE_PATHS.CATEGORIES.SPELL;
        break;
      case 'corruption':
        categoryPath = FEATURE_PATHS.CATEGORIES.CORRUPTION;
        break;
      default:
        categoryPath = `${FEATURE_PATHS.FEATURES_DIR}/${category}s`;
        // Create category directory if it doesn't exist
        if (!this.kernel.exists(categoryPath)) {
          this.kernel.mkdir(categoryPath);
        }
    }
    
    // Create the feature path
    const featurePath = `${categoryPath}/${name}`;
    
    // Create feature metadata
    const metadata: FeatureMetadata = {
      id: feature.id,
      name: feature.name,
      description: feature.description || '',
      category,
      implementationPath: this.getModulePath(category, name),
      registeredAt: new Date().toISOString()
    };
    
    // Create path to the feature metadata file
    const metadataPath = `${featurePath}.meta`;
    
    // Store feature metadata
    const metadataResult = this.kernel.create(metadataPath, metadata);
    if (!metadataResult.success) {
      this.error(`Failed to create feature metadata: ${metadataPath}`);
      return '';
    }
    
    // Store the feature itself
    const result = this.kernel.create(featurePath, feature);
    if (!result.success) {
      this.error(`Failed to register feature: ${featurePath}`);
      return '';
    }
    
    // Add to in-memory cache
    this.loadedFeatures.set(feature.id, feature);
    
    this.log(`Registered feature: ${feature.id} at ${featurePath}`);
    return featurePath;
  }
  
  /**
   * Get metadata for a feature
   * @param featurePath Path to the feature
   * @returns Feature metadata or null if not found
   */
  getFeatureMetadata(featurePath: string): FeatureMetadata | null {
    // Add .meta extension if not present
    const metadataPath = featurePath.endsWith('.meta') 
      ? featurePath 
      : `${featurePath}.meta`;
    
    // Check if metadata exists
    if (!this.kernel.exists(metadataPath)) {
      this.error(`Feature metadata not found: ${metadataPath}`);
      return null;
    }
    
    // Open and read metadata
    const fd = this.kernel.open(metadataPath, OpenMode.READ);
    if (fd < 0) {
      this.error(`Failed to open metadata: ${metadataPath}`);
      return null;
    }
    
    try {
      // Read metadata
      const [result, metadata] = this.kernel.read(fd);
      
      if (result !== 0) {
        this.error(`Failed to read metadata: ${metadataPath}`);
        return null;
      }
      
      return metadata as FeatureMetadata;
    } finally {
      // Always close the file descriptor
      this.kernel.close(fd);
    }
  }
  
  /**
   * Get a feature by ID, loading it from the filesystem if needed
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
      this.error(`Invalid feature ID format: ${featureId}`);
      return undefined;
    }
    
    const [category, ...nameParts] = parts;
    const name = nameParts.join('.');
    
    // Get the feature path
    const featurePath = this.getFeaturePath(category, name);
    
    // Check if feature exists in filesystem
    if (this.kernel.exists(featurePath)) {
      // Open and read feature
      const fd = this.kernel.open(featurePath, OpenMode.READ);
      if (fd < 0) {
        this.error(`Failed to open feature: ${featurePath}`);
        return undefined;
      }
      
      try {
        // Read feature
        const [result, featureData] = this.kernel.read(fd);
        
        if (result !== 0) {
          this.error(`Failed to read feature: ${featurePath}`);
          return undefined;
        }
        
        // Add to cache
        const feature = featureData as Feature;
        this.loadedFeatures.set(featureId, feature);
        
        return feature;
      } finally {
        // Always close the file descriptor
        this.kernel.close(fd);
      }
    }
    
    // Feature not found in filesystem, try to load from module and register
    try {
      const feature = await this.loadFeatureFromFiles(category, name);
      if (feature) {
        // Register the loaded feature
        this.registerFeature(feature);
        return feature;
      }
      
      // If not found, create a generic feature
      const genericFeature = await this.createGenericFeature(featureId, category, name);
      if (genericFeature) {
        // Register the generic feature
        this.registerFeature(genericFeature);
        return genericFeature;
      }
      
      return undefined;
    } catch (error) {
      this.error(`Error loading feature ${featureId}:`, error);
      return undefined;
    }
  }
  
  /**
   * Get the path to a feature
   * @param category Feature category
   * @param name Feature name
   * @returns Path to the feature
   */
  private getFeaturePath(category: string, name: string): string {
    // Determine the proper path based on category
    let categoryPath: string;
    switch (category.toLowerCase()) {
      case 'feat':
        categoryPath = FEATURE_PATHS.CATEGORIES.FEAT;
        break;
      case 'class':
        categoryPath = FEATURE_PATHS.CATEGORIES.CLASS;
        break;
      case 'spell':
        categoryPath = FEATURE_PATHS.CATEGORIES.SPELL;
        break;
      case 'corruption':
        categoryPath = FEATURE_PATHS.CATEGORIES.CORRUPTION;
        break;
      default:
        categoryPath = `${FEATURE_PATHS.FEATURES_DIR}/${category}s`;
    }
    
    return `${categoryPath}/${name}`;
  }
  
  /**
   * Get the module path for a feature
   * @param category Feature category
   * @param name Feature name
   * @returns Path to the module
   */
  private getModulePath(category: string, name: string): string {
    // Convert name from snake_case to PascalCase for file matching
    const pascalName = name.split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
    
    // Base import path relative to the code
    const basePath = '$lib/domain/features';
    
    // Return the most likely module path
    return `${basePath}/${category}s/${pascalName}Feature`;
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
    
    // Base import path
    const basePath = '$lib/domain/features';
    
    // Check potential file locations based on convention
    const potentialPaths = [
      // Specific feature file (e.g., features/feats/PowerAttackFeature)
      `${basePath}/${category}s/${pascalName}Feature`,
      
      // Feature with more specific name (e.g., weapon_focus_longsword)
      // For cases like weapon_focus_longsword, we try WeaponFocusFeature with special handling
      `${basePath}/${category}s/${name.split('_')[0].charAt(0).toUpperCase() + name.split('_')[0].slice(1)}${name.indexOf('_') > -1 ? 'Focus' : ''}Feature`,
      
      // Generic category module with named exports
      `${basePath}/${category}s/index`
    ];
    
    // Special case for certain feature patterns
    if (name.includes('focus_')) {
      const baseType = name.split('_')[0];
      potentialPaths.push(`${basePath}/${category}s/${baseType.charAt(0).toUpperCase() + baseType.slice(1)}FocusFeature`);
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
      
      // Generate a generic feature using ProcessKit
      this.log(`Creating generic feature for ${featureId}`);
      
      // Create a feature processor using the Unix process metaphor
      return createFileProcessor(
        {
          id: featureId,
          name: displayName,
          description: `Generic ${category} feature`,
          debug: this.debug,
          requiredDevices: ['/dev/bonus'] // Minimal requirement
        },
        // The processor function that implements the feature
        async (entity, context, opts) => {
          // Log the application
          logProcess(context, `Applying generic feature ${displayName} to entity ${entity.id}`);
          
          // Apply the feature (minimal implementation)
          if (!entity.properties.appliedFeatures) {
            entity.properties.appliedFeatures = [];
          }
          
          // Add to applied features if not already present
          const alreadyApplied = entity.properties.appliedFeatures
            .some((applied: any) => applied.id === featureId);
          
          if (!alreadyApplied) {
            entity.properties.appliedFeatures.push({
              id: featureId,
              name: displayName,
              appliedAt: Date.now()
            });
          }
          
          // Return the updated entity
          return entity;
        }
      );
    } catch (error) {
      this.error(`Error creating generic feature for ${featureId}:`, error);
      return undefined;
    }
  }
  
  /**
   * List all features in a category
   * @param category The category to list (feat, class, etc.)
   * @returns Array of feature IDs
   */
  listFeaturesByCategory(category: string): string[] {
    // Determine the category path
    let categoryPath: string;
    switch (category.toLowerCase()) {
      case 'feat':
        categoryPath = FEATURE_PATHS.CATEGORIES.FEAT;
        break;
      case 'class':
        categoryPath = FEATURE_PATHS.CATEGORIES.CLASS;
        break;
      case 'spell':
        categoryPath = FEATURE_PATHS.CATEGORIES.SPELL;
        break;
      case 'corruption':
        categoryPath = FEATURE_PATHS.CATEGORIES.CORRUPTION;
        break;
      default:
        categoryPath = `${FEATURE_PATHS.FEATURES_DIR}/${category}s`;
    }
    
    // Check if category exists
    if (!this.kernel.exists(categoryPath)) {
      this.error(`Category path not found: ${categoryPath}`);
      return [];
    }
    
    // In a real implementation, we'd use a directory listing function
    // Here we'll simulate it by scanning our in-memory structures
    const featureIds: string[] = [];
    
    // Scan all known paths
    for (const [id, feature] of this.loadedFeatures.entries()) {
      if (id.startsWith(`${category}.`)) {
        featureIds.push(id);
      }
    }
    
    return featureIds;
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
        const basePath = '$lib/domain/features';
        const indexModule = await import(`${basePath}/${category}s/index`);
        
        // Add all exports that match Feature interface
        for (const [exportName, exportValue] of Object.entries(indexModule)) {
          if (
            exportValue && 
            typeof exportValue === 'object' && 
            typeof exportValue.id === 'string' &&
            typeof exportValue.name === 'string' &&
            typeof exportValue.apply === 'function'
          ) {
            // Register the feature in the filesystem
            this.registerFeature(exportValue as Feature);
            features.push(exportValue as Feature);
          }
        }
      } catch (indexError) {
        // No index file, proceed with individual modules
        this.log(`No index file found for category ${category}. Using direct imports instead.`);
      }
      
      // In a production environment, you would:
      // 1. Either use a build-time generated list of modules
      // 2. Or use a server-side API to get available modules
      // 3. Or use a webpack context to require all files in a directory
      
      // For this implementation, we'll assume the calling code knows the specific
      // features it wants to load, and will call getFeature() for each one
      
    } catch (error) {
      this.error(`Error loading features for category ${category}:`, error);
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
  
  /**
   * Log a debug message
   * @param message Message to log
   * @param data Optional data to log
   */
  private log(message: string, data?: any): void {
    if (this.debug) {
      if (data !== undefined) {
        console.log(`[FeatureLoader] ${message}`, data);
      } else {
        console.log(`[FeatureLoader] ${message}`);
      }
    }
  }
  
  /**
   * Log an error message
   * @param message Error message
   * @param error Optional error object
   */
  private error(message: string, error?: any): void {
    if (error !== undefined) {
      console.error(`[FeatureLoader] ${message}`, error);
    } else {
      console.error(`[FeatureLoader] ${message}`);
    }
  }
}