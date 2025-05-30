# Vardon Type System

This directory contains TypeScript type definitions for the Vardon application.

## Supabase Types

The `supabase.ts` file contains type definitions for the Supabase database schema. These types are generated from the database schema and provide type safety for database operations.

### Key Types

- `Tables<T>`: Generic type for accessing table row types
- `TablesInsert<T>`: Generic type for table insert operations
- `TablesUpdate<T>`: Generic type for table update operations

### Character Types

The most important types for the application are:

- `Character`: Base character information
- `CompleteCharacter`: Complete character data with all relationships

### Usage

```typescript
import { Character, CompleteCharacter } from '../types/supabase';

// Type-safe character access
const character: CompleteCharacter = await databaseDriver.getCharacterById(1);

// Type-safe access to character attributes
console.log(character.name);
console.log(character.game_character_ability.map(a => a.ability.name));
```

## Regenerating Types

To regenerate the types from the database schema, run:

```bash
npx supabase gen types typescript --local > database.types.ts
```

This will update the types based on the current database schema.

## Type Safety Best Practices

1. Always use type imports: `import type { Character } from '../types/supabase'`
2. Prefer specific types over `any`
3. Use the helper types (`Tables<>`, etc.) for working with database entities
4. When making database queries, specify the return type explicitly:
   ```typescript
   const result: Character = await supabase.from('game_character').select('*').eq('id', 1).single();
   ```

## Unix Architecture Integration

These types are designed to work with the Unix-style filesystem architecture. The filesystem capabilities use these types to represent files in the virtual filesystem.