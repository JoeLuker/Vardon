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
	 * If user isn't currently dragging the slider, mirror sliderValue to the 
	 * character's currentHp. That way if watchers or something else updates HP,
	 * we revert to the newly-fetched value.
	 */
	$effect(() => {
		if (!isSliding) sliderValue = currentHp;
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

		// 1) local optimistic UI
		character = {
			...character,
			current_hp: Math.max(0, Math.min(maxHp, newHP))
		};

		// 2) keep track for debounced flush
		pendingHP = character.current_hp;

		// 3) schedule flush
		if (updateTimer) clearTimeout(updateTimer);
		updateTimer = setTimeout(flushPending, DEBOUNCE_MS);
	}

	/**
	 * flushPending: does the actual DB update
	 */
	async function flushPending() {
		if (!character || pendingHP === null) return;

		try {
			updateStatus = 'syncing';

			// Actually do DB update
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
	 * When user drags the slider or hits quick actions:
	 */
	async function handleUpdate(newValue: number) {
		if (!character || newValue === currentHp) return;

		queueHPUpdate(newValue);
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
				disabled={updateStatus === 'syncing'}
				oninput={(e) => {
					sliderValue = +(e.target as HTMLInputElement).value;
					isSliding = true;
				}}
				onchange={(e) => {
					isSliding = false;
					handleUpdate(+(e.target as HTMLInputElement).value);
				}}
			/>
		</div>

		<!-- Quick action buttons -->
		<div class="grid grid-cols-4 gap-3">
			{#each quickActions as { amount, label, variant }}
				<Button
					{variant}
					size="sm"
					disabled={
						updateStatus === 'syncing' ||
						(amount < 0 ? sliderValue <= 0 : sliderValue >= maxHp)
					}
					onclick={() => handleUpdate(currentHp + amount)}
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
