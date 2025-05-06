/**
 * Bonus Capability
 * 
 * This module exports the bonus capability types and provider
 */
export type { 
  BonusCapability,
  BonusSource,
  BonusTarget,
  Bonus
} from './types';

export {
  BonusType,
  StackingRule
} from './types';

// Export the class-based implementation (legacy)
export { BonusCapabilityProvider } from './BonusCapabilityProvider';

// Export the composition-based implementation (Unix-style)
export { createBonusCapability, STACKING_TYPES } from './BonusCapabilityComposed';