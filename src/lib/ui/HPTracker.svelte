<!-- FILE: src/lib/ui/HPTracker.svelte -->
<script lang="ts">
	// UI components
	import { Button } from '$lib/components/ui/button';
	import { Progress } from '$lib/components/ui/progress';

	// File system imports
	import type { GameKernel } from '$lib/domain/kernel/GameKernel';
	import { ErrorCode } from '$lib/domain/kernel/ErrorHandler';
	import {
		PATHS,
		ensureCharacterParentDirectoriesExist,
		fixCharacterPath
	} from '$lib/domain/utils/FilesystemUtils';

	const COMBAT_REQUEST = {
		GET_CURRENT_HP: 0x1001,
		GET_MAX_HP: 0x1002,
		SET_CURRENT_HP: 0x1003
	};

	// File operations
	const OpenMode = {
		READ: 0x01,
		WRITE: 0x02,
		READ_WRITE: 0x03
	};

	/**
	 * Component props
	 */
	let { character = null, kernel = null } = $props<{
		character: any;
		kernel: GameKernel | null;
	}>();

	/**
	 * Svelte 5 local state
	 */
	let current_hp = $state(0);
	let max_hp = $state(0);
	let isSliding = $state(false);
	let sliderValue = $state(0);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let updateStatus = $state<'idle' | 'syncing' | 'error'>('idle');
	let errorMessage = $state<string | null>(null);

	/**
	 * Derived variables for HP
	 */
	let hpPercentage = $derived.by(() => {
		if (max_hp === 0) return 0;
		return Math.round((sliderValue / max_hp) * 100);
	});

	/**
	 * Load HP data when component mounts
	 */
	$effect(() => {
		if (kernel && character) {
			loadHPData();
		}
	});

	/**
	 * File operation to load HP data
	 */
	async function loadHPData() {
		isLoading = true;
		error = null;

		// Clear any pending values
		pendingHP = null;
		if (updateTimer) clearTimeout(updateTimer);

		// Ensure parent directories exist and character paths are files, not directories
		if (!ensureCharacterParentDirectoriesExist(kernel, character.id)) {
			error = 'Failed to ensure parent directories exist';
			isLoading = false;
			return;
		}

		// Fix character path in case it was incorrectly created as a directory
		fixCharacterPath(kernel, character.id);

		// Get entity path for current character
		const entityPath = `${PATHS.PROC_CHARACTER}/${character.id}`;

		// Open combat device
		const fd = kernel.open(PATHS.DEV_COMBAT, OpenMode.READ_WRITE);
		if (fd < 0) {
			error = `Failed to open combat device: error ${fd}`;
			isLoading = false;
			return;
		}

		try {
			// Get current HP
			const currentHPResult = kernel.ioctl(fd, COMBAT_REQUEST.GET_CURRENT_HP, {
				entityPath
			});

			if (currentHPResult !== ErrorCode.SUCCESS) {
				error = `Failed to get current HP: ${currentHPResult}`;
				isLoading = false;
				return;
			}

			// Get max HP
			const maxHPResult = kernel.ioctl(fd, COMBAT_REQUEST.GET_MAX_HP, {
				entityPath
			});

			if (maxHPResult !== ErrorCode.SUCCESS) {
				error = `Failed to get max HP: ${maxHPResult}`;
				isLoading = false;
				return;
			}

			// Read the HP data from the file descriptor
			const [readResult, hpData] = kernel.read(fd);
			
			if (readResult !== ErrorCode.SUCCESS) {
				error = `Failed to read HP data: ${readResult}`;
				isLoading = false;
				return;
			}

			// Update local state
			current_hp = hpData.current_hp || 0;
			max_hp = hpData.max_hp || 0;
			sliderValue = current_hp;
		} finally {
			// Always close the file descriptor
			if (fd > 0) kernel.close(fd);
			isLoading = false;
		}
	}

	/**
	 * Unix-style file operation to update HP
	 */
	async function updateHP(newHP: number) {
		if (!kernel || !character) {
			throw new Error('Kernel or character not available');
		}

		// Ensure parent directories exist and character paths are files, not directories
		if (!ensureCharacterParentDirectoriesExist(kernel, character.id)) {
			throw new Error('Failed to ensure parent directories exist');
		}

		// Fix character path in case it was incorrectly created as a directory
		fixCharacterPath(kernel, character.id);

		const entityPath = `${PATHS.PROC_CHARACTER}/${character.id}`;

		// Open combat device
		const fd = kernel.open(PATHS.DEV_COMBAT, OpenMode.READ_WRITE);
		if (fd < 0) {
			throw new Error(`Failed to open combat device: error ${fd}`);
		}

		try {
			// Update current HP
			const updateResult = kernel.ioctl(fd, COMBAT_REQUEST.SET_CURRENT_HP, {
				entityPath,
				value: newHP
			});

			if (updateResult.errorCode !== ErrorCode.SUCCESS) {
				throw new Error(`Failed to update HP: ${updateResult.errorMessage}`);
			}

			// Update local state on success
			current_hp = newHP;
		} finally {
			// Always close the file descriptor
			if (fd > 0) kernel.close(fd);
		}
	}

	/**
	 * Only sync with current_hp if:
	 * 1. We're not sliding
	 * 2. There's no pending update
	 * 3. We're not currently syncing with the system
	 */
	$effect(() => {
		if (!isSliding && pendingHP === null && updateStatus !== 'syncing') {
			sliderValue = current_hp;
		}
	});

	/**
	 * Debounce approach for HP updates
	 */
	let updateTimer: ReturnType<typeof setTimeout> | null = null;
	let pendingHP: number | null = null;
	const DEBOUNCE_MS = 400;

	/**
	 * queueHPUpdate:
	 * - sets pendingHP
	 * - applies local optimistic UI
	 * - schedules flush with setTimeout
	 */
	function queueHPUpdate(newHP: number) {
		const boundedHP = Math.max(0, Math.min(max_hp, newHP));

		// Save to pending
		pendingHP = boundedHP;

		// Clear any existing timer
		if (updateTimer) clearTimeout(updateTimer);

		// Start new timer
		updateTimer = setTimeout(flushPending, DEBOUNCE_MS);

		// Update local UI immediately
		sliderValue = boundedHP;
	}

	/**
	 * flushPending: does the actual system update
	 */
	async function flushPending() {
		if (pendingHP === null) return;

		try {
			updateStatus = 'syncing';
			await updateHP(pendingHP);
			updateStatus = 'idle';
		} catch (err) {
			console.error('Failed HP update:', err);
			updateStatus = 'error';
			errorMessage = 'Failed to update HP. Please try again.';
		} finally {
			pendingHP = null;
			updateTimer = null;
		}
	}

	/**
	 * Handle slider changes directly
	 */
	function handleSliderChange(e: Event) {
		isSliding = false;
		const newValue = +(e.target as HTMLInputElement).value;
		queueHPUpdate(newValue);
	}

	/**
	 * Quick actions handler (for buttons)
	 */
	function handleQuickAction(amount: number) {
		queueHPUpdate(sliderValue + amount);
	}

	/**
	 * Quick actions for +/- HP
	 */
	const quickActions = [
		{ amount: -5, label: '-5', variant: 'destructive' as const },
		{ amount: -1, label: '-1', variant: 'destructive' as const },
		{ amount: 1, label: '+1', variant: 'default' as const },
		{ amount: 5, label: '+5', variant: 'default' as const }
	];
</script>

<!-- Template -->
{#if isLoading}
	<div class="card animate-pulse space-y-6">
		<h2 class="section-title">Hit Points</h2>
		<div class="h-4 rounded bg-muted"></div>
		<div class="grid grid-cols-4 gap-3">
			{#each Array(4) as _}
				<div class="h-9 rounded bg-muted"></div>
			{/each}
		</div>
		<div class="flex items-baseline justify-center gap-2">
			<div class="h-10 w-16 rounded bg-muted"></div>
		</div>
	</div>
{:else if error}
	<div class="card space-y-6 border-destructive">
		<h2 class="section-title">Hit Points</h2>
		<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
			{error}
		</div>
		<Button variant="outline" onclick={loadHPData}>Retry</Button>
	</div>
{:else}
	<div class="card space-y-6" class:border-destructive={updateStatus === 'error'}>
		<h2 class="section-title">Hit Points</h2>

		<!-- HP bar + slider -->
		<div class="relative h-4">
			<Progress value={hpPercentage} class="h-full" />
			<input
				type="range"
				class="absolute inset-0 w-full cursor-pointer opacity-0"
				max={max_hp}
				min={0}
				value={sliderValue}
				oninput={(e) => {
					sliderValue = +(e.target as HTMLInputElement).value;
					isSliding = true;
				}}
				onchange={handleSliderChange}
			/>
		</div>

		<!-- Quick action buttons -->
		<div class="grid grid-cols-4 gap-3">
			{#each quickActions as { amount, label, variant }}
				<Button
					{variant}
					size="sm"
					disabled={amount < 0 ? sliderValue <= 0 : sliderValue >= max_hp}
					onclick={() => handleQuickAction(amount)}
				>
					{label}
				</Button>
			{/each}
		</div>

		<!-- HP readout -->
		<div class="flex items-baseline justify-center gap-2">
			<span class="text-4xl font-bold">{sliderValue}</span>
			<span class="text-xl text-muted-foreground">/ {max_hp}</span>
		</div>

		<!-- Error message -->
		{#if updateStatus === 'error' && errorMessage}
			<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
				{errorMessage}
			</div>
		{/if}
	</div>
{/if}
