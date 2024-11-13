<!-- src/lib/components/HPTracker.svelte -->
<script lang="ts">
	let { currentHP, maxHP, onUpdate } = $props<{
		currentHP: number;
		maxHP: number;
		onUpdate: (hp: number) => void;
	}>();

	let isEditing = $state(false);
	let inputValue = $state(currentHP);

	$effect(() => {
		inputValue = currentHP;
	});

	function handleQuickUpdate(amount: number) {
		const newValue = Math.max(0, Math.min(maxHP, currentHP + amount));
		if (newValue !== currentHP) {
			onUpdate(newValue);
		}
	}

	function handleInputChange(value: string) {
		const newValue = Math.max(0, Math.min(maxHP, parseInt(value) || 0));
		inputValue = newValue;
	}

	function handleInputBlur() {
		isEditing = false;
		if (inputValue !== currentHP) {
			onUpdate(inputValue);
		}
	}

	async function handleHeal(type: 'potion' | 'cure-light') {
		const roll = () => Math.floor(Math.random() * 8) + 1;
		const healing = type === 'potion' ? roll() + 1 : roll() + 5;
		const newValue = Math.min(maxHP, currentHP + healing);
		onUpdate(newValue);
	}

	let hpPercentage = $derived((currentHP / maxHP) * 100);
	let hpColor = $derived(
		hpPercentage > 75 ? 'bg-green-100' : hpPercentage > 25 ? 'bg-yellow-100' : 'bg-red-100'
	);

	function focusInput(node: HTMLInputElement) {
		node.focus();
		return {};
	}
</script>

<div class="card {hpColor} transition-colors duration-300">
	<h2 class="mb-2 font-bold">Hit Points</h2>

	<!-- Quick Actions -->
	<div class="mb-4 grid grid-cols-4 gap-2">
		<button class="btn btn-secondary px-3 py-1 text-sm" onclick={() => handleQuickUpdate(-1)}>
			-1
		</button>
		<button class="btn btn-secondary px-3 py-1 text-sm" onclick={() => handleQuickUpdate(-5)}>
			-5
		</button>
		<button class="btn btn-secondary px-3 py-1 text-sm" onclick={() => handleQuickUpdate(1)}>
			+1
		</button>
		<button class="btn btn-secondary px-3 py-1 text-sm" onclick={() => handleQuickUpdate(5)}>
			+5
		</button>
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
				style="width: {hpPercentage}%"
			></div>
		</div>
	</div>

	<!-- Healing Shortcuts -->
	<div class="mt-4 flex flex-wrap gap-2 text-sm">
		<button
			class="rounded px-2 py-1
                   text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/50"
			onclick={() => handleHeal('potion')}
		>
			Use Potion (1d8+1)
		</button>
		<button
			class="rounded px-2 py-1
                   text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/50"
			onclick={() => handleHeal('cure-light')}
		>
			Cure Light (1d8+5)
		</button>
	</div>
</div>
