/**
 * Schema Registry Tests
 *
 * Tests for the Schema Registry to ensure it correctly manages schema descriptors.
 */

import { getSchemaRegistry, SchemaRegistry } from './SchemaRegistry';
import { StandardSchemas } from './SchemaDescriptor';

describe('SchemaRegistry', () => {
	describe('getInstance', () => {
		it('should return a singleton instance', () => {
			const registry1 = getSchemaRegistry();
			const registry2 = getSchemaRegistry();

			expect(registry1).toBe(registry2);
		});

		it('should initialize with standard schemas', () => {
			const registry = getSchemaRegistry();
			const schemaTypes = registry.getSchemaTypes();

			// All standard schemas should be registered
			expect(schemaTypes).toContain('ability');
			expect(schemaTypes).toContain('character');
			expect(schemaTypes).toContain('skill');
			expect(schemaTypes).toContain('characterability');
		});
	});

	describe('registerSchema', () => {
		it('should register a new schema', () => {
			const registry = getSchemaRegistry();

			// Create a test schema
			const testSchema = {
				tableName: 'test_table',
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
					}
				]
			};

			// Register the schema
			registry.registerSchema('test', testSchema);

			// Check if the schema was registered
			expect(registry.hasSchema('test')).toBe(true);
			expect(registry.getSchema('test')).toBe(testSchema);
		});

		it('should normalize resource type to lowercase', () => {
			const registry = getSchemaRegistry();

			// Create a test schema
			const testSchema = {
				tableName: 'camel_case_table',
				primaryKey: 'id',
				fields: [
					{
						dbField: 'id',
						property: 'id',
						required: true
					}
				]
			};

			// Register the schema with a mixed-case name
			registry.registerSchema('CamelCase', testSchema);

			// Should be able to get it with lowercase
			expect(registry.hasSchema('camelcase')).toBe(true);
			expect(registry.getSchema('camelcase')).toBe(testSchema);
		});
	});

	describe('getSchemaForPath', () => {
		it('should get a schema for a simple path', () => {
			const registry = getSchemaRegistry();

			// Get a schema for a character path
			const schema = registry.getSchemaForPath('/db/character/1');

			expect(schema).toBeDefined();
			expect(schema).toBe(registry.getSchema('character'));
		});

		it('should get a composite schema for a nested path', () => {
			const registry = getSchemaRegistry();

			// Register a composite schema
			registry.registerSchema('character_ability', StandardSchemas.CharacterAbility);

			// Get a schema for a nested path
			const schema = registry.getSchemaForPath('/db/character/1/ability/strength');

			expect(schema).toBeDefined();
			expect(schema).toBe(registry.getSchema('character_ability'));
		});

		it('should fall back to the sub-resource schema if no composite schema exists', () => {
			const registry = getSchemaRegistry();

			// Clear any existing composite schema
			registry.registerSchema('character_ability', undefined);

			// Get a schema for a nested path
			const schema = registry.getSchemaForPath('/db/character/1/ability/strength');

			expect(schema).toBeDefined();
			expect(schema).toBe(registry.getSchema('ability'));
		});

		it('should return undefined for an invalid path', () => {
			const registry = getSchemaRegistry();

			// Get a schema for an invalid path
			const schema = registry.getSchemaForPath('/db');

			expect(schema).toBeUndefined();
		});

		it('should return undefined for a non-existent resource type', () => {
			const registry = getSchemaRegistry();

			// Get a schema for a non-existent resource type
			const schema = registry.getSchemaForPath('/db/nonexistent/1');

			expect(schema).toBeUndefined();
		});
	});
});
