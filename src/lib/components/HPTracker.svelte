<script lang="ts">
	let { currentHP = $bindable(0), maxHP, onUpdate } = $props<{
		currentHP: number;
		maxHP: number;
		onUpdate: (hp: number) => Promise<void>;
	}>();

	let isEditing = $state(false);
	let inputValue = $state(currentHP);

	// Update input value when currentHP changes
	$effect(() => {
		inputValue = currentHP;
	});

	async function handleQuickUpdate(amount: number) {
		const newValue = Math.max(0, Math.min(maxHP, currentHP + amount));
		if (newValue === currentHP) return;

		// Optimistically update local state
		const previousValue = currentHP;
		currentHP = newValue;

		try {
			await onUpdate(newValue);
		} catch (error) {
			// Revert on failure
			currentHP = previousValue;
			console.error('Failed to update HP:', error);
		}
	}

	function handleInputChange(value: string) {
		const newValue = Math.max(0, Math.min(maxHP, parseInt(value) || 0));
		inputValue = newValue;
	}

	async function handleInputBlur() {
		isEditing = false;
		if (inputValue === currentHP) return;

		const previousValue = currentHP;
		currentHP = inputValue;

		try {
			await onUpdate(inputValue);
		} catch (error) {
			currentHP = previousValue;
			console.error('Failed to update HP:', error);
		}
	}

	async function handleHeal(type: 'potion' | 'cure-light') {
		const roll = () => Math.floor(Math.random() * 8) + 1;
		const healing = type === 'potion' ? roll() + 1 : roll() + 5;
		const newValue = Math.min(maxHP, currentHP + healing);

		// Optimistically update
		const previousValue = currentHP;
		currentHP = newValue;

		try {
			await onUpdate(newValue);
		} catch (error) {
			currentHP = previousValue;
			console.error('Failed to heal:', error);
		}
	}

	// Complex derivations using $derived.by
	let hpStats = $derived.by(() => {
		const percentage = (currentHP / maxHP) * 100;
		const color =
			percentage > 75 ? 'bg-green-100' : percentage > 25 ? 'bg-yellow-100' : 'bg-red-100';

		return {
			percentage,
			color
		};
	});

	function focusInput(node: HTMLInputElement) {
		node.focus();
		return {
			destroy: () => {}
		};
	}

	// Quick action buttons configuration
	const quickActions = $state.raw([
		{ amount: -1, label: '-1' },
		{ amount: -5, label: '-5' },
		{ amount: 1, label: '+1' },
		{ amount: 5, label: '+5' }
	]);

	// Healing options configuration
	const healingOptions = $state.raw([
		{ type: 'potion' as const, label: 'Use Potion (1d8+1)' },
		{ type: 'cure-light' as const, label: 'Cure Light (1d8+5)' }
	]);
</script>

<div class="card {hpStats.color} transition-colors duration-300">
	<h2 class="mb-2 font-bold">Hit Points</h2>

	<!-- Quick Actions -->
	<div class="mb-4 grid grid-cols-4 gap-2">
		{#each quickActions as { amount, label }}
			<button
				class="btn btn-secondary px-3 py-1 text-sm"
				onclick={() => handleQuickUpdate(amount)}
				disabled={amount < 0 ? currentHP <= 0 : currentHP >= maxHP}
			>
				{label}
			</button>
		{/each}
	</div>

	<!-- HP Display/Edit -->
	<div class="flex flex-col items-center gap-2 sm:flex-row">
		<div class="flex items-center gap-2">
			{#if isEditing}
				<input
					type="number"
					class="input w-20 text-center"
					value={inputValue}
					min="0"
					max={maxHP}
					oninput={(e) => handleInputChange(e.currentTarget.value)}
					onblur={handleInputBlur}
					use:focusInput
				/>
			{:else}
				<button
					class="rounded px-2 py-1 text-2xl font-bold hover:bg-gray-100
                           focus:outline-none focus:ring-2 focus:ring-primary/50"
					onclick={() => (isEditing = true)}
				>
					{currentHP}
				</button>
			{/if}
			<span class="text-gray-600">/ {maxHP}</span>
		</div>

		<div class="h-2 w-full overflow-hidden rounded-full bg-gray-200">
			<div
				class="h-full bg-primary transition-all duration-300"
				style="width: {hpStats.percentage}%"
				role="progressbar"
				aria-valuenow={currentHP}
				aria-valuemin="0"
				aria-valuemax={maxHP}
			></div>
		</div>
	</div>

	<!-- Healing Shortcuts -->
	<div class="mt-4 flex flex-wrap gap-2 text-sm">
		{#each healingOptions as { type, label }}
			<button
				class="rounded px-2 py-1 text-primary hover:underline 
                       focus:outline-none focus:ring-2 focus:ring-primary/50"
				onclick={() => handleHeal(type)}
			>
				{label}
			</button>
		{/each}
	</div>
</div>