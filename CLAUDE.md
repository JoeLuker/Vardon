# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Vardon - Unix-Inspired Pathfinder Character Manager

Vardon is a character management system for Pathfinder 1e that follows Unix architectural principles. It treats game entities as files in a virtual filesystem, allowing composition through capabilities similar to Unix file descriptors.

## Core Technologies

- **Frontend**: SvelteKit, TypeScript, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Architecture**: Unix-inspired virtual filesystem with capability-based composition

## Key Commands

### Development

```bash
npm run dev        # Start development server on http://localhost:5173
npm run build      # Build for production
npm run preview    # Preview production build
```

### Testing

```bash
npm run test       # Run all tests
npm run test:unit  # Run unit tests only
npm run test:e2e   # Run end-to-end tests (requires running dev server)

# Run specific test file
npm run test -- src/lib/domain/tests/UnixArchitectureTest.ts

# Run tests with verbose output
npm run test -- --verbose
```

### Linting & Type Checking

```bash
npm run lint       # Run ESLint
npm run check      # Run TypeScript type checking
```

### Database & Data Management

```bash
# Load YAML data into database
python scripts/load_yaml_to_db.py

# Export database to YAML
python scripts/load_db_to_yaml.py

# Query database (interactive)
node scripts/query_db.js

# Test database connection
node scripts/test_database_connection.js
```

## High-Level Architecture

The codebase follows Unix principles where everything is a "file" (entity) with capabilities:

### Virtual Filesystem Structure

```
/characters/{id}              # Character entities
/characters/{id}/abilities    # Ability scores
/characters/{id}/skills       # Skills
/characters/{id}/combat       # Combat stats
/templates/                   # Character templates
/data/                       # Game rules data
```

### Core Components

1. **Kernel** (`src/lib/domain/kernel/`)

   - `GameKernel`: Main system kernel, manages filesystem and capabilities
   - `FileSystem`: Virtual filesystem implementation
   - `EventBus`: Inter-component communication

2. **Capabilities** (`src/lib/domain/capabilities/`)

   - `BaseCapability`: Abstract base for all capabilities
   - `AbilityCapability`: Manages ability scores (STR, DEX, etc.)
   - `SkillCapability`: Handles skill calculations
   - `CombatCapability`: Combat statistics (AC, HP, saves)
   - `DatabaseCapability`: Database operations following Unix patterns

3. **Entities** (`src/lib/domain/character/`)
   - Characters are "files" with capabilities attached
   - Use `CharacterAssembler` to create fully-initialized characters

### Unix-Style File Operations

```typescript
// Read a character (like cat /characters/123)
const character = await kernel.readFile('/characters/123');

// Write character data (like echo > /characters/123)
await kernel.writeFile('/characters/123', characterData);

// List directory contents (like ls /characters)
const characters = await kernel.listDirectory('/characters');

// Check if file exists (like test -f /characters/123)
const exists = await kernel.fileExists('/characters/123');
```

## TypeScript Import Best Practices

### Interface Imports

Always use `import type` for TypeScript interfaces, not regular imports:

```typescript
// ✅ CORRECT
import type { Entity, Capability } from './types';

// ❌ INCORRECT
import { Entity, Capability } from './types';
```

### Class Imports

For actual classes that will be instantiated, use regular imports:

```typescript
// ✅ CORRECT
import { BaseCapability } from './BaseCapability';
import type { CapabilityOptions } from './BaseCapability';
```

## Unix Architecture Principles

The Vardon Character Engine follows Unix architecture principles. This implementation replaces class-based inheritance with a more flexible composition-based approach.

### Core Unix Philosophy Principles Applied

1. **Everything is a File**: All game entities are treated as files in a filesystem
2. **Do One Thing Well**: Each component has a single, clear responsibility
3. **Small, Sharp Tools**: The system is composed of small, focused components
4. **Composition over Inheritance**: Build systems through composition rather than inheritance
5. **Explicit Resource Management**: Open, read, write, close pattern for all resources

### Virtual Filesystem Structure

```
/
├── dev/           # Device drivers (capabilities)
│   ├── ability    # Ability score capability
│   ├── bonus      # Bonus management
│   ├── combat     # Combat stats capability
│   ├── condition  # Condition management
│   ├── database   # Database capability
│   └── skill      # Skill capability
├── entity/        # Game entities (characters, etc.)
│   └── {id}       # Individual entity data
├── proc/          # Process and runtime information
│   ├── character/ # Character data
│   ├── features/  # Active features
│   └── stats/     # Runtime statistics
├── bin/           # Executable plugins
└── etc/           # Configuration files
```

### File Operations

```typescript
// Open a file and get a file descriptor
const fd = kernel.open(path, OpenMode.READ_WRITE);

// Always use try/finally for resource cleanup
try {
	// Read data
	const [result, data] = kernel.read(fd);
	if (result !== ErrorCode.SUCCESS) {
		// Handle error
		return result;
	}

	// Modify data
	data.someProperty = newValue;

	// Write data back
	const writeResult = kernel.write(fd, data);
	return writeResult;
} finally {
	// Always close file descriptors
	kernel.close(fd);
}
```

### Resource Management Patterns

Use the `withFile` pattern for automatic resource management:

```typescript
return withFile(kernel, entityPath, OpenMode.READ_WRITE, async (fd) => {
	// File operations with automatic cleanup
	const [result, entity] = kernel.read(fd);
	if (result !== ErrorCode.SUCCESS) {
		return failure(result, 'Failed to read entity');
	}

	// Modify entity
	entity.properties.someValue = newValue;

	// Write back
	const writeResult = kernel.write(fd, entity);
	return writeResult === ErrorCode.SUCCESS
		? success(entity)
		: failure(writeResult, 'Failed to write entity');
});
```

## Database Access Patterns

### Use GameRulesAPI Methods

Never access Supabase directly. Instead, use provided GameRulesAPI methods:

```typescript
// ✅ CORRECT
const characterData = await gameRulesAPI.getCompleteCharacterData(characterId);

// ❌ INCORRECT
const { data: characterData } = await gameRulesAPI.supabase
	.from('game_character')
	.select('*')
	.eq('id', characterId)
	.single();
```

### Unix-Style Database Operations

All database operations should use the file-based abstraction:

```typescript
// ✅ CORRECT - Using file operations
const fd = kernel.open('/proc/character/123', OpenMode.READ);
try {
	const [result, character] = kernel.read(fd);
	// Process character data
} finally {
	kernel.close(fd);
}

// ❌ INCORRECT - Direct database access
const supabase = gameRulesAPI.getSupabaseClient();
const { data } = await supabase.from('game_character').select('*');
```

### Database File Path Conventions

- Character data: `/proc/character/{id}`
- Character list: `/proc/character/list`
- Character abilities: `/proc/character/{id}/ability/{ability_id}`
- Character skills: `/proc/character/{id}/skill/{skill_id}`
- Class definitions: `/entity/class/{id}`
- Feat definitions: `/entity/feat/{id}`

## Error Handling

### Error Codes

Use standard Unix-style error codes:

```typescript
export enum ErrorCode {
	SUCCESS = 0,
	EPERM = 1, // Operation not permitted
	ENOENT = 2, // No such file or directory
	EIO = 5, // I/O error
	EACCES = 13, // Permission denied
	EINVAL = 22 // Invalid argument
	// ... other standard error codes
}
```

### Result Type

Use the Result type for operations that can fail:

```typescript
interface Result<T> {
	success: boolean;
	errorCode: ErrorCode;
	errorMessage?: string;
	errorContext?: ErrorContext;
	data?: T;
}

// Helper functions
function success<T>(data: T): Result<T>;
function failure<T>(code: ErrorCode, message?: string, context?: Partial<ErrorContext>): Result<T>;
```

### Error Context

Provide rich error context for debugging:

```typescript
interface ErrorContext {
	operation: string; // What operation failed
	path?: string; // File path involved
	entityId?: string; // Entity ID if applicable
	userId?: string; // User performing operation
	timestamp: number; // When error occurred
	stackTrace?: string; // Stack trace for debugging
	metadata?: Record<string, any>; // Additional context
}
```

## Testing Guidelines

### Test Structure

```typescript
// Tests follow Unix naming conventions
src/lib/domain/tests/
  UnixArchitectureTest.ts      # Tests Unix file operations
  CharacterTests.ts            # Character entity tests
  CapabilityTests.ts           # Capability integration tests
  FileSystemCharacterTest.ts   # File-based character storage
```

### Running Tests

```bash
# Run all tests
node src/lib/domain/tests/TestRunner.ts

# Run specific test suite
node src/lib/domain/tests/UnixArchitectureTest.ts

# Run with verbose output
DEBUG=true node src/lib/domain/tests/TestRunner.ts
```

### Key Test Suites

1. **UnixArchitectureTest**: Validates Unix-style file operations
2. **CapabilityTests**: Tests capability composition and initialization
3. **CharacterTests**: End-to-end character creation and manipulation
4. **FileSystemCharacterTest**: Tests persistence layer

## Architecture Principles

### Single Source Principle

Each piece of data should have a single, authoritative source:

```typescript
// ❌ WRONG: Multiple sources of truth
class Character {
	strength: number;
	strengthModifier: number; // Calculated from strength
}

// ✅ RIGHT: Single source with derived values
class Character {
	strength: number;
	get strengthModifier() {
		return Math.floor((this.strength - 10) / 2);
	}
}
```

### Composition Over Inheritance

```typescript
// Use capability composition instead of deep inheritance
const character = new Entity('character');
character.addCapability(new AbilityCapability());
character.addCapability(new SkillCapability());
character.addCapability(new CombatCapability());
```

## Svelte 5 Best Practices

### Avoiding Reactive Loops

Never modify state inside `$effect` blocks that the effect depends on:

```typescript
// ❌ WRONG: Creates infinite loop
let count = $state(0);
$effect(() => {
	if (count < 10) {
		count++; // This triggers the effect again!
	}
});

// ✅ RIGHT: Use explicit actions
let count = $state(0);
function increment() {
	if (count < 10) count++;
}

// ✅ RIGHT: Use $derived for computed values
let count = $state(0);
let doubled = $derived(count * 2);
```

### State Machine Pattern

For complex component state, use a state machine instead of multiple boolean flags:

```typescript
// ❌ WRONG: Multiple flags create complex interactions
let isLoading = $state(false);
let isWaiting = $state(false);
let hasError = $state(false);
let loadAttempted = $state(false);

// ✅ RIGHT: Single state with clear transitions
enum LoaderState {
	INITIAL = 'initial',
	WAITING = 'waiting',
	LOADING = 'loading',
	LOADED = 'loaded',
	ERROR = 'error'
}
let state = $state<LoaderState>(LoaderState.INITIAL);
```

### Async Operations in Effects

Don't update state inside async operations within effects:

```typescript
// ❌ WRONG: State updates inside effect's async operation
$effect(() => {
	loadData().then((data) => {
		myState = data; // This can cause issues
	});
});

// ✅ RIGHT: Separate the concerns
$effect(() => {
	if (shouldLoad) {
		performLoad(); // Call a function that handles its own state
	}
});

async function performLoad() {
	const data = await loadData();
	myState = data;
}
```

## Common Issues and Solutions

| Issue                                                     | Solution                                                                                             |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| "Class extends value undefined is not a constructor"      | Check import statements - ensure you're importing classes with regular imports, not type imports     |
| "The requested module does not provide an export named X" | Ensure the module actually exports what you're trying to import. Check for `export type` vs `export` |
| "Cannot access X before initialization"                   | Check for circular dependencies. Try refactoring into smaller, more focused modules                  |
| "TypeError: X is not a function"                          | Verify method names and signatures. Use VSCode IntelliSense to check available methods               |
| "ENOENT: No such file or directory"                       | Ensure the virtual path exists before accessing. Use `kernel.ensureDirectory()`                      |
| "EACCES: Permission denied"                               | Check capability permissions. Some operations require specific capabilities                          |
| "Capability not initialized"                              | Always call `capability.initialize(entity)` before using capability methods                          |
| "effect_update_depth_exceeded"                            | You have a reactive loop. Check for state modifications inside $effect blocks                        |
| "ReferenceError: window is not defined"                   | SSR error. Wrap browser-specific code in `if (typeof window !== 'undefined')`                        |
| "kernel.read() returns empty buffer"                      | kernel.read() returns [errorCode, data] tuple, not a buffer parameter                                |

## Logging System

Vardon includes a comprehensive logging system that replaces console.log statements with structured logging:

### Using the Logger

```typescript
import { logger } from '$lib/utils/Logger';

// Log at different levels
logger.debug('Component', 'methodName', 'Debug message', { extraData });
logger.info('Component', 'methodName', 'Info message');
logger.warn('Component', 'methodName', 'Warning message');
logger.error('Component', 'methodName', 'Error message', { error });
logger.fatal('Component', 'methodName', 'Fatal error', { criticalData });
```

### Browser Diagnostic Tools

In the browser console, you have access to diagnostic tools:

```javascript
// Run full diagnostics
vardonDiagnostics.analyze();

// Export logs as JSON
vardonDiagnostics.exportLogs();

// Download logs as a file
vardonDiagnostics.downloadLogs();

// Enable automatic diagnostics (logs warnings/errors every minute)
vardonDiagnostics.autoAnalyze();
```

### Analyzing Issues

The diagnostic tool automatically detects common issues:

- Character loading failures
- Database connection problems
- File system errors
- Foreign key relationship issues
- Schema registration problems

## Debugging Tips

### Enable Verbose Logging

```typescript
// Set debug environment variable
process.env.DEBUG = 'true';

// Or use kernel debug mode
kernel.setDebugMode(true);

// Or set logger to debug level
import { logger, LogLevel } from '$lib/utils/Logger';
logger.setLogLevel(LogLevel.DEBUG);
```

### Trace File Operations

```typescript
// Use the event bus to monitor file operations
kernel.eventBus.on('file:read', (event) => {
	logger.debug('FileTrace', 'read', `Reading file: ${event.path}`);
});

kernel.eventBus.on('file:write', (event) => {
	logger.debug('FileTrace', 'write', `Writing file: ${event.path}`);
});
```

### Capability Debugging

```typescript
// Check which capabilities an entity has
const capabilities = entity.getCapabilities();
logger.debug('Entity', 'capabilities', 'Available capabilities', {
	capabilities: capabilities.map((c) => c.constructor.name)
});

// Verify capability state
const ability = entity.getCapability(AbilityCapability);
logger.debug('Capability', 'state', 'Ability capability state', {
	debugInfo: ability.getDebugInfo()
});
```

## Migration Guide

When updating existing code to follow these patterns:

1. **Replace direct database access** with GameRulesAPI methods
2. **Convert class hierarchies** to capability composition
3. **Update imports** to use proper type imports
4. **Add error handling** using Result types
5. **Implement Unix-style paths** for resource access

## Future Improvements

The architecture is designed to support:

- **Plugin System**: Drop-in plugins that extend capabilities
- **Hot Reloading**: Reload capabilities without restarting
- **Distributed Operations**: Capabilities across multiple processes
- **Transaction Support**: Atomic operations across multiple files

### Test Structure

Tests are organized in `src/lib/domain/tests/`:

```typescript
// Example test structure
export async function runMyTest(): Promise<void> {
	console.group('=== My Test Suite ===');
	console.time('Test duration');

	try {
		// Test implementation
		await testSomething();
		console.log('✅ Test passed');
	} catch (error) {
		console.error('❌ Test failed:', error);
	} finally {
		console.timeEnd('Test duration');
		console.groupEnd();
	}
}
```

### Running Tests

Tests can be run from the browser console:

```javascript
// Run all tests
runTests();

// Run specific test suites
runTests(['character', 'system']);
```

### Key Test Suites

- `character` - Character loading and manipulation
- `system` - Core system functionality
- `database` - Database capability tests
- `errorHandling` - Error handling system
- `unix` - Unix architecture compliance
- `performance` - Performance benchmarks

## Initialization Patterns

### Entity Initialization

Use the initialize method on capabilities, passing the entity directly:

```typescript
// ✅ CORRECT
abilityCapability.initialize(entity);
skillCapability.initialize(entity);
combatCapability.initialize(entity);

// ❌ INCORRECT
abilityCapability.initializeAbilities(entity.id);
skillCapability.initializeSkills(entity.id);
combatCapability.initializeCombatStats(entity.id);
```

### Capability Registration

Capabilities are mounted as device drivers:

```typescript
// Register capability with kernel
kernel.mount('/dev/ability', abilityCapability);
kernel.mount('/dev/skill', skillCapability);
kernel.mount('/dev/combat', combatCapability);
```

## Component Boundaries

- Each component should have a clear, well-defined interface
- Components should communicate through these interfaces, not internal implementation details
- Always respect encapsulation - do not access private properties or methods

## Preventing Circular Dependencies

- Keep dependency direction consistent
- Use dependency injection to decouple modules
- Consider using interfaces or abstract base classes as dependency boundaries

## Common Issues and Solutions

| Issue                                                     | Solution                                                                                             |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| "Class extends value undefined is not a constructor"      | Check import statements - ensure you're importing classes with regular imports, not type imports     |
| "The requested module does not provide an export named X" | Ensure the module actually exports what you're trying to import. Check for `export type` vs `export` |
| "Cannot access X before initialization"                   | Check for circular dependencies. Try refactoring into smaller, more focused modules                  |
| "TypeError: X is not a function"                          | Verify method names and signatures. Use VSCode IntelliSense to check available methods               |
| "File descriptor leak"                                    | Ensure all `kernel.open()` calls have corresponding `kernel.close()` calls in finally blocks         |
| "Direct database access"                                  | Replace with Unix file operations through the kernel                                                 |

## Architecture Principles

### Single Source Principle

> "There should be exactly one way to accomplish each task in the system."

1. **No "Enhanced" Prefix**: Never create an "Enhanced" version of an existing component
2. **No Version Numbers**: Never use "v2" or similar in class names
3. **No "New" Suffix**: Never use ".new.ts" files - update the original file instead
4. **No Two Implementations**: Never have two classes that do the same thing
5. **No Indirection Pattern**: Never have one class fully wrap another - refactor instead

### Composition Patterns

Build functionality through composition of small, focused functions:

```typescript
// ✅ CORRECT - Composition
export function createCapability(options: CapabilityOptions): Capability {
	const context = createContext(options);

	return {
		onMount: (kernel) => handleMount(context, kernel),
		read: (fd, buffer) => handleRead(context, fd, buffer),
		write: (fd, buffer) => handleWrite(context, fd, buffer),
		ioctl: (fd, request, arg) => handleIoctl(context, fd, request, arg),
		shutdown: () => handleShutdown(context)
	};
}

// ❌ INCORRECT - Inheritance
class MyCapability extends BaseCapability {
	// ...
}
```

## ESLint and TypeScript Configuration

The project is set up with ESLint and TypeScript configurations that help enforce these rules. Always run linting before committing:

```bash
npm run lint
```

Key ESLint rules enforce:

- Unix file operations usage
- No direct database access
- Proper import types
- Resource management patterns

## Debugging Tips

### Enable Debug Logging

```typescript
// Enable debug mode in kernel
const kernel = new Kernel({ debug: true });

// Enable debug mode in capabilities
const capability = createCapability({
	id: 'my-capability',
	debug: true
});
```

### Inspect File System State

```typescript
// List directory contents
const [result, entries] = kernel.readdir('/dev');
entries.forEach((entry) => {
	console.log(`${entry.name} (${entry.type})`);
});

// Check if path exists
const exists = kernel.exists('/entity/character-123');
```

### Monitor File Descriptors

```typescript
// The kernel tracks open file descriptors
// Check for leaks by monitoring fd allocation
console.log('Open file descriptors:', kernel.getOpenFileDescriptors());
```

## Migration Guide

When updating existing code to follow these guidelines:

1. **Replace direct imports**: Change regular imports to `import type` for interfaces
2. **Update database access**: Replace direct Supabase calls with GameRulesAPI methods
3. **Add error handling**: Use Result types and proper error codes
4. **Implement resource management**: Use try/finally or withFile patterns
5. **Follow Unix patterns**: Use file operations for all data access
6. **Add proper context**: Include detailed error context for debugging

## Future Improvements

The architecture is designed to support:

- File locking for concurrent operations
- Permission system for access control
- Process isolation with message passing
- Filesystem explorer for debugging
- Complete removal of direct database access
