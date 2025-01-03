<!-- FILE: src/lib/ui/admin/FeatsManager.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { getCharacter, executeUpdate, type UpdateState } from '$lib/state/characterStore';
	import {
		getAllBaseFeats,
		createBaseFeat, 
		updateBaseFeat,
		removeBaseFeat,
		getFeatsForCharacter,
		saveCharacterFeat,
		removeCharacterFeat,
		type BaseFeatData,
		type DatabaseBaseFeat,
		type CharacterFeatData,
		type DatabaseCharacterFeat
	} from '$lib/db/feats';

	let { characterId } = $props<{ characterId: number }>();

	let updateState = $state<UpdateState>({
		status: 'idle',
		error: null
	});

	let character = $derived(getCharacter(characterId));
	let characterFeats = $state<DatabaseCharacterFeat[]>([]);
	let baseFeats = $state<DatabaseBaseFeat[]>([]);

	let showBaseFeatsModal = $state(false);
	let editingBaseFeat = $state<Partial<DatabaseBaseFeat> | null>(null);

	let showCharacterFeatModal = $state(false); 
	let editingCharFeat = $state<Partial<DatabaseCharacterFeat> | null>(null);

	onMount(async () => {
		try {
			baseFeats = await getAllBaseFeats();
		} catch (err) {
			updateState.error = new Error(`Failed to load base feats: ${String(err)}`);
		}

		try {
			const featsForChar = await getFeatsForCharacter(characterId, false);
			characterFeats = featsForChar;
		} catch (err) {
			updateState.error = new Error(`Failed to load character feats: ${String(err)}`);
		}
	});

	function unattachedBaseFeats(): DatabaseBaseFeat[] {
		const attachedBaseFeatIds = new Set(characterFeats.map(cf => cf.base_feat_id));
		return baseFeats.filter(bf => bf.id && !attachedBaseFeatIds.has(bf.id));
	}

	/* -------------------------------------------------------------------------
	 * SECTION A: Base Feats Management
	 * -------------------------------------------------------------------------
	 */
	async function handleCreateBaseFeat() {
		editingBaseFeat = {};
		showBaseFeatsModal = true;
	}

	async function handleEditBaseFeat(feat: DatabaseBaseFeat) {
		editingBaseFeat = { ...feat };
		showBaseFeatsModal = true;
	}

	async function handleSaveBaseFeat() {
		if (!editingBaseFeat) return;
		const isNew = !editingBaseFeat.id;

		const previous = [...baseFeats];

		await executeUpdate({
			key: `save-base-feat-${editingBaseFeat.id ?? 'new'}`,
			operation: async () => {
				const data: BaseFeatData = {
					name: editingBaseFeat?.name || '',
					feat_type: editingBaseFeat?.feat_type || '',
					label: editingBaseFeat?.label,
					description: editingBaseFeat?.description || null,
					effects: editingBaseFeat?.effects || {},
					prerequisites: editingBaseFeat?.prerequisites || null
				};

				let saved: DatabaseBaseFeat;
				if (isNew) {
					saved = await createBaseFeat(data);
					baseFeats.push(saved);
				} else {
					if (!editingBaseFeat?.id) return;
					saved = await updateBaseFeat(editingBaseFeat.id, data);
					const idx = baseFeats.findIndex(b => b.id === saved.id);
					if (idx >= 0) baseFeats[idx] = saved;
				}
			},
			optimisticUpdate: () => {
				// Optional optimistic UI updates
			},
			rollback: () => {
				baseFeats = previous;
			}
		}).catch(err => {
			updateState.error = new Error(`Failed to save base feat: ${String(err)}`);
		});

		editingBaseFeat = null;
		showBaseFeatsModal = false;
	}

	async function handleDeleteBaseFeat(feat: DatabaseBaseFeat) {
		if (!confirm(`Really delete base feat: ${feat.name}?`)) return;

		const previous = [...baseFeats];
		await executeUpdate({
			key: `delete-base-feat-${feat.id}`,
			operation: async () => {
				await removeBaseFeat(feat.id);
				baseFeats = baseFeats.filter(b => b.id !== feat.id);
			},
			optimisticUpdate: () => {
				// Optional optimistic UI updates
			},
			rollback: () => {
				baseFeats = previous;
			}
		}).catch(err => {
			updateState.error = new Error(`Failed to remove base feat: ${String(err)}`);
		});
	}

	/* -------------------------------------------------------------------------
	 * SECTION B: Character Feats Management
	 * -------------------------------------------------------------------------
	 */
	async function handleAttachFeat() {
		editingCharFeat = {
			character_id: characterId,
			selected_level: character.level ?? 1
		};
		showCharacterFeatModal = true;
	}

	async function handleEditCharacterFeat(cf: DatabaseCharacterFeat) {
		editingCharFeat = { ...cf };
		showCharacterFeatModal = true;
	}

	async function handleSaveCharacterFeat() {
		if (!editingCharFeat) return;

		const previous = [...characterFeats];
		const isNew = !editingCharFeat.id;

		await executeUpdate({
			key: `save-char-feat-${editingCharFeat.id ?? 'new'}`,
			operation: async () => {
				if (!editingCharFeat?.base_feat_id || !editingCharFeat?.character_id || !editingCharFeat?.selected_level) {
					throw new Error('Missing required fields (base_feat_id, character_id, selected_level).');
				}

				const payload: CharacterFeatData = {
					base_feat_id: editingCharFeat.base_feat_id,
					character_id: editingCharFeat.character_id,
					selected_level: editingCharFeat.selected_level,
					properties: editingCharFeat.properties ?? {},
					...(editingCharFeat.id ? { id: editingCharFeat.id } : {})
				};

				const saved = await saveCharacterFeat(payload);
				if (isNew) {
					characterFeats.push(saved);
				} else {
					const idx = characterFeats.findIndex(f => f.id === saved.id);
					if (idx >= 0) characterFeats[idx] = saved;
				}
			},
			optimisticUpdate: () => {
				// Optional optimistic UI updates
			},
			rollback: () => {
				characterFeats = previous;
			}
		}).catch(err => {
			updateState.error = new Error(`Failed to save character feat: ${String(err)}`);
		});

		editingCharFeat = null;
		showCharacterFeatModal = false;
	}

	async function handleDetachFeat(cf: DatabaseCharacterFeat) {
		if (!confirm(`Remove feat (ID ${cf.id}) from this character?`)) return;

		const previous = [...characterFeats];

		await executeUpdate({
			key: `remove-char-feat-${cf.id}`,
			operation: async () => {
				await removeCharacterFeat(cf.id);
				characterFeats = characterFeats.filter(f => f.id !== cf.id);
			},
			optimisticUpdate: () => {
				// Optional optimistic UI updates
			},
			rollback: () => {
				characterFeats = previous;
			}
		}).catch(err => {
			updateState.error = new Error(`Failed to detach feat: ${String(err)}`);
		});
	}

	function getBaseFeatName(cf: DatabaseCharacterFeat): string {
		if ((cf as any).base_feats?.name) {
			return (cf as any).base_feats.name;
		}
		return `BaseFeat#${cf.base_feat_id ?? '???'}`;
	}
</script>

<div class="space-y-6">
	<!-- SECTION A: Base Feats -->
	<section class="card space-y-3">
		<div class="flex items-center justify-between">
			<h2 class="text-xl font-bold">Base Feats Library</h2>
			<button class="btn" onclick={handleCreateBaseFeat}>Create New Base Feat</button>
		</div>

		{#if baseFeats.length === 0}
			<p class="text-gray-500">No base feats found.</p>
		{:else}
			<div class="grid gap-4 sm:grid-cols-2">
				{#each baseFeats as bf (bf.id)}
					<div class="rounded bg-gray-50 p-3">
						<div class="flex items-start justify-between">
							<div>
								<div class="font-medium text-lg">{bf.name}</div>
								<div class="text-sm text-gray-500">{bf.feat_type}</div>
								{#if bf.description}
									<p class="mt-1 text-sm">{bf.description}</p>
								{/if}
							</div>
							<div class="flex gap-2">
								<button class="text-primary hover:text-primary-dark" onclick={() => handleEditBaseFeat(bf)}>
									Edit
								</button>
								<button class="text-red-600 hover:text-red-700" onclick={() => handleDeleteBaseFeat(bf)}>
									Delete
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</section>

	<!-- SECTION B: Character Feats -->
	<section class="card space-y-3">
		<div class="flex items-center justify-between">
			<h2 class="text-xl font-bold">Character Feats</h2>
			<button class="btn" onclick={handleAttachFeat}>Attach Feat</button>
		</div>

		{#if characterFeats.length === 0}
			<p class="text-gray-500">No feats selected.</p>
		{:else}
			<div class="grid gap-4 sm:grid-cols-2">
				{#each characterFeats as cf (cf.id)}
					<div class="rounded bg-gray-50 p-3">
						<div class="flex items-start justify-between">
							<div>
								<div class="font-medium text-lg">{getBaseFeatName(cf)}</div>
								<div class="text-sm text-gray-500">
									Level {cf.selected_level}
								</div>
								{#if cf.properties}
									<div class="mt-2 text-sm">
										{#each Object.entries(cf.properties) as [k,v]}
											<div><strong>{k}:</strong> {v}</div>
										{/each}
									</div>
								{/if}
							</div>
							<div class="flex gap-2">
								<button class="text-primary hover:text-primary-dark" onclick={() => handleEditCharacterFeat(cf)}>
									Edit
								</button>
								<button class="text-red-600 hover:text-red-700" onclick={() => handleDetachFeat(cf)}>
									Remove
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</section>

	{#if updateState.error}
		<div class="rounded bg-red-100 p-3 text-red-600">
			{updateState.error.message}
		</div>
	{/if}
</div>

<!-- MODAL for Base Feats (Create / Edit) -->
{#if showBaseFeatsModal && editingBaseFeat}
	<div class="fixed inset-0 flex items-center justify-center bg-black/50">
		<div class="w-full max-w-2xl space-y-4 rounded bg-white p-6">
			<h3 class="text-xl font-bold">
				{editingBaseFeat.id ? 'Edit Base Feat' : 'Create Base Feat'}
			</h3>

			<div>
				<label for="feat-name" class="block text-sm font-medium">Name</label>
				<input
					id="feat-name"
					class="w-full rounded border p-2"
					bind:value={editingBaseFeat.name}
					placeholder="Enter base feat name"
				/>
			</div>
			<div>
				<label for="feat-type" class="block text-sm font-medium">Feat Type</label>
				<input
					id="feat-type"
					class="w-full rounded border p-2"
					bind:value={editingBaseFeat.feat_type}
					placeholder="e.g. combat, general, metamagic"
				/>
			</div>
			<div>
				<label for="feat-label" class="block text-sm font-medium">Label</label>
				<input
					id="feat-label"
					class="w-full rounded border p-2"
					bind:value={editingBaseFeat.label}
					placeholder="(optional) a user-friendly label"
					/>
			</div>
			<div>
				<label for="feat-description" class="block text-sm font-medium">Description</label>
				<textarea
					id="feat-description"
					class="w-full rounded border p-2"
					rows="3"
					bind:value={editingBaseFeat.description}
				></textarea>
			</div>
			<div>
				<label for="feat-effects" class="block text-sm font-medium">Effects (JSON)</label>
				<textarea
					id="feat-effects"
					class="w-full rounded border p-2"
					rows="3"
					oninput={(e) => {
						if (editingBaseFeat) {
							try {
								editingBaseFeat.effects = JSON.parse(e.currentTarget.value);
							} catch {
								// ignore invalid JSON
							}
						}
					}}
				>{editingBaseFeat.effects ? JSON.stringify(editingBaseFeat.effects, null, 2) : ''}</textarea>
			</div>
			<div>
				<label for="feat-prerequisites" class="block text-sm font-medium">Prerequisites (JSON)</label>
				<textarea
					id="feat-prerequisites"
					class="w-full rounded border p-2"
					rows="3"
					oninput={(e) => {
						if (editingBaseFeat) {
							try {
								editingBaseFeat.prerequisites = JSON.parse(e.currentTarget.value);
							} catch {
								// ignore invalid JSON
							}
						}
					}}
				>{editingBaseFeat.prerequisites ? JSON.stringify(editingBaseFeat.prerequisites, null, 2) : ''}</textarea>
			</div>

			<div class="flex justify-end gap-2">
				<button class="btn btn-secondary" onclick={() => {
					editingBaseFeat = null;
					showBaseFeatsModal = false;
				}}>
					Cancel
				</button>
				<button class="btn" onclick={handleSaveBaseFeat} disabled={updateState.status === 'syncing'}>
					Save
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- MODAL for Character Feats (Attach / Edit) -->
{#if showCharacterFeatModal && editingCharFeat}
	<div class="fixed inset-0 flex items-center justify-center bg-black/50">
		<div class="w-full max-w-2xl space-y-4 rounded bg-white p-6">
			<h3 class="text-xl font-bold">
				{editingCharFeat.id ? 'Edit Character Feat' : 'Attach Feat'}
			</h3>

			{#if !editingCharFeat.id}
				<div>
					<label for="base-feat-select" class="block text-sm font-medium">Base Feat</label>
					<select
						id="base-feat-select"
						class="w-full rounded border p-2"
						onchange={(e) => {
							if (editingCharFeat) {
								editingCharFeat.base_feat_id = parseInt(e.currentTarget.value) || 0;
							}
						}}
					>
						<option value="">Select a feat...</option>
						{#each unattachedBaseFeats() as bf}
							<option value={bf.id}>
								{bf.name} ({bf.feat_type})
							</option>
						{/each}
					</select>
				</div>
			{:else}
				<p class="text-sm text-gray-500">
					Base Feat ID: {editingCharFeat.base_feat_id}
				</p>
			{/if}

			<div>
				<label for="level-gained" class="block text-sm font-medium">Level Gained</label>
				<input
					id="level-gained"
					type="number"
					class="w-full rounded border p-2"
					bind:value={editingCharFeat.selected_level}
						min="1"
						max={character.level}
				/>
			</div>

			<div>
				<label for="char-feat-properties" class="block text-sm font-medium">Properties (JSON)</label>
				<textarea
					id="char-feat-properties"
					class="w-full rounded border p-2"
					rows="3"
					oninput={(e) => {
						if (editingCharFeat) {
							try {
								editingCharFeat.properties = JSON.parse(e.currentTarget.value);
							} catch {
								// ignore invalid JSON
							}
						}
					}}
				>{editingCharFeat.properties ? JSON.stringify(editingCharFeat.properties, null, 2) : ''}</textarea>
			</div>

			<div class="flex justify-end gap-2">
				<button class="btn btn-secondary" onclick={() => {
					editingCharFeat = null;
					showCharacterFeatModal = false;
				}}>
					Cancel
				</button>
				<button class="btn" onclick={handleSaveCharacterFeat} disabled={updateState.status === 'syncing'}>
					Save
				</button>
			</div>
		</div>
	</div>
{/if}

<style lang="postcss">
	.card {
		@apply rounded-lg border bg-white p-4 shadow;
	}
</style>