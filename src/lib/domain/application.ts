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
import { BonusCapabilityProvider } from './capabilities/bonus/BonusCapabilityProvider';
import { AbilityCapabilityProvider } from './capabilities/ability/AbilityCapabilityProvider';
import { SkillCapabilityProvider } from './capabilities/skill/SkillCapabilityProvider';
import { CombatCapabilityProvider } from './capabilities/combat/CombatCapabilityProvider';
import { ConditionCapabilityProvider } from './capabilities/condition/ConditionCapabilityProvider';
import { EventBus } from './kernel/EventBus';
import { SampleCharacters } from './config/SampleCharacters';
import { supabase } from '$lib/db/supabaseClient';
import { GameRulesAPI } from '$lib/db/gameRules.api';
import type { Capability, Entity, OpenMode, ErrorCode } from './kernel/types';
import { CharacterStore } from './state/data/CharacterStore';
import { CalculationExplainer } from './introspection/CalculationExplainer';
import { PluginManager } from './plugins/PluginManager';
import { FeatureToPluginMigrator } from './plugins/migration/FeatureToPluginMigrator';
import { GameAPI } from './core/GameAPI';

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
 * Application interface
 */
export interface Application {
  kernel: GameKernel;
  pluginManager: PluginManager;
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
  const bonusCapability = new BonusCapabilityProvider({ debug });
  const bonusDevicePath = `/dev/${bonusCapability.id}`;
  kernel.mount(bonusDevicePath, bonusCapability);
  capabilities.set(bonusCapability.id, bonusCapability);
  
  // 2. Ability capability depends on Bonus
  const abilityCapability = new AbilityCapabilityProvider(bonusCapability, { debug });
  const abilityDevicePath = `/dev/${abilityCapability.id}`;
  kernel.mount(abilityDevicePath, abilityCapability);
  capabilities.set(abilityCapability.id, abilityCapability);
  
  // 3. Skill capability depends on Ability and Bonus
  const skillCapability = new SkillCapabilityProvider(abilityCapability, bonusCapability, { 
    skills: gameData?.skills || [],
    debug 
  });
  const skillDevicePath = `/dev/${skillCapability.id}`;
  kernel.mount(skillDevicePath, skillCapability);
  capabilities.set(skillCapability.id, skillCapability);
  
  // 4. Combat capability depends on Ability and Bonus
  const combatCapability = new CombatCapabilityProvider(abilityCapability, bonusCapability, { debug });
  const combatDevicePath = `/dev/${combatCapability.id}`;
  kernel.mount(combatDevicePath, combatCapability);
  capabilities.set(combatCapability.id, combatCapability);
  
  // 5. Condition capability depends on Bonus
  const conditionCapability = new ConditionCapabilityProvider(bonusCapability, { debug });
  const conditionDevicePath = `/dev/${conditionCapability.id}`;
  kernel.mount(conditionDevicePath, conditionCapability);
  capabilities.set(conditionCapability.id, conditionCapability);
  
  // TODO: Add more capabilities
  // - Spellcasting capability
  // - Prerequisite capability
  
  // Create a feature migrator to convert features to plugins
  const migrator = new FeatureToPluginMigrator({ debug });
  
  // Create plugin manager (like process manager in Unix)
  const pluginManager = new PluginManager({ debug, kernel });
  
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
  
  // Register migrated plugins with the kernel's process management
  for (const feature of features) {
    try {
      const plugin = migrator.migrateFeature(feature);
      kernel.registerPlugin(plugin);
      
      if (debug) {
        console.log(`Migrated feature ${feature.id} to plugin ${plugin.id}`);
      }
    } catch (error) {
      console.error(`Failed to migrate feature ${feature.id}:`, error);
    }
  }
  
  // No sample characters are automatically loaded in production mode
  // Use SampleCharacters.getXXX() methods directly if sample data is needed
  const sampleCharacters: Record<string, Entity> = {};
  
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
        
        // Read entity data
        const entity = {} as Entity;
        const result = kernel.read(fd, entity);
        
        // Close file descriptor
        kernel.close(fd);
        
        if (result === 0) {
          if (debug) {
            console.log(`Successfully read entity: ${entity.name}`);
          }
          return entity;
        } else {
          console.error(`Failed to read entity: ${entityPath}, error code: ${result}`);
          return null;
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
      
      // Initialize character by running necessary plugins
      await initializeCharacterWithPlugins(entityId);
      
      // Read the final entity after initialization
      const fd = kernel.open(entityPath, OpenMode.READ);
      if (fd < 0) {
        console.error(`Failed to open entity file after initialization: ${entityPath}`);
        return null;
      }
      
      // Read entity data after initialization
      const updatedEntity = {} as Entity;
      const result = kernel.read(fd, updatedEntity);
      
      // Close file descriptor
      kernel.close(fd);
      
      if (result === 0) {
        if (debug) {
          console.log(`Character ${characterId} loaded successfully: ${updatedEntity.name}`);
        }
        return updatedEntity;
      } else {
        console.error(`Failed to read entity after initialization: ${entityPath}, error code: ${result}`);
        return null;
      }
    } catch (error) {
      console.error(`Failed to load character ${characterId}:`, error);
      return null;
    }
  }
  
  /**
   * Initialize character by running initialization plugins
   * @param entityId Character entity ID
   */
  async function initializeCharacterWithPlugins(entityId: string): Promise<void> {
    if (debug) {
      console.log(`Initializing character: ${entityId}`);
    }
    
    try {
      // Execute initialization plugins
      // 1. Initialize ability scores
      await kernel.executePlugin('initialize-abilities', entityId);
      
      // 2. Initialize skills
      await kernel.executePlugin('initialize-skills', entityId);
      
      // 3. Initialize combat stats
      await kernel.executePlugin('initialize-combat', entityId);
      
      // 4. Apply feats and class features
      await kernel.executePlugin('apply-feats', entityId);
      await kernel.executePlugin('apply-class-features', entityId);
      
      if (debug) {
        console.log(`Character initialization completed: ${entityId}`);
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