<!-- FILE: src/lib/ui/Saves.svelte -->
<script lang="ts">
	import { characterStore } from '$lib/state/characterStore';
	import * as Sheet from "$lib/components/ui/sheet";

	interface CharacterSaves {
		fortitude: number;
		reflex: number;
		will: number;
	}

	let selectedSave = $state<{name: string, key: keyof CharacterSaves} | null>(null);
	let sheetOpen = $state(false);

	function formatBonus(bonus: number): string {
		return bonus > 0 ? `+${bonus}` : bonus.toString();
	}

	const saveTypes: Array<{name: string, key: keyof CharacterSaves}> = [
		{ name: 'Fortitude', key: 'fortitude' },
		{ name: 'Reflex', key: 'reflex' },
		{ name: 'Will', key: 'will' }
	];
</script>

<style lang="postcss">
	.save-card {
		@apply relative transition-transform duration-200 rounded-lg border shadow-sm bg-card;
		border-color: hsl(var(--border) / 0.2);
		@apply w-full text-left;

		&:hover {
			@apply scale-105;
		}
	}

	.card-inner {
		@apply p-4 flex flex-col items-center space-y-2;
	}

	.save-name {
		@apply text-sm font-medium text-muted-foreground;
	}

	.primary-value {
		@apply text-2xl font-bold text-foreground;
	}

	.sheet-content {
		@apply p-4 space-y-2;
	}
</style>

{#if $characterStore}
	<div class="card space-y-6">
		<div class="section-header">
			<h2 class="section-title">Saving Throws</h2>
		</div>

		{#if $characterStore.saves}
			<div class="grid grid-cols-3 gap-6">
				{#each saveTypes as save}
					<button 
						class="save-card"
						onclick={() => {
							selectedSave = save;
							sheetOpen = true;
						}}
					>
						<div class="card-inner">
							<div class="save-name">{save.name}</div>
							<div class="primary-value">
								{formatBonus($characterStore.saves[save.key])}
							</div>
						</div>
					</button>
				{/each}
			</div>
		{/if}
	</div>
{:else}
	<div class="card">
		<div class="flex items-center justify-center space-x-2 text-primary/70">
			<div class="animate-spin h-5 w-5 border-2 border-primary/20 border-t-primary rounded-full"></div>
			<p>Loading saves...</p>
		</div>
	</div>
{/if}

<Sheet.Root bind:open={sheetOpen}>
	<Sheet.Content side="bottom">
		{#if selectedSave && $characterStore}
			<Sheet.Header>
				<Sheet.Title>{selectedSave.name} Save</Sheet.Title>
			</Sheet.Header>
			<div class="sheet-content">
				<p>Total Bonus: {formatBonus($characterStore.saves[selectedSave.key])}</p>
                <p>Base: {formatBonus($characterStore.saves.base[selectedSave.key])}</p>
				<!-- Add more calculation details here when available from the store -->
			</div>
		{/if}
	</Sheet.Content>
</Sheet.Root>
