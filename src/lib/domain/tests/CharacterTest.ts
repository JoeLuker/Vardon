/**
 * Character Test
 * 
 * This file tests character loading with the system architecture.
 */

import { initializeApplication } from '../application';
import type { AbilityCapability } from '../capabilities/ability/types';

// Character ID to test
const TEST_CHARACTER_ID = 1; // Change this to a valid character ID in your database

/**
 * Run character test
 */
export async function runCharacterTest(): Promise<void> {
  console.log('=== Character Test ===');
  
  try {
    // Initialize application with debug mode
    console.log('Initializing application...');
    const app = await initializeApplication({ debug: true });
    
    // Extract components
    const { gameAPI } = app;
    
    // Test loading a character
    console.log(`Loading character ${TEST_CHARACTER_ID}...`);
    const character = await gameAPI.loadCharacter(TEST_CHARACTER_ID);
    
    if (!character) {
      console.error(`Character ${TEST_CHARACTER_ID} not found`);
      return;
    }
    
    console.log(`Character loaded: ${character.name} (ID: ${character.id})`);
    
    // Test basic character properties
    console.log('\n=== Character Properties ===');
    console.log(`Type: ${character.type}`);
    console.log(`Created: ${new Date(character.metadata.createdAt).toLocaleString()}`);
    console.log(`Updated: ${new Date(character.metadata.updatedAt).toLocaleString()}`);
    
    // Extract some basic information from the character's properties
    if (character.properties.abilities) {
      console.log('\n=== Ability Scores ===');
      Object.entries(character.properties.abilities).forEach(([name, value]: [string, any]) => {
        console.log(`${name}: ${value}`);
      });
    }
    
    if (character.properties.skills) {
      console.log('\n=== Skills ===');
      Object.entries(character.properties.skills).forEach(([name, value]: [string, any]) => {
        console.log(`${name}: ${value}`);
      });
    }
    
    // Get ability scores using the ability capability
    const abilityCapability = gameAPI.getCapability('ability') as AbilityCapability;
    
    if (abilityCapability) {
      // Show all abilities
      console.log('\n=== Character Ability Details ===');
      const standardAbilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
      standardAbilities.forEach(ability => {
        const abilityValue = abilityCapability.getAbilityBreakdown(character, ability);
        console.log(`${ability}: ${abilityValue.total} (Modifier: ${abilityValue.modifier})`);
      });
    }
    
    // Test applying a plugin using the gameAPI
    try {
      console.log('\n=== Testing Feature Application ===');
      const result = gameAPI.applyPlugin(TEST_CHARACTER_ID, 'power_attack', { penalty: 1 });
      console.log('Power Attack applied successfully:', result);
    } catch (error) {
      console.error('Error applying feature:', error instanceof Error ? error.message : String(error));
    }
    
    console.log('\n=== Test Complete ===');
  } catch (error) {
    console.error('Character test failed:', error);
  }
}

// Make it available globally for the console
// 'as any' is needed because we're dynamically adding properties to the window object
// which TypeScript doesn't know about at compile time
(window as any).runCharacterTest = runCharacterTest;

// Auto-run the test if this file is executed directly
if (typeof window !== 'undefined') {
  runCharacterTest().catch(error => {
    console.error('Unhandled error in character test:', error);
  });
}