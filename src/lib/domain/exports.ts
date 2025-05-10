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
export { createAbilityCapability } from './capabilities/ability/AbilityCapabilityComposed';
export { type BonusCapability } from './capabilities/bonus/types';
export { createBonusCapability } from './capabilities/bonus/BonusCapabilityComposed';
export { type SkillCapability } from './capabilities/skill/types';
export { createSkillCapability } from './capabilities/skill/SkillCapabilityComposed';
export { type CombatCapability } from './capabilities/combat/types';
export { createCombatCapability } from './capabilities/combat/CombatCapabilityComposed';

// Plugin exports
export { PluginManagerComposed as PluginManager } from './plugins/PluginManagerComposed';
export { BasePlugin } from './plugins/BasePlugin';
export { FeatPlugin } from './plugins/feats/FeatPlugin';
export { SkillFocusPlugin } from './plugins/feats/SkillFocusPlugin';

// Migration capability is now handled using the Unix composition pattern
// No migration exports needed

// Database type exports
export type {
  Character,
  CompleteCharacter,
  Ability,
  Class,
  ClassFeature,
  Feat,
  Skill,
  Ancestry,
  Tables,
  TablesInsert,
  TablesUpdate
} from '../types/supabase';

// API exports
export { GameAPI } from './core/GameAPI';
export { EnhancedGameAPI } from './core/EnhancedGameAPI';

// Application init
export { initializeApplication } from './application';

// Test exports (for debugging and development)
export { runCapabilityTest } from './tests/CapabilityTests';
export { runPluginTest } from './tests/PluginTests';