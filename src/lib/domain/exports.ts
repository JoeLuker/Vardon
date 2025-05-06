/**
 * System Exports
 * 
 * This module exports the core components of the system.
 * It provides a clean, focused interface to the rest of the application.
 */

// Kernel exports
export { GameKernel } from './kernel/GameKernel';
export { type Entity, type Capability, type Plugin } from './kernel/types';

// Capability exports
export { type AbilityCapability } from './capabilities/ability/types';
export { AbilityCapabilityProvider } from './capabilities/ability/AbilityCapabilityProvider';
export { type BonusCapability } from './capabilities/bonus/types';
export { BonusCapabilityProvider } from './capabilities/bonus/BonusCapabilityProvider';
export { type SkillCapability } from './capabilities/skill/types';
export { SkillCapabilityProvider } from './capabilities/skill/SkillCapabilityProvider';

// Plugin exports
export { PluginManager } from './plugins/PluginManager';
export { BasePlugin } from './plugins/BasePlugin';
export { FeatPlugin } from './plugins/feats/FeatPlugin';
export { SkillFocusPlugin } from './plugins/feats/SkillFocusPlugin';

// Migration exports
export { FeatureToPluginMigrator } from './plugins/migration/FeatureToPluginMigrator';

// API exports
export { GameAPI } from './core/GameAPI';
export { EnhancedGameAPI } from './core/EnhancedGameAPI';

// Application init
export { initializeApplication } from './application';

// Test exports (for debugging and development)
export { runCapabilityTest } from './tests/CapabilityTests';
export { runPluginTest } from './tests/PluginTests';
export { runMigrationTest } from './tests/MigrationTests';