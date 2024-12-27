<!-- FILE: src/lib/ui/admin/FavoredClassBonusesManager.svelte -->
<script lang="ts">
	import { getCharacter } from '$lib/state/character.svelte';
	import { type UpdateState } from '$lib/state/updates.svelte';

	import {
		saveFavoredClassBonus,
		removeFavoredClassBonus,
		type FavoredClassBonusSaveData
	} from '$lib/db/favoredClassBonuses';

	import type { DatabaseCharacterFavoredClassBonus } from '$lib/domain/types/character';

	let { characterId } = $props<{ characterId: number }>();

	type FCBLevelItem = {
		level: number;
		bonus: DatabaseCharacterFavoredClassBonus | null;
	};

	let updateState = $state<UpdateState>({
		status: 'idle',
		error: null
	});

	let showAddModal = $state(false);
	let editingFCB = $state<Partial<DatabaseCharacterFavoredClassBonus> | null>(null);

	let character = $derived(getCharacter(characterId));

	// Utility to compute a sorted list
	function computeFCBList(): DatabaseCharacterFavoredClassBonus[] {
		return [...(character.character_favored_class_bonuses ?? [])].sort((a, b) => a.level - b.level);
	}

	// Utility to create FCBLevelItem array up to the character.level
	function computeFCBByLevel(fcbs: DatabaseCharacterFavoredClassBonus[]): FCBLevelItem[] {
		const levels = Array.from({ length: character.level }, (_, i): FCBLevelItem => {
			const currentLevel = i + 1;
			const bonus = fcbs.find((b) => b.level === currentLevel) ?? null;
			return { level: currentLevel, bonus };
		});
		return levels;
	}

	let fcbList = $derived(computeFCBList());
	let fcbByLevel = $derived(computeFCBByLevel(fcbList));

	async function saveFCB() {
		if (!editingFCB?.level || !editingFCB.choice) return;

		const previousFCBs = [...(character.character_favored_class_bonuses ?? [])];

		try {
			// Check if we already have an FCB for that level
			const existingFCB = fcbList.find((fcb) => fcb.level === editingFCB!.level);

			// We'll unify "insert vs update" logic in the new helper, but we can do a check here:
			if (existingFCB) {
				// If we want to keep the same .id
				const saveData: FavoredClassBonusSaveData = {
					id: existingFCB.id,
					character_id: character.id,
					level: existingFCB.level,
					choice: editingFCB.choice as 'hp' | 'skill' | 'other'
				};

				// Call the helper
				const saved = await saveFavoredClassBonus(saveData);

				// Update local array
				const index = fcbList.findIndex((fcb) => fcb.id === saved.id);
				if (index >= 0 && character.character_favored_class_bonuses) {
					character.character_favored_class_bonuses = [
						...fcbList.slice(0, index),
						saved,
						...fcbList.slice(index + 1)
					];
				}
			} else {
				// Insert a brand new one
				const saveData: FavoredClassBonusSaveData = {
					character_id: character.id,
					level: editingFCB.level,
					choice: editingFCB.choice as 'hp' | 'skill' | 'other'
				};

				const saved = await saveFavoredClassBonus(saveData);

				if (!character.character_favored_class_bonuses) {
					character.character_favored_class_bonuses = [];
				}
				character.character_favored_class_bonuses = [...fcbList, saved];
			}

			editingFCB = null;
			showAddModal = false;
		} catch (err) {
			// rollback
			character.character_favored_class_bonuses = previousFCBs;
			updateState.error = new Error('Failed to save favored class bonus');
		}
	}

	async function deleteFCB(fcbId: number) {
		if (!confirm('Are you sure you want to delete this favored class bonus?')) return;

		const previousFCBs = [...(character.character_favored_class_bonuses ?? [])];

		try {
			// Call our new removeFavoredClassBonus
			await removeFavoredClassBonus(fcbId);

			if (character.character_favored_class_bonuses) {
				character.character_favored_class_bonuses =
					character.character_favored_class_bonuses.filter((fcb) => fcb.id !== fcbId);
			}
		} catch (err) {
			character.character_favored_class_bonuses = previousFCBs;
			updateState.error = new Error('Failed to delete favored class bonus');
		}
	}

	const fcbChoices = [
		{ value: 'hp' as const, label: 'Hit Point' },
		{ value: 'skill' as const, label: 'Skill Rank' },
		{ value: 'other' as const, label: 'Other Bonus' }
	];
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h2 class="text-xl font-bold">Favored Class Bonuses</h2>
		<button
			onclick={() => {
				editingFCB = { level: character.level };
				showAddModal = true;
			}}
			class="btn"
		>
			Add FCB
		</button>
	</div>

	{#if updateState.error}
		<div class="rounded-lg bg-red-100 p-4 text-red-700">
			{updateState.error.message}
		</div>
	{/if}

	<div class="grid gap-4 md:grid-cols-2">
		{#each fcbByLevel as { level, bonus }}
			<div class="rounded-lg bg-gray-50 p-4">
				<div class="flex items-start justify-between">
					<div>
						<div class="font-medium">Level {level}</div>
						{#if bonus}
							<div class="text-sm text-gray-600">
								Choice: {fcbChoices.find((c) => c.value === bonus.choice)?.label}
							</div>
						{:else}
							<div class="text-sm text-gray-400">No bonus selected</div>
						{/if}
					</div>
					<div class="flex gap-2">
						<button
							class="hover:text-primary-dark text-primary"
							onclick={() => {
								editingFCB = bonus ? { ...bonus } : { level };
								showAddModal = true;
							}}
						>
							{bonus ? 'Edit' : 'Add'}
						</button>
						{#if bonus}
							<button class="text-red-600 hover:text-red-700" onclick={() => deleteFCB(bonus.id)}>
								Delete
							</button>
						{/if}
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>

{#if showAddModal}
	<div class="modal">
		<div class="modal-content">
			<h3 class="mb-4 text-lg font-bold">
				{editingFCB?.id ? 'Edit' : 'Add'} Favored Class Bonus
			</h3>

			<div class="space-y-4">
				<div>
					<label for="fcb-level" class="mb-1 block text-sm font-medium"> Level </label>
					<input
						id="fcb-level"
						type="number"
						class="w-full rounded border p-2"
						bind:value={editingFCB!.level}
						min="1"
						max={character.level}
					/>
				</div>

				<div>
					<label for="fcb-choice" class="mb-1 block text-sm font-medium"> Choice </label>
					<select id="fcb-choice" class="w-full rounded border p-2" bind:value={editingFCB!.choice}>
						<option value="">Select choice...</option>
						{#each fcbChoices as choice}
							<option value={choice.value}>{choice.label}</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="mt-4 flex justify-end gap-2">
				<button
					class="btn btn-secondary"
					onclick={() => {
						editingFCB = null;
						showAddModal = false;
					}}
				>
					Cancel
				</button>
				<button
					class="btn btn-primary"
					disabled={!editingFCB?.level || !editingFCB.choice}
					onclick={saveFCB}
				>
					Save
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal-content {
		background: white;
		padding: 2rem;
		border-radius: 0.5rem;
		width: 100%;
		max-width: 32rem;
		margin: 1rem;
	}
</style>
