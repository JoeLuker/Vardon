/**
 * Condition Capability Module
 *
 * This module exports the condition capability implementation using the
 * Unix-style composition-based approach and related types.
 */

export type {
  ConditionCapability,
  ConditionType,
  Condition,
  ConditionEffect,
  ConditionStateUpdate,
  ApplyConditionOptions
} from './types';

// Export the composition-based implementation (Unix-style)
export { createConditionCapability } from './ConditionCapabilityComposed';