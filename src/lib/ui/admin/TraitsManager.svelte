<!-- FILE: src/lib/ui/admin/TraitsManager.svelte -->

<script lang="ts">
	import { onMount } from 'svelte';

	/**
	 * If your real `executeUpdate` is declared in `$lib/state/characterStore.svelte`,
	 * import it from there (same as in EquipmentManager).
	 * That means `import { executeUpdate } from '$lib/state/characterStore.svelte';`
	 */
	import { executeUpdate } from '$lib/state/characterStore';

	/**
	 * Keep your DB calls from the same place as before:
	 */
	import {
		loadBaseTraits,
		insertBaseTrait,
		updateBaseTrait,
		removeBaseTrait
	} from '$lib/db/traits';

		/**
	 * We'll store a local array of all base traits from the DB,
	 * plus the user's new-trait state, update status, etc.
	 */
	let traits = $state<DatabaseBaseTrait[]>([]);
	let newTrait = $state<Omit<DatabaseBaseTrait, 'id' | 'created_at' | 'updated_at'>>({
		name: '',
		trait_type: '',
		description: '',
		benefits: null
	});

	/**
	 * We'll mimic the approach from EquipmentManager for an updateState:
	 */
	let updateState = $state({
		status: 'idle' as 'idle' | 'syncing',
		error: null as Error | null
	});

	let successMessage = $state<string | null>(null);

	onMount(async () => {
		await loadTraits();
	});

	async function loadTraits() {
		try {
			const data = await loadBaseTraits();
			traits = data;
			successMessage = null;
			updateState.error = null;
		} catch (err) {
			updateState.error = err instanceof Error ? err : new Error(String(err));
		}
	}

	/**
	 * Save or update a trait in the global base_traits table.
	 * If `trait` has no 'id' property => insert; otherwise => update.
	 */
	async function saveTrait(trait: Omit<DatabaseBaseTrait, 'id' | 'created_at' | 'updated_at'> | DatabaseBaseTrait) {
		const isNew = !('id' in trait); // means no ID => insert
		const previousTraits = [...traits]; // for rollback if needed

		await executeUpdate({
			key: `save-trait-${isNew ? 'new' : (trait as DatabaseBaseTrait).id}`,
			operation: async () => {
				// If new => insert; else => update
				if (isNew) {
					await insertBaseTrait(
						trait as Omit<DatabaseBaseTrait, 'id' | 'created_at' | 'updated_at'>
					);
					successMessage = 'Trait created successfully';
				} else {
					await updateBaseTrait(trait as DatabaseBaseTrait);
					successMessage = 'Trait updated successfully';
				}
			},
			optimisticUpdate: () => {
				// If updating an existing trait, we can do a quick local update:
				if (!isNew) {
					const typedTrait = trait as DatabaseBaseTrait;
					const index = traits.findIndex((t) => t.id === typedTrait.id);
					if (index >= 0) {
						traits[index] = {
							...traits[index],
							name: typedTrait.name,
							trait_type: typedTrait.trait_type,
							description: typedTrait.description,
							benefits: typedTrait.benefits
						};
					}
				}
			},
			rollback: () => {
				traits = previousTraits;
				successMessage = null;
			}
		});

		// Reload from DB to ensure we have fresh data (IDs, etc.)
		await loadTraits();

		// If we just inserted a brand-new trait, clear the newTrait inputs
		if (isNew) {
			newTrait = {
				name: '',
				trait_type: '',
				description: '',
				benefits: null
			};
		}
	}

	async function deleteTrait(id: number) {
		if (!confirm('Are you sure you want to delete this trait?')) return;

		const previousTraits = [...traits];

		await executeUpdate({
			key: `delete-trait-${id}`,
			operation: async () => {
				await removeBaseTrait(id);
				successMessage = 'Trait deleted successfully';
			},
			optimisticUpdate: () => {
				traits = traits.filter((t) => t.id !== id);
			},
			rollback: () => {
				traits = previousTraits;
				successMessage = null;
			}
		});

		// Optionally reload from DB
		await loadTraits();
	}
</script>

<div class="traits-manager">
	<h3>Trait Manager</h3>

	{#if updateState.error}
		<div class="error">{updateState.error.message}</div>
	{/if}
	{#if successMessage}
		<div class="success">{successMessage}</div>
	{/if}

	<div class="new-trait-form">
		<h4>Add New Trait</h4>
		<input
			type="text"
			bind:value={newTrait.name}
			placeholder="Trait Name"
		/>
		<input
			type="text"
			bind:value={newTrait.trait_type}
			placeholder="Trait Type"
		/>
		<textarea
			bind:value={newTrait.description}
			placeholder="Description"
		></textarea>
		<textarea
			bind:value={newTrait.benefits}
			placeholder="Benefits (JSON)"
		></textarea>
		<button onclick={() => saveTrait(newTrait)}>Add Trait</button>
	</div>

	<div class="traits-list">
		<h3>Existing Traits</h3>
		{#each traits as trait}
			<div class="trait-item">
				<!-- You can allow direct inline editing of each trait object:
				     Or consider a dedicated “Edit” button & a modal, like your Add Equipment approach. -->
				<input type="text" bind:value={trait.name} />
				<input type="text" bind:value={trait.trait_type} />
				<textarea bind:value={trait.description}></textarea>
				<textarea bind:value={trait.benefits}></textarea>
				<div class="actions">
					<button onclick={() => saveTrait(trait)}>Save</button>
					<button onclick={() => deleteTrait(trait.id)}>Delete</button>
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.traits-manager {
		padding: 1rem;
	}

	.error {
		color: red;
		margin: 1rem 0;
	}

	.success {
		color: green;
		margin: 1rem 0;
	}

	.new-trait-form,
	.trait-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin: 1rem 0;
		padding: 1rem;
		border: 1px solid #ccc;
		border-radius: 4px;
	}

	input,
	textarea {
		padding: 0.5rem;
	}

	textarea {
		min-height: 100px;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
	}

	button {
		padding: 0.5rem 1rem;
		cursor: pointer;
	}
</style>
