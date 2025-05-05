/**
 * Unix UI Adapter
 *
 * This adapter provides a clean interface for UI components to interact
 * with the Unix architecture.
 */

import type { AssembledCharacter } from '$lib/domain/character/characterTypes';
import type { CompleteCharacter } from '$lib/db/gameRules.api';
import { adaptEntityToAssembledCharacter } from './UnixCharacterAdapter';
import { initializeUnixApplication } from '$lib/domain/unix-application';
import type { Entity } from '$lib/domain/kernel/types';
import type { GameRulesAPI } from '$lib/db/gameRules.api';

/**
 * Unix UI Adapter class
 * Provides methods for UI components to interact with the Unix architecture
 */
export class UnixUIAdapter {
  private app: any;
  private characterCache: Map<number, AssembledCharacter> = new Map();
  private entityCache: Map<string, Entity> = new Map();
  private initialized = false;
  private initializing = false;
  private gameAPI: GameRulesAPI | null = null;
  
  /**
   * Initialize the Unix UI Adapter
   * @param gameData Optional game data to pass to the Unix application
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
      console.log('[UnixUIAdapter] Initializing...');
      
      // Initialize the Unix application
      this.app = await initializeUnixApplication(gameData);
      
      // Verify initialization
      if (!this.app || !this.app.kernel || !this.app.pluginManager) {
        throw new Error('Failed to initialize Unix application');
      }
      
      // Get the gameAPI
      this.gameAPI = this.app.dbAPI;
      
      this.initialized = true;
      this.initializing = false;
      
      console.log('[UnixUIAdapter] Initialization complete');
      return true;
    } catch (error) {
      console.error('[UnixUIAdapter] Initialization failed:', error);
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
      console.log(`[UnixUIAdapter] Loading character: ${characterId}`);
      
      // First get the raw character data
      let rawCharacter: CompleteCharacter;
      
      if (!this.gameAPI) {
        throw new Error('GameAPI not available');
      }
      
      rawCharacter = await this.gameAPI.getCompleteCharacterData(characterId);
      
      if (!rawCharacter) {
        throw new Error(`Character not found: ${characterId}`);
      }
      
      // Load the character entity using the Unix architecture
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
      
      console.log(`[UnixUIAdapter] Character loaded: ${characterId}`);
      return assembledCharacter;
    } catch (error) {
      console.error(`[UnixUIAdapter] Error loading character ${characterId}:`, error);
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
      console.log(`[UnixUIAdapter] Applying feature ${featureId} to character ${characterId}`);
      
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
      
      console.log(`[UnixUIAdapter] Feature ${featureId} applied to character ${characterId}`);
      return result;
    } catch (error) {
      console.error(`[UnixUIAdapter] Error applying feature ${featureId} to character ${characterId}:`, error);
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
      console.log(`[UnixUIAdapter] Updating character ${characterId} property ${property}`);
      
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
      
      console.log(`[UnixUIAdapter] Character ${characterId} property ${property} updated`);
      return true;
    } catch (error) {
      console.error(`[UnixUIAdapter] Error updating character ${characterId} property ${property}:`, error);
      return false;
    }
  }
  
  /**
   * Get instance of Unix UI Adapter
   * @returns Unix UI Adapter instance
   */
  static getInstance(): UnixUIAdapter {
    if (!UnixUIAdapter.instance) {
      UnixUIAdapter.instance = new UnixUIAdapter();
    }
    
    return UnixUIAdapter.instance;
  }
  
  /**
   * Singleton instance
   */
  private static instance: UnixUIAdapter;
}