<!-- FILE: src/lib/ui/admin/EquipmentManager.svelte -->
<script lang="ts">
	import { character, loadCharacter, saveEquipment, removeEquipment, updateState } from '$lib/state/characterStore';
	import type { CharacterEquipmentRow } from '$lib/db';
	import { onMount } from 'svelte';

	let { characterId } = $props<{ characterId: number }>();

	onMount(() => {
		loadCharacter(characterId);
	});

	let equipmentList = $derived([...($character?.character_equipment ?? [])].sort(
		(a, b) => (a.type as string).localeCompare(b.type) || a.name.localeCompare(b.name)
	));

	let showAddModal = $state(false);
	let editingEquipment = $state<Partial<CharacterEquipmentRow> | null>(null);

	const equipmentTypes = ['weapon', 'armor', 'shield', 'ring', 'wondrous', 
		'potion', 'scroll', 'wand', 'gear'] as const;

	function isValidEquipment(equipment: Partial<CharacterEquipmentRow>): 
		equipment is Required<Pick<CharacterEquipmentRow, 'name' | 'type'>> & Partial<CharacterEquipmentRow> {
		return typeof equipment.name === 'string' && typeof equipment.type === 'string';
	}

	async function handleSaveEquipment() {
		const equipment = editingEquipment;
		if (!equipment || !isValidEquipment(equipment)) return;

		await saveEquipment({
			...equipment,
			character_id: characterId,
			equipped: equipment.equipped ?? false,
			properties: equipment.properties ?? null
		});

		editingEquipment = null;
		showAddModal = false;
	}

	async function handleDeleteEquipment(equipment: CharacterEquipmentRow) {
		if (!confirm(`Are you sure you want to delete ${equipment.name}?`)) return;
		await removeEquipment(equipment.id);
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h2 class="text-xl font-bold">Equipment</h2>
		<button
			class="btn"
			onclick={() => {
				editingEquipment = { equipped: false };
				showAddModal = true;
			}}
		>
			Add Equipment
		</button>
	</div>

	{#if updateState.error}
		<div class="rounded-lg bg-red-100 p-4 text-red-700">
			{updateState.error.message}
		</div>
	{/if}

	<div class="grid gap-4 md:grid-cols-2">
		{#each equipmentList as equipment (equipment.id)}
			<div class="rounded-lg bg-gray-50 p-4">
				<div class="flex items-start justify-between">
					<div>
						<div class="font-medium">{equipment.name}</div>
						<div class="text-sm capitalize text-gray-500">{equipment.type}</div>
						{#if equipment.properties}
							<div class="mt-2 text-sm">
								{#each Object.entries(equipment.properties) as [key, value]}
									<div>{key}: {value}</div>
								{/each}
							</div>
						{/if}
					</div>
					<div class="flex gap-2">
						<button
							class="text-sm {equipment.equipped ? 'text-primary' : 'text-gray-500'}"
							onclick={() => toggleEquipped(equipment)}
						>
							{equipment.equipped ? 'Equipped' : 'Unequipped'}
						</button>
						<button
							class="hover:text-primary-dark text-primary"
							onclick={() => {
								editingEquipment = { ...equipment };
								showAddModal = true;
							}}
						>
							Edit
						</button>
						<button
							class="text-red-600 hover:text-red-700"
							onclick={() => handleDeleteEquipment(equipment)}
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
				{editingEquipment?.id ? 'Edit' : 'Add'} Equipment
			</h3>

			<div class="space-y-4">
				<div>
					<label for="equipment-name" class="mb-1 block text-sm font-medium"> Name </label>
					<input
						id="equipment-name"
						type="text"
						class="w-full rounded border p-2"
						bind:value={editingEquipment!.name}
						placeholder="Enter equipment name"
					/>
				</div>

				<div>
					<label for="equipment-type" class="mb-1 block text-sm font-medium"> Type </label>
					<select
						id="equipment-type"
						class="w-full rounded border p-2"
						bind:value={editingEquipment!.type}
					>
						<option value="">Select type...</option>
						{#each equipmentTypes as type}
							<option value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
						{/each}
					</select>
				</div>

				<div class="flex items-center gap-2">
					<input
						id="equipment-equipped"
						type="checkbox"
						class="rounded"
						bind:checked={editingEquipment!.equipped}
					/>
					<label for="equipment-equipped" class="text-sm font-medium"> Equipped </label>
				</div>

				<div>
					<label for="equipment-properties" class="mb-1 block text-sm font-medium">
						Properties (JSON)
					</label>
					<textarea
						id="equipment-properties"
						class="w-full rounded border p-2"
						rows="4"
						value={editingEquipment?.properties
							? JSON.stringify(editingEquipment.properties, null, 2)
							: ''}
						oninput={(e) => {
							if (editingEquipment) {
								try {
									editingEquipment.properties = JSON.parse(e.currentTarget.value);
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
							editingEquipment = null;
							showAddModal = false;
						}}
					>
						Cancel
					</button>
					<button class="btn" onclick={handleSaveEquipment} disabled={updateState.status === 'syncing'}>
						{editingEquipment?.id ? 'Save Changes' : 'Add Equipment'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
