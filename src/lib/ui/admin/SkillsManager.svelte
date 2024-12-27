<!-- FILE: src/lib/ui/admin/SkillsManager.svelte -->
<script lang="ts">
	import { getCharacter } from '$lib/state/character.svelte';
	import { type UpdateState } from '$lib/state/updates.svelte';
	import { saveBaseSkill, removeBaseSkill, type BaseSkillSaveData } from '$lib/db/skills';

	import type { DatabaseBaseSkill } from '$lib/domain/types/character';

	let { characterId } = $props<{ characterId: number }>();

	let updateState = $state<UpdateState>({
		status: 'idle',
		error: null
	});

	let showAddModal = $state(false);
	let editingSkill = $state<Partial<DatabaseBaseSkill> | null>(null);

	let character = $derived(getCharacter(characterId));

	let baseSkills = $derived(character.base_skills ?? []);
	let classSkillRelations = $derived(character.class_skill_relations ?? []);

	type DisplaySkill = DatabaseBaseSkill & {
		isClassSkill: boolean;
	};

	let skillsList = $derived<DisplaySkill[]>(
		baseSkills.map((baseSkill) => ({
			...baseSkill,
			isClassSkill: classSkillRelations.some((relation) => relation.skill_id === baseSkill.id)
		}))
	);

	async function saveSkill() {
		const skill = editingSkill;
		if (!skill?.name || !skill?.ability) return;

		const isNew = !skill.id;
		const previousSkills = {
			base: [...(character.base_skills ?? [])]
		};

		try {
			// Build the data we need for the DB function
			const saveData: BaseSkillSaveData = {
				name: skill.name,
				ability: skill.ability,
				trained_only: skill.trained_only ?? false,
				armor_check_penalty: skill.armor_check_penalty ?? false
			};
			// If there's an id, we do an update
			if (skill.id) {
				saveData.id = skill.id;
			}

			// Call new helper
			const skillData = await saveBaseSkill(saveData);

			// Update local state
			if (!character.base_skills) {
				character.base_skills = [];
			}
			if (isNew) {
				character.base_skills.push(skillData);
			} else {
				const index = character.base_skills.findIndex((s) => s.id === skillData.id);
				if (index >= 0) {
					character.base_skills[index] = skillData;
				}
			}

			editingSkill = null;
			showAddModal = false;
		} catch (err) {
			console.error('Failed to save skill:', err);
			character.base_skills = previousSkills.base;
			updateState.error = new Error('Failed to save skill');
		}
	}

	async function deleteSkill(skill: DatabaseBaseSkill) {
		if (!confirm(`Are you sure you want to delete ${skill.name}?`)) return;

		const previousSkills = {
			base: [...(character.base_skills ?? [])]
		};

		try {
			// Use our new removeBaseSkill helper
			await removeBaseSkill(skill.id);

			// Update local state
			if (character.base_skills) {
				character.base_skills = character.base_skills.filter((s) => s.id !== skill.id);
			}
		} catch (err) {
			console.error('Failed to delete skill:', err);
			character.base_skills = previousSkills.base;
			updateState.error = new Error('Failed to delete skill');
		}
	}

	const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
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
						<input type="checkbox" bind:checked={editingSkill!.trained_only} />
						<span class="text-sm">Trained Only</span>
					</label>

					<label class="flex items-center gap-2">
						<input type="checkbox" bind:checked={editingSkill!.armor_check_penalty} />
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
					<button class="btn" onclick={saveSkill} disabled={updateState.status === 'syncing'}>
						{editingSkill?.id ? 'Save Changes' : 'Add Skill'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
