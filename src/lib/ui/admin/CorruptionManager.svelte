<!-- src/lib/ui/admin/CorruptionManager.svelte -->
<script lang="ts">
	import { getCharacter, executeUpdate } from '$lib/state/characterStore';
	import { upsertCorruption, deleteCorruption } from '$lib/db/corruptions';
	import type { DBCorruption, CorruptionUpdate } from '$lib/db/corruptions';

	let { characterId } = $props<{ characterId: number }>();

	// Get the character directly
	let character = $derived(getCharacter(characterId));

	// Sort corruptions directly with $derived
	let corruptions = $derived([...(character.character_corruptions ?? [])].sort(
		(a, b) => (a.corruption_stage ?? 0) - (b.corruption_stage ?? 0)
	));

	let updateState = $state({
		status: 'idle' as const,
		error: null as Error | null
	});

	let showAddModal = $state(false);
	let editingCorruption = $state<CorruptionUpdate | null>(null);

	async function saveCorruption() {
		if (!editingCorruption?.corruption_type || editingCorruption.corruption_stage == null) {
			return;
		}

		const previousCorruptions = [...(character.character_corruptions ?? [])];

		await executeUpdate({
			key: `corruption-${character.id}-${editingCorruption.id || 'new'}`,
			operation: async () => {
				const savedCorruption = await upsertCorruption(editingCorruption!);
				if (!character.character_corruptions) {
					character.character_corruptions = [];
				}
				const isNew = editingCorruption!.id === 0;
				if (isNew) {
					character.character_corruptions.push(savedCorruption);
				} else {
					const idx = character.character_corruptions.findIndex((c) => c.id === savedCorruption.id);
					if (idx >= 0) character.character_corruptions[idx] = savedCorruption;
				}
			},
			optimisticUpdate: () => {},
			rollback: () => {
				character.character_corruptions = previousCorruptions;
			}
		});

		editingCorruption = null;
		showAddModal = false;
	}

	async function handleDeleteCorruption(corruption: DBCorruption) {
		if (!confirm('Are you sure you want to delete this corruption?')) return;

		const previousCorruptions = [...(character.character_corruptions ?? [])];

		await executeUpdate({
			key: `delete-corruption-${corruption.id}`,
			operation: async () => {
				await deleteCorruption(corruption.id);
				character.character_corruptions = character.character_corruptions?.filter(
					(c) => c.id !== corruption.id
				) ?? [];
			},
			optimisticUpdate: () => {},
			rollback: () => {
				character.character_corruptions = previousCorruptions;
			}
		});
	}

	function addNewCorruption() {
		editingCorruption = {
			id: 0,
			corruption_type: '',
			corruption_stage: 0,
			character_id: character.id,
			blood_consumed: 0,
			blood_required: 0,
			sync_status: 'pending',
			properties: {}
		};
		showAddModal = true;
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h2 class="text-xl font-bold">Corruptions</h2>
		<button class="btn" onclick={addNewCorruption}>Add Corruption</button>
	</div>

	{#if updateState.error}
		<div class="rounded-lg bg-red-100 p-4 text-red-700">
			{updateState.error.message}
		</div>
	{/if}

	<div class="grid gap-4 md:grid-cols-2">
		{#each corruptions as corruption (corruption.id)}
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
