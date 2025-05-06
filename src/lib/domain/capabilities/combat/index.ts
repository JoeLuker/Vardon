/**
 * Combat Capability Module
 * 
 * This module exports the combat capability implementations (both class-based and Unix-style)
 * and related types.
 */

export type { 
  CombatCapability,
  AttackRoll,
  DamageRoll,
  CombatStats
} from './types';

// Export the class-based implementation (legacy)
export { CombatCapabilityProvider } from './CombatCapabilityProvider';

// Export the composition-based implementation (Unix-style)
export { createCombatCapability } from './CombatCapabilityComposed';