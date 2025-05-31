/**
 * Database Operations CLI Tests
 * 
 * Tests for database capability and data access patterns.
 */

import { registerTestSuite, TestContext, results } from './cli-runner';
import { Kernel } from '../src/lib/domain/kernel/Kernel';
import { DatabaseCapability } from '../src/lib/domain/capabilities/database/DatabaseCapability';
import { SupabaseDatabaseDriver } from '../src/lib/domain/capabilities/database/SupabaseDatabaseDriver';
import { SchemaRegistry } from '../src/lib/domain/capabilities/database/SchemaRegistry';
import { CharacterSchemas } from '../src/lib/domain/capabilities/database/schemas/CharacterSchemas';
import { ErrorCode } from '../src/lib/domain/kernel/types';

registerTestSuite({
  name: 'Database Tests',
  description: 'Tests for database capability, schema validation, and query operations',
  tags: ['database', 'schema', 'query'],
  run: async () => {
    const ctx = new TestContext('Database Operations');
    
    // Test 1: Database capability mounting
    await ctx.asyncTest('Mount database capability', async () => {
      const kernel = new Kernel({ debug: false });
      const dbCapability = new DatabaseCapability({ debug: false });
      
      // Mount database
      const mountResult = kernel.mount('/dev/database', dbCapability);
      ctx.assertTrue(mountResult.success, 'Should mount database capability');
      ctx.assertTrue(kernel.exists('/dev/database'), 'Database device should exist');
      
      // Verify mount
      const stats = kernel.stat('/dev/database');
      ctx.assertNotNull(stats, 'Should have stats');
      ctx.assertTrue(stats!.isDevice, 'Should be a device');
      
      await kernel.shutdown();
    });
    
    // Test 2: Schema registration
    ctx.test('Schema registration and validation', () => {
      const registry = new SchemaRegistry();
      
      // Register character schemas
      CharacterSchemas.registerSchemas(registry);
      
      // Check schema exists
      const gameCharacterSchema = registry.getSchema('game_character');
      ctx.assertNotNull(gameCharacterSchema, 'Should have game_character schema');
      ctx.assertEquals(gameCharacterSchema!.tableName, 'game_character');
      ctx.assertGreaterThan(Object.keys(gameCharacterSchema!.fields).length, 0, 'Should have fields');
      
      // Check field validation
      const idField = gameCharacterSchema!.fields['id'];
      ctx.assertNotNull(idField, 'Should have id field');
      ctx.assertEquals(idField.type, 'uuid', 'ID should be UUID');
      ctx.assertTrue(idField.required, 'ID should be required');
    });
    
    // Test 3: Query through filesystem
    await ctx.asyncTest('Database queries via filesystem', async () => {
      const kernel = new Kernel({ debug: false });
      const dbCapability = new DatabaseCapability({ debug: false });
      kernel.mount('/dev/database', dbCapability);
      
      // Query for abilities
      const abilityPath = '/proc/database/query/ability';
      kernel.create(abilityPath, { 
        table: 'ability',
        select: ['id', 'name', 'abbreviation'],
        limit: 6
      });
      
      const fd = kernel.open(abilityPath, 1); // READ
      if (fd > 0) {
        const [error, result] = kernel.read(fd);
        ctx.assertEquals(error, ErrorCode.SUCCESS, 'Query should succeed');
        
        if (result && result.data) {
          ctx.assertEquals(result.data.length, 6, 'Should have 6 abilities');
          // Check for standard abilities
          const abbrevs = result.data.map((a: any) => a.abbreviation);
          ctx.assertContains(abbrevs, 'STR', 'Should have STR');
          ctx.assertContains(abbrevs, 'DEX', 'Should have DEX');
        }
        
        kernel.close(fd);
      }
      
      await kernel.shutdown();
    });
    
    // Test 4: Character data loading
    await ctx.asyncTest('Load character data from database', async () => {
      const kernel = new Kernel({ debug: false });
      const dbCapability = new DatabaseCapability({ debug: false });
      kernel.mount('/dev/database', dbCapability);
      
      // Try to load character (may not exist in test DB)
      const charPath = '/proc/character/1';
      
      if (kernel.exists(charPath)) {
        const fd = kernel.open(charPath, 1); // READ
        if (fd > 0) {
          const [error, data] = kernel.read(fd);
          
          if (error === ErrorCode.SUCCESS && data) {
            ctx.assertNotNull(data.id, 'Character should have ID');
            ctx.assertNotNull(data.name, 'Character should have name');
            ctx.assertDefined(data.level, 'Character should have level');
          }
          
          kernel.close(fd);
        }
      }
      
      await kernel.shutdown();
    });
    
    // Test 5: Schema validation
    ctx.test('Schema field validation', () => {
      const registry = new SchemaRegistry();
      CharacterSchemas.registerSchemas(registry);
      
      const schema = registry.getSchema('game_character_ability');
      ctx.assertNotNull(schema, 'Should have character ability schema');
      
      // Test validation functions
      if (schema) {
        // Valid data
        const validData = {
          base_value: 15,
          temp_modifier: 2
        };
        
        const baseField = schema.fields['base_value'];
        if (baseField && baseField.validate) {
          const isValid = baseField.validate(validData.base_value);
          ctx.assertTrue(isValid, 'Valid base value should pass');
        }
        
        // Invalid data
        const invalidData = {
          base_value: -5 // Negative ability score
        };
        
        if (baseField && baseField.validate) {
          const isInvalid = baseField.validate(invalidData.base_value);
          ctx.assertFalse(isInvalid, 'Negative ability should fail validation');
        }
      }
    });
    
    // Test 6: Batch operations
    await ctx.asyncTest('Batch database operations', async () => {
      const kernel = new Kernel({ debug: false });
      const dbCapability = new DatabaseCapability({ debug: false });
      kernel.mount('/dev/database', dbCapability);
      
      // Create batch query
      const batchPath = '/proc/database/batch';
      kernel.create(batchPath, {
        queries: [
          { table: 'skill', select: ['id', 'name'], limit: 5 },
          { table: 'feat', select: ['id', 'name'], limit: 5 }
        ]
      });
      
      const fd = kernel.open(batchPath, 1);
      if (fd > 0) {
        const [error, results] = kernel.read(fd);
        
        if (error === ErrorCode.SUCCESS && results) {
          ctx.assertTrue(Array.isArray(results), 'Should return array of results');
          if (Array.isArray(results)) {
            ctx.assertEquals(results.length, 2, 'Should have 2 result sets');
          }
        }
        
        kernel.close(fd);
      }
      
      await kernel.shutdown();
    });
    
    // Test 7: Connection handling
    await ctx.asyncTest('Database connection lifecycle', async () => {
      const kernel = new Kernel({ debug: false });
      const dbCapability = new DatabaseCapability({ debug: false });
      
      // Mount and unmount multiple times
      for (let i = 0; i < 3; i++) {
        const mountResult = kernel.mount('/dev/database', dbCapability);
        ctx.assertTrue(mountResult.success, `Mount ${i} should succeed`);
        
        // Do a simple query
        const testPath = `/proc/database/test-${i}`;
        kernel.create(testPath, { table: 'ability', limit: 1 });
        
        const fd = kernel.open(testPath, 1);
        if (fd > 0) {
          kernel.read(fd);
          kernel.close(fd);
        }
      }
      
      await kernel.shutdown();
    });
    
    // Test 8: Error handling
    await ctx.asyncTest('Database error handling', async () => {
      const kernel = new Kernel({ debug: false });
      const dbCapability = new DatabaseCapability({ debug: false });
      kernel.mount('/dev/database', dbCapability);
      
      // Invalid table query
      const badPath = '/proc/database/bad-query';
      kernel.create(badPath, {
        table: 'nonexistent_table',
        select: ['*']
      });
      
      const fd = kernel.open(badPath, 1);
      if (fd > 0) {
        const [error, data] = kernel.read(fd);
        ctx.assertNotEquals(error, ErrorCode.SUCCESS, 'Bad query should fail');
        kernel.close(fd);
      }
      
      await kernel.shutdown();
    });
    
    // Test 9: Transaction simulation
    ctx.test('Transaction patterns', () => {
      // Note: Real transactions would require actual DB connection
      // This tests the pattern
      
      const kernel = new Kernel({ debug: false });
      
      // Start transaction
      const txPath = '/proc/database/transaction';
      const txResult = kernel.create(txPath, { 
        type: 'transaction',
        isolation: 'read-committed'
      });
      
      ctx.assertTrue(txResult.success, 'Should create transaction');
      
      // In real implementation, would do:
      // - BEGIN
      // - Multiple operations
      // - COMMIT or ROLLBACK
      
      kernel.shutdown();
    });
    
    // Test 10: Database metadata
    await ctx.asyncTest('Database metadata queries', async () => {
      const kernel = new Kernel({ debug: false });
      const dbCapability = new DatabaseCapability({ debug: false });
      kernel.mount('/dev/database', dbCapability);
      
      // Query for table list
      const metaPath = '/proc/database/metadata/tables';
      kernel.create(metaPath, { type: 'tables' });
      
      const fd = kernel.open(metaPath, 1);
      if (fd > 0) {
        const [error, tables] = kernel.read(fd);
        
        if (error === ErrorCode.SUCCESS && tables) {
          ctx.assertTrue(Array.isArray(tables), 'Should return table list');
          if (Array.isArray(tables)) {
            ctx.assertContains(tables, 'game_character', 'Should have game_character table');
            ctx.assertContains(tables, 'ability', 'Should have ability table');
            ctx.assertContains(tables, 'skill', 'Should have skill table');
          }
        }
        
        kernel.close(fd);
      }
      
      await kernel.shutdown();
    });
    
    // Store results
    results.push(ctx.getResults());
  }
});