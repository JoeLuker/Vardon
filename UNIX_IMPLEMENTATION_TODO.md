# Unix-Style Architecture Implementation TODO

The following items remain to complete the Unix-style architecture implementation:

## High Priority

- [x] Implement capability utilities with `CapabilityKit.ts`
- [x] Convert `AbilityCapabilityProvider` to composition-based `AbilityCapabilityComposed.ts`
- [x] Convert `BonusCapabilityProvider` to composition-based `BonusCapabilityComposed.ts`
- [x] Convert `PluginManager` to composition-based `PluginManagerComposed.ts`
- [x] Update application.ts to use composition-based implementations
- [x] Update test files to use composition-based patterns

## Medium Priority

- [ ] Convert `SkillCapabilityProvider` to composition-based `SkillCapabilityComposed.ts`
- [ ] Convert `CombatCapabilityProvider` to composition-based `CombatCapabilityComposed.ts`
- [ ] Convert `ConditionCapabilityProvider` to composition-based `ConditionCapabilityComposed.ts`
- [ ] Update additional tests to verify Unix architecture compliance
- [ ] Create Unix architecture style guide and best practices documentation

## Unix Architecture Implementation Guide

### Core Principles

1. **Everything is a file**: Resources are managed through a filesystem-like interface
2. **Small, focused tools**: Each capability should do one thing well
3. **Composition over inheritance**: Build systems through composition of smaller pieces
4. **Explicit resource management**: Open, read, write, close pattern for all resources
5. **Standard interfaces**: Use standard device operations (read, write, ioctl)

### Implementation Pattern

For each capability:

1. Create a factory function (e.g., `createXXXCapability`) that:
   - Sets up a shared context
   - Creates a base capability with device operations
   - Enhances the capability with domain-specific methods

2. Extract class methods to standalone functions that:
   - Take the context and entity as parameters
   - Follow Unix principles of resource management
   - Use withEntity pattern for file operations

3. Implement standard device operations:
   - `onRead` handler
   - `onWrite` handler
   - `onIoctl` handler

4. Export the factory function from the capability's index.ts

### Example Implementation

```typescript
export function createXXXCapability(options: Options = {}): XXXCapability {
  // Create shared context
  const context: CapabilityContext & CustomContext = {
    id: 'xxx',
    debug: options.debug || false,
    version: options.version || '1.0.0',
    kernel: null,
    storage: new Map(),
    openFiles: new Map(),
    // Custom context properties
  };
  
  // Create device capability
  const capability = createCapability({
    id: 'xxx',
    debug: options.debug,
    version: options.version,
    
    // Device operations
    onRead(fd, buffer, ctx) { return handleRead(fd, buffer, ctx); },
    onWrite(fd, buffer, ctx) { return handleWrite(fd, buffer, ctx); },
    onIoctl(fd, request, arg, ctx) { return handleIoctl(fd, request, arg, ctx); }
  });
  
  // Add domain-specific methods to the capability
  return Object.assign(capability, {
    // Domain methods
    operation1: (entity, ...args) => operation1(context, entity, ...args),
    operation2: (entity, ...args) => operation2(context, entity, ...args),
    // Additional domain methods...
    initialize: (entity) => initialize(context, entity)
  });
}
```