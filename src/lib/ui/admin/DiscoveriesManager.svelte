<!-- FILE: src/lib/ui/admin/DiscoveriesManager.svelte -->
<script lang="ts">
	import { getCharacter, executeUpdate } from '$lib/state/characterStore.svelte';
	import { saveDiscovery, removeDiscovery } from '$lib/db/discoveries';
	import type { DiscoverySaveData } from '$lib/db/discoveries';

	let { characterId } = $props<{ characterId: number }>();

	let character = $derived(getCharacter(characterId));
	
	let discoveryList = $derived([...(character.character_discoveries ?? [])].sort(
		(a, b) => a.selected_level - b.selected_level
	));

	let updateState = $state({
		status: 'idle' as 'idle' | 'syncing',
		error: null as Error | null
	});

	let showAddModal = $state(false);
	let editingDiscovery = $state<Partial<DatabaseCharacterDiscovery> | null>(null);

	function isValidDiscovery(discovery: Partial<DatabaseCharacterDiscovery>): discovery is Required<Pick<DatabaseCharacterDiscovery, 'discovery_name' | 'selected_level'>> & Partial<DatabaseCharacterDiscovery> {
		return typeof discovery.discovery_name === 'string' && typeof discovery.selected_level === 'number';
	}

	async function saveCurrentDiscovery() {
		const discovery = editingDiscovery;
		if (!discovery || !isValidDiscovery(discovery)) {
			return;
		}

		const previousDiscoveries = [...(character.character_discoveries ?? [])];

		await executeUpdate({
			key: `discovery-${character.id}-${discovery.id || 'new'}`,
			operation: async () => {
				const saveData: DiscoverySaveData = {
					discovery_name: discovery.discovery_name,
					selected_level: discovery.selected_level,
					character_id: character.id,
					properties: discovery.properties ?? null,
					...(discovery.id ? { id: discovery.id } : {})
				};

				const savedDiscovery = await saveDiscovery(saveData);
				
				if (!character.character_discoveries) {
					character.character_discoveries = [];
				}
				
				const isNew = !discovery.id;
				if (isNew) {
					character.character_discoveries.push(savedDiscovery);
				} else {
					const idx = character.character_discoveries.findIndex(
						(d) => d.id === savedDiscovery.id
					);
					if (idx >= 0) character.character_discoveries[idx] = savedDiscovery;
				}
			},
			optimisticUpdate: () => {},
			rollback: () => {
				character.character_discoveries = previousDiscoveries;
			}
		});

		editingDiscovery = null;
		showAddModal = false;
	}

	async function deleteDiscovery(discovery: DatabaseCharacterDiscovery) {
		if (!confirm(`Are you sure you want to delete ${discovery.discovery_name}?`)) return;

		const previousDiscoveries = [...(character.character_discoveries ?? [])];

		await executeUpdate({
			key: `delete-discovery-${discovery.id}`,
			operation: async () => {
				await removeDiscovery(discovery.id);
				character.character_discoveries = character.character_discoveries?.filter(
					(d) => d.id !== discovery.id
				) ?? [];
			}, 
			optimisticUpdate: () => {},
			rollback: () => {
				character.character_discoveries = previousDiscoveries;
			}
		});
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
