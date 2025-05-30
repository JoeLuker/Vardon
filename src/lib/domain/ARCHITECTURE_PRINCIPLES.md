# Vardon Architecture Principles

## Single Source Principle

> "There should be exactly one way to accomplish each task in the system."

### Enforcement:

1. **Code Reviews**: Every PR must verify it doesn't create a duplicate implementation
2. **Code Ownership**: Each core capability has a designated owner responsible for its coherence
3. **Documentation**: Each capability must have documentation describing the canonical way to use it

## Naming Conventions

1. **No "Enhanced" Prefix**: Never create an "Enhanced" version of an existing component. Instead, improve the original.
2. **No Version Numbers**: Never use "v2" or similar in class names. Versioning belongs in package metadata.
3. **No "New" Suffix**: Never use ".new.ts" files - update the original file instead.

## Refactoring Guidelines

When making significant architectural changes:

1. **In-Place Upgrades**: Refactor the existing implementation rather than creating a parallel one
2. **Deprecation Tags**: Add `@deprecated` JSDoc tags to methods before removing them
3. **Migration Paths**: Always provide a clear migration path before removing functionality
4. **Backwards Compatibility**: Maintain backwards compatibility in the same file when possible

## Implementation Pattern Enforcement

1. **No Two Implementations**: Never have two classes that do the same thing
2. **No Indirection Pattern**: Never have one class fully wrap another - refactor instead
3. **No Branching Imports**: Never let users choose between implementations via imports

## Database Access Principles

1. **Single Entry Point**: All database access goes through one API class
2. **Unix Architecture**: All database operations use file-like operations (open/read/write/close)
3. **Schema Definition**: All database entities have explicit schema descriptors
4. **Resource Cleanup**: All opened resources (file descriptors) must be closed
5. **No Direct DB Access**: Never expose the underlying database client

## How To Fix Violations

If you find code that violates these principles:

1. **Consolidate Implementations**: Merge duplicate implementations into a single canonical version
2. **Remove Indirection**: Remove unnecessary abstraction layers
3. **Rename Classes**: Rename classes to avoid "enhanced" or "new" prefixes/suffixes
4. **Document Canonical Patterns**: Add clear documentation of the correct way to use the API
5. **Add Code Analysis**: Consider adding static analysis checks to prevent regressions

Following these principles will keep the codebase clean, maintainable, and free from the confusion of multiple implementations.