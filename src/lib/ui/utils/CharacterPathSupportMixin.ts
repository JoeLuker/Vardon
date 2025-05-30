/**
 * This file provides a mixin for UI components to properly
 * handle character paths, ensuring characters are treated
 * as files, not directories.
 */

import type { GameKernel } from '$lib/domain/kernel/GameKernel';
import { 
  PATHS, 
  ensureCharacterParentDirectoriesExist, 
  fixCharacterPath 
} from '$lib/domain/utils/FilesystemUtils';

/**
 * Interface for required character path preparation
 */
export interface CharacterPathOptions {
  kernel: GameKernel;
  characterId: string | number;
  onError?: (message: string) => void;
}

/**
 * Prepares a character path correctly, ensuring:
 * 1. Parent directories exist
 * 2. Character paths are files, not directories
 * 3. Always return the canonical path format
 * 
 * @param options Options including kernel, character ID, and error callback
 * @returns Character path or null if preparation failed
 */
export function prepareCharacterPath(options: CharacterPathOptions): string | null {
  const { kernel, characterId, onError } = options;
  
  if (!kernel) {
    const errorMsg = 'Kernel not available';
    if (onError) onError(errorMsg);
    console.error(`[CharacterPathSupport] ${errorMsg}`);
    return null;
  }
  
  // 1. Ensure parent directories exist
  if (!ensureCharacterParentDirectoriesExist(kernel, characterId)) {
    const errorMsg = 'Failed to create parent directories';
    if (onError) onError(errorMsg);
    console.error(`[CharacterPathSupport] ${errorMsg}`);
    return null;
  }
  
  // 2. Fix character path if it's a directory
  const characterPath = `${PATHS.PROC_CHARACTER}/${characterId}`;
  
  // Check if path exists and is a directory
  const stats = kernel.stat(characterPath);
  if (stats?.isDirectory) {
    console.warn(`[CharacterPathSupport] Found a directory at ${characterPath} when it should be a file. Fixing...`);
    
    // Remove the directory
    const unlinkResult = kernel.unlink(characterPath);
    if (unlinkResult !== 0) {
      const errorMsg = `Failed to remove directory at ${characterPath}`;
      if (onError) onError(errorMsg);
      console.error(`[CharacterPathSupport] ${errorMsg}`);
      return null;
    }
  }
  
  return characterPath;
}

/**
 * Helper to ensure character is ready for UI components
 * 
 * @param kernel GameKernel instance
 * @param characterId Character ID to prepare
 * @param errorHandler Error handler function
 * @returns Character path or null if preparation failed
 */
export function ensureCharacterReady(
  kernel: GameKernel,
  characterId: string | number,
  errorHandler?: (error: string) => void
): string | null {
  return prepareCharacterPath({
    kernel,
    characterId,
    onError: errorHandler
  });
}