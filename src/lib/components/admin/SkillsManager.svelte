<!-- src/lib/components/admin/SkillsManager.svelte -->
<script lang="ts">
    import { character } from '$lib/state/character.svelte';
    import { type UpdateState } from '$lib/utils/updates';
    import { supabase } from '$lib/supabaseClient';
    import type { DatabaseBaseSkill } from '$lib/types/character';

    let updateState = $state<UpdateState>({
        status: 'idle',
        error: null
    });

    let showAddModal = $state(false);
    let editingSkill = $state<Partial<DatabaseBaseSkill> | null>(null);

    // Local derivations
    let baseSkills = $derived(character.base_skills ?? []);
    let classSkillRelations = $derived(character.class_skill_relations ?? []);

    type DisplaySkill = DatabaseBaseSkill & {
        isClassSkill: boolean;
    };

    let skillsList = $derived<DisplaySkill[]>(
        baseSkills.map((baseSkill) => ({
            ...baseSkill,
            isClassSkill: classSkillRelations.some(
                relation => relation.skill_id === baseSkill.id
            )
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
            if (isNew) {
                // Create new base skill
                const { data: skillData, error: skillError } = await supabase
                    .from('base_skills')
                    .insert({
                        name: skill.name,
                        ability: skill.ability,
                        trained_only: skill.trained_only ?? false,
                        armor_check_penalty: skill.armor_check_penalty ?? false
                    })
                    .select()
                    .single();

                if (skillError) throw skillError;

                // Update local state
                if (character.base_skills) {
                    character.base_skills.push(skillData);
                }
            } else {
                // Update existing skill
                const { data: skillData, error: skillError } = await supabase
                    .from('base_skills')
                    .update({
                        name: skill.name,
                        ability: skill.ability,
                        trained_only: skill.trained_only ?? false,
                        armor_check_penalty: skill.armor_check_penalty ?? false
                    })
                    .eq('id', skill.id!)
                    .select()
                    .single();

                if (skillError) throw skillError;

                // Update local state
                if (character.base_skills) {
                    const index = character.base_skills.findIndex(s => s.id === skillData.id);
                    if (index >= 0) {
                        character.base_skills[index] = skillData;
                    }
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
            // First delete related character skill ranks
            const { error: ranksError } = await supabase
                .from('character_skill_ranks')
                .delete()
                .eq('skill_id', skill.id);

            if (ranksError) throw ranksError;

            // Then delete related class skill relations
            const { error: relationsError } = await supabase
                .from('class_skill_relations')
                .delete()
                .eq('skill_id', skill.id);

            if (relationsError) throw relationsError;

            // Finally delete the skill itself
            const { error } = await supabase
                .from('base_skills')
                .delete()
                .eq('id', skill.id);

            if (error) throw error;

            // Update local state
            if (character.base_skills) {
                character.base_skills = character.base_skills.filter(s => s.id !== skill.id);
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
    <div class="flex justify-between items-center">
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
        <div class="p-4 bg-red-100 text-red-700 rounded-lg">
            {updateState.error.message}
        </div>
    {/if}

    <div class="grid gap-4 md:grid-cols-2">
        {#each skillsList as skill (skill.id)}
            <div class="p-4 bg-gray-50 rounded-lg">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="font-medium text-lg">{skill.name}</div>
                        <div class="text-sm text-gray-500">
                            {skill.ability.toUpperCase()}
                        </div>
                        <div class="mt-2 text-sm space-x-2">
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
                            class="text-primary hover:text-primary-dark"
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
                        <button
                            class="text-red-600 hover:text-red-700"
                            onclick={() => deleteSkill(skill)}
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
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center">
        <div class="bg-white p-6 rounded-lg max-w-2xl w-full">
            <h3 class="text-xl font-bold mb-4">
                {editingSkill?.id ? 'Edit' : 'Add'} Skill
            </h3>
            
            <div class="space-y-4">
                <div>
                    <label for="skill-name" class="block text-sm font-medium mb-1">
                        Skill Name
                    </label>
                    <input
                        id="skill-name"
                        type="text"
                        class="w-full p-2 border rounded"
                        bind:value={editingSkill!.name}
                        placeholder="Enter skill name"
                    />
                </div>

                <div>
                    <label for="skill-ability" class="block text-sm font-medium mb-1">
                        Ability
                    </label>
                    <select
                        id="skill-ability"
                        class="w-full p-2 border rounded"
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
                        disabled={updateState.status === 'syncing'}
                    >
                        {editingSkill?.id ? 'Save Changes' : 'Add Skill'}
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}