<script lang="ts">
	import { getCharacter, updateHP } from '$lib/state/characterStore.svelte';

	let { characterId } = $props<{ characterId: number }>();

	// A derived store that references the "live" character object
	let character = $derived(() => getCharacter(characterId));

	// Shorthand derived references
	let currentHp = $derived(character.current_hp);
	let maxHp = $derived(character.max_hp);

	// Local states
	let sliderValue = $state<number>(currentHp);
	let isSliding = $state(false);

	let updateState = $state<UpdateState>({
		status: 'idle',
		error: null
	});

	// If the user isn't currently dragging the slider,
	// keep sliderValue synced to currentHp
	$effect(() => {
		if (!isSliding) {
			sliderValue = currentHp;
		}
	});

	// Derived percentage
	let hpPercentage = $derived(maxHp === 0 ? 0 : Math.round((sliderValue / maxHp) * 100));

	// Quick actions remain the same
	let quickActions = $state([
		{ amount: -5, label: '-5', class: 'text-accent hover:bg-accent/10' },
		{ amount: -1, label: '-1', class: 'text-accent hover:bg-accent/10' },
		{ amount: 1, label: '+1', class: 'text-green-600 hover:bg-green-50' },
		{ amount: 5, label: '+5', class: 'text-green-600 hover:bg-green-50' }
	]);

	function getHPColor(percentage: number): string {
		if (percentage <= 20) return 'bg-red-500';
		if (percentage <= 40) return 'bg-orange-500';
		if (percentage <= 60) return 'bg-yellow-500';
		if (percentage <= 80) return 'bg-emerald-500';
		return 'bg-green-500';
	}

	async function handleQuickUpdate(amount: number) {
		// New HP, clamped between 0 and max
		const newValue = Math.max(0, Math.min(maxHp, currentHp + amount));
		if (newValue === currentHp) return;

		const previousValue = currentHp;

		await executeUpdate({
			key: `hp-${characterId}`,
			status: updateState,
			operation: () => updateHP(characterId, newValue),
			optimisticUpdate: () => {
				character.current_hp = newValue;
			},
			rollback: () => {
				character.current_hp = previousValue;
			}
		});
	}

	async function handleSliderUpdate(newValue: number) {
		if (newValue === currentHp) return;

		const previousValue = currentHp;
		await executeUpdate({
			key: `hp-${characterId}`,
			status: updateState,
			operation: () => updateHP(characterId, newValue),
			optimisticUpdate: () => {
				character.current_hp = newValue;
			},
			rollback: () => {
				character.current_hp = previousValue;
			}
		});
	}
</script>

<div class="card space-y-6" class:shadow-accent-20={updateState.status === 'error'}>
	<div class="flex items-center justify-between">
		<h2 class="text-xl font-bold text-primary">Hit Points</h2>
		<div class="text-ink-light text-sm">Maximum: {maxHp}</div>
	</div>

	<!-- HP Bar and Slider Container -->
	<div class="relative h-4">
		<!-- Background Track -->
		<div class="absolute inset-0 rounded-full bg-gray-100">
			<!-- HP Bar -->
			<div
				class="h-full rounded-full {getHPColor(hpPercentage)}"
				style="width: {hpPercentage}%"
			></div>
		</div>

		<!-- Slider (hidden overlay) -->
		<input
			type="range"
			min="0"
			max={maxHp}
			value={sliderValue}
			class="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0"
			style="-webkit-appearance: none; appearance: none;"
			oninput={(e) => {
				sliderValue = parseInt(e.currentTarget.value);
				isSliding = true;
			}}
			onchange={() => {
				isSliding = false;
				handleSliderUpdate(sliderValue);
			}}
			disabled={updateState.status === 'syncing'}
		/>
	</div>

	<!-- Quick Actions -->
	<div class="grid grid-cols-4 gap-3">
		{#each quickActions as { amount, label, class: buttonClass }}
			{@const isDisabled =
				updateState.status === 'syncing' || (amount < 0 ? sliderValue <= 0 : sliderValue >= maxHp)}
			<button
				class="interactive focus-ring rounded-lg border-2 border-transparent
                       bg-white/50 py-3 font-medium shadow-sm backdrop-blur-sm
                       {buttonClass} {isDisabled ? 'cursor-not-allowed opacity-50' : ''}"
				onclick={() => handleQuickUpdate(amount)}
				disabled={isDisabled}
			>
				{label}
			</button>
		{/each}
	</div>

	<!-- Current HP Display -->
	<div class="flex items-baseline justify-center gap-2">
		<div class="text-4xl font-bold text-primary">{sliderValue}</div>
		<div class="text-ink-light text-xl">/ {maxHp}</div>
	</div>

	{#if updateState.status === 'error'}
		<div class="bg-accent/10 text-accent rounded-md p-3 text-sm">
			Failed to update HP. Please try again.
		</div>
	{/if}
</div>
