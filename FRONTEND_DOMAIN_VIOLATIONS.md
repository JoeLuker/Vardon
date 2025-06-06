# Frontend Domain Layer Violations

This document summarizes violations found in the frontend code where UI components bypass or conflict with the domain layer architecture.

## 1. Direct Database Access

### QueryDatabase.svelte
- **Violation**: Directly imports and uses `supabaseClient` to query tables
- **Location**: `/src/lib/ui/QueryDatabase.svelte`
- **Details**: 
  - Uses `supabaseClient.from('game_character').select('*')` and similar direct queries
  - Completely bypasses the Unix file system abstraction
  - No use of kernel or domain layer APIs

## 2. Business Logic in UI Components

### AbilityScores.svelte
- **Violation**: Calculates ability modifiers directly in the UI
- **Location**: `/src/lib/ui/AbilityScores.svelte`
- **Details**:
  - Line 99: `const modifier = Math.floor((totalValue - 10) / 2);`
  - Hardcodes racial modifiers for Tengu ancestry
  - Implements ABP bonus calculations locally
  - Should use domain layer calculations

### Saves.svelte
- **Violation**: Calculates save modifiers and totals in the UI
- **Location**: `/src/lib/ui/Saves.svelte`
- **Details**:
  - Lines 71, 86, 101: `Math.floor((base - 10) / 2)` for ability modifiers
  - Manually calculates total saves instead of using domain layer
  - Duplicates logic that should be in capability layer

### ABPDisplay.svelte
- **Violation**: Contains ABP level progression logic
- **Location**: `/src/lib/ui/ABPDisplay.svelte`
- **Details**:
  - Lines 3-6: `getNextABPLevel` function with hardcoded ABP levels
  - This game rule data should come from the domain layer

## 3. Direct Browser Storage Access

### CharacterLoader.svelte
- **Violation**: Directly uses localStorage
- **Location**: `/src/lib/ui/CharacterLoader.svelte`
- **Details**:
  - Line 599: `localStorage.removeItem('waitingStartTime');`
  - Should use kernel's storage abstraction if needed

## 4. Improper Data Structure Usage

### Multiple Components
- **Violation**: Import database types directly
- **Files**: Skills.svelte, HPTracker.svelte, CharacterPage.svelte, Feats.svelte
- **Details**:
  - Import `GameRules` type from `$lib/db/gameRules.api`
  - Should only use domain layer types

## 5. Components Not Following Unix Architecture

### HPTracker.svelte
- **Violation**: Has TODO comments indicating incomplete implementation
- **Location**: `/src/lib/ui/HPTracker.svelte`
- **Details**:
  - Line 79: "TODO: Calculate max HP properly based on class, level, CON, etc"
  - Line 97: "TODO: Save to database"
  - Not using kernel file operations for persistence

## Summary of Issues

1. **Direct Database Access**: UI components should never directly access Supabase or any database. All data access must go through the kernel's file system abstraction.

2. **Business Logic Duplication**: Game rules calculations (ability modifiers, save calculations, ABP progressions) are implemented in UI components instead of using the domain layer capabilities.

3. **Storage Bypass**: Direct use of browser storage APIs instead of kernel abstractions.

4. **Type Violations**: UI components importing database-layer types instead of domain-layer types.

5. **Incomplete Implementations**: Several components have TODO comments indicating they're not properly integrated with the domain layer.

## Recommended Actions

1. Remove all direct database access from UI components
2. Move all game rule calculations to appropriate capabilities in the domain layer
3. Replace browser storage access with kernel storage operations
4. Update all imports to use only domain layer types
5. Complete the Unix architecture integration for all UI components

## Affected Files

- `/src/lib/ui/QueryDatabase.svelte` - Critical violation (direct DB access)
- `/src/lib/ui/AbilityScores.svelte` - Business logic violation
- `/src/lib/ui/Saves.svelte` - Business logic violation
- `/src/lib/ui/ABPDisplay.svelte` - Game rules in UI
- `/src/lib/ui/CharacterLoader.svelte` - Storage bypass
- `/src/lib/ui/HPTracker.svelte` - Incomplete implementation
- `/src/lib/ui/Skills.svelte` - Type import violation
- `/src/lib/ui/CharacterPage.svelte` - Type import violation
- `/src/lib/ui/Feats.svelte` - Type import violation
- `/src/routes/database/+page.svelte` - Uses QueryDatabase component