# Unix Architecture Implementation in Vardon

This document explains how the Unix philosophy has been applied to the Vardon game engine architecture.

## Core Unix Principles Implemented

1. **Small, focused components that do one thing well**
   - Each capability provider focuses on a single domain (ability scores, skills, bonuses)
   - Plugins implement specific game features with clearly defined boundaries
   - Clear separation between core system (kernel) and plugins

2. **Explicit dependencies between components**
   - Capabilities explicitly declare their dependencies on other capabilities
   - Plugins declare which capabilities they require
   - No hidden dependencies or global state

3. **Standard interfaces for interoperability**
   - Well-defined interfaces for capabilities and plugins
   - Consistent patterns for entity manipulation
   - Standardized event system for loose coupling

4. **Composition over inheritance**
   - Components are composed together at runtime
   - Capabilities are injected where needed
   - Plugins use capabilities rather than inheriting behavior

## Architecture Overview

### Kernel Layer

The kernel is the core of the system, responsible for:
- Managing entity lifecycle
- Registering and accessing capabilities
- Loading and executing plugins
- Handling events

Key files:
- `kernel/types.ts` - Core type definitions
- `kernel/GameKernel.ts` - Main kernel implementation
- `kernel/EventBus.ts` - Event system implementation

### Capability Layer

Capabilities are the primary way to interact with the system, providing:
- Well-defined interfaces for specific domains (abilities, skills, etc.)
- Implementation hiding (clients use interfaces, not implementations)
- Reusable building blocks for plugins

Key files:
- `capabilities/types.ts` - Base capability types
- `capabilities/{domain}/types.ts` - Domain-specific interfaces
- `capabilities/{domain}/{Capability}Provider.ts` - Implementations

Example capabilities:
- `AbilityCapability` - Handles ability scores and modifiers
- `BonusCapability` - Manages bonuses with stacking rules
- `SkillCapability` - Provides skill management, using ability and bonus capabilities

### Plugin Layer

Plugins implement game features by composing capabilities:
- Each plugin focuses on a specific feature (e.g., a feat, class feature, or spell)
- Plugins declare their required capabilities
- Plugins provide standardized apply/remove methods

Key files:
- `plugins/types.ts` - Plugin interface definitions
- `plugins/BasePlugin.ts` - Common plugin functionality
- `plugins/PluginManager.ts` - Plugin registration and execution
- `plugins/feats/*.ts` - Feat implementations

Example plugins:
- `SkillFocusPlugin` - Implements the Skill Focus feat
- Any migrated features from the old system

### Migration Utilities

To facilitate migrating from the old system:
- `plugins/migration/FeatureToPluginMigrator.ts` - Converts old features to new plugins

## Benefits of this Architecture

1. **Modularity**: Components can be developed, tested, and maintained independently.
2. **Testability**: Clear interfaces make mocking dependencies easy.
3. **Extensibility**: New capabilities and plugins can be added without modifying existing code.
4. **Maintainability**: Small, focused components are easier to understand and maintain.
5. **Robustness**: Explicit dependencies and clean interfaces reduce unexpected interactions.

## How to Use This Architecture

### Creating a New Capability

1. Define the capability interface in `capabilities/{domain}/types.ts`
2. Implement the capability in `capabilities/{domain}/{Capability}Provider.ts`
3. Export the interface and implementation in `capabilities/{domain}/index.ts`
4. Update `capabilities/index.ts` to export the new capability

### Creating a New Plugin

1. Create a new plugin class in `plugins/{category}/{PluginName}.ts`
2. Extend `BasePlugin` or a domain-specific base class
3. Implement the `apply` method to use capabilities to implement the feature
4. Export the plugin in `plugins/{category}/index.ts`
5. Update `plugins/index.ts` to export the new plugin category if needed

### Using Capabilities in Plugins

```typescript
export class MyPlugin extends BasePlugin {
  public readonly id = 'my-plugin';
  public readonly requiredCapabilities = ['ability', 'skill'];
  
  apply(
    entity: Entity,
    options: Record<string, any>,
    capabilities: Record<string, Capability>
  ): any {
    // Get required capabilities
    const abilityCapability = capabilities.ability as AbilityCapability;
    const skillCapability = capabilities.skill as SkillCapability;
    
    // Use capabilities to implement the feature
    const strengthMod = abilityCapability.getAbilityModifier(entity, 'strength');
    skillCapability.applySkillBonus(entity, 1, strengthMod, 'untyped', this.id);
    
    return { success: true };
  }
}
```

## Running the Tests

To see this architecture in action, run the test files:
- `tests/CapabilityTests.ts` - Demonstrates capability composition
- `tests/PluginTests.ts` - Shows how plugins use capabilities
- `tests/MigrationTests.ts` - Illustrates migrating old features to new plugins

## Migration Path

To migrate the existing codebase to this architecture:
1. Identify which components should become capabilities vs. plugins
2. Create capability interfaces and implementations
3. Convert features to plugins using the `FeatureToPluginMigrator`
4. Update UI components to use the new architecture through the GameKernel

This architecture provides a solid foundation for building a robust, maintainable game engine that follows Unix philosophy principles.