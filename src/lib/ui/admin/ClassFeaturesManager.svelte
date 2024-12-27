<!-- FILE: src/lib/ui/admin/ClassFeaturesManager.svelte -->
<script lang="ts">
	import { getCharacter } from '$lib/state/character.svelte';
	import { type UpdateState } from '$lib/state/updates.svelte';

	// Remove the old "import type { DatabaseCharacterClassFeature }"...
	// Instead, import your new unified type from the DB utility:
	import {
		saveClassFeature,
		deleteClassFeature,
		type DBClassFeature,
		type SaveClassFeatureDTO
	} from '$lib/db/classFeatures';

	let { characterId } = $props<{ characterId: number }>();

	let updateState = $state<UpdateState>({
		status: 'idle',
		error: null
	});

	let showAddModal = $state(false);

	// editingFeature uses the new DBClassFeature shape
	// partial so we can have optional fields while editing
	let editingFeature = $state<Partial<DBClassFeature> | null>(null);

	// We still rely on the derived character from your store
	let character = $derived(getCharacter(characterId));

	// Then sort them, but cast to DBClassFeature[] if needed
	let featureList = $derived(
		([...(character.character_class_features ?? [])] as DBClassFeature[]).sort(
			(a, b) => a.feature_level - b.feature_level
		)
	);

	async function saveFeature() {
		if (!editingFeature?.feature_name || !editingFeature.feature_level) {
			return;
		}

		const isNew = !editingFeature.id;
		const previousFeatures = [...(character.character_class_features ?? [])];

		try {
			updateState.status = 'syncing';

			// Build the DTO for the DB function
			const saveData: SaveClassFeatureDTO = {
				feature_name: editingFeature.feature_name,
				feature_level: editingFeature.feature_level,
				character_id: character.id,
				properties: editingFeature.properties ?? null,
				active: editingFeature.active ?? true
			};

			// Call the new DB utility
			const savedFeature = await saveClassFeature(saveData, editingFeature.id);

			// Update local store
			if (character.character_class_features) {
				if (isNew) {
					character.character_class_features.push(savedFeature);
				} else {
					const index = character.character_class_features.findIndex(
						(f) => f.id === savedFeature.id
					);
					if (index >= 0) {
						character.character_class_features[index] = savedFeature;
					}
				}
			}

			editingFeature = null;
			showAddModal = false;
			updateState.status = 'idle';
		} catch (err) {
			console.error('Failed to save feature:', err);
			character.character_class_features = previousFeatures;
			updateState.error = new Error('Failed to save feature');
			updateState.status = 'error';
		}
	}

	async function handleDeleteFeature(feature: DBClassFeature) {
		if (!confirm(`Are you sure you want to delete ${feature.feature_name}?`)) return;

		const previousFeatures = [...(character.character_class_features ?? [])];

		try {
			updateState.status = 'syncing';

			await deleteClassFeature(feature.id);

			if (character.character_class_features) {
				character.character_class_features = character.character_class_features.filter(
					(f) => f.id !== feature.id
				);
			}

			updateState.status = 'idle';
		} catch (err) {
			console.error('Failed to delete feature:', err);
			character.character_class_features = previousFeatures;
			updateState.error = new Error('Failed to delete feature');
			updateState.status = 'error';
		}
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h2 class="text-xl font-bold">Class Features</h2>
		<button
			class="btn"
			onclick={() => {
				editingFeature = { feature_level: 1, active: true };
				showAddModal = true;
			}}
		>
			Add Feature
		</button>
	</div>

	<div class="grid gap-4 md:grid-cols-2">
		{#each featureList as feature (feature.id)}
			<div class="rounded-lg bg-gray-50 p-4 {!feature.active ? 'opacity-60' : ''}">
				<div class="flex items-start justify-between">
					<div>
						<div class="font-medium">{feature.feature_name}</div>
						<div class="text-sm text-gray-500">Level {feature.feature_level}</div>
						{#if feature.properties}
							<div class="mt-2 text-sm">
								{#each Object.entries(feature.properties ?? {}) as [key, value]}
									<div>{key}: {value}</div>
								{/each}
							</div>
						{/if}
					</div>
					<div class="flex gap-2">
						<button
							class="hover:text-primary-dark text-primary"
							onclick={() => {
								editingFeature = { ...feature };
								showAddModal = true;
							}}
						>
							Edit
						</button>
						<button
							class="text-red-600 hover:text-red-700"
							onclick={() => handleDeleteFeature(feature)}
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
				{editingFeature?.id ? 'Edit' : 'Add'} Class Feature
			</h3>

			<div class="space-y-4">
				<div>
					<label for="feature-name" class="mb-1 block text-sm font-medium"> Feature Name </label>
					<input
						id="feature-name"
						type="text"
						class="w-full rounded border p-2"
						value={editingFeature?.feature_name ?? ''}
						oninput={(e) => {
							if (editingFeature) {
								editingFeature.feature_name = e.currentTarget.value;
							}
						}}
						placeholder="Enter feature name"
					/>
				</div>

				<div>
					<label for="feature-level" class="mb-1 block text-sm font-medium"> Level </label>
					<input
						id="feature-level"
						type="number"
						class="w-full rounded border p-2"
						value={editingFeature?.feature_level ?? 1}
						oninput={(e) => {
							if (editingFeature) {
								editingFeature.feature_level = parseInt(e.currentTarget.value);
							}
						}}
						min="1"
						max="20"
					/>
				</div>

				<div class="flex items-center gap-2">
					<input
						id="feature-active"
						type="checkbox"
						class="rounded"
						checked={editingFeature?.active ?? true}
						oninput={(e) => {
							if (editingFeature) {
								editingFeature.active = e.currentTarget.checked;
							}
						}}
					/>
					<label for="feature-active" class="text-sm font-medium">Active</label>
				</div>

				<div>
					<label for="feature-properties" class="mb-1 block text-sm font-medium">
						Properties (JSON)
					</label>
					<textarea
						id="feature-properties"
						class="w-full rounded border p-2"
						rows="4"
						value={editingFeature?.properties
							? JSON.stringify(editingFeature.properties, null, 2)
							: ''}
						oninput={(e) => {
							if (editingFeature) {
								try {
									editingFeature.properties = JSON.parse(e.currentTarget.value);
								} catch (err) {
									// Invalid JSON?
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
							editingFeature = null;
							showAddModal = false;
						}}
					>
						Cancel
					</button>
					<button class="btn" onclick={saveFeature} disabled={updateState.status === 'syncing'}>
						{editingFeature?.id ? 'Save Changes' : 'Add Feature'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
