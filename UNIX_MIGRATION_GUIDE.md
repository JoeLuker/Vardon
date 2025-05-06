# Unix Architecture Migration Guide

This document provides a guide for completing the migration to Unix-style architecture patterns across the Vardon codebase.

## Completed Migrations

- [x] Added `CapabilityKit.ts` with Unix-style composition utilities
- [x] Converted `AbilityCapabilityProvider` to composition-based `AbilityCapabilityComposed.ts`
- [x] Converted `BonusCapabilityProvider` to composition-based `BonusCapabilityComposed.ts`
- [x] Converted `SkillCapabilityProvider` to composition-based `SkillCapabilityComposed.ts`
- [x] Converted `PluginManager` to composition-based `PluginManagerComposed.ts`
- [x] Updated application.ts to use new composition-based implementations
- [x] Updated tests to work with composition-based patterns

## Remaining Migrations

- [ ] Convert `CombatCapabilityProvider` to composition-based `CombatCapabilityComposed.ts`
- [ ] Convert `ConditionCapabilityProvider` to composition-based `ConditionCapabilityComposed.ts`
- [ ] Update any remaining classes to follow composition pattern
- [ ] Convert direct Supabase access to use Unix file-like interfaces

## Migration Pattern

Follow this pattern when converting class-based implementations to composition-based ones:

1. **Create a factory function** that returns a capability instance:

```typescript
export function createXXXCapability(dependencies, options = {}): XXXCapability {
  // Create shared context
  const context = {
    id: 'xxx',
    debug: options.debug || false,
    version: options.version || '1.0.0',
    // Standard context properties
    kernel: null,
    storage: new Map(),
    openFiles: new Map(),
    // Domain-specific context properties
    ...
  };
  
  // Create base capability
  const capability = createCapability({
    id: context.id,
    debug: context.debug,
    version: context.version,
    
    // Device operations
    onRead: (fd, buffer, ctx) => handleRead(fd, buffer, ctx),
    onWrite: (fd, buffer, ctx) => handleWrite(fd, buffer, ctx),
    onIoctl: (fd, request, arg, ctx) => handleIoctl(fd, request, arg, ctx)
  });
  
  // Add domain-specific methods
  return Object.assign(capability, {
    // Domain operations (converted to standalone functions)
    operation1: (entity, ...args) => operation1(context, entity, ...args),
    operation2: (entity, ...args) => operation2(context, entity, ...args),
    // Additional operations...
  });
}
```

2. **Extract class methods to standalone functions** that use the context:

```typescript
function operation1(context, entity, ...args) {
  // Implementation that would have been a class method
  // Now uses context for dependencies and state
}
```

3. **Implement file operation handlers** for Unix-style I/O:

```typescript
function handleRead(fd, buffer, context) {
  // Extract path info from file descriptor
  const fileInfo = context.openFiles.get(fd);
  if (!fileInfo) return ErrorCode.EBADF;
  
  // Parse paths using Unix-style patterns
  const match = fileInfo.path.match(/\/entity\/([^\/]+)\/resource\/([^\/]+)/);
  if (match) {
    const entityId = match[1];
    const resourceId = match[2];
    
    // Use withEntitySync for proper resource management
    return withEntitySync(context, entityId, (entity) => {
      // Perform read operation
      // Copy data into buffer (passed by reference)
      return ErrorCode.SUCCESS;
    });
  }
  
  return ErrorCode.EINVAL;
}
```

4. **Update exports** in index.ts to include both implementations:

```typescript
// Export the class-based implementation (legacy)
export { XXXCapabilityProvider } from './XXXCapabilityProvider';

// Export the composition-based implementation (Unix-style)
export { createXXXCapability } from './XXXCapabilityComposed';
```

## Unix Architecture Principles

When implementing Unix-style patterns, follow these key principles:

1. **Everything is a file**: Resources should be accessed through filesystem-like interfaces
   - Use path patterns like `/entity/{id}/resource/{resourceId}`
   - Use file descriptors for access control

2. **Do one thing and do it well**: Each function should have a single responsibility
   - Break down complex methods into small, focused functions
   - Compose functionality from simpler building blocks

3. **Expect the output of every program to become the input to another program**
   - Use explicit function inputs and outputs
   - Design for composability

4. **Use tools in preference to unskilled help**: Create general-purpose utilities
   - Create helpers like `withEntity` and `pipe` for common patterns
   - Reuse standard patterns across components

## Resource Management

Follow these patterns for Unix-style resource management:

1. **Open-Read/Write-Close Pattern**:
   ```typescript
   const fd = kernel.open(path, OpenMode.READ_WRITE);
   if (fd < 0) return ErrorCode.ENOENT;
   
   try {
     // Use the file descriptor
     const [result, data] = kernel.read(fd);
     // Modify data
     const writeResult = kernel.write(fd, data);
     return writeResult;
   } finally {
     // Always close file descriptors
     kernel.close(fd);
   }
   ```

2. **Use `withEntity` for automatic resource management**:
   ```typescript
   withEntity(context, entityId, async (entity, fd) => {
     // Work with entity; fd is automatically closed
     return result;
   });
   ```

3. **Track open resources explicitly**:
   ```typescript
   // In a context
   openFiles: new Map<number, { path: string, mode: OpenMode }>()
   ```

## Error Handling

Use the Unix-style error codes from `ErrorCode` enum:

```typescript
if (!fileInfo) {
  error(context, `Invalid file descriptor: ${fd}`);
  return ErrorCode.EBADF; // Bad file descriptor
}

// Standard error pattern
try {
  // Operation
} catch (err) {
  error(context, `Operation failed: ${err}`);
  return ErrorCode.EIO; // I/O error
}
```

## Testing

Test composition-based implementations directly:

```typescript
// Create the capability with mocked dependencies
const mockAbilityCapability = { /* ... */ };
const mockBonusCapability = { /* ... */ };
const skillCapability = createSkillCapability(
  mockAbilityCapability,
  mockBonusCapability,
  { debug: true }
);

// Test operations directly
skillCapability.setSkillRanks(testEntity, 1, 5);
const result = skillCapability.getSkillBonus(testEntity, 1);
```