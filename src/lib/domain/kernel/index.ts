/**
 * Kernel module
 * 
 * This module exports the core kernel components for the game system.
 * The kernel follows Unix philosophy by providing minimal core functionality
 * and letting specialized components handle specific tasks.
 */

// Export core types
export * from './types';

// Export EventBus implementation
export { EventBus } from './EventBus';

// Export GameKernel
export { GameKernel } from './GameKernel';