import { initializeUnixApplication } from '../unix-application';
import type { AbilityCapability } from '../capabilities/ability/types';

// Mock game data for initialization
const gameData = { skills: {} };

// Initialize the application with Unix architecture
console.log('Initializing Unix application...');
let app;

async function init() {
  try {
    // Enable debug mode for detailed logging
    app = await initializeUnixApplication(gameData, true);
    
    // Extract components
    const { pluginManager, gameAPI, sampleCharacters } = app;
    
    console.log('\n=== Available Sample Characters ===');
    Object.keys(sampleCharacters).forEach(key => {
      console.log(`- ${key}: ${sampleCharacters[key].name} (ID: ${sampleCharacters[key].id})`);
    });
    
    // Test fighter abilities
    const fighter = sampleCharacters.fighter;
    console.log('\n=== Fighter Details ===');
    console.log(`Name: ${fighter.name}`);
    
    // Get ability scores using the ability capability
    const abilityCapability = pluginManager.getCapability('ability');
    if (abilityCapability) {
      const typedAbilityCapability = abilityCapability as AbilityCapability;
      const strength = typedAbilityCapability.getAbilityScore(fighter, 'strength');
      console.log(`Strength: ${strength}`);
      
      // Show all abilities
      console.log('\n=== Fighter Abilities ===');
      const standardAbilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
      standardAbilities.forEach(ability => {
        const abilityValue = typedAbilityCapability.getAbilityBreakdown(fighter, ability);
        console.log(`${ability}: ${abilityValue.total} (Modifier: ${abilityValue.modifier})`);
      });
    }
    
    // Test Power Attack
    console.log('\n=== Testing Power Attack ===');
    try {
      const result = pluginManager.applyPlugin(fighter, 'power_attack', { penalty: 2 });
      console.log('Power Attack activated with result:', result);
      
      // Check fighter strength after Power Attack
      if (abilityCapability) {
        // Use the typed capability we already created
        const strength = typedAbilityCapability.getAbilityBreakdown(fighter, 'strength');
        console.log(`Strength after Power Attack: ${strength.total} (Modifier: ${strength.modifier})`);
      }
    } catch (error) {
      console.error('Error testing Power Attack:', error);
    }
    
    // Test barbarian with Rage
    const barbarian = sampleCharacters.barbarian;
    console.log('\n=== Testing Barbarian Rage ===');
    try {
      const result = pluginManager.applyPlugin(barbarian, 'barbarian_rage', {});
      console.log('Rage activated with result:', result);
      
      // Check barbarian strength and constitution after Rage
      if (abilityCapability) {
        const typedAbilityCapability = abilityCapability as AbilityCapability;  
        const strength = typedAbilityCapability.getAbilityBreakdown(barbarian, 'strength');
        const constitution = typedAbilityCapability.getAbilityBreakdown(barbarian, 'constitution');
        console.log(`Strength after Rage: ${strength.total} (Modifier: ${strength.modifier})`);
        console.log(`Constitution after Rage: ${constitution.total} (Modifier: ${constitution.modifier})`);
      }
    } catch (error) {
      console.error('Error testing Barbarian Rage:', error);
    }
    
    // Test rogue with Sneak Attack
    const rogue = sampleCharacters.rogue;
    console.log('\n=== Testing Rogue Sneak Attack ===');
    try {
      const result = pluginManager.applyPlugin(rogue, 'sneak_attack', {});
      console.log('Sneak Attack activated with result:', result);
    } catch (error) {
      console.error('Error testing Sneak Attack:', error);
    }
    
    console.log('\n=== Testing Complete ===');
    
    // Test character loading
    console.log('\n=== Testing Character Loading ===');
    try {
      const characterId = 1; // Example character ID
      const character = await gameAPI.loadCharacter(characterId);
      console.log(`Loaded character: ${character ? character.name : 'No character found'}`);
    } catch (error) {
      console.error('Error loading character:', error);
    }
    
  } catch (error) {
    console.error('Error initializing application:', error);
  }
}

// Run the async initialization
init().catch(error => {
  console.error('Unhandled error during initialization:', error);
});

// Export function to run database tests
export function runDatabaseTestsFromConsole(): void {
  // Import dynamically to avoid circular dependencies
  import('./DatabaseTest').then(module => {
    module.runDatabaseTest();
  }).catch(error => {
    console.error('Error running database tests:', error);
  });
}

// Export function to run Unix character tests
export function runUnixCharacterTestFromConsole(): void {
  // Import dynamically to avoid circular dependencies
  import('./UnixCharacterTest').then(module => {
    module.runUnixCharacterTest();
  }).catch(error => {
    console.error('Error running Unix character test:', error);
  });
}

// Export function to run Unix architecture tests
export function runUnixArchitectureTestFromConsole(): void {
  // Import dynamically to avoid circular dependencies
  import('./UnixArchitectureTest').then(module => {
    module.runUnixArchitectureTest();
  }).catch(error => {
    console.error('Error running Unix architecture test:', error);
  });
}

// Export function to run all Unix tests
export function runUnixTestsFromConsole(suites?: string[]): void {
  // Import dynamically to avoid circular dependencies
  import('./UnixTestRunner').then(module => {
    module.runUnixTests(suites);
  }).catch(error => {
    console.error('Error running Unix tests:', error);
  });
}

// Make functions available globally for the console
// 'as any' is needed here because we're dynamically adding properties to the window object
// which TypeScript doesn't know about at compile time
(window as any).runDatabaseTests = runDatabaseTestsFromConsole;
(window as any).runUnixCharacterTest = runUnixCharacterTestFromConsole;
(window as any).runUnixArchitectureTest = runUnixArchitectureTestFromConsole;
(window as any).runUnixTests = runUnixTestsFromConsole;