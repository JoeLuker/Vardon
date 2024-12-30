<!-- FILE: src/lib/ui/admin/ClassFeaturesManager.svelte -->
<script lang="ts">
	/**
	 * Because there's no 'updates.svelte' file, we'll define our own minimal UpdateState here.
	 * Adjust or expand as needed for your error-handling logic.
	 */

	import { getCharacter, type UpdateState } from '$lib/state/characterStore.svelte'; // adjust if needed
	import {
		saveClassFeature,
		deleteClassFeature,
		type DBClassFeature,
		type SaveClassFeatureDTO
	} from '$lib/db/classFeatures';

	let { characterId } = $props<{ characterId: number }>();

	// We track our update state with a local reactive object
	let updateState = $state<UpdateState>({
		status: 'idle',
		error: null
	});

	let showAddModal = $state(false);

	// We'll store the feature being edited (or null if not editing).
	let editingFeature = $state<Partial<DBClassFeature> | null>(null);

	// Use getCharacter() from your store to get the up-to-date Character
	let character = $derived(getCharacter(characterId));

	// Prepare a list of features, sorted by `feature_level`
	let featureList = $derived(
		([...(character.character_class_features ?? [])] as DBClassFeature[]).sort(
			(a, b) => a.feature_level - b.feature_level
		)
	);

	/**
	 * Save (create or update) the currently edited feature.
	 * If 'editingFeature.id' is missing => insert new; else update existing.
	 */
	async function saveFeature() {
		if (!editingFeature?.feature_name || !editingFeature.feature_level) {
			return;
		}

		const isNew = editingFeature.id == null;
		// Keep a copy of the old array in case we need to rollback
		const previousFeatures = [...(character.character_class_features ?? [])];

		try {
			updateState.status = 'syncing';

			// Build the data object for the DB call
			const saveData: SaveClassFeatureDTO = {
				feature_name: editingFeature.feature_name,
				feature_level: editingFeature.feature_level,
				character_id: character.id,
				properties: editingFeature.properties ?? null,
				active: editingFeature.active ?? true
			};

			const savedFeature = await saveClassFeature(saveData, editingFeature.id);

			if (!character.character_class_features) {
				character.character_class_features = [];
			}

			if (isNew) {
				// Insert
				character.character_class_features.push(savedFeature);
			} else {
				// Update in place
				const index = character.character_class_features.findIndex((f) => f.id === savedFeature.id);
				if (index >= 0) {
					character.character_class_features[index] = savedFeature;
				}
			}

			editingFeature = null;
			showAddModal = false;
			updateState.status = 'idle';
		} catch (err) {
			console.error('Failed to save feature:', err);
			character.character_class_features = previousFeatures;
			updateState.error = err instanceof Error ? err : new Error(String(err));
			updateState.status = 'error';
		}
	}

	/**
	 * Delete an existing class feature by ID.
	 */
	async function handleDeleteFeature(feature: DBClassFeature) {
		if (!confirm(`Are you sure you want to delete ${feature.feature_name}?`)) return;

		const previousFeatures = [...(character.character_class_features ?? [])];

		try {
			updateState.status = 'syncing';

			await deleteClassFeature(feature.id);

			character.character_class_features =
				character.character_class_features?.filter((f) => f.id !== feature.id) ?? [];

			updateState.status = 'idle';
		} catch (err) {
			console.error('Failed to delete feature:', err);
			character.character_class_features = previousFeatures;
			updateState.error = err instanceof Error ? err : new Error(String(err));
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

	<!-- Show the sorted list of features -->
	<div class="grid gap-4 md:grid-cols-2">
		{#each featureList as feature (feature.id)}
			<div class="rounded-lg bg-gray-50 p-4 {feature.active ? '' : 'opacity-60'}">
				<div class="flex items-start justify-between">
					<div>
						<div class="font-medium">{feature.feature_name}</div>
						<div class="text-sm text-gray-500">Level {feature.feature_level}</div>
						{#if feature.properties}
							<div class="mt-2 text-sm">
								{#each Object.entries(feature.properties) as [key, value]}
									<div>{key}: {value}</div>
								{/each}
							</div>
						{/if}
					</div>
					<div class="flex gap-2">
						<button
							class="text-primary hover:text-primary-dark"
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

<!-- Modal for adding/editing a class feature -->
{#if showAddModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
		<div class="w-full max-w-2xl rounded-lg bg-white p-6">
			<h3 class="mb-4 text-xl font-bold">
				{editingFeature?.id ? 'Edit' : 'Add'} Class Feature
			</h3>

			<div class="space-y-4">
				<div>
					<label for="feature-name" class="mb-1 block text-sm font-medium">Feature Name</label>
					<input
						id="feature-name"
						type="text"
						class="w-full rounded border p-2"
						value={editingFeature?.feature_name ?? ''}
						oninput={(e) => {
							if (editingFeature) {
								editingFeature.feature_name = (e.currentTarget as HTMLInputElement).value;
							}
						}}
						placeholder="Enter feature name"
					/>
				</div>

				<div>
					<label for="feature-level" class="mb-1 block text-sm font-medium">Level</label>
					<input
						id="feature-level"
						type="number"
						class="w-full rounded border p-2"
						value={editingFeature?.feature_level ?? 1}
						oninput={(e) => {
							if (editingFeature) {
								const val = parseInt((e.currentTarget as HTMLInputElement).value) || 1;
								editingFeature.feature_level = val;
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
								editingFeature.active = (e.currentTarget as HTMLInputElement).checked;
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
							if (!editingFeature) return;
							try {
								const parsed = JSON.parse((e.currentTarget as HTMLTextAreaElement).value);
								editingFeature.properties = parsed;
							} catch {
								// handle invalid JSON if needed
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
					<button
						class="btn"
						disabled={updateState.status === 'syncing'}
						onclick={saveFeature}
					>
						{editingFeature?.id ? 'Save Changes' : 'Add Feature'}
					</button>
				</div>

				{#if updateState.error && updateState.status === 'error'}
					<div class="rounded bg-red-50 p-2 text-red-700">
						{updateState.error.message}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
