<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { GameKernel } from '$lib/domain/kernel';
	import type { WebKernel } from '$lib/domain/kernel/WebKernel';
	import type { AssembledCharacter } from '$lib/domain/character/CharacterTypes';
	import {
		CharacterLoadingService,
		ResourceWatcher,
		LoaderStateMachine,
		LoaderState
	} from '$lib/services';
	import { logger } from '$lib/utils/Logger';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
	import { Progress } from '$lib/components/ui/progress';

	// Props
	export let characterId: number;
	export let kernel: GameKernel | WebKernel;
	export let preloadedData: Partial<AssembledCharacter> | undefined = undefined;
	export let debug: boolean = false;

	// Services
	const loadingService = new CharacterLoadingService(kernel, debug);
	const resourceWatcher = new ResourceWatcher(kernel, { debug });
	const stateMachine = new LoaderStateMachine({ debug });

	// Reactive state
	let currentState = $state(stateMachine.getState());
	let character = $state<AssembledCharacter | null>(null);
	let error = $state<Error | null>(null);
	let resourceCheckProgress = $state(0);
	let isError = $derived(currentState === LoaderState.ERROR);
	let isLoaded = $derived(currentState === LoaderState.LOADED);

	// State machine subscription
	const unsubscribeState = stateMachine.onStateChange((newState) => {
		currentState = newState;
	});

	// Load character workflow
	async function loadCharacter() {
		try {
			// Check if resources are available
			if (!resourceWatcher.checkResourcesAvailable()) {
				stateMachine.transitionToWaitingForResources();
				await resourceWatcher.waitForResources();
			}

			// Transition to loading
			stateMachine.transitionToLoading();

			// Load character
			character = await loadingService.loadCharacter(characterId, preloadedData);

			// Log diagnostic info
			if (debug) {
				const diagnosticInfo = loadingService.getDiagnosticInfo(character);
				logger.debug('CharacterLoader', 'loadCharacter', 'Diagnostic info', diagnosticInfo);
			}

			// Transition to loaded
			stateMachine.transitionToLoaded();
		} catch (err) {
			error = err instanceof Error ? err : new Error(String(err));
			stateMachine.transitionToError(error);

			// Check if we can retry
			if (stateMachine.canRetry()) {
				logger.info('CharacterLoader', 'loadCharacter', 'Retrying after error', {
					attempt: stateMachine.getLoadingAttempts()
				});
				// Wait a bit before retrying
				setTimeout(() => loadCharacter(), 1000);
			}
		}
	}

	// Resource check progress animation
	$effect(() => {
		if (currentState === LoaderState.WAITING_FOR_RESOURCES) {
			const interval = setInterval(() => {
				resourceCheckProgress = (resourceCheckProgress + 5) % 100;
			}, 100);
			return () => clearInterval(interval);
		}
	});

	// Initialize on mount
	onMount(() => {
		logger.info('CharacterLoader', 'onMount', 'Starting character load', { characterId });
		loadCharacter();
	});

	// Cleanup on destroy
	onDestroy(() => {
		resourceWatcher.cleanup();
		unsubscribeState();
	});
</script>

{#if isError && error}
	<Alert variant="destructive" class="mb-4">
		<AlertTitle>Error Loading Character</AlertTitle>
		<AlertDescription>
			{error.message}
			{#if stateMachine.canRetry()}
				<p class="mt-2 text-sm">Retrying... (Attempt {stateMachine.getLoadingAttempts()} of 3)</p>
			{/if}
		</AlertDescription>
	</Alert>
{:else if currentState === LoaderState.WAITING_FOR_RESOURCES}
	<div class="space-y-4">
		<Alert>
			<AlertTitle>Initializing Game System</AlertTitle>
			<AlertDescription>Please wait while we set up the character system...</AlertDescription>
		</Alert>
		<Progress value={resourceCheckProgress} class="w-full" />
		<div class="text-sm text-muted-foreground">
			Checking: Character device, Database device, File system...
		</div>
	</div>
{:else if currentState === LoaderState.LOADING}
	<div class="space-y-4">
		<Skeleton class="h-12 w-full" />
		<Skeleton class="h-32 w-full" />
		<Skeleton class="h-24 w-full" />
		<div class="text-center text-sm text-muted-foreground">Loading character data...</div>
	</div>
{:else if isLoaded && character}
	<slot {character} />
{:else}
	<div class="text-center text-muted-foreground">Initializing character loader...</div>
{/if}
