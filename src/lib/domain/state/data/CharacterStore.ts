import type { Entity, CharacterData } from '../../types/EntityTypes';

/**
 * Interface for storage drivers
 */
export interface StorageDriver {
  save(id: string, data: any): Promise<void>;
  load(id: string): Promise<any | null>;
  delete(id: string): Promise<boolean>;
  list(): Promise<string[]>;
}

/**
 * Local storage implementation
 */
export class LocalStorageDriver implements StorageDriver {
  constructor(private prefix: string = 'character_') {}
  
  async save(id: string, data: any): Promise<void> {
    localStorage.setItem(`${this.prefix}${id}`, JSON.stringify(data));
  }
  
  async load(id: string): Promise<any | null> {
    const data = localStorage.getItem(`${this.prefix}${id}`);
    return data ? JSON.parse(data) : null;
  }
  
  async delete(id: string): Promise<boolean> {
    localStorage.removeItem(`${this.prefix}${id}`);
    return true;
  }
  
  async list(): Promise<string[]> {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key.substring(this.prefix.length));
      }
    }
    return keys;
  }
}

export interface ValidationIssue {
  path: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

/**
 * Character store for saving and loading character data
 */
export class CharacterStore {
  constructor(private storage: StorageDriver) {}
  
  /**
   * Validate a character entity
   */
  validateEntity(entity: Entity): ValidationResult {
    const issues: ValidationIssue[] = [];
    
    // Check required fields
    if (!entity.id) {
      issues.push({
        path: 'id',
        message: 'Entity ID is required',
        severity: 'error'
      });
    }
    
    if (!entity.name) {
      issues.push({
        path: 'name',
        message: 'Entity name is required',
        severity: 'error'
      });
    }
    
    if (!entity.type) {
      issues.push({
        path: 'type',
        message: 'Entity type is required',
        severity: 'error'
      });
    }
    
    if (!entity.metadata) {
      issues.push({
        path: 'metadata',
        message: 'Entity metadata is required',
        severity: 'error'
      });
    }
    
    // Validate character data if present
    if (entity.character) {
      this.validateCharacterData(entity.character, issues);
    }
    
    return {
      valid: issues.filter(i => i.severity === 'error').length === 0,
      issues
    };
  }
  
  /**
   * Validate character data
   */
  private validateCharacterData(character: CharacterData, issues: ValidationIssue[]): void {
    // Validate abilities
    if (character.abilities) {
      const requiredAbilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
      
      for (const ability of requiredAbilities) {
        if (character.abilities[ability] === undefined) {
          issues.push({
            path: `character.abilities.${ability}`,
            message: `Ability score ${ability} is required`,
            severity: 'warning'
          });
        } else if (typeof character.abilities[ability] !== 'number') {
          issues.push({
            path: `character.abilities.${ability}`,
            message: `Ability score ${ability} must be a number`,
            severity: 'error'
          });
        }
      }
    }
    
    // Validate classes
    if (character.classes) {
      character.classes.forEach((cls, index) => {
        if (!cls.id) {
          issues.push({
            path: `character.classes[${index}].id`,
            message: 'Class ID is required',
            severity: 'error'
          });
        }
        
        if (!cls.name) {
          issues.push({
            path: `character.classes[${index}].name`,
            message: 'Class name is required',
            severity: 'error'
          });
        }
        
        if (typeof cls.level !== 'number' || cls.level < 1) {
          issues.push({
            path: `character.classes[${index}].level`,
            message: 'Class level must be a positive number',
            severity: 'error'
          });
        }
      });
    }
    
    // Additional validations could be added here
  }
  
  /**
   * Save a character
   */
  async saveCharacter(entity: Entity): Promise<void> {
    // Validate the entity
    const validation = this.validateEntity(entity);
    if (!validation.valid) {
      throw new Error(`Invalid character entity: ${JSON.stringify(validation.issues)}`);
    }
    
    // Clone the entity to avoid reference issues
    const character = JSON.parse(JSON.stringify(entity));
    
    // Update metadata
    character.metadata.updatedAt = Date.now();
    character.metadata.version = (character.metadata.version || 0) + 1;
    
    await this.storage.save(entity.id, character);
  }
  
  /**
   * Load a character
   */
  async loadCharacter(id: string): Promise<Entity | null> {
    const character = await this.storage.load(id);
    
    if (character) {
      // Perform schema migration if needed based on version
      // This would update old character formats to the current one
      return character;
    }
    
    return null;
  }
  
  /**
   * Delete a character
   */
  async deleteCharacter(id: string): Promise<boolean> {
    return this.storage.delete(id);
  }
  
  /**
   * List available characters
   */
  async listCharacters(): Promise<string[]> {
    return this.storage.list();
  }
  
  /**
   * Create a new character with default values
   */
  createNewCharacter(name: string): Entity {
    const id = `character_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    
    return {
      id,
      type: 'character',
      name,
      properties: {},
      character: {
        abilities: {
          strength: 10,
          dexterity: 10,
          constitution: 10,
          intelligence: 10,
          wisdom: 10,
          charisma: 10
        },
        hitPoints: {
          max: 0,
          current: 0,
          temporary: 0,
          nonLethal: 0
        },
        baseAttackBonus: 0,
        savingThrows: {
          fortitude: 0,
          reflex: 0,
          will: 0
        },
        skills: {},
        feats: [],
        traits: [],
        classFeatures: [],
        classes: []
      },
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1
      }
    };
  }
  
  /**
   * Export a character to JSON
   */
  exportCharacter(entity: Entity): string {
    return JSON.stringify(entity, null, 2);
  }
  
  /**
   * Import a character from JSON
   */
  importCharacter(json: string): Entity {
    try {
      const entity = JSON.parse(json);
      
      // Validate the entity
      const validation = this.validateEntity(entity);
      if (!validation.valid) {
        throw new Error(`Invalid character data: ${JSON.stringify(validation.issues)}`);
      }
      
      // Update the import timestamp
      entity.metadata.importedAt = Date.now();
      
      return entity;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON format: ${error.message}`);
      }
      throw error;
    }
  }
}
