<!-- 
	ACStats Component - Uses Domain Layer
	All combat calculations are handled by the domain CombatService
-->
<script lang="ts">
	import type { GameKernel } from '$lib/domain/kernel/GameKernel';
	import type { Entity } from '$lib/domain/kernel/types';
	import { Shield } from 'lucide-svelte';
	import { CombatService } from '$lib/domain/services/CombatService';
	import type { ACBreakdown } from '$lib/domain/services/CombatService';

	// Value with modifiers type for UI
	type ValueWithModifiers = {
		label: string;
		modifiers: Array<{ source: string; value: number }>;
		total: number;
	};

	/**
	 * Props:
	 * - character: Character entity
	 * - kernel: GameKernel instance
	 * - onSelectValue: callback for clicking an AC breakdown
	 */
	let {
		character = null,
		kernel = null,
		onSelectValue = () => {}
	} = $props<{
		character: Entity | null;
		kernel: GameKernel | null;
		onSelectValue: (value: ValueWithModifiers) => void;
	}>();

	// Local state
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let combatStats = $state<{
		ac: ValueWithModifiers | null;
		touch_ac: ValueWithModifiers | null;
		flat_footed_ac: ValueWithModifiers | null;
		cmb: ValueWithModifiers | null;
		cmd: ValueWithModifiers | null;
		initiative: ValueWithModifiers | null;
	}>({
		ac: null,
		touch_ac: null,
		flat_footed_ac: null,
		cmb: null,
		cmd: null,
		initiative: null
	});

	// Domain service
	let combatService: CombatService | null = null;

	// Load combat stats when component mounts
	$effect(() => {
		if (kernel && character) {
			loadCombatStats();
		}
	});

	/**
	 * Load combat stats using domain service
	 */
	async function loadCombatStats() {
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

			// Get AC breakdown from service
			const acData = combatService.getArmorClass(characterData);
			
			// Get other combat stats
			const bab = combatService.getBaseAttackBonus(characterData);
			
			// Get ability modifiers for CMB/CMD - use AbilityService
			const abilityService = new (await import('$lib/domain/services/AbilityService')).AbilityService();
			const strAbility = abilityService.getScore(characterData, 'strength');
			const dexAbility = abilityService.getScore(characterData, 'dexterity');
			const strMod = strAbility.modifier || 0;
			const dexMod = dexAbility.modifier || 0;

			// Build AC stats from service data
			combatStats = {
				ac: {
					label: 'Armor Class',
					total: acData.total,
					modifiers: acData.modifiers
						.filter(mod => mod.value !== 0)
						.map(mod => ({ source: mod.source, value: mod.value }))
				},
				touch_ac: {
					label: 'Touch AC',
					total: acData.touch,
					modifiers: acData.modifiers
						.filter(mod => mod.appliesToTouch && mod.value !== 0)
						.map(mod => ({ source: mod.source, value: mod.value }))
				},
				flat_footed_ac: {
					label: 'Flat-Footed AC',
					total: acData.flatFooted,
					modifiers: acData.modifiers
						.filter(mod => mod.appliesToFlatFooted && mod.value !== 0)
						.map(mod => ({ source: mod.source, value: mod.value }))
				},
				cmb: {
					label: 'CMB',
					total: bab + strMod,
					modifiers: [
						{ source: 'BAB', value: bab },
						{ source: 'STR Modifier', value: strMod }
					].filter(mod => mod.value !== 0)
				},
				cmd: {
					label: 'CMD',
					total: 10 + bab + strMod + dexMod,
					modifiers: [
						{ source: 'Base', value: 10 },
						{ source: 'BAB', value: bab },
						{ source: 'STR Modifier', value: strMod },
						{ source: 'DEX Modifier', value: dexMod }
					].filter(mod => mod.value !== 0)
				},
				initiative: {
					label: 'Initiative',
					total: dexMod,
					modifiers: [
						{ source: 'DEX Modifier', value: dexMod }
						// TODO: Add trait bonuses, feat bonuses, etc.
					].filter(mod => mod.value !== 0)
				}
			};

			isLoading = false;
		} catch (err) {
			error = `Failed to load combat stats: ${err instanceof Error ? err.message : String(err)}`;
			isLoading = false;
		}
	}

	// Helper to format numeric bonuses
	function formatBonus(value: number): string {
		return value >= 0 ? `+${value}` : `${value}`;
	}
</script>

<div class="ac-stats">
	{#if isLoading}
		<div class="flex items-center justify-center space-x-2 p-4 text-primary/70">
			<div class="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary"></div>
			<p>Loading combat stats...</p>
		</div>
	{:else if error}
		<div class="space-y-6 border-destructive">
			<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
				{error}
			</div>
			<button class="text-sm text-primary hover:underline" onclick={loadCombatStats}>
				Retry
			</button>
		</div>
	{:else}
		<div class="grid grid-cols-3 gap-4">
			<!-- AC Stats -->
			{#if combatStats.ac}
				<button
					class="stat-card"
					type="button"
					onclick={() => onSelectValue(combatStats.ac)}
				>
					<div class="stat-icon">
						<Shield size={24} />
					</div>
					<div class="stat-label">AC</div>
					<div class="stat-value">{combatStats.ac.total}</div>
				</button>
			{/if}

			{#if combatStats.touch_ac}
				<button
					class="stat-card"
					type="button"
					onclick={() => onSelectValue(combatStats.touch_ac)}
				>
					<div class="stat-label">Touch</div>
					<div class="stat-value">{combatStats.touch_ac.total}</div>
				</button>
			{/if}

			{#if combatStats.flat_footed_ac}
				<button
					class="stat-card"
					type="button"
					onclick={() => onSelectValue(combatStats.flat_footed_ac)}
				>
					<div class="stat-label">Flat-Footed</div>
					<div class="stat-value">{combatStats.flat_footed_ac.total}</div>
				</button>
			{/if}

			<!-- Combat Maneuvers -->
			{#if combatStats.cmb}
				<button
					class="stat-card"
					type="button"
					onclick={() => onSelectValue(combatStats.cmb)}
				>
					<div class="stat-label">CMB</div>
					<div class="stat-value">{formatBonus(combatStats.cmb.total)}</div>
				</button>
			{/if}

			{#if combatStats.cmd}
				<button
					class="stat-card"
					type="button"
					onclick={() => onSelectValue(combatStats.cmd)}
				>
					<div class="stat-label">CMD</div>
					<div class="stat-value">{combatStats.cmd.total}</div>
				</button>
			{/if}

			{#if combatStats.initiative}
				<button
					class="stat-card"
					type="button"
					onclick={() => onSelectValue(combatStats.initiative)}
				>
					<div class="stat-label">Initiative</div>
					<div class="stat-value">{formatBonus(combatStats.initiative.total)}</div>
				</button>
			{/if}
		</div>
	{/if}
</div>

<style lang="postcss">
	.ac-stats {
		@apply space-y-4;
	}

	.stat-card {
		@apply relative flex flex-col items-center rounded-lg border bg-card p-4 shadow-sm transition-all hover:scale-105;
		border-color: hsl(var(--border) / 0.2);
	}

	.stat-icon {
		@apply mb-2 text-primary;
	}

	.stat-label {
		@apply text-sm font-medium text-muted-foreground;
	}

	.stat-value {
		@apply text-2xl font-bold text-foreground;
	}
</style>