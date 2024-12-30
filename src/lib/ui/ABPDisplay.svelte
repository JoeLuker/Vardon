<!-- FILE: src/lib/ui/ABPDisplay.svelte -->
<script lang="ts">
	/**
	 * We'll retrieve the ABP bonuses by calling getABPBonuses() directly
	 * from '$lib/domain/calculations/abp'.
	 */
	import { getCharacter } from '$lib/state/characterStore.svelte';
	import { getABPBonuses } from '$lib/domain/calculations/abp';

	let { characterId }: { characterId: number } = $props();

	/**
	 * 1) Derive the character from your store.
	 */
	let character = $derived(getCharacter(characterId));

	/**
	 * 2) Compute ABP bonuses by calling `getABPBonuses(character.character_abp_bonuses)`.
	 *    If the array doesn't exist, default to `[]`.
	 */
	let bonuses = $derived(() =>
		getABPBonuses(character.character_abp_bonuses ?? [])
	);

	/**
	 * 3) We'll display only the bonuses that have a value > 0.
	 *    Use `bonusLabels` to give them a user-friendly label.
	 */
	const bonusLabels: Record<keyof ABPBonuses, string> = {
		resistance: 'Resistance',
		armor: 'Armor',
		weapon: 'Weapon',
		deflection: 'Deflection',
		mental_prowess: 'Mental Prowess',
		physical_prowess: 'Physical Prowess',
		toughening: 'Toughening'
	};
</script>

<div class="card space-y-6">
	<div class="section-header">
		<h2>Automatic Bonus Progression</h2>
	</div>

	<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
		{#each Object.entries(bonuses) as [type, value]}
			{#if value > 0}
				<div class="rounded bg-gray-50 p-3">
					<div class="text-sm font-medium">{bonusLabels[type as keyof ABPBonuses]}</div>
					<div class="text-xl font-bold text-primary">+{value}</div>
				</div>
			{/if}
		{/each}
	</div>
</div>
