<script lang="ts">
	import type { CharacterBuff } from '$lib/types/character';

	let { bombsLeft = $bindable(0), baseAttackBonus, activeBuffs, onUpdateBombs } = $props<{
		bombsLeft: number;
		baseAttackBonus: number;
		activeBuffs: CharacterBuff[];
		onUpdateBombs: (bombs: number) => Promise<void>;
	}>();

	let isEditing = $state(false);
	let inputValue = $state(bombsLeft);

	// Sync inputValue with bombsLeft
	$effect(() => {
		inputValue = bombsLeft;
	});

	// Calculate combat modifiers based on active buffs
	let combatModifiers = $derived.by(() => {
		let mods = {
			attack: 0,
			damage: 0,
			extraAttacks: 0
		};

		activeBuffs.forEach((buff: CharacterBuff) => {
			if (!buff.is_active) return;

			switch (buff.buff_type) {
				case 'deadly_aim':
					mods.attack -= 2;
					mods.damage += 4;
					break;
				case 'rapid_shot':
					mods.attack -= 2;
					mods.extraAttacks += 1;
					break;
				case 'two_weapon_fighting':
					mods.attack -= 2;
					mods.extraAttacks += 1;
					break;
			}
		});

		return mods;
	});

	// Configuration for quick update buttons
	const quickActions = $state.raw([
		{ amount: -1, label: '-1', disabled: () => bombsLeft <= 0 },
		{ amount: 1, label: '+1', disabled: () => false }
	]);

	async function handleQuickUpdate(amount: number) {
		const newValue = Math.max(0, bombsLeft + amount);
		if (newValue === bombsLeft) return;

		// Optimistically update
		const previousValue = bombsLeft;
		bombsLeft = newValue;

		try {
			await onUpdateBombs(newValue);
		} catch (error) {
			bombsLeft = previousValue;
			console.error('Failed to update bombs:', error);
		}
	}

	function handleInputChange(value: string) {
		const parsed = parseInt(value) || 0;
		inputValue = Math.max(0, parsed);
	}

	async function handleInputBlur() {
		if (inputValue === bombsLeft) {
			isEditing = false;
			return;
		}

		const previousValue = bombsLeft;
		bombsLeft = inputValue;
		isEditing = false;

		try {
			await onUpdateBombs(inputValue);
		} catch (error) {
			bombsLeft = previousValue;
			console.error('Failed to update bombs:', error);
		}
	}

	function focusInput(node: HTMLInputElement) {
		node.focus();
		node.select();
		return {
			destroy: () => {}
		};
	}

	// Format attack bonus display
	let attackDisplay = $derived.by(() => {
		const total = baseAttackBonus + combatModifiers.attack;
		const sign = total >= 0 ? '+' : '';
		let display = `${sign}${total}`;

		if (combatModifiers.extraAttacks > 0) {
			display += ` / ${sign}${total}`.repeat(combatModifiers.extraAttacks);
		}

		return display;
	});

	// Format damage modifier display
	let damageDisplay = $derived.by(() => {
		const sign = combatModifiers.damage >= 0 ? '+' : '';
		return combatModifiers.damage !== 0 ? `${sign}${combatModifiers.damage}` : '';
	});
</script>

<div class="card">
	<h2 class="mb-4 font-bold">Combat Stats</h2>
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
		<!-- Bombs Section -->
		<div class="rounded bg-gray-50 p-4">
			<div class="mb-2 flex items-center justify-between">
				<label for="bombs-input" class="text-sm font-medium"> Bombs Left </label>
				<div class="flex gap-1">
					{#each quickActions as { amount, label, disabled }}
						<button
							class="btn btn-secondary px-2 py-1 text-xs"
							onclick={() => handleQuickUpdate(amount)}
							disabled={disabled()}
						>
							{label}
						</button>
					{/each}
				</div>
			</div>

			<div class="flex items-center gap-2">
				{#if isEditing}
					<input
						id="bombs-input"
						type="number"
						class="input w-20 text-center"
						value={inputValue}
						min="0"
						oninput={(e) => handleInputChange(e.currentTarget.value)}
						onblur={handleInputBlur}
						use:focusInput
						aria-label="Number of bombs remaining"
					/>
				{:else}
					<button
						class="rounded px-2 py-1 text-2xl font-bold hover:bg-gray-200
                               focus:outline-none focus:ring-2 focus:ring-primary/50"
						onclick={() => (isEditing = true)}
						aria-label="Edit number of bombs"
					>
						{bombsLeft}
					</button>
				{/if}
			</div>
		</div>
		<!-- Attack Bonus Section -->
		<div class="rounded bg-gray-50 p-4">
			<div class="space-y-2">
				<div>
					<div class="mb-1 block text-sm font-medium">Attack Bonus</div>
					<span class="text-2xl font-bold">
						{attackDisplay}
					</span>
				</div>

				{#if damageDisplay}
					<div>
						<div class="mb-1 block text-sm font-medium">Damage Modifier</div>
						<span class="text-xl font-bold">
							{damageDisplay}
						</span>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>