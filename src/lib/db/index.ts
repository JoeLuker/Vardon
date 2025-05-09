/**
 * Database Access Module
 *
 * This module exports a unified database access API following Unix principles.
 * It makes the GameRulesAPI the canonical way to interact with the database.
 *
 * IMPORTANT: Direct access to Supabase client is no longer supported.
 * All database access should go through kernel file operations.
 */

// Export the consolidated GameRulesAPI
export { GameRulesAPI } from './gameRules.api';

// Export the GameRules namespace
export * from './gameRules.api';

// Export the type definitions
export type { CompleteCharacter, ProcessedClassFeature } from './gameRules.api';

// Export Supabase types only (not the client)
export type { RealtimeChannel } from '@supabase/supabase-js';
