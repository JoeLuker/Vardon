/**
 * Schema Descriptor Module
 * 
 * This module provides a type-safe way to describe database schemas
 * and map between database field names and application property names.
 * 
 * Following Unix philosophy, this module does one thing well:
 * It defines a clear contract for how database fields map to application properties.
 */

/**
 * Field descriptor for a database field
 */
export interface FieldDescriptor<T = any> {
  /** Database field name */
  dbField: string;
  
  /** Application property name */
  property: string;
  
  /** Default value if field is missing */
  defaultValue?: T;
  
  /** Whether field is required */
  required?: boolean;
  
  /** Type conversion function */
  convert?: (value: any) => T;
  
  /** Validation function */
  validate?: (value: T) => boolean;
  
  /** Alternative field names that might be used in the database */
  alternativeFields?: string[];
}

/**
 * Schema descriptor for a database table
 */
export interface SchemaDescriptor {
  /** Table name in the database */
  tableName: string;
  
  /** Primary key field name */
  primaryKey: string;
  
  /** Field descriptors */
  fields: FieldDescriptor[];
  
  /** Related schemas (joins) */
  relations?: {
    [key: string]: RelationDescriptor;
  };
}

/**
 * Relation descriptor for a join between tables
 */
export interface RelationDescriptor {
  /** Related table name */
  tableName: string;
  
  /** Field in this table that references the related table */
  foreignKey: string;
  
  /** Primary key in the related table */
  referencedKey: string;
  
  /** Whether this is a one-to-many relation */
  isArray?: boolean;
  
  /** Schema descriptor for the related table */
  schema: SchemaDescriptor;
}

/**
 * Standard schema descriptors for common entities
 */
export const StandardSchemas = {
  /** Ability schema */
  Ability: {
    tableName: 'ability',
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
        dbField: 'ability_type',
        property: 'abilityType'
      }
    ]
  } as SchemaDescriptor,
  
  /** Character ability score schema */
  CharacterAbility: {
    tableName: 'game_character_ability',
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
        dbField: 'ability_id',
        property: 'abilityId',
        required: true
      },
      {
        dbField: 'value',
        property: 'score',
        defaultValue: 10,
        alternativeFields: ['score']
      }
    ],
    relations: {
      ability: {
        tableName: 'ability',
        foreignKey: 'ability_id',
        referencedKey: 'id',
        isArray: false,
        schema: {
          tableName: 'ability',
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
            }
          ]
        }
      }
    }
  } as SchemaDescriptor,
  
  /** Character schema */
  Character: {
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
        dbField: 'label',
        property: 'label'
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
      }
    ]
  } as SchemaDescriptor,
  
  /** Skill schema */
  Skill: {
    tableName: 'skill',
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
        dbField: 'ability_id',
        property: 'abilityId'
      },
      {
        dbField: 'trained_only',
        property: 'trainedOnly',
        defaultValue: false
      }
    ]
  } as SchemaDescriptor
};

/**
 * Apply a schema to normalize data from the database to application format
 * @param schema Schema descriptor
 * @param dbData Database data
 * @returns Normalized data for application use
 */
export function normalizeFromDatabase(schema: SchemaDescriptor, dbData: any): any {
  if (!dbData) return null;
  
  const result: any = {};
  
  // Process each field according to the schema
  for (const field of schema.fields) {
    let value = dbData[field.dbField];
    
    // Check alternative field names if primary field is undefined
    if (value === undefined && field.alternativeFields) {
      for (const altField of field.alternativeFields) {
        if (dbData[altField] !== undefined) {
          value = dbData[altField];
          break;
        }
      }
    }
    
    // Apply default value if field is still undefined
    if (value === undefined && field.defaultValue !== undefined) {
      value = field.defaultValue;
    }
    
    // Apply type conversion if specified
    if (value !== undefined && field.convert) {
      value = field.convert(value);
    }
    
    // Apply validation if specified
    if (value !== undefined && field.validate && !field.validate(value)) {
      console.warn(`Validation failed for field ${field.property}`);
      // Use default value if validation fails and default exists
      if (field.defaultValue !== undefined) {
        value = field.defaultValue;
      }
    }
    
    // Set the property value
    result[field.property] = value;
  }
  
  // Process relations
  if (schema.relations) {
    for (const [relationName, relation] of Object.entries(schema.relations)) {
      const relatedData = dbData[relationName];
      
      if (relatedData) {
        if (relation.isArray) {
          // Handle one-to-many relation
          result[relationName] = Array.isArray(relatedData)
            ? relatedData.map(item => normalizeFromDatabase(relation.schema, item))
            : [];
        } else {
          // Handle one-to-one relation
          result[relationName] = normalizeFromDatabase(relation.schema, relatedData);
        }
      }
    }
  }
  
  return result;
}

/**
 * Prepare data for database from application format
 * @param schema Schema descriptor
 * @param appData Application data
 * @returns Data formatted for database operations
 */
export function prepareForDatabase(schema: SchemaDescriptor, appData: any): any {
  if (!appData) return null;
  
  const result: any = {};
  
  // Process each field according to the schema
  for (const field of schema.fields) {
    // Skip if property doesn't exist and isn't required
    if (appData[field.property] === undefined && !field.required) {
      continue;
    }
    
    // Use the property value or default
    let value = appData[field.property];
    
    if (value === undefined && field.defaultValue !== undefined) {
      value = field.defaultValue;
    }
    
    // Always use the primary database field name
    result[field.dbField] = value;
  }
  
  return result;
}