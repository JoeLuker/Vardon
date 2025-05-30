/**
 * Combat Capability Module
 *
 * This module exports the combat capability implementation using the
 * Unix-style composition-based approach and related types.
 */

export type {
  CombatCapability,
  AttackRoll,
  DamageRoll,
  CombatStats
} from './types';

// Export the composition-based implementation (Unix-style)
export { createCombatCapability } from './CombatCapabilityComposed';