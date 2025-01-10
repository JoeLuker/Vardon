<script lang="ts">
	import type { ValueWithBreakdown } from '$lib/domain/characterCalculations';
	import { StretchHorizontal } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';

	// Props
	let { character, onSelectValue = () => {} } = $props<{
		character?: any; // or a specific type
		onSelectValue?: (val: ValueWithBreakdown) => void;
	}>();

	// Local UI toggle
	let showModifierFirst = $state(false);
	let abilityMods = $derived.by(() => {
		if (!character) {
			return [];
		}

		// Example: for each attribute, compute { name, value, mod, scoreKey }
		return [
			{
				name: 'Strength',
				value: character.strength?.total ?? 10,
				mod: character.strMod ?? 0,
				scoreKey: 'strength'
			},
			{
				name: 'Dexterity',
				value: character.dexterity?.total ?? 10,
				mod: character.dexMod ?? 0,
				scoreKey: 'dexterity'
			},
			{
				name: 'Constitution',
				value: character.constitution?.total ?? 10,
				mod: character.conMod ?? 0,
				scoreKey: 'constitution'
			},
			{
				name: 'Intelligence',
				value: character.intelligence?.total ?? 10,
				mod: character.intMod ?? -1,
				scoreKey: 'intelligence'
			},
			{
				name: 'Wisdom',
				value: character.wisdom?.total ?? 10,
				mod: character.wisMod ?? 0,
				scoreKey: 'wisdom'
			},
			{
				name: 'Charisma',
				value: character.charisma?.total ?? 10,
				mod: character.chaMod ?? 0,
				scoreKey: 'charisma'
			}
		];
	});
</script>

<!-- If characterStore is present, show our attribute cards -->
{#if character}
	<div class="card">
		<div class="flex flex-col gap-4">
			<div class="flex items-start justify-between">
				<div class="flex-grow"></div>
				<Button
					variant="ghost"
					size="icon"
					class="opacity-50 transition-opacity hover:opacity-100"
					onclick={() => (showModifierFirst = !showModifierFirst)}
				>
					<span class="sr-only">Toggle show modifier first</span>
					<StretchHorizontal
						class="h-4 w-4 transition-transform duration-200"
						style={showModifierFirst ? 'transform: rotate(180deg)' : ''}
					/>
				</Button>
			</div>
			<div class="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
				{#each abilityMods as ability}
					<button
						class="attribute-card"
						type="button"
						onclick={() => {
							// On click, pass the "score object" to onSelectValue
							onSelectValue(character?.[ability.scoreKey]);
						}}
					>
						<div class="card-inner">
							<div class="attribute-name">{ability.name}</div>

							{#if showModifierFirst}
								<div class="primary-value modifier">
									{ability.mod >= 0 ? '+' : ''}{ability.mod}
								</div>
								<div class="secondary-value score">
									{ability.value}
								</div>
							{:else}
								<div class="primary-value score">
									{ability.value}
								</div>
								<div class="secondary-value modifier">
									{ability.mod >= 0 ? '+' : ''}{ability.mod}
								</div>
							{/if}
						</div>
					</button>
				{/each}
			</div>
		</div>
	</div>

<!-- Otherwise, loading fallback -->
{:else}
	<div class="card">
		<div class="flex items-center justify-center space-x-2 text-primary/70">
			<div class="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary"></div>
			<p>Loading attributes...</p>
		</div>
	</div>
{/if}

<style lang="postcss">
	.attribute-card {
		@apply relative rounded-lg border bg-card shadow-sm transition-transform duration-200;
		border-color: hsl(var(--border) / 0.2);
		&:hover {
			@apply scale-105;
		}
	}

	.card-inner {
		@apply flex flex-col items-center space-y-2 p-4;
	}

	.attribute-name {
		@apply text-sm font-medium text-muted-foreground;
	}

	.primary-value {
		@apply text-2xl font-bold text-foreground;
	}

	.secondary-value {
		@apply text-sm text-muted-foreground;
	}
</style>
