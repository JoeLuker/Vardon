/**
 * UnixGameAPI
 * 
 * This module provides a unified API for the game engine following Unix philosophy.
 * It adapts the GameRulesAPI for database access but exposes functionality through
 * the kernel, capabilities, and plugins.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import { GameRulesAPI } from '$lib/db/gameRules.api';
import { GameKernel } from '../kernel/GameKernel';
import { Entity } from '../kernel/types';
import { BonusCapabilityProvider } from '../capabilities/bonus/BonusCapabilityProvider';
import { AbilityCapabilityProvider } from '../capabilities/ability/AbilityCapabilityProvider';
import { SkillCapabilityProvider } from '../capabilities/skill/SkillCapabilityProvider';
import { PluginManager } from '../plugins/PluginManager';
import { FeatureToPluginMigrator } from '../plugins/migration/FeatureToPluginMigrator';

// Import some legacy features for migration
import { PowerAttackFeature } from '../features/feats/PowerAttackFeature';
import { SkillFocusFeature } from '../features/feats/SkillFocusFeature';
import { WeaponFocusFeature } from '../features/feats/WeaponFocusFeature';

/**
 * Logger for the UnixGameAPI
 */
const logger = {
  info: (message: string, ...args: any[]) => console.log(`%c[UnixGameAPI INFO]%c ${message}`, 'color: blue; font-weight: bold;', 'color: inherit;', ...args),
  debug: (message: string, ...args: any[]) => console.debug(`%c[UnixGameAPI DEBUG]%c ${message}`, 'color: gray;', 'color: inherit;', ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[UnixGameAPI WARN] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[UnixGameAPI ERROR] ${message}`, ...args),
};

/**
 * UnixGameAPI options
 */
export interface UnixGameAPIOptions {
  /** Whether to enable debug logging */
  debug?: boolean;
}

/**
 * UnixGameAPI provides a unified interface for the game engine
 * following Unix philosophy of small, focused components with explicit dependencies.
 */
export class UnixGameAPI {
  /** Game kernel instance */
  private readonly kernel: GameKernel;
  
  /** Plugin manager instance */
  private readonly pluginManager: PluginManager;
  
  /** Database API instance */
  private readonly dbAPI: GameRulesAPI;
  
  /** Whether debug logging is enabled */
  private readonly debug: boolean;
  
  /** Map of loaded character entities */
  private readonly entities: Map<string, Entity> = new Map();
  
  constructor(private supabase: SupabaseClient<Database>, options: UnixGameAPIOptions = {}) {
    this.debug = options.debug || false;
    
    // Create database API
    this.dbAPI = new GameRulesAPI(supabase);
    
    // Create kernel
    this.kernel = new GameKernel({
      debug: this.debug
    });
    
    // Create plugin manager
    this.pluginManager = new PluginManager({
      debug: this.debug
    });
    
    // Initialize the system
    this.initializeSystem();
  }
  
  /**
   * Initialize the core system components
   */
  private initializeSystem(): void {
    logger.info('Initializing Unix game system...');
    
    // Register core capabilities
    this.initializeCapabilities();
    
    // Register core plugins
    this.initializePlugins();
    
    logger.info('Unix game system initialized');
  }
  
  /**
   * Initialize and register capabilities
   */
  private initializeCapabilities(): void {
    logger.debug('Registering capabilities...');
    
    // Create and register bonus capability (no dependencies)
    const bonusCapability = new BonusCapabilityProvider({
      debug: this.debug,
      stackSameType: false
    });
    this.pluginManager.registerCapability(bonusCapability);
    
    // Create and register ability capability (depends on bonus)
    const abilityCapability = new AbilityCapabilityProvider(
      bonusCapability,
      {
        debug: this.debug,
        defaultAbilities: ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']
      }
    );
    this.pluginManager.registerCapability(abilityCapability);
    
    // Create and register skill capability (depends on ability and bonus)
    const skillCapability = new SkillCapabilityProvider(
      abilityCapability,
      bonusCapability,
      {
        debug: this.debug
      }
    );
    this.pluginManager.registerCapability(skillCapability);
    
    // TODO: Register additional capabilities (combat, condition, spellcasting, etc.)
  }
  
  /**
   * Initialize and register plugins
   */
  private initializePlugins(): void {
    logger.debug('Registering plugins...');
    
    // Create a migrator to convert legacy features to plugins
    const migrator = new FeatureToPluginMigrator({ debug: this.debug });
    
    // Migrate legacy features to plugins
    const legacyFeatures = [
      PowerAttackFeature,
      SkillFocusFeature,
      WeaponFocusFeature
      // Add other legacy features here
    ];
    
    // Register migrated plugins
    for (const feature of legacyFeatures) {
      const plugin = migrator.migrateFeature(feature);
      this.pluginManager.registerPlugin(plugin);
    }
    
    // TODO: Register additional native plugins
  }
  
  /**
   * Load a character from the database
   * @param characterId Character ID
   * @returns Entity representing the character, or null if not found
   */
  async loadCharacter(characterId: number): Promise<Entity | null> {
    logger.info(`Loading character: ${characterId}`);
    
    try {
      // Get character data from database
      const characterData = await this.dbAPI.getInitialCharacterData(characterId);
      if (!characterData) {
        logger.warn(`Character not found: ${characterId}`);
        return null;
      }
      
      // Create entity from character data
      const entity: Entity = {
        id: `character-${characterId}`,
        type: 'character',
        name: characterData.name || 'Unknown Character',
        properties: {
          character: characterData,
          abilities: {},
          skills: {},
          classSkills: []
        },
        metadata: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: 1
        }
      };
      
      // Initialize entity with all capabilities
      this.pluginManager.initializeEntity(entity);
      
      // Set basic ability scores from character data
      this.initializeCharacterAbilities(entity);
      
      // Store entity
      this.entities.set(entity.id, entity);
      
      logger.info(`Character loaded: ${characterId}`);
      return entity;
    } catch (error) {
      logger.error(`Failed to load character: ${characterId}`, error);
      return null;
    }
  }
  
  /**
   * Initialize ability scores from character data
   * @param entity Entity to initialize
   */
  private initializeCharacterAbilities(entity: Entity): void {
    const characterData = entity.properties.character;
    const abilityCapability = this.pluginManager.getCapability('ability');
    
    if (!abilityCapability || !characterData || !characterData.game_character_ability) {
      return;
    }
    
    for (const abilityData of characterData.game_character_ability) {
      if (!abilityData.ability || !abilityData.ability.name) continue;
      
      const abilityName = abilityData.ability.name.toLowerCase();
      const abilityValue = abilityData.value;
      
      try {
        (abilityCapability as any).setAbilityScore(entity, abilityName, abilityValue);
      } catch (error) {
        logger.error(`Failed to set ability score: ${abilityName}`, error);
      }
    }
  }
  
  /**
   * Get a loaded character entity
   * @param characterId Character ID
   * @returns Entity representing the character, or null if not loaded
   */
  getCharacter(characterId: number): Entity | null {
    const entityId = `character-${characterId}`;
    return this.entities.get(entityId) || null;
  }
  
  /**
   * Apply a plugin to a character
   * @param characterId Character ID
   * @param pluginId Plugin ID
   * @param options Options for the plugin
   * @returns Result of applying the plugin
   */
  applyPlugin(characterId: number, pluginId: string, options: Record<string, any> = {}): any {
    const entity = this.getCharacter(characterId);
    if (!entity) {
      throw new Error(`Character not loaded: ${characterId}`);
    }
    
    // Apply the plugin
    return this.pluginManager.applyPlugin(entity, pluginId, options);
  }
  
  /**
   * Get a capability for direct use
   * @param capabilityId Capability ID
   * @returns Capability instance
   */
  getCapability(capabilityId: string): any {
    return this.pluginManager.getCapability(capabilityId);
  }
  
  /**
   * Use a capability on a character
   * @param characterId Character ID
   * @param capabilityId Capability ID
   * @param method Method to call on the capability
   * @param args Arguments to pass to the method
   * @returns Result of calling the method
   */
  useCapability(
    characterId: number,
    capabilityId: string,
    method: string,
    ...args: any[]
  ): any {
    const entity = this.getCharacter(characterId);
    if (!entity) {
      throw new Error(`Character not loaded: ${characterId}`);
    }
    
    const capability = this.pluginManager.getCapability(capabilityId);
    if (!capability) {
      throw new Error(`Capability not found: ${capabilityId}`);
    }
    
    if (typeof capability[method] !== 'function') {
      throw new Error(`Method not found on capability ${capabilityId}: ${method}`);
    }
    
    // Call the method on the capability
    return capability[method](entity, ...args);
  }
  
  /**
   * Save a character to the database
   * @param characterId Character ID
   * @returns Whether the save was successful
   */
  async saveCharacter(characterId: number): Promise<boolean> {
    logger.info(`Saving character: ${characterId}`);
    
    const entity = this.getCharacter(characterId);
    if (!entity) {
      logger.warn(`Character not loaded: ${characterId}`);
      return false;
    }
    
    // For now, just update HP as an example
    try {
      const currentHp = entity.properties.character?.current_hp || 0;
      const result = await this.dbAPI.updateCharacterHP(characterId, currentHp);
      
      logger.info(`Character saved: ${characterId}`);
      return result;
    } catch (error) {
      logger.error(`Failed to save character: ${characterId}`, error);
      return false;
    }
  }
  
  /**
   * Set up database watchers for a character
   * @param characterId Character ID
   */
  watchCharacter(characterId: number): void {
    logger.info(`Setting up watchers for character: ${characterId}`);
    
    // Watch for changes to the character's core data
    this.dbAPI.watchCharacterCore(characterId, (type, row) => {
      if (type === 'UPDATE' && row) {
        logger.debug(`Character core data updated: ${characterId}`);
        
        // Update the entity's character data
        const entity = this.getCharacter(characterId);
        if (entity) {
          entity.properties.character = {
            ...entity.properties.character,
            ...row
          };
          entity.metadata.updatedAt = Date.now();
        }
      }
    });
    
    // Watch for changes to the character's skill ranks
    this.dbAPI.watchCharacterSkillRanks(characterId, (type, row) => {
      if (row) {
        const entity = this.getCharacter(characterId);
        if (!entity) return;
        
        const skillCapability = this.pluginManager.getCapability('skill') as any;
        if (!skillCapability) return;
        
        if (type === 'INSERT') {
          // Increment skill rank
          const skillId = row.skill_id;
          const currentRanks = skillCapability.getSkillRanks(entity, skillId);
          skillCapability.setSkillRanks(entity, skillId, currentRanks + 1);
        } else if (type === 'DELETE') {
          // Decrement skill rank
          const skillId = row.skill_id;
          const currentRanks = skillCapability.getSkillRanks(entity, skillId);
          if (currentRanks > 0) {
            skillCapability.setSkillRanks(entity, skillId, currentRanks - 1);
          }
        }
      }
    });
    
    // TODO: Set up watchers for other character data (feats, abilities, etc.)
  }
  
  /**
   * Clean up resources
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down Unix game system...');
    
    // Stop all database watchers
    this.dbAPI.stopAllWatchers();
    
    // Shut down plugin manager
    await this.pluginManager.shutdown();
    
    logger.info('Unix game system shut down');
  }
}