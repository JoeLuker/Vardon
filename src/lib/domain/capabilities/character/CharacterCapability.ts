/**
 * Character capability - provides access to character data through kernel interface
 */

import type { Capability } from '../../kernel/types';
import { ErrorCode } from '../../kernel/ErrorHandler';
import type { SupabaseDatabaseDriver } from '../database/SupabaseDatabaseDriver';
import type { CompleteCharacter } from '../../../types/supabase';

/**
 * Character device ioctl request codes
 */
export enum CharacterRequest {
  GET_CHARACTER = 1001,
  UPDATE_CHARACTER = 1002,
  GET_ABILITIES = 1003,
  UPDATE_ABILITY = 1004
}

/**
 * Directory paths used by the character capability
 */
export const CHAR_PATHS = {
  PROC: '/proc',
  PROC_CHARACTER: '/proc/character'
};

/**
 * Character capability implementation
 * This acts as a device driver for character data
 */
export class CharacterCapability implements Capability {
  readonly id = 'character';
  readonly version = '1.0.0';
  
  // Implement the kernel property required by the Capability interface
  kernel: any = null;

  // Database driver for data access
  databaseDriver: SupabaseDatabaseDriver | null = null;
  
  // Called when the device is mounted
  onMount(kernel: any): void {
    console.log(`[CharacterCapability] Device mounting, kernel:`, !!kernel);
    console.log(`[CharacterCapability] Has database driver:`, !!this.databaseDriver);
    this.kernel = kernel;

    // Ensure required directories exist
    this.ensureDirectoriesExist();

    // Log character capability mounting to help with debugging
    console.log(`[CharacterCapability] Character device mounted at /dev/character`);

    // Emit an event to notify other components
    if (kernel && kernel.events) {
      kernel.events.emit('character:device_ready', { path: '/dev/character' });
    }
  }
  
  // Store loaded character data for quick access
  private characterCache: Map<string, CompleteCharacter> = new Map();
  
  /**
   * Ensures the required directory structure exists
   * 
   * IMPORTANT: This only creates parent directories, not character-specific directories
   * Characters are FILES, not directories!
   * 
   * @returns ErrorCode.SUCCESS if successful, otherwise an error code
   */
  private ensureDirectoriesExist(): number {
    console.log('[CharacterCapability] Ensuring directory structure exists');
    
    if (!this.kernel) {
      console.error('[CharacterCapability] No kernel reference available');
      return ErrorCode.EINVAL;
    }
    
    // Create /proc if it doesn't exist
    if (!this.kernel.exists(CHAR_PATHS.PROC)) {
      console.log(`[CharacterCapability] Creating directory: ${CHAR_PATHS.PROC}`);
      const result = this.kernel.mkdir(CHAR_PATHS.PROC);
      if (!result.success) {
        console.error(`[CharacterCapability] Failed to create directory: ${CHAR_PATHS.PROC}`, result);
        return ErrorCode.EIO;
      }
    }
    
    // Create /proc/character if it doesn't exist
    if (!this.kernel.exists(CHAR_PATHS.PROC_CHARACTER)) {
      console.log(`[CharacterCapability] Creating directory: ${CHAR_PATHS.PROC_CHARACTER}`);
      const result = this.kernel.mkdir(CHAR_PATHS.PROC_CHARACTER);
      if (!result.success) {
        console.error(`[CharacterCapability] Failed to create directory: ${CHAR_PATHS.PROC_CHARACTER}`, result);
        return ErrorCode.EIO;
      }
    }
    
    return ErrorCode.SUCCESS;
  }
  
  /**
   * Read from character device
   */
  read(fd: number, buffer: any): number {
    // Ensure directories exist before reading
    const dirResult = this.ensureDirectoriesExist();
    if (dirResult !== ErrorCode.SUCCESS) {
      return dirResult;
    }
    
    // Return device information
    buffer.deviceType = 'character';
    buffer.version = this.version;
    buffer.supportedRequests = Object.keys(CharacterRequest)
      .filter(key => isNaN(Number(key)))
      .map(key => ({ 
        name: key, 
        code: CharacterRequest[key as keyof typeof CharacterRequest] 
      }));
    
    return ErrorCode.SUCCESS;
  }
  
  /**
   * Helper function to extract character ID from entity path
   */
  private extractCharacterId(entityPath: string): string {
    // First, ensure the directory structure exists
    if (this.kernel) {
      this.ensureDirectoriesExist();
    }
    
    // Extract character ID from canonical path format:
    // - /proc/character/123
    const matches = entityPath.match(/\/proc\/character\/(\w+)/);
    
    if (!matches) {
      console.error(`[CharacterCapability] Invalid path format: ${entityPath}`);
      throw new Error(`Invalid character path format: ${entityPath}`);
    }
    
    return matches[1];
  }

  /**
   * Process character device requests
   */
  async ioctl(fd: number, request: number, arg: any): Promise<number> {
    console.log(`[CharacterCapability] Processing ioctl request ${request}`, arg);

    // Ensure directories exist before processing any request
    const dirResult = this.ensureDirectoriesExist();
    if (dirResult !== ErrorCode.SUCCESS) {
      return dirResult;
    }

    try {
      switch (request) {
        case CharacterRequest.GET_CHARACTER:
          return await this.getCharacter(arg);

        case CharacterRequest.UPDATE_CHARACTER:
          return this.updateCharacter(arg);

        case CharacterRequest.GET_ABILITIES:
          return this.getAbilities(arg);

        case CharacterRequest.UPDATE_ABILITY:
          return this.updateAbility(arg);

        default:
          console.error(`[CharacterCapability] Unknown request code: ${request}`);
          return ErrorCode.EINVAL;
      }
    } catch (error) {
      console.error(`[CharacterCapability] Error processing ioctl request:`, error);
      return ErrorCode.EIO;
    }
  }
  
  /**
   * Get a character by ID
   */
  private async getCharacter(arg: any): Promise<number> {
    // Check parameters - now support 'operation' field for Unix-style IOCTL
    const { operation, entityPath, characterId } = arg;

    if ((!operation || operation !== 'getCharacter') && !entityPath && !characterId) {
      console.error(`[CharacterCapability] Invalid parameters for character operation`);
      return ErrorCode.EINVAL;
    }

    // Ensure directory structure exists
    const dirResult = this.ensureDirectoriesExist();
    if (dirResult !== ErrorCode.SUCCESS) {
      return dirResult;
    }

    // Extract the character ID from path if not provided
    const id = characterId || this.extractCharacterId(entityPath);

    try {
      // Check if we have a database driver available
      if (!this.databaseDriver) {
        console.error(`[CharacterCapability] No database driver available`);
        return ErrorCode.ENOSYS;
      }

      console.log(`[CharacterCapability] Using database driver to get character ${id}`);
      // Check if id is a string or number and handle it appropriately
      // For string IDs that aren't numeric, we'll try to find by name instead (future feature)
      // For now, we'll parse it as a number or use the string directly
      const characterId = id.toString().match(/^\d+$/) ? Number(id) :
                         isNaN(parseInt(id)) ? id : parseInt(id);
      // Try to fetch character data from the database
      const characterData = await this.databaseDriver.getCharacterById(characterId, 'complete');

      console.log(`[CharacterCapability] Successfully loaded character from database: ${characterData.id}, ${characterData.name}`);
      arg.character = characterData;
      // Cache the character data
      this.characterCache.set(String(characterData.id), characterData);
      return ErrorCode.SUCCESS;
    } catch (error) {
      console.error(`[CharacterCapability] Error getting character data:`, error);
      return ErrorCode.EIO;
    }
  }
  
  /**
   * Update a character
   */
  private updateCharacter(arg: any): number {
    const { entityPath, character } = arg;
    
    if (!entityPath || !character) {
      console.error(`[CharacterCapability] No entity path or character data provided`);
      return ErrorCode.EINVAL;
    }
    
    // Ensure directory structure exists
    const dirResult = this.ensureDirectoriesExist();
    if (dirResult !== ErrorCode.SUCCESS) {
      return dirResult;
    }
    
    // Update the cache
    this.characterCache.set(character.id, character);
    
    return ErrorCode.SUCCESS;
  }
  
  /**
   * Get character abilities
   */
  private getAbilities(arg: any): number {
    const { entityPath } = arg;
    
    if (!entityPath) {
      console.error(`[CharacterCapability] No entity path provided`);
      return ErrorCode.EINVAL;
    }
    
    // Ensure directory structure exists
    const dirResult = this.ensureDirectoriesExist();
    if (dirResult !== ErrorCode.SUCCESS) {
      return dirResult;
    }
    
    const characterId = this.extractCharacterId(entityPath);
    const character = this.characterCache.get(characterId);
    
    if (!character) {
      console.error(`[CharacterCapability] Character not found: ${characterId}`);
      return ErrorCode.ENOENT;
    }
    
    arg.abilities = character.abilities || {
      STR: 10,
      DEX: 10,
      CON: 10,
      INT: 10,
      WIS: 10,
      CHA: 10
    };
    
    return ErrorCode.SUCCESS;
  }
  
  /**
   * Update character ability
   */
  private updateAbility(arg: any): number {
    const { entityPath, ability, value } = arg;
    
    if (!entityPath || !ability || value === undefined) {
      console.error(`[CharacterCapability] Missing required parameters for ability update`);
      return ErrorCode.EINVAL;
    }
    
    // Ensure directory structure exists
    const dirResult = this.ensureDirectoriesExist();
    if (dirResult !== ErrorCode.SUCCESS) {
      return dirResult;
    }
    
    const characterId = this.extractCharacterId(entityPath);
    const character = this.characterCache.get(characterId);
    
    if (!character) {
      console.error(`[CharacterCapability] Character not found: ${characterId}`);
      return ErrorCode.ENOENT;
    }
    
    if (!character.abilities) {
      character.abilities = {};
    }
    
    character.abilities[ability] = value;
    
    return ErrorCode.SUCCESS;
  }
}