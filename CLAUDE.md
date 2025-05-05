# Vardon Code Quality Guidelines

This document outlines the key coding standards and patterns to maintain when working on the Vardon codebase. Following these guidelines will help prevent common issues and ensure the UNIX architectural principles are properly implemented.

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

If you need direct access to the Supabase client, use the accessor method:

```typescript
// ✅ CORRECT
const supabase = gameRulesAPI.getSupabaseClient();
const { data } = await supabase.from('some_table').select('*');
```

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

## UNIX Architecture Principles

1. Make each program do one thing well
2. Expect the output of every program to become the input to another program
3. Design and build software to be tried early
4. Use tools in preference to unskilled help to lighten a programming task

### Component Boundaries

- Each component should have a clear, well-defined interface
- Components should communicate through these interfaces, not internal implementation details
- Always respect encapsulation - do not access private properties or methods

### Error Handling

- Handle errors consistently across similar methods
- Provide informative error messages that help with debugging
- Use appropriate error types depending on the source of the error

## ESLint and TypeScript Configuration

The project is set up with ESLint and TypeScript configurations that help enforce these rules. Always run linting before committing:

```bash
npm run lint
```

## Preventing Circular Dependencies

- Keep dependency direction consistent
- Use dependency injection to decouple modules
- Consider using interfaces or abstract base classes as dependency boundaries

## Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| "Class extends value undefined is not a constructor" | Check import statements - ensure you're importing classes with regular imports, not type imports |
| "The requested module does not provide an export named X" | Ensure the module actually exports what you're trying to import. Check for `export type` vs `export` |
| "Cannot access X before initialization" | Check for circular dependencies. Try refactoring into smaller, more focused modules |
| "TypeError: X is not a function" | Verify method names and signatures. Use VSCode IntelliSense to check available methods |