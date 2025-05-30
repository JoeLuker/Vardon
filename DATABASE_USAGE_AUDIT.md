# Database Usage Audit

This document catalogs the current database access patterns in the Vardon codebase, identifying areas that need refactoring to achieve full Unix-style file abstraction.

## Direct Supabase Client Imports

The following files directly import the Supabase client (`supabaseClient.ts`):

1. `/src/lib/db/index.ts` - Database module exports
2. `/src/lib/domain/application-new.ts` - Application initialization
3. `/src/lib/domain/application.ts` - Application initialization
4. `/src/lib/domain/capabilities/database/SupabaseDatabaseDriver.ts` - Database driver (expected)
5. `/src/lib/domain/state/data/StreamDatabase.ts` - Stream database implementation
6. `/src/lib/domain/state/data/SupabaseDriver.ts` - Supabase storage driver
7. `/src/lib/domain/tests/DirectoryExistenceTest.ts` - Test file
8. `/src/lib/domain/tests/SystemTest.ts` - Test file
9. `/src/routes/+layout.svelte` - Layout component
10. `/src/routes/+page.svelte` - Page component
11. `/src/routes/characters/[id]/+page.server.ts` - Server-side load function

## Direct Supabase Query Usage (.from())

The following files use direct Supabase query methods (like `.from()`):

1. `/src/lib/domain/capabilities/ability/AbilityCapabilityComposed.ts` - Ability capability implementation
2. ~~/src/lib/domain/capabilities/database/CompatibilityLayer.ts~~ - Removed (not needed with proper Unix architecture)
3. `/src/lib/domain/capabilities/database/SchemaRegistry.ts` - Schema registry component
4. `/src/lib/domain/capabilities/skill/SkillCapability.ts` - Skill capability implementation
5. `/src/lib/domain/kernel/GameKernel.ts` - Game kernel implementation
6. `/src/lib/domain/kernel/Kernel.ts` - Kernel implementation
7. `/src/lib/domain/plugins/PluginFilesystem.ts` - Plugin filesystem implementation
8. `/src/lib/domain/plugins/PluginLoader.ts` - Plugin loader implementation
9. `/src/lib/domain/state/active/MessageQueueSessionState.ts` - Session state component
10. `/src/lib/domain/state/active/SessionState.ts` - Session state base class
11. `/src/lib/domain/state/data/StreamDatabase.ts` - Stream database implementation
12. `/src/lib/domain/state/data/StreamDataDriver.ts` - Stream data driver
13. `/src/lib/domain/state/data/SupabaseDriver.ts` - Supabase storage driver
14. `/src/lib/ui/ClassFeatures.svelte` - UI component
15. `/src/lib/ui/Skills.svelte` - UI component
16. `/src/lib/ui/Spells.svelte` - UI component
17. `/src/lib/ui/SpellSlots.svelte` - UI component

## Key Patterns to Migrate

### 1. Direct Character Data Access

Current pattern:
```typescript
// Direct Supabase usage
const { data: entityData } = await supabase
  .from('entity')
  .select('ref_id')
  .eq('type', 'character')
  .eq('name', id)
  .single();
```

Target pattern:
```typescript
// Unix file operation
const path = `/entity/${id}`;
const fd = kernel.open(path, OpenMode.READ);
const buffer = {};
kernel.read(fd, buffer);
kernel.close(fd);
```

### 2. Character Data Updates

Current pattern:
```typescript
// Direct update
await supabase
  .from('game_character_ability')
  .update({ value })
  .eq('id', existingAbilities[0].id);
```

Target pattern:
```typescript
// Unix file operation
const path = `/proc/character/${characterId}/ability/${abilityId}`;
const fd = kernel.open(path, OpenMode.WRITE);
kernel.write(fd, { value });
kernel.close(fd);
```

### 3. Entity Querying

Current pattern:
```typescript
// Query entities directly
const { data, error } = await supabase
  .from('entity')
  .select('uuid')
  .eq('type', 'character');
```

Target pattern:
```typescript
// Unix file operation
const path = `/proc/character/list`;
const fd = kernel.open(path, OpenMode.READ);
const buffer = {};
kernel.read(fd, buffer);
kernel.close(fd);
```

## High-Priority Components to Refactor

1. **SupabaseStorageDriver** - Has extensive direct Supabase usage throughout the file. This is a critical component that needs to be fully refactored to use Unix file operations.

2. **UI Components** - Several UI components still use direct Supabase access. While some (like ClassFeatures.svelte) have already been migrated to the Unix pattern, others need similar updates.

3. **PluginLoader and PluginFilesystem** - These components manage plugin loading and should be migrated to use file operations for consistency.

## Implementation Status

1. **File Paths Defined** - Core UNIX file paths are defined in `application.ts`
2. **Capability Implementation** - Many capabilities like `AbilityCapabilityComposed.ts` are already using file operations
3. **GameRulesAPI Migration** - `getCompleteCharacterData()` has been partially migrated to use file operations
4. **Database Capability** - Database capability is implemented but not fully utilized throughout the codebase

## Next Steps

1. Define a complete set of file paths to represent all database operations
2. Implement handler methods for each database operation in DatabaseCapability
3. Update SupabaseStorageDriver to use file operations instead of direct Supabase calls
4. Gradually migrate UI components to use kernel file operations
5. Update route handlers to use the file operation pattern exclusively

This audit serves as the foundation for the next phase of refactoring: mapping database operations to Unix-style file paths, the second task in our implementation plan.