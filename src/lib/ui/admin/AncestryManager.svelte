<script lang="ts">
	import { type UpdateState } from '$lib/utils/updates';
	import type { DBAncestry, DBAncestralTrait, SaveAncestryDTO } from '$lib/db/ancestries';
	import {
		loadAncestries,
		loadAncestralTraits,
		saveAncestry,
		deleteAncestry as deleteAncestryDB
	} from '$lib/db/ancestries';
	import { onMount } from 'svelte';

	let updateState = $state<UpdateState>({
		status: 'idle',
		error: null
	});

	let showAddModal = $state(false);
	let editingAncestry = $state<Partial<DBAncestry> | null>(null);
	let ancestries = $state<DBAncestry[]>([]);
	let ancestralTraits = $state<DBAncestralTrait[]>([]);

	onMount(async () => {
		await loadAllData();
	});

	async function loadAllData() {
		try {
			ancestries = await loadAncestries();
			ancestralTraits = await loadAncestralTraits();
		} catch (err) {
			updateState.error = err instanceof Error ? err : new Error(String(err));
		}
	}

	async function handleSaveAncestry() {
		if (!editingAncestry?.name || !editingAncestry.size || !editingAncestry.base_speed) {
			return;
		}

		// const isNew = !editingAncestry.id;
		const previousAncestries = [...ancestries];

		try {
			updateState.status = 'syncing';

			// Build the payload
			const saveData: SaveAncestryDTO = {
				name: editingAncestry.name,
				size: editingAncestry.size,
				base_speed: editingAncestry.base_speed,
				ability_modifiers: editingAncestry.ability_modifiers || {},
				description: editingAncestry.description || ''
			};

			// Save via DB function
			await saveAncestry(saveData, editingAncestry.id);

			// Reload list
			ancestries = await loadAncestries();

			// Clear modal
			editingAncestry = null;
			showAddModal = false;

			updateState.status = 'idle';
		} catch (err) {
			console.error('Failed to save ancestry:', err);
			ancestries = previousAncestries;
			updateState.error = err instanceof Error ? err : new Error('Failed to save ancestry');
			updateState.status = 'error';
		}
	}

	async function handleDeleteAncestry(ancestry: DBAncestry) {
		if (!confirm(`Are you sure you want to delete ${ancestry.name}?`)) return;

		const previousAncestries = [...ancestries];

		try {
			updateState.status = 'syncing';

			await deleteAncestryDB(ancestry.id);
			ancestries = await loadAncestries();

			updateState.status = 'idle';
		} catch (err) {
			console.error('Failed to delete ancestry:', err);
			ancestries = previousAncestries;
			updateState.error = err instanceof Error ? err : new Error('Failed to delete ancestry');
			updateState.status = 'error';
		}
	}

	function handleAbilityModifierChange(ability: string, value: number) {
		if (!editingAncestry) return;
		editingAncestry.ability_modifiers = {
			...editingAncestry.ability_modifiers,
			[ability]: value
		};
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h2 class="text-xl font-bold">Ancestries</h2>
		<button
			class="btn"
			onclick={() => {
				editingAncestry = {}; // Start fresh
				showAddModal = true;
			}}
		>
			Add Ancestry
		</button>
	</div>

	{#if updateState.error}
		<div class="rounded-lg bg-red-100 p-4 text-red-700">
			{updateState.error.message}
		</div>
	{/if}

	<div class="grid gap-4 md:grid-cols-2">
		{#each ancestries as ancestry (ancestry.id)}
			<div class="rounded-lg bg-gray-50 p-4">
				<div class="flex items-start justify-between">
					<div>
						<div class="text-lg font-medium">{ancestry.name}</div>
						<div class="text-sm text-gray-500">
							{ancestry.size} • Speed: {ancestry.base_speed}ft
						</div>
						<div class="mt-2 text-sm">
							{ancestry.description}
						</div>
						{#if ancestry.ability_modifiers}
							<div class="mt-2 text-sm">
								<div class="font-medium">Ability Modifiers:</div>
								{#each Object.entries(ancestry.ability_modifiers) as [ability, modifier]}
									<div>{ability.toUpperCase()}: {modifier}</div>
								{/each}
							</div>
						{/if}
						<div class="mt-2">
							<div class="font-medium">Racial Traits:</div>
							<ul class="list-inside list-disc">
								{#each ancestralTraits.filter((trait) => trait.ancestry_id === ancestry.id) as trait}
									<li class="text-sm">
										{trait.name}
										{#if trait.is_optional}
											<span class="text-gray-500">(Optional)</span>
										{/if}
									</li>
								{/each}
							</ul>
						</div>
					</div>
					<div class="flex gap-2">
						<button
							class="hover:text-primary-dark text-primary"
							onclick={() => {
								editingAncestry = { ...ancestry };
								showAddModal = true;
							}}
						>
							Edit
						</button>
						<button
							class="text-red-600 hover:text-red-700"
							onclick={() => handleDeleteAncestry(ancestry)}
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
				{editingAncestry?.id ? 'Edit' : 'Add'} Ancestry
			</h3>

			<div class="space-y-4">
				<div>
					<label for="ancestry-name" class="mb-1 block text-sm font-medium"> Name </label>
					<input
						id="ancestry-name"
						type="text"
						class="w-full rounded border p-2"
						bind:value={editingAncestry!.name}
						placeholder="Enter ancestry name"
					/>
				</div>

				<div>
					<label for="ancestry-size" class="mb-1 block text-sm font-medium"> Size </label>
					<select
						id="ancestry-size"
						class="w-full rounded border p-2"
						bind:value={editingAncestry!.size}
					>
						<option value="">Select size...</option>
						<option value="Small">Small</option>
						<option value="Medium">Medium</option>
						<option value="Large">Large</option>
					</select>
				</div>

				<div>
					<label for="ancestry-speed" class="mb-1 block text-sm font-medium">
						Base Speed (ft)
					</label>
					<input
						id="ancestry-speed"
						type="number"
						class="w-full rounded border p-2"
						bind:value={editingAncestry!.base_speed}
						min="0"
						step="5"
					/>
				</div>

				<div>
					<label for="ancestry-description" class="mb-1 block text-sm font-medium">
						Description
					</label>
					<textarea
						id="ancestry-description"
						class="w-full rounded border p-2"
						bind:value={editingAncestry!.description}
						rows="3"
						placeholder="Enter ancestry description"
					></textarea>
				</div>

				<div>
					<span class="mb-1 block text-sm font-medium"> Ability Modifiers </span>
					<div class="grid grid-cols-2 gap-2">
						{#each ['str', 'dex', 'con', 'int', 'wis', 'cha'] as ability}
							<div>
								<label for={`ability-${ability}`} class="block text-sm">
									{ability.toUpperCase()}
								</label>
								<input
									id={`ability-${ability}`}
									type="number"
									class="w-full rounded border p-2"
									value={editingAncestry?.ability_modifiers?.[ability] ?? ''}
									oninput={(e) =>
										handleAbilityModifierChange(ability, Number(e.currentTarget.value))}
									placeholder="0"
								/>
							</div>
						{/each}
					</div>
				</div>

				<div class="flex justify-end gap-2">
					<button
						class="btn btn-secondary"
						onclick={() => {
							editingAncestry = null;
							showAddModal = false;
						}}
					>
						Cancel
					</button>
					<button
						class="btn"
						onclick={handleSaveAncestry}
						disabled={updateState.status === 'syncing'}
					>
						{editingAncestry?.id ? 'Save Changes' : 'Add Ancestry'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
