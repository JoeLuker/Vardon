/**
 * Main feature index - central access point for all feature categories
 * This follows Unix philosophy by providing a consistent interface
 * without hiding the underlying details.
 */

import { GenericFeature } from './GenericFeature';
import featFeatures from './feats';
import classFeatures from './classes';
import corruptionFeatures from './corruptions';
import { SPELL_FEATURES } from './spells';

// Export the GenericFeature as a named export
export { GenericFeature };

// Export category indexes
export { default as feats } from './feats';
export { default as classes } from './classes';
export { default as corruptions } from './corruptions';
export * from './spells';

/**
 * Central feature registry - maps feature types to their lazy-loaded implementations
 * This allows features to be loaded on demand while providing a unified interface
 */
const features = {
  // Feature type prefixes
  feat: featFeatures,
  class: classFeatures,
  corruption: corruptionFeatures,
  spell: SPELL_FEATURES,
  
  /**
   * Load a feature by ID
   * @param featureId The full ID of the feature to load (e.g., "feat.power_attack")
   * @returns Promise resolving to the feature or undefined if not found
   */
  async load(featureId: string): Promise<any> {
    const [category, name] = featureId.split('.');
    
    if (!category || !name) {
      throw new Error(`Invalid feature ID format: ${featureId}`);
    }
    
    // Get the category loader
    const categoryLoader = this[category];
    if (!categoryLoader) {
      console.warn(`Unknown feature category: ${category}`);
      return undefined;
    }
    
    // Try to load the feature
    try {
      // Handle special cases like weapon_focus_*
      if (category === 'feat' && name.startsWith('weapon_focus_')) {
        return await featFeatures.loadWeaponFocus(name);
      }
      
      // Try to get the direct loader
      const loader = categoryLoader[name];
      if (loader && typeof loader === 'function') {
        return await loader();
      }
      
      // If no direct loader, try to load the feature via the category index
      const moduleExports = await import(`./${category}s`);
      
      // Look for the feature in the named exports
      const pascalName = name.split('_')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
      
      const exportName = `${pascalName}Feature`;
      if (moduleExports[exportName]) {
        return moduleExports[exportName];
      }
      
      console.warn(`Feature not found in category exports: ${featureId}`);
      return undefined;
    } catch (error) {
      console.error(`Error loading feature ${featureId}:`, error);
      return undefined;
    }
  }
};

export default features;