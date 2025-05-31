/**
 * Plugin System
 *
 * This module implements the plugin system, which is the primary way
 * to implement game features while following Unix philosophy.
 *
 * Plugins are small, focused components that use capabilities to
 * implement specific game features.
 *
 * The Unix implementation follows strict resource ownership principles:
 * - Entities are owned by the kernel
 * - Plugins request access through handles
 * - Reference counting prevents premature resource cleanup
 */

// Export types
export type { PluginMetadata, PluginLoaderOptions } from './types';

// Export composition-based Unix implementation
export * from './PluginManagerComposed';
export * from './ProcessKit';
export * from './PluginFilesystem';
export * from './PluginLoader';

// Export specific plugins
export * from './feats';
