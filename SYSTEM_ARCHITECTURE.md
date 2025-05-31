# Vardon System Architecture

## Overview

This document describes the file-based architecture implementation for the Vardon character system. The architecture follows the "everything is a file" philosophy, treating game entities, capabilities, and state as files in a virtual filesystem.

## Principles

1. **Everything is a file** - All game entities and data are represented as files in a virtual filesystem
2. **Standard error handling** - System-level error codes and robust error handling patterns
3. **Resource management** - Proper file descriptor management with automatic cleanup
4. **Capability as devices** - Game capabilities implemented as device drivers
5. **Process isolation** - Components communicate through well-defined interfaces

## Filesystem Structure

```
/
├── dev/        # Device drivers (capabilities)
│   ├── ability    # Ability score capability
│   ├── combat     # Combat stats capability
│   ├── character  # Character management
│   ├── skill      # Skill capability
│   └── bonus      # Bonus management
├── proc/       # Process and runtime information
│   ├── character/ # Character data
│   │   └── {id}/  # Individual character data
│   ├── features/  # Active features
│   └── stats/     # Runtime statistics
├── sys/        # System configuration
│   ├── class/     # Class definitions
│   ├── ancestry/  # Ancestry definitions
│   └── config/    # System configuration
```

## File Operations

Unix-style file operations are used for all data access:

- `open(path, mode)` - Open a file and return a file descriptor
- `read(fd, buffer)` - Read data from a file descriptor
- `write(fd, buffer)` - Write data to a file descriptor
- `close(fd)` - Close a file descriptor
- `ioctl(fd, command, args)` - Perform device-specific operations
- `mkdir(path, mode)` - Create a directory
- `exists(path)` - Check if a path exists

## Error Handling

System-level error handling is implemented with standard error codes:

```typescript
enum ErrorCode {
	SUCCESS = 0,
	PERMISSION_DENIED = 1,
	FILE_NOT_FOUND = 2,
	INVALID_ARGUMENT = 3,
	IO_ERROR = 4
	// ...
}
```

Results are returned using a Result type:

```typescript
interface Result<T> {
	success: boolean;
	errorCode: ErrorCode;
	errorMessage?: string;
	errorContext?: ErrorContext;
	data?: T;
}
```

## Resource Management

Resources are properly managed with the `withFile` pattern:

```typescript
return withFile(kernel, path, OpenMode.READ_WRITE, async (fd) => {
	// File operations using the file descriptor
	// File is automatically closed when the function completes
});
```

## UI Integration

UI components interact with the system using file operations:

1. Components accept a `kernel` prop for file operations
2. File descriptors are used to read and write data
3. Resources are properly cleaned up with try/finally blocks
4. Error handling provides detailed diagnostics when operations fail

## Component Implementation Status

The following components are implemented with file-based architecture:

- [x] ErrorHandler.ts - Error handling system
- [x] CharacterLoader.svelte - Character loading
- [x] AbilityScores.svelte - Ability scores UI
- [x] HPTracker.svelte - HP tracking UI
- [x] Saves.svelte - Saving throws UI
- [x] ACStats.svelte - Armor class UI
- [x] CharacterSheet.svelte - Main character sheet
- [x] CharacterPage.svelte - Character page wrapper

Components pending implementation:

- [ ] Skills.svelte - Skills UI
- [ ] Feats.svelte - Feats UI
- [ ] ClassFeatures.svelte - Class features UI
- [ ] SpellSlots.svelte - Spell slots UI
- [ ] Spells.svelte - Spells UI

## Error Handling Guidelines

1. **Always check error codes** - File operations can fail and should be checked
2. **Use try/finally blocks** - Ensure resources are cleaned up properly
3. **Provide context in errors** - Include component, operation, and resource details
4. **Include diagnostic information** - Help debug issues with sufficient context

## Performance Considerations

The file-based architecture introduces some overhead due to the abstraction layer, but provides several benefits:

1. **Standard interfaces** - Consistent API for all components
2. **Improved error handling** - Robust error detection and recovery
3. **Better resource management** - Explicit resource tracking prevents leaks
4. **Debuggability** - System state can be inspected through the filesystem

## Future Improvements

1. Implement file locking for concurrent operations
2. Add a permissions system for access control
3. Implement process isolation with message passing
4. Create a filesystem explorer for debugging
