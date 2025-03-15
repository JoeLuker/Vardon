import { initializeApplication } from '../application';
import { Entity } from '../types/EntityTypes';
import { SampleCharacters } from '../config/SampleCharacters';

// Set up mock game data
const gameData = {
  skills: [
    // Add all skills here
  ]
};

async function runPerformanceTests() {
  console.log('Starting performance tests...');
  
  // Initialize the application
  const { calculationExplainer, engine } = initializeApplication(gameData);
  
  // Get a batch of characters for testing
  const characters: Entity[] = [];
  
  // Create 100 characters (20 of each type)
  for (let i = 0; i < 20; i++) {
    characters.push(SampleCharacters.getFighter());
    characters.push(SampleCharacters.getRogue());
    characters.push(SampleCharacters.getBarbarian());
    characters.push(SampleCharacters.getCleric());
    characters.push(SampleCharacters.getMulticlass());
  }
  
  console.log(`Created ${characters.length} characters for testing`);
  
  // Register all characters
  const startRegister = performance.now();
  characters.forEach(character => {
    engine.registerEntity(character);
  });
  const endRegister = performance.now();
  
  console.log(`Time to register ${characters.length} characters: ${(endRegister - startRegister).toFixed(2)}ms`);
  
  // Test full character report generation
  const startReports = performance.now();
  
  for (const character of characters.slice(0, 10)) { // Test with first 10 characters
    calculationExplainer.getCharacterReport(character);
  }
  
  const endReports = performance.now();
  const reportTime = endReports - startReports;
  
  console.log(`Time to generate 10 character reports: ${reportTime.toFixed(2)}ms`);
  console.log(`Average time per report: ${(reportTime / 10).toFixed(2)}ms`);
  
  // Test feature activation performance
  const startFeatures = performance.now();
  
  for (const character of characters.filter(c => 
    c.character?.classes?.some(cls => cls.id === 'fighter' || cls.id === 'barbarian')
  ).slice(0, 20)) {
    try {
      engine.activateFeature('feat.power_attack', character, { penalty: 1 });
    } catch (error) {
      // Ignore errors for performance testing
    }
  }
  
  const endFeatures = performance.now();
  
  console.log(`Time to activate Power Attack on 20 characters: ${(endFeatures - startFeatures).toFixed(2)}ms`);
  console.log(`Average time per activation: ${((endFeatures - startFeatures) / 20).toFixed(2)}ms`);
  
  console.log('Performance tests complete!');
}

// Run the tests
runPerformanceTests().catch(console.error); 