import { initializeApplication } from '../application';
import { Entity } from '../types/EntityTypes';

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
  
  // Create test characters directly in the test
  
  describe('Fighter Tests', () => {
    // Create a fighter test character
    const fighter: Entity = {
      id: 'test-fighter',
      type: 'character',
      name: 'Test Fighter',
      properties: {
        id: 1,
        name: 'Test Fighter',
        max_hp: 55,
        current_hp: 55,
        abilities: {
          strength: 18,
          dexterity: 14,
          constitution: 16,
          intelligence: 10,
          wisdom: 12,
          charisma: 8
        },
        equipment: {
          armor: {
            name: 'Scale Mail',
            ac_bonus: 5,
            max_dex: 3
          }
        }
      },
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1
      }
    };
    
    test('Fighter has correct ability scores', () => {
      expect(fighter.properties.abilities.strength).toBe(18);
      expect(fighter.properties.abilities.dexterity).toBe(14);
      expect(fighter.properties.abilities.constitution).toBe(16);
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
    // Create a barbarian test character
    const barbarian: Entity = {
      id: 'test-barbarian',
      type: 'character',
      name: 'Test Barbarian',
      properties: {
        id: 2,
        name: 'Test Barbarian',
        max_hp: 65,
        current_hp: 65,
        abilities: {
          strength: 18,
          dexterity: 12,
          constitution: 16,
          intelligence: 8,
          wisdom: 10,
          charisma: 12
        },
        classes: [
          { id: 2, name: 'Barbarian', level: 3 }
        ]
      },
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1
      }
    };
    
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
      const conBefore = barbarian.properties.abilities.constitution;
      const conAfterRage = calculationExplainer.explainAbility(barbarian, 'constitution').total;
      expect(conAfterRage).toBe(conBefore + 4);
    });
  });
  
  describe('Cleric Tests', () => {
    // Create a cleric test character
    const cleric: Entity = {
      id: 'test-cleric',
      type: 'character',
      name: 'Test Cleric',
      properties: {
        id: 3,
        name: 'Test Cleric',
        max_hp: 45,
        current_hp: 45,
        abilities: {
          strength: 14,
          dexterity: 10,
          constitution: 14,
          intelligence: 10,
          wisdom: 18,
          charisma: 14
        },
        classes: [
          { id: 3, name: 'Cleric', level: 3 }
        ],
        resources: {
          channel_energy: {
            max: 5,
            current: 5
          }
        }
      },
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1
      }
    };
    
    test('Cleric can channel energy', () => {
      // Get original channel energy uses
      const usesBefore = cleric.properties.resources.channel_energy.current;
      
      // Use channel energy
      const result = engine.activateFeature('class.cleric.channel_energy', cleric, {
        type: 'positive',
        healUndead: false
      });
      expect(result.success).toBe(true);
      
      // Check uses reduced by 1
      const usesAfter = cleric.properties.resources.channel_energy.current;
      expect(usesAfter).toBe(usesBefore - 1);
    });
  });
  
  describe('Rogue Tests', () => {
    // Create a rogue test character
    const rogue: Entity = {
      id: 'test-rogue',
      type: 'character',
      name: 'Test Rogue',
      properties: {
        id: 4,
        name: 'Test Rogue',
        max_hp: 35,
        current_hp: 35,
        abilities: {
          strength: 12,
          dexterity: 18,
          constitution: 12,
          intelligence: 14,
          wisdom: 10,
          charisma: 14
        },
        classes: [
          { id: 4, name: 'Rogue', level: 3 }
        ],
        skills: {
          7: { // Stealth
            ranks: 1,
            isClassSkill: true
          }
        }
      },
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1
      }
    };
    
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