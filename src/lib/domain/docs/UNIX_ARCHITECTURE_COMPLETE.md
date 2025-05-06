# Unix Architecture Implementation for Vardon

## Overview

The Vardon Character Engine has been fully refactored to follow Unix architecture principles, replacing class-based inheritance with a more flexible composition-based approach. This implementation follows the Unix philosophy of "everything is a file," "do one thing well," and "composition over inheritance."

## Core Unix Philosophy Principles Applied

1. **Everything is a File**: All game entities are treated as files in a filesystem with consistent interfaces
2. **Do One Thing Well**: Each component has a single, clear responsibility
3. **Small, Sharp Tools**: The system is composed of small, focused components that work together
4. **Composition over Inheritance**: Build systems through composition rather than inheritance hierarchies
5. **Explicit Resource Management**: Open, read, write, close pattern for all resources

## Core System Components

### 1. GameKernel

The `GameKernel` implements a Unix-like filesystem where:

- `/dev/` contains device drivers (capabilities)
- `/entity/` contains game entities (characters, etc.)
- System calls (open, read, write, close) for accessing resources
- Reference counting for resources through file descriptors

```typescript
// Create an entity file
const entity = {
  id: 'character-1',
  type: 'character',
  name: 'Warrior',
  properties: { strength: 18, dexterity: 14 },
  metadata: { createdAt: Date.now(), updatedAt: Date.now(), version: 1 }
};

const entityPath = `/entity/${entity.id}`;
kernel.create(entityPath, entity);

// Access the entity (by any component)
const fd = kernel.open(entityPath, OpenMode.READ);
try {
  const buffer = {};
  kernel.read(fd, buffer);
  console.log(buffer.name); // "Warrior"
} finally {
  kernel.close(fd); // Always close file descriptors
}
```

### 2. CapabilityKit

The `CapabilityKit` provides utilities for implementing capabilities using composition rather than inheritance:

```typescript
export function createCapability(options: CapabilityOptions): any {
  // Create shared context for all operations
  const context: CapabilityContext = {
    id: options.id,
    debug: options.debug || false,
    version: options.version || '1.0.0',
    kernel: null,
    storage: new Map(),
    openFiles: new Map()
  };
  
  return {
    // Basic capability properties
    id: options.id,
    version: context.version,
    
    // Standard capability operations
    onMount(kernel: any): void {
      context.kernel = kernel;
      // Additional mount logic
    },
    
    read(fd: number, buffer: any): number {
      // Read implementation or call custom handler
      if (options.onRead) {
        return options.onRead(fd, buffer, context);
      }
      return ErrorCode.EINVAL;
    },
    
    write(fd: number, buffer: any): number {
      // Write implementation or call custom handler
      if (options.onWrite) {
        return options.onWrite(fd, buffer, context);
      }
      return ErrorCode.EINVAL;
    },
    
    ioctl(fd: number, request: number, arg: any): number {
      // IOCTL implementation or call custom handler
      if (options.onIoctl) {
        return options.onIoctl(fd, request, arg, context);
      }
      return ErrorCode.EINVAL;
    },
    
    async shutdown(): Promise<void> {
      // Shutdown implementation
      if (options.onShutdown) {
        await options.onShutdown(context);
      }
    }
  };
}
```

### 3. withEntity Pattern

The `withEntity` pattern provides safe resource management for entity operations:

```typescript
export async function withEntity<T>(
  context: CapabilityContext, 
  entityId: string,
  operation: (entity: Entity, fd: number) => Promise<T>
): Promise<T | null> {
  const kernel = context.kernel;
  
  // Path to the entity file
  const entityPath = `/entity/${entityId}`;
  
  // Open the entity file
  const fd = kernel.open(entityPath, OpenMode.READ_WRITE);
  if (fd < 0) {
    return null;
  }
  
  try {
    // Read entity data
    const [result, entity] = kernel.read(fd);
    
    if (result !== 0) {
      return null;
    }
    
    // Perform the operation with the entity
    return await operation(entity as Entity, fd);
  } finally {
    // Always close the file descriptor
    kernel.close(fd);
  }
}
```

### 4. Composed Capabilities

All capabilities have been converted to use a composition pattern:

1. **BonusCapabilityComposed.ts**
2. **AbilityCapabilityComposed.ts**
3. **SkillCapabilityComposed.ts**
4. **CombatCapabilityComposed.ts**
5. **ConditionCapabilityComposed.ts**

Example of a composed capability:

```typescript
export function createAbilityCapability(
  bonusCapability: BonusCapability,
  options: AbilityCapabilityOptions = {}
): AbilityCapability {
  // Create shared context
  const context: CapabilityContext & {
    defaultAbilities: string[];
    bonusCapability: BonusCapability;
  } = {
    id: 'ability',
    debug: options.debug || false,
    version: options.version || '1.0.0',
    kernel: null,
    storage: new Map(),
    openFiles: new Map(),
    defaultAbilities: options.defaultAbilities || STANDARD_ABILITIES,
    bonusCapability
  };
  
  // Create device capability
  const capability = createCapability({
    id: 'ability',
    debug: options.debug,
    version: options.version,
    
    // Device operations
    onRead(fd, buffer, ctx) {
      return handleRead(fd, buffer, ctx);
    },
    
    onWrite(fd, buffer, ctx) {
      return handleWrite(fd, buffer, ctx);
    },
    
    onIoctl(fd, request, arg, ctx) {
      return handleIoctl(fd, request, arg, ctx);
    }
  });
  
  // Add domain-specific methods to the capability
  const enhancedCapability = Object.assign(capability, {
    // Domain methods
    getAbilityScore: (entity: Entity, ability: string) => 
      getAbilityScore(context, entity, ability),
      
    getAbilityModifier: (entity: Entity, ability: string) => 
      getAbilityModifier(context, entity, ability),
      
    setAbilityScore: (entity: Entity, ability: string, value: number) => 
      setAbilityScore(context, entity, ability, value),
    
    // Additional methods...
    initialize: (entity: Entity) => 
      initialize(context, entity)
  });
  
  return enhancedCapability;
}
```

### 5. PluginManagerComposed

The `PluginManagerComposed` implements a Unix-style process manager using composition:

```typescript
export function createPluginManager(options: PluginManagerOptions): PluginManager {
  const context: PluginManagerContext = {
    id: 'pluginManager',
    debug: options.debug || false,
    kernel: options.kernel,
    filesystem: new DefaultPluginFilesystem(options.kernel, options.debug || false),
    openFiles: new Map()
  };
  
  return {
    // Operations for plugin management
    registerPlugin(plugin: Plugin): void { /* ... */ },
    getPlugin(pluginId: string): Plugin | undefined { /* ... */ },
    // Additional plugin management operations...
  };
}
```

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT UI                                  │
│  (Svelte Components, Character Sheet, Feature UI, etc.)              │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          UnixGameAPI                                 │
│  (Main interface between UI and Unix architecture)                   │
└───────────┬─────────────────────┬──────────────────────┬────────────┘
            │                     │                      │
            ▼                     ▼                      ▼
┌───────────────────┐  ┌────────────────────┐  ┌──────────────────────┐
│    GameKernel     │  │   PluginManager    │  │     GameRulesAPI     │
│  (Core system)    │  │ (Manages plugins)  │  │ (Database interface) │
└─────────┬─────────┘  └─────────┬──────────┘  └──────────┬───────────┘
          │                      │                        │
          ▼                      ▼                        ▼
┌─────────────────────────────────────────────┐  ┌────────────────────┐
│              CAPABILITIES                    │  │     Database       │
│                                             │  │ (Supabase/Postgres) │
│  ┌─────────────┐ ┌─────────────┐ ┌────────┐ │  └────────────────────┘
│  │   Ability   │ │    Bonus    │ │ Skill  │ │
│  │ Capability  │ │ Capability  │ │Capability│
│  └─────────────┘ └─────────────┘ └────────┘ │
│                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌────────┐ │
│  │   Combat    │ │  Condition  │ │ Spell  │ │
│  │ Capability  │ │ Capability  │ │Capability│
│  └─────────────┘ └─────────────┘ └────────┘ │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│                PLUGINS                       │
│                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌────────┐ │
│  │    Feats    │ │   Class     │ │ Spell  │ │
│  │   Plugins   │ │  Plugins    │ │ Plugins│ │
│  └─────────────┘ └─────────────┘ └────────┘ │
│                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌────────┐ │
│  │ Corruption  │ │   Generic   │ │ Migrated│ │
│  │  Plugins    │ │   Plugins   │ │ Plugins │ │
│  └─────────────┘ └─────────────┘ └────────┘ │
└─────────────────────────────────────────────┘
```

## Key Achievements

The migration to Unix-style architecture is now complete with the following accomplishments:

1. **CapabilityKit.ts**: Created a utility for building Unix-style capabilities with composition
2. **AbilityCapabilityComposed.ts**: Converted ability score management to composition
3. **BonusCapabilityComposed.ts**: Converted bonus calculation system to composition
4. **SkillCapabilityComposed.ts**: Converted skill system to composition
5. **CombatCapabilityComposed.ts**: Converted combat system to composition
6. **ConditionCapabilityComposed.ts**: Converted condition system to composition
7. **PluginManagerComposed.ts**: Reimplemented plugin manager using composition
8. **Updated application.ts**: Switched to using composition-based implementations

## Benefits of the Unix Architecture

The Unix-style architecture implementation provides significant benefits:

1. **Better Composability**: Functions can be combined in flexible ways without the constraints of inheritance hierarchies
2. **Explicit Dependencies**: Dependencies are passed explicitly rather than inherited, making the code more maintainable
3. **Resource Safety**: Using patterns like `withEntity` ensures proper resource cleanup
4. **Simplified Testing**: Components with explicit dependencies are easier to test with mocks
5. **Reduced Circular Dependencies**: Composition patterns help avoid circular dependencies common in inheritance hierarchies
6. **Improved Separation of Concerns**: Each function has a single responsibility, following the Unix philosophy
7. **Standard Error Handling**: Consistent error codes across the system
8. **Decoupled Components**: Components communicate only through well-defined interfaces

## Best Practices

When working with the Unix architecture, follow these best practices:

1. **Use Type Imports for Interfaces**: 
   ```typescript
   import type { Entity, Capability } from './types';
   ```

2. **Regular Imports for Classes**: 
   ```typescript
   import { createCapability } from './CapabilityKit';
   ```

3. **Always Close File Descriptors**: Use try/finally blocks to ensure cleanup
4. **Use Consistent Path Structure**: Follow the `/dev/` and `/entity/` patterns
5. **Keep Capabilities Focused**: Each capability should do one thing well
6. **Use IOCTL for Complex Operations**: For operations that don't fit read/write
7. **Explicit Error Handling**: Always check return values from system calls
8. **Use `withEntity` Pattern**: For safe resource management
9. **Favor Composition over Inheritance**: Build systems through small, focused functions
10. **Access Database through GameRulesAPI**: Never access Supabase directly

## Error Handling

Use Unix-style error codes for consistent error handling:

```typescript
enum ErrorCode {
  SUCCESS = 0,    // No error
  EPERM = 1,      // Operation not permitted
  ENOENT = 2,     // No such file or directory
  EACCES = 13,    // Permission denied
  EINVAL = 22     // Invalid argument
  // etc.
}

// Example error handling
try {
  // Operation
} catch (err) {
  error(context, `Operation failed: ${err}`);
  return ErrorCode.EIO; // I/O error
}
```

## Conclusion

The Unix-style architecture implementation is now complete, providing a more modular, testable, and maintainable codebase. By following Unix principles and using composition over inheritance, we've created a system that is more flexible and easier to evolve over time.

This architecture aligns well with modern functional programming practices while honoring the time-tested Unix design philosophy that has proven its value over decades.