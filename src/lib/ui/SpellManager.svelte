<script lang="ts">
	import { slide } from 'svelte/transition';
	import { getCharacter, updateSpellSlot } from '$lib/state/character.svelte';
	import { executeUpdate, type UpdateState } from '$lib/utils/updates';
	import type {
		DatabaseCharacterSpellSlot,
		DatabaseCharacterKnownSpell
	} from '$lib/domain/types/character';
	import ResourceTracker from '$lib/ui/ResourceTracker.svelte';

	let { characterId } = $props<{ characterId: number }>();
	let character = $derived(
		getCharacter(characterId) ?? {
			id: characterId,
			level: 0,
			character_spell_slots: [],
			character_known_spells: []
		}
	);

	let updateState = $state<UpdateState>({
		status: 'idle',
		error: null
	});

	let spellSlots = $derived(character.character_spell_slots ?? []);
	let knownSpells = $derived(character.character_known_spells ?? []);

	let spellsByLevel = $derived(() => {
		const grouped: Record<number, DatabaseCharacterKnownSpell[]> = {};
		for (const spell of knownSpells) {
			const level = spell.spell_level;
			if (!grouped[level]) {
				grouped[level] = [];
			}
			grouped[level].push(spell);
		}
		return grouped;
	});

	let slotsByLevel = $derived(() => {
		const grouped: Record<number, DatabaseCharacterSpellSlot> = {};
		for (const slot of spellSlots) {
			grouped[slot.spell_level] = slot;
		}
		return grouped;
	});

	let allLevels = $derived(
		[
			...new Set([
				...Object.keys(spellsByLevel()).map(Number),
				...Object.keys(slotsByLevel()).map(Number)
			])
		].sort((a, b) => a - b)
	);

	async function handleSlotUpdate(level: number, remaining: number) {
		const slots = slotsByLevel()[level];
		if (!slots || remaining === slots.remaining) return;

		const previousRemaining = slots.remaining;

		await executeUpdate({
			key: `spell-slot-${character.id}-${level}`,
			status: updateState,
			operation: () => updateSpellSlot(character.id, level, remaining),
			optimisticUpdate: () => {
				if (character.character_spell_slots) {
					const slot = character.character_spell_slots.find((s) => s.spell_level === level);
					if (slot) {
						slot.remaining = remaining;
					}
				}
			},
			rollback: () => {
				if (character.character_spell_slots) {
					const slot = character.character_spell_slots.find((s) => s.spell_level === level);
					if (slot) {
						slot.remaining = previousRemaining;
					}
				}
			}
		});
	}

	function getSpellLevelDisplay(level: number): string {
		return level === 0 ? 'Cantrips' : `Level ${level}`;
	}
</script>

<!-- If no spells and no slots, show nothing -->
{#if allLevels.length > 0}
	<div class="space-y-3 rounded border border-gray-200 bg-white p-4 text-sm">
		{#if updateState.error}
			<div class="rounded bg-red-50 p-2 text-xs text-red-700">
				{updateState.error.message}
			</div>
		{/if}

		<div class="flex items-center justify-between">
			<h2 class="text-lg font-bold">Spells</h2>
			<div class="flex items-center gap-2 text-xs">
				<button
					class="hover:text-primary-dark text-primary disabled:opacity-50"
					disabled={updateState.status === 'syncing'}
				>
					Prepare
				</button>
				<div class="h-4 w-px bg-gray-300"></div>
				<button
					class="hover:text-primary-dark text-primary disabled:opacity-50"
					disabled={updateState.status === 'syncing'}
				>
					Rest
				</button>
			</div>
		</div>

		<div class="divide-y divide-gray-100">
			{#each allLevels as level (level)}
				{@const spells = spellsByLevel()[level] || []}
				{@const slots = slotsByLevel()[level]}
				<div class="py-2">
					<div class="mb-2">
						<h3 class="text-base font-semibold text-primary">
							{getSpellLevelDisplay(level)}
						</h3>
						{#if slots}
							<div
								class="mt-1 flex flex-wrap items-center gap-2"
								transition:slide|local={{ duration: 200 }}
							>
								<ResourceTracker
									label=""
									total={slots.total}
									used={slots.total - slots.remaining}
									onToggle={(remaining) => handleSlotUpdate(level, remaining)}
								/>
								<span class="text-xs text-gray-600">
									{slots.remaining}/{slots.total} remain
								</span>
							</div>
						{/if}
					</div>

					{#if spells.length > 0}
						<div class="space-y-1">
							{#each spells as spell (spell.spell_name)}
								<div
									class="group relative rounded bg-gray-50 p-2 text-sm transition-colors hover:bg-gray-100"
								>
									<div class="flex items-center justify-between">
										<div>
											<div class="font-medium">{spell.spell_name}</div>
											<div class="text-xs text-gray-600">School • Action</div>
										</div>
										<button
											class="hover:text-primary-dark text-xs text-primary opacity-0 transition-opacity disabled:opacity-50 group-hover:opacity-100"
											disabled={updateState.status === 'syncing'}
											aria-label="Cast spell"
										>
											Cast
										</button>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{/if}
