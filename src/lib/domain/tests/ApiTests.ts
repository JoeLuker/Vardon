import { initializeApplication } from '../application';

// Set up mock game data
const gameData = {
  skills: [
    { id: 1, name: 'Climb', ability: 'strength', trainedOnly: false },
    { id: 2, name: 'Acrobatics', ability: 'dexterity', trainedOnly: false },
    // Add more skills as needed
  ]
};

async function runApiTests() {
  console.log('Starting GameAPI integration tests...');
  
  // Initialize application
  const { gameAPI, sampleCharacters } = initializeApplication(gameData);
  
  // Test saving characters
  console.log('\n=== Testing character saving ===');
  
  try {
    // Save the fighter
    const saveResult = await gameAPI.saveCharacter(sampleCharacters.fighter);
    console.log('Save result:', saveResult);
    
    // List characters
    const listResult = await gameAPI.listCharacters();
    console.log('List result:', listResult);
    
    // Load character
    if (listResult.success && listResult.data && listResult.data.length > 0) {
      const loadResult = await gameAPI.loadCharacter(listResult.data[0]);
      console.log('Load result:', loadResult);
    }
  } catch (error) {
    console.error('Error in storage tests:', error);
  }
  
  // Test applying features through the API
  console.log('\n=== Testing feature application ===');
  
  try {
    // Apply Power Attack to the fighter
    const fighterId = sampleCharacters.fighter.id;
    const powerAttackResult = gameAPI.applyFeature(fighterId, 'feat.power_attack', { penalty: 2 });
    console.log('Power Attack result:', powerAttackResult);
    
    // Get character report
    const reportResult = gameAPI.getCharacterReport(fighterId);
    console.log('Character report success:', reportResult.success);
    
    if (reportResult.success && reportResult.data) {
      console.log('Character strength:', reportResult.data.abilities.strength.total);
      console.log('Character melee attack:', reportResult.data.combat.meleeAttack.total);
    }
  } catch (error) {
    console.error('Error in feature tests:', error);
  }
  
  // Test condition application
  console.log('\n=== Testing condition application ===');
  
  try {
    // Apply fatigued condition to the barbarian
    const barbarianId = sampleCharacters.barbarian.id;
    const conditionResult = gameAPI.applyCondition(barbarianId, 'fatigued', 3);
    console.log('Apply condition result:', conditionResult);
    
    // Get character report to see condition effects
    const reportResult = gameAPI.getCharacterReport(barbarianId);
    
    if (reportResult.success && reportResult.data) {
      console.log('Barbarian with fatigue - strength:', reportResult.data.abilities.strength.total);
      console.log('Active conditions:', reportResult.data.features.conditions);
    }
    
    // Advance a round and check if condition still exists
    gameAPI.nextRound();
    
    const reportAfterRound = gameAPI.getCharacterReport(barbarianId);
    if (reportAfterRound.success && reportAfterRound.data) {
      console.log('After round - conditions:', reportAfterRound.data.features.conditions);
    }
  } catch (error) {
    console.error('Error in condition tests:', error);
  }
  
  console.log('\nTests completed!');
}

// Run the tests
runApiTests().catch(console.error); 