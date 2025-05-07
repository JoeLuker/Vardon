# Vardon - Pathfinder Character Management System

A Unix-inspired architecture for Pathfinder RPG character management.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Project Structure](#project-structure)
3. [Getting Started](#getting-started)
4. [Unix Architecture](#unix-architecture)
5. [Core Philosophy](#core-philosophy)
6. [Key Components](#key-components)
7. [Database Integration](#database-integration)
8. [Naming Conventions](#naming-conventions)
9. [MVP Requirements](#mvp-requirements)
10. [Best Practices](#best-practices)

## Project Overview

Vardon is a character management system for the Pathfinder tabletop RPG, built with a Unix-inspired architecture. It focuses on:

- **Unix-inspired Architecture**: Small, focused components that do one thing well
- **Composition over Inheritance**: Build systems through composition of small, focused functions
- **Everything is a File**: Resources are managed through a filesystem-like interface
- **Database Integration**: Supabase database for storing character data
- **YAML Data Management**: Tools for managing game data with preserved anchors/aliases

## Project Structure

```
/
   data/             # YAML data files
   scripts/          # Database and utility scripts
   src/              # Source code
      lib/
          components/   # UI components
          db/           # Database connectivity
          domain/       # Core game logic
             capabilities/  # Device drivers in filesystem
             kernel/        # Core Unix-like filesystem
             plugins/       # Process-like feature implementations
          ui/           # UI components for character sheet
   supabase/         # Supabase database migrations
   yaml-tools/       # YAML management utilities
```

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run the Development Server**:
   ```bash
   npm run dev
   ```

3. **Manage YAML Data**:
   ```bash
   # Split pathfinder_data.yaml into multiple files
   npm run yaml:split
   
   # Combine split files back into a single file
   npm run yaml:combine
   
   # Run the complete YAML pipeline
   npm run yaml:pipeline
   ```

## Unix Architecture

The Vardon Character Engine follows Unix architecture principles. This implementation replaces class-based inheritance with a more flexible composition-based approach.

### Core Unix Philosophy Principles Applied

1. **Everything is a File**: All game entities are treated as files in a filesystem
2. **Do One Thing Well**: Each component has a single, clear responsibility
3. **Small, Sharp Tools**: The system is composed of small, focused components
4. **Composition over Inheritance**: Build systems through composition rather than inheritance
5. **Explicit Resource Management**: Open, read, write, close pattern for all resources

### Core System Components

#### 1. GameKernel

The `GameKernel` implements a Unix-like filesystem where:

- `/dev/` contains device drivers (capabilities)
- `/entity/` contains game entities (characters, etc.)
- System calls (open, read, write, close) for accessing resources
- Reference counting through file descriptors

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

#### 2. CapabilityKit

The `CapabilityKit` provides utilities for implementing capabilities using composition:

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
    // Standard capability operations
    onMount(kernel: any): void { /* ... */ },
    read(fd: number, buffer: any): number { /* ... */ },
    write(fd: number, buffer: any): number { /* ... */ },
    ioctl(fd: number, request: number, arg: any): number { /* ... */ },
    async shutdown(): Promise<void> { /* ... */ }
  };
}
```

#### 3. withEntity Pattern

The `withEntity` pattern provides safe resource management for entity operations:

```typescript
export async function withEntity<T>(
  context: CapabilityContext, 
  entityId: string,
  operation: (entity: Entity, fd: number) => Promise<T>
): Promise<T | null> {
  const fd = kernel.open(`/entity/${entityId}`, OpenMode.READ_WRITE);
  if (fd < 0) return null;
  
  try {
    const [result, entity] = kernel.read(fd);
    if (result !== 0) return null;
    return await operation(entity as Entity, fd);
  } finally {
    kernel.close(fd); // Always close the file descriptor
  }
}
```

#### 4. Composed Capabilities

All capabilities use a composition pattern:

```typescript
export function createAbilityCapability(
  bonusCapability: BonusCapability,
  options: AbilityCapabilityOptions = {}
): AbilityCapability {
  // Create shared context
  const context = {
    id: 'ability',
    debug: options.debug || false,
    // ...other context properties
  };
  
  // Create base capability
  const capability = createCapability({/*...*/});
  
  // Add domain-specific methods
  return Object.assign(capability, {
    getAbilityScore: (entity, ability) => 
      getAbilityScore(context, entity, ability),
    // Additional domain methods...
  });
}
```

### System Architecture Diagram

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
│  (Ability, Bonus, Skill, Combat, Condition)  │  │ (Supabase/Postgres)│
└──────────────────────┬──────────────────────┘  └────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│                PLUGINS                       │
│  (Feats, Class Features, Spells, etc.)       │
└─────────────────────────────────────────────┘
```

## Core Philosophy

The Unix Philosophy for Pathfinder Character Engine emphasizes building simple, modular, and composable components that work together via well-defined interfaces:

> *Build small, focused components that do one thing well, compose them through clean interfaces, and maintain explicit dependencies between systems.*

### Key Principles

#### 1. Everything is a Capability

In Unix, "everything is a file" provides a universal interface. In our system, "everything is a capability" means all functionality is accessed through well-defined capability interfaces.

#### 2. Explicit Dependencies

Components declare their dependencies explicitly. No global state, no implicit dependencies, no service locators.

```typescript
// Good - Explicit dependency injection
class DamageResolver {
  constructor(
    private abilityCapability: AbilityCapability,
    private effectsCapability: EffectsCapability
  ) {}
}

// Bad - Implicit dependency
class DamageResolver {
  resolveAttack() {
    const ability = globalAbilityEngine.getModifier(...);
  }
}
```

#### 3. Separation of Mechanism from Policy

Separate the mechanisms (how things work) from policies (what should be done).

#### 4. Compose Simple Components

Complex behaviors emerge from combining simple, focused components.

#### 5. Data-Driven Where Possible, Code Where Necessary

Use data to configure behavior when possible. Use code for logic that data can't express.

## Key Components

### Kernel

The kernel is the core of the system, responsible for:

- Managing capabilities (device drivers)
- Executing plugins (processes)
- Tracking entities
- Providing an event system (signals)

### Capabilities

Capabilities are interfaces to system functionality, similar to Unix device drivers:

- They expose a specific set of functionality
- They hide implementation details
- They enforce access controls
- They represent the primary way plugins interact with the system

All capabilities follow a composition-based implementation pattern:

1. **BonusCapabilityComposed.ts**
2. **AbilityCapabilityComposed.ts**
3. **SkillCapabilityComposed.ts**
4. **CombatCapabilityComposed.ts**
5. **ConditionCapabilityComposed.ts**

### Plugins

Plugins are executable components that implement game features:

- Each plugin does one thing well
- Plugins declare their capability requirements
- Plugins operate on entities via capabilities, not directly
- Plugins can be composed to create complex behaviors

### Events

Events allow loose coupling between components:

- Components emit events when state changes
- Other components can subscribe to relevant events
- Similar to Unix signals

## Database Integration

The database integration follows Unix philosophy principles:

### Key Components

#### 1. Storage Drivers

The storage system uses the driver pattern to abstract storage mechanisms:

- `StorageDriver` interface - Common interface for all storage mechanisms
- `LocalStorageDriver` - Handles browser local storage
- `SupabaseStorageDriver` - Handles database storage via Supabase
- `DualStorageDriver` - Combines local and database storage for offline capability

#### 2. Feature Initialization

The feature initialization system loads features from the database:

- `DatabaseFeatureInitializer` - Loads and applies features from database records
- `CharacterAssembler` - Enhanced to use database features when available

#### 3. Database Schema Support

The implementation works with the existing database schema:

- Entity-based storage in `entity` table
- Character data in `game_character` and related tables
- Feature activation status in `active_feature` table

### Data Flow

```
Database -> GameRulesAPI -> CharacterAssembler -> Entity with Features -> UI Components
```

## Naming Conventions

The project uses a mapping between traditional Unix concepts and domain-specific game engine terminology.

### Core Concept Mapping

| Unix Concept | Game Engine Concept | Description |
|--------------|---------------------|-------------|
| Kernel | `GameEngine` | Central system that manages resources |
| Device | `Subsystem` | Controlled interface to functionality |
| Process | `Feature` | Executable component with specific functionality |
| File | `Entity` | Primary data structure for game objects |
| Signal | `GameEvent` | System-wide notification |
| Pipe | `DataFlow` | Connection between components |
| Mount | `Register` | Connecting a subsystem to the engine |

### Operation/Method Mapping

| Unix Operation | Game Engine Method | Purpose |
|----------------|-------------------|---------|
| `exec` | `activate` | Execute a feature |
| `kill` | `deactivate` | Stop a feature |
| `mount` | `registerSubsystem` | Register a subsystem |
| `umount` | `unregisterSubsystem` | Unregister a subsystem |
| `read` | `getValue` | Get a value from a subsystem |
| `write` | `setValue` | Set a value in a subsystem |

## MVP Requirements

### Character Stats & Calculations

- **Ability Scores**: Calculate total scores with all bonuses
- **Saving Throws**: Base save + ability modifier + bonuses
- **Armor Class**: Calculate normal AC, touch AC, and flat-footed AC
- **Attack Bonuses**: Melee, ranged, and iterative attacks
- **Combat Maneuvers**: CMB and CMD calculations
- **Initiative**: Dexterity-based with additional bonuses
- **Size Modifiers**: Support for size changes and their effects

### Skills System

- **Skill Calculations**: Base ranks + ability mod + class skill bonus + other bonuses
- **Skill Points Management**: Track available and spent skill points per level
- **Class Skills**: Check if skills are class skills for bonus purposes
- **Skill Rank Allocation**: Support adding/removing ranks at specific levels

### Spellcasting

- **Spell Slots**: Calculate available spell slots per level with bonus slots
- **Spellcasting Class Features**: Track different spellcasting types
- **Ability Score Requirements**: Enforce minimum ability scores for spell levels

### Bonus System

- **Bonus Stacking Rules**: Implement Pathfinder rules for stacking/non-stacking bonuses
- **Bonus Sources**: Track the source of each bonus for display and calculation
- **Typed vs. Untyped Bonuses**: Handle different bonus types

### Character Features

- **Class Features**: Apply effects from class features
- **Feats**: Apply effects from feats
- **Traits**: Apply effects from character traits
- **Ancestry Traits**: Apply racial/ancestry bonuses to appropriate stats
- **Corruption System**: Support for vampire corruption and manifestations
- **Equipment**: Apply armor, weapon, and other equipment bonuses

## Best Practices

When working with the Unix architecture, follow these best practices:

### TypeScript Import Practices

```typescript
// Use import type for interfaces
import type { Entity, Capability } from './types';

// Regular imports for classes and functions
import { createCapability } from './CapabilityKit';
```

### Resource Management

```typescript
// Always use try/finally for resource cleanup
const fd = kernel.open(path, OpenMode.READ);
try {
  // Use the resource
  const [result, data] = kernel.read(fd);
  // Process data
} finally {
  // Always clean up
  kernel.close(fd);
}
```

### Error Handling

Use Unix-style error codes for consistent error handling:

```typescript
// Standard error pattern
try {
  // Operation
} catch (err) {
  error(context, `Operation failed: ${err}`);
  return ErrorCode.EIO; // I/O error
}
```

### Path Structure

Follow consistent path structures:
- `/dev/{capability}` for capabilities
- `/entity/{id}` for entities
- `/entity/{id}/{resource}/{resourceId}` for entity resources

### Database Access

Always use the GameRulesAPI for database access, never access Supabase directly:

```typescript
// Correct
const characterData = await gameRulesAPI.getCompleteCharacterData(characterId);

// Incorrect - direct database access
const { data } = await supabase.from('game_character').select('*');
```

### Composition Over Inheritance

Build systems using composition of small, focused functions instead of inheritance hierarchies:

```typescript
// Good - Composition
function createFeature(dependencies) {
  return {
    activate: (entity) => activateFeature(dependencies, entity),
    deactivate: (entity) => deactivateFeature(dependencies, entity)
  };
}

// Bad - Inheritance
class Feature extends BaseFeature {
  constructor(dependencies) {
    super();
    this.dependencies = dependencies;
  }
  
  activate(entity) {
    // Implementation
  }
}
```

### Common Utility Patterns

The architecture provides several high-level utility patterns to promote DRY principles:

#### Entity Operation Pattern

Use `performEntityOperation` for consistent entity file operations:

```typescript
// Common pattern for entity operations that avoids duplication
function doSomethingWithEntity(context, entityPath, params) {
  return performEntityOperation(context, entityPath, (entity) => {
    // Your operation logic here
    entity.properties.someProp = params.value;
  });
}
```

#### Modifier Calculator Pattern

Use `calculateModifiedValue` for consistent bonus calculations:

```typescript
// Calculate a value with proper bonus stacking rules
function calculateAttackBonus(entity) {
  const baseAttack = entity.properties.baseAttackBonus;
  const modifiers = getAllAttackModifiers(entity);
  
  const result = calculateModifiedValue(baseAttack, modifiers);
  return result.total;
}
```

#### IOCTL Handler Pattern

Use `createIoctlHandler` to standardize IOCTL operations:

```typescript
// Define operation handlers with a consistent pattern
const operationHandlers = {
  initialize: (context, entityPath, args) => {
    return handleInitializeOperation(context, entityPath, entity => {
      initializeEntity(context, entity);
    });
  },
  setValue: (context, entityPath, args) => {
    return performEntityOperation(context, entityPath, entity => {
      entity.properties[args.key] = args.value;
    });
  }
};

// Create a standardized IOCTL handler
const ioctlHandler = createIoctlHandler(context, operationHandlers);
```

## Conclusion

The Unix-style architecture implementation provides a more modular, testable, and maintainable codebase. By following Unix principles and using composition over inheritance, we've created a system that is more flexible and easier to evolve over time.

The addition of utility patterns like `performEntityOperation`, `calculateModifiedValue`, and `createIoctlHandler` further enhances the DRY principles in the codebase by extracting common patterns into reusable utilities.

This architecture aligns well with modern functional programming practices while honoring the time-tested Unix design philosophy that has proven its value over decades.