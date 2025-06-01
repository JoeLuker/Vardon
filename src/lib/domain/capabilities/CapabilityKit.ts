/**
 * Capability Kit - Unix Edition
 *
 * This module provides a set of utilities for implementing Unix-style capabilities
 * using composition rather than inheritance. This approach follows Unix principles
 * of composing small, focused tools into larger systems.
 *
 * Instead of inheriting from a base class, capabilities can compose operations
 * from independent utility functions and specialized services.
 */

import type { Entity } from '../kernel/types';
import { ErrorCode, OpenMode } from '../kernel/types';
import {
	createError,
	failure,
	success,
	withFile,
	withResource,
	processErrorCode,
	createErrorLogger,
	type Result,
	type SystemError,
	type ErrorContext
} from '../kernel/ErrorHandler';

/**
 * Log a debug message
 * @param context Capability context
 * @param message Message to log
 * @param data Optional data to include
 */
export function log(context: CapabilityContext, message: string, data?: any): void {
	if (context.debug) {
		if (data !== undefined) {
			console.log(`[${context.id}] ${message}`, data);
		} else {
			console.log(`[${context.id}] ${message}`);
		}
	}
}

/**
 * Log an error message
 * @param context Capability context
 * @param message Error message
 * @param error Optional error object
 * @param errorContext Optional error context
 */
export function error(
	context: CapabilityContext,
	message: string,
	error?: any,
	errorContext?: ErrorContext
): void {
	if (error !== undefined) {
		console.error(`[${context.id}] ${message}`, error);
	} else {
		console.error(`[${context.id}] ${message}`);
	}

	if (context.logger) {
		context.logger.error(message, error, errorContext);
	}
}

/**
 * Options for creating a capability
 */
export interface CapabilityOptions {
	/** Unique identifier for this capability */
	id: string;

	/** Whether to enable debug logging */
	debug?: boolean;

	/** Version of this capability implementation */
	version?: string;

	/** Optional on-mount handler */
	onMount?: (kernel: any) => Result<void> | void;

	/** Optional read handler */
	onRead?: (fd: number, buffer: any, context: CapabilityContext) => number;

	/** Optional write handler */
	onWrite?: (fd: number, buffer: any, context: CapabilityContext) => number;

	/** Optional ioctl handler */
	onIoctl?: (fd: number, request: number, arg: any, context: CapabilityContext) => number;

	/** Optional shutdown handler */
	onShutdown?: (context: CapabilityContext) => Promise<Result<void>>;
}

/**
 * Capability context shared by all operation handlers
 */
export interface CapabilityContext {
	/** Unique identifier */
	id: string;

	/** Whether debug logging is enabled */
	debug: boolean;

	/** Capability version */
	version: string;

	/** Reference to the kernel */
	kernel: any;

	/** Device-specific storage */
	storage: Map<string, any>;

	/** Open file descriptors */
	openFiles: Map<number, { path: string; buffer: any }>;

	/** Error logger */
	logger: ReturnType<typeof createErrorLogger>;

	/** Custom context data */
	[key: string]: any;
}

/**
 * Creates a capability from individual operation handlers
 * @param options Capability options
 * @returns A capability implementation
 */
export function createCapability(options: CapabilityOptions): any {
	// Create shared context for all operations
	const context: CapabilityContext = {
		id: options.id,
		debug: options.debug || false,
		version: options.version || '1.0.0',
		kernel: null,
		storage: new Map(),
		openFiles: new Map(),
		logger: createErrorLogger(options.id)
	};

	return {
		// Basic capability properties
		id: options.id,
		version: context.version,

		// Standard capability operations
		onMount(kernel: any): void {
			context.kernel = kernel;
			context.logger.info('Device mounted');

			// Call custom onMount handler if provided
			if (options.onMount) {
				const result = options.onMount(kernel);
				if (result && typeof result === 'object' && 'success' in result && !result.success) {
					context.logger.error(`Mount error: ${result.errorMessage}`, null, {
						operation: 'onMount',
						errorCode: result.errorCode
					});
				}
			}
		},

		read(fd: number, buffer: any): number {
			context.logger.debug(`Read from fd ${fd}`);

			// Use custom read handler if provided, otherwise return error
			if (options.onRead) {
				try {
					return options.onRead(fd, buffer, context);
				} catch (error) {
					const sysError = createError(
						ErrorCode.EIO,
						`Unhandled exception in read operation: ${error instanceof Error ? error.message : String(error)}`,
						{
							component: context.id,
							operation: 'read',
							fd
						}
					);
					context.logger.error(sysError.message, error);
					return ErrorCode.EIO;
				}
			}

			return ErrorCode.EINVAL;
		},

		write(fd: number, buffer: any): number {
			context.logger.debug(`Write to fd ${fd}`);

			// Use custom write handler if provided, otherwise return error
			if (options.onWrite) {
				try {
					return options.onWrite(fd, buffer, context);
				} catch (error) {
					const sysError = createError(
						ErrorCode.EIO,
						`Unhandled exception in write operation: ${error instanceof Error ? error.message : String(error)}`,
						{
							component: context.id,
							operation: 'write',
							fd
						}
					);
					context.logger.error(sysError.message, error);
					return ErrorCode.EIO;
				}
			}

			return ErrorCode.EINVAL;
		},

		ioctl(fd: number, request: number, arg: any): number {
			context.logger.debug(`IOCTL on fd ${fd}, request ${request}`);

			// Use custom ioctl handler if provided, otherwise return error
			if (options.onIoctl) {
				try {
					return options.onIoctl(fd, request, arg, context);
				} catch (error) {
					const sysError = createError(
						ErrorCode.EIO,
						`Unhandled exception in ioctl operation: ${error instanceof Error ? error.message : String(error)}`,
						{
							component: context.id,
							operation: 'ioctl',
							fd,
							request
						}
					);
					context.logger.error(sysError.message, error);
					return ErrorCode.EIO;
				}
			}

			return ErrorCode.EINVAL;
		},

		async shutdown(): Promise<void> {
			context.logger.info('Device unmounting');

			// Call custom shutdown handler if provided
			if (options.onShutdown) {
				try {
					const result = await options.onShutdown(context);
					if (!result.success) {
						context.logger.error(`Shutdown error: ${result.errorMessage}`, null, {
							operation: 'shutdown',
							errorCode: result.errorCode
						});
					}
				} catch (error) {
					context.logger.error('Unhandled exception during shutdown', error);
				}
			}

			// Standard cleanup
			context.storage.clear();
			context.openFiles.clear();
			context.logger.info('Device unmounted');
		}
	};
}

/**
 * Perform an entity file operation with proper resource management
 * @param context Capability context
 * @param entityId Entity ID
 * @param operation Operation function that performs the actual work
 * @returns Result of the operation
 */
export async function withEntity<T>(
	context: CapabilityContext,
	entityId: string,
	operation: (entity: Entity, fd: number) => Promise<T>
): Promise<Result<T>> {
	const kernel = context.kernel;
	if (!kernel) {
		return failure(ErrorCode.ENODEV, 'Kernel not available', {
			component: context.id,
			operation: 'withEntity'
		});
	}

	// Path to the entity file
	const entityPath = `/v_entity/${entityId}`;

	// Use withFile from ErrorHandler to manage file descriptor
	return withFile(kernel, entityPath, OpenMode.READ_WRITE, async (fd) => {
		// Read entity data
		const [result, entity] = kernel.read(fd);

		if (result !== 0) {
			return failure(result, `Failed to read entity: ${entityPath}`, {
				component: context.id,
				operation: 'withEntity.read',
				path: entityPath,
				fd
			});
		}

		// Perform the operation with the entity
		return await operation(entity as Entity, fd);
	});
}

/**
 * Synchronous version of withEntity
 * Performs an entity file operation with proper resource management
 * @param context Capability context
 * @param entityId Entity ID
 * @param operation Synchronous operation function that performs the actual work
 * @returns Result of the operation
 */
export function withEntitySync<T>(
	context: CapabilityContext,
	entityId: string,
	operation: (entity: Entity, fd: number) => T
): Result<T> {
	const kernel = context.kernel;
	if (!kernel) {
		return failure(ErrorCode.ENODEV, 'Kernel not available', {
			component: context.id,
			operation: 'withEntitySync'
		});
	}

	// Path to the entity file
	const entityPath = `/v_entity/${entityId}`;

	// Verify entity exists
	if (!kernel.exists(entityPath)) {
		return failure(ErrorCode.ENOENT, `Entity not found: ${entityPath}`, {
			component: context.id,
			operation: 'withEntitySync',
			path: entityPath
		});
	}

	try {
		// Open the entity file
		const fd = kernel.open(entityPath, OpenMode.READ_WRITE);
		if (fd < 0) {
			return failure(ErrorCode.EBADF, `Failed to open entity file: ${entityPath}`, {
				component: context.id,
				operation: 'withEntitySync.open',
				path: entityPath
			});
		}

		try {
			// Read entity data
			const [result, entity] = kernel.read(fd);

			if (result !== 0) {
				return failure(result, `Failed to read entity: ${entityPath}`, {
					component: context.id,
					operation: 'withEntitySync.read',
					path: entityPath,
					fd
				});
			}

			// Perform the operation with the entity
			const operationResult = operation(entity as Entity, fd);
			return success(operationResult);
		} finally {
			// Always close the file descriptor
			kernel.close(fd);
		}
	} catch (error) {
		return failure(
			ErrorCode.EIO,
			`Unhandled exception: ${error instanceof Error ? error.message : String(error)}`,
			{
				component: context.id,
				operation: 'withEntitySync',
				path: entityPath
			}
		);
	}
}

/**
 * Initialize an entity with a capability
 * Common utility for capabilities to initialize entity data
 * @param context Capability context
 * @param entity The entity to initialize
 * @param initializer Function that performs initialization
 * @returns Result with the updated entity
 */
export async function initializeEntity(
	context: CapabilityContext,
	entity: Entity,
	initializer: (entity: Entity) => void
): Promise<Result<Entity>> {
	try {
		// Call the provided initializer
		initializer(entity);

		// Update entity in filesystem
		const entityPath = `/v_entity/${entity.id}`;

		return withFile(context.kernel, entityPath, OpenMode.WRITE, (fd) => {
			// Write updated entity
			const writeResult = context.kernel.write(fd, entity);

			if (writeResult !== 0) {
				return failure(writeResult, `Failed to write entity: ${entityPath}`, {
					component: context.id,
					operation: 'initializeEntity.write',
					path: entityPath,
					fd
				});
			}

			return success(entity);
		});
	} catch (err) {
		return failure(
			ErrorCode.EIO,
			`Error initializing entity ${entity.id}: ${err instanceof Error ? err.message : String(err)}`,
			{
				component: context.id,
				operation: 'initializeEntity'
			}
		);
	}
}

/**
 * Create a streaming pipeline for entity operations
 * @param operations Array of operations to perform in sequence
 * @returns Function that processes an entity through the pipeline
 */
export function pipe<T>(...operations: Array<(input: T) => T>): (input: T) => T {
	return (input: T) => operations.reduce((value, op) => op(value), input);
}

/**
 * Perform an entity operation with path-based access
 * Common utility for IOCTL operations that operate directly on entity paths
 * @param context Capability context
 * @param entityPath Path to the entity
 * @param operation Operation function that performs the actual work
 * @param mode File open mode (defaults to READ_WRITE)
 * @returns Error code
 */
export function performEntityOperation(
	context: CapabilityContext,
	entityPath: string,
	operation: (entity: Entity) => void,
	mode: OpenMode = OpenMode.READ_WRITE
): number {
	try {
		const kernel = context.kernel;
		if (!kernel) {
			context.logger.error('Kernel not available', null, {
				operation: 'performEntityOperation'
			});
			return ErrorCode.ENODEV;
		}

		// Open the entity file
		const fd = kernel.open(entityPath, mode);
		if (fd < 0) {
			context.logger.error(`Failed to open entity file: ${entityPath}`, null, {
				operation: 'performEntityOperation.open',
				path: entityPath,
				errorCode: -fd
			});
			return -fd as ErrorCode;
		}

		try {
			// Read entity data
			const [result, entity] = kernel.read(fd);

			if (result !== 0) {
				context.logger.error(`Failed to read entity: ${entityPath}`, null, {
					operation: 'performEntityOperation.read',
					path: entityPath,
					fd,
					errorCode: result
				});
				return result;
			}

			// Perform the operation with the entity
			operation(entity as Entity);

			// If in read-only mode, don't write back
			if (mode === OpenMode.READ) {
				return ErrorCode.SUCCESS;
			}

			// Write updated entity
			const writeResult = kernel.write(fd, entity);

			if (writeResult !== 0) {
				context.logger.error(`Failed to write entity: ${entityPath}`, null, {
					operation: 'performEntityOperation.write',
					path: entityPath,
					fd,
					errorCode: writeResult
				});
				return writeResult;
			}

			return ErrorCode.SUCCESS;
		} finally {
			// Always close the file descriptor
			kernel.close(fd);
		}
	} catch (err) {
		context.logger.error(
			`Error processing entity operation: ${err instanceof Error ? err.message : String(err)}`,
			err,
			{
				operation: 'performEntityOperation',
				path: entityPath
			}
		);
		return ErrorCode.EIO;
	}
}

/**
 * Bonus/modifier object used in calculations
 */
export interface Modifier {
	/** Numeric value of the modifier */
	value: number;

	/** Source of the modifier (e.g., 'Power Attack', 'Rage') */
	source: string;

	/** Type of the modifier (e.g., 'enhancement', 'morale', 'untyped') */
	type?: string;
}

/**
 * Detailed breakdown of a value calculation
 */
export interface ModifierBreakdown {
	/** Base value before modifiers */
	base: number;

	/** List of applied modifiers */
	appliedModifiers: Modifier[];

	/** List of modifiers that were not applied (due to stacking rules) */
	unappliedModifiers?: Modifier[];

	/** Total value after applying modifiers */
	total: number;
}

/**
 * Default stacking rules for bonuses
 * By default, most bonus types do not stack (only the highest applies),
 * but certain types (like untyped, circumstance, and dodge) do stack.
 */
export const DEFAULT_STACKING_RULES: Record<string, boolean> = {
	untyped: true, // Untyped bonuses always stack
	circumstance: true, // Circumstance bonuses stack
	dodge: true, // Dodge bonuses stack
	penalty: true // Penalties always stack (negative values)
};

/**
 * Calculate a modified value with bonus stacking rules
 * @param baseValue Base value before modifiers
 * @param modifiers Array of modifiers to apply
 * @param stackingRules Rules for which bonus types stack
 * @returns Breakdown of the calculation including total
 */
export function calculateModifiedValue(
	baseValue: number,
	modifiers: Modifier[],
	stackingRules: Record<string, boolean> = DEFAULT_STACKING_RULES
): ModifierBreakdown {
	// Group modifiers by type
	const modifiersByType: Record<string, Modifier[]> = {};

	// Initialize result
	const result: ModifierBreakdown = {
		base: baseValue,
		appliedModifiers: [],
		unappliedModifiers: [],
		total: baseValue
	};

	// Sort modifiers into groups by type
	for (const modifier of modifiers) {
		const type = modifier.type || 'untyped';

		if (!modifiersByType[type]) {
			modifiersByType[type] = [];
		}

		modifiersByType[type].push(modifier);
	}

	// Process each type according to stacking rules
	for (const [type, typeModifiers] of Object.entries(modifiersByType)) {
		const doesStack = stackingRules[type] ?? false;

		// Special case: all penalties stack regardless of type
		const arePenalties = typeModifiers.every((m) => m.value < 0);
		const shouldStack = doesStack || arePenalties;

		if (shouldStack) {
			// This type stacks - apply all modifiers
			for (const modifier of typeModifiers) {
				result.total += modifier.value;
				result.appliedModifiers.push(modifier);
			}
		} else {
			// This type doesn't stack - find the best one
			let bestModifier: Modifier | null = null;
			let bestValue = 0;

			for (const modifier of typeModifiers) {
				// For bonuses we want the highest value, for penalties the lowest (most negative)
				const isBetter =
					modifier.value > 0 ? modifier.value > bestValue : modifier.value < bestValue;

				if (!bestModifier || isBetter) {
					bestModifier = modifier;
					bestValue = modifier.value;
				}
			}

			// Apply the best modifier
			if (bestModifier) {
				result.total += bestModifier.value;
				result.appliedModifiers.push(bestModifier);

				// Add the others to unapplied
				for (const modifier of typeModifiers) {
					if (modifier !== bestModifier) {
						result.unappliedModifiers.push(modifier);
					}
				}
			}
		}
	}

	return result;
}

/**
 * Operation handler for IOCTL operations
 * Handles a specific IOCTL operation for a capability
 */
export type IoctlOperationHandler = (
	context: CapabilityContext,
	entityPath: string,
	args: any
) => number;

/**
 * Create a generic IOCTL handler for common capability operations
 * @param context Capability context
 * @param operationHandlers Map of operation names to handler functions
 * @returns An IOCTL handler function
 */
export function createIoctlHandler(
	context: CapabilityContext,
	operationHandlers: Record<string, IoctlOperationHandler>
): (fd: number, request: number, arg: any) => number {
	return (fd: number, request: number, arg: any): number => {
		// Basic validation
		if (!arg || typeof arg !== 'object' || !arg.operation) {
			context.logger.error('Invalid IOCTL arguments: missing operation', null, {
				operation: 'createIoctlHandler',
				fd,
				request
			});
			return ErrorCode.EINVAL;
		}

		const { operation } = arg;

		// Check if we have a handler for this operation
		if (!operationHandlers[operation]) {
			context.logger.error(`Unknown operation: ${operation}`, null, {
				operation: 'createIoctlHandler',
				fd,
				request
			});
			return ErrorCode.EINVAL;
		}

		try {
			// Most operations require an entity path
			if (!arg.entityPath && operation !== 'getConfig' && operation !== 'setConfig') {
				context.logger.error(`Missing entityPath for operation: ${operation}`, null, {
					operation: 'createIoctlHandler',
					fd,
					request
				});
				return ErrorCode.EINVAL;
			}

			// Call the operation handler
			return operationHandlers[operation](context, arg.entityPath, arg);
		} catch (err) {
			context.logger.error(`Error in IOCTL operation ${operation}:`, err, {
				operation: 'createIoctlHandler',
				fd,
				request,
				ioctl_op: operation
			});
			return ErrorCode.EIO;
		}
	};
}

/**
 * Standard IOCTL operation to initialize an entity
 * @param context Capability context
 * @param entityPath Path to the entity
 * @param initializer Function to initialize the entity
 * @returns Error code
 */
export function handleInitializeOperation(
	context: CapabilityContext,
	entityPath: string,
	initializer: (entity: Entity) => void
): number {
	return performEntityOperation(context, entityPath, (entity) => {
		initializer(entity);
	});
}
