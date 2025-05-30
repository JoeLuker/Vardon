# Database Capability

This module implements a Unix-style capability for database access in the Vardon application.

## Unix Philosophy

The Database Capability follows the Unix philosophy by:

1. **Doing one thing well**: Providing a consistent interface for database access
2. **Working with files**: Treating database records as files in a filesystem
3. **Using text streams**: Processing data through standard interfaces
4. **Building modular components**: Separating drivers, schemas, and capabilities

## Architecture

The Database Capability consists of the following components:

- **DatabaseDriver**: Interface for database operations (open, read, write, close)
- **SupabaseDatabaseDriver**: Implementation for Supabase
- **SchemaDescriptor**: Schema definitions and field mapping utilities
- **DatabaseCapability**: Kernel capability implementation

## Usage Examples

### Mounting the Capability

```typescript
import { createDatabaseCapability } from './capabilities/database';
import { GameKernel } from './kernel/GameKernel';

// Create and mount the database capability
const kernel = new GameKernel();
const dbCapability = createDatabaseCapability({ debug: true });
kernel.registerCapability(dbCapability.id, dbCapability);
```

### Opening and Reading a Record

```typescript
// Open a character record
const path = '/db/character/1';
const fd = kernel.open(path, OpenMode.READ);

if (fd >= 0) {
  try {
    // Read the character data
    const buffer: any = {};
    const [result, data] = kernel.read(fd, buffer);
    
    if (result === 0) {
      console.log('Character data:', data);
    }
  } finally {
    // Always close the file descriptor
    kernel.close(fd);
  }
}
```

### Writing a Record

```typescript
// Open a character record for writing
const path = '/db/character/1';
const fd = kernel.open(path, OpenMode.READ_WRITE);

if (fd >= 0) {
  try {
    // Read the current data
    const buffer: any = {};
    const [readResult] = kernel.read(fd, buffer);
    
    if (readResult === 0) {
      // Modify the data
      buffer.name = 'Updated Name';
      
      // Write it back
      const writeResult = kernel.write(fd, buffer);
      
      if (writeResult === 0) {
        console.log('Character updated successfully');
      }
    }
  } finally {
    // Always close the file descriptor
    kernel.close(fd);
  }
}
```

### Accessing Ability Scores

```typescript
// Open a character's ability score
const path = '/db/character/1/ability/strength';
const fd = kernel.open(path, OpenMode.READ);

if (fd >= 0) {
  try {
    // Read the ability score
    const buffer: any = {};
    const [result] = kernel.read(fd, buffer);
    
    if (result === 0) {
      console.log('Strength score:', buffer.score);
    }
  } finally {
    // Always close the file descriptor
    kernel.close(fd);
  }
}
```

### Direct Use of DatabaseCapability

```typescript
import { DatabaseCapability } from './capabilities/database';

// Create the capability
const dbCapability = new DatabaseCapability({ debug: true });

// Load an entity directly
const entity = await dbCapability.loadEntity('character-1');

if (entity) {
  console.log('Loaded entity:', entity);
  
  // Modify and save
  entity.name = 'Updated Name';
  const success = await dbCapability.saveEntity(entity);
  
  if (success) {
    console.log('Entity saved successfully');
  }
}
```

## Benefits Over Direct Database Access

1. **Consistent Interface**: The same open/read/write/close pattern for all operations
2. **Field Name Normalization**: Automatic mapping between database and application fields
3. **Error Handling**: Standardized error codes and handling
4. **Resource Management**: Proper cleanup of file descriptors
5. **Abstraction**: Database implementation details are hidden from application code

## Schema Descriptors

Schema descriptors provide a declarative way to define database schemas and field mappings:

```typescript
const CharacterSchema: SchemaDescriptor = {
  tableName: 'game_character',
  primaryKey: 'id',
  fields: [
    {
      dbField: 'id',
      property: 'id',
      required: true
    },
    {
      dbField: 'name',
      property: 'name',
      required: true
    },
    {
      dbField: 'value',
      property: 'score',
      defaultValue: 10,
      alternativeFields: ['score']
    }
  ]
};
```

This approach ensures that field name mismatches like 'score' vs 'value' are handled automatically.