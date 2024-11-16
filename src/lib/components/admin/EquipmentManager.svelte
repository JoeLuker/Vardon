<script lang="ts">
    import { character } from '$lib/state/character.svelte';
    import { executeUpdate, type UpdateState } from '$lib/utils/updates';
    import { supabase } from '$lib/supabaseClient';
    import type { DatabaseCharacterEquipment } from '$lib/types/character';

    let updateState = $state<UpdateState>({
        status: 'idle',
        error: null
    });

    let showAddModal = $state(false);
    let editingEquipment = $state<Partial<DatabaseCharacterEquipment> | null>(null);

    const equipmentTypes = [
        'weapon',
        'armor',
        'shield',
        'ring',
        'wondrous',
        'potion',
        'scroll',
        'wand',
        'gear'
    ] as const;

    let equipmentList = $derived([...(character.character_equipment ?? [])].sort((a, b) => 
        (a.type as string).localeCompare(b.type) || a.name.localeCompare(b.name)
    ));

    async function saveEquipment() {
        if (!editingEquipment?.name || !editingEquipment?.type) {
            return;
        }

        const equipment = editingEquipment;
        const isNew = !equipment.id;
        const previousEquipment = [...(character.character_equipment ?? [])];

        await executeUpdate({
            key: `save-equipment-${equipment.id ?? 'new'}`,
            status: updateState,
            operation: async () => {
                const saveData = {
                    name: equipment.name as string,
                    type: equipment.type as string,
                    equipped: equipment.equipped ?? false,
                    properties: equipment.properties ?? {},
                    character_id: character.id
                };

                const { data, error } = await (isNew 
                    ? supabase
                        .from('character_equipment')
                        .insert(saveData)
                        .select()
                        .single()
                    : supabase
                        .from('character_equipment')
                        .update(saveData)
                        .eq('id', equipment.id!)
                        .select()
                        .single()
                );

                if (error) throw error;
                return data as DatabaseCharacterEquipment;
            },
            optimisticUpdate: () => {
                if (!character.character_equipment) character.character_equipment = [];
                if (isNew) {
                    character.character_equipment.push(equipment as DatabaseCharacterEquipment);
                } else {
                    const index = character.character_equipment.findIndex(e => e.id === equipment.id);
                    if (index >= 0) {
                        character.character_equipment[index] = equipment as DatabaseCharacterEquipment;
                    }
                }
            },
            rollback: () => {
                character.character_equipment = previousEquipment;
            }
        });

        editingEquipment = null;
        showAddModal = false;
    }

    async function deleteEquipment(equipment: DatabaseCharacterEquipment) {
        if (!confirm(`Are you sure you want to delete ${equipment.name}?`)) return;

        const previousEquipment = [...(character.character_equipment ?? [])];

        await executeUpdate({
            key: `delete-equipment-${equipment.id}`,
            status: updateState,
            operation: async () => {
                const { error } = await supabase
                    .from('character_equipment')
                    .delete()
                    .eq('id', equipment.id);

                if (error) throw error;
            },
            optimisticUpdate: () => {
                if (character.character_equipment) {
                    character.character_equipment = character.character_equipment.filter(e => e.id !== equipment.id);
                }
            },
            rollback: () => {
                character.character_equipment = previousEquipment;
            }
        });
    }

    async function toggleEquipped(equipment: DatabaseCharacterEquipment) {
        const previousEquipment = [...(character.character_equipment ?? [])];

        await executeUpdate({
            key: `toggle-equipment-${equipment.id}`,
            status: updateState,
            operation: async () => {
                const { data, error } = await supabase
                    .from('character_equipment')
                    .update({ equipped: !equipment.equipped })
                    .eq('id', equipment.id)
                    .select()
                    .single();

                if (error) throw error;
                return data as DatabaseCharacterEquipment;
            },
            optimisticUpdate: () => {
                if (character.character_equipment) {
                    const index = character.character_equipment.findIndex(e => e.id === equipment.id);
                    if (index >= 0) {
                        character.character_equipment[index] = {
                            ...equipment,
                            equipped: !equipment.equipped
                        };
                    }
                }
            },
            rollback: () => {
                character.character_equipment = previousEquipment;
            }
        });
    }
</script>

<div class="space-y-4">
    <div class="flex justify-between items-center">
        <h2 class="text-xl font-bold">Equipment</h2>
        <button 
            class="btn"
            onclick={() => {
                editingEquipment = { equipped: false };
                showAddModal = true;
            }}
        >
            Add Equipment
        </button>
    </div>

    {#if updateState.error}
        <div class="p-4 bg-red-100 text-red-700 rounded-lg">
            {updateState.error.message}
        </div>
    {/if}

    <div class="grid gap-4 md:grid-cols-2">
        {#each equipmentList as equipment (equipment.id)}
            <div class="p-4 bg-gray-50 rounded-lg">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="font-medium">{equipment.name}</div>
                        <div class="text-sm text-gray-500 capitalize">{equipment.type}</div>
                        {#if equipment.properties}
                            <div class="mt-2 text-sm">
                                {#each Object.entries(equipment.properties) as [key, value]}
                                    <div>{key}: {value}</div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                    <div class="flex gap-2">
                        <button
                            class="text-sm {equipment.equipped ? 'text-primary' : 'text-gray-500'}"
                            onclick={() => toggleEquipped(equipment)}
                        >
                            {equipment.equipped ? 'Equipped' : 'Unequipped'}
                        </button>
                        <button
                            class="text-primary hover:text-primary-dark"
                            onclick={() => {
                                editingEquipment = { ...equipment };
                                showAddModal = true;
                            }}
                        >
                            Edit
                        </button>
                        <button
                            class="text-red-600 hover:text-red-700"
                            onclick={() => deleteEquipment(equipment)}
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
                {editingEquipment?.id ? 'Edit' : 'Add'} Equipment
            </h3>
            
            <div class="space-y-4">
                <div>
                    <label for="equipment-name" class="block text-sm font-medium mb-1">
                        Name
                    </label>
                    <input
                        id="equipment-name"
                        type="text"
                        class="w-full p-2 border rounded"
                        bind:value={editingEquipment!.name}
                        placeholder="Enter equipment name"
                    />
                </div>

                <div>
                    <label for="equipment-type" class="block text-sm font-medium mb-1">
                        Type
                    </label>
                    <select
                        id="equipment-type"
                        class="w-full p-2 border rounded"
                        bind:value={editingEquipment!.type}
                    >
                        <option value="">Select type...</option>
                        {#each equipmentTypes as type}
                            <option value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                        {/each}
                    </select>
                </div>

                <div class="flex items-center gap-2">
                    <input
                        id="equipment-equipped"
                        type="checkbox"
                        class="rounded"
                        bind:checked={editingEquipment!.equipped}
                    />
                    <label for="equipment-equipped" class="text-sm font-medium">
                        Equipped
                    </label>
                </div>

                <div>
                    <label for="equipment-properties" class="block text-sm font-medium mb-1">
                        Properties (JSON)
                    </label>
                    <textarea
                        id="equipment-properties"
                        class="w-full p-2 border rounded"
                        rows="4"
                        value={editingEquipment?.properties ? JSON.stringify(editingEquipment.properties, null, 2) : ''}
                        oninput={(e) => {
                            if (editingEquipment) {
                                try {
                                    editingEquipment.properties = JSON.parse(e.currentTarget.value);
                                } catch {
                                    // Invalid JSON - you might want to show an error
                                }
                            }
                        }}
                        placeholder="Enter properties as JSON"
                    ></textarea>
                </div>

                <div class="flex justify-end gap-2">
                    <button 
                        class="btn btn-secondary"
                        onclick={() => {
                            editingEquipment = null;
                            showAddModal = false;
                        }}
                    >
                        Cancel
                    </button>
                    <button 
                        class="btn"
                        onclick={saveEquipment}
                        disabled={updateState.status === 'syncing'}
                    >
                        {editingEquipment?.id ? 'Save Changes' : 'Add Equipment'}
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if} 