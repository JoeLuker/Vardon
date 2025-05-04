import type { GameEngine } from './GameEngine';
import type { FeatureRegistry } from '../config/FeatureRegistry';
import type { GameRulesAPI } from '$lib/db/gameRules.api';
import { GenericFeature } from '../features/GenericFeature';

/**
 * FeatureOrchestrator handles the dynamic creation and registration of features.
 * It follows the Unix philosophy by providing a simple, focused mechanism for 
 * creating generic feature implementations when specific ones are not available.
 * 
 * This class works with the DatabaseFeatureInitializer to ensure that all features
 * referenced in the database can be applied to entities, even if they don't have
 * explicit implementations.
 */
export class FeatureOrchestrator {
  /**
   * Creates a new FeatureOrchestrator
   * @param engine The GameEngine instance
   * @param featureRegistry The FeatureRegistry to register features with
   * @param gameRulesAPI Optional API for loading feature details from the database
   */
  constructor(
    private engine: GameEngine,
    private featureRegistry: FeatureRegistry,
    private gameRulesAPI?: GameRulesAPI
  ) {}

  /**
   * Gets a feature by ID, creating a generic one if necessary
   * @param featureId The ID of the feature to get or create
   * @returns The feature, either existing or newly created
   */
  async getOrCreateFeature(featureId: string): Promise<any> {
    try {
      // First check if the feature is already registered
      let feature = this.featureRegistry.get(featureId);
      if (feature) {
        console.log(`Found existing feature implementation for ${featureId}`);
        return feature;
      }
      
      // Feature not found, create a generic implementation
      console.log(`Creating generic feature for ${featureId}`);
      
      // Extract information from feature ID
      const parts = featureId.split('.');
      if (parts.length < 2) {
        console.warn(`Invalid feature ID format: ${featureId}. Using basic generic implementation.`);
        const basicFeature = GenericFeature.create(
          featureId, 
          featureId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          `Generic feature: ${featureId}`
        );
        this.featureRegistry.register(basicFeature);
        return basicFeature;
      }
      
      const [category, ...nameParts] = parts;
      const name = nameParts.join('.');
      
      // Setup default display name and description in case database lookup fails
      let displayName = name.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      let description = '';
      
      // Try to get additional details from database if available
      if (this.gameRulesAPI) {
        try {
          let featureDetails = null;
          
          // Get feature details based on category
          switch (category) {
            case 'corruption':
              featureDetails = await this.loadCorruptionManifestation(name);
              break;
              
            case 'class':
              featureDetails = await this.loadClassFeature(name);
              break;
              
            case 'feat':
              featureDetails = await this.loadFeat(name);
              break;
              
            case 'ancestry':
              featureDetails = await this.loadAncestryTrait(name);
              break;
              
            default:
              console.warn(`Unknown feature category: ${category}. Using basic display information.`);
              break;
          }
          
          if (featureDetails) {
            displayName = featureDetails.name || displayName;
            description = featureDetails.description || '';
            console.log(`Retrieved details for ${featureId} from database`);
          } else {
            console.warn(`No details found in database for ${featureId}. Using generated display information.`);
          }
        } catch (error) {
          console.warn(`Error loading details for ${featureId} from database:`, error);
          console.log(`Proceeding with generic feature implementation for ${featureId}`);
        }
      } else {
        console.warn(`No GameRulesAPI available for ${featureId}. Using generated display information.`);
      }
      
      // Create and register the generic feature
      console.log(`Creating GenericFeature for ${featureId} with name "${displayName}"`);
      feature = GenericFeature.create(featureId, displayName, description);
      this.featureRegistry.register(feature);
      
      return feature;
    } catch (error) {
      console.error(`Critical error in getOrCreateFeature for ${featureId}:`, error);
      
      // Emergency fallback - create the most basic implementation possible
      const fallbackFeature = GenericFeature.create(
        featureId,
        featureId.replace(/[._]/g, ' '),
        `Fallback generic implementation for ${featureId}`
      );
      
      this.featureRegistry.register(fallbackFeature);
      return fallbackFeature;
    }
  }
  
  /**
   * Load corruption manifestation details from the database
   * @param name The name identifier for the manifestation
   * @returns The manifestation details if found
   */
  private async loadCorruptionManifestation(name: string): Promise<any> {
    if (!this.gameRulesAPI) return null;
    
    try {
      // First try direct API call which has better error handling
      const manifestations = await this.gameRulesAPI.getAllCorruptionManifestations();
      
      // Try exact match by name
      const exactMatch = manifestations.find(m => 
        m.name === name || 
        m.name === name.replace(/_/g, ' ') || 
        m.name.toLowerCase() === name.toLowerCase()
      );
      
      if (exactMatch) return exactMatch;
      
      // Try fuzzy match - look for substring
      const fuzzyMatch = manifestations.find(m => 
        m.name.toLowerCase().includes(name.toLowerCase()) || 
        name.toLowerCase().includes(m.name.toLowerCase())
      );
      
      if (fuzzyMatch) return fuzzyMatch;
      
      // If we couldn't find anything through the API call, try a more direct approach
      console.log(`No corruption manifestation found for '${name}' using API. Trying direct query...`);
      
      // Try exact match
      const { data: exactData, error: exactError } = await this.gameRulesAPI.supabase
        .from('corruption_manifestation')
        .select('name, description')
        .eq('name', name);
        
      if (!exactError && exactData && exactData.length > 0) {
        return exactData[0];
      }
      
      // Try with spaces instead of underscores
      const { data: spaceData, error: spaceError } = await this.gameRulesAPI.supabase
        .from('corruption_manifestation')
        .select('name, description')
        .eq('name', name.replace(/_/g, ' '));
        
      if (!spaceError && spaceData && spaceData.length > 0) {
        return spaceData[0];
      }
      
      // Try case-insensitive match
      const { data: caseData, error: caseError } = await this.gameRulesAPI.supabase
        .from('corruption_manifestation')
        .select('name, description')
        .ilike('name', name);
        
      if (!caseError && caseData && caseData.length > 0) {
        return caseData[0];
      }
      
      // Try containing the name as substring
      const { data: substringData, error: substringError } = await this.gameRulesAPI.supabase
        .from('corruption_manifestation')
        .select('name, description')
        .ilike('name', `%${name}%`);
        
      if (!substringError && substringData && substringData.length > 0) {
        return substringData[0];
      }
      
      console.warn(`Could not find corruption_manifestation for '${name}' after multiple attempts`);
      
      // Create and return a minimal fallback object 
      return {
        name: name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        description: `Corruption manifestation: ${name}`
      };
    } catch (error) {
      console.error(`Error loading corruption_manifestation for '${name}':`, error);
      // Return minimal fallback data
      return {
        name: name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        description: `Corruption manifestation: ${name}`
      };
    }
  }
  
  /**
   * Load class feature details from the database
   * @param name The name identifier for the class feature
   * @returns The class feature details if found
   */
  private async loadClassFeature(name: string): Promise<any> {
    if (!this.gameRulesAPI) return null;
    
    try {
      // Try several different approaches to find the class feature
      
      // Try exact match
      const { data: exactData, error: exactError } = await this.gameRulesAPI.supabase
        .from('class_feature')
        .select('name, description')
        .eq('name', name);
        
      if (!exactError && exactData && exactData.length > 0) {
        return exactData[0];
      }
      
      // Try with spaces instead of underscores
      const { data: spaceData, error: spaceError } = await this.gameRulesAPI.supabase
        .from('class_feature')
        .select('name, description')
        .eq('name', name.replace(/_/g, ' '));
        
      if (!spaceError && spaceData && spaceData.length > 0) {
        return spaceData[0];
      }
      
      // Try case-insensitive match
      const { data: caseData, error: caseError } = await this.gameRulesAPI.supabase
        .from('class_feature')
        .select('name, description')
        .ilike('name', name);
        
      if (!caseError && caseData && caseData.length > 0) {
        return caseData[0];
      }
      
      // Try containing the name as substring
      const { data: substringData, error: substringError } = await this.gameRulesAPI.supabase
        .from('class_feature')
        .select('name, description')
        .ilike('name', `%${name}%`);
        
      if (!substringError && substringData && substringData.length > 0) {
        return substringData[0];
      }
      
      // Check if it's a special case like "elemental_focus" which might be in a different table
      if (name.includes('focus')) {
        const { data: focusData, error: focusError } = await this.gameRulesAPI.supabase
          .from('class_feature_benefit')
          .select('name, description')
          .ilike('name', `%${name.replace('focus', '')}%focus%`);
          
        if (!focusError && focusData && focusData.length > 0) {
          return focusData[0];
        }
      }
      
      console.warn(`Could not find class_feature for '${name}' after multiple attempts`);
      
      // Create and return a minimal fallback object
      return {
        name: name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        description: `Class feature: ${name}`
      };
    } catch (error) {
      console.error(`Error loading class_feature for '${name}':`, error);
      // Return minimal fallback data
      return {
        name: name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        description: `Class feature: ${name}`
      };
    }
  }
  
  /**
   * Load feat details from the database
   * @param name The name identifier for the feat
   * @returns The feat details if found
   */
  private async loadFeat(name: string): Promise<any> {
    if (!this.gameRulesAPI) return null;
    
    try {
      // First try the cached feats from the API
      try {
        const allFeats = await this.gameRulesAPI.getAllFeat();
        
        // Try exact match by name
        const exactMatch = allFeats.find(feat => 
          feat.name === name || 
          feat.name === name.replace(/_/g, ' ') || 
          feat.name.toLowerCase() === name.toLowerCase()
        );
        
        if (exactMatch) return exactMatch;
        
        // Handle weapon focus special case
        if (name.startsWith('weapon_focus_')) {
          const weaponType = name.replace('weapon_focus_', '');
          const weaponFocusMatch = allFeats.find(feat => 
            feat.name === 'Weapon Focus' || feat.name === 'weapon_focus'
          );
          
          if (weaponFocusMatch) {
            return {
              ...weaponFocusMatch,
              name: `Weapon Focus (${weaponType.split('_').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)).join(' ')})`,
              description: weaponFocusMatch.description
            };
          }
        }
        
        // Try fuzzy match
        const fuzzyMatch = allFeats.find(feat => 
          feat.name.toLowerCase().includes(name.replace(/_/g, ' ').toLowerCase()) || 
          name.toLowerCase().includes(feat.name.toLowerCase())
        );
        
        if (fuzzyMatch) return fuzzyMatch;
      } catch (apiError) {
        console.warn(`Error using API to find feat '${name}':`, apiError);
      }
      
      // If API approach didn't work, try direct queries
      
      // Try exact match
      const { data: exactData, error: exactError } = await this.gameRulesAPI.supabase
        .from('feat')
        .select('name, description')
        .eq('name', name);
        
      if (!exactError && exactData && exactData.length > 0) {
        return exactData[0];
      }
      
      // Try with spaces instead of underscores
      const { data: spaceData, error: spaceError } = await this.gameRulesAPI.supabase
        .from('feat')
        .select('name, description')
        .eq('name', name.replace(/_/g, ' '));
        
      if (!spaceError && spaceData && spaceData.length > 0) {
        return spaceData[0];
      }
      
      // Try case-insensitive match
      const { data: caseData, error: caseError } = await this.gameRulesAPI.supabase
        .from('feat')
        .select('name, description')
        .ilike('name', name);
        
      if (!caseError && caseData && caseData.length > 0) {
        return caseData[0];
      }
      
      // Try containing the name as substring
      const { data: substringData, error: substringError } = await this.gameRulesAPI.supabase
        .from('feat')
        .select('name, description')
        .ilike('name', `%${name.replace(/_/g, '%')}%`);
        
      if (!substringError && substringData && substringData.length > 0) {
        return substringData[0];
      }
      
      // Special handling for weapon_focus_* feats
      if (name.startsWith('weapon_focus_')) {
        const weaponType = name.replace('weapon_focus_', '');
        
        // Try to find the base Weapon Focus feat
        const { data: baseFeatData, error: baseFeatError } = await this.gameRulesAPI.supabase
          .from('feat')
          .select('name, description')
          .eq('name', 'Weapon Focus');
          
        if (!baseFeatError && baseFeatData && baseFeatData.length > 0) {
          return {
            ...baseFeatData[0],
            name: `Weapon Focus (${weaponType.split('_').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)).join(' ')})`,
            description: baseFeatData[0].description
          };
        }
      }
      
      console.warn(`Could not find feat for '${name}' after multiple attempts`);
      
      // Create and return a minimal fallback object
      return {
        name: name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        description: `Feat: ${name}`
      };
    } catch (error) {
      console.error(`Error loading feat for '${name}':`, error);
      // Return minimal fallback data
      return {
        name: name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        description: `Feat: ${name}`
      };
    }
  }
  
  /**
   * Load ancestry trait details from the database
   * @param name The name identifier for the ancestry trait
   * @returns The ancestry trait details if found
   */
  private async loadAncestryTrait(name: string): Promise<any> {
    if (!this.gameRulesAPI) return null;
    
    try {
      // Try multiple approaches for finding the ancestry trait
      
      // Try exact match
      const { data: exactData, error: exactError } = await this.gameRulesAPI.supabase
        .from('ancestry_trait')
        .select('name, description')
        .eq('name', name);
        
      if (!exactError && exactData && exactData.length > 0) {
        return exactData[0];
      }
      
      // Try with spaces instead of underscores
      const { data: spaceData, error: spaceError } = await this.gameRulesAPI.supabase
        .from('ancestry_trait')
        .select('name, description')
        .eq('name', name.replace(/_/g, ' '));
        
      if (!spaceError && spaceData && spaceData.length > 0) {
        return spaceData[0];
      }
      
      // Try case-insensitive match
      const { data: caseData, error: caseError } = await this.gameRulesAPI.supabase
        .from('ancestry_trait')
        .select('name, description')
        .ilike('name', name);
        
      if (!caseError && caseData && caseData.length > 0) {
        return caseData[0];
      }
      
      // Try containing the name as substring
      const { data: substringData, error: substringError } = await this.gameRulesAPI.supabase
        .from('ancestry_trait')
        .select('name, description')
        .ilike('name', `%${name.replace(/_/g, '%')}%`);
        
      if (!substringError && substringData && substringData.length > 0) {
        return substringData[0];
      }
      
      console.warn(`Could not find ancestry_trait for '${name}' after multiple attempts`);
      
      // Create and return a minimal fallback object
      return {
        name: name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        description: `Ancestry trait: ${name}`
      };
    } catch (error) {
      console.error(`Error loading ancestry_trait for '${name}':`, error);
      // Return minimal fallback data
      return {
        name: name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        description: `Ancestry trait: ${name}`
      };
    }
  }
}