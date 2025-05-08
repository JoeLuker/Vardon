/**
 * Character capability - provides access to character data through kernel interface
 */

import type { Capability } from '../../kernel/types';
import { ErrorCode } from '../../kernel/ErrorHandler';

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
  
  // Called when the device is mounted
  onMount(kernel: any): void {
    console.log(`[CharacterCapability] Device mounting, kernel:`, !!kernel);
    this.kernel = kernel;
    
    // Ensure required directories exist
    this.ensureDirectoriesExist();
  }
  
  // Store loaded character data for quick access
  private characterCache: Map<string, any> = new Map();
  
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
  ioctl(fd: number, request: number, arg: any): number {
    console.log(`[CharacterCapability] Processing ioctl request ${request}`, arg);
    
    // Ensure directories exist before processing any request
    const dirResult = this.ensureDirectoriesExist();
    if (dirResult !== ErrorCode.SUCCESS) {
      return dirResult;
    }
    
    switch (request) {
      case CharacterRequest.GET_CHARACTER:
        return this.getCharacter(arg);
        
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
  }
  
  /**
   * Get a character by ID
   */
  private getCharacter(arg: any): number {
    const { entityPath, characterId } = arg;
    
    if (!entityPath && !characterId) {
      console.error(`[CharacterCapability] No entity path or character ID provided`);
      return ErrorCode.EINVAL;
    }
    
    // Ensure directory structure exists
    const dirResult = this.ensureDirectoriesExist();
    if (dirResult !== ErrorCode.SUCCESS) {
      return dirResult;
    }
    
    // Extract the character ID from path if not provided
    const id = characterId || this.extractCharacterId(entityPath);
    
    // In a real implementation, we would access the character data
    // For now, we'll simulate success and provide dummy data
    arg.character = {
      id: id,
      name: 'Simulated Character',
      totalLevel: 1,
      game_character_class: [
        { 
          id: 1, 
          class: { id: 1, name: 'Fighter' },
          level: 1
        }
      ],
      game_character_ancestry: [
        { 
          id: 1, 
          ancestry: { id: 1, name: 'Human' } 
        }
      ],
      abilities: {
        STR: 10,
        DEX: 10,
        CON: 10,
        INT: 10,
        WIS: 10,
        CHA: 10
      },
      skills: {
        1: { total: 4, ranks: 1 },
        2: { total: 5, ranks: 1 },
        3: { total: 3, ranks: 1 }
      }
    };
    
    // Cache the character data
    this.characterCache.set(arg.character.id, arg.character);
    
    return ErrorCode.SUCCESS;
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