/**
 * Ability Capability
 * 
 * This module exports the ability capability types and provider
 */
export type { 
  AbilityCapability,
  AbilityScore,
  AbilityBreakdown
} from './types';

export { AbilityType } from './types';

// Export the class-based implementation (legacy)
export { AbilityCapabilityProvider } from './AbilityCapabilityProvider';

// Export the composition-based implementation (Unix-style)
export { 
  createAbilityCapability,
  STANDARD_ABILITIES 
} from './AbilityCapabilityComposed';