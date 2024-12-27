<!-- src/lib/ui/admin/AttributesManager.svelte -->
<script lang="ts">
	import { getCharacter } from '$lib/state/character.svelte';
	import { executeUpdate, type UpdateState } from '$lib/utils/updates';
	import { updateCharacterAttributes } from '$lib/db/attributes';

	interface AttributeField {
		key: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
		label: string;
		description: string;
	}

	let { characterId } = $props<{
		characterId: number;
	}>();

	const attributeFields: AttributeField[] = [
		{ key: 'str', label: 'Strength', description: 'Physical power and carrying capacity' },
		{ key: 'dex', label: 'Dexterity', description: 'Agility, reflexes, and balance' },
		{ key: 'con', label: 'Constitution', description: 'Health, stamina, and vital force' },
		{ key: 'int', label: 'Intelligence', description: 'Mental acuity and knowledge' },
		{ key: 'wis', label: 'Wisdom', description: 'Awareness, intuition, and willpower' },
		{ key: 'cha', label: 'Charisma', description: 'Force of personality and leadership' }
	];

	let updateState = $state<UpdateState>({
		status: 'idle',
		error: null
	});

	let editMode = $state(false);
	let tempValues = $state<Record<string, number>>({});
	let character = $derived(getCharacter(characterId));

	function startEdit() {
		editMode = true;
		// Make a copy of current attribute values for editing
		tempValues = attributeFields.reduce(
			(acc, field) => {
				acc[field.key] = character.character_attributes?.[0]?.[field.key] ?? 10;
				return acc;
			},
			{} as Record<string, number>
		);
	}

	async function saveChanges() {
		if (!character.character_attributes?.[0]) return;

		const previousValues = { ...character.character_attributes[0] };

		await executeUpdate({
			key: `attributes-${character.id}`,
			status: updateState,
			operation: async () => {
				// Move supabase logic to our new DB function
				await updateCharacterAttributes(character.id, tempValues);
			},
			optimisticUpdate: () => {
				// Update the local state right away
				if (character.character_attributes?.[0]) {
					Object.assign(character.character_attributes[0], tempValues);
				}
			},
			rollback: () => {
				// If something fails, revert to previous
				if (character.character_attributes?.[0]) {
					Object.assign(character.character_attributes[0], previousValues);
				}
			}
		});

		editMode = false;
	}

	function getModifier(score: number): string {
		const mod = Math.floor((score - 10) / 2);
		return mod >= 0 ? `+${mod}` : `${mod}`;
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h2 class="text-xl font-bold">Attributes</h2>
		{#if editMode}
			<div class="flex gap-2">
				<button
					class="btn btn-secondary"
					onclick={() => (editMode = false)}
					disabled={updateState.status === 'syncing'}
				>
					Cancel
				</button>
				<button class="btn" onclick={saveChanges} disabled={updateState.status === 'syncing'}>
					Save Changes
				</button>
			</div>
		{:else}
			<button class="btn" onclick={startEdit}> Edit Attributes </button>
		{/if}
	</div>

	<div class="grid gap-4 md:grid-cols-2">
		{#each attributeFields as field}
			<div class="rounded-lg bg-gray-50 p-4">
				<div class="mb-2 flex items-start justify-between">
					<div>
						<label for={field.key} class="font-medium">{field.label}</label>
						<p class="text-sm text-gray-500">{field.description}</p>
					</div>
					{#if !editMode}
						<div class="text-lg font-bold">
							{character.character_attributes?.[0]?.[field.key] ?? 10}
							<span class="ml-1 text-sm text-gray-500">
								({getModifier(character.character_attributes?.[0]?.[field.key] ?? 10)})
							</span>
						</div>
					{/if}
				</div>

				{#if editMode}
					<input
						type="number"
						id={field.key}
						class="w-full rounded border p-2"
						min="1"
						max="30"
						bind:value={tempValues[field.key]}
					/>
				{/if}
			</div>
		{/each}
	</div>

	{#if updateState.error}
		<div class="rounded-lg bg-red-100 p-4 text-red-700">
			Failed to update attributes. Please try again.
		</div>
	{/if}
</div>
