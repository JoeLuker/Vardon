# Database Implementation Refactoring Plan

## Problem Statement

Currently, we have two parallel implementations for database access:
1. The original `GameRulesAPI` in `gameRules.api.ts`
2. The `EnhancedGameRulesAPI` in `gameRules.api.new.ts`

This violates our architecture principle of having a single canonical way to perform tasks.

## Action Plan

### Phase 1: Preparation (Current Sprint)

1. **Document Architecture Principles**
   - ✅ Create ARCHITECTURE_PRINCIPLES.md
   - ✅ Add architecture validation script

2. **Add Deprecation Warnings**
   - ✅ Add warnings to old methods
   - ✅ Guide users to the new patterns

### Phase 2: Consolidation (Next Sprint)

1. **Merge Implementations**
   - Update the original `GameRulesAPI` to use DatabaseCapability internally
   - Ensure all methods from both implementations are preserved
   - Keep backward compatibility within the same file

2. **Remove Duplicate File**
   - After the merge is complete, remove `gameRules.api.new.ts`
   - Update imports to use the single implementation

3. **Update Documentation**
   - Update all documentation to reflect the consolidated implementation
   - Remove references to "Enhanced" version

### Phase 3: Migration Support (Following Sprint)

1. **Create Migration Utilities**
   - Add helper methods for migrating from direct Supabase access
   - Provide examples in documentation

2. **Run Architecture Validation**
   - Run the validation script to ensure no duplicate implementations
   - Fix any remaining issues

### Phase 4: Cleanup (Final Sprint)

1. **Remove Compatibility Layers**
   - Once all code has migrated, remove the compatibility methods
   - Keep only the Unix-style database access

2. **Final Validation**
   - Run architecture validation again
   - Ensure all duplicate implementations are gone

## Implementation Details

### Merging Strategy

When consolidating the implementations:

1. **Keep the original file name** (`gameRules.api.ts`)
2. **Implement Unix architecture internally** while maintaining the original API
3. **Use delegation pattern** to avoid duplicating logic
4. **Gradually deprecate** methods that don't follow Unix principles

### Naming Convention

After consolidation, we will have:
- ✅ One class named `GameRulesAPI`
- ✅ No "Enhanced" prefixes
- ✅ No "New" suffixes
- ✅ No version numbers

## Success Criteria

1. Only one implementation class for database access
2. No methods that directly expose Supabase client
3. All database access follows Unix architecture principles
4. All automated architecture validations pass
5. Documentation clearly explains the canonical usage pattern