<!-- FILE: src/lib/ui/BuffManager.svelte -->
<script lang="ts">

	import { onMount } from 'svelte';
	import { getCharacter, executeUpdate, toggleBuff } from '$lib/state/characterStore';
	import { loadAllBuffs } from '$lib/db/buffs';
	import { doBuffsConflict } from '$lib/domain/calculations/buffs';

	import type { UpdateState } from '$lib/state/characterStore';

	let { characterId } = $props<{ characterId: number }>();

	let updateState = $state<UpdateState>({
		status: 'idle',
		error: null
	});

	// Holds the entire list of Buff definitions from the DB
	let allBuffs = $state<Buff[]>([]);

	// Load all Buff definitions once
	onMount(async () => {
		try {
			const buffsFromDB = await loadAllBuffs();
			allBuffs = buffsFromDB;
		} catch (err) {
			console.error('Failed to load buffs:', err);
			updateState.error = err instanceof Error ? err : new Error('Could not load buffs');
		}
	});

	// Get character from store
	let character = $derived(getCharacter(characterId));

	// Active buffs: build a Set of buff_type strings
	let activeBuffs = $derived(() => {
		const set = new Set<KnownBuffType>();
		for (const buff of character.character_buffs ?? []) {
			if (buff.is_active && buff.buff_type) {
				set.add(buff.buff_type as KnownBuffType);
			}
		}
		return set;
	});

	function isBuffActive(buffName: KnownBuffType): boolean {
		return activeBuffs().has(buffName);
	}

	function hasActiveConflict(buffName: KnownBuffType): boolean {
		// Not active, but conflicts with an active buff => conflict
		if (isBuffActive(buffName)) return false;
		return Array.from(activeBuffs()).some(active =>
			doBuffsConflict(active, buffName, allBuffs)
		);
	}

	async function handleBuffToggle(buffName: KnownBuffType) {
		const isCurrentlyActive = isBuffActive(buffName);

		await executeUpdate({
			key: `buff-${character.id}-${buffName}`,
			operation: () => toggleBuff(character.id, buffName),
			optimisticUpdate: () => {
				// Optional: if you want immediate local update
				const b = (character.character_buffs ?? []).find(b => b.buff_type === buffName);
				if (b) b.is_active = !isCurrentlyActive;
			},
			rollback: () => {
				// Optional: revert if fails
				const b = (character.character_buffs ?? []).find(b => b.buff_type === buffName);
				if (b) b.is_active = isCurrentlyActive;
			}
		});
	}
</script>

<div class="card p-4">
	<div class="mb-4 flex items-center justify-between">
		<h2 class="text-lg font-bold">Active Effects</h2>
		{#if updateState.status === 'syncing'}
			<span class="text-sm text-gray-500">Updating...</span>
		{/if}
	</div>

	<!-- Instead of {#each BUFF_CONFIG}, we iterate over allBuffs from DB -->
	{#if allBuffs.length === 0 && updateState.error == null}
		<!-- If the DB has no buffs or they haven't loaded yet -->
		<div class="text-gray-500 text-sm">Loading or no buffs defined in DB.</div>
	{:else}
		<div class="space-y-1">
			{#each allBuffs as buff (buff.name)}
				{@const isActive = isBuffActive(buff.name)}
				{@const conflict = hasActiveConflict(buff.name)}

				<button
					class="
						flex w-full items-center justify-between rounded px-2 py-1 text-sm transition-colors
						{isActive ? 'bg-primary-300 text-white' : 'bg-gray-50 hover:bg-gray-100'}
						{conflict ? 'cursor-not-allowed opacity-50' : ''}
					"
					onclick={() => handleBuffToggle(buff.name)}
					disabled={updateState.status === 'syncing' || conflict}
					aria-label="{isActive ? 'Deactivate' : 'Activate'} {buff.label}"
				>
					<div class="flex flex-col space-y-0.5 text-left">
						<span class="font-medium">{buff.label}</span>
						{#if buff.description}
							<span class="text-xs text-gray-600">{buff.description}</span>
						{/if}
						{#if conflict}
							<span class="text-xs text-red-500">Conflicts with active buff</span>
						{/if}
					</div>

					{#if isActive && buff.effects.length > 0}
						<span class="ml-2 rounded bg-white/20 px-1 text-xs">
							{buff.effects.length} effect{buff.effects.length > 1 ? 's' : ''}
						</span>
					{/if}
				</button>
			{/each}
		</div>
	{/if}

	{#if updateState.error}
		<div class="bg-accent/10 text-accent mt-2 rounded p-2 text-xs">
			{updateState.error.message}
		</div>
	{/if}
</div>
