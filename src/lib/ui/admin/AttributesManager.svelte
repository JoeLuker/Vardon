<!-- FILE: src/lib/ui/admin/AttributesManager.svelte -->
<script lang="ts">
	/**
	 * We import everything from `characterStore.svelte.ts`,
	 * because that file actually exports `executeUpdate` and `UpdateState`.
	 */
	import {
		getCharacter,
		type UpdateState,
		executeUpdate
	} from '$lib/state/characterStore';

	import { updateCharacterAttributes } from '$lib/db/attributes';

	/**
	 * Define a small interface for our attribute fields.
	 */
	interface AttributeField {
		key: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
		label: string;
		description: string;
	}

	let { characterId } = $props<{ characterId: number }>();

	/**
	 * The six standard attributes, each with a short description.
	 */
	const attributeFields: AttributeField[] = [
		{ key: 'str', label: 'Strength', description: 'Physical power and carrying capacity' },
		{ key: 'dex', label: 'Dexterity', description: 'Agility, reflexes, and balance' },
		{ key: 'con', label: 'Constitution', description: 'Health, stamina, and vital force' },
		{ key: 'int', label: 'Intelligence', description: 'Mental acuity and knowledge' },
		{ key: 'wis', label: 'Wisdom', description: 'Awareness, intuition, and willpower' },
		{ key: 'cha', label: 'Charisma', description: 'Force of personality and leadership' }
	];

	/**
	 * Local reactive object for tracking the status of our updates (saving, error, etc.).
	 */
	let updateState = $state<UpdateState>({
		status: 'idle',
		error: null
	});

	/**
	 * `editMode` indicates whether we're in editing state (showing inputs) or display-only.
	 */
	let editMode = $state(false);

	/**
	 * We store the temporary user-edited values in `tempValues`.
	 * It's keyed by the attribute name, e.g. { str: 12, dex: 14, ... }.
	 */
	let tempValues = $state<Record<string, number>>({});

	/**
	 * We derive the current character from your store, so changes are reactive.
	 */
	let character = $derived(getCharacter(characterId));

	function startEdit() {
		editMode = true;

		// Make a copy of current attribute values into `tempValues`.
		tempValues = attributeFields.reduce(
			(acc, field) => {
				acc[field.key] = character.character_attributes?.[0]?.[field.key] ?? 10;
				return acc;
			},
			{} as Record<string, number>
		);
	}

	async function saveChanges() {
		// If this character has no row in `character_attributes`, skip.
		if (!character.character_attributes?.[0]) return;

		// Keep the old values in case of rollback
		const previousValues = { ...character.character_attributes[0] };

		await executeUpdate({
			key: `attributes-${character.id}`,
			operation: async () => {
				// Use the DB function in `attributes.ts`
				await updateCharacterAttributes(character.id, tempValues);
			},
			optimisticUpdate: () => {
				// Immediately reflect the changes locally
				if (character.character_attributes?.[0]) {
					Object.assign(character.character_attributes[0], tempValues);
				}
			},
			rollback: () => {
				// Revert if something goes wrong
				if (character.character_attributes?.[0]) {
					Object.assign(character.character_attributes[0], previousValues);
				}
			}
		});

		editMode = false;
	}

	/**
	 * Helper to format the ability modifier (e.g. +1, -2, etc.).
	 */
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
				<button
					class="btn"
					onclick={saveChanges}
					disabled={updateState.status === 'syncing'}
				>
					Save Changes
				</button>
			</div>
		{:else}
			<button class="btn" onclick={startEdit}>Edit Attributes</button>
		{/if}
	</div>

	<!-- Display each attribute -->
	<div class="grid gap-4 md:grid-cols-2">
		{#each attributeFields as field}
			<div class="rounded-lg bg-gray-50 p-4">
				<div class="mb-2 flex items-start justify-between">
					<div>
						<label for={field.key} class="font-medium">{field.label}</label>
						<p class="text-sm text-gray-500">{field.description}</p>
					</div>
					{#if !editMode}
						<!-- If not editing, show the value with its modifier -->
						<div class="text-lg font-bold">
							{character.character_attributes?.[0]?.[field.key] ?? 10}
							<span class="ml-1 text-sm text-gray-500">
								({getModifier(character.character_attributes?.[0]?.[field.key] ?? 10)})
							</span>
						</div>
					{/if}
				</div>

				{#if editMode}
					<!-- If editing, show an <input type="number"> -->
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

	<!-- Show an error if something went wrong -->
	{#if updateState.error}
		<div class="rounded-lg bg-red-100 p-4 text-red-700">
			Failed to update attributes. Please try again.
		</div>
	{/if}
</div>
