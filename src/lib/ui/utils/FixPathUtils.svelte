<!-- FILE: src/lib/ui/utils/FixPathUtils.svelte -->
<script lang="ts" context="module">
  /**
   * This module provides utility functions for UI components to fix
   * character path issues. It ensures characters are treated as files,
   * not directories, maintaining Unix principles.
   */
  import { 
    PATHS, 
    ensureCharacterParentDirectoriesExist, 
    fixCharacterPath 
  } from '$lib/domain/utils/FilesystemUtils';
  import type { GameKernel } from '$lib/domain/kernel/GameKernel';
  
  /**
   * Prepares character paths correctly for all UI components.
   * 
   * This function ensures:
   * 1. Parent directories exist (/proc and /proc/character)
   * 2. Character paths are files, not directories 
   * 3. Any incorrectly created directories at character paths are fixed
   * 
   * @param kernel - GameKernel instance
   * @param characterId - ID of character to prepare path for
   * @returns Character path or null if preparation failed
   */
  export function prepareCharacterPath(
    kernel: GameKernel, 
    characterId: string | number
  ): string | null {
    if (!kernel) {
      console.error('[FixPathUtils] Kernel not available');
      return null;
    }
    
    // 1. Ensure parent directories exist
    if (!ensureCharacterParentDirectoriesExist(kernel, characterId)) {
      console.error('[FixPathUtils] Failed to create parent directories');
      return null;
    }
    
    // 2. Fix character path if it's a directory
    if (!fixCharacterPath(kernel, characterId)) {
      console.error('[FixPathUtils] Failed to fix character path');
      return null;
    }
    
    // 3. Return the correct character path
    return `${PATHS.PROC_CHARACTER}/${characterId}`;
  }
</script>