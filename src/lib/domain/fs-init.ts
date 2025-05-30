/**
 * fs-init.ts - Filesystem Initialization for Svelte App
 * 
 * This module initializes the Unix-like virtual filesystem in the browser
 * and provides hooks for Svelte components to use it.
 */

import { autoInitialize, getApplication, getInitStatus, BrowserInitStatus } from './BrowserInitializer';
import { writable, derived, get } from 'svelte/store';
import type { Application } from './application';
import type { Entity } from './kernel/types';

// Create stores for tracking filesystem state
export const fsStatus = writable<BrowserInitStatus>(BrowserInitStatus.NOT_STARTED);
export const fsProgress = writable<number>(0);
export const fsReady = derived(fsStatus, $status => $status === BrowserInitStatus.READY);
export const application = writable<Application | null>(null);

// Track initialization to prevent redundant operations
export const isInitializing = writable<boolean>(false);
export const isInitialized = writable<boolean>(false);

// Additional derived stores for common operations
export const kernel = derived(application, $app => $app?.kernel ?? null);

// Character management
const currentCharacter = writable<Entity | null>(null);
export { currentCharacter };

// Map of loaded character IDs to prevent redundant loading
const loadedCharacters = new Set<number>();

// Initialize the filesystem only once
if (typeof window !== 'undefined' && !get(isInitialized) && !get(isInitializing)) {
  isInitializing.set(true);
  console.log('[fs-init] Starting filesystem initialization (first time)');
  
  autoInitialize({
    debug: true,
    showUI: true,
    onBootStatusChange: (status, progress) => {
      // Update Svelte stores with boot status
      fsProgress.set(progress);
      
      // Update application status based on boot status
      if (status === 'READY') {
        fsStatus.set(BrowserInitStatus.READY);
        // Set application in store
        application.set(getApplication());
        isInitialized.set(true);
        isInitializing.set(false);
        console.log('[fs-init] Filesystem initialized successfully');
      } else if (status === 'FAILED') {
        fsStatus.set(BrowserInitStatus.FAILED);
        isInitializing.set(false);
        console.error('[fs-init] Filesystem initialization failed');
      } else {
        fsStatus.set(BrowserInitStatus.INITIALIZING);
      }
    }
  });
} else if (typeof window !== 'undefined') {
  console.log('[fs-init] Filesystem already initializing or initialized, skipping');
}

/**
 * Load a character by ID
 * @param characterId Character ID to load
 * @param forceReload Whether to force reloading even if already loaded
 * @returns Promise that resolves with the loaded character entity
 */
export async function loadCharacter(characterId: number, forceReload: boolean = false): Promise<Entity | null> {
  const app = getApplication();
  if (!app) {
    throw new Error('Application not initialized');
  }
  
  // Check if character is already loaded and we're not forcing reload
  if (!forceReload && loadedCharacters.has(characterId)) {
    console.log(`[fs-init] Character ${characterId} already loaded, using cached version`);
    
    // Check if the character exists in the filesystem
    const characterPath = `/proc/character/${characterId}`;
    const entityPath = `/entity/character-${characterId}`;
    
    if ('kernel' in app && app.kernel) {
      // Try to get the character from the filesystem
      if (app.kernel.exists(entityPath)) {
        const fd = app.kernel.open(entityPath, 0); // OpenMode.READ = 0
        if (fd >= 0) {
          try {
            const [readResult, entity] = app.kernel.read(fd);
            if (readResult === 0 && entity) { // ErrorCode.SUCCESS = 0
              currentCharacter.set(entity);
              return entity;
            }
          } finally {
            app.kernel.close(fd);
          }
        }
      }
    }
  }
  
  try {
    console.log(`[fs-init] Loading character ${characterId}${forceReload ? ' (forced reload)' : ''}`);
    
    // Load character from application
    const character = await app.loadCharacter(characterId);
    
    // Update character store if loaded successfully
    if (character) {
      currentCharacter.set(character);
      loadedCharacters.add(characterId);
    }
    
    return character;
  } catch (error) {
    console.error(`Error loading character ${characterId}:`, error);
    return null;
  }
}

/**
 * Safely get the application instance, waiting for it to be ready
 * @param timeout Optional timeout in milliseconds
 * @returns Promise that resolves with the application instance
 */
export async function getReadyApplication(timeout: number = 10000): Promise<Application> {
  // If application is already initialized, return it
  const app = getApplication();
  if (app && getInitStatus() === BrowserInitStatus.READY) {
    return app;
  }
  
  // Wait for application to be ready
  return new Promise((resolve, reject) => {
    // Set up a timeout
    const timeoutId = setTimeout(() => {
      unsubscribe();
      reject(new Error(`Timed out waiting for application to initialize after ${timeout}ms`));
    }, timeout);
    
    // Subscribe to status changes
    const unsubscribe = fsStatus.subscribe(status => {
      if (status === BrowserInitStatus.READY) {
        clearTimeout(timeoutId);
        unsubscribe();
        
        const app = getApplication();
        if (app) {
          resolve(app);
        } else {
          reject(new Error('Application is null even though status is READY'));
        }
      } else if (status === BrowserInitStatus.FAILED) {
        clearTimeout(timeoutId);
        unsubscribe();
        reject(new Error('Application initialization failed'));
      }
    });
  });
}