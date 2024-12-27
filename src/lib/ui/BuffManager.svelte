<!-- src/lib/ui/BuffManager.svelte -->
<script lang="ts">
	import {
		getCharacter,
		toggleBuff,
		optimisticToggleBuff,
		rollbackToggleBuff
	} from '$lib/state/character.svelte';
	import { executeUpdate, type UpdateState } from '$lib/utils/updates';
	import { BUFF_CONFIG, doBuffsConflict } from '$lib/state/buffs.svelte';
	import type { KnownBuffType } from '$lib/domain/types/character';

	let { characterId } = $props<{ characterId: number }>();

	let updateState = $state<UpdateState>({
		status: 'idle',
		error: null
	});

	// Get character and derive active buffs
	let character = $derived(getCharacter(characterId));
	let activeBuffs = $derived(() => {
		const buffs = new Set<KnownBuffType>();
		for (const buff of character.character_buffs ?? []) {
			if (buff.is_active && buff.buff_type) {
				buffs.add(buff.buff_type as KnownBuffType);
			}
		}
		return buffs;
	});

	// Check if a buff is active
	function isBuffActive(buffName: KnownBuffType): boolean {
		return activeBuffs().has(buffName);
	}

	// Check for conflicts
	function hasActiveConflict(buffName: KnownBuffType): boolean {
		return (
			!isBuffActive(buffName) &&
			Array.from(activeBuffs()).some((active: KnownBuffType) => doBuffsConflict(active, buffName))
		);
	}

	// Handle toggling buffs
	async function handleBuffToggle(buffName: KnownBuffType) {
		const isCurrentlyActive = isBuffActive(buffName);

		await executeUpdate({
			key: `buff-${character.id}-${buffName}`,
			status: updateState,
			operation: () => toggleBuff(character.id, buffName, !isCurrentlyActive),
			optimisticUpdate: () => optimisticToggleBuff(character.id, buffName, !isCurrentlyActive),
			rollback: () => rollbackToggleBuff(character.id, buffName, isCurrentlyActive)
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

	<div class="space-y-1">
		{#each BUFF_CONFIG as buff (buff.name)}
			{@const isActive = isBuffActive(buff.name as KnownBuffType)}
			{@const hasConflict = hasActiveConflict(buff.name as KnownBuffType)}

			<!-- One line per buff, dense layout -->
			<button
				class="
                    flex w-full items-center justify-between rounded px-2 py-1 text-sm transition-colors
                    {isActive ? 'bg-primary-300 text-white' : 'bg-gray-50 hover:bg-gray-100'}
                    {hasConflict ? 'cursor-not-allowed opacity-50' : ''}
                "
				onclick={() => handleBuffToggle(buff.name as KnownBuffType)}
				disabled={updateState.status === 'syncing' || hasConflict}
				aria-label="{isActive ? 'Deactivate' : 'Activate'} {buff.label}"
			>
				<div class="flex flex-col space-y-0.5 text-left">
					<span class="font-medium">{buff.label}</span>
					{#if buff.description}
						<span class="text-xs text-gray-600">{buff.description}</span>
					{/if}
					{#if hasConflict}
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

	{#if updateState.error}
		<div class="bg-accent/10 text-accent mt-2 rounded p-2 text-xs">
			{updateState.error.message}
		</div>
	{/if}
</div>
