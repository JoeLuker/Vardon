<!-- 
	Saves Component - Uses Domain Layer
	All save calculations are handled by the domain CombatService
-->
<script lang="ts">
	import type { ValueWithBreakdown } from '$lib/ui/types/CharacterTypes';
	import type { GameKernel } from '$lib/domain/kernel/GameKernel';
	import type { Entity } from '$lib/domain/kernel/types';
	import { CombatService } from '$lib/domain/services/CombatService';
	import type { SaveBreakdown } from '$lib/domain/services/CombatService';

	// Save types
	type SaveType = 'fortitude' | 'reflex' | 'will';

	/**
	 * Props:
	 * - character: Character entity
	 * - kernel: GameKernel instance
	 * - onSelectValue: callback that receives the breakdown of the selected save
	 */
	let {
		character = null,
		kernel = null,
		onSelectValue = () => {}
	} = $props<{
		character: Entity | null;
		kernel: GameKernel | null;
		onSelectValue?: (val: ValueWithBreakdown) => void;
	}>();

	// Local state
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let saves = $state<Record<SaveType, SaveBreakdown | null>>({
		fortitude: null,
		reflex: null,
		will: null
	});

	// Domain service
	let combatService: CombatService | null = null;

	// Save metadata
	const saveKeys: SaveType[] = ['fortitude', 'reflex', 'will'];
	const saveLabels = {
		fortitude: 'Fortitude',
		reflex: 'Reflex',
		will: 'Will'
	};

	// Load saves when component mounts or character changes
	$effect(() => {
		if (kernel && character) {
			loadSavesData();
		}
	});

	/**
	 * Load save data using domain service
	 */
	async function loadSavesData() {
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

			// Get all saves from the service
			const allSaves = combatService.getAllSaves(characterData);
			
			// Update state
			saves = {
				fortitude: allSaves.fortitude,
				reflex: allSaves.reflex,
				will: allSaves.will
			};

			isLoading = false;
		} catch (err) {
			error = `Failed to load saves: ${err instanceof Error ? err.message : String(err)}`;
			isLoading = false;
		}
	}

	/**
	 * Handle selecting a save to show breakdown
	 */
	function handleSelectSave(saveType: SaveType) {
		const saveData = saves[saveType];
		if (!saveData) return;

		// Convert to ValueWithBreakdown format
		const breakdown: ValueWithBreakdown = {
			label: saveData.label,
			total: saveData.total,
			modifiers: saveData.modifiers.map(mod => ({
				source: mod.source,
				value: mod.value,
				type: mod.type || 'untyped'
			}))
		};

		onSelectValue(breakdown);
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