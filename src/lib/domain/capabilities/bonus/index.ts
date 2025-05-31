/**
 * Bonus Capability
 *
 * This module exports the bonus capability types and implementation
 * using the Unix-style composition-based approach.
 */
export type { BonusCapability, BonusSource, BonusTarget, Bonus } from './types';

export { BonusType, StackingRule } from './types';

// Export the composition-based implementation (Unix-style)
export { createBonusCapability, STACKING_TYPES } from './BonusCapabilityComposed';
