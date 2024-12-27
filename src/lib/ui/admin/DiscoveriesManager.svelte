<!-- FILE: src/lib/ui/admin/DiscoveriesManager.svelte -->
<script lang="ts">
	import { getCharacter } from '$lib/state/character.svelte';
	import { type UpdateState } from '$lib/state/updates.svelte';

	import { saveDiscovery, removeDiscovery, type DiscoverySaveData } from '$lib/db/discoveries';
	import type { DatabaseCharacterDiscovery } from '$lib/domain/types/character';
	import type { Json } from '$lib/domain/types/supabase';

	let { characterId } = $props<{ characterId: number }>();

	let updateState = $state<UpdateState>({
		status: 'idle',
		error: null
	});

	let showAddModal = $state(false);
	let editingDiscovery = $state<Partial<DatabaseCharacterDiscovery> | null>(null);

	let character = $derived(getCharacter(characterId));

	let discoveryList = $derived(
		[...(character.character_discoveries ?? [])].sort((a, b) => a.selected_level - b.selected_level)
	);

	async function saveCurrentDiscovery() {
		if (!editingDiscovery?.discovery_name || !editingDiscovery.selected_level) {
			return;
		}

		const isNew = !editingDiscovery.id;
		const previousDiscoveries = [...(character.character_discoveries ?? [])];

		try {
			updateState.status = 'syncing';

			// Prepare data for our new saveDiscovery function
			const saveData: DiscoverySaveData = {
				discovery_name: editingDiscovery.discovery_name,
				selected_level: editingDiscovery.selected_level,
				character_id: character.id,
				properties: editingDiscovery.properties as Json,
				// If it has an id, pass it (meaning update)
				...(editingDiscovery.id ? { id: editingDiscovery.id } : {})
			};

			// Use the new DB function
			const savedDiscovery = await saveDiscovery(saveData);

			// Update local state
			if (character.character_discoveries) {
				if (isNew) {
					character.character_discoveries.push(savedDiscovery);
				} else {
					const index = character.character_discoveries.findIndex(
						(d) => d.id === savedDiscovery.id
					);
					if (index >= 0) {
						character.character_discoveries[index] = savedDiscovery;
					}
				}
			}

			editingDiscovery = null;
			showAddModal = false;
		} catch (err) {
			console.error('Failed to save discovery:', err);
			character.character_discoveries = previousDiscoveries;
			updateState.error = new Error('Failed to save discovery');
		} finally {
			updateState.status = 'idle';
		}
	}

	async function deleteDiscovery(discovery: DatabaseCharacterDiscovery) {
		if (!confirm(`Are you sure you want to delete ${discovery.discovery_name}?`)) return;

		const previousDiscoveries = [...(character.character_discoveries ?? [])];

		try {
			updateState.status = 'syncing';

			// Use removeDiscovery from our new file
			await removeDiscovery(discovery.id);

			// Remove from local array
			if (character.character_discoveries) {
				character.character_discoveries = character.character_discoveries.filter(
					(d) => d.id !== discovery.id
				);
			}
		} catch (err) {
			console.error('Failed to delete discovery:', err);
			character.character_discoveries = previousDiscoveries;
			updateState.error = new Error('Failed to delete discovery');
		} finally {
			updateState.status = 'idle';
		}
	}

	function formatDiscoveryName(name: string): string {
		return name
			.replace(/([A-Z])/g, ' $1')
			.split(' ')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h2 class="text-xl font-bold">Discoveries</h2>
		<button
			class="btn"
			onclick={() => {
				editingDiscovery = { selected_level: character.level };
				showAddModal = true;
			}}
		>
			Add Discovery
		</button>
	</div>

	{#if updateState.error}
		<div class="rounded-lg bg-red-100 p-4 text-red-700">
			{updateState.error.message}
		</div>
	{/if}

	<div class="grid gap-4 md:grid-cols-2">
		{#each discoveryList as discovery (discovery.id)}
			<div class="rounded-lg bg-gray-50 p-4">
				<div class="flex items-start justify-between">
					<div>
						<div class="font-medium">
							{formatDiscoveryName(discovery.discovery_name)}
						</div>
						<div class="text-sm text-gray-500">Level {discovery.selected_level}</div>
						{#if discovery.properties}
							<div class="mt-2 text-sm">
								{#each Object.entries(discovery.properties) as [key, value]}
									<div>{key}: {value}</div>
								{/each}
							</div>
						{/if}
					</div>
					<div class="flex gap-2">
						<button
							class="hover:text-primary-dark text-primary"
							onclick={() => {
								editingDiscovery = { ...discovery };
								showAddModal = true;
							}}
						>
							Edit
						</button>
						<button
							class="text-red-600 hover:text-red-700"
							onclick={() => deleteDiscovery(discovery)}
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
				{editingDiscovery?.id ? 'Edit' : 'Add'} Discovery
			</h3>

			<div class="space-y-4">
				<div>
					<label for="discovery-name" class="mb-1 block text-sm font-medium">
						Discovery Name
					</label>
					<input
						id="discovery-name"
						type="text"
						class="w-full rounded border p-2"
						value={editingDiscovery?.discovery_name ?? ''}
						oninput={(e) => {
							if (editingDiscovery) {
								editingDiscovery.discovery_name = e.currentTarget.value;
							}
						}}
						placeholder="Enter discovery name"
					/>
				</div>

				<div>
					<label for="level-gained" class="mb-1 block text-sm font-medium"> Level Gained </label>
					<input
						id="level-gained"
						type="number"
						class="w-full rounded border p-2"
						value={editingDiscovery?.selected_level ?? character.level}
						oninput={(e) => {
							if (editingDiscovery) {
								editingDiscovery.selected_level = Number(e.currentTarget.value);
							}
						}}
						min="1"
						max={character.level}
					/>
				</div>

				<div>
					<label for="properties" class="mb-1 block text-sm font-medium"> Properties (JSON) </label>
					<textarea
						id="properties"
						class="w-full rounded border p-2"
						rows="4"
						value={editingDiscovery?.properties
							? JSON.stringify(editingDiscovery.properties, null, 2)
							: ''}
						oninput={(e) => {
							if (editingDiscovery) {
								try {
									editingDiscovery.properties = JSON.parse(e.currentTarget.value);
								} catch {
									// Invalid JSON - leave properties as is
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
							editingDiscovery = null;
							showAddModal = false;
						}}
					>
						Cancel
					</button>
					<button
						class="btn"
						onclick={saveCurrentDiscovery}
						disabled={updateState.status === 'syncing'}
					>
						{editingDiscovery?.id ? 'Save Changes' : 'Add Discovery'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
