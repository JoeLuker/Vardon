# Full Database Abstraction Plan

This document outlines a comprehensive plan to complete the Unix-style database abstraction in the Vardon codebase, focusing on eliminating direct Supabase client exposure.

## Current Status

1. The `getSupabaseClient()` method has been added to `GameRulesAPI` with appropriate deprecation warnings.
2. Some components like `CompatibilityLayer.ts` are already using the method for legacy database access.
3. The Unix file operations abstraction is already implemented in `DatabaseCapability` and `SupabaseDatabaseDriver`.
4. Many parts of the codebase still use direct Supabase client access rather than the Unix file operations.

## Goal

Achieve full Unix-style database abstraction where:
1. All database access is performed through kernel file operations
2. No direct Supabase client access exists in the codebase
3. The `getSupabaseClient()` method is no longer needed and can be removed

## Implementation Plan

### Phase 1: Identify All Direct Database Access

1. **Audit Current Usage**
   - Create an inventory of all places in the codebase that:
     - Use `supabase` directly (import from `$lib/db/supabaseClient`)
     - Call `gameRulesAPI.getSupabaseClient()`
     - Execute Supabase query methods (`.from()`, `.select()`, etc.)
   - Categorize each usage by access pattern (read, write, query, subscribe)

2. **Map Database Operations to File Paths**
   - Define a comprehensive set of file paths for database resources:
     - `/proc/character/{id}` - Character data
     - `/proc/character/list` - List all characters
     - `/entity/class/{id}` - Class data
     - `/entity/feat/{id}` - Feat data
     - `/proc/character/{id}/ability/{ability_id}` - Character ability
     - `/proc/character/{id}/class/{class_id}` - Character class
     - `/proc/character/{id}/skill/{skill_id}` - Character skill
   - Document the mapping between database operations and file paths

### Phase 2: Implement File Operation Patterns

3. **Create Handler Methods in DatabaseCapability**
   - Implement Unix file operation handlers for common database access patterns:
     - `readCharacter(id)` → `kernel.open(/proc/character/{id})` + `kernel.read()`
     - `writeCharacterAbility(id, ability)` → `kernel.open(/proc/character/{id}/ability/{ability})` + `kernel.write()`
     - `listCharacters()` → `kernel.open(/proc/character/list)` + `kernel.read()`

4. **Extend GameRulesAPI Methods**
   - For each database operation in the codebase:
     - Enhance existing methods to use Unix file operations internally
     - Add new methods that provide higher-level abstractions over file operations
     - Implement convenience methods that match common database access patterns

### Phase 3: Migrate Usage Patterns

5. **Refactor SupabaseStorageDriver**
   - This class has extensive direct usage of `supabase` and should be refactored to use:
     - `kernel.open()`, `kernel.read()`, `kernel.write()`, and `kernel.close()`
     - Higher-level GameRulesAPI methods that already use Unix file operations

6. **Migrate Tests to File Operations**
   - Update all test code to use Unix file operations instead of direct Supabase access
   - Create mock implementations of `DatabaseCapability` for testing

7. **Migrate UI Components**
   - Update all UI components to use `GameRulesAPI` methods that leverage Unix file operations internally
   - Refactor data fetching logic to use kernel file operations

### Phase 4: Enforce Architecture

8. **Update ESLint Rules**
   - Enhance ESLint rules to warn or error on:
     - Direct imports of `supabase`
     - Usage of `getSupabaseClient()`
     - Direct usage of Supabase query methods

9. **Add Static Analysis**
   - Update `scripts/check_architecture.sh` to validate that:
     - No direct database client exposure exists
     - All database access is performed through Unix file operations
     - All file descriptors are properly closed

10. **Add Database Operations Documentation**
    - Create a comprehensive guide for developers on:
      - File paths for different database resources
      - How to read/write/query different entity types
      - Examples of each common database operation

### Phase 5: Cleanup and Finalization

11. **Deprecate and Remove `getSupabaseClient()`**
    - Once all usages are migrated, update the method with a stronger warning
    - After sufficient time, remove the method entirely

12. **Remove Direct Supabase Imports**
    - Eliminate any remaining direct imports of `supabase` from components
    - Ensure all database access is through GameRulesAPI or kernel file operations

13. **Final Architecture Validation**
    - Run architecture validation scripts to confirm all goals have been met
    - Document any exceptions or special cases that were allowed

## Priority Implementation Targets

### High Priority (Direct Supabase Usage)
1. `src/lib/domain/state/data/SupabaseDriver.ts` - Has extensive direct Supabase usage
2. `src/lib/domain/state/data/StreamDataDriver.ts` - May use Supabase directly
3. `src/lib/domain/plugins/PluginLoader.ts` - Uses direct database access

### Medium Priority (Possible Indirect Usage)
1. `src/lib/domain/capabilities/skill/SkillCapability.ts` - May use database directly
2. `src/lib/domain/capabilities/ability/AbilityCapabilityComposed.ts` - May use database indirectly
3. `src/lib/domain/plugins/PluginFilesystem.ts` - May interact with database

### Low Priority (Legacy Components)
1. Code scheduled for removal or complete rewrite
2. Test-only components that don't impact production

## Timeline Estimate

1. **Phase 1-2**: 2-3 weeks
   - Audit and mapping database operations
   - Implementing file operation patterns

2. **Phase 3**: 3-4 weeks
   - Migrating all components to use file operations
   - Updating tests and UI components

3. **Phase 4-5**: 2-3 weeks
   - Adding enforcement rules
   - Documentation and cleanup

Total: 7-10 weeks for complete database abstraction

## Conclusion

By following this plan, the Vardon codebase will achieve full Unix-style database abstraction, eliminating direct database client exposure and ensuring all database access follows the "everything is a file" philosophy. This will result in a more modular, testable, and maintainable codebase that fully embraces the Unix architecture principles.