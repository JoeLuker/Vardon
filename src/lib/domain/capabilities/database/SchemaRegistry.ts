/**
 * Schema Registry
 * 
 * This module provides a central registry for all database schemas in the application.
 * It follows the Unix philosophy of having a single source of truth for schema definitions.
 */

import type { SchemaDescriptor } from './SchemaDescriptor';
import { StandardSchemas } from './SchemaDescriptor';
import { Schemas } from './schemas';

/**
 * Schema Registry class
 * Singleton that manages all schema descriptors
 */
export class SchemaRegistry {
  /** Schema map by resource type */
  private schemas: Map<string, SchemaDescriptor> = new Map();
  
  /** Debug mode flag */
  private debug: boolean;
  
  /** Singleton instance */
  private static instance: SchemaRegistry;
  
  /**
   * Get the singleton instance
   * @param debug Whether to enable debug logging
   * @returns Schema registry instance
   */
  public static getInstance(debug: boolean = false): SchemaRegistry {
    if (!SchemaRegistry.instance) {
      SchemaRegistry.instance = new SchemaRegistry(debug);
    }
    return SchemaRegistry.instance;
  }
  
  /**
   * Create a new schema registry
   * @param debug Whether to enable debug logging
   */
  private constructor(debug: boolean = false) {
    this.debug = debug;
    this.initializeStandardSchemas();
    
    if (this.debug) {
      console.log('[SchemaRegistry] Initialized with standard schemas:', 
        Array.from(this.schemas.keys()));
    }
  }
  
  /**
   * Initialize standard schemas
   */
  private initializeStandardSchemas(): void {
    // Register all schemas from the centralized Schemas object
    Object.entries(Schemas).forEach(([name, schema]) => {
      this.registerSchema(name.toLowerCase(), schema);
    });
    
    // Register composite schemas for nested resources with specific names
    this.registerSchema('character_ability', Schemas.CharacterAbility);
    this.registerSchema('character_spell', Schemas.CharacterSpell);
    this.registerSchema('character_feat', Schemas.CharacterFeat);
    this.registerSchema('character_class', Schemas.CharacterClass);
  }
  
  /**
   * Register a schema
   * @param resourceType Resource type
   * @param schema Schema descriptor
   */
  public registerSchema(resourceType: string, schema: SchemaDescriptor): void {
    // Normalize resource type to lowercase
    const normalizedType = resourceType.toLowerCase();
    
    // Register the schema
    this.schemas.set(normalizedType, schema);
    
    if (this.debug) {
      console.log(`[SchemaRegistry] Registered schema for ${normalizedType}`);
    }
  }
  
  /**
   * Get a schema by resource type
   * @param resourceType Resource type
   * @returns Schema descriptor or undefined if not found
   */
  public getSchema(resourceType: string): SchemaDescriptor | undefined {
    // Normalize resource type to lowercase
    const normalizedType = resourceType.toLowerCase();
    
    // Get the schema
    const schema = this.schemas.get(normalizedType);
    
    if (!schema && this.debug) {
      console.warn(`[SchemaRegistry] No schema found for ${normalizedType}`);
    }
    
    return schema;
  }
  
  /**
   * Check if a schema exists
   * @param resourceType Resource type
   * @returns Whether the schema exists
   */
  public hasSchema(resourceType: string): boolean {
    // Normalize resource type to lowercase
    const normalizedType = resourceType.toLowerCase();
    
    // Check if the schema exists
    return this.schemas.has(normalizedType);
  }
  
  /**
   * Get all registered schema types
   * @returns Array of registered schema types
   */
  public getSchemaTypes(): string[] {
    return Array.from(this.schemas.keys());
  }
  
  /**
   * Get a schema for a database path
   * @param path Database path (e.g., "/db/character/1/ability")
   * @returns Schema descriptor or undefined if not found
   */
  public getSchemaForPath(path: string): SchemaDescriptor | undefined {
    // Parse the path
    const parts = path.replace(/^\/db\//, '').split('/');
    
    if (parts.length < 1) {
      if (this.debug) {
        console.warn(`[SchemaRegistry] Invalid path: ${path}`);
      }
      return undefined;
    }
    
    // Get the resource type
    const resourceType = parts[0];
    
    // If there's a sub-resource, try to get a composite schema
    if (parts.length >= 3) {
      const subResourceType = parts[2];
      const compositeType = `${resourceType}_${subResourceType}`;
      
      // Try the composite schema first
      const compositeSchema = this.getSchema(compositeType);
      if (compositeSchema) {
        return compositeSchema;
      }
      
      // Fall back to the sub-resource schema
      return this.getSchema(subResourceType);
    }
    
    // Otherwise, get the resource schema
    return this.getSchema(resourceType);
  }
}

/**
 * Convenience function to get the global schema registry
 * @param debug Whether to enable debug logging
 * @returns Schema registry instance
 */
export function getSchemaRegistry(debug: boolean = false): SchemaRegistry {
  return SchemaRegistry.getInstance(debug);
}