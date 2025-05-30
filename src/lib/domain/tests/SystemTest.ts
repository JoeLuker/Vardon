/**
 * System Test
 *
 * This file tests the full system architecture, including capabilities, plugins,
 * game engine, and application initialization.
 *
 * UPDATED: No longer uses direct supabaseClient import, follows Unix architecture
 */

import { initializeApplication } from '../application';
import { GameRulesAPI } from '$lib/db/gameRules.api';
import type { Entity } from '../kernel/types';
import type { BonusCapability } from '../capabilities/bonus/types';
import type { AbilityCapability } from '../capabilities/ability/types';
import type { SkillCapability } from '../capabilities/skill/types';
import type { CombatCapability } from '../capabilities/combat/types';

// Character ID to test
const TEST_CHARACTER_ID = 1; // Change this to a valid character ID in your database

/**
 * Test the Unix application initialization
 */
async function testApplicationInitialization() {
  console.log('=== Testing Application Initialization ===');

  // Create a direct database API - no longer requires Supabase client
  const dbAPI = new GameRulesAPI();

  // Initialize application
  console.log('Initializing application...');
  const app = await initializeApplication({ gameAPI: dbAPI });
  
  // Check that app was successfully initialized
  console.log('Application initialized successfully.');
  console.log('Available components:');
  Object.keys(app).forEach(key => {
    console.log(`- ${key}`);
  });
  
  return app;
}

/**
 * Test kernel operations
 */
function testKernel(kernel: any) {
  console.log('\n=== Testing Kernel ===');
  
  // Create a test entity
  const testEntity: Entity = {
    id: `test-entity-${Date.now()}`,
    type: 'test',
    name: 'Test Entity',
    properties: {
      testProperty: 'Test Value'
    },
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1
    }
  };
  
  console.log('Registering test entity...');
  kernel.registerEntity(testEntity);
  
  console.log('Getting entity...');
  const retrievedEntity = kernel.getEntity(testEntity.id);
  console.log(`Retrieved entity: ${retrievedEntity.name} (ID: ${retrievedEntity.id})`);
  
  console.log('Testing event system...');
  // Subscribe to entity update events
  const subscriptionId = kernel.events.on('entity:updated', (data: any) => {
    console.log('Entity updated event received:', data);
  });
  
  console.log('Updating entity...');
  kernel.updateEntity(testEntity.id, {
    properties: {
      ...testEntity.properties,
      updatedProperty: 'Updated Value'
    }
  });
  
  // Clean up event subscription
  kernel.events.off(subscriptionId);
  console.log('Event test completed.');
  
  // Test entity removal
  console.log('Removing test entity...');
  kernel.removeEntity(testEntity.id);
  const shouldBeNull = kernel.getEntity(testEntity.id);
  console.log(`Entity removal succeeded: ${shouldBeNull === null || shouldBeNull === undefined}`);
  
  return true;
}

/**
 * Test capabilities
 */
async function testCapabilities(app: any) {
  console.log('\n=== Testing Capabilities ===');
  
  const { kernel, capabilities } = app.unix;
  
  // Create a test entity
  const testEntity: Entity = {
    id: `test-entity-${Date.now()}`,
    type: 'test',
    name: 'Test Entity',
    properties: {
      testProperty: 'Test Value',
      strength: 16,
      dexterity: 14,
      constitution: 12,
      intelligence: 10,
      wisdom: 8,
      charisma: 6
    },
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1
    }
  };
  
  console.log('Registering test entity...');
  kernel.registerEntity(testEntity);
  
  // Test bonus capability
  const bonusCapability = capabilities.get('bonus');
  if (bonusCapability) {
    console.log('\n--- Testing Bonus Capability ---');
    
    // Cast to proper type to avoid 'any'
    const typedBonusCapability = bonusCapability as BonusCapability;
    
    // Add some test bonuses
    typedBonusCapability.addBonus(
      testEntity, 
      'strength',
      2,
      'enhancement',
      'test'
    );
    
    typedBonusCapability.addBonus(
      testEntity, 
      'strength',
      4,
      'morale',
      'test'
    );
    
    // Get calculated value
    const calculatedValue = typedBonusCapability.calculateTotal(testEntity, 'strength');
    console.log(`Calculated strength: ${calculatedValue} (Base: ${testEntity.properties.abilities.strength})`);
    
    // Get bonus breakdown
    const bonuses = typedBonusCapability.getBreakdown(testEntity, 'strength');
    console.log('Bonus breakdown:', bonuses);
  }
  
  // Test ability capability
  const abilityCapability = capabilities.get('ability');
  if (abilityCapability) {
    console.log('\n--- Testing Ability Capability ---');
    
    // Cast to proper type to avoid 'any'
    const typedAbilityCapability = abilityCapability as AbilityCapability;
    
    // Initialize abilities
    typedAbilityCapability.initialize(testEntity);
    
    // Get all abilities
    console.log('Abilities:');
    const standardAbilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
    standardAbilities.forEach(ability => {
      const abilityValue = typedAbilityCapability.getAbilityBreakdown(testEntity, ability);
      console.log(`- ${ability}: ${abilityValue.total} (Modifier: ${abilityValue.modifier})`);
    });
  }
  
  // Test skill capability
  const skillCapability = capabilities.get('skill');
  if (skillCapability) {
    console.log('\n--- Testing Skill Capability ---');
    
    // Cast to proper type to avoid 'any'
    const typedSkillCapability = skillCapability as SkillCapability;
    
    // Initialize skills
    typedSkillCapability.initialize(testEntity);
    
    // Add ranks to a skill
    typedSkillCapability.setSkillRanks(testEntity, 1, 3); // Acrobatics
    
    // Get all skills
    const skills = typedSkillCapability.getAllSkills(testEntity);
    console.log('Skills with ranks:');
    Object.entries(skills).forEach(([_, skill]) => {
      if (skill.ranks > 0) {
        console.log(`- ${skill.skillName}: ${skill.total} (Ranks: ${skill.ranks})`);
      }
    });
  }
  
  // Test combat capability
  const combatCapability = capabilities.get('combat');
  if (combatCapability) {
    console.log('\n--- Testing Combat Capability ---');
    
    // Cast to proper type to avoid 'any'
    // Note: Interface shows entityId as string param, but implementation may expect Entity
    const typedCombatCapability = combatCapability as CombatCapability;
    
    // Initialize combat stats
    typedCombatCapability.initialize(testEntity);
    
    // Get combat stats
    const combatStats = typedCombatCapability.getCombatStats(testEntity);
    console.log('Combat stats:');
    console.log(`- AC: ${combatStats.ac.total}`);
    console.log(`- Touch AC: ${combatStats.ac.touch}`);
    console.log(`- Flat-footed AC: ${combatStats.ac.flatFooted}`);
    console.log('Saving throws:');
    console.log(`- Fortitude: ${combatStats.saves.fortitude.total}`);
    console.log(`- Reflex: ${combatStats.saves.reflex.total}`);
    console.log(`- Will: ${combatStats.saves.will.total}`);
  }
  
  // Clean up
  console.log('\nRemoving test entity...');
  kernel.removeEntity(testEntity.id);
}

/**
 * Test loading a real character
 */
async function testCharacterLoading(app: any) {
  console.log('\n=== Testing Character Loading ===');
  
  const { gameAPI } = app.unix;
  
  console.log(`Loading character ${TEST_CHARACTER_ID}...`);
  const character = await gameAPI.loadCharacter(TEST_CHARACTER_ID);
  
  if (!character) {
    console.error(`Character ${TEST_CHARACTER_ID} not found`);
    return null;
  }
  
  console.log(`Character loaded: ${character.name} (ID: ${character.id})`);
  
  return character;
}

/**
 * Test plugin application
 */
async function testPluginApplication(app: any, character: Entity) {
  console.log('\n=== Testing Plugin Application ===');
  
  if (!character) {
    console.error('No character available for plugin test');
    return;
  }
  
  const { pluginManager } = app.unix;
  
  // List available plugins
  const plugins = pluginManager.getPluginIds();
  console.log('Available plugins:');
  plugins.forEach((plugin: string) => {
    console.log(`- ${plugin}`);
  });
  
  // Try to apply a plugin
  try {
    console.log('Applying power_attack plugin...');
    const result = pluginManager.applyPlugin(character, 'power_attack', { penalty: 1 });
    console.log('Plugin application result:', result);
  } catch (error) {
    console.error('Error applying plugin:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Run the full system test
 */
export async function runSystemTest(): Promise<void> {
  console.log('=== System Architecture Test ===');
  console.time('Total test time');
  
  try {
    // Test application initialization
    const app = await testApplicationInitialization();
    
    // Test kernel operations
    testKernel(app.kernel);
    
    // Test capabilities
    await testCapabilities(app);
    
    // Test character loading
    const character = await testCharacterLoading(app);
    
    // Test plugin application
    if (character) {
      await testPluginApplication(app, character);
    }
    
    console.log('\n=== Test Complete ===');
  } catch (error) {
    console.error('System test failed:', error);
  } finally {
    console.timeEnd('Total test time');
  }
}

// Make it available globally for the console
// 'as any' is needed because we're dynamically adding properties to the window object
// which TypeScript doesn't know about at compile time
(window as any).runSystemTest = runSystemTest;

// Auto-run the test if this file is executed directly
if (typeof window !== 'undefined') {
  runSystemTest().catch(error => {
    console.error('Unhandled error in system test:', error);
  });
}