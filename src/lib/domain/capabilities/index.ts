/**
 * Capabilities
 * 
 * This module exports the capability system.
 * Capabilities are the primary way for plugins to interact with the system.
 * They provide a well-defined interface to system functionality while
 * hiding implementation details.
 */

// Export base capability types
export * from './types';

// Export specific capability interfaces
export * from './ability';
export * from './bonus';
export * from './skill';