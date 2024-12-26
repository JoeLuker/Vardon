<script lang="ts">
    import { type UpdateState } from '$lib/utils/updates';
    import { supabase } from '$lib/db/supabaseClient';
    import type { Json } from '$lib/domain/types/supabase';
    import { onMount } from 'svelte';

    interface DatabaseBaseAncestry {
        id: number;
        name: string;
        size: string;
        base_speed: number;
        ability_modifiers: Record<string, number> | null;
        description: string | null;
        created_at?: string | null;
        updated_at?: string | null;
    }

    interface DatabaseBaseAncestralTrait {
        id: number;
        ancestry_id: number | null;
        name: string;
        description: string;
        benefits: Json;
        is_optional: boolean | null;
        created_at?: string | null;
        updated_at?: string | null;
    }

    let updateState = $state<UpdateState>({
        status: 'idle',
        error: null
    });

    let showAddModal = $state(false);
    let editingAncestry = $state<Partial<DatabaseBaseAncestry> | null>(null);
    let ancestries = $state<DatabaseBaseAncestry[]>([]);
    let ancestralTraits = $state<DatabaseBaseAncestralTrait[]>([]);

    onMount(async () => {
        await loadAncestries();
        await loadAncestralTraits();
    });

    async function loadAncestries() {
        const { data, error } = await supabase
            .from('base_ancestries')
            .select('*')
            .order('name');

        if (error) {
            updateState.error = new Error(error.message);
            return;
        }

        ancestries = data.map(ancestry => ({
            ...ancestry,
            ability_modifiers: ancestry.ability_modifiers as Record<string, number> || {}
        }));
    }

    async function loadAncestralTraits() {
        const { data, error } = await supabase
            .from('base_ancestral_traits')
            .select('*')
            .order('name');

        if (error) {
            updateState.error = new Error(error.message);
            return;
        }

        ancestralTraits = data;
    }

    async function saveAncestry() {
        if (!editingAncestry?.name || !editingAncestry.size || !editingAncestry.base_speed) {
            return;
        }

        const isNew = !editingAncestry.id;
        const previousAncestries = [...ancestries];

        try {
            const saveData = {
                name: editingAncestry.name,
                size: editingAncestry.size,
                base_speed: editingAncestry.base_speed,
                ability_modifiers: editingAncestry.ability_modifiers || {},
                description: editingAncestry.description || ''
            };

            const { error } = await (isNew 
                ? supabase
                    .from('base_ancestries')
                    .insert(saveData)
                    .select()
                    .single()
                : supabase
                    .from('base_ancestries')
                    .update(saveData)
                    .eq('id', editingAncestry.id!)
                    .select()
                    .single()
            );

            if (error) throw error;
            await loadAncestries();
            editingAncestry = null;
            showAddModal = false;
        } catch (err) {
            console.error('Failed to save ancestry:', err);
            ancestries = previousAncestries;
            updateState.error = new Error('Failed to save ancestry');
        }
    }

    async function deleteAncestry(ancestry: DatabaseBaseAncestry) {
        if (!confirm(`Are you sure you want to delete ${ancestry.name}?`)) return;

        const previousAncestries = [...ancestries];

        try {
            const { error } = await supabase
                .from('base_ancestries')
                .delete()
                .eq('id', ancestry.id);

            if (error) throw error;
            await loadAncestries();
        } catch (err) {
            console.error('Failed to delete ancestry:', err);
            ancestries = previousAncestries;
            updateState.error = new Error('Failed to delete ancestry');
        }
    }

    const handleAbilityModifierChange = (ability: string, value: number) => {
        if (!editingAncestry) return;
        editingAncestry.ability_modifiers = {
            ...editingAncestry.ability_modifiers,
            [ability]: value
        };
    };
</script>

<div class="space-y-4">
    <div class="flex justify-between items-center">
        <h2 class="text-xl font-bold">Ancestries</h2>
        <button 
            class="btn"
            onclick={() => {
                editingAncestry = {};
                showAddModal = true;
            }}
        >
            Add Ancestry
        </button>
    </div>

    {#if updateState.error}
        <div class="p-4 bg-red-100 text-red-700 rounded-lg">
            {updateState.error.message}
        </div>
    {/if}

    <div class="grid gap-4 md:grid-cols-2">
        {#each ancestries as ancestry (ancestry.id)}
            <div class="p-4 bg-gray-50 rounded-lg">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="font-medium text-lg">{ancestry.name}</div>
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
                            <ul class="list-disc list-inside">
                                {#each ancestralTraits.filter(trait => trait.ancestry_id === ancestry.id) as trait}
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
                            class="text-primary hover:text-primary-dark"
                            onclick={() => {
                                editingAncestry = { ...ancestry };
                                showAddModal = true;
                            }}
                        >
                            Edit
                        </button>
                        <button
                            class="text-red-600 hover:text-red-700"
                            onclick={() => deleteAncestry(ancestry)}
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
                {editingAncestry?.id ? 'Edit' : 'Add'} Ancestry
            </h3>
            
            <div class="space-y-4">
                <div>
                    <label for="ancestry-name" class="block text-sm font-medium mb-1">
                        Name
                    </label>
                    <input
                        id="ancestry-name"
                        type="text"
                        class="w-full p-2 border rounded"
                        bind:value={editingAncestry!.name}
                        placeholder="Enter ancestry name"
                    />
                </div>

                <div>
                    <label for="ancestry-size" class="block text-sm font-medium mb-1">
                        Size
                    </label>
                    <select
                        id="ancestry-size"
                        class="w-full p-2 border rounded"
                        bind:value={editingAncestry!.size}
                    >
                        <option value="">Select size...</option>
                        <option value="Small">Small</option>
                        <option value="Medium">Medium</option>
                        <option value="Large">Large</option>
                    </select>
                </div>

                <div>
                    <label for="ancestry-speed" class="block text-sm font-medium mb-1">
                        Base Speed (ft)
                    </label>
                    <input
                        id="ancestry-speed"
                        type="number"
                        class="w-full p-2 border rounded"
                        bind:value={editingAncestry!.base_speed}
                        min="0"
                        step="5"
                    />
                </div>

                <div>
                    <label for="ancestry-description" class="block text-sm font-medium mb-1">
                        Description
                    </label>
                    <textarea
                        id="ancestry-description"
                        class="w-full p-2 border rounded"
                        bind:value={editingAncestry!.description}
                        rows="3"
                        placeholder="Enter ancestry description"
                    ></textarea>
                </div>

                <div>
                    <span class="block text-sm font-medium mb-1">
                        Ability Modifiers
                    </span>
                    <div class="grid grid-cols-2 gap-2">
                        {#each ['str', 'dex', 'con', 'int', 'wis', 'cha'] as ability}
                            <div>
                                <label for={`ability-${ability}`} class="block text-sm">
                                    {ability.toUpperCase()}
                                </label>
                                <input
                                    id={`ability-${ability}`}
                                    type="number"
                                    class="w-full p-2 border rounded"
                                    value={editingAncestry?.ability_modifiers?.[ability] ?? ''}
                                    oninput={(e) => handleAbilityModifierChange(ability, Number(e.currentTarget.value))}
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
                        onclick={saveAncestry}
                        disabled={updateState.status === 'syncing'}
                    >
                        {editingAncestry?.id ? 'Save Changes' : 'Add Ancestry'}
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if} 