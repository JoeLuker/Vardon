<!-- 
	HPTracker Component - Uses Domain Layer
	HP calculations are handled by the domain CombatService
-->
<script lang="ts">
	// UI components
	import { Button } from '$lib/components/ui/button';
	import { Progress } from '$lib/components/ui/progress';

	// Domain imports
	import type { GameKernel } from '$lib/domain/kernel/GameKernel';
	import type { Entity } from '$lib/domain/kernel/types';
	import { CombatService } from '$lib/domain/services/CombatService';

	/**
	 * Props:
	 * - character: Character entity
	 * - kernel: GameKernel instance
	 */
	let { character = null, kernel = null } = $props<{
		character: Entity | null;
		kernel: GameKernel | null;
	}>();

	/**
	 * Local state
	 */
	let current_hp = $state(0);
	let max_hp = $state(0);
	let isSliding = $state(false);
	let sliderValue = $state(0);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let updateStatus = $state<'idle' | 'syncing' | 'error'>('idle');
	let errorMessage = $state<string | null>(null);

	// Domain service
	let combatService: CombatService | null = null;

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
	 * Load HP data using domain service
	 */
	async function loadHPData() {
		isLoading = true;
		error = null;

		try {
			// Initialize service if needed
			if (!combatService) {
				combatService = new CombatService();
			}

			// Character is passed directly as AssembledCharacter, not wrapped in Entity
			const characterData = character;
			if (!characterData) {
				throw new Error('Character data not available');
			}

			// Get HP from combat service
			const hpData = combatService.getHitPoints(characterData);
			max_hp = hpData.max;
			current_hp = hpData.current;
			sliderValue = current_hp;

			isLoading = false;
		} catch (err) {
			error = `Failed to load HP: ${err instanceof Error ? err.message : String(err)}`;
			isLoading = false;
		}
	}

	/**
	 * Update HP value
	 */
	async function updateHP(newHP: number) {
		if (!character || !kernel) {
			throw new Error('Character or kernel not available');
		}

		try {
			// Update the character's current HP in the entity
			// This would typically involve kernel file operations
			// For now, just update local state
			current_hp = newHP;
			
			// TODO: Save to database through kernel
			// const characterPath = `/proc/character/${character.id}`;
			// const fd = kernel.open(characterPath, OpenMode.READ_WRITE);
			// ... update and save
			
			console.log('HP updated to:', newHP);
		} catch (err) {
			throw new Error(`Failed to update HP: ${err instanceof Error ? err.message : String(err)}`);
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