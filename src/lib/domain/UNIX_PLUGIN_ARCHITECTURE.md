# Unix-Style Plugin Architecture

This document describes the Unix-style plugin architecture used in Vardon. This architecture follows Unix principles where everything is treated as a file and operations use standard file descriptors.

## Core Principles

The architecture follows these core Unix principles:

1. **Everything is a file** - Entities, plugins, capabilities, and resources are all accessed through filesystem paths
2. **Programs do one thing well** - Each plugin implements a specific feature with a clear responsibility
3. **Programs compose together** - Plugins can be combined and chained together
4. **Standard I/O** - All components communicate using standard file operations (open, read, write, close)
5. **Resource cleanup** - All resources are explicitly initialized and cleaned up

## Filesystem Structure

The virtual filesystem is organized as follows:

- `/bin/` - Executable plugins (like executables in Unix)
- `/entity/` - Entity data (like files in Unix)
- `/dev/` - Capabilities mounted as device drivers (like device files in Unix)
- `/proc/plugins/` - Plugin metadata and status information (like procfs in Unix)
- `/etc/plugins/` - Plugin configuration (like config files in Unix)
- `/var/run/plugins/` - Temporary plugin data (like runtime files in Unix)
- `/var/log/plugins/` - Plugin logs (like log files in Unix)

## Key Components

### Kernel

The GameKernel manages the virtual filesystem and provides file operations:

- `kernel.open(path, mode)` - Open a file for reading/writing
- `kernel.read(fd)` - Read data from a file descriptor
- `kernel.write(fd, data)` - Write data to a file descriptor
- `kernel.close(fd)` - Close a file descriptor
- `kernel.create(path, data)` - Create a new file
- `kernel.unlink(path)` - Remove a file
- `kernel.exists(path)` - Check if a file exists
- `kernel.ioctl(fd, request, arg)` - Control device operations

### Plugins

Plugins are like executable programs in Unix:

- Stored at `/bin/{plugin_id}`
- Have metadata at `/proc/plugins/{plugin_id}`
- Execute on entity paths: `plugin.execute(kernel, entityPath, options)`
- Follow a standard interface with `canApply` and `execute` methods
- Use file operations to read and modify entity data

### Capabilities

Capabilities are like device drivers in Unix:

- Mounted at paths like `/dev/ability`, `/dev/bonus`, etc.
- Accessed through file descriptors
- Controlled through ioctl operations
- Provide common functionality to plugins

### Entities

Entities are like files in Unix:

- Stored at `/entity/{entity_id}`
- Contain data in a structured format
- Accessed through file descriptors using read/write operations
- Modified by plugins through standard file operations

## How to Use

### Loading a Character

```typescript
// Create entity ID and path
const entityId = `character-${characterId}`;
const entityPath = `/entity/${entityId}`;

// Check if entity exists
if (kernel.exists(entityPath)) {
	// Open the entity file
	const fd = kernel.open(entityPath, OpenMode.READ);

	try {
		// Read entity data
		const [result, entity] = kernel.read(fd);

		if (result === 0) {
			// Process entity...
		}
	} finally {
		// Always close file descriptor
		kernel.close(fd);
	}
}
```

### Applying a Plugin

```typescript
// Apply a plugin to an entity
const result = await pluginManager.applyPlugin(entityId, 'power-attack', { penalty: 3 });

// Or directly using the plugin
const pluginPath = '/bin/power-attack';
const entityPath = `/entity/${entityId}`;
const exitCode = await kernel.execute(pluginPath, entityPath, { penalty: 3 });
```

### Using a Capability

```typescript
// Open a capability device
const bonusDeviceFd = kernel.open('/dev/bonus', OpenMode.READ_WRITE);

try {
	// Use ioctl to control the device
	const result = kernel.ioctl(bonusDeviceFd, 0, {
		operation: 'addBonus',
		entityPath: `/entity/${entityId}`,
		target: 'melee_attack',
		value: -3,
		type: 'power_attack',
		source: 'Power Attack'
	});
} finally {
	// Always close the device file descriptor
	kernel.close(bonusDeviceFd);
}
```

## Creating Plugins

To create a new plugin:

1. Define the plugin object with an interface following Unix principles:

```typescript
const myPlugin = {
	id: 'my-plugin',
	name: 'My Plugin',
	description: 'Does something useful',
	requiredDevices: ['/dev/bonus', '/dev/ability'],

	// Plugin execution
	async execute(kernel: GameKernel, targetPath: string, options: any = {}): Promise<number> {
		// Open the entity file
		const fd = kernel.open(targetPath, OpenMode.READ_WRITE);
		if (fd < 0) return 1;

		try {
			// Read entity data
			const [readResult, entityData] = kernel.read(fd);
			if (readResult !== 0) return 2;

			// Modify entity...

			// Write updated entity
			const writeResult = kernel.write(fd, entityData);
			if (writeResult !== 0) return 3;

			return 0; // Success
		} finally {
			// Always close file descriptor
			kernel.close(fd);
		}
	},

	// Validation
	canApply(entity: Entity): { valid: boolean; reason?: string } {
		// Check prerequisites...
		return { valid: true };
	}
};
```

2. Register the plugin with the kernel:

```typescript
kernel.registerPlugin(myPlugin);
```

## Benefits

This Unix-style architecture provides several benefits:

1. **Consistent Interface** - All components interact through the same filesystem metaphor
2. **Resource Management** - Explicit file descriptor management prevents leaks
3. **Modularity** - Plugins are independent and composable
4. **Testability** - Easy to mock and test individual components
5. **Extensibility** - New plugins can be added without modifying existing code
