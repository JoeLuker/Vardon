/**
 * Character-related Schema Descriptors
 * 
 * This module provides schema descriptors for character-related entities in the database.
 * It follows Unix principles by providing a clear contract for data structure.
 */

import type { SchemaDescriptor } from '../SchemaDescriptor';
import { StandardSchemas } from '../SchemaDescriptor';

/**
 * Character schema descriptor
 */
export const CharacterSchema: SchemaDescriptor = {
  tableName: 'game_character',
  primaryKey: 'id',
  fields: [
    {
      dbField: 'id',
      property: 'id',
      required: true
    },
    {
      dbField: 'name',
      property: 'name',
      required: true
    },
    {
      dbField: 'max_hp',
      property: 'maxHp',
      defaultValue: 0
    },
    {
      dbField: 'current_hp',
      property: 'currentHp',
      defaultValue: 0
    },
    {
      dbField: 'user_id',
      property: 'userId'
    },
    {
      dbField: 'level',
      property: 'level',
      defaultValue: 1
    },
    {
      dbField: 'xp',
      property: 'xp',
      defaultValue: 0
    },
    {
      dbField: 'created_at',
      property: 'createdAt'
    },
    {
      dbField: 'updated_at',
      property: 'updatedAt'
    }
  ]
};

/**
 * Character Class schema descriptor
 */
export const CharacterClassSchema: SchemaDescriptor = {
  tableName: 'game_character_class',
  primaryKey: 'id',
  fields: [
    {
      dbField: 'id',
      property: 'id',
      required: true
    },
    {
      dbField: 'game_character_id',
      property: 'characterId',
      required: true
    },
    {
      dbField: 'class_id',
      property: 'classId',
      required: true
    },
    {
      dbField: 'level',
      property: 'level',
      defaultValue: 1
    },
    {
      dbField: 'is_favored',
      property: 'isFavored',
      defaultValue: false
    },
    {
      dbField: 'attack_bonus',
      property: 'attackBonus',
      defaultValue: 0
    }
  ],
  relations: {
    class: {
      tableName: 'class',
      foreignKey: 'class_id',
      referencedKey: 'id',
      isArray: false,
      schema: {
        tableName: 'class',
        primaryKey: 'id',
        fields: [
          {
            dbField: 'id',
            property: 'id',
            required: true
          },
          {
            dbField: 'name',
            property: 'name',
            required: true
          },
          {
            dbField: 'label',
            property: 'label'
          },
          {
            dbField: 'description',
            property: 'description'
          },
          {
            dbField: 'hit_die',
            property: 'hitDie',
            defaultValue: 6
          },
          {
            dbField: 'skill_ranks_per_level',
            property: 'skillRanksPerLevel',
            defaultValue: 2
          },
          {
            dbField: 'bab_progression_id',
            property: 'babProgressionId'
          }
        ]
      }
    }
  }
};

/**
 * Character Ancestry schema descriptor
 */
export const CharacterAncestrySchema: SchemaDescriptor = {
  tableName: 'game_character_ancestry',
  primaryKey: 'id',
  fields: [
    {
      dbField: 'id',
      property: 'id',
      required: true
    },
    {
      dbField: 'game_character_id',
      property: 'characterId',
      required: true
    },
    {
      dbField: 'ancestry_id',
      property: 'ancestryId',
      required: true
    }
  ],
  relations: {
    ancestry: {
      tableName: 'ancestry',
      foreignKey: 'ancestry_id',
      referencedKey: 'id',
      isArray: false,
      schema: {
        tableName: 'ancestry',
        primaryKey: 'id',
        fields: [
          {
            dbField: 'id',
            property: 'id',
            required: true
          },
          {
            dbField: 'name',
            property: 'name',
            required: true
          },
          {
            dbField: 'label',
            property: 'label'
          },
          {
            dbField: 'description',
            property: 'description'
          },
          {
            dbField: 'size',
            property: 'size'
          },
          {
            dbField: 'base_speed',
            property: 'baseSpeed',
            defaultValue: 30
          }
        ]
      }
    }
  }
};

/**
 * Character Feat schema descriptor
 */
export const CharacterFeatSchema: SchemaDescriptor = {
  tableName: 'game_character_feat',
  primaryKey: 'id',
  fields: [
    {
      dbField: 'id',
      property: 'id',
      required: true
    },
    {
      dbField: 'game_character_id',
      property: 'characterId',
      required: true
    },
    {
      dbField: 'feat_id',
      property: 'featId',
      required: true
    },
    {
      dbField: 'level_gained',
      property: 'levelGained',
      defaultValue: 1
    },
    {
      dbField: 'notes',
      property: 'notes'
    }
  ],
  relations: {
    feat: {
      tableName: 'feat',
      foreignKey: 'feat_id',
      referencedKey: 'id',
      isArray: false,
      schema: {
        tableName: 'feat',
        primaryKey: 'id',
        fields: [
          {
            dbField: 'id',
            property: 'id',
            required: true
          },
          {
            dbField: 'name',
            property: 'name',
            required: true
          },
          {
            dbField: 'label',
            property: 'label'
          },
          {
            dbField: 'description',
            property: 'description'
          },
          {
            dbField: 'benefit',
            property: 'benefit'
          },
          {
            dbField: 'normal',
            property: 'normal'
          },
          {
            dbField: 'special',
            property: 'special'
          },
          {
            dbField: 'prerequisites',
            property: 'prerequisites'
          },
          {
            dbField: 'type',
            property: 'type'
          }
        ]
      }
    }
  }
};

/**
 * Character Skill Rank schema descriptor
 */
export const CharacterSkillRankSchema: SchemaDescriptor = {
  tableName: 'game_character_skill_rank',
  primaryKey: 'id',
  fields: [
    {
      dbField: 'id',
      property: 'id',
      required: true
    },
    {
      dbField: 'game_character_id',
      property: 'characterId',
      required: true
    },
    {
      dbField: 'skill_id',
      property: 'skillId',
      required: true
    },
    {
      dbField: 'applied_at_level',
      property: 'appliedAtLevel',
      defaultValue: 1
    }
  ],
  relations: {
    skill: {
      tableName: 'skill',
      foreignKey: 'skill_id',
      referencedKey: 'id',
      isArray: false,
      schema: StandardSchemas.Skill
    }
  }
};

/**
 * Export all character-related schemas
 */
export const CharacterSchemas = {
  Character: CharacterSchema,
  CharacterClass: CharacterClassSchema,
  CharacterAncestry: CharacterAncestrySchema,
  CharacterFeat: CharacterFeatSchema,
  CharacterSkillRank: CharacterSkillRankSchema,
  CharacterAbility: StandardSchemas.CharacterAbility
};