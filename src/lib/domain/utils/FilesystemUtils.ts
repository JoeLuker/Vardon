/**
 * FilesystemUtils.ts
 * 
 * Provides utility functions for working with the Unix-like filesystem
 * in our application. Centralizes core path handling functions to ensure
 * paths are created and used consistently throughout the codebase.
 */

import type { GameKernel } from '../kernel/GameKernel';

/**
 * Standard filesystem paths
 */
export const PATHS = {
  ROOT: '/',
  DEV: '/v_dev',
  PROC: '/v_proc',
  PROC_CHARACTER: '/v_proc/character',
  SYS: '/v_sys',
  ETC: '/v_etc',
  VAR: '/v_var',
  TMP: '/v_tmp',
  BIN: '/v_bin',
  
  // Device paths
  DEV_ABILITY: '/v_dev/ability',
  DEV_SKILL: '/v_dev/skill',
  DEV_COMBAT: '/v_dev/combat',
  DEV_CHARACTER: '/v_dev/character',
  DEV_CONDITION: '/v_dev/condition',
  DEV_BONUS: '/v_dev/bonus',
};

/**
 * Ensures base directories exist
 * 
 * @param kernel GameKernel instance
 * @returns Whether all directories exist or were created successfully
 */
export function ensureBaseDirectoriesExist(kernel: GameKernel): boolean {
  try {
    // Create standard directories
    Object.values(PATHS).forEach(path => {
      if (path !== PATHS.ROOT && !kernel.exists(path)) {
        console.log(`[FilesystemUtils] Creating directory: ${path}`);
        const result = kernel.mkdir(path);
        if (!result.success) {
          console.error(`[FilesystemUtils] Failed to create directory: ${path}`, result);
        }
      }
    });
    
    return true;
  } catch (error) {
    console.error('[FilesystemUtils] Error creating base directories:', error);
    return false;
  }
}

/**
 * Gets the path to a character
 * 
 * IMPORTANT: Characters are files, not directories!
 * Use kernel.create() to create character files, not kernel.mkdir()
 * 
 * @param characterId Character ID
 * @returns Character path
 */
export function getCharacterPath(characterId: string | number): string {
  return `${PATHS.PROC_CHARACTER}/${characterId}`;
}

/**
 * Ensures parent directories exist, but does NOT create a directory for the character!
 * 
 * @param kernel GameKernel instance
 * @param characterId Character ID
 * @returns Whether parent directories exist or were created successfully
 */
export function ensureCharacterParentDirectoriesExist(
  kernel: GameKernel,
  characterId: string | number
): boolean {
  try {
    // Create parent directories
    if (!kernel.exists(PATHS.PROC)) {
      console.log(`[FilesystemUtils] Creating directory: ${PATHS.PROC}`);
      const result = kernel.mkdir(PATHS.PROC);
      if (!result.success) {
        console.error(`[FilesystemUtils] Failed to create directory: ${PATHS.PROC}`, result);
        return false;
      }
    }
    
    if (!kernel.exists(PATHS.PROC_CHARACTER)) {
      console.log(`[FilesystemUtils] Creating directory: ${PATHS.PROC_CHARACTER}`);
      const result = kernel.mkdir(PATHS.PROC_CHARACTER);
      if (!result.success) {
        console.error(`[FilesystemUtils] Failed to create directory: ${PATHS.PROC_CHARACTER}`, result);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('[FilesystemUtils] Error creating character parent directories:', error);
    return false;
  }
}

/**
 * Fixes character paths - if a character path exists as a directory, converts it to a file
 * 
 * @param kernel GameKernel instance 
 * @param characterId Character ID
 * @param characterData Character data (optional)
 * @returns Whether the character path is now a file (or was already a file)
 */
export function fixCharacterPath(
  kernel: GameKernel,
  characterId: string | number,
  characterData?: any
): boolean {
  try {
    // Get character path
    const characterPath = getCharacterPath(characterId);
    
    // Check if character path exists
    if (!kernel.exists(characterPath)) {
      return true; // Nothing to fix
    }
    
    // Check if character path is a directory
    const stats = kernel.stat(characterPath);
    if (stats?.isDirectory) {
      console.warn(`[FilesystemUtils] Found a directory at ${characterPath} when it should be a file. Fixing...`);
      
      // Try to remove the directory
      const unlinkResult = kernel.unlink(characterPath);
      if (unlinkResult !== 0) {
        console.error(`[FilesystemUtils] Failed to remove directory at ${characterPath}`);
        return false;
      }
      
      // Create the file if we have character data
      if (characterData) {
        console.log(`[FilesystemUtils] Creating character file at ${characterPath}`);
        const createResult = kernel.create(characterPath, characterData);
        if (!createResult.success) {
          console.error(`[FilesystemUtils] Failed to create character file: ${createResult.errorMessage}`);
          return false;
        }
      }
      
      return true;
    }
    
    // Already a file
    return true;
  } catch (error) {
    console.error('[FilesystemUtils] Error fixing character path:', error);
    return false;
  }
}

/**
 * Gets an entity path for the given entity
 * 
 * @param entityType Entity type
 * @param entityId Entity ID
 * @returns Entity path
 */
export function getEntityPath(entityType: string, entityId: string | number): string {
  if (entityType.toLowerCase() === 'character') {
    return getCharacterPath(entityId);
  }
  
  return `/v_entity/${entityType}/${entityId}`;
}