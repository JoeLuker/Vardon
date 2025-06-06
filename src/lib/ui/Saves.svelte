<!-- FILE: src/lib/ui/Saves.svelte -->
<script lang="ts">
	import type { ValueWithBreakdown } from '$lib/ui/types/CharacterTypes';
	import type { GameKernel } from '$lib/domain/kernel/GameKernel';

	// Save types
	type SaveType = 'fortitude' | 'reflex' | 'will';

	/**
	 * Props:
	 * - character: Character object (can be simple ID reference)
	 * - kernel: GameKernel instance
	 * - onSelectValue: callback that receives the breakdown of the selected save
	 */
	let {
		character = null,
		kernel = null,
		onSelectValue = () => {}
	} = $props<{
		character: any;
		kernel: GameKernel | null;
		onSelectValue?: (val: ValueWithBreakdown) => void;
	}>();

	// Local state
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let saves = $state<Record<SaveType, ValueWithBreakdown | null>>({
		fortitude: null,
		reflex: null,
		will: null
	});

	// We'll list the keys and labels for each save
	let saveKeys = $derived(['fortitude', 'reflex', 'will'] as const);
	let saveLabels = $derived({
		fortitude: 'Fortitude',
		reflex: 'Reflex',
		will: 'Will'
	});

	// Load saves when component mounts
	$effect(() => {
		if (kernel && character) {
			loadSavesData();
		}
	});

	/**
	 * Load save data from character
	 */
	async function loadSavesData() {
		isLoading = true;
		error = null;

		try {
			// Simply use the character data we already have
			// Get CON modifier for Fortitude
			const conAbility = character.game_character_ability?.find(
				(a) => a.ability?.name?.toLowerCase() === 'constitution'
			);
			let baseCon = conAbility?.value || 10;
			
			// Check for ABP ability bonuses
			if (character.abpData?.appliedBonuses) {
				const conABP = character.abpData.appliedBonuses.find(
					b => b.target === 'constitution' && b.type === 'inherent'
				);
				if (conABP) baseCon += conABP.value;
			}
			const conMod = Math.floor((baseCon - 10) / 2);

			// Get DEX modifier for Reflex
			const dexAbility = character.game_character_ability?.find(
				(a) => a.ability?.name?.toLowerCase() === 'dexterity'
			);
			let baseDex = dexAbility?.value || 10;
			
			// Check for ABP ability bonuses
			if (character.abpData?.appliedBonuses) {
				const dexABP = character.abpData.appliedBonuses.find(
					b => b.target === 'dexterity' && b.type === 'inherent'
				);
				if (dexABP) baseDex += dexABP.value;
			}
			const dexMod = Math.floor((baseDex - 10) / 2);

			// Get WIS modifier for Will
			const wisAbility = character.game_character_ability?.find(
				(a) => a.ability?.name?.toLowerCase() === 'wisdom'
			);
			let baseWis = wisAbility?.value || 10;
			
			// Check for ABP ability bonuses
			if (character.abpData?.appliedBonuses) {
				const wisABP = character.abpData.appliedBonuses.find(
					b => b.target === 'wisdom' && b.type === 'inherent'
				);
				if (wisABP) baseWis += wisABP.value;
			}
			const wisMod = Math.floor((baseWis - 10) / 2);

			// Get base saves from character data
			const baseFort = character.base_fortitude_save || 0;
			const baseRef = character.base_reflex_save || 0;
			const baseWill = character.base_will_save || 0;

			// Get ABP resistance bonus
			let resistanceBonus = 0;
			if (character.abpData?.appliedBonuses) {
				const resistanceABP = character.abpData.appliedBonuses.find(
					b => b.target === 'saves' && b.type === 'resistance'
				);
				if (resistanceABP) resistanceBonus = resistanceABP.value;
			}

			// Build save data
			saves = {
				fortitude: {
					label: 'Fortitude',
					total: baseFort + conMod + resistanceBonus,
					modifiers: [
						{ source: 'Base Save', value: baseFort },
						{ source: 'CON Modifier', value: conMod },
						...(resistanceBonus ? [{ source: 'Resistance (ABP)', value: resistanceBonus }] : [])
					]
				},
				reflex: {
					label: 'Reflex',
					total: baseRef + dexMod + resistanceBonus,
					modifiers: [
						{ source: 'Base Save', value: baseRef },
						{ source: 'DEX Modifier', value: dexMod },
						...(resistanceBonus ? [{ source: 'Resistance (ABP)', value: resistanceBonus }] : [])
					]
				},
				will: {
					label: 'Will',
					total: baseWill + wisMod + resistanceBonus,
					modifiers: [
						{ source: 'Base Save', value: baseWill },
						{ source: 'WIS Modifier', value: wisMod },
						...(resistanceBonus ? [{ source: 'Resistance (ABP)', value: resistanceBonus }] : [])
					]
				}
			};

			isLoading = false;
		} catch (err) {
			error = `Failed to load saves: ${err instanceof Error ? err.message : String(err)}`;
			isLoading = false;
		}
	}

	/**
	 * Get a specific save's breakdown
	 */
	async function getSaveBreakdown(saveType: SaveType): Promise<ValueWithBreakdown | null> {
		if (!character) {
			return null;
		}

		// Return the save data we already have
		return saves[saveType];
	}

	/**
	 * Handle selecting a save to show breakdown
	 */
	async function handleSelectSave(saveType: SaveType) {
		const breakdown = await getSaveBreakdown(saveType);
		if (breakdown) {
			onSelectValue(breakdown);
		}
	}

	// Helper to format a numeric bonus with +/-
	function formatBonus(bonus: number): string {
		return bonus >= 0 ? `+${bonus}` : `${bonus}`;
	}
</script>

{#if isLoading}
	<div class="card">
		<div class="flex items-center justify-center space-x-2 p-4 text-primary/70">
			<div
				class="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary"
			></div>
			<p>Loading saves...</p>
		</div>
	</div>
{:else if error}
	<div class="card space-y-6 border-destructive">
		<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
			{error}
		</div>
		<button class="text-sm text-primary hover:underline" onclick={loadSavesData}> Retry </button>
	</div>
{:else}
	<div class="card space-y-6">
		<div class="grid grid-cols-3 gap-6">
			{#each saveKeys as key}
				{#if saves[key]}
					<button class="save-card" type="button" onclick={() => handleSelectSave(key)}>
						<div class="card-inner">
							<div class="save-name">{saveLabels[key]}</div>
							<div class="primary-value">
								{formatBonus(saves[key]?.total ?? 0)}
							</div>
						</div>
					</button>
				{:else}
					<div class="save-card-placeholder">
						<div class="card-inner">
							<div class="save-name">{saveLabels[key]}</div>
							<div class="primary-value">--</div>
						</div>
					</div>
				{/if}
			{/each}
		</div>
	</div>
{/if}

<style lang="postcss">
	.save-card {
		@apply relative w-full rounded-lg border bg-card text-left shadow-sm transition-transform duration-200;
		border-color: hsl(var(--border) / 0.2);

		&:hover {
			@apply scale-105;
		}
	}

	.save-card-placeholder {
		@apply relative w-full rounded-lg border bg-card text-left opacity-70 shadow-sm;
		border-color: hsl(var(--border) / 0.2);
	}

	.card-inner {
		@apply flex flex-col items-center space-y-2 p-4;
	}

	.save-name {
		@apply text-sm font-medium text-muted-foreground;
	}

	.primary-value {
		@apply text-2xl font-bold text-foreground;
	}
</style>
