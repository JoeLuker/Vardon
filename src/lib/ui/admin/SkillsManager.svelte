<!-- FILE: src/lib/ui/admin/SkillsManager.svelte -->
<script lang="ts">
	/**
	 * Instead of importing from '$lib/state/updates.svelte',
	 * we import `executeUpdate` from your main character store—just like EquipmentManager does.
	 */
	import { getCharacter, executeUpdate } from '$lib/state/characterStore';

	/**
	 * We still use the DB calls for skills (saveBaseSkill, removeBaseSkill),
	 * which presumably update the global 'base_skills' table.
	 */
	import { saveBaseSkill, removeBaseSkill, type BaseSkillSaveData } from '$lib/db/skills';

	let { characterId } = $props<{ characterId: number }>();

	// A simple local object to store any error state, if you want to display it
	let updateState = $state({
		error: null as Error | null
	});

	let showAddModal = $state(false);
	let editingSkill = $state<Partial<DatabaseBaseSkill> | null>(null);

	// Derive the character from your store
	let character = $derived(getCharacter(characterId));

	// We assume `character.base_skills` is already loaded with global base skills
	let baseSkills = $derived(character.base_skills ?? []);
	let classSkillRelations = $derived(character.class_skill_relations ?? []);

	/**
	 * We'll build a computed `skillsList` so we can mark
	 * which ones are class skills for this character.
	 */
	type DisplaySkill = DatabaseBaseSkill & {
		isClassSkill: boolean;
	};

	let skillsList = $derived<DisplaySkill[]>(
		baseSkills.map((baseSkill) => ({
			...baseSkill,
			isClassSkill: classSkillRelations.some((relation) => relation.skill_id === baseSkill.id)
		}))
	);

	/**
	 * The list of valid abilities, e.g. 'str','dex'...
	 * used for the <select> in the modal.
	 */
	const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

	/**
	 * Create or update a base skill (in the global sense),
	 * but also update the local `character.base_skills` array so our UI stays in sync.
	 */
	async function saveSkill() {
		const skill = editingSkill;
		if (!skill?.name || !skill?.ability) return;

		const isNew = !skill.id;
		const previousSkills = [...(character.base_skills ?? [])];

		await executeUpdate({
			key: `save-skill-${skill.id ?? 'new'}`,
			operation: async () => {
				// Build the data for DB with type assertions
				const saveData: BaseSkillSaveData = {
					name: skill.name as string,  // We can safely assert these as strings
					ability: skill.ability as string,  // because of the check above
					trained_only: skill.trained_only ?? false,
					armor_check_penalty: skill.armor_check_penalty ?? false
				};
				// If it has an ID, we do an update
				if (skill.id) {
					saveData.id = skill.id;
				}

				// Perform the DB call
				const savedSkill = await saveBaseSkill(saveData);

				// Update local store
				if (!character.base_skills) {
					character.base_skills = [];
				}
				if (isNew) {
					character.base_skills.push(savedSkill);
				} else {
					const idx = character.base_skills.findIndex((s) => s.id === savedSkill.id);
					if (idx >= 0) {
						character.base_skills[idx] = savedSkill;
					}
				}
			},
			optimisticUpdate: () => {
				// Optional: You could do quick local updates here
				// if you want immediate changes before the DB call finishes.
			},
			rollback: () => {
				// If something fails, revert
				character.base_skills = previousSkills;
			}
		}).catch((err) => {
			console.error('Failed to save skill:', err);
			updateState.error = new Error('Failed to save skill');
		});

		// Reset modal
		editingSkill = null;
		showAddModal = false;
	}

	/**
	 * Remove a base skill from the DB, and from local state.
	 */
	async function deleteSkill(skill: DatabaseBaseSkill) {
		if (!confirm(`Are you sure you want to delete ${skill.name}?`)) return;

		const previousSkills = [...(character.base_skills ?? [])];

		await executeUpdate({
			key: `delete-skill-${skill.id}`,
			operation: async () => {
				await removeBaseSkill(skill.id);
				if (character.base_skills) {
					character.base_skills = character.base_skills.filter((s) => s.id !== skill.id);
				}
			},
			optimisticUpdate: () => {
				// Optionally remove it locally right away
			},
			rollback: () => {
				character.base_skills = previousSkills;
			}
		}).catch((err) => {
			console.error('Failed to delete skill:', err);
			updateState.error = new Error('Failed to delete skill');
		});
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h2 class="text-xl font-bold">Skills</h2>
		<button
			class="btn"
			onclick={() => {
				editingSkill = { trained_only: false, armor_check_penalty: false };
				showAddModal = true;
			}}
		>
			Add Skill
		</button>
	</div>

	{#if updateState.error}
		<div class="rounded-lg bg-red-100 p-4 text-red-700">
			{updateState.error.message}
		</div>
	{/if}

	<!-- Display the aggregated skill list -->
	<div class="grid gap-4 md:grid-cols-2">
		{#each skillsList as skill (skill.id)}
			<div class="rounded-lg bg-gray-50 p-4">
				<div class="flex items-start justify-between">
					<div>
						<div class="text-lg font-medium">{skill.name}</div>
						<div class="text-sm text-gray-500">
							{skill.ability.toUpperCase()}
						</div>
						<div class="mt-2 space-x-2 text-sm">
							{#if skill.isClassSkill}
								<span class="text-primary">Class Skill</span>
							{/if}
							{#if skill.trained_only}
								<span class="text-warning">Trained Only</span>
							{/if}
							{#if skill.armor_check_penalty}
								<span class="text-error">Armor Check Penalty</span>
							{/if}
						</div>
					</div>
					<div class="flex gap-2">
						<button
							class="hover:text-primary-dark text-primary"
							onclick={() => {
								editingSkill = {
									...skill,
									trained_only: skill.trained_only,
									armor_check_penalty: skill.armor_check_penalty
								};
								showAddModal = true;
							}}
						>
							Edit
						</button>
						<button class="text-red-600 hover:text-red-700" onclick={() => deleteSkill(skill)}>
							Delete
						</button>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>

<!-- Modal for adding or editing a base skill -->
{#if showAddModal}
	<div class="fixed inset-0 flex items-center justify-center bg-black/50">
		<div class="w-full max-w-2xl rounded-lg bg-white p-6">
			<h3 class="mb-4 text-xl font-bold">
				{editingSkill?.id ? 'Edit' : 'Add'} Skill
			</h3>

			<div class="space-y-4">
				<div>
					<label for="skill-name" class="mb-1 block text-sm font-medium"> Skill Name </label>
					<input
						id="skill-name"
						type="text"
						class="w-full rounded border p-2"
						bind:value={editingSkill!.name}
						placeholder="Enter skill name"
					/>
				</div>

				<div>
					<label for="skill-ability" class="mb-1 block text-sm font-medium"> Ability </label>
					<select
						id="skill-ability"
						class="w-full rounded border p-2"
						bind:value={editingSkill!.ability}
					>
						<option value="">Select ability...</option>
						{#each abilities as ability}
							<option value={ability}>{ability.toUpperCase()}</option>
						{/each}
					</select>
				</div>

				<div class="flex gap-4">
					<label class="flex items-center gap-2">
						<input
							type="checkbox"
							bind:checked={editingSkill!.trained_only}
						/>
						<span class="text-sm">Trained Only</span>
					</label>

					<label class="flex items-center gap-2">
						<input
							type="checkbox"
							bind:checked={editingSkill!.armor_check_penalty}
						/>
						<span class="text-sm">Armor Check Penalty</span>
					</label>
				</div>

				<div class="flex justify-end gap-2">
					<button
						class="btn btn-secondary"
						onclick={() => {
							editingSkill = null;
							showAddModal = false;
						}}
					>
						Cancel
					</button>
					<button
						class="btn"
						onclick={saveSkill}
					>
						{editingSkill?.id ? 'Save Changes' : 'Add Skill'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
