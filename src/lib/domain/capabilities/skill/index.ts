/**
 * Skill Capability
 *
 * This module exports the skill capability interface and implementation
 * using the Unix-style composition-based approach.
 */
export type { SkillCapability, SkillBreakdown } from './types';

// Export the composition-based implementation (Unix-style)
export { createSkillCapability } from './SkillCapabilityComposed';