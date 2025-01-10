<!-- FILE: src/lib/ui/Saves.svelte -->
<script lang="ts">
	import type { EnrichedCharacter, ValueWithBreakdown } from '$lib/domain/characterCalculations';

	/**
	 * Props:
	 * - character: Possibly null if loading
	 * - onSelectValue: callback that receives the breakdown of the selected save
	 */
	let { character, onSelectValue = () => {} } = $props<{
		character?: EnrichedCharacter | null;
		onSelectValue?: (val: ValueWithBreakdown) => void;
	}>();

	/**
	 * We assume `character?.saves` is shaped like:
	 * {
	 *   fortitude: ValueWithBreakdown,
	 *   reflex: ValueWithBreakdown,
	 *   will: ValueWithBreakdown
	 * }
	 */

	// We'll list the keys and labels for each save
	let saveKeys = $derived(['fortitude', 'reflex', 'will'] as const);
	let saveLabels = $derived({
		fortitude: 'Fortitude',
		reflex: 'Reflex',
		will: 'Will'
	});

	// Helper to format a numeric bonus with +/-
	function formatBonus(bonus: number): string {
		return bonus >= 0 ? `+${bonus}` : `${bonus}`;
	}
</script>

{#if character?.saves}
	<div class="card space-y-6">
		<div class="grid grid-cols-3 gap-6">
			{#each saveKeys as key}
				<button
					class="save-card"
					type="button"
					onclick={() => onSelectValue(character.saves[key])}
				>
					<div class="card-inner">
						<div class="save-name">{saveLabels[key]}</div>
						<div class="primary-value">
							{formatBonus(character.saves[key]?.total ?? 0)}
						</div>
					</div>
				</button>
			{/each}
		</div>
	</div>
{:else}
	<div class="card">
		<div class="flex items-center justify-center space-x-2 text-primary/70">
			<div
				class="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary"
			></div>
			<p>Loading saves...</p>
		</div>
	</div>
{/if}

<style lang="postcss">
	.save-card {
		@apply relative w-full text-left rounded-lg border bg-card shadow-sm transition-transform duration-200;
		border-color: hsl(var(--border) / 0.2);

		&:hover {
			@apply scale-105;
		}
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

	.space-y-6 > * + * {
		@apply mt-6;
	}
</style>
