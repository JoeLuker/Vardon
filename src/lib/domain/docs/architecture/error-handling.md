# Unix-Style Error Handling

This document outlines the Unix-style error handling system implemented in the Vardon application.

## Introduction

In Unix systems, error handling follows several key principles:

1. Functions return error codes (integers) to indicate success or failure
2. A standard set of error codes (`errno.h`) is used throughout the system
3. Errors are propagated up the call stack
4. Resource cleanup is handled with care, often using try/finally patterns
5. Error context is preserved as much as possible

Our implementation follows these principles closely, providing a consistent error handling approach across the application.

## Core Components

### ErrorCode Enum

Similar to Unix `errno.h`, we define a standard set of error codes in `kernel/types.ts`:

```typescript
export enum ErrorCode {
  /** Success */
  SUCCESS = 0,
  
  /** Operation not permitted */
  EPERM = 1,
  
  /** No such file or directory */
  ENOENT = 2,
  
  // Additional error codes...
}
```

### Error Context

Error context provides details about where and why an error occurred:

```typescript
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
```

### System Error

A structured error object that combines an error code with context:

```typescript
export interface SystemError {
  /** Error code (mapped to Unix errno) */
  code: ErrorCode;
  
  /** Human-readable error message */
  message: string;
  
  /** Context about where the error occurred */
  context: ErrorContext;
}
```

### Result Type

A generic result type that can contain either success data or error information:

```typescript
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
```

## Error Handling Utilities

### createError

Creates a structured error object:

```typescript
export function createError(
  code: ErrorCode,
  message: string,
  context: Partial<ErrorContext>
): SystemError
```

### success / failure

Helper functions to create standardized result objects:

```typescript
export function success<T>(data: T): Result<T>
export function failure<T>(code: ErrorCode, message?: string, context?: Partial<ErrorContext>): Result<T>
```

### withResource

Pattern for resource management that ensures cleanup:

```typescript
export async function withResource<T, R>(
  allocator: () => Promise<T> | T,
  releaser: (resource: T) => Promise<void> | void,
  operation: (resource: T) => Promise<R> | R
): Promise<Result<R>>
```

### withFile

Higher-level utility for file operations with automatic descriptor management:

```typescript
export async function withFile<R>(
  kernel: any,
  path: string,
  mode: any,
  operation: (fd: number) => Promise<R> | R
): Promise<Result<R>>
```

### Error Logger

Standardized error logging with context:

```typescript
export function createErrorLogger(component: string) {
  return {
    error(message: string, error?: Error | SystemError | unknown, context?: Partial<ErrorContext>): SystemError,
    warn(message: string, context?: Partial<ErrorContext>): void,
    info(message: string): void,
    debug(message: string, data?: any): void
  };
}
```

## Usage Patterns

### Device Operations

Device capabilities should use error handling consistently:

```typescript
function handleRead(fd: number, buffer: any, context: any): number {
  try {
    // Operation implementation
    return ErrorCode.SUCCESS;
  } catch (err) {
    context.logger.error(`Error in read operation: ${err}`, err, {
      operation: 'handleRead',
      fd
    });
    return ErrorCode.EIO;
  }
}
```

### Resource Management

Always use proper resource cleanup patterns:

```typescript
// GOOD: Using withFile for automatic cleanup
return withFile(
  kernel,
  entityPath,
  OpenMode.READ_WRITE,
  (fd) => {
    // File operations with fd
    return ErrorCode.SUCCESS;
  }
);

// BAD: Manual cleanup with risk of leaks
const fd = kernel.open(entityPath, OpenMode.READ_WRITE);
try {
  // File operations with fd
  return ErrorCode.SUCCESS;
} finally {
  kernel.close(fd); // Easy to forget or miss in complex code
}
```

### Error Propagation

Return structured results for higher-level functions:

```typescript
async function loadEntity(entityId: string): Promise<Result<Entity>> {
  const entityPath = `/entity/${entityId}`;
  
  return withFile(
    kernel,
    entityPath,
    OpenMode.READ,
    (fd) => {
      const [result, entity] = kernel.read(fd);
      
      if (result !== ErrorCode.SUCCESS) {
        return failure(
          result,
          `Failed to read entity: ${entityPath}`,
          {
            operation: 'loadEntity.read',
            path: entityPath,
            fd
          }
        );
      }
      
      return success(entity);
    }
  );
}
```

### Error Handling in UI Components

UI components should handle errors gracefully:

```typescript
async function loadData() {
  try {
    const result = await api.loadEntity(entityId);
    
    if (!result.success) {
      // Handle error in UI
      errorMessage = result.errorMessage || 'Unknown error';
      return;
    }
    
    // Use result.data
    entity = result.data;
  } catch (err) {
    // Handle unexpected errors
    errorMessage = 'Unexpected error occurred';
    console.error(err);
  }
}
```

## Best Practices

1. **Consistent Error Codes**: Use the standard ErrorCode enum for all error returns
2. **Proper Resource Management**: Always use the withResource or withFile patterns
3. **Detailed Error Context**: Include as much context as possible in error reports
4. **Structured Results**: Use the Result type for all operations that can fail
5. **Centralized Logging**: Use the createErrorLogger utility for consistent logging
6. **Error Propagation**: Properly propagate errors up the call stack
7. **Error Handling**: Handle errors at appropriate levels of the application
8. **Try/Catch Blocks**: Use try/catch to prevent uncaught exceptions
9. **Error Reporting**: Log errors with appropriate detail for debugging
10. **User-Friendly Messages**: Convert error codes to user-friendly messages in the UI

## Migration Guide

When migrating existing code to the new error handling system:

1. Replace direct error returns with ErrorCode enum values
2. Replace try/catch blocks with withResource patterns
3. Add proper error context to all error returns
4. Update error logging to use the createErrorLogger utility
5. Convert function returns to use the Result type where appropriate
6. Update UI components to handle structured errors