<!-- src/lib/components/admin/AttributesManager.svelte -->
<script lang="ts">
    import { character } from '$lib/state/character.svelte';
    import { executeUpdate, type UpdateState } from '$lib/utils/updates';
    import { supabase } from '$lib/supabaseClient';

    interface AttributeField {
        key: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
        label: string;
        description: string;
    }

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

    function startEdit() {
        editMode = true;
        tempValues = attributeFields.reduce((acc, field) => {
            acc[field.key] = character.character_attributes?.[0]?.[field.key] ?? 10;
            return acc;
        }, {} as Record<string, number>);
    }

    async function saveChanges() {
        if (!character.character_attributes?.[0]) return;
        
        const previousValues = { ...character.character_attributes[0] };

        await executeUpdate({
            key: `attributes-${character.id}`,
            status: updateState,
            operation: async () => {
                const { error } = await supabase
                    .from('character_attributes')
                    .update(tempValues)
                    .eq('character_id', character.id);
                
                if (error) throw error;
            },
            optimisticUpdate: () => {
                if (character.character_attributes?.[0]) {
                    Object.assign(character.character_attributes[0], tempValues);
                }
            },
            rollback: () => {
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
    <div class="flex justify-between items-center">
        <h2 class="text-xl font-bold">Attributes</h2>
        {#if editMode}
            <div class="flex gap-2">
                <button 
                    class="btn btn-secondary"
                    onclick={() => editMode = false}
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
            <button 
                class="btn"
                onclick={startEdit}
            >
                Edit Attributes
            </button>
        {/if}
    </div>

    <div class="grid gap-4 md:grid-cols-2">
        {#each attributeFields as field}
            <div class="p-4 bg-gray-50 rounded-lg">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <label for={field.key} class="font-medium">{field.label}</label>
                        <p class="text-sm text-gray-500">{field.description}</p>
                    </div>
                    {#if !editMode}
                        <div class="text-lg font-bold">
                            {character.character_attributes?.[0]?.[field.key] ?? 10}
                            <span class="text-sm text-gray-500 ml-1">
                                ({getModifier(character.character_attributes?.[0]?.[field.key] ?? 10)})
                            </span>
                        </div>
                    {/if}
                </div>

                {#if editMode}
                    <input
                        type="number"
                        id={field.key}
                        class="w-full p-2 border rounded"
                        min="1"
                        max="30"
                        bind:value={tempValues[field.key]}
                    />
                {/if}
            </div>
        {/each}
    </div>

    {#if updateState.error}
        <div class="p-4 bg-red-100 text-red-700 rounded-lg">
            Failed to update attributes. Please try again.
        </div>
    {/if}
</div>