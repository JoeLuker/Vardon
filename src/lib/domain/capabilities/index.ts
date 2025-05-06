/**
 * Capabilities System
 * 
 * This module provides the capabilities system, which is a key part of the
 * architecture. Capabilities are similar to device drivers in Unix, exposing
 * specific functionality while hiding implementation details.
 * 
 * This system follows Unix philosophy by:
 * 1. Having clear interfaces for each subsystem
 * 2. One capability per functional domain
 * 3. Composing capabilities for more complex behavior
 * 
 * The Unix-style implementation follows resource ownership principles:
 * - Entities are owned by the kernel, not by capabilities
 * - Capabilities store entity-specific data, not entities themselves
 * - Initialization is focused on setting up entity-specific data
 */

// Export base capability types
export type { CapabilityProvider } from './types';
export { BaseCapability, BaseCapabilityOptions, CapabilityOptions } from './BaseCapability';
export { UnixBaseCapability, UnixCapabilityOptions } from './UnixBaseCapability';

// Export specific capability interfaces
export * from './ability';
export * from './bonus';
export * from './skill';
export * from './combat';
export * from './condition';