# Frontend-Domain Conflicts

This document lists all conflicts where the frontend violates domain principles or reimplements domain logic.

## Critical Violations

### 1. Direct Database Access

**File**: `src/lib/ui/QueryDatabase.svelte`
**Violation**: Directly uses Supabase client, bypassing the Unix file system abstraction
```typescript
// WRONG: Direct database access
const { data: characters, error } = await supabaseClient
  .from('game_character')
  .select('*');
```
**Should Use**: Kernel file operations through `/v_proc/character/list`

### 2. Business Logic Duplication

**File**: `src/lib/ui/AbilityScores.svelte`
**Violations**:
- Calculates ability modifiers directly: `Math.floor((totalValue - 10) / 2)`
- Hardcodes racial modifiers for Tengu
- Manually processes ABP bonuses

**Should Use**: `AbilityService.getScore()` or AbilityCapability through kernel

**File**: `src/lib/ui/Saves.svelte`
**Violations**:
- Manually calculates save bonuses
- Duplicates save calculation logic
- Directly accesses character data structure

**Should Use**: CombatCapability through kernel file operations

**File**: `src/lib/ui/ACStats.svelte`
**Violations**:
- Calculates AC manually
- Hardcodes armor and shield bonuses
- Duplicates combat calculation logic

**Should Use**: CombatCapability for AC calculations

### 3. Direct Storage Access

**File**: `src/lib/ui/CharacterLoader.svelte`
**Violation**: Uses localStorage directly
```typescript
localStorage.removeItem('waitingStartTime');
```
**Should Use**: Kernel file operations to `/v_var/` or similar persistent storage

### 4. Hardcoded Game Data

**File**: `src/lib/ui/ABPDisplay.svelte`
**Violation**: Contains hardcoded ABP progression data
```typescript
const abpLevels = [
  { level: 3, type: 'resistance', value: 1 },
  { level: 4, type: 'armor_attunement', value: 1 },
  // ... more hardcoded data
];
```
**Should Use**: Load from `/v_etc/schema/abp/progression` or similar

### 5. Type Violations

Multiple files import database types directly:
```typescript
import type { GameCharacter } from '$lib/db/gameRules.api';
```
**Should Use**: Domain layer types from `$lib/domain/exports`

### 6. Incomplete Implementations

**File**: `src/lib/ui/HPTracker.svelte`
**Issue**: Has TODO comments indicating it's not integrated with domain
```typescript
// TODO: Implement actual HP tracking logic
// This should integrate with the character's combat stats
```

### 7. Direct API Usage

**File**: `src/lib/ui/CharacterLoader.svelte`
**Violation**: While it uses the kernel, it sometimes falls back to direct API calls in error cases

## Domain Principles Being Violated

1. **Everything is a File**: UI should access all data through kernel file operations
2. **Single Source of Truth**: Business logic should only exist in domain capabilities
3. **No Direct Database Access**: All data access must go through the Unix abstraction
4. **Type Safety**: UI should use domain types, not database types
5. **Capability-Based Design**: All operations should go through appropriate capabilities

## Recommended Fixes

1. Replace all Supabase client usage with kernel file operations
2. Remove all business logic from UI components
3. Create proper view models that use domain services
4. Replace hardcoded data with schema loading from kernel
5. Update all type imports to use domain types
6. Complete the integration of incomplete components

## Impact

These violations:
- Break the Unix architecture principle
- Create maintenance issues with duplicated logic
- Make testing difficult
- Violate the separation of concerns
- Create potential data inconsistencies