# CharacterLoader Migration Guide

## Overview

The CharacterLoader component has been refactored to follow the "do one thing well" principle by extracting business logic into separate service classes.

## Changes Made

### 1. Extracted Services

- **CharacterLoadingService**: Handles the core character loading logic
- **ResourceWatcher**: Monitors resource availability
- **LoaderStateMachine**: Manages component state transitions

### 2. Benefits

- **Separation of Concerns**: UI logic is now separate from business logic
- **Testability**: Services can be unit tested independently
- **Reusability**: Services can be used in other components or contexts
- **Maintainability**: Each service has a single, clear responsibility

### 3. Migration Steps

To migrate from the old CharacterLoader to the refactored version:

1. Replace imports:

```typescript
// Old
import CharacterLoader from '$lib/ui/CharacterLoader.svelte';

// New
import CharacterLoader from '$lib/ui/CharacterLoaderRefactored.svelte';
```

2. The component API remains the same:

```svelte
<CharacterLoader {characterId} {kernel} {preloadedData} debug={true}>
	<!-- Your character UI here -->
</CharacterLoader>
```

3. If you were accessing internal methods or state, refactor to use the services directly:

```typescript
import { CharacterLoadingService } from '$lib/services';

const loadingService = new CharacterLoadingService(kernel);
const character = await loadingService.loadCharacter(characterId);
```

### 4. Testing

The new services can be tested independently:

```typescript
// Test CharacterLoadingService
const mockKernel = createMockKernel();
const service = new CharacterLoadingService(mockKernel);
const character = await service.loadCharacter(123);
expect(character.id).toBe(123);

// Test ResourceWatcher
const watcher = new ResourceWatcher(mockKernel);
const available = watcher.checkResourcesAvailable();
expect(available).toBe(true);

// Test LoaderStateMachine
const stateMachine = new LoaderStateMachine();
stateMachine.transitionToLoading();
expect(stateMachine.getState()).toBe('loading');
```

### 5. Customization

If you need custom behavior, you can:

1. Extend the services:

```typescript
class CustomCharacterLoadingService extends CharacterLoadingService {
	async loadCharacter(id: number): Promise<AssembledCharacter> {
		// Custom logic here
		return super.loadCharacter(id);
	}
}
```

2. Create your own component using the services:

```svelte
<script lang="ts">
	import { CharacterLoadingService } from '$lib/services';

	const service = new CharacterLoadingService(kernel);
	// Custom component logic
</script>
```

## File Structure

- `/src/lib/ui/CharacterLoader.svelte` - Original component (kept for compatibility)
- `/src/lib/ui/CharacterLoaderRefactored.svelte` - New clean component
- `/src/lib/services/CharacterLoadingService.ts` - Character loading logic
- `/src/lib/services/ResourceWatcher.ts` - Resource monitoring
- `/src/lib/services/LoaderStateMachine.ts` - State management
