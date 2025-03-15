import { initializeApplication } from '../application';

// Set up the engine with some basic game data
const gameData = {
  skills: [
    { id: 1, name: 'Climb', ability: 'strength', trainedOnly: false },
    { id: 2, name: 'Acrobatics', ability: 'dexterity', trainedOnly: false },
    { id: 5, name: 'Intimidate', ability: 'strength', trainedOnly: false },
    { id: 6, name: 'Knowledge (Religion)', ability: 'intelligence', trainedOnly: true },
    { id: 7, name: 'Stealth', ability: 'dexterity', trainedOnly: false },
    { id: 8, name: 'Knowledge (Local)', ability: 'intelligence', trainedOnly: true },
    { id: 9, name: 'Sleight of Hand', ability: 'dexterity', trainedOnly: true },
    { id: 10, name: 'Heal', ability: 'wisdom', trainedOnly: false },
    { id: 11, name: 'Ride', ability: 'dexterity', trainedOnly: false },
    { id: 12, name: 'Bluff', ability: 'charisma', trainedOnly: false },
    { id: 16, name: 'Disable Device', ability: 'intelligence', trainedOnly: true },
    { id: 17, name: 'Disguise', ability: 'intelligence', trainedOnly: false },
    { id: 21, name: 'Perception', ability: 'wisdom', trainedOnly: false },
    { id: 23, name: 'Survival', ability: 'constitution', trainedOnly: false }
  ]
};

// Initialize the application with sample characters
const { engine, sampleCharacters, calculationExplainer, gameAPI } = initializeApplication(gameData);

function testCharacters() {
  console.log('\n===== CHARACTER TESTING CONSOLE =====\n');
  
  // Display all available characters
  console.log('Available test characters:');
  Object.entries(sampleCharacters).forEach(([key, character]) => {
    console.log(`- ${key}: ${character.name} (ID: ${character.id})`);
  });
  
  // Test fighter capabilities
  console.log('\n===== TESTING FIGHTER =====');
  const fighter = sampleCharacters.fighter;
  
  // Get ability scores with explanations
  const str = calculationExplainer.explainAbility(fighter, 'strength');
  console.log('Strength breakdown:', str);
  
  // Get AC calculation
  const ac = calculationExplainer.explainAC(fighter);
  console.log('Armor Class breakdown:', ac);
  
  // Test activating Power Attack
  try {
    const powerAttackResult = engine.activateFeature('feat.power_attack', fighter, { penalty: 2 });
    console.log('Power Attack activated:', powerAttackResult);
    
    // Show attack bonus after Power Attack
    const attackAfter = calculationExplainer.explainAttack(fighter, 'melee');
    console.log('Melee attack after Power Attack:', attackAfter);
  } catch (error) {
    console.error('Error activating Power Attack:', error);
  }
  
  // Test barbarian rage
  console.log('\n===== TESTING BARBARIAN =====');
  const barbarian = sampleCharacters.barbarian;
  
  // Get ability scores before rage
  console.log('Constitution before rage:', calculationExplainer.explainAbility(barbarian, 'constitution'));
  
  // Activate rage
  try {
    const rageResult = engine.activateFeature('class.barbarian.rage', barbarian, {});
    console.log('Rage activated:', rageResult);
    
    // Show ability scores during rage
    console.log('Constitution during rage:', calculationExplainer.explainAbility(barbarian, 'constitution'));
    console.log('Strength during rage:', calculationExplainer.explainAbility(barbarian, 'strength'));
  } catch (error) {
    console.error('Error activating Rage:', error);
  }
  
  // Test cleric channel energy
  console.log('\n===== TESTING CLERIC =====');
  const cleric = sampleCharacters.cleric;
  
  // Check channel energy resources
  const resources = cleric.character?.resources || {};
  console.log('Channel Energy uses:', resources.channel_energy);
  
  // Use channel energy
  try {
    const channelResult = engine.activateFeature('class.cleric.channel_energy', cleric, {
      type: 'positive',
      healUndead: false
    });
    console.log('Channel Energy used:', channelResult);
    
    // Check remaining uses
    console.log('Remaining uses:', cleric.character?.resources?.channel_energy);
  } catch (error) {
    console.error('Error using Channel Energy:', error);
  }
  
  // Test rogue sneak attack
  console.log('\n===== TESTING ROGUE =====');
  const rogue = sampleCharacters.rogue;
  
  try {
    const sneakResult = engine.activateFeature('class.rogue.sneak_attack', rogue, { apply: true });
    console.log('Sneak Attack activated:', sneakResult);
  } catch (error) {
    console.error('Error activating Sneak Attack:', error);
  }
  
  // Test multiclass character
  console.log('\n===== TESTING MULTICLASS CHARACTER =====');
  const multiclass = sampleCharacters.multiclass;
  
  // Get a detailed character report
  const report = calculationExplainer.getCharacterReport(multiclass);
  console.log('Multiclass character report summary:');
  console.log('- Name:', report.name);
  console.log('- Strength:', report.abilities.strength.total);
  console.log('- Dexterity:', report.abilities.dexterity.total);
  console.log('- Armor Class:', report.combat.armorClass.total);
  console.log('- Saving Throws:', {
    fortitude: report.saves.fortitude.total,
    reflex: report.saves.reflex.total,
    will: report.saves.will.total
  });
  console.log('- Features:', 
    report.features.feats ? report.features.feats.map(f => f.name).join(', ') : 'None'
  );
}

// Run the tests
testCharacters(); 