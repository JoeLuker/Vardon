/**
 * Database Driver Tests
 * 
 * Tests for the Database Driver components to ensure they correctly implement
 * the Unix-like file operations interface.
 */

import { 
  DatabaseDriver, 
  DatabasePath, 
  DatabaseReadResult,
  DatabaseErrorCode,
  DatabaseOperation 
} from './DatabaseDriver';
import { SupabaseDatabaseDriver } from './SupabaseDatabaseDriver';
import { StandardSchemas } from './SchemaDescriptor';

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        maybeSingle: jest.fn(() => Promise.resolve({ data: { id: 1, name: 'Test' }, error: null }))
      })),
      in: jest.fn(() => ({
        maybeSingle: jest.fn(() => Promise.resolve({ data: { id: 1, name: 'Test' }, error: null }))
      }))
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => Promise.resolve({ data: { id: 1, name: 'Test' }, error: null }))
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ data: { id: 1, name: 'Test' }, error: null }))
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  })
};

describe('DatabaseDriver', () => {
  describe('SupabaseDatabaseDriver', () => {
    let driver: SupabaseDatabaseDriver;
    
    beforeEach(() => {
      driver = new SupabaseDatabaseDriver(mockSupabaseClient as any, true);
      
      // Register schemas
      driver.registerSchema('character', StandardSchemas.Character);
      driver.registerSchema('ability', StandardSchemas.Ability);
      driver.registerSchema('character_ability', StandardSchemas.CharacterAbility);
    });
    
    describe('parsePath', () => {
      it('should parse a simple path', () => {
        const path = '/db/character/1';
        const dbPath = driver.parsePath(path);
        
        expect(dbPath).toEqual({
          resource: 'character',
          id: '1'
        });
      });
      
      it('should parse a nested path', () => {
        const path = '/db/character/1/ability/strength';
        const dbPath = driver.parsePath(path);
        
        expect(dbPath).toEqual({
          resource: 'character',
          id: '1',
          subResource: 'ability',
          subId: 'strength'
        });
      });
      
      it('should throw for an invalid path', () => {
        const path = 'invalid-path';
        
        expect(() => driver.parsePath(path)).toThrow();
      });
    });
    
    describe('open', () => {
      it('should open a resource and return a valid file descriptor', async () => {
        const path = '/db/character/1';
        const fd = await driver.open(path, 0);
        
        expect(fd).toBeGreaterThanOrEqual(0);
      });
      
      it('should return an error code for a non-existent schema', async () => {
        const path = '/db/nonexistent/1';
        const fd = await driver.open(path, 0);
        
        expect(fd).toBeLessThan(0);
        expect(fd).toBe(DatabaseErrorCode.INVALID_OPERATION);
      });
    });
    
    describe('read', () => {
      it('should read a resource and fill the buffer', async () => {
        // Open a resource
        const path = '/db/character/1';
        const fd = await driver.open(path, 0);
        
        expect(fd).toBeGreaterThanOrEqual(0);
        
        // Read the resource
        const buffer: any = {};
        const result = await driver.read(fd, buffer);
        
        expect(result).toBe(DatabaseErrorCode.SUCCESS);
        expect(buffer.id).toBe(1);
        expect(buffer.name).toBe('Test');
      });
      
      it('should return an error code for an invalid file descriptor', async () => {
        const buffer: any = {};
        const result = await driver.read(9999, buffer);
        
        expect(result).toBe(DatabaseErrorCode.INVALID_OPERATION);
      });
    });
    
    describe('close', () => {
      it('should close an open file descriptor', async () => {
        // Open a resource
        const path = '/db/character/1';
        const fd = await driver.open(path, 0);
        
        expect(fd).toBeGreaterThanOrEqual(0);
        
        // Close the file descriptor
        const result = await driver.close(fd);
        
        expect(result).toBe(DatabaseErrorCode.SUCCESS);
        
        // Should not be able to read from it anymore
        const buffer: any = {};
        const readResult = await driver.read(fd, buffer);
        
        expect(readResult).toBe(DatabaseErrorCode.INVALID_OPERATION);
      });
      
      it('should return an error code for an invalid file descriptor', async () => {
        const result = await driver.close(9999);
        
        expect(result).toBe(DatabaseErrorCode.INVALID_OPERATION);
      });
    });
    
    describe('write', () => {
      it('should write to a resource', async () => {
        // Open a resource for writing
        const path = '/db/character/1';
        const fd = await driver.open(path, 2); // 2 = write mode
        
        expect(fd).toBeGreaterThanOrEqual(0);
        
        // Write to the resource
        const buffer = {
          id: 1,
          name: 'Updated Name'
        };
        const result = await driver.write(fd, buffer);
        
        expect(result).toBe(DatabaseErrorCode.SUCCESS);
      });
      
      it('should return an error code for an invalid file descriptor', async () => {
        const buffer = {
          id: 1,
          name: 'Test'
        };
        const result = await driver.write(9999, buffer);
        
        expect(result).toBe(DatabaseErrorCode.INVALID_OPERATION);
      });
    });
    
    describe('ioctl', () => {
      it('should perform a custom operation', async () => {
        // Open a resource
        const path = '/db/character/1';
        const fd = await driver.open(path, 0);
        
        expect(fd).toBeGreaterThanOrEqual(0);
        
        // Perform a custom query
        const result = await driver.ioctl(fd, DatabaseOperation.QUERY, {
          query: '*, game_character_ability(*)'
        });
        
        expect(result).toBe(DatabaseErrorCode.SUCCESS);
      });
      
      it('should return an error code for an invalid file descriptor', async () => {
        const result = await driver.ioctl(9999, DatabaseOperation.QUERY, {
          query: '*'
        });
        
        expect(result).toBe(DatabaseErrorCode.INVALID_OPERATION);
      });
    });
    
    describe('exists', () => {
      it('should check if a resource exists', async () => {
        const path = '/db/character/1';
        const exists = await driver.exists(path);
        
        expect(exists).toBe(true);
      });
      
      it('should return false for a non-existent resource', async () => {
        // Mock the Supabase client to return no data
        mockSupabaseClient.from().select().eq().maybeSingle.mockResolvedValueOnce({ data: null, error: null });
        
        const path = '/db/character/9999';
        const exists = await driver.exists(path);
        
        expect(exists).toBe(false);
      });
    });
  });
});