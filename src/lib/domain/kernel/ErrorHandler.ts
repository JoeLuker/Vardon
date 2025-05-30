/**
 * ErrorHandler.ts - File-based error handling system
 * 
 * This module provides a comprehensive error handling system following file-based principles:
 * - Error codes
 * - Structured error objects with context
 * - Error propagation patterns
 * - Resource management utilities
 */

import { ErrorCode } from './types';

// Re-export ErrorCode enum
export { ErrorCode };

/**
 * Error context containing information about where an error occurred
 */
export interface ErrorContext {
  /** Component where the error occurred */
  component: string;
  
  /** Operation being performed */
  operation: string;
  
  /** Path being operated on (if applicable) */
  path?: string;
  
  /** File descriptor being used (if applicable) */
  fd?: number;
  
  /** Additional contextual data */
  data?: Record<string, any>;
  
  /** Stack trace (if available) */
  stack?: string;
  
  /** Timestamp when error occurred */
  timestamp: number;
}

/**
 * Structured error object containing code and context
 */
export interface SystemError {
  /** Error code (mapped to Unix errno) */
  code: ErrorCode;
  
  /** Human-readable error message */
  message: string;
  
  /** Context about where the error occurred */
  context: ErrorContext;
}

/**
 * Typed result for operations that return data on success
 */
export interface Result<T> {
  /** Success status */
  success: boolean;
  
  /** Error code if operation failed */
  errorCode: ErrorCode;
  
  /** Error message if operation failed */
  errorMessage?: string;
  
  /** Error context if operation failed */
  errorContext?: ErrorContext;
  
  /** Result data if operation succeeded */
  data?: T;
}

/**
 * Create a structured error object
 */
export function createError(
  code: ErrorCode,
  message: string,
  context: Partial<ErrorContext>
): SystemError {
  return {
    code,
    message,
    context: {
      component: context.component || 'unknown',
      operation: context.operation || 'unknown',
      path: context.path,
      fd: context.fd,
      data: context.data,
      stack: new Error().stack,
      timestamp: Date.now()
    }
  };
}

/**
 * Get a human-readable description for an error code
 */
export function getErrorDescription(code: ErrorCode): string {
  switch (code) {
    // Standard Unix error codes
    case ErrorCode.SUCCESS:
      return 'Success';
    case ErrorCode.EPERM:
      return 'Operation not permitted';
    case ErrorCode.ENOENT:
      return 'No such file or directory';
    case ErrorCode.ESRCH:
      return 'No such process';
    case ErrorCode.EINTR:
      return 'Interrupted system call';
    case ErrorCode.EIO:
      return 'Input/output error';
    case ErrorCode.ENXIO:
      return 'No such device or address';
    case ErrorCode.EBADF:
      return 'Bad file descriptor';
    case ErrorCode.EAGAIN:
      return 'Resource temporarily unavailable';
    case ErrorCode.ENOMEM:
      return 'Out of memory';
    case ErrorCode.EACCES:
      return 'Permission denied';
    case ErrorCode.EFAULT:
      return 'Bad address';
    case ErrorCode.EBUSY:
      return 'Device or resource busy';
    case ErrorCode.EEXIST:
      return 'File exists';
    case ErrorCode.ENODEV:
      return 'No such device';
    case ErrorCode.ENOTDIR:
      return 'Not a directory';
    case ErrorCode.EISDIR:
      return 'Is a directory';
    case ErrorCode.EINVAL:
      return 'Invalid argument';
    case ErrorCode.EFBIG:
      return 'File too large';
    case ErrorCode.ENOSPC:
      return 'No space left on device';
    case ErrorCode.ESPIPE:
      return 'Illegal seek';
    case ErrorCode.EROFS:
      return 'Read-only file system';
    case ErrorCode.ENOSYS:
      return 'Function not implemented';
    case ErrorCode.ENOTSUP:
      return 'Operation not supported';
      
    // Custom application error codes
    case ErrorCode.EFSNOTREADY:
      return 'Filesystem not ready';
    case ErrorCode.EDEVNOTREADY:
      return 'Device not ready';
    case ErrorCode.EPATHEXISTS:
      return 'Path already exists';
    case ErrorCode.EENTITYNOTFOUND:
      return 'Entity not found';
    case ErrorCode.ECHARACTERNOTFOUND:
      return 'Character not found';
    case ErrorCode.ECAPABILITYNOTFOUND:
      return 'Capability not found';
    case ErrorCode.EPLUGINNOTFOUND:
      return 'Plugin not found';
    case ErrorCode.EDBERROR:
      return 'Database error';
    case ErrorCode.ENETWORKERROR:
      return 'Network error';
    case ErrorCode.EAUTHERROR:
      return 'Authentication error';
    case ErrorCode.EINVALIDSTATE:
      return 'Invalid operation for the current state';
    case ErrorCode.EFEATURENOTAVAILABLE:
      return 'Feature not available';
    case ErrorCode.ERESOURCELIMIT:
      return 'Resource limit reached';
    case ErrorCode.ETIMEOUT:
      return 'Timeout occurred';
    case ErrorCode.EPARAMMISSING:
      return 'Required parameter missing';
    case ErrorCode.EVALIDATION:
      return 'Validation failed';
    case ErrorCode.ECHARACTEREXISTS:
      return 'Character already exists';
    case ErrorCode.EMAXITEMSREACHED:
      return 'Maximum number of items reached';
    case ErrorCode.EDATAFORMAT:
      return 'Data format error';
    default:
      return `Unknown error code: ${code}`;
  }
}

/**
 * Create a success result with data
 */
export function success<T>(data: T): Result<T> {
  return {
    success: true,
    errorCode: ErrorCode.SUCCESS,
    data
  };
}

/**
 * Create an error result
 */
export function failure<T>(
  code: ErrorCode,
  message?: string,
  context?: Partial<ErrorContext>
): Result<T> {
  const errorMessage = message || getErrorDescription(code);
  
  return {
    success: false,
    errorCode: code,
    errorMessage,
    errorContext: context ? {
      component: context.component || 'unknown',
      operation: context.operation || 'unknown',
      path: context.path,
      fd: context.fd,
      data: context.data,
      stack: new Error().stack,
      timestamp: Date.now()
    } : undefined
  };
}

/**
 * Process a raw error code result and convert to a structured Result
 */
export function processErrorCode<T>(
  code: ErrorCode,
  data?: T,
  context?: Partial<ErrorContext>
): Result<T> {
  if (code === ErrorCode.SUCCESS) {
    return success(data as T);
  }
  
  return failure(
    code,
    getErrorDescription(code),
    context
  );
}

/**
 * Convert a system error to a readable string
 */
export function formatError(error: SystemError): string {
  return `[${error.context.component}] ${error.message} (${getErrorDescription(error.code)})
  Operation: ${error.context.operation}
  ${error.context.path ? `Path: ${error.context.path}` : ''}
  ${error.context.fd !== undefined ? `File descriptor: ${error.context.fd}` : ''}
  Time: ${new Date(error.context.timestamp).toISOString()}`;
}

/**
 * Execute a function with proper resource cleanup
 * Ensures resources are released even if exceptions occur
 */
export async function withResource<T, R>(
  allocator: () => Promise<T> | T,
  releaser: (resource: T) => Promise<void> | void,
  operation: (resource: T) => Promise<R> | R
): Promise<Result<R>> {
  let resource: T | null = null;
  
  try {
    // Allocate resource
    resource = await allocator();
    
    // Perform operation
    const result = await operation(resource);
    
    // Success path
    return success(result);
  } catch (error) {
    // Handle system errors
    if ((error as SystemError).code !== undefined) {
      return {
        success: false,
        errorCode: (error as SystemError).code,
        errorMessage: (error as SystemError).message,
        errorContext: (error as SystemError).context
      };
    }
    
    // Handle standard errors
    return failure(
      ErrorCode.EIO,
      error instanceof Error ? error.message : String(error),
      {
        component: 'ResourceManager',
        operation: 'withResource',
        data: { error }
      }
    );
  } finally {
    // Always release resource if it was allocated
    if (resource !== null) {
      try {
        await releaser(resource);
      } catch (releaseError) {
        console.error('Error releasing resource:', releaseError);
      }
    }
  }
}

/**
 * Synchronous version of withResource
 */
export function withResourceSync<T, R>(
  allocator: () => T,
  releaser: (resource: T) => void,
  operation: (resource: T) => R
): Result<R> {
  let resource: T | null = null;
  
  try {
    // Allocate resource
    resource = allocator();
    
    // Perform operation
    const result = operation(resource);
    
    // Success path
    return success(result);
  } catch (error) {
    // Handle system errors
    if ((error as SystemError).code !== undefined) {
      return {
        success: false,
        errorCode: (error as SystemError).code,
        errorMessage: (error as SystemError).message,
        errorContext: (error as SystemError).context
      };
    }
    
    // Handle standard errors
    return failure(
      ErrorCode.EIO,
      error instanceof Error ? error.message : String(error),
      {
        component: 'ResourceManager',
        operation: 'withResourceSync',
        data: { error }
      }
    );
  } finally {
    // Always release resource if it was allocated
    if (resource !== null) {
      try {
        releaser(resource);
      } catch (releaseError) {
        console.error('Error releasing resource:', releaseError);
      }
    }
  }
}

/**
 * File operation with automatic descriptor management
 */
export async function withFile<R>(
  kernel: any,
  path: string,
  mode: any,
  operation: (fd: number) => Promise<R> | R
): Promise<Result<R>> {
  return withResource(
    // Allocator: open file
    () => {
      const fd = kernel.open(path, mode);
      if (fd < 0) {
        throw createError(
          -fd as ErrorCode, // Negate negative fd to get error code
          `Failed to open ${path}`,
          {
            component: 'FileOperations',
            operation: 'open',
            path
          }
        );
      }
      return fd;
    },
    // Releaser: close file
    (fd) => {
      kernel.close(fd);
    },
    // Operation to perform with file descriptor
    operation
  );
}

/**
 * Device operation with automatic descriptor management
 */
export async function withDevice<R>(
  kernel: any,
  devicePath: string,
  mode: any,
  operation: (fd: number) => Promise<R> | R
): Promise<Result<R>> {
  return withFile(kernel, devicePath, mode, operation);
}

/**
 * Try-with-resources pattern for Unix file operations
 */
export function tryWithResources<T>(
  fn: () => T,
  cleanup: () => void
): Result<T> {
  try {
    const result = fn();
    return success(result);
  } catch (error) {
    if ((error as SystemError).code !== undefined) {
      return {
        success: false,
        errorCode: (error as SystemError).code,
        errorMessage: (error as SystemError).message,
        errorContext: (error as SystemError).context
      };
    }
    
    return failure(
      ErrorCode.EIO,
      error instanceof Error ? error.message : String(error)
    );
  } finally {
    cleanup();
  }
}

/**
 * Map a JavaScript Error to a SystemError
 */
export function mapJsErrorToSystemError(
  error: Error,
  defaultCode: ErrorCode = ErrorCode.EIO,
  context: Partial<ErrorContext> = {}
): SystemError {
  return createError(
    defaultCode,
    error.message,
    {
      ...context,
      stack: error.stack
    }
  );
}

/**
 * Create a logger with error handling
 */
export function createErrorLogger(component: string) {
  return {
    /**
     * Log an error
     */
    error(message: string, error?: Error | SystemError | unknown, context?: Partial<ErrorContext>): SystemError {
      let systemError: SystemError;
      
      if (error && typeof error === 'object' && 'code' in error && 'context' in error) {
        // Already a SystemError
        systemError = error as SystemError;
      } else if (error instanceof Error) {
        // JavaScript Error
        systemError = mapJsErrorToSystemError(error, ErrorCode.EIO, {
          component,
          operation: context?.operation || 'unknown',
          ...context
        });
      } else {
        // Unknown error type
        systemError = createError(
          ErrorCode.EIO,
          message + (error ? `: ${String(error)}` : ''),
          {
            component,
            operation: context?.operation || 'unknown',
            ...context
          }
        );
      }
      
      // Log the formatted error
      console.error(formatError(systemError));
      
      return systemError;
    },
    
    /**
     * Log a warning
     */
    warn(message: string, context?: Partial<ErrorContext>): void {
      console.warn(`[${component}] WARNING: ${message}`);
    },
    
    /**
     * Log an info message
     */
    info(message: string): void {
      console.info(`[${component}] ${message}`);
    },
    
    /**
     * Log a debug message
     */
    debug(message: string, data?: any): void {
      if (data !== undefined) {
        console.debug(`[${component}] ${message}`, data);
      } else {
        console.debug(`[${component}] ${message}`);
      }
    }
  };
}