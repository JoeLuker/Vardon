<!-- FILE: src/lib/ui/Saves.svelte -->
<script lang="ts">
	import { characterStore } from '$lib/state/characterStore';
	import type { ValueWithBreakdown } from '$lib/domain/characterCalculations';

	/**
	 * We assume `characterStore` has a `saves` object:
	 * {
	 *   fortitude: ValueWithBreakdown,
	 *   reflex:    ValueWithBreakdown,
	 *   will:      ValueWithBreakdown
	 * }
	 */

	// Derived values using $derived rune
	let saveKeys = $derived(['fortitude', 'reflex', 'will'] as const);
	let saveLabels = $derived({
		fortitude: 'Fortitude',
		reflex: 'Reflex',
		will: 'Will'
	});

	// Helper function
	function formatBonus(bonus: number): string {
		return bonus >= 0 ? `+${bonus}` : bonus.toString();
	}

	let { onSelectValue = () => {} } = $props<{
		onSelectValue?: (breakdown: ValueWithBreakdown) => void;
	}>();
</script>

{#if $characterStore?.saves}
	<div class="card space-y-6">
		<div class="grid grid-cols-3 gap-6">
			{#each saveKeys as key}
				<button class="save-card" onclick={() => onSelectValue($characterStore.saves[key])}>
					<div class="card-inner">
						<div class="save-name">{saveLabels[key]}</div>
						<div class="primary-value">
							{formatBonus($characterStore.saves[key]?.total ?? 0)}
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
		@apply relative rounded-lg border bg-card shadow-sm transition-transform duration-200;
		border-color: hsl(var(--border) / 0.2);
		@apply w-full text-left;

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
