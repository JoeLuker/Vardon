/**
 * Application Initializer (Simplified Post-Migration)
 * 
 * This file provides the entry point for initializing the application following Unix principles:
 * - Resources are managed through a filesystem
 * - Capabilities are mounted as devices
 * - Components access resources through file descriptors
 * - Explicit initialization of resources at mount time
 * 
 * After completing the feature-to-plugin migration, this simplified version
 * only uses the plugin system and no longer needs the feature system.
 */

import { GameKernel } from '../src/lib/domain/kernel/GameKernel';
import { createBonusCapability } from '../src/lib/domain/capabilities/bonus';
import { createAbilityCapability } from '../src/lib/domain/capabilities/ability';
import type { AbilityCapability } from '../src/lib/domain/capabilities/ability';
import type { BonusCapability } from '../src/lib/domain/capabilities/bonus';
import { createSkillCapability } from '../src/lib/domain/capabilities/skill';
import { createCombatCapability } from '../src/lib/domain/capabilities/combat';
import { createConditionCapability } from '../src/lib/domain/capabilities/condition';
import { createDatabaseCapability } from '../src/lib/domain/capabilities/database';
import { EventBus } from '../src/lib/domain/kernel/EventBus';
import { supabase } from '../src/lib/db/supabaseClient';
import { GameRulesAPI } from '../src/lib/db';
import type { Capability, Entity } from '../src/lib/domain/kernel/types';
import { OpenMode, ErrorCode } from '../src/lib/domain/kernel/types';
import { CharacterStore } from '../src/lib/domain/state/data/CharacterStore';
import { CalculationExplainer } from '../src/lib/domain/introspection/CalculationExplainer';
import { createPluginManager, type PluginManager } from '../src/lib/domain/plugins/PluginManagerComposed';
import { GameAPI } from '../src/lib/domain/core/GameAPI';
import { PluginLoader } from '../src/lib/domain/plugins/PluginLoader';
import { extractAbilityScores, ABILITY_ID_MAPPING } from '../src/lib/domain/utils/DatabaseMappings';

// Application configuration
const APP_CONFIG = {
  debug: true,
  loadAdditionalCapabilities: true
};

/**
 * Cache for ability mappings from the database
 */
let abilityIdToNameCache: Record<number, string> | null = null;

/**
 * Get ability mappings from database, using cache if available
 * @param dbAPI GameRulesAPI instance
 * @returns Mapping of ability IDs to ability names
 */
async function getAbilityMappings(dbAPI: GameRulesAPI): Promise<Record<number, string>> {
  // Return from cache if already loaded
  if (abilityIdToNameCache !== null) {
    return abilityIdToNameCache;
  }
  
  try {
    // Query all abilities from the database
    const abilities = await dbAPI.getAllAbility();
    
    // Create mapping from ID to ability name
    const mapping: Record<number, string> = {};
    for (const ability of abilities) {
      mapping[ability.id] = ability.name;
    }
    
    // Store in cache for future use
    abilityIdToNameCache = mapping;
    console.log('Loaded ability mappings from database:', mapping);
    
    return mapping;
  } catch (error) {
    console.error('Failed to load ability mappings from database:', error);
    
    // Fallback to hardcoded values only if database query fails
    return {
      401: 'strength',
      402: 'dexterity',
      403: 'constitution',
      404: 'intelligence',
      405: 'wisdom',
      406: 'charisma'
    };
  }
}

/**
 * Helper function to initialize ability scores from character data
 * @param rawCharacter Raw character data from database
 * @param abilityMapping Mapping of ability IDs to names
 * @param debug Whether to enable debug logging
 * @returns Object with ability scores
 */
function initializeAbilitiesFromCharacter(
  rawCharacter: any, 
  abilityMapping: Record<number, string> = ABILITY_ID_MAPPING,
  debug: boolean = false
): Record<string, number> {
  // Log the first entry for debugging
  if (rawCharacter.game_character_ability && 
      Array.isArray(rawCharacter.game_character_ability) && 
      rawCharacter.game_character_ability.length > 0 && 
      debug) {
    console.log("Sample ability entry format:", rawCharacter.game_character_ability[0]);
  }
  
  // Use the centralized utility to extract ability scores
  return extractAbilityScores(rawCharacter.game_character_ability);
}

/**
 * Device paths for mounting capabilities
 */
export const DEVICE_PATHS = {
  ABILITY: '/dev/ability',
  BONUS: '/dev/bonus',
  SKILL: '/dev/skill',
  COMBAT: '/dev/combat',
  CONDITION: '/dev/condition',
  DATABASE: '/dev/database',
  SPELL: '/dev/spell',
  PREREQUISITE: '/dev/prereq'
};

/**
 * Application interface
 */
export interface Application {
  kernel: GameKernel;
  pluginManager: PluginManager;
  pluginLoader: PluginLoader;
  gameAPI: GameAPI;
  dbAPI: GameRulesAPI;
  calculationExplainer: CalculationExplainer;
  characterStore: CharacterStore;
  capabilities: Map<string, Capability>;
  loadCharacter?: (characterId: number) => Promise<Entity | null>;
  shutdown?: () => Promise<void>;
}

/**
 * Initialize the application
 * @param options Initialization options
 * @returns The initialized application components
 */
export async function initializeApplication(options: { gameData?: any, debug?: boolean } = {}): Promise<Application> {
  console.log('Initializing application...');
  
  // Enable debug logging by default in development
  const debug = options.debug ?? APP_CONFIG.debug;
  const gameData = options.gameData;
  
  // Create event bus with optimizations
  const eventBus = new EventBus(debug && false); // Set to true for debugging, false for performance
  
  // Create kernel with event bus and performance optimizations
  const kernel = new GameKernel({ 
    eventEmitter: eventBus,
    debug,
    noFsEvents: true // Enable filesystem event optimization
  });
  
  // Create DB API - Use the consolidated GameRulesAPI
  const dbAPI = gameData?.gameAPI || new GameRulesAPI(supabase, { debug });
  
  // Track capabilities for easier access
  const capabilities = new Map<string, Capability>();
  
  // Mount capabilities as device drivers in the filesystem
  
  // 1. Database capability has no dependencies and should be mounted first
  const databaseCapability = createDatabaseCapability({ debug });
  kernel.registerCapability(databaseCapability.id, databaseCapability);
  capabilities.set(databaseCapability.id, databaseCapability);
  
  // 2. Bonus capability is a core capability with no dependencies
  const bonusCapability = createBonusCapability({ debug });
  kernel.registerCapability(bonusCapability.id, bonusCapability);
  capabilities.set(bonusCapability.id, bonusCapability);
  
  // 3. Ability capability depends on Bonus
  const bonusCapabilityInstance = kernel.getCapability('bonus') as BonusCapability;
  const abilityCapability = createAbilityCapability(
    bonusCapabilityInstance, 
    { debug }
  );
  kernel.registerCapability(abilityCapability.id, abilityCapability);
  capabilities.set(abilityCapability.id, abilityCapability);
  
  // 4. Skill capability depends on Ability and Bonus
  const skillCapability = createSkillCapability(
    kernel.getCapability('ability') as AbilityCapability,
    kernel.getCapability('bonus') as BonusCapability,
    { 
      skills: gameData?.skills || [],
      debug 
    }
  );
  kernel.registerCapability(skillCapability.id, skillCapability);
  capabilities.set(skillCapability.id, skillCapability);
  
  // 5. Combat capability depends on Ability and Bonus
  const combatCapability = createCombatCapability(
    kernel.getCapability('ability') as AbilityCapability,
    kernel.getCapability('bonus') as BonusCapability,
    { debug }
  );
  kernel.registerCapability(combatCapability.id, combatCapability);
  capabilities.set(combatCapability.id, combatCapability);
  
  // 6. Condition capability depends on Bonus
  const conditionCapability = createConditionCapability(
    kernel.getCapability('bonus') as BonusCapability,
    { debug }
  );
  kernel.registerCapability(conditionCapability.id, conditionCapability);
  capabilities.set(conditionCapability.id, conditionCapability);
  
  // Initialize the plugin loader with kernel
  const pluginLoader = new PluginLoader(kernel, debug);
  
  // Create plugin manager (like process manager in Unix using composition)
  const pluginManager = createPluginManager({ debug, kernel });
  
  // Create character store with database integration
  const characterStore = new CharacterStore(dbAPI);
  
  // Create calculation explainer
  const calculationExplainer = new CalculationExplainer(
    null as any, // abilitySubsystem
    null as any, // skillSubsystem
    null as any, // bonusSubsystem
    null as any  // combatSubsystem
  );
  
  // Create the Game API
  const gameAPI = new GameAPI(kernel, pluginManager, dbAPI, { debug });
  
  /**
   * Load a character from the database using Unix filesystem approach
   * @param characterId Character ID
   * @returns Loaded character entity
   */
  async function loadCharacter(characterId: number): Promise<Entity | null> {
    try {
      if (debug) {
        console.log(`Loading character: ${characterId}`);
      }
      
      // Create entity ID for the character
      const entityId = `character-${characterId}`;
      const entityPath = `/entity/${entityId}`;
      
      // Check if entity already exists
      if (kernel.exists(entityPath)) {
        if (debug) {
          console.log(`Character ${characterId} already exists, opening...`);
        }
        
        // Open the entity file
        const fd = kernel.open(entityPath, OpenMode.READ);
        if (fd < 0) {
          console.error(`Failed to open entity file: ${entityPath}`);
          return null;
        }
        
        try {
          // Read entity data
          const [result, entity] = kernel.read(fd);
          
          if (result === 0) {
            if (debug) {
              console.log(`Successfully read entity: ${entity.name}`);
            }
            return entity as Entity;
          } else {
            console.error(`Failed to read entity: ${entityPath}, error code: ${result}`);
            return null;
          }
        } finally {
          // Always close file descriptor
          kernel.close(fd);
        }
      }
      
      // Entity doesn't exist, load from database
      const rawCharacter = await dbAPI.getCompleteCharacterData(characterId);
      
      if (!rawCharacter) {
        console.error(`Character not found in database: ${characterId}`);
        return null;
      }
      
      // Get ability mappings from database
      const abilityMapping = await getAbilityMappings(dbAPI);
      
      // Create entity from raw character data
      const entity: Entity = {
        id: entityId,
        type: 'character',
        name: rawCharacter.name || `Character ${characterId}`,
        properties: {
          // Basic properties
          id: rawCharacter.id,
          name: rawCharacter.name,
          max_hp: rawCharacter.max_hp || 0,
          current_hp: rawCharacter.current_hp || 0,
          
          // Character-specific data
          rawData: rawCharacter,
          
          // Initialize ability scores from game_character_ability data using DB mappings
          abilities: initializeAbilitiesFromCharacter(rawCharacter, abilityMapping, debug),
          
          // Skills will be populated by the skill capability
          skills: {}, 
          
          // Class and ancestry
          classes: rawCharacter.game_character_class?.map(cls => ({
            id: cls.class_id,
            name: cls.class?.name,
            level: cls.level
          })) || [],
          
          ancestry: rawCharacter.game_character_ancestry?.[0]?.ancestry?.name || 'Unknown',
          
          // Features, feats, etc.
          classFeatures: rawCharacter.game_character_class_feature || [],
          feats: rawCharacter.game_character_feat || [],
          spells: rawCharacter.game_character_spell || [],
          corruptions: rawCharacter.game_character_corruption || [],
          
          // Calculated later
          ac: 10,
          bab: 0
        },
        metadata: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: 1
        }
      };
      
      // Create entity file in the filesystem
      const createResult = kernel.create(entityPath, entity);
      if (!createResult.success) {
        console.error(`Failed to create entity file: ${entityPath}, error: ${createResult.errorMessage}`);
        return null;
      }
      
      // Initialize character with capabilities through file operations
      await initializeCharacterWithCapabilities(entityId);
      
      // Read the final entity after initialization
      const fd = kernel.open(entityPath, OpenMode.READ);
      if (fd < 0) {
        console.error(`Failed to open entity file after initialization: ${entityPath}`);
        return null;
      }
      
      try {
        // Read entity data after initialization
        const [result, updatedEntity] = kernel.read(fd);
        
        if (result === 0) {
          if (debug) {
            console.log(`Character ${characterId} loaded successfully: ${(updatedEntity as Entity).name}`);
          }
          return updatedEntity as Entity;
        } else {
          console.error(`Failed to read entity after initialization: ${entityPath}, error code: ${result}`);
          return null;
        }
      } finally {
        // Always close file descriptor
        kernel.close(fd);
      }
    } catch (error) {
      console.error(`Failed to load character ${characterId}:`, error);
      return null;
    }
  }
  
  /**
   * Initialize character using capabilities through file operations
   * @param entityId Character entity ID
   */
  async function initializeCharacterWithCapabilities(entityId: string): Promise<void> {
    if (debug) {
      console.log(`Initializing character: ${entityId}`);
    }
    
    try {
      // Path to the entity file
      const entityPath = `/entity/${entityId}`;
      
      // Check if entity exists
      if (!kernel.exists(entityPath)) {
        throw new Error(`Entity not found: ${entityPath}`);
      }
      
      // Open the entity file with read-write access
      const entityFd = kernel.open(entityPath, OpenMode.READ_WRITE);
      if (entityFd < 0) {
        throw new Error(`Failed to open entity: ${entityPath}`);
      }
      
      try {
        // 0. Initialize database capability first
        const databaseDeviceFd = kernel.open(DEVICE_PATHS.DATABASE, OpenMode.READ_WRITE);
        if (databaseDeviceFd >= 0) {
          try {
            // Pass entity path to the capability as initialization parameter
            const initParams = { entityPath, operation: 'initialize' };
            const initResult = kernel.ioctl(databaseDeviceFd, 0, initParams);
            
            if (initResult !== 0) {
              console.error(`Failed to initialize database: error code ${initResult}`);
            }
          } finally {
            // Always close the file descriptor
            kernel.close(databaseDeviceFd);
          }
        }
      
        // 1. Initialize ability scores through device file
        const abilityDeviceFd = kernel.open(DEVICE_PATHS.ABILITY, OpenMode.READ_WRITE);
        if (abilityDeviceFd >= 0) {
          try {
            // Pass entity path to the capability as initialization parameter
            const initParams = { entityPath, operation: 'initialize' };
            const initResult = kernel.ioctl(abilityDeviceFd, 0, initParams);
            
            if (initResult !== 0) {
              console.error(`Failed to initialize abilities: error code ${initResult}`);
            }
          } finally {
            // Always close the file descriptor
            kernel.close(abilityDeviceFd);
          }
        }
        
        // 2. Initialize skills through device file
        const skillDeviceFd = kernel.open(DEVICE_PATHS.SKILL, OpenMode.READ_WRITE);
        if (skillDeviceFd >= 0) {
          try {
            // Pass entity path to the capability as initialization parameter
            const initParams = { entityPath, operation: 'initialize' };
            const initResult = kernel.ioctl(skillDeviceFd, 0, initParams);
            
            if (initResult !== 0) {
              console.error(`Failed to initialize skills: error code ${initResult}`);
            }
          } finally {
            // Always close the file descriptor
            kernel.close(skillDeviceFd);
          }
        }
        
        // 3. Initialize combat stats through device file
        const combatDeviceFd = kernel.open(DEVICE_PATHS.COMBAT, OpenMode.READ_WRITE);
        if (combatDeviceFd >= 0) {
          try {
            // Pass entity path to the capability as initialization parameter
            const initParams = { entityPath, operation: 'initialize' };
            const initResult = kernel.ioctl(combatDeviceFd, 0, initParams);
            
            if (initResult !== 0) {
              console.error(`Failed to initialize combat stats: error code ${initResult}`);
            }
          } finally {
            // Always close the file descriptor
            kernel.close(combatDeviceFd);
          }
        }
        
        // 4. Initialize conditions through device file
        const conditionDeviceFd = kernel.open(DEVICE_PATHS.CONDITION, OpenMode.READ_WRITE);
        if (conditionDeviceFd >= 0) {
          try {
            // Pass entity path to the capability as initialization parameter
            const initParams = { entityPath, operation: 'initialize' };
            const initResult = kernel.ioctl(conditionDeviceFd, 0, initParams);
            
            if (initResult !== 0) {
              console.error(`Failed to initialize conditions: error code ${initResult}`);
            }
          } finally {
            // Always close the file descriptor
            kernel.close(conditionDeviceFd);
          }
        }
        
        // 5. Apply ABP bonuses from character data
        await applyABPBonuses(entityId);
        
        // Note: Feature application should be done through plugins via gameAPI.applyPlugin()
        // after the character is loaded, not during initialization
        
        if (debug) {
          console.log(`Character initialization completed: ${entityId}`);
        }
      } finally {
        // Always close the entity file descriptor
        kernel.close(entityFd);
      }
    } catch (error) {
      console.error(`Error initializing character ${entityId}:`, error);
      throw error;
    }
  }

  /**
   * Apply Automatic Bonus Progression (ABP) bonuses to a character
   * @param entityId Character entity ID
   */
  async function applyABPBonuses(entityId: string): Promise<void> {
    // Extract numeric character ID from entity ID
    const characterIdMatch = entityId.match(/character-(\d+)/);
    if (!characterIdMatch) {
      console.warn(`Unable to extract character ID from entity ID: ${entityId}`);
      return;
    }
    
    const characterId = parseInt(characterIdMatch[1], 10);
    if (isNaN(characterId)) {
      console.warn(`Invalid character ID extracted from entity ID: ${entityId}`);
      return;
    }
    
    try {
      if (debug) {
        console.log(`Applying ABP bonuses for character: ${characterId}`);
      }
      
      // Get character data from the database
      const characterData = await dbAPI.getCompleteCharacterData(characterId);
      if (!characterData) {
        console.warn(`Character data not found for ID: ${characterId}`);
        return;
      }
      
      // Check if character has ABP choices
      const abpChoices = characterData.game_character_abp_choice;
      if (!abpChoices || abpChoices.length === 0) {
        if (debug) {
          console.log(`No ABP choices found for character: ${characterId}`);
        }
        return;
      }
      
      // Open the entity file
      const entityPath = `/entity/${entityId}`;
      const entityFd = kernel.open(entityPath, OpenMode.READ_WRITE);
      if (entityFd < 0) {
        console.error(`Failed to open entity file: ${entityPath}`);
        return;
      }
      
      try {
        // Read entity data
        const [readResult, entity] = kernel.read(entityFd);
        if (readResult !== 0) {
          console.error(`Failed to read entity: ${readResult}`);
          return;
        }
        
        // Get the bonus device
        const bonusDeviceFd = kernel.open(DEVICE_PATHS.BONUS, OpenMode.READ_WRITE);
        if (bonusDeviceFd < 0) {
          console.error(`Failed to open bonus device: ${DEVICE_PATHS.BONUS}`);
          return;
        }
        
        try {
          // Process each ABP choice
          for (const abpChoice of abpChoices) {
            if (!abpChoice.node) continue;
            
            const node = abpChoice.node;
            const nodeName = node.name || 'ABP Node';
            
            // Process bonuses for the node
            if (node.bonuses && node.bonuses.length > 0) {
              for (const bonus of node.bonuses) {
                if (!bonus.target_specifier || !bonus.bonus_type) continue;
                
                const target = bonus.target_specifier.name || ''; 
                const value = bonus.value || 0;
                const type = bonus.bonus_type.name || 'enhancement';
                const source = `ABP: ${nodeName}`;
                
                // Apply the bonus via IOCTL
                const params = {
                  entityPath,
                  operation: 'addBonus',
                  target,
                  value,
                  type,
                  source
                };
                
                const result = kernel.ioctl(bonusDeviceFd, 0, params);
                
                if (result !== 0) {
                  console.error(`Failed to apply ABP bonus: ${result}`);
                }
                
                if (debug) {
                  console.log(`Applied ABP bonus: ${source} (+${value} ${type} to ${target})`);
                }
              }
            }
          }
          
          // Write the updated entity back
          const writeResult = kernel.write(entityFd, entity);
          if (writeResult !== 0) {
            console.error(`Failed to write entity after applying ABP bonuses: ${writeResult}`);
          }
        } finally {
          // Close the bonus device
          kernel.close(bonusDeviceFd);
        }
      } finally {
        // Close the entity file
        kernel.close(entityFd);
      }
      
      if (debug) {
        console.log(`Successfully applied ABP bonuses for character: ${characterId}`);
      }
    } catch (error) {
      console.error(`Error applying ABP bonuses for character ${characterId}:`, error);
    }
  }
  
  /**
   * Shut down the application and clean up resources
   * Using proper Unix-style resource cleanup
   */
  async function shutdown() {
    console.log('Shutting down application...');
    
    try {
      // Shutdown plugin manager first (it depends on kernel)
      await pluginManager.shutdown();
      
      // Shutdown kernel - this will:
      // 1. Close all open file descriptors
      // 2. Unmount all device drivers (capabilities)
      // 3. Clean up the filesystem
      await kernel.shutdown();
      
      // Shutdown the DB API if it has a shutdown method
      if (typeof dbAPI.shutdown === 'function') {
        try {
          await dbAPI.shutdown();
          if (debug) {
            console.log('DB API shutdown complete');
          }
        } catch (dbApiError) {
          console.error('Error shutting down DB API:', dbApiError);
        }
      }
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
    
    console.log('Application shut down');
  }
  
  console.log('Application initialized successfully');
  
  return {
    kernel,
    pluginManager,
    pluginLoader,
    gameAPI,
    dbAPI,
    calculationExplainer,
    characterStore,
    capabilities,
    loadCharacter,
    shutdown
  };
}