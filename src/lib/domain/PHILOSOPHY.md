# PHILOSOPHY.md

# The Unix Philosophy for Pathfinder Character Engine

## Core Philosophy

This character engine is designed following Unix philosophy principles, adapted for a Pathfinder rules system. The Unix philosophy emphasizes building simple, modular, and composable components that work together via well-defined interfaces. In our system, this translates to:

> *Build small, focused components that do one thing well, compose them through clean interfaces, and maintain explicit dependencies between systems.*

## Key Principles

### 1. Everything is a Capability

In Unix, "everything is a file" provides a universal interface. In our system, "everything is a capability" means all functionality is accessed through well-defined capability interfaces. Plugins never access engines directly; they request capabilities.

### 2. Explicit Dependencies

Components declare their dependencies explicitly. No global state, no implicit dependencies, no service locators. Dependencies are injected at construction time, making the system testable and understandable.

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

### 3. Separation of Mechanism from Policy

Separate the mechanisms (how things work) from policies (what should be done). Engines provide low-level mechanisms, capabilities provide policy-level interfaces, plugins implement specific features.

### 4. Compose Simple Components

Complex behaviors emerge from combining simple, focused components. A character's complex traits are built from small plugins working together, not monolithic character classes.

### 5. Data-Driven Where Possible, Code Where Necessary

Use data to configure behavior when possible. Use code for logic that data can't express. This enables non-programmers to contribute content without changing code.

## Directory Structure

Our Unix-inspired structure organizes components by their role in the system:

```
/src/lib/domain/
├── kernel/     # Core system components (GameKernel, EventBus)
├── dev/        # Capability interfaces (AbilityCapability, SkillCapability)
├── bin/        # Executable plugins (SkillFocusPlugin, PowerAttackPlugin)
├── lib/        # Implementation libraries (capability implementations)
├── etc/        # Configuration files
├── proc/       # Runtime process state
├── var/        # Variable data (logs, state)
├── usr/        # User extensions
└── types/      # Type definitions
```

## System Components

### Kernel

The kernel is the core of the system, responsible for:
- Managing capabilities (device drivers)
- Executing plugins (processes)
- Tracking entities
- Providing an event system (signals)

### Capabilities

Capabilities are interfaces to system functionality, similar to Unix device drivers:
- They expose a specific set of functionality (e.g., skill manipulation)
- They hide implementation details
- They enforce access controls
- They represent the primary way plugins interact with the system

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

## Implementation Guidelines

### Writing a Capability

A capability should:
- Define a clear interface for a specific domain
- Accept dependencies explicitly in its implementation
- Provide controlled access to underlying functionality
- Be stateless when possible

### Writing a Plugin

A plugin should:
- Have a single, clear responsibility
- Declare required capabilities explicitly
- Operate through capability interfaces, never directly on engines
- Be composable with other plugins

### Extending the System

To extend the system:
1. **New rule or feature?** Write a plugin
2. **New type of functionality?** Create a capability
3. **Core system change?** Modify kernel components

## Examples

### Example: A Feat Implementation

```typescript
// A feat implemented as a plugin
const PowerAttackPlugin = {
  id: 'feat.power_attack',
  name: 'Power Attack',
  requiredCapabilities: ['combat', 'damage'],
  
  execute(entity, options, capabilities) {
    const { combat, damage } = capabilities;
    const attackPenalty = options.penalty || 1;
    const damageBonus = attackPenalty * 2;
    
    // Apply the attack penalty
    combat.applyAttackModifier(entity, {
      source: 'Power Attack',
      value: -attackPenalty
    });
    
    // Apply the damage bonus
    damage.applyDamageModifier(entity, {
      source: 'Power Attack',
      value: damageBonus
    });
    
    return { attackPenalty, damageBonus };
  }
};
```

### Example: Plugin Interaction

Plugins can work together through capabilities and events:

```typescript
// Rage plugin emits an event when activated
kernel.events.emit('character:rage:start', { entityId: character.id });

// Power Attack plugin listens for rage and adjusts its behavior
kernel.events.on('character:rage:start', (data) => {
  const entity = kernel.getEntity(data.entityId);
  if (entity && hasPowerAttack(entity)) {
    // Increase Power Attack damage during rage
    const damage = kernel.getCapability('damage');
    damage.applyDamageModifier(entity, {
      source: 'Power Attack (Rage)',
      value: 1,
      type: 'bonus'
    });
  }
});
```

## Technical Debt Management

The system architecture helps manage technical debt by:

1. **Isolation**: Issues in one plugin don't affect others
2. **Explicit Dependencies**: No hidden relationships to break
3. **Testing**: Each component can be tested in isolation
4. **Incremental Improvement**: Components can be replaced individually

## When to Break the Rules

While these principles guide the system, there are times to deviate:

1. **Performance Bottlenecks**: May require bypassing some abstractions
2. **User Experience**: UI may need direct access to avoid latency
3. **Core Mechanics**: Some game rules are inherently complex and may require special handling

Document these exceptions clearly when they occur.

## Conclusion

This Unix-inspired architecture provides a robust foundation for a complex game system. By focusing on modularity, explicit dependencies, and well-defined interfaces, we create a system that can grow without becoming unwieldy, adapt to new rules without breaking existing ones, and maintain consistency even as it expands.

Remember: **Do One Thing Well** is the guiding principle for every component in this system.
