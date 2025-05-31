# Database File Path Mapping

This document defines the standard Unix-style file paths used to access database resources in Vardon. All database resources should be accessed using these paths and the kernel file operations (open, read, write, close).

## Directory Structure

```
/proc/               - Process and runtime information
  /character/         - Character data
    /[id]/            - Individual character data by ID
      /ability/       - Character abilities
      /class/         - Character classes
      /feat/          - Character feats
      /skill/         - Character skills
      /spell/         - Character spells
      /weapon/        - Character weapons
      /armor/         - Character armor
      /equipment/     - Character equipment
      /trait/         - Character traits
    /list             - List of all characters

/schema/              - Database schema metadata
  /[table_name]/      - Table-specific metadata
    /list             - List all rows in table
    /schema           - Table schema information

/entity/              - Entity resources
  /[id]/              - Entity by ID
    /abilities/       - Entity abilities
    /skills/          - Entity skills
    /combat/          - Entity combat stats
    /conditions/      - Entity conditions
    /bonuses/         - Entity bonuses
```

## Path Operations

### Character Paths

- `/proc/character/list` - List all characters (READ)
- `/proc/character/[id]` - Read/write a specific character (READ/WRITE)
- `/proc/character/[id]/ability/[ability_id]` - Read/write a specific character ability (READ/WRITE)
- `/proc/character/[id]/class/[class_id]` - Read/write a specific character class (READ/WRITE)
- `/proc/character/[id]/feat/[feat_id]` - Read/write a specific character feat (READ/WRITE)
- `/proc/character/[id]/skill/[skill_id]` - Read/write a specific character skill (READ/WRITE)
- `/proc/character/[id]/spell/[spell_id]` - Read/write a specific character spell (READ/WRITE)

### Schema Paths

- `/schema/[table_name]/list` - List all rows in a table (READ)
- `/schema/[table_name]/[id]` - Read/write a specific row (READ/WRITE)
- `/schema/[table_name]/schema` - Get table schema information (READ)

### Entity Paths

- `/entity/[entity_id]` - Read/write an entity (READ/WRITE)
- `/entity/[entity_id]/abilities` - Read/write entity abilities (READ/WRITE)
- `/entity/[entity_id]/skills` - Read/write entity skills (READ/WRITE)
- `/entity/[entity_id]/combat` - Read/write entity combat stats (READ/WRITE)
- `/entity/[entity_id]/conditions` - Read/write entity conditions (READ/WRITE)
- `/entity/[entity_id]/bonuses` - Read/write entity bonuses (READ/WRITE)

## Example Usage

```typescript
// Get a character by ID
const fd = kernel.open(`/proc/character/123`, OpenMode.READ);
if (fd >= 0) {
	try {
		const [result, buffer] = kernel.read(fd);
		if (result === ErrorCode.SUCCESS) {
			const character = buffer.data;
			// Process character data
		}
	} finally {
		// Always close file descriptors
		kernel.close(fd);
	}
}

// Update a character skill
const skillFd = kernel.open(`/proc/character/123/skill/456`, OpenMode.WRITE);
if (skillFd >= 0) {
	try {
		const result = kernel.write(skillFd, {
			rank: 3,
			classSkill: true
		});
		if (result === ErrorCode.SUCCESS) {
			// Skill updated successfully
		}
	} finally {
		kernel.close(skillFd);
	}
}

// List all characters
const listFd = kernel.open(`/proc/character/list`, OpenMode.READ);
if (listFd >= 0) {
	try {
		const [result, buffer] = kernel.read(listFd);
		if (result === ErrorCode.SUCCESS) {
			const characters = buffer.characters;
			// Process character list
		}
	} finally {
		kernel.close(listFd);
	}
}
```

## Special Operations

### Device Control (ioctl)

Device control operations can be used for specialized database operations:

```typescript
// Query specific data with parameters
const dbFd = kernel.open('/dev/db', OpenMode.READ_WRITE);
if (dbFd >= 0) {
	try {
		const result = kernel.ioctl(dbFd, REQUEST.QUERY, {
			table: 'spell',
			filter: { level: 3, class_id: 1 }
		});
		// Process result
	} finally {
		kernel.close(dbFd);
	}
}
```

## Error Handling

Proper error handling is crucial for file operations:

```typescript
const fd = kernel.open('/proc/character/999', OpenMode.READ);
if (fd < 0) {
	// Handle error - character not found or permission denied
	console.error(`Failed to open character file: ${fd}`);
	return;
}

try {
	const [result, buffer] = kernel.read(fd);
	if (result !== ErrorCode.SUCCESS) {
		// Handle read error
		console.error(`Failed to read character data: ${result}`);
		return;
	}
	// Process data
} catch (error) {
	// Handle unexpected errors
	console.error(`Unexpected error: ${error}`);
} finally {
	// Always close file descriptors
	kernel.close(fd);
}
```

## Migration Best Practices

When migrating from direct Supabase access to file operations:

1. Replace direct calls with equivalent file operations
2. Always use proper file descriptor management (close in finally block)
3. Add error handling for each file operation
4. Use the GameRulesAPI methods for convenience when available
5. Use the GameKernel for low-level file operations

## Deprecated Patterns

The following patterns should be avoided:

```typescript
// DON'T: Direct Supabase access
const { data } = await supabase.from('game_character').select('*');

// DO: Use file operations
const fd = kernel.open('/proc/character/list', OpenMode.READ);
// ... read and close file descriptor

// DON'T: Get Supabase client directly
const supabase = gameRulesAPI.getSupabaseClient();

// DO: Use file operations
const fd = gameRulesAPI.kernel.open('/proc/character/123', OpenMode.READ);
// ... read and close file descriptor
```
