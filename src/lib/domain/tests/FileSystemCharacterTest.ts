/**
 * Unix Character Test
 * 
 * This module tests character loading and manipulation using the Unix-style architecture.
 */

import { initializeApplication } from '../application';
// Import removed
import { OpenMode, ErrorCode } from '../kernel/types';

/**
 * Run the Unix character test
 * @returns Test result message
 */
export async function runUnixCharacterTest(): Promise<string> {
  console.log('Running Unix Character Test');
  
  // Initialize application
  const app = await initializeApplication({ debug: true });
  
  try {
    // Create mock game data with test character
    const mockGameData = {
      gameAPI: {
        getCompleteCharacterData: async (id: number) => {
          if (id === 1) {
            return {
              id: 1,
              name: 'Test Warrior',
              max_hp: 50,
              current_hp: 50
            };
          }
          return null;
        }
      }
    };
    
    // Override dbAPI
    app.dbAPI = mockGameData.gameAPI as any;
    
    // Load character using the Unix loadCharacter implementation
    if (!app.loadCharacter) {
      throw new Error('loadCharacter function not available');
    }
    
    console.log('Loading character...');
    const character = await app.loadCharacter(1);
    
    if (!character) {
      throw new Error('Failed to load character');
    }
    
    console.log('Loaded character:', character.name);
    
    // Test filesystem access to character
    const kernel = app.kernel;
    const entityPath = `/proc/character/1`;
    
    // Verify character exists in filesystem
    if (!kernel.exists(entityPath)) {
      throw new Error('Character entity not found in filesystem');
    }
    
    console.log('Character entity exists in filesystem');
    
    // Get file stats
    const stats = kernel.stat(entityPath);
    if (!stats) {
      throw new Error('Failed to stat character entity');
    }
    
    console.log('Character entity stats:', stats);
    
    // Open character file
    const fd = kernel.open(entityPath, OpenMode.READ);
    if (fd < 0) {
      throw new Error(`Failed to open character entity, error: ${fd}`);
    }
    
    try {
      // Read character data
      const entityData = {};
      const result = kernel.read(fd, entityData);
      
      if (result !== 0) {
        throw new Error(`Failed to read character entity, error: ${result}`);
      }
      
      console.log('Read character entity data successfully');
      
      // Verify character data
      if ((entityData as any).id !== '1') {
        throw new Error('Character ID mismatch');
      }
      
      if ((entityData as any).name !== 'Test Warrior') {
        throw new Error('Character name mismatch');
      }
      
      console.log('Character data validated successfully');
      
      // Test device access (should be mounted in /dev)
      const abilityDevicePath = '/dev/ability';
      if (!kernel.exists(abilityDevicePath)) {
        throw new Error('Ability device not found');
      }
      
      console.log('Ability device exists');
      
      // Open ability device
      const deviceFd = kernel.open(abilityDevicePath, OpenMode.READ);
      if (deviceFd < 0) {
        throw new Error(`Failed to open ability device, error: ${deviceFd}`);
      }
      
      try {
        // Just verify we can open the device
        console.log('Successfully opened ability device');
      } finally {
        kernel.close(deviceFd);
      }
      
      // Try a mock plugin execution
      const pluginManager = app.pluginManager;
      
      // Register a test plugin that just reads the character
      const testPlugin = {
        id: 'character-test-plugin',
        name: 'Character Test Plugin',
        description: 'Test plugin for character manipulation',
        requiredDevices: ['/dev/ability', '/dev/bonus'],
        
        async execute(kernel: any, entityPath: string, options: any = {}): Promise<number> {
          console.log(`[TestPlugin] Reading character from ${entityPath}`);
          
          // Open entity file
          const fd = kernel.open(entityPath, OpenMode.READ_WRITE);
          if (fd < 0) {
            console.error(`[TestPlugin] Failed to open character file`);
            return 1;
          }
          
          try {
            // Read entity data
            const entity = {};
            const result = kernel.read(fd, entity);
            
            if (result !== 0) {
              console.error(`[TestPlugin] Failed to read character entity`);
              return 2;
            }
            
            // Modify character properties for testing
            (entity as any).properties.testProperty = 'Plugin was here';
            (entity as any).properties.current_hp = options.newHp || 42;
            
            // Write back modified data
            const writeResult = kernel.write(fd, entity);
            if (writeResult !== 0) {
              console.error(`[TestPlugin] Failed to write character entity`);
              return 3;
            }
            
            console.log(`[TestPlugin] Character modified successfully`);
            return 0;
          } finally {
            kernel.close(fd);
          }
        }
      };
      
      // Register test plugin
      kernel.registerPlugin(testPlugin);
      
      // Execute plugin
      console.log('Executing test plugin on character...');
      await kernel.executePlugin('character-test-plugin', '/proc/character/1', { newHp: 75 });
      
      // Verify character was modified by plugin
      const checkFd = kernel.open(entityPath, OpenMode.READ);
      if (checkFd < 0) {
        throw new Error('Failed to open character for verification');
      }
      
      try {
        const updatedEntity = {};
        const readResult = kernel.read(checkFd, updatedEntity);
        
        if (readResult !== 0) {
          throw new Error('Failed to read updated character');
        }
        
        const props = (updatedEntity as any).properties;
        
        if (props.testProperty !== 'Plugin was here') {
          throw new Error('Plugin did not modify character correctly (testProperty)');
        }
        
        if (props.current_hp !== 75) {
          throw new Error(`Plugin did not modify HP correctly: ${props.current_hp}`);
        }
        
        console.log('Character was correctly modified by plugin');
      } finally {
        kernel.close(checkFd);
      }
    } finally {
      kernel.close(fd);
    }
    
    return 'Unix Character Test completed successfully';
  } catch (error) {
    console.error('Unix Character Test failed:', error);
    return `Unix Character Test failed: ${error.message}`;
  } finally {
    // Clean up
    if (app.shutdown) {
      await app.shutdown();
    }
  }
}