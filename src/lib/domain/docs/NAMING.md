# UNIX_MAPPING.md

# Unix to Game Engine Concept Mapping

This document provides a mapping between traditional Unix concepts and our domain-specific game engine terminology. This allows us to maintain the conceptual link to Unix philosophy while using more appropriate naming for our character engine.

## Directory Structure Mapping

| Unix Directory | Game Engine Directory | Purpose |
|----------------|------------------------|---------|
| `/kernel` | `/core` | Core system functionality |
| `/dev` | `/subsystems` | Interfaces to system functionality |
| `/bin` | `/features` | Executable components/plugins |
| `/lib` | `/shared` | Shared implementation libraries |
| `/etc` | `/config` | Configuration files |
| `/proc` | `/state/active` | Runtime state information |
| `/var` | `/state/data` | Variable data storage |
| `/usr` | `/extensions` | User extensions |
| `/sys` | `/introspection` | System information and control |

## Core Concept Mapping

| Unix Concept | Game Engine Concept | Description |
|--------------|---------------------|-------------|
| Kernel | `GameEngine` | Central system that manages resources |
| Device | `Subsystem` | Controlled interface to functionality |
| Process | `Feature` | Executable component with specific functionality |
| File | `Entity` | Primary data structure for game objects |
| Signal | `GameEvent` | System-wide notification |
| Pipe | `DataFlow` | Connection between components |
| Mount | `Register` | Connecting a subsystem to the engine |
| Shell | `CommandLayer` | Interface for user interaction |
| Daemon | `BackgroundProcess` | Long-running process |
| User | `Player` | Entity with access privileges |

## Operation/Method Mapping

| Unix Operation | Game Engine Method | Purpose |
|----------------|-------------------|---------|
| `exec` | `activate` | Execute a feature |
| `kill` | `deactivate` | Stop a feature |
| `mount` | `registerSubsystem` | Register a subsystem |
| `umount` | `unregisterSubsystem` | Unregister a subsystem |
| `read` | `getValue` | Get a value from a subsystem |
| `write` | `setValue` | Set a value in a subsystem |
| `ls` | `list` | List available resources |
| `chmod` | `setPermissions` | Change access permissions |
| `ps` | `getActiveFeatures` | List active features |
| `cp` | `copy` | Copy entity data |
| `rm` | `remove` | Remove an entity |
| `touch` | `create` | Create a new entity |
| `mkdir` | `createGroup` | Create a group |
| `find` | `query` | Search for entities |
| `grep` | `filter` | Filter results |

## Data Structure Mapping

| Unix Structure | Game Engine Structure | Purpose |
|----------------|---------------------|---------|
| File descriptor | `SubsystemRef` | Reference to a subsystem |
| inode | `EntityId` | Unique entity identifier |
| Process ID | `FeatureId` | Unique feature identifier |
| File path | `EntityPath` | Path to an entity |
| File permission | `AccessControl` | Access control settings |
| Environment variable | `Config` | Configuration setting |
| File content | `EntityData` | Entity data content |

## Signal/Event Mapping

| Unix Signal | Game Engine Event | Purpose |
|-------------|------------------|---------|
| `SIGTERM` | `feature:terminate` | Request to terminate feature |
| `SIGKILL` | `feature:kill` | Force terminate feature |
| `SIGHUP` | `connection:reset` | Connection reset |
| `SIGINT` | `feature:interrupt` | Interrupt feature |
| `SIGUSR1` | `custom:signal1` | Custom signal 1 |
| `SIGUSR2` | `custom:signal2` | Custom signal 2 |
| `SIGCHLD` | `feature:child:complete` | Child feature completed |

## Class/Interface Naming Mapping

| Unix Pattern | Game Engine Pattern | Example |
|--------------|---------------------|---------|
| `*_dev` | `*Subsystem` | `AbilitySubsystem` |
| `*_bin` | `*Feature` | `PowerAttackFeature` |
| `*_daemon` | `*Service` | `CombatService` |
| `*_fs` | `*Store` | `CharacterStore` |
| `*_ctl` | `*Controller` | `GameController` |

## Example Code with Mapping

```typescript
// UNIX: Kernel loads a device driver
// ENGINE: GameEngine registers a subsystem
gameEngine.registerSubsystem('ability', new AbilitySubsystemImpl());

// UNIX: Process execution with file descriptors
// ENGINE: Feature activation with subsystem access
const result = gameEngine.activateFeature(
  'feats.power_attack',
  character,
  { penalty: 3 }
);

// UNIX: Signal handling
// ENGINE: Event subscription
gameEngine.events.on('feature:complete', (data) => {
  console.log(`Feature ${data.id} completed`);
});

// UNIX: File read/write
// ENGINE: Entity property access
const strength = abilitySubsystem.getValue(character, 'strength');
abilitySubsystem.setValue(character, 'strength', strength + 2);
```

## Using This Mapping

When designing new components or functionality:

1. Consider the Unix equivalent to your component
2. Reference this mapping to find the appropriate game engine term
3. Maintain the Unix philosophy while using game-appropriate terminology

When studying Unix/Linux for inspiration:

1. Identify the Unix concept you're learning from
2. Use this mapping to translate to our engine terminology
3. Apply the philosophical principles while using our naming

This mapping helps us maintain conceptual clarity and philosophical alignment with Unix while using a more domain-appropriate and expressive terminology for our character engine.
