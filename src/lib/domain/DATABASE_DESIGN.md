# Database Access Design

This document outlines the canonical way to access the database in the Vardon application using Unix architecture principles.

## Overview

Database access in Vardon follows Unix design principles:

1. **Treat database resources as files** - Access with open/read/write/close operations
2. **Single source of truth** - All schemas are defined centrally
3. **Consistent interfaces** - All components use the same API
4. **Explicit field mapping** - No implicit property access

## Canonical Way to Access Database

There is ONE canonical way to access the database in Vardon:

```typescript
// Using GameRulesAPI with a filesystem approach:
import { GameRulesAPI } from '$lib/db';
import { OpenMode } from '$lib/domain/kernel/types';

// 1. Get the API and kernel
const api = new GameRulesAPI(supabase, { debug: true });
const kernel = api.getKernel();

// 2. Get the filesystem path for the resource
const path = api.getFileSystemPath('character', 123);

// 3. Open the file
const fd = kernel.open(path, OpenMode.READ);

// 4. Read the data
const buffer = {};
const [result] = kernel.read(fd, buffer);

// 5. Close the file
kernel.close(fd);

// Use the data
console.log(buffer.name);
```

## AVOID These Anti-patterns

❌ **Direct Supabase access**
```typescript
// This is DEPRECATED - DO NOT USE
const { data } = await supabase.from('game_character').select('*');
```

❌ **Using GameRulesAPI with Supabase passthrough**
```typescript
// This is DEPRECATED - DO NOT USE
const supabaseClient = gameRulesAPI.getSupabaseClient();
const { data } = await supabaseClient.from('game_character').select('*');
```

## Why Unix Architecture?

The Unix-style architecture provides several benefits:

1. **Consistent error handling** - All operations use the same error codes
2. **Explicit schema definitions** - All field mappings are explicitly defined
3. **Resource cleanup** - File descriptors must be closed properly
4. **Capability mounting** - Database access is provided through a mountable device
5. **Property name consistency** - Schema descriptors prevent property name mismatches

## Schema Descriptors

All database tables have a schema descriptor that explicitly maps database field names to application property names:

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
      dbField: 'value', // Database field name
      property: 'score', // Application property name
      defaultValue: 10,
      alternativeFields: ['score'] // Alternative field names
    }
  ]
};
```

This ensures that property name mismatches are handled explicitly, preventing the "value" vs "score" issue that motivated this architecture.

## Migration Path

If you find code that directly accesses Supabase, migrate it to use the Unix-style API:

1. Replace direct Supabase access with GameRulesAPI
2. Use filesystem paths and operations (open/read/write/close)
3. Add explicit schema descriptors for new tables
4. Close all file descriptors properly

Remember that there should be ONE canonical way to access the database!