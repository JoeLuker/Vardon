/**
 * Application Initializer
 * 
 * This file provides the entry point for initializing the application following Unix principles:
 * - Resources are managed through a filesystem
 * - Capabilities are mounted as devices
 * - Components access resources through file descriptors
 * - Explicit initialization of resources at mount time
 */

import { GameKernel } from './kernel/GameKernel';
import { createBonusCapability } from './capabilities/bonus';
import { createAbilityCapability } from './capabilities/ability';
import type { AbilityCapability } from './capabilities/ability';
import type { BonusCapability } from './capabilities/bonus';
import { createSkillCapability } from './capabilities/skill';
import { createCombatCapability } from './capabilities/combat';
import { createConditionCapability } from './capabilities/condition';
import { EventBus } from './kernel/EventBus';
// SampleCharacters import removed
import { supabase } from '$lib/db/supabaseClient';
import { GameRulesAPI } from '$lib/db/gameRules.api';
import type { Capability, Entity } from './kernel/types';
import { OpenMode, ErrorCode } from './kernel/types';
import { CharacterStore } from './state/data/CharacterStore';
import { CalculationExplainer } from './introspection/CalculationExplainer';
import { createPluginManager, type PluginManager } from './plugins/PluginManagerComposed';
import { FeatureToPluginMigrator } from './plugins/migration/FeatureToPluginMigrator';
import { GameAPI } from './core/GameAPI';
import { PluginLoader } from './plugins/PluginLoader';
import { FeatureLoader, FEATURE_PATHS } from './features/FeatureLoader';

// Feature imports for migration
import { SkillFocusFeature } from './features/feats/SkillFocusFeature';
import { PowerAttackFeature } from './features/feats/PowerAttackFeature';
import { WeaponFocusFeature } from './features/feats/WeaponFocusFeature';
import { DodgeFeature } from './features/feats/DodgeFeature';
import { ToughnessFeature } from './features/feats/ToughnessFeature';
import { ImprovedUnarmedStrikeFeature } from './features/feats/ImprovedUnarmedStrikeFeature';
import { BarbarianRageFeature } from './features/classes/BarbarianRageFeature';
import { ChannelEnergyFeature } from './features/classes/ChannelEnergyFeature';
import { SneakAttackFeature } from './features/classes/SneakAttackFeature';
import { KineticBlastFeature } from './features/classes/KineticBlastFeature';
import { AllureFeature } from './features/corruptions/AllureFeature';

// Application configuration
const APP_CONFIG = {
  debug: true,
  loadAdditionalCapabilities: true,
  useFeatureMigration: true
};

/**
 * Device paths for mounting capabilities
 */
export const DEVICE_PATHS = {
  ABILITY: '/dev/ability',
  BONUS: '/dev/bonus',
  SKILL: '/dev/skill',
  COMBAT: '/dev/combat',
  CONDITION: '/dev/condition',
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
  featureLoader: FeatureLoader;
  gameAPI: GameAPI;
  dbAPI: GameRulesAPI;
  calculationExplainer: CalculationExplainer;
  characterStore: CharacterStore;
  migrator: FeatureToPluginMigrator;
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
  
  // Create event bus
  const eventBus = new EventBus(debug);
  
  // Create kernel with event bus
  const kernel = new GameKernel({ 
    eventEmitter: eventBus,
    debug
  });
  
  // Create DB API
  const dbAPI = gameData?.gameAPI || new GameRulesAPI(supabase);
  
  // Track capabilities for easier access
  const capabilities = new Map<string, Capability>();
  
  // Mount capabilities as device drivers in the filesystem
  
  // 1. Bonus capability is a core capability with no dependencies
  // Using the composition-based Unix-style implementation
  const bonusCapability = createBonusCapability({ debug });
  kernel.registerCapability(bonusCapability.id, bonusCapability);
  capabilities.set(bonusCapability.id, bonusCapability);
  
  // 2. Ability capability depends on Bonus
  // Get the bonus capability directly from the mounted device
  const bonusCapabilityInstance = kernel.getCapability('bonus') as BonusCapability;
  const abilityCapability = createAbilityCapability(
    bonusCapabilityInstance, 
    { debug }
  );
  kernel.registerCapability(abilityCapability.id, abilityCapability);
  capabilities.set(abilityCapability.id, abilityCapability);
  
  // 3. Skill capability depends on Ability and Bonus
  // Get dependency capabilities directly from mounted devices
  // Using the composition-based Unix-style implementation
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
  
  // 4. Combat capability depends on Ability and Bonus
  // Get dependency capabilities directly from mounted devices
  // Using the composition-based Unix-style implementation
  const combatCapability = createCombatCapability(
    kernel.getCapability('ability') as AbilityCapability,
    kernel.getCapability('bonus') as BonusCapability,
    { debug }
  );
  kernel.registerCapability(combatCapability.id, combatCapability);
  capabilities.set(combatCapability.id, combatCapability);
  
  // 5. Condition capability depends on Bonus
  // Get the bonus capability directly from the mounted device
  // Using the composition-based Unix-style implementation
  const conditionCapability = createConditionCapability(
    kernel.getCapability('bonus') as BonusCapability,
    { debug }
  );
  kernel.registerCapability(conditionCapability.id, conditionCapability);
  capabilities.set(conditionCapability.id, conditionCapability);
  
  // TODO: Add more capabilities
  // - Spellcasting capability
  // - Prerequisite capability
  
  // Create a feature migrator to convert features to plugins
  const migrator = new FeatureToPluginMigrator({ debug });
  
  // Initialize the feature loader with kernel
  const featureLoader = new FeatureLoader(kernel, debug);
  
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
  
  // Initialize file system structure for features
  if (!kernel.exists(FEATURE_PATHS.FEATURES_DIR)) {
    kernel.mkdir(FEATURE_PATHS.FEATURES_DIR);
  }
  
  // Migrate features to plugins
  const features = [
    SkillFocusFeature,
    PowerAttackFeature,
    WeaponFocusFeature,
    DodgeFeature,
    ToughnessFeature,
    ImprovedUnarmedStrikeFeature,
    BarbarianRageFeature,
    ChannelEnergyFeature,
    SneakAttackFeature,
    KineticBlastFeature,
    AllureFeature
  ];
  
  // Register all features with the feature loader
  for (const feature of features) {
    try {
      // Register feature in the filesystem
      featureLoader.registerFeature(feature);
      
      // Migrate to plugin and register
      const plugin = migrator.migrateFeature(feature);
      kernel.registerPlugin(plugin);
      
      if (debug) {
        console.log(`Migrated feature ${feature.id} to plugin ${plugin.id}`);
      }
    } catch (error) {
      console.error(`Failed to migrate feature ${feature.id}:`, error);
    }
  }
  
  // Sample character loading removed
  
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
      
      // Create entity from raw character data
      const entity: Entity = {
        id: entityId,
        type: 'character',
        name: rawCharacter.name || `Character ${characterId}`,
        properties: {
          // Basic properties
          id: rawCharacter.id,
          name: rawCharacter.name,
          max_hp: rawCharacter.max_hp,
          current_hp: rawCharacter.current_hp,
          
          // Character-specific data
          rawData: rawCharacter,
          abilities: {}, // Will be populated by the ability capability
          skills: {}, // Will be populated by the skill capability
          
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
      
      // Any other cleanup tasks can go here
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
    featureLoader,
    gameAPI,
    dbAPI,
    calculationExplainer,
    characterStore,
    migrator,
    capabilities,
    loadCharacter,
    shutdown
  };
}