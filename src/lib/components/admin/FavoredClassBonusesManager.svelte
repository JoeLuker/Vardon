<script lang="ts">
    import { getCharacter } from '$lib/state/character.svelte';
    import type { UpdateState } from '$lib/utils/updates';
    import { supabase } from '$lib/supabaseClient';
    import type { DatabaseCharacterFavoredClassBonus } from '$lib/types/character';

    let { characterId } = $props<{
        characterId: number;
    }>();

    type FCBLevelItem = {
        level: number;
        bonus: DatabaseCharacterFavoredClassBonus | null;
    };

    let updateState = $state<UpdateState>({
        status: 'idle',
        error: null
    });

    let showAddModal = $state(false);
    let editingFCB = $state<Partial<DatabaseCharacterFavoredClassBonus> | null>(null);

    let character = $derived(getCharacter(characterId));

    // Define the computation functions separately
    function computeFCBList(): DatabaseCharacterFavoredClassBonus[] {
        return [...(character.character_favored_class_bonuses ?? [])].sort(
            (a: DatabaseCharacterFavoredClassBonus, b: DatabaseCharacterFavoredClassBonus) => a.level - b.level
        );
    }

    function computeFCBByLevel(fcbs: DatabaseCharacterFavoredClassBonus[]): FCBLevelItem[] {
        const levels = Array.from({ length: character.level }, (_, i): FCBLevelItem => {
            const currentLevel = i + 1;
            const bonus = fcbs.find(b => b.level === currentLevel) ?? null;
            return {
                level: currentLevel,
                bonus
            };
        });
        return levels;
    }

    // Use the computation functions in derived values
    let fcbList = $derived(computeFCBList());
    let fcbByLevel = $derived(computeFCBByLevel(fcbList));

    async function saveFCB() {
        if (!editingFCB?.level || !editingFCB.choice) return;

        const previousFCBs = [...(character.character_favored_class_bonuses ?? [])];

        try {
            const existingFCB = fcbList.find(
                (fcb: DatabaseCharacterFavoredClassBonus) => fcb.level === editingFCB!.level
            );

            if (existingFCB) {
                const { data, error } = await supabase
                    .from('character_favored_class_bonuses')
                    .update({
                        choice: editingFCB.choice
                    })
                    .eq('id', existingFCB.id)
                    .select()
                    .single();

                if (error) throw error;

                const typedData = data as DatabaseCharacterFavoredClassBonus;
                const index = fcbList.findIndex(
                    (fcb: DatabaseCharacterFavoredClassBonus) => fcb.id === typedData.id
                );
                
                if (index >= 0) {
                    character.character_favored_class_bonuses = [
                        ...fcbList.slice(0, index),
                        typedData,
                        ...fcbList.slice(index + 1)
                    ];
                }
            } else {
                const { data, error } = await supabase
                    .from('character_favored_class_bonuses')
                    .insert({
                        character_id: character.id,
                        level: editingFCB.level,
                        choice: editingFCB.choice as 'hp' | 'skill' | 'other'
                    })
                    .select()
                    .single();

                if (error) throw error;

                const typedData = data as DatabaseCharacterFavoredClassBonus;
                character.character_favored_class_bonuses = [...fcbList, typedData];
            }

            editingFCB = null;
            showAddModal = false;
        } catch (err) {
            character.character_favored_class_bonuses = previousFCBs;
            updateState.error = new Error('Failed to save favored class bonus');
        }
    }

    async function deleteFCB(fcbId: number) {
        if (!confirm('Are you sure you want to delete this favored class bonus?')) return;

        const previousFCBs = [...(character.character_favored_class_bonuses ?? [])];

        try {
            const { error } = await supabase
                .from('character_favored_class_bonuses')
                .delete()
                .eq('id', fcbId);

            if (error) throw error;

            // Update local state
            if (character.character_favored_class_bonuses) {
                character.character_favored_class_bonuses = character.character_favored_class_bonuses.filter(
                    fcb => fcb.id !== fcbId
                );
            }
        } catch (err) {
            character.character_favored_class_bonuses = previousFCBs;
            updateState.error = new Error('Failed to delete favored class bonus');
        }
    }

    const fcbChoices = [
        { value: 'hp' as const, label: 'Hit Point' },
        { value: 'skill' as const, label: 'Skill Rank' },
        { value: 'other' as const, label: 'Other Bonus' }
    ];
</script>

<div class="space-y-4">
    <div class="flex justify-between items-center">
        <h2 class="text-xl font-bold">Favored Class Bonuses</h2>
        <button 
            onclick={() => {
                editingFCB = { level: character.level };
                showAddModal = true;
            }}
            class="btn"
        >
            Add FCB
        </button>
    </div>

    {#if updateState.error}
        <div class="p-4 bg-red-100 text-red-700 rounded-lg">
            {updateState.error.message}
        </div>
    {/if}

    <div class="grid gap-4 md:grid-cols-2">
        {#each fcbByLevel as { level, bonus }}
            <div class="p-4 bg-gray-50 rounded-lg">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="font-medium">Level {level}</div>
                        {#if bonus}
                            <div class="text-sm text-gray-600">
                                Choice: {fcbChoices.find(c => c.value === bonus.choice)?.label}
                            </div>
                        {:else}
                            <div class="text-sm text-gray-400">No bonus selected</div>
                        {/if}
                    </div>
                    <div class="flex gap-2">
                        <button
                            class="text-primary hover:text-primary-dark"
                            onclick={() => {
                                editingFCB = bonus ? { ...bonus } : { level };
                                showAddModal = true;
                            }}
                        >
                            {bonus ? 'Edit' : 'Add'}
                        </button>
                        {#if bonus}
                            <button
                                class="text-red-600 hover:text-red-700"
                                onclick={() => deleteFCB(bonus.id)}
                            >
                                Delete
                            </button>
                        {/if}
                    </div>
                </div>
            </div>
        {/each}
    </div>
</div>

{#if showAddModal}
    <div class="modal">
        <div class="modal-content">
            <h3 class="text-lg font-bold mb-4">
                {editingFCB?.id ? 'Edit' : 'Add'} Favored Class Bonus
            </h3>

            <div class="space-y-4">
                <div>
                    <label for="fcb-level" class="block text-sm font-medium mb-1">
                        Level
                    </label>
                    <input
                        id="fcb-level"
                        type="number"
                        class="w-full p-2 border rounded"
                        bind:value={editingFCB!.level}
                        min="1"
                        max={character.level}
                    />
                </div>

                <div>
                    <label for="fcb-choice" class="block text-sm font-medium mb-1">
                        Choice
                    </label>
                    <select
                        id="fcb-choice"
                        class="w-full p-2 border rounded"
                        bind:value={editingFCB!.choice}
                    >
                        <option value="">Select choice...</option>
                        {#each fcbChoices as choice}
                            <option value={choice.value}>{choice.label}</option>
                        {/each}
                    </select>
                </div>
            </div>

            <div class="flex justify-end gap-2 mt-4">
                <button 
                    class="btn btn-secondary"
                    onclick={() => {
                        editingFCB = null;
                        showAddModal = false;
                    }}
                >
                    Cancel
                </button>
                <button 
                    class="btn btn-primary"
                    disabled={!editingFCB?.level || !editingFCB.choice}
                    onclick={saveFCB}
                >
                    Save
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .modal-content {
        background: white;
        padding: 2rem;
        border-radius: 0.5rem;
        width: 100%;
        max-width: 32rem;
        margin: 1rem;
    }
</style>
