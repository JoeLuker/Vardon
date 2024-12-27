<!-- FILE: src/lib/ui/admin/FeatsManager.svelte -->
<script lang="ts">
	import { getCharacter } from '$lib/state/character.svelte';
	import type { UpdateState } from '$lib/utils/updates';
	import {
		saveFeat as dbSaveFeat,
		removeFeat as dbRemoveFeat,
		type FeatSaveData
	} from '$lib/db/feats';

	import type { DatabaseCharacterFeat } from '$lib/domain/types/character';
	import type { Json } from '$lib/domain/types/supabase';

	let { characterId } = $props<{ characterId: number }>();

	let updateState = $state<UpdateState>({
		status: 'idle',
		error: null
	});

	let showAddModal = $state(false);
	let editingFeat = $state<Partial<DatabaseCharacterFeat> | null>(null);

	let character = $derived(getCharacter(characterId));
	let featList = $derived(
		[...(character.character_feats ?? [])].sort((a, b) => a.selected_level - b.selected_level)
	);

	// We keep featTypes for the dropdown
	const featTypes = [
		{ value: 'combat', label: 'Combat' },
		{ value: 'general', label: 'General' },
		{ value: 'metamagic', label: 'Metamagic' },
		{ value: 'racial', label: 'Racial' }
	];

	async function saveFeat() {
		if (!editingFeat?.feat_name || !editingFeat?.feat_type || !editingFeat?.selected_level) {
			return;
		}

		const isNew = !editingFeat.id;
		const previousFeats = [...(character.character_feats ?? [])];

		try {
			// Build the data for upsert
			const saveData: FeatSaveData = {
				feat_name: editingFeat.feat_name,
				feat_type: editingFeat.feat_type,
				selected_level: editingFeat.selected_level,
				character_id: character.id,
				properties: editingFeat.properties as Json
			};

			if (!isNew) {
				saveData.id = editingFeat.id; // If we have an id, it’s an update
			}

			// Call our new DB helper
			const savedFeat = await dbSaveFeat(saveData);

			// Update local store
			if (!character.character_feats) {
				character.character_feats = [];
			}

			if (isNew) {
				character.character_feats.push(savedFeat);
			} else {
				const index = character.character_feats.findIndex((f) => f.id === savedFeat.id);
				if (index >= 0) {
					character.character_feats[index] = savedFeat;
				}
			}

			editingFeat = null;
			showAddModal = false;
		} catch (err) {
			console.error('Failed to save feat:', err);
			// rollback
			character.character_feats = previousFeats;
			updateState.error = new Error('Failed to save feat');
		}
	}

	async function deleteFeat(feat: DatabaseCharacterFeat) {
		if (!confirm(`Are you sure you want to delete ${feat.feat_name}?`)) return;

		const previousFeats = [...(character.character_feats ?? [])];

		try {
			// Use the removeFeat helper
			await dbRemoveFeat(feat.id);

			// Remove from local array
			if (character.character_feats) {
				character.character_feats = character.character_feats.filter((f) => f.id !== feat.id);
			}
		} catch (err) {
			console.error('Failed to delete feat:', err);
			character.character_feats = previousFeats;
			updateState.error = new Error('Failed to delete feat');
		}
	}

	function formatFeatType(type: string): string {
		return type.charAt(0).toUpperCase() + type.slice(1);
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h2 class="text-xl font-bold">Feats</h2>
		<button
			class="btn"
			onclick={() => {
				editingFeat = { selected_level: character.level };
				showAddModal = true;
			}}
		>
			Add Feat
		</button>
	</div>

	{#if updateState.error}
		<div class="rounded-lg bg-red-100 p-4 text-red-700">
			{updateState.error.message}
		</div>
	{/if}

	<div class="grid gap-4 md:grid-cols-2">
		{#each featList as feat (feat.id)}
			<div class="rounded-lg bg-gray-50 p-4">
				<div class="flex items-start justify-between">
					<div>
						<div class="text-lg font-medium">{feat.feat_name}</div>
						<div class="text-sm text-gray-500">
							Level {feat.selected_level} • {formatFeatType(feat.feat_type)}
						</div>
						{#if feat.properties}
							<div class="mt-2 space-y-1 text-sm">
								{#each Object.entries(feat.properties) as [key, value]}
									<div>
										<span class="font-medium">{key}:</span>
										{value}
									</div>
								{/each}
							</div>
						{/if}
					</div>
					<div class="flex gap-2">
						<button
							class="hover:text-primary-dark text-primary"
							onclick={() => {
								editingFeat = { ...feat };
								showAddModal = true;
							}}
						>
							Edit
						</button>
						<button class="text-red-600 hover:text-red-700" onclick={() => deleteFeat(feat)}>
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
				{editingFeat?.id ? 'Edit' : 'Add'} Feat
			</h3>

			<div class="space-y-4">
				<div>
					<label for="feat-name" class="mb-1 block text-sm font-medium"> Feat Name </label>
					<input
						id="feat-name"
						type="text"
						class="w-full rounded border p-2"
						value={editingFeat?.feat_name ?? ''}
						oninput={(e) => {
							if (editingFeat) {
								editingFeat.feat_name = e.currentTarget.value;
							}
						}}
						placeholder="Enter feat name"
					/>
				</div>

				<div>
					<label for="feat-type" class="mb-1 block text-sm font-medium"> Feat Type </label>
					<select
						id="feat-type"
						class="w-full rounded border p-2"
						value={editingFeat?.feat_type ?? ''}
						onchange={(e) => {
							if (editingFeat) {
								editingFeat.feat_type = e.currentTarget.value;
							}
						}}
					>
						<option value="">Select type...</option>
						{#each featTypes as type}
							<option value={type.value}>{type.label}</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="feat-level" class="mb-1 block text-sm font-medium"> Level Gained </label>
					<input
						id="feat-level"
						type="number"
						class="w-full rounded border p-2"
						value={editingFeat?.selected_level ?? character.level}
						oninput={(e) => {
							if (editingFeat) {
								editingFeat.selected_level = parseInt(e.currentTarget.value) || character.level;
							}
						}}
						min="1"
						max={character.level}
					/>
				</div>

				<div>
					<label for="feat-properties" class="mb-1 block text-sm font-medium">
						Properties (JSON)
					</label>
					<textarea
						id="feat-properties"
						class="w-full rounded border p-2"
						rows="4"
						value={editingFeat?.properties ? JSON.stringify(editingFeat.properties, null, 2) : ''}
						oninput={(e) => {
							if (editingFeat) {
								try {
									editingFeat.properties = JSON.parse(e.currentTarget.value);
								} catch {
									// invalid JSON
								}
							}
						}}
						placeholder="Enter properties as JSON"
					></textarea>
				</div>

				<div class="flex justify-end gap-2">
					<button
						class="btn btn-secondary"
						onclick={() => {
							editingFeat = null;
							showAddModal = false;
						}}
					>
						Cancel
					</button>
					<button class="btn" onclick={saveFeat} disabled={updateState.status === 'syncing'}>
						{editingFeat?.id ? 'Save Changes' : 'Add Feat'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
