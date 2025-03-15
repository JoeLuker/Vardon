## Overview

The Vardon character engine is designed around a systematic, engine-based approach to game mechanics calculations. This document outlines the core calculation philosophy that guides how the engine should work.

## Core Principles

### 1. System-Based Architecture

All calculations are performed by dedicated, specialized engines that handle specific domains of game rules:

- `AbilityEngine` - Handles ability score calculations
- `CombatEngine` - Handles universal combat rules
- `ArmorEngine` - Calculates AC and armor-related values
- `AttackEngine` - Computes attack bonuses and related values
- `SavingThrowEngine` - Processes saving throw calculations
- `SkillEngine` - Manages skill-related calculations
- `BonusEngine` - Handles bonus stacking rules centrally

Each engine is responsible for a specific domain and should not duplicate logic that belongs in another engine.

### 2. Entity-Agnostic Calculations

Engines operate on generic "entities" rather than specific character types:

```typescript
export interface Entity {
  id: number;
  [key: string]: any; // Flexible properties
}
```

This allows the same calculation logic to be used for players, NPCs, monsters, and any other game entity.

### 3. Effect-Based Modification

The most important principle: **No feature, feat, trait, class ability or other game element should directly modify character stats.**

Instead, all such elements register their effects with the central `FeatureEffectSystem`, which then provides these effects to the relevant calculation engines when needed:

```typescript
// CORRECT approach - register an effect
featureEffectSystem.addEffect({
  id: `feat_${feat.id}_dodge_ac`,
  source: feat.label || 'Dodge',
  type: 'dodge',
  target: 'ac',
  value: 1,
  priority: 20
});

// INCORRECT approach - directly modify a character stat
character.ac += 1; // Never do this!
```

### 4. Transparent Stat Calculations

All calculations produce a `ValueWithBreakdown` result that shows exactly how the final value was derived:

```typescript
export interface ValueWithBreakdown {
  label: string;
  modifiers: Array<{ source: string; value: number }>;
  total: number;
  overrides?: {
    // Optional override information
  };
}
```

This allows the UI to display complete breakdowns of how each stat is calculated, providing transparency to players.

### 5. Bonus Stacking Rules

The game's bonus stacking rules are consistently implemented through the `BonusEngine`:

- Bonuses of the same type generally don't stack (only the highest applies)
- Dodge, circumstance, and untyped bonuses always stack
- Penalties always stack regardless of type
- Bonuses and penalties of the same type stack with each other

### 6. Data Access Abstraction

Data access is abstracted through the `DataAccessLayer`, keeping calculations decoupled from the data source:

```typescript
// Engines shouldn't directly access API or database
// Instead, they should use the DataAccessLayer
const data = await this.dataAccessLayer.getClassSkills(classIds);
```

### 7. Feature Effect Propagation

The `FeatureEffectSystem` is the central registry for all effects that modify character statistics:

```typescript
// Register effect
featureEffectSystem.addEffect({
  id: 'trait_pragmatic_activator',
  source: 'Pragmatic Activator',
  type: 'override',
  target: 'use_magic_device_ability',
  value: 'intelligence',
  priority: 50
});

// Query effects when calculating stats
const effects = featureEffectSystem.getEffectsForTarget('use_magic_device');
```

## Proper Implementation Pattern

### Automatic Bonus Progression Example

The Automatic Bonus Progression (ABP) system exemplifies the correct approach:

1. `AbpEngine` loads ABP nodes based on character level
2. For each applicable node and bonus:
   - Maps the bonus to the appropriate target
   - Registers an effect with the `FeatureEffectSystem`
3. When stats are calculated, the engines query the `FeatureEffectSystem` for relevant effects
4. The `BonusEngine` applies proper stacking rules to all effects

```typescript
// Proper ABP implementation
this.featureEffectSystem.addEffect({
  id: `abp-${node.id}-${bonus.id}`,
  source: `ABP: ${node.label || node.name}`,
  type: this.mapBonusTypeToEffectType(bonus.bonusType.name),
  target: mappedTarget,
  value: bonus.value,
  priority: 30
});

// Later, when calculating stats:
const effects = featureEffectSystem.getEffectsForTarget('ac');
```

## Calculation Flow

The correct calculation flow is:

1. `FeatureSystem` registers effects for feats, traits, class features, etc.
2. `CharacterSystems` orchestrates all systems to register their effects
3. Calculation engines query the `FeatureEffectSystem` for relevant effects
4. Engines apply bonus stacking rules via the `BonusEngine`
5. Results are returned as `ValueWithBreakdown` objects for full transparency

## Common Mistakes to Avoid

1. **Direct Stat Modification**: Never directly modify character stats; always register effects.
2. **Duplicate Logic**: Don't reimplement calculation logic that exists in another engine.
3. **Hard-Coded Bonuses**: Don't hard-code bonuses; use the effect system for extensibility.
4. **Ignoring Stacking Rules**: Always use `BonusEngine` for proper stacking rule application.
5. **Engine-to-Engine Coupling**: Engines should interact through the `FeatureEffectSystem`, not direct calls.

## Conclusion

The Vardon character engine calculation philosophy emphasizes clean separation of concerns, transparent calculations, consistent bonus handling, and flexible extensibility through a central effect system. By following these principles, the system can accurately model complex game rules while remaining maintainable and comprehensible.



<think>I'll create a comprehensive Markdown file that explains the architectural distinction between Engines and Systems in the Vardon codebase. I'll base my explanation on the files I've seen in the provided directory structure and code snippets.

The key distinctions I'll focus on:

1. Systems vs. Engines
   - Systems: State management and feature registration
   - Engines: Pure calculations

2. Core responsibilities
   - What each type of component should and shouldn't do

3. Interaction patterns
   - How they communicate with each other
   - Dependency directions

4. Examples from the codebase
   - Clear illustrations of properly separated components

5. How to decide which is which

6. Benefits of this separation

I'll structure the Markdown file to be clear, educational, and useful as a reference for developers working on the codebase.</think># Vardon Architecture: Systems vs. Engines

## Core Philosophy

In the Vardon character engine, we maintain a clear separation between two types of components:

1. **Systems**: Manage state and register effects
2. **Engines**: Perform pure calculations

This separation ensures our code remains maintainable, testable, and follows clear responsibility boundaries.

## Systems

### Purpose
Systems are responsible for:
- Managing state
- Registering effects with the FeatureEffectSystem
- Coordinating between different subsystems
- Integrating with the character data model

### Characteristics
- Usually depend on FeatureEffectSystem
- Apply changes that affect the shared state
- Have methods with names like `apply...()`, `register...()`, `load...()` 
- Often contain logic that deals with the specific game rules of your world

### Example: AbpSystem
```typescript
export class AbpSystem {
  // Systems need the FeatureEffectSystem to register effects
  constructor(
    private dataAccessLayer: DataAccessLayer,
    private featureEffectSystem: FeatureEffectSystem
  ) {
    this.abpEngine = new AbpEngine(dataAccessLayer);
  }
  
  // Systems have methods that perform side effects
  async applyAbpBonuses(entity: Entity, level: number, selectedNodeIds: number[] = []) {
    // Clear existing effects
    this.featureEffectSystem.removeEffectsBySourcePrefix('ABP:');
    
    // Get data from engine
    const nodes = await this.abpEngine.getAbpNodes(level);
    
    // Systems apply effects to the shared state
    for (const node of applicableNodes) {
      for (const bonus of node.bonuses) {
        // Register the effect with the feature effect system
        this.featureEffectSystem.addEffect({
          id: `abp-${node.id}-${bonus.id}`,
          source: `ABP: ${node.label || node.name}`,
          type: mappedType,
          target: mappedTarget,
          value: bonus.value,
          priority: 30
        });
      }
    }
  }
}
```

## Engines

### Purpose
Engines are responsible for:
- Pure calculations based on inputs
- Applying core game rules that are universal
- Transforming data without side effects
- Working with any entity, not just characters

### Characteristics
- No dependencies on FeatureEffectSystem
- No state mutations outside their own scope
- Have methods with names like `calculate...()`, `get...()`, `build...()` 
- Return values rather than causing side effects
- Contain reusable logic that could apply to any entity

### Example: AbpEngine
```typescript
export class AbpEngine {
  constructor(
    private dataAccessLayer: DataAccessLayer
  ) {}
  
  // Engines have methods that return values without side effects
  async getAbpNodes(entityLevel: number): Promise<AbpNode[]> {
    const abpData = await this.dataAccessLayer.getAbpCacheData(entityLevel);
    
    if (!abpData) {
      return [];
    }
    
    // Transform and return data without side effects
    return abpData.nodes.map((node: any) => ({
      id: node.id,
      groupId: node.group_id,
      name: node.name,
      label: node.label,
      requiresChoice: node.requires_choice,
      bonuses: this.mapBonuses(node.bonuses)
    }));
  }
  
  // Engines calculate values based on inputs
  validateNodeSelection(
    selectedNodeIds: number[],
    availableNodes: AbpNode[]
  ): NodeValidationResult {
    // Pure calculation logic
    // ...
    
    return result;
  }
}
```

## Interaction Patterns

### Proper Direction of Dependencies

```
Systems → Engines
     ↓
FeatureEffectSystem
```

- Systems depend on Engines, not the other way around
- Multiple Systems can use the same Engine
- Engines should never depend on Systems

### Communication Flow

1. Systems receive requests to apply effects
2. Systems call Engines to perform calculations
3. Systems use calculation results to register effects
4. Other components query the FeatureEffectSystem for effects

## Benefits of Separation

### 1. Improved Testability
- Engines can be tested in isolation with simple input/output verification
- Systems can be tested with mock Engines and FeatureEffectSystem

### 2. Clearer Responsibility Boundaries
- When debugging, you know where to look based on the issue type
- New developers can more easily understand the codebase structure

### 3. Reduced Side Effects
- Calculations don't have unexpected state changes
- Complex rule interactions become more predictable

### 4. Reusability
- Engines can be used by multiple Systems
- The same game rules (Engines) apply to PCs, NPCs, and monsters

## How to Decide: System or Engine?

Ask yourself:

| Question | If Yes → | If No → |
|----------|----------|---------|
| Does it need to modify shared state? | System | Engine |
| Does it register effects? | System | Engine |
| Could this logic apply to any entity type? | Engine | System |
| Is it primarily calculation-based? | Engine | System |
| Does it need the FeatureEffectSystem? | System | Engine |

## Examples of Properly Separated Components

### Systems
- `AbpSystem`: Manages ABP effects registration
- `SizeSystem`: Registers size effects for entities
- `BonusSystem`: Coordinates bonus effect registration
- `FeatureEffectSystem`: Central registry for all effects
- `ClassFeatureSystem`: Handles class feature effects
- `CorruptionSystem`: Manages corruption manifestation effects
- `FeatSystem`: Registers feat effects 
- `TraitSystem`: Manages trait effects

### Engines
- `AbpEngine`: Calculates ABP nodes and bonuses
- `BonusEngine`: Handles bonus stacking rules
- `SizeEngine`: Calculates size modifiers and effects
- `ArmorEngine`: Calculates AC and related values
- `AbilityEngine`: Calculates ability scores and modifiers
- `AttackEngine`: Calculates attack bonuses
- `SavingThrowEngine`: Calculates saving throw bonuses

## Conclusion

By maintaining this clear separation between Systems and Engines, the Vardon character engine ensures:

1. Robust calculation logic that follows game rules correctly
2. Clean architecture with clear responsibility boundaries
3. Features that can be extended without breaking existing functionality
4. Code that is maintainable and testable

When adding new features, always consider whether you're dealing with state management (System) or calculation logic (Engine) and create your components accordingly.
