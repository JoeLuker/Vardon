/**
 * Skill Capability
 * 
 * This module exports the skill capability interface and implementations
 * with both legacy class-based and Unix-style composition-based approaches
 */
export type { SkillCapability, SkillBreakdown } from './types';

// Export the class-based implementation (legacy)
export { SkillCapabilityProvider } from './SkillCapabilityProvider';

// Export the composition-based implementation (Unix-style)
export { createSkillCapability } from './SkillCapabilityComposed';