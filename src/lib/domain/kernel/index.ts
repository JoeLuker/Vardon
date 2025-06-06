/**
 * Kernel module
 *
 * This module exports the core kernel components for the game system.
 * The kernel follows Unix philosophy by providing minimal core functionality
 * and letting specialized components handle specific tasks.
 */

// Export core types
export type {
	Entity,
	Capability,
	Plugin,
	EventListener,
	EventSubscription,
	EventEmitter,
	KernelOptions,
	PluginValidationResult,
	EntityRequest,
	EntityAccessResult,
	FileDescriptor,
	Inode,
	MountOptions,
	PathResult,
	Stats
} from './types';

// Export enums
export { OpenMode, ErrorCode } from './types';

// Export EventBus implementation
export { EventBus } from './EventBus';

// Export Kernels
export { GameKernel } from './GameKernelMigration'; // Backward compatible wrapper
export { GameKernelRefactored } from './GameKernelRefactored'; // New modular kernel
export { createGameKernel } from './GameKernelMigration'; // Factory function
export { Kernel } from './Kernel'; // New Unix-style kernel with persistent filesystem
export { FileSystem, FileType } from './FileSystem'; // Filesystem implementation

// Export kernel modules
export {
	FileSystemManager,
	DeviceManager,
	FileDescriptorManager,
	MessageQueueManager,
	EntityManager,
	PluginExecutor
} from './modules';

// Export error handling utilities
export {
	createError,
	getErrorDescription,
	success,
	failure,
	processErrorCode,
	formatError,
	withResource,
	withResourceSync,
	withFile,
	withDevice,
	tryWithResources,
	mapJsErrorToSystemError,
	createErrorLogger
} from './ErrorHandler';

// Export error handling types
export type { ErrorContext, SystemError, Result } from './ErrorHandler';
