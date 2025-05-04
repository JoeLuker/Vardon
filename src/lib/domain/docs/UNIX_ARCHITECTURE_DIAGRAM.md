# Unix Architecture Diagram

The Vardon engine has been refactored to follow Unix philosophy principles, with a clean separation of concerns and explicit dependencies.

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

## Key Architectural Components

### 1. GameKernel

The kernel is the core of the system, providing entity management and capability registration. It follows the Unix philosophy of providing a minimal, focused core.

### 2. Capabilities

Capabilities are small, focused components that provide specific functionality. They follow the Unix philosophy of "do one thing well" and have explicit dependencies.

Key capabilities:
- **BonusCapability**: Manages bonuses and stacking rules
- **AbilityCapability**: Handles ability scores and modifiers (depends on BonusCapability)
- **SkillCapability**: Provides skill functionality (depends on AbilityCapability and BonusCapability)

### 3. Plugins

Plugins implement game features by composing capabilities. They follow the Unix philosophy of composition over inheritance.

Example plugins:
- **SkillFocusPlugin**: Implements the Skill Focus feat
- **PowerAttackPlugin**: Implements the Power Attack feat
- Legacy features migrated to plugins via the FeatureToPluginMigrator

### 4. UnixGameAPI

The UnixGameAPI provides a unified interface to the Unix architecture. It adapts the database API for integration with the kernel, capabilities, and plugins.

### 5. Entity Model

The Entity model is a simple, data-oriented representation of game characters. It follows the Unix philosophy of using simple, composable data structures.

## Data Flow

1. UI components interact with the UnixGameAPI
2. UnixGameAPI delegates to PluginManager and capabilities
3. Plugins use capabilities to implement game features
4. Changes to entities are stored in-memory and synchronized with the database

## Communication Patterns

- Clear, explicit dependencies between components
- Standard interfaces for interoperability
- Event-based communication for loose coupling

This architecture provides a solid foundation for building a robust, maintainable game engine following Unix philosophy principles.