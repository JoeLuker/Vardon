/**
 * Condition Capability Module
 * 
 * This module exports the condition capability implementation and types.
 */

export type { 
  ConditionCapability,
  ConditionType,
  Condition,
  ConditionEffect,
  ConditionStateUpdate,
  ApplyConditionOptions
} from './types';

// Export the class-based implementation (legacy)
export { ConditionCapabilityProvider } from './ConditionCapabilityProvider';

// Export the composition-based implementation (Unix-style)
export { createConditionCapability } from './ConditionCapabilityComposed';