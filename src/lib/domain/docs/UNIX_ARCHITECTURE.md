# Unix Architecture for Vardon Character Engine

## Overview

The Unix architecture for the Vardon Character Engine follows the Unix philosophy:

1. **Everything is a File**: All game entities are treated as files in a filesystem with consistent interfaces
2. **Do One Thing Well**: Each component has a single, clear responsibility
3. **Small, Sharp Tools**: The system is composed of small, focused components that work together
4. **Write Programs to Handle Text Streams**: Components communicate through standardized streams of data
5. **Use Software Leverage**: Build components that can be combined in various ways

## Core Concepts

### Filesystem Kernel

The `GameKernel` implements a Unix-like filesystem where:

- `/dev/` contains device drivers (capabilities)
- `/entity/` contains game entities (characters, etc.)
- System calls (open, read, write, close) for accessing resources
- Reference counting for resources through file descriptors

### Device Drivers (Capabilities)

Capabilities are implemented as device drivers mounted in the filesystem:

- Mounted at `/dev/{capability-id}`
- Initialization happens at mount time (not on access)
- Access through file operations (read/write/ioctl)
- Each capability manages its own internal state
- Clean separation from entity data

### Processes (Plugins)

Plugins implement game features and run like processes:

- Have a unique ID
- Declare required devices (capabilities)
- Execute against entity files with specific paths
- Open file descriptors to access entities and devices
- Close file descriptors when done

### Files (Entities)

Entities are implemented as files in the filesystem:

- Created with `create()` at `/entity/{entity-id}`
- Accessed through file descriptors from `open()`
- Read/write operations using file descriptors
- One entity = one file with consistent structure
- Metadata stored in inodes

### Process Communication

Components communicate through:

- Events (like signals in Unix)
- Return values from system calls
- File data read/write operations
- IOCTL calls for special operations

## Implementation Details

### File Descriptors

File descriptors are numeric handles for accessing files:

```typescript
interface FileDescriptor {
  fd: number;        // Numeric identifier
  path: string;      // Path to the resource
  mode: OpenMode;    // Read/write mode
  openedAt: number;  // When it was opened
}
```

### System Calls

The kernel provides Unix-like system calls:

- `mkdir(path)`: Create a directory
- `mount(path, device)`: Mount a device at a path
- `create(path, data)`: Create a file
- `open(path, mode)`: Open a file and get a file descriptor
- `read(fd, buffer)`: Read from a file descriptor
- `write(fd, buffer)`: Write to a file descriptor
- `close(fd)`: Close a file descriptor
- `ioctl(fd, request, arg)`: Special device control

### Error Handling

Unix-style error codes are used:

```typescript
enum ErrorCode {
  SUCCESS = 0,    // No error
  EPERM = 1,      // Operation not permitted
  ENOENT = 2,     // No such file or directory
  EACCES = 13,    // Permission denied
  EINVAL = 22     // Invalid argument
  // etc.
}
```

## Directory Structure

```
domain/
├── kernel/                   # Core system components
│   ├── GameKernel.ts         # Filesystem implementation
│   ├── EventBus.ts           # Event system (signals)
│   └── types.ts              # System types (FD, Inode, etc)
│
├── capabilities/             # Device drivers
│   ├── BaseCapability.ts     # Base implementation
│   ├── ability/              # Ability score capability
│   ├── bonus/                # Bonus system capability
│   ├── skill/                # Skill system capability
│   ├── combat/               # Combat system capability
│   └── condition/            # Condition system capability
│
├── plugins/                  # Process implementations
│   ├── BasePlugin.ts         # Base plugin implementation
│   ├── PluginManager.ts      # Process manager
│   ├── feats/                # Feat plugins
│   ├── classes/              # Class feature plugins
│   └── migration/            # Legacy feature adapters
│
├── tests/                    # Tests for the architecture
│   ├── UnixArchitectureTest.ts # Core architecture test
│   └── UnixCharacterTest.ts    # Character entity test
│
├── application.ts            # Main application initializer
└── docs/                     # Documentation
    └── UNIX_ARCHITECTURE.md  # This file
```

## Implementation Examples

### Entity as a File

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

### Capability as a Device Driver

```typescript
class AbilityCapability extends BaseCapability {
  public readonly id = 'ability';
  private readonly abilityScores = new Map<string, Map<string, number>>();
  
  onMount(kernel: any): void {
    super.onMount(kernel);
    // Initialization happens here, at mount time
  }
  
  read(fd: number, buffer: any): number {
    // Get file descriptor info from kernel
    const fileDesc = this.kernel.getFileDescriptor(fd);
    if (!fileDesc) return ErrorCode.EBADF;
    
    // Extract entity ID from path
    const match = fileDesc.path.match(/\/entity\/(.+)/);
    if (!match) return ErrorCode.EINVAL;
    
    const entityId = match[1];
    
    // Get ability scores for this entity
    const scores = this.abilityScores.get(entityId);
    if (!scores) return ErrorCode.ENOENT;
    
    // Copy data to buffer
    buffer.abilities = Array.from(scores.entries())
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
    
    return ErrorCode.SUCCESS;
  }
  
  write(fd: number, buffer: any): number {
    // Implementation for updating abilities
    // ...
    return ErrorCode.SUCCESS;
  }
}
```

### Plugin as a Process

```typescript
const PowerAttackPlugin = {
  id: 'power-attack',
  name: 'Power Attack',
  description: 'Trade attack bonus for damage',
  requiredDevices: ['/dev/ability', '/dev/combat'],
  
  async execute(kernel: any, entityPath: string, options: any = {}): Promise<number> {
    // Open the entity file
    const entityFd = kernel.open(entityPath, OpenMode.READ_WRITE);
    if (entityFd < 0) return 1; // Error
    
    // Open ability device
    const abilityFd = kernel.open('/dev/ability', OpenMode.READ);
    if (abilityFd < 0) {
      kernel.close(entityFd);
      return 2; // Error
    }
    
    // Open combat device
    const combatFd = kernel.open('/dev/combat', OpenMode.READ_WRITE);
    if (combatFd < 0) {
      kernel.close(entityFd);
      kernel.close(abilityFd);
      return 3; // Error
    }
    
    try {
      // Read entity data
      const entity = {};
      kernel.read(entityFd, entity);
      
      // Read ability data
      const abilityData = {};
      kernel.read(abilityFd, abilityData);
      
      // Apply power attack effects using combat device
      const arg = {
        penalty: options.penalty || 1,
        damageBonus: options.penalty * 2 || 2,
        strengthScore: abilityData.abilities.strength
      };
      
      kernel.ioctl(combatFd, /* POWER_ATTACK_REQUEST */ 42, arg);
      
      return 0; // Success
    } finally {
      // Always close file descriptors
      kernel.close(entityFd);
      kernel.close(abilityFd);
      kernel.close(combatFd);
    }
  }
};
```

## Key Benefits

1. **Impossible Duplicate Initialization**: Initialization happens at mount time (once), not on access
2. **Clear Resource Ownership**: The kernel owns entities, components access via file descriptors
3. **Explicit Access Control**: Resources must be opened before access and closed when done
4. **Decoupled Components**: Components communicate only through well-defined interfaces
5. **Stateless Component Interaction**: No shared state between components
6. **Proper Resource Cleanup**: File descriptors must be closed, preventing resource leaks
7. **Standard Error Handling**: Consistent error codes across the system

## Working with the Unix Architecture

### Creating a New Capability

1. Create a class that extends `BaseCapability`
2. Implement `read`, `write`, and/or `ioctl` methods
3. Initialize state in the `onMount` method
4. Clean up resources in the `shutdown` method
5. Mount the capability at `/dev/{id}` during application initialization

### Creating a New Plugin

1. Create an object implementing the `Plugin` interface
2. Declare required devices in `requiredDevices` array
3. Implement the `execute` method using file operations
4. Remember to always close file descriptors
5. Register the plugin with `kernel.registerPlugin()`

### Loading a Character

```typescript
async function loadCharacter(characterId: number): Promise<Entity | null> {
  // Create entity path
  const entityId = `character-${characterId}`;
  const entityPath = `/entity/${entityId}`;
  
  // Check if entity already exists
  if (kernel.exists(entityPath)) {
    // Open the entity file
    const fd = kernel.open(entityPath, OpenMode.READ);
    if (fd < 0) return null;
    
    try {
      // Read entity data
      const entity = {};
      const result = kernel.read(fd, entity);
      if (result !== 0) return null;
      return entity;
    } finally {
      kernel.close(fd);
    }
  }
  
  // Load from database and create entity
  const rawCharacter = await dbAPI.getCompleteCharacterData(characterId);
  if (!rawCharacter) return null;
  
  // Create entity from raw data
  const entity = createEntityFromRawData(rawCharacter, entityId);
  
  // Create entity file
  kernel.create(entityPath, entity);
  
  // Initialize by running necessary plugins
  await initializeCharacterWithPlugins(entityId);
  
  // Return the initialized entity
  const fd = kernel.open(entityPath, OpenMode.READ);
  if (fd < 0) return null;
  
  try {
    const result = {};
    kernel.read(fd, result);
    return result;
  } finally {
    kernel.close(fd);
  }
}
```

## Best Practices

1. **Always Close File Descriptors**: Use try/finally blocks to ensure cleanup
2. **Use Consistent Path Structure**: Follow the `/dev/` and `/entity/` patterns
3. **Keep Device Drivers Focused**: Each capability should do one thing well
4. **Use IOCTL for Complex Operations**: For operations that don't fit read/write
5. **Register Plugins Early**: Register all plugins during initialization
6. **Validate Paths**: Always check that paths exist before operating on them
7. **Handle Error Codes**: Check return values from all system calls
8. **Respect Access Modes**: Only read in READ mode, write in WRITE mode

## Testing the Architecture

To run the Unix architecture tests:

```
ts-node src/lib/domain/tests/UnixTestRunner.ts
```

This will run:
- `UnixArchitectureTest`: Tests the core filesystem operations
- `UnixCharacterTest`: Tests character loading and manipulation

## References

- [Unix Philosophy](https://en.wikipedia.org/wiki/Unix_philosophy)
- [Unix Filesystem](https://en.wikipedia.org/wiki/Unix_filesystem)
- [File Descriptor](https://en.wikipedia.org/wiki/File_descriptor)
- [Device File](https://en.wikipedia.org/wiki/Device_file)
- [ioctl](https://en.wikipedia.org/wiki/Ioctl)