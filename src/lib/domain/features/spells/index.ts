import type { Feature } from '../../types/FeatureTypes';

// Import all spell features
import CureLightWoundsFeature from './CureLightWoundsFeature';
import FireballFeature from './FireballFeature';

// Re-export all spell features
export {
  CureLightWoundsFeature,
  FireballFeature
};

/**
 * Map of spell feature IDs to lazy-loaded import functions
 * This allows spells to be loaded only when needed
 */
export const SPELL_FEATURES: Record<string, () => Promise<Feature>> = {
  'spell.cure_light_wounds': async () => (await import('./CureLightWoundsFeature')).default,
  'spell.fireball': async () => (await import('./FireballFeature')).default,
  // Add more spells here as they are implemented
};

/**
 * Helper to get a spell feature by ID with lazy loading
 */
export async function getSpellFeature(id: string): Promise<Feature | undefined> {
  const loader = SPELL_FEATURES[id];
  if (loader) {
    return await loader();
  }
  return undefined;
}