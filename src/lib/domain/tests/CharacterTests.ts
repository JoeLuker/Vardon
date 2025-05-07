import { initializeApplication } from '../application';
import { Entity } from '../types/EntityTypes';
import { SampleCharacters } from './mocks/SampleCharacters';

// Set up mock game data
const gameData = {
  skills: [
    { id: 1, name: 'Climb', ability: 'strength', trainedOnly: false },
    { id: 5, name: 'Intimidate', ability: 'strength', trainedOnly: false },
    { id: 11, name: 'Ride', ability: 'dexterity', trainedOnly: false }
  ]
};

describe('Character System Tests', () => {
  const { engine, calculationExplainer } = initializeApplication(gameData);
  
  // Create sample characters for testing
  const sampleCharacters = {
    fighter: SampleCharacters.getFighter()
  };
  
  describe('Fighter Tests', () => {
    const fighter: Entity = sampleCharacters.fighter;
    
    test('Fighter has correct ability scores', () => {
      expect(fighter.character?.abilities?.strength).toBe(18);
      expect(fighter.character?.abilities?.dexterity).toBe(14);
      expect(fighter.character?.abilities?.constitution).toBe(16);
    });
    
    test('Fighter can use Power Attack', () => {
      // Apply Power Attack
      const result = engine.activateFeature('feat.power_attack', fighter, { penalty: 1 });
      expect(result.success).toBe(true);
      
      // Check attack bonus is reduced
      const attack = calculationExplainer.explainAttack(fighter, 'melee');
      expect(attack.otherBonuses.components).toContainEqual(
        expect.objectContaining({
          source: 'Power Attack',
          value: -1
        })
      );
    });
    
    test('Fighter has correct AC calculation', () => {
      const ac = calculationExplainer.explainAC(fighter);
      // Base AC 10 + Dex 2 + Scale Mail 5
      expect(ac.total).toBeGreaterThanOrEqual(17);
    });
  });
  
  describe('Barbarian Tests', () => {
    const barbarian: Entity = sampleCharacters.barbarian;
    
    test('Barbarian can rage', () => {
      // Get original strength
      const strengthBefore = calculationExplainer.explainAbility(barbarian, 'strength').total;
      
      // Activate rage
      const result = engine.activateFeature('class.barbarian.rage', barbarian, {});
      expect(result.success).toBe(true);
      
      // Check strength increase (+4 from rage)
      const strengthAfter = calculationExplainer.explainAbility(barbarian, 'strength').total;
      expect(strengthAfter).toBe(strengthBefore + 4);
      
      // Check Constitution increase (+4 from rage)
      const conBefore = barbarian.character?.abilities?.constitution || 0;
      const conAfterRage = calculationExplainer.explainAbility(barbarian, 'constitution').total;
      expect(conAfterRage).toBe(conBefore + 4);
    });
  });
  
  describe('Cleric Tests', () => {
    const cleric: Entity = sampleCharacters.cleric;
    
    test('Cleric can channel energy', () => {
      // Get original channel energy uses
      const usesBefore = cleric.character?.resources?.channel_energy?.current || 0;
      
      // Use channel energy
      const result = engine.activateFeature('class.cleric.channel_energy', cleric, {
        type: 'positive',
        healUndead: false
      });
      expect(result.success).toBe(true);
      
      // Check uses reduced by 1
      const usesAfter = cleric.character?.resources?.channel_energy?.current || 0;
      expect(usesAfter).toBe(usesBefore - 1);
    });
  });
  
  describe('Rogue Tests', () => {
    const rogue: Entity = sampleCharacters.rogue;
    
    test('Rogue has correct skill bonuses', () => {
      // Stealth = 1 rank + 4 dex + 3 class skill = 8
      const stealth = calculationExplainer.explainSkill(rogue, 7);
      expect(stealth.total).toBeGreaterThanOrEqual(8);
    });
    
    test('Rogue can sneak attack', () => {
      const result = engine.activateFeature('class.rogue.sneak_attack', rogue, { apply: true });
      expect(result.success).toBe(true);
      expect(result.damageBonus).toBe('1d6');
    });
  });
}); 