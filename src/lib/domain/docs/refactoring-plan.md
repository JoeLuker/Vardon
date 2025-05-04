# Unix Architecture Refactoring Plan

This document outlines the plan for refactoring the Vardon codebase to rigorously adhere to Unix philosophy principles.

## Current Problems

1. **Monolithic Initialization**: `application.ts` does too much at once - initializing subsystems, loading features, creating sample characters, etc.
2. **Hidden Dependencies**: Components access each other directly instead of through well-defined interfaces
3. **Tight Coupling**: Components are tightly coupled, causing cascading failures
4. **Feature Resolution Complexity**: Feature loading system has multiple, complex fallback mechanisms
5. **Complex Components**: Many components like `CharacterAssembler` try to do too much
6. **Lack of Standard Interfaces**: No consistent interface pattern between components

## Refactoring Approach

We'll refactor the system in these stages:

### 1. Kernel Refactoring

- Transform `GameEngine` from a complex engine to a simple kernel that:
  - Manages capabilities (currently called subsystems)
  - Loads and executes plugins (currently called features)
  - Provides an event bus
  - Manages entities
  
- Key changes:
  - Remove direct feature application logic
  - Implement capability registration/lookup
  - Simplify entity registration
  - Make all dependencies explicit

### 2. Capability System

- Create a proper capability system that:
  - Defines clear interfaces for functionality domains
  - Separates interface from implementation
  - Handles all access controls and permissions
  
- Transform existing subsystems into capabilities:
  - `AbilityCapability`
  - `SkillCapability`
  - `CombatCapability`
  - etc.

### 3. Plugin System

- Create a plugin system that:
  - Loads plugins (features) by standardized path
  - Validates plugin requirements
  - Provides required capabilities to plugins
  - Handles plugin lifecycle
  
- Refactor features to be proper plugins:
  - Explicit capability requirements
  - No direct access to engine
  - Simple, focused behavior
  - Composition-friendly design

### 4. Assemblers and Tools

- Break down complex components like `CharacterAssembler` into:
  - Small, focused tools that do one thing well
  - Composable processing pipeline
  - Clear data flow between tools
  
- Create a proper assembly pipeline:
  - Input stage: raw character data
  - Processing stages: apply effects, calculate values, etc.
  - Output stage: complete character model

### 5. Error Handling

- Implement proper error boundaries:
  - Each component handles its own errors
  - Clear error propagation paths
  - Isolation of failure domains
  
- Enhance logging:
  - Structured logs with clear contexts
  - Proper error categorization
  - Diagnostic information

## Implementation Steps

1. Create new kernel module
2. Define capability interfaces
3. Implement capability providers
4. Refactor plugin system
5. Implement standard assemblers
6. Update application initialization
7. Fix UI integration

## Directory Structure (Target)

```
/src/lib/domain/
├── kernel/          # Core system (GameKernel, EventBus)
├── capabilities/    # Capability interfaces and implementations
│   ├── ability/
│   ├── skill/
│   ├── combat/
│   └── ...
├── plugins/         # Feature plugins
│   ├── feats/
│   ├── classes/
│   └── ...
├── assemblers/      # Tools for composing entities
├── utils/           # Utility functions
└── types/           # Type definitions
```

## Migration Strategy

We'll implement this refactoring incrementally:

1. Create the new architecture alongside the old one
2. Migrate components one by one
3. Update dependencies to use new components
4. Remove old components when no longer referenced

This approach allows us to maintain a working system throughout the refactoring process.