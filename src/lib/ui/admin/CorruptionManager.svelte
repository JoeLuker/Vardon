<!-- src/lib/ui/admin/CorruptionManager.svelte -->
<script lang="ts">
	import { getCharacter } from '$lib/state/character.svelte';
	import type { UpdateState } from '$lib/state/updates.svelte';

	import {
		upsertCorruption,
		deleteCorruption,
		type DBCorruption,
		type CorruptionUpdate
	} from '$lib/db/corruptions';
	import type { Character } from '$lib/domain/types/character';

	let { characterId } = $props<{ characterId: number }>();

	// We create a derived store function that *returns* a Character
	// We'll call it getChar() in code to emphasize that we invoke it.
	let getChar = $derived((): Character => {
		// If getCharacter might return undefined, use a fallback:
		//   const c = getCharacter(characterId);
		//   return c ?? someEmptyCharacter;
		// but if you're sure it always returns a valid Character, just do this:
		return getCharacter(characterId);
	});

	let updateState = $state<UpdateState>({
		status: 'idle',
		error: null
	});

	let showAddModal = $state(false);

	// editingCorruption can be null or a CorruptionUpdate object
	let editingCorruption = $state<CorruptionUpdate | null>(null);

	// A second derived store for the sorted corruption list
	let getCorruptionList = $derived((): DBCorruption[] => {
		// Ensure we always return an array, even if character_corruptions is undefined
		return [...(getChar().character_corruptions ?? [])].sort(
			(a, b) => (a.corruption_stage ?? 0) - (b.corruption_stage ?? 0)
		);
	});

	async function saveCorruption() {
		if (!editingCorruption?.corruption_type || editingCorruption.corruption_stage == null) {
			return;
		}

		const isNew = editingCorruption.id === 0;
		const previousCorruptions = [...(getChar().character_corruptions ?? [])];

		try {
			updateState.status = 'syncing';
			const savedCorruption = await upsertCorruption(editingCorruption);

			if (!getChar().character_corruptions) {
				getChar().character_corruptions = [];
			}
			const arr = getChar().character_corruptions as DBCorruption[];

			if (isNew) {
				arr.push(savedCorruption);
			} else {
				const index = arr.findIndex((c) => c.id === savedCorruption.id);
				if (index >= 0) {
					arr[index] = savedCorruption;
				}
			}

			editingCorruption = null;
			showAddModal = false;
			updateState.status = 'idle';
		} catch (err) {
			console.error('Failed to save corruption:', err);
			// Roll back if anything fails
			getChar().character_corruptions = previousCorruptions;
			updateState.error = new Error('Failed to save corruption');
			updateState.status = 'error';
		}
	}

	async function handleDeleteCorruption(corruption: DBCorruption) {
		if (!confirm(`Are you sure you want to delete this corruption?`)) return;

		const previousCorruptions = [...(getChar().character_corruptions ?? [])];

		try {
			updateState.status = 'syncing';
			await deleteCorruption(corruption.id);

			if (!getChar().character_corruptions) {
				getChar().character_corruptions = [];
			}
			const arr = getChar().character_corruptions as DBCorruption[];
			getChar().character_corruptions = arr.filter((c) => c.id !== corruption.id);

			updateState.status = 'idle';
		} catch (err) {
			console.error('Failed to delete corruption:', err);
			getChar().character_corruptions = previousCorruptions;
			updateState.error = new Error('Failed to delete corruption');
			updateState.status = 'error';
		}
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h2 class="text-xl font-bold">Corruptions</h2>
		<button
			class="btn"
			onclick={() => {
				editingCorruption = {
					id: 0,
					corruption_type: '',
					corruption_stage: 0,
					character_id: getChar().id,
					blood_consumed: 0,
					blood_required: 0,
					sync_status: 'pending',
					properties: {}
				};
				showAddModal = true;
			}}
		>
			Add Corruption
		</button>
	</div>

	{#if updateState.error}
		<div class="rounded-lg bg-red-100 p-4 text-red-700">
			{updateState.error.message}
		</div>
	{/if}

	<div class="grid gap-4 md:grid-cols-2">
		<!-- Here's the important part — call getCorruptionList() rather than corruptionList -->
		{#each getCorruptionList() as corruption (corruption.id)}
			<div class="rounded-lg bg-gray-50 p-4">
				<div class="flex items-start justify-between">
					<div>
						<div class="font-medium">{corruption.corruption_type}</div>
						<div class="text-sm text-gray-500">
							Stage {corruption.corruption_stage ?? 0}
						</div>
						<div class="mt-2 space-y-1 text-sm">
							<div>Blood Consumed: {corruption.blood_consumed ?? 0}</div>
							<div>Blood Required: {corruption.blood_required ?? 0}</div>
							<div>Status: {corruption.sync_status}</div>
						</div>
					</div>
					<div class="flex gap-2">
						<button
							class="hover:text-primary-dark text-primary"
							onclick={() => {
								editingCorruption = { ...corruption };
								showAddModal = true;
							}}
						>
							Edit
						</button>
						<button
							class="text-red-600 hover:text-red-700"
							onclick={() => handleDeleteCorruption(corruption)}
						>
							Delete
						</button>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>

{#if showAddModal}
	<div class="fixed inset-0 flex items-center justify-center bg-black/50">
		<div class="w-full max-w-2xl rounded-lg bg-white p-6">
			<h3 class="mb-4 text-xl font-bold">
				{editingCorruption?.id ? 'Edit' : 'Add'} Corruption
			</h3>

			<div class="space-y-4">
				<div>
					<label for="corruption-type" class="mb-1 block text-sm font-medium">
						Corruption Type
					</label>
					<input
						id="corruption-type"
						type="text"
						class="w-full rounded border p-2"
						bind:value={editingCorruption!.corruption_type}
						placeholder="Enter corruption type"
					/>
				</div>

				<div>
					<label for="corruption-stage" class="mb-1 block text-sm font-medium">
						Corruption Stage
					</label>
					<input
						id="corruption-stage"
						type="number"
						class="w-full rounded border p-2"
						bind:value={editingCorruption!.corruption_stage}
						min="0"
					/>
				</div>

				<div>
					<label for="blood-consumed" class="mb-1 block text-sm font-medium">
						Blood Consumed
					</label>
					<input
						id="blood-consumed"
						type="number"
						class="w-full rounded border p-2"
						bind:value={editingCorruption!.blood_consumed}
						min="0"
					/>
				</div>

				<div>
					<label for="blood-required" class="mb-1 block text-sm font-medium">
						Blood Required
					</label>
					<input
						id="blood-required"
						type="number"
						class="w-full rounded border p-2"
						bind:value={editingCorruption!.blood_required}
						min="0"
					/>
				</div>

				<div class="flex justify-end gap-2">
					<button
						class="btn btn-secondary"
						onclick={() => {
							editingCorruption = null;
							showAddModal = false;
						}}
					>
						Cancel
					</button>
					<button
						class="btn btn-primary"
						disabled={!editingCorruption?.corruption_type}
						onclick={saveCorruption}
					>
						Save
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	/* You can keep your existing styles as-is */
</style>
