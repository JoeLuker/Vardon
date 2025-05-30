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
  const { gameAPI } = initializeApplication(gameData);
  
  // Test saving characters
  console.log('\n=== Testing character saving ===');
  
  try {
    // Create a simple test character
    const testCharacter = {
      id: 'test-character-1',
      type: 'character',
      name: 'Test Character',
      properties: {
        id: 1,
        name: 'Test Character',
        max_hp: 50,
        current_hp: 50,
        abilities: {
          strength: 16,
          dexterity: 14,
          constitution: 14,
          intelligence: 10,
          wisdom: 12,
          charisma: 8
        }
      },
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1
      }
    };
    
    // Save the test character
    const saveResult = await gameAPI.saveCharacter(testCharacter);
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
    // Use a character ID for testing
    const testCharacterId = 'test-character-1';
    const powerAttackResult = gameAPI.applyFeature(testCharacterId, 'feat.power_attack', { penalty: 2 });
    console.log('Power Attack result:', powerAttackResult);
    
    // Get character report
    const reportResult = gameAPI.getCharacterReport(testCharacterId);
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
    // Create a test character for condition testing
    const testConditionCharacter = {
      id: 'test-barbarian',
      type: 'character',
      name: 'Test Barbarian',
      properties: {
        id: 2,
        name: 'Test Barbarian',
        max_hp: 60,
        current_hp: 60,
        abilities: {
          strength: 18,
          dexterity: 12,
          constitution: 16,
          intelligence: 8,
          wisdom: 10,
          charisma: 12
        }
      },
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1
      }
    };
    
    // Save the test barbarian character
    await gameAPI.saveCharacter(testConditionCharacter);
    
    // Apply fatigued condition to the test character
    const barbarianId = 'test-barbarian';
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