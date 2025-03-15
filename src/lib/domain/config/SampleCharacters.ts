import { Entity, CharacterData } from '../types/EntityTypes';

/**
 * Sample character factory for testing purposes
 */
export class SampleCharacters {
  /**
   * Create a unique ID for a character
   */
  private static createId(name: string): string {
    return `sample_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
  }
  
  /**
   * Create a base character entity with common properties
   */
  private static createBaseCharacter(name: string): Entity {
    return {
      id: this.createId(name),
      type: 'character',
      name,
      properties: {},
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
        sample: true
      }
    };
  }
  
  /**
   * Get a sample fighter character
   */
  static getFighter(): Entity {
    const character = this.createBaseCharacter('Valiant Fighter');
    
    const characterData: CharacterData = {
      abilities: {
        strength: 18,
        dexterity: 14,
        constitution: 16,
        intelligence: 10,
        wisdom: 12,
        charisma: 8
      },
      hitPoints: {
        max: 12,
        current: 12,
        temporary: 0,
        nonLethal: 0
      },
      baseAttackBonus: 1,
      savingThrows: {
        fortitude: 2,
        reflex: 0,
        will: 0
      },
      classes: [
        {
          id: 'fighter',
          name: 'Fighter',
          level: 1,
          hitDie: 10,
          skillsPerLevel: 2,
          baseAttackBonus: [1],
          baseSaves: {
            fortitude: [2],
            reflex: [0],
            will: [0]
          }
        }
      ],
      feats: [
        {
          id: 'feat.power_attack',
          name: 'Power Attack',
          options: {}
        },
        {
          id: 'feat.weapon_focus',
          name: 'Weapon Focus',
          options: { weaponType: 'greatsword' }
        }
      ],
      skills: {
        1: { ranks: 1, ability: 'strength' },  // Climb
        5: { ranks: 1, ability: 'strength' },  // Intimidate
        11: { ranks: 1, ability: 'dexterity' } // Ride
      },
      classSkills: [1, 5, 11],
      equipment: {
        armor: [
          {
            id: 'item.scale_mail',
            name: 'Scale Mail',
            type: 'medium',
            acBonus: 5,
            maxDex: 3,
            checkPenalty: -4,
            spellFailure: 25,
            equipped: true
          }
        ],
        weapons: [
          {
            id: 'item.greatsword',
            name: 'Greatsword',
            category: 'martial',
            damage: '2d6',
            damageType: 'slashing',
            critical: '19-20/x2',
            weight: 8,
            properties: ['two-handed'],
            equipped: true
          }
        ]
      }
    };
    
    character.character = characterData;
    return character;
  }
  
  /**
   * Get a sample rogue character
   */
  static getRogue(): Entity {
    const character = this.createBaseCharacter('Stealthy Rogue');
    
    const characterData: CharacterData = {
      abilities: {
        strength: 12,
        dexterity: 18,
        constitution: 14,
        intelligence: 16,
        wisdom: 10,
        charisma: 12
      },
      hitPoints: {
        max: 9,
        current: 9,
        temporary: 0,
        nonLethal: 0
      },
      baseAttackBonus: 0,
      savingThrows: {
        fortitude: 0,
        reflex: 2,
        will: 0
      },
      classes: [
        {
          id: 'rogue',
          name: 'Rogue',
          level: 1,
          hitDie: 8,
          skillsPerLevel: 8,
          baseAttackBonus: [0],
          baseSaves: {
            fortitude: [0],
            reflex: [2],
            will: [0]
          }
        }
      ],
      classFeatures: [
        {
          id: 'class.rogue.sneak_attack',
          name: 'Sneak Attack',
          classId: 'rogue',
          level: 1,
          options: {}
        }
      ],
      feats: [
        {
          id: 'feat.weapon_finesse',
          name: 'Weapon Finesse',
          options: {}
        }
      ],
      skills: {
        2: { ranks: 1, ability: 'dexterity' },   // Acrobatics
        7: { ranks: 1, ability: 'dexterity' },   // Stealth
        8: { ranks: 1, ability: 'intelligence' }, // Knowledge (Local)
        9: { ranks: 1, ability: 'dexterity' },   // Sleight of Hand
        12: { ranks: 1, ability: 'charisma' },   // Bluff
        16: { ranks: 1, ability: 'intelligence' }, // Disable Device
        17: { ranks: 1, ability: 'intelligence' }, // Disguise
        21: { ranks: 1, ability: 'wisdom' }       // Perception
      },
      classSkills: [2, 7, 8, 9, 12, 16, 17, 21],
      equipment: {
        armor: [
          {
            id: 'item.leather_armor',
            name: 'Leather Armor',
            type: 'light',
            acBonus: 2,
            maxDex: 6,
            checkPenalty: 0,
            spellFailure: 10,
            equipped: true
          }
        ],
        weapons: [
          {
            id: 'item.short_sword',
            name: 'Short Sword',
            category: 'martial',
            damage: '1d6',
            damageType: 'piercing',
            critical: '19-20/x2',
            weight: 2,
            properties: ['finesse'],
            equipped: true
          },
          {
            id: 'item.dagger',
            name: 'Dagger',
            category: 'simple',
            damage: '1d4',
            damageType: 'piercing',
            critical: '19-20/x2',
            range: 10,
            weight: 1,
            properties: ['finesse', 'thrown'],
            equipped: true
          }
        ]
      }
    };
    
    character.character = characterData;
    return character;
  }
  
  /**
   * Get a sample barbarian character
   */
  static getBarbarian(): Entity {
    const character = this.createBaseCharacter('Raging Barbarian');
    
    const characterData: CharacterData = {
      abilities: {
        strength: 18,
        dexterity: 14,
        constitution: 16,
        intelligence: 8,
        wisdom: 12,
        charisma: 10
      },
      hitPoints: {
        max: 14,
        current: 14,
        temporary: 0,
        nonLethal: 0
      },
      baseAttackBonus: 1,
      savingThrows: {
        fortitude: 2,
        reflex: 0,
        will: 0
      },
      classes: [
        {
          id: 'barbarian',
          name: 'Barbarian',
          level: 1,
          hitDie: 12,
          skillsPerLevel: 4,
          baseAttackBonus: [1],
          baseSaves: {
            fortitude: [2],
            reflex: [0],
            will: [0]
          }
        }
      ],
      classFeatures: [
        {
          id: 'class.barbarian.rage',
          name: 'Rage',
          classId: 'barbarian',
          level: 1,
          options: {}
        }
      ],
      resources: {
        rage: {
          max: 4,
          current: 4,
          rechargeCondition: 'long rest'
        }
      },
      feats: [
        {
          id: 'feat.power_attack',
          name: 'Power Attack',
          options: {}
        }
      ],
      skills: {
        1: { ranks: 1, ability: 'strength' },  // Climb
        5: { ranks: 1, ability: 'strength' },  // Intimidate
        21: { ranks: 1, ability: 'wisdom' },   // Perception
        23: { ranks: 1, ability: 'constitution' }  // Survival
      },
      classSkills: [1, 5, 21, 23],
      equipment: {
        armor: [],
        weapons: [
          {
            id: 'item.greataxe',
            name: 'Greataxe',
            category: 'martial',
            damage: '1d12',
            damageType: 'slashing',
            critical: 'x3',
            weight: 12,
            properties: ['two-handed'],
            equipped: true
          }
        ]
      }
    };
    
    character.character = characterData;
    return character;
  }
  
  /**
   * Get a sample cleric character
   */
  static getCleric(): Entity {
    const character = this.createBaseCharacter('Devoted Cleric');
    
    const characterData: CharacterData = {
      abilities: {
        strength: 14,
        dexterity: 10,
        constitution: 14,
        intelligence: 10,
        wisdom: 18,
        charisma: 14
      },
      hitPoints: {
        max: 10,
        current: 10,
        temporary: 0,
        nonLethal: 0
      },
      baseAttackBonus: 0,
      savingThrows: {
        fortitude: 2,
        reflex: 0,
        will: 2
      },
      classes: [
        {
          id: 'cleric',
          name: 'Cleric',
          level: 1,
          hitDie: 8,
          skillsPerLevel: 2,
          baseAttackBonus: [0],
          baseSaves: {
            fortitude: [2],
            reflex: [0],
            will: [2]
          }
        }
      ],
      classFeatures: [
        {
          id: 'class.cleric.channel_energy',
          name: 'Channel Energy',
          classId: 'cleric',
          level: 1,
          options: { type: 'positive' }
        }
      ],
      resources: {
        channel_energy: {
          max: 4,  // 3 + Cha modifier (1)
          current: 4,
          rechargeCondition: 'long rest'
        }
      },
      spellcasting: {
        cleric: {
          type: 'prepared',
          casterLevel: 1,
          ability: 'wisdom',
          spellsPerDay: {
            0: 3,
            1: 2
          },
          preparedSpells: {
            0: ['detect_magic', 'light', 'stabilize'],
            1: ['cure_light_wounds', 'bless']
          }
        }
      },
      feats: [
        {
          id: 'feat.selective_channeling',
          name: 'Selective Channeling',
          options: {}
        }
      ],
      skills: {
        6: { ranks: 1, ability: 'intelligence' },  // Knowledge (Religion)
        10: { ranks: 1, ability: 'wisdom' }        // Heal
      },
      classSkills: [6, 10],
      equipment: {
        armor: [
          {
            id: 'item.scale_mail',
            name: 'Scale Mail',
            type: 'medium',
            acBonus: 5,
            maxDex: 3,
            checkPenalty: -4,
            spellFailure: 25,
            equipped: true
          }
        ],
        weapons: [
          {
            id: 'item.heavy_mace',
            name: 'Heavy Mace',
            category: 'simple',
            damage: '1d8',
            damageType: 'bludgeoning',
            critical: 'x2',
            weight: 8,
            equipped: true
          }
        ]
      }
    };
    
    character.character = characterData;
    return character;
  }
  
  /**
   * Get a multi-class character (Fighter/Rogue)
   */
  static getMulticlass(): Entity {
    const character = this.createBaseCharacter('Versatile Adventurer');
    
    const characterData: CharacterData = {
      abilities: {
        strength: 16,
        dexterity: 16,
        constitution: 14,
        intelligence: 12,
        wisdom: 10,
        charisma: 10
      },
      hitPoints: {
        max: 18,
        current: 18,
        temporary: 0,
        nonLethal: 0
      },
      baseAttackBonus: 1,
      savingThrows: {
        fortitude: 2,
        reflex: 2,
        will: 0
      },
      classes: [
        {
          id: 'fighter',
          name: 'Fighter',
          level: 1,
          hitDie: 10,
          skillsPerLevel: 2,
          baseAttackBonus: [1],
          baseSaves: {
            fortitude: [2],
            reflex: [0],
            will: [0]
          }
        },
        {
          id: 'rogue',
          name: 'Rogue',
          level: 1,
          hitDie: 8,
          skillsPerLevel: 8,
          baseAttackBonus: [0],
          baseSaves: {
            fortitude: [0],
            reflex: [2],
            will: [0]
          }
        }
      ],
      classFeatures: [
        {
          id: 'class.rogue.sneak_attack',
          name: 'Sneak Attack',
          classId: 'rogue',
          level: 1,
          options: {}
        }
      ],
      feats: [
        {
          id: 'feat.weapon_focus',
          name: 'Weapon Focus',
          options: { weaponType: 'longsword' }
        },
        {
          id: 'feat.dodge',
          name: 'Dodge',
          options: {}
        }
      ],
      skills: {
        1: { ranks: 1, ability: 'strength' },   // Climb
        2: { ranks: 1, ability: 'dexterity' },  // Acrobatics
        5: { ranks: 1, ability: 'strength' },   // Intimidate
        7: { ranks: 1, ability: 'dexterity' },  // Stealth
        9: { ranks: 1, ability: 'dexterity' },  // Sleight of Hand
        21: { ranks: 1, ability: 'wisdom' }     // Perception
      },
      classSkills: [1, 2, 5, 7, 9, 21],
      equipment: {
        armor: [
          {
            id: 'item.chain_shirt',
            name: 'Chain Shirt',
            type: 'light',
            acBonus: 4,
            maxDex: 4,
            checkPenalty: -2,
            spellFailure: 20,
            equipped: true
          }
        ],
        weapons: [
          {
            id: 'item.longsword',
            name: 'Longsword',
            category: 'martial',
            damage: '1d8',
            damageType: 'slashing',
            critical: '19-20/x2',
            weight: 4,
            equipped: true
          },
          {
            id: 'item.shortbow',
            name: 'Shortbow',
            category: 'martial',
            damage: '1d6',
            damageType: 'piercing',
            critical: 'x3',
            range: 60,
            weight: 2,
            equipped: true
          }
        ]
      }
    };
    
    character.character = characterData;
    return character;
  }
  
  /**
   * Get all sample characters
   */
  static getAllCharacters(): Entity[] {
    return [
      this.getFighter(),
      this.getRogue(),
      this.getBarbarian(),
      this.getCleric(),
      this.getMulticlass()
    ];
  }
} 