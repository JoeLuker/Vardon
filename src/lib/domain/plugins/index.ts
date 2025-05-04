/**
 * Plugin System
 * 
 * This module implements the plugin system, which is the primary way
 * to implement game features while following Unix philosophy.
 * 
 * Plugins are small, focused components that use capabilities to
 * implement specific game features.
 */

// Export types
export * from './types';

// Export base implementation
export * from './BasePlugin';
export * from './PluginManager';

// Export migration utilities
export * from './migration';

// Export specific plugins
export * from './feats';