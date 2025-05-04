import { initializeApplication } from '../application';

// Mock game data for initialization
const gameData = { skills: {} };

// Initialize the application
console.log('Initializing application...');
const app = initializeApplication(gameData);

// Extract components
const { engine, sampleCharacters, gameAPI, calculationExplainer } = app;

console.log('\n=== Available Sample Characters ===');
Object.keys(sampleCharacters).forEach(key => {
  console.log(`- ${key}: ${sampleCharacters[key].name} (ID: ${sampleCharacters[key].id})`);
});

// Test fighter abilities
const fighter = sampleCharacters.fighter;
console.log('\n=== Fighter Details ===');
console.log(`Name: ${fighter.name}`);
console.log(`Strength: ${fighter.character?.abilities?.strength}`);

// Test Power Attack
console.log('\n=== Testing Power Attack ===');
try {
  const result = engine.activateFeature('feat.power_attack', fighter, { penalty: 2 });
  console.log('Power Attack activated with result:', result);
  
  // Get fighter report after Power Attack
  console.log('\n=== Fighter Report After Power Attack ===');
  const report = calculationExplainer.getCharacterReport(fighter);
  console.log(`Strength: ${report.abilities.strength.total} (Modifier: ${report.abilities.strength.modifier})`);
  console.log(`Melee Attack: ${report.combat.meleeAttack.total}`);
} catch (error) {
  console.error('Error testing Power Attack:', error);
}

// Test barbarian with Rage
const barbarian = sampleCharacters.barbarian;
console.log('\n=== Testing Barbarian Rage ===');
try {
  const result = engine.activateFeature('class.barbarian.rage', barbarian, {});
  console.log('Rage activated with result:', result);
  
  // Get barbarian report after Rage
  console.log('\n=== Barbarian Report After Rage ===');
  const report = calculationExplainer.getCharacterReport(barbarian);
  console.log(`Strength: ${report.abilities.strength.total} (Modifier: ${report.abilities.strength.modifier})`);
  console.log(`Constitution: ${report.abilities.constitution.total} (Modifier: ${report.abilities.constitution.modifier})`);
} catch (error) {
  console.error('Error testing Barbarian Rage:', error);
}

// Test rogue with Sneak Attack
const rogue = sampleCharacters.rogue;
console.log('\n=== Testing Rogue Sneak Attack ===');
try {
  const result = engine.activateFeature('class.rogue.sneak_attack', rogue, {});
  console.log('Sneak Attack activated with result:', result);
} catch (error) {
  console.error('Error testing Sneak Attack:', error);
}

console.log('\n=== Testing Complete ===');

// Export function to run database tests
export function runDatabaseTestsFromConsole(): void {
  // Import dynamically to avoid circular dependencies
  import('./DatabaseTest').then(module => {
    module.runDatabaseTest();
  }).catch(error => {
    console.error('Error running database tests:', error);
  });
}

// Make it available globally for the console
(window as any).runDatabaseTests = runDatabaseTestsFromConsole; 