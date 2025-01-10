<!-- FILE: src/lib/ui/Attributes.svelte -->
<script lang="ts">
	import { characterStore } from '$lib/state/characterStore';
	import { writable } from 'svelte/store';
	import { StretchHorizontal } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import type { ValueWithBreakdown } from '$lib/domain/characterCalculations';

	const showModifierFirst = writable(false);

	// Type-safe mapping of attribute names to their property keys
	const attributeMap = {
		Strength: { score: 'strength', mod: 'strength.total' },
		Dexterity: { score: 'dexterity', mod: 'dexterity.total' },
		Constitution: { score: 'constitution', mod: 'constitution.total' },
		Intelligence: { score: 'intelligence', mod: 'intelligence.total' },
		Wisdom: { score: 'wisdom', mod: 'wisdom.total' },
		Charisma: { score: 'charisma', mod: 'charisma.total' }
	} as const;

	let abilityMods = $derived([
		{
			name: 'Strength',
			value: $characterStore?.strength?.total ?? 10,
			mod: $characterStore?.strMod ?? 0
		},
		{
			name: 'Dexterity',
			value: $characterStore?.dexterity?.total ?? 10,
			mod: $characterStore?.dexMod ?? 0
		},
		{
			name: 'Constitution',
			value: $characterStore?.constitution?.total ?? 10,
			mod: $characterStore?.conMod ?? 0
		},
		{
			name: 'Intelligence',
			value: $characterStore?.intelligence?.total ?? 10,
			mod: $characterStore?.intMod ?? 0
		},
		{
			name: 'Wisdom',
			value: $characterStore?.wisdom?.total ?? 10,
			mod: $characterStore?.wisMod ?? 0
		},
		{
			name: 'Charisma',
			value: $characterStore?.charisma?.total ?? 10,
			mod: $characterStore?.chaMod ?? 0
		}
	]);

	let { onSelectValue = () => {} } = $props<{
		onSelectValue?: (breakdown: ValueWithBreakdown) => void;
	}>();
</script>

{#if $characterStore}
	<div class="card">
		<div class="flex flex-col gap-4">
			<div class="flex items-start justify-between">
				<div class="flex-grow"></div>
				<Button
					variant="ghost"
					size="icon"
					class="opacity-50 transition-opacity hover:opacity-100"
					onclick={() => ($showModifierFirst = !$showModifierFirst)}
				>
					<span class="sr-only">Show modifiers first</span>
					<StretchHorizontal
						class={`h-4 w-4 transition-transform duration-200 ${$showModifierFirst ? 'rotate-180' : ''}`}
					/>
				</Button>
			</div>

			<div class="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
				{#each abilityMods as abilityMod}
					<button
						class="attribute-card"
						type="button"
						onclick={() =>
							onSelectValue(
								$characterStore[attributeMap[abilityMod.name as keyof typeof attributeMap].score]
							)}
					>
						<div class="card-inner">
							<div class="attribute-name">{abilityMod.name}</div>
							{#if $showModifierFirst}
								<div class="primary-value modifier">
									{abilityMod.mod >= 0 ? '+' : ''}{abilityMod.mod}
								</div>
								<div class="secondary-value score">
									{abilityMod.value}
								</div>
							{:else}
								<div class="primary-value score">
									{abilityMod.value}
								</div>
								<div class="secondary-value modifier">
									<span>{abilityMod.mod >= 0 ? '+' : ''}{abilityMod.mod}</span>
								</div>
							{/if}
						</div>
					</button>
				{/each}
			</div>
		</div>
	</div>
{:else}
	<div class="card">
		<div class="flex items-center justify-center space-x-2 text-primary/70">
			<div
				class="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary"
			></div>
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

	.toggle-switch {
		@apply relative h-6 w-11 cursor-pointer rounded-full bg-secondary transition-colors duration-200;

		&::after {
			content: '';
			@apply absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-background shadow-md transition-transform duration-200;
		}

		&.checked {
			@apply bg-primary;

			&::after {
				transform: translateX(20px);
			}
		}

		&:hover::after {
			@apply shadow-lg;
		}
	}
</style>
