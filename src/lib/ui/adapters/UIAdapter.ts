/**
 * UI Adapter
 *
 * This adapter provides a clean interface for UI components to interact
 * with the application architecture.
 */

import type { AssembledCharacter } from '$lib/domain/character/characterTypes';
import type { CompleteCharacter } from '$lib/db/gameRules.api';
import { adaptEntityToAssembledCharacter } from './CharacterAdapter';
import { initializeApplication } from '$lib/domain/application';
import type { Entity } from '$lib/domain/kernel/types';
import type { GameRulesAPI } from '$lib/db/gameRules.api';

/**
 * UI Adapter class
 * Provides methods for UI components to interact with the application
 */
export class UIAdapter {
  private app: any;
  private characterCache: Map<number, AssembledCharacter> = new Map();
  private entityCache: Map<string, Entity> = new Map();
  private initialized = false;
  private initializing = false;
  private gameAPI: GameRulesAPI | null = null;
  
  /**
   * Initialize the UI Adapter
   * @param gameData Optional game data to pass to the application
   * @returns Whether initialization was successful
   */
  async initialize(gameData?: any): Promise<boolean> {
    if (this.initialized) {
      return true;
    }
    
    if (this.initializing) {
      // Wait for initialization to complete
      return new Promise<boolean>(resolve => {
        const checkInterval = setInterval(() => {
          if (this.initialized) {
            clearInterval(checkInterval);
            resolve(true);
          }
        }, 100);
      });
    }
    
    this.initializing = true;
    
    try {
      console.log('[UIAdapter] Initializing...');
      
      // Initialize the application
      const appResult = await initializeApplication(gameData);
      this.app = appResult;
      
      // Verify initialization
      if (!this.app || !this.app.kernel || !this.app.pluginManager) {
        throw new Error('Failed to initialize application');
      }
      
      // Get the gameAPI
      this.gameAPI = this.app.dbAPI;
      
      this.initialized = true;
      this.initializing = false;
      
      console.log('[UIAdapter] Initialization complete');
      return true;
    } catch (error) {
      console.error('[UIAdapter] Initialization failed:', error);
      this.initializing = false;
      throw error;
    }
  }
  
  /**
   * Load a character by ID
   * @param characterId Character ID
   * @param forceRefresh Whether to force a refresh from the database
   * @returns Assembled character
   */
  async loadCharacter(characterId: number, forceRefresh = false): Promise<AssembledCharacter> {
    // Ensure initialization
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Check cache unless forced refresh
    if (!forceRefresh && this.characterCache.has(characterId)) {
      return this.characterCache.get(characterId)!;
    }
    
    try {
      console.log(`[UIAdapter] Loading character: ${characterId}`);
      
      // First get the raw character data
      let rawCharacter: CompleteCharacter;
      
      if (!this.gameAPI) {
        throw new Error('GameAPI not available');
      }
      
      rawCharacter = await this.gameAPI.getCompleteCharacterData(characterId);
      
      if (!rawCharacter) {
        throw new Error(`Character not found: ${characterId}`);
      }
      
      // Load the character entity 
      const entity = await this.app.gameAPI.loadCharacter(characterId);
      
      if (!entity) {
        throw new Error(`Failed to load character entity: ${characterId}`);
      }
      
      // Cache the entity
      this.entityCache.set(entity.id, entity);
      
      // Adapt entity to assembled character format
      const assembledCharacter = adaptEntityToAssembledCharacter(
        entity,
        this.app.pluginManager,
        rawCharacter
      );
      
      // Cache the assembled character
      this.characterCache.set(characterId, assembledCharacter);
      
      console.log(`[UIAdapter] Character loaded: ${characterId}`);
      return assembledCharacter;
    } catch (error) {
      console.error(`[UIAdapter] Error loading character ${characterId}:`, error);
      throw error;
    }
  }
  
  /**
   * Apply a feature to a character
   * @param characterId Character ID
   * @param featureId Feature ID
   * @param options Feature options
   * @returns Result of applying the feature
   */
  async applyFeature(characterId: number, featureId: string, options: Record<string, any> = {}): Promise<any> {
    // Ensure initialization
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      console.log(`[UIAdapter] Applying feature ${featureId} to character ${characterId}`);
      
      // Get entity ID
      const entityId = `character-${characterId}`;
      
      // Get entity
      let entity = this.entityCache.get(entityId);
      
      // Load entity if not cached
      if (!entity) {
        entity = await this.app.gameAPI.loadCharacter(characterId);
        
        if (!entity) {
          throw new Error(`Entity not found: ${entityId}`);
        }
        
        this.entityCache.set(entityId, entity);
      }
      
      // Convert feature ID to plugin ID
      const pluginId = featureId.replace(/^(feat|class|spell|corruption)\./, '');
      
      // Apply the plugin
      const result = await this.app.pluginManager.applyPlugin(entity, pluginId, options);
      
      // Invalidate character cache
      this.characterCache.delete(characterId);
      
      console.log(`[UIAdapter] Feature ${featureId} applied to character ${characterId}`);
      return result;
    } catch (error) {
      console.error(`[UIAdapter] Error applying feature ${featureId} to character ${characterId}:`, error);
      throw error;
    }
  }
  
  /**
   * Update character property
   * @param characterId Character ID
   * @param property Property name
   * @param value New value
   * @returns Whether the update was successful
   */
  async updateCharacterProperty(characterId: number, property: string, value: any): Promise<boolean> {
    // Ensure initialization
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      console.log(`[UIAdapter] Updating character ${characterId} property ${property}`);
      
      // Get entity ID
      const entityId = `character-${characterId}`;
      
      // Get entity
      let entity = this.entityCache.get(entityId);
      
      // Load entity if not cached
      if (!entity) {
        entity = await this.app.gameAPI.loadCharacter(characterId);
        
        if (!entity) {
          throw new Error(`Entity not found: ${entityId}`);
        }
        
        this.entityCache.set(entityId, entity);
      }
      
      // Update the property
      entity.properties[property] = value;
      
      // Update entity in kernel
      this.app.kernel.updateEntity(entityId, {
        properties: entity.properties
      });
      
      // Invalidate character cache
      this.characterCache.delete(characterId);
      
      // Update the database if needed
      if (property === 'current_hp' && this.gameAPI) {
        await this.gameAPI.updateCharacterHP(characterId, value);
      }
      
      console.log(`[UIAdapter] Character ${characterId} property ${property} updated`);
      return true;
    } catch (error) {
      console.error(`[UIAdapter] Error updating character ${characterId} property ${property}:`, error);
      return false;
    }
  }
  
  /**
   * Get instance of UI Adapter
   * @returns UI Adapter instance
   */
  static getInstance(): UIAdapter {
    if (!UIAdapter.instance) {
      UIAdapter.instance = new UIAdapter();
    }
    
    return UIAdapter.instance;
  }
  
  /**
   * Singleton instance
   */
  private static instance: UIAdapter;
}