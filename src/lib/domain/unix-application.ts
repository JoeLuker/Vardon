/**
 * Unix Application
 * 
 * This module initializes the application using the Unix architecture.
 * It follows the philosophy of small, focused components with explicit dependencies.
 */

import { supabase } from '$lib/db/supabaseClient';
import { UnixGameAPI } from './core/UnixGameAPI';
import { GameKernel } from './kernel/GameKernel';
import { SampleCharacters } from './config/SampleCharacters';
import { Entity } from './kernel/types';

/**
 * Initialize the application using the Unix architecture
 * @param options Initialization options
 * @returns Initialized application components
 */
export async function initializeUnixApplication(options: { debug?: boolean } = {}) {
  console.log('Initializing application with Unix architecture...');
  
  // Enable debug logging by default in development
  const debug = options.debug ?? true;
  
  // Create the Unix Game API
  const gameAPI = new UnixGameAPI(supabase, { debug });
  
  // Create a kernel for direct access if needed
  const kernel = new GameKernel({ debug });
  
  // Load sample characters for testing
  const sampleCharacterData = {
    fighter: SampleCharacters.getFighter(),
    rogue: SampleCharacters.getRogue(),
    barbarian: SampleCharacters.getBarbarian(),
    cleric: SampleCharacters.getCleric(),
    multiclass: SampleCharacters.getMulticlass()
  };
  
  // Convert sample character data to entities
  const sampleCharacters: Record<string, Entity> = {};
  for (const [key, character] of Object.entries(sampleCharacterData)) {
    const entity: Entity = {
      id: `sample-${key}`,
      type: 'character',
      name: character.name || `Sample ${key.charAt(0).toUpperCase() + key.slice(1)}`,
      properties: {
        character,
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
    
    sampleCharacters[key] = entity;
    
    // Initialize entity with all capabilities
    try {
      // Apply Power Attack to fighter and barbarian
      if (['fighter', 'barbarian'].includes(key)) {
        await gameAPI.applyPlugin(parseInt(character.id), 'power_attack', { penalty: 1 });
      }
      
      console.log(`Character ${entity.name} initialized successfully`);
    } catch (error) {
      console.error(`Error initializing character ${entity.name}:`, error);
    }
  }
  
  console.log('Loaded sample characters:', Object.keys(sampleCharacters));
  
  /**
   * Load a character from the database
   * @param characterId Character ID
   * @returns Loaded character entity
   */
  async function loadCharacter(characterId: number): Promise<Entity | null> {
    try {
      return await gameAPI.loadCharacter(characterId);
    } catch (error) {
      console.error(`Failed to load character ${characterId}:`, error);
      return null;
    }
  }
  
  /**
   * Shut down the application and clean up resources
   */
  async function shutdown() {
    console.log('Shutting down application...');
    
    try {
      await gameAPI.shutdown();
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
    
    console.log('Application shut down');
  }
  
  return {
    gameAPI,
    kernel,
    sampleCharacters,
    loadCharacter,
    shutdown
  };
}