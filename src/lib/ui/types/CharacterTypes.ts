/**
 * UI-specific type exports and extensions for character data
 * This provides a clean interface for UI components to access character data types
 */

// Export needed types from the domain layer
export type { AssembledCharacter, ValueWithBreakdown } from '$lib/domain/character/characterTypes';

// Import ProcessedClassFeature from the original source
export type { ProcessedClassFeature } from '$lib/db/gameRules.api';

// Add any UI-specific types here if needed
