<!-- FILE: src/lib/ui/HPTracker.svelte (Svelte 5 runes version) -->
<script lang="ts">
	// UI
	import { Button } from '$lib/components/ui/button';
	import { Progress } from '$lib/components/ui/progress';
	// Types
	import type { EnrichedCharacter } from '$lib/domain/characterCalculations';

	/**
	 * Props:
	 * - character: The character data (maybe null if loading)
	 * - onUpdateDB: Callback that actually writes to the DB (like gameCharacterApi.updateRow)
	 */
	let { character, onUpdateDB = async (_changes: Partial<EnrichedCharacter>) => {} } = $props<{
		character?: EnrichedCharacter | null;
		onUpdateDB?: (changes: Partial<EnrichedCharacter>) => Promise<void>;
	}>();

	/**
	 * Svelte 5 local state
	 */
	let isSliding = $state(false);
	let sliderValue = $state<number>(0);

	let updateStatus = $state<'idle' | 'syncing' | 'error'>('idle');
	let errorMessage = $state<string | null>(null);

	/**
	 * Derived variables for HP
	 */
	let currentHp = $derived.by(() => {
		return Number(character?.current_hp ?? 0);
	});
	let maxHp = $derived.by(() => {
		return Number(character?.max_hp ?? 0);
	});
	let hpPercentage = $derived.by(() => {
		if (maxHp === 0) return 0;
		return Math.round((sliderValue / maxHp) * 100);
	});

	/**
	 * Only sync with database value if:
	 * 1. We're not sliding
	 * 2. There's no pending update
	 * 3. We're not currently syncing with the DB
	 */
	$effect(() => {
		if (!isSliding && pendingHP === null && updateStatus !== 'syncing') {
			sliderValue = currentHp;
		}
	});

	/**
	 * We also want a 'debounce' approach, so if the user drags the slider multiple 
	 * times quickly, we only do one DB update after they've settled on a final value.
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
		if (!character) return;

		const boundedHP = Math.max(0, Math.min(maxHp, newHP));
		
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
	 * flushPending: does the actual DB update
	 */
	async function flushPending() {
		if (!character || pendingHP === null) return;

		try {
			updateStatus = 'syncing';
			await onUpdateDB({ current_hp: pendingHP });
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
{#if !character}
	<div class="card">
		<p class="text-muted-foreground">Loading HP data...</p>
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
				max={maxHp}
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
					disabled={amount < 0 ? sliderValue <= 0 : sliderValue >= maxHp}
					onclick={() => handleQuickAction(amount)}
				>
					{label}
				</Button>
			{/each}
		</div>

		<!-- HP readout -->
		<div class="flex items-baseline justify-center gap-2">
			<span class="text-4xl font-bold">{sliderValue}</span>
			<span class="text-xl text-muted-foreground">/ {maxHp}</span>
		</div>

		<!-- Error message -->
		{#if updateStatus === 'error' && errorMessage}
			<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
				{errorMessage}
			</div>
		{/if}
	</div>
{/if}
