<!-- FILE: src/lib/ui/Attributes.svelte -->
<script lang="ts">
	import { characterStore } from '$lib/state/characterStore';
	import { writable } from 'svelte/store';
	import { StretchHorizontal } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';

	const showModifierFirst = writable(false);

	// Type-safe mapping of attribute names to their property keys
	const attributeMap = {
		Strength: { score: 'str', mod: 'str_mod' },
		Dexterity: { score: 'dex', mod: 'dex_mod' },
		Constitution: { score: 'con', mod: 'con_mod' },
		Intelligence: { score: 'int', mod: 'int_mod' },
		Wisdom: { score: 'wis', mod: 'wis_mod' },
		Charisma: { score: 'cha', mod: 'cha_mod' }
	} as const;

	let abilityMods = $derived(
		Object.entries(attributeMap).map(([name, mapping]) => ({
			name,
			value: $characterStore?.[mapping.score] ?? 10,
			mod: $characterStore?.[mapping.mod] ?? 0
		}))
	);
</script>

<style lang="postcss">
	.attribute-card {
		@apply relative transition-transform duration-200 rounded-lg border shadow-sm bg-card;
		border-color: hsl(var(--border) / 0.2);

		&:hover {
			@apply scale-105;
		}
	}

	.card-inner {
		@apply p-4 flex flex-col items-center space-y-2;
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
		@apply relative w-11 h-6 bg-secondary rounded-full cursor-pointer transition-colors duration-200;

		&::after {
			content: '';
			@apply w-5 h-5 bg-background rounded-full shadow-md absolute left-0.5 top-0.5 transition-transform duration-200;
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

{#if $characterStore}
	<div class="card space-y-6">
		<div class="section-header flex items-center justify-between">
			<h2 class="section-title text-lg font-semibold text-foreground">Attributes</h2>
			<Button
				variant="ghost"
				size="icon"
				class="relative inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80"
				onclick={() => $showModifierFirst = !$showModifierFirst}
			>
				<span class="sr-only">Show modifiers first</span>
				<StretchHorizontal
					class={`w-5 h-5 transition-transform duration-200 ${$showModifierFirst ? 'rotate-180' : ''}`}
				/>
			</Button>
		</div>

		<div class="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
			{#each abilityMods as abilityMod}
				<div class="attribute-card">
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
				</div>
			{/each}
		</div>
	</div>
{:else}
	<div class="card">
		<div class="flex items-center justify-center space-x-2 text-primary/70">
			<div class="animate-spin h-5 w-5 border-2 border-primary/20 border-t-primary rounded-full"></div>
			<p>Loading attributes...</p>
		</div>
	</div>
{/if}
  