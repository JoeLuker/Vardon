/**
 * SampleCharacters
 * 
 * This module provides sample character data for testing purposes.
 * It's simplified to provide basic test data without external dependencies.
 */

import type { Entity } from '../../kernel/types';

/**
 * Sample character factory
 */
export class SampleCharacters {
  /**
   * Get a sample warrior character
   * @returns Sample warrior entity
   */
  static getWarrior(): Entity {
    return this.createBaseCharacter({
      name: 'Test Warrior',
      abilities: {
        strength: 16,
        dexterity: 14,
        constitution: 14,
        intelligence: 10,
        wisdom: 12,
        charisma: 8
      },
      classes: [{ id: 'warrior', name: 'Warrior', level: 5 }]
    });
  }

  /**
   * Get a sample fighter character
   * @returns Sample fighter entity
   */
  static getFighter(): Entity {
    return this.createBaseCharacter({
      name: 'Test Fighter',
      abilities: {
        strength: 18,
        dexterity: 12,
        constitution: 16,
        intelligence: 10,
        wisdom: 10,
        charisma: 8
      },
      classes: [{ id: 'fighter', name: 'Fighter', level: 5 }]
    });
  }

  /**
   * Get a sample rogue character
   * @returns Sample rogue entity
   */
  static getRogue(): Entity {
    return this.createBaseCharacter({
      name: 'Test Rogue',
      abilities: {
        strength: 10,
        dexterity: 18,
        constitution: 12,
        intelligence: 14,
        wisdom: 10,
        charisma: 12
      },
      classes: [{ id: 'rogue', name: 'Rogue', level: 5 }]
    });
  }

  /**
   * Get a sample barbarian character
   * @returns Sample barbarian entity
   */
  static getBarbarian(): Entity {
    return this.createBaseCharacter({
      name: 'Test Barbarian',
      abilities: {
        strength: 18,
        dexterity: 14,
        constitution: 16,
        intelligence: 8,
        wisdom: 10,
        charisma: 10
      },
      classes: [{ id: 'barbarian', name: 'Barbarian', level: 5 }]
    });
  }

  /**
   * Get a sample cleric character
   * @returns Sample cleric entity
   */
  static getCleric(): Entity {
    return this.createBaseCharacter({
      name: 'Test Cleric',
      abilities: {
        strength: 14,
        dexterity: 10,
        constitution: 14,
        intelligence: 10,
        wisdom: 18,
        charisma: 12
      },
      classes: [{ id: 'cleric', name: 'Cleric', level: 5 }]
    });
  }

  /**
   * Get a sample multiclass character
   * @returns Sample multiclass entity
   */
  static getMulticlass(): Entity {
    return this.createBaseCharacter({
      name: 'Test Multiclass',
      abilities: {
        strength: 14,
        dexterity: 16,
        constitution: 12,
        intelligence: 12,
        wisdom: 10,
        charisma: 10
      },
      classes: [
        { id: 'fighter', name: 'Fighter', level: 3 },
        { id: 'rogue', name: 'Rogue', level: 2 }
      ]
    });
  }

  /**
   * Create a base character with default values
   * @param overrides Specific character values to override defaults
   * @returns Entity with specified overrides
   */
  private static createBaseCharacter(overrides: any = {}): Entity {
    const id = `test-character-${Math.floor(Math.random() * 1000)}`;
    
    // Create base entity
    const entity: Entity = {
      id,
      type: 'character',
      name: overrides.name || 'Test Character',
      properties: {
        id: overrides.id || id,
        name: overrides.name || 'Test Character',
        max_hp: overrides.max_hp || 50,
        current_hp: overrides.current_hp || 50,
        abilities: overrides.abilities || {
          strength: 10,
          dexterity: 10,
          constitution: 10,
          intelligence: 10,
          wisdom: 10,
          charisma: 10
        },
        classes: overrides.classes || [{ id: 'fighter', name: 'Fighter', level: 1 }],
        ancestry: overrides.ancestry || 'Human',
        skills: overrides.skills || {},
        feats: overrides.feats || [],
        spells: overrides.spells || [],
        ac: 10,
        bab: 0
      },
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1
      }
    };

    return entity;
  }
}