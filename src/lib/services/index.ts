import { writable } from 'svelte/store';

// Export all services
export * from './character';
export * from './spells';
export * from './buffs';
export * from './attributes';
export * from './equipment';
export * from './combat';
export * from './database';
export * from '../supabase';
export * from './skills';

// Centralized loading state management
export const loadingService = {
  isLoading: writable(false),
  withLoading: async <T>(promise: Promise<T>): Promise<T> => {
    loadingService.isLoading.set(true);
    try {
      return await promise;
    } finally {
      loadingService.isLoading.set(false);
    }
  }
};