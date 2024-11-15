<!-- src/lib/components/admin/DiscoveriesManager.svelte -->
<script lang="ts">
    import { character } from '$lib/state/character.svelte';
    import { type UpdateState } from '$lib/utils/updates';
    import { supabase } from '$lib/supabaseClient';
    import type { CharacterDiscovery } from '$lib/types/character';
	import type { Json } from '$lib/types/supabase';

    let updateState = $state<UpdateState>({
        status: 'idle',
        error: null
    });

    let showAddModal = $state(false);
    let editingDiscovery = $state<Partial<CharacterDiscovery> | null>(null);

    // Fix the derived store syntax
    let discoveryList = $derived([...(character.character_discoveries ?? [])].sort((a, b) => a.selected_level - b.selected_level));

    async function saveDiscovery() {
        if (!editingDiscovery?.discovery_name || !editingDiscovery.selected_level) {
            return;
        }

        const isNew = !editingDiscovery.id;
        const previousDiscoveries = [...(character.character_discoveries ?? [])];

        try {
            // Ensure required fields are present and match expected types
            const saveData: {
                discovery_name: string;
                selected_level: number;
                character_id: number;
                properties: Json | null;
            } = {
                discovery_name: editingDiscovery.discovery_name,
                selected_level: editingDiscovery.selected_level,
                character_id: character.id,
                properties: editingDiscovery.properties as Json
            };

            const { data, error } = await (isNew 
                ? supabase
                    .from('character_discoveries')
                    .insert(saveData)
                    .select()
                    .single()
                : supabase
                    .from('character_discoveries')
                    .update(saveData)
                    .eq('id', editingDiscovery.id!)
                    .select()
                    .single()
            );

            if (error) throw error;

            // Type assertion since we know the shape matches CharacterDiscovery
            const savedDiscovery = data as CharacterDiscovery;

            if (character.character_discoveries) {
                if (isNew) {
                    character.character_discoveries.push(savedDiscovery);
                } else {
                    const index = character.character_discoveries.findIndex(d => d.id === savedDiscovery.id);
                    if (index >= 0) {
                        character.character_discoveries[index] = savedDiscovery;
                    }
                }
            }

            editingDiscovery = null;
            showAddModal = false;
        } catch (err) {
            console.error('Failed to save discovery:', err);
            character.character_discoveries = previousDiscoveries;
            updateState.error = new Error('Failed to save discovery');
        }
    }

    async function deleteDiscovery(discovery: CharacterDiscovery) {
        if (!confirm(`Are you sure you want to delete ${discovery.discovery_name}?`)) return;

        const previousDiscoveries = [...(character.character_discoveries ?? [])];

        try {
            const { error } = await supabase
                .from('character_discoveries')
                .delete()
                .eq('id', discovery.id);

            if (error) throw error;

            if (character.character_discoveries) {
                character.character_discoveries = character.character_discoveries.filter(
                    d => d.id !== discovery.id
                );
            }
        } catch (err) {
            console.error('Failed to delete discovery:', err);
            character.character_discoveries = previousDiscoveries;
            updateState.error = new Error('Failed to delete discovery');
        }
    }

    function formatDiscoveryName(name: string): string {
        return name
            .replace(/([A-Z])/g, ' $1')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
</script>

<div class="space-y-4">
    <div class="flex justify-between items-center">
        <h2 class="text-xl font-bold">Discoveries</h2>
        <button 
            class="btn"
            onclick={() => {
                editingDiscovery = { selected_level: character.level };
                showAddModal = true;
            }}
        >
            Add Discovery
        </button>
    </div>

    {#if updateState.error}
        <div class="p-4 bg-red-100 text-red-700 rounded-lg">
            {updateState.error.message}
        </div>
    {/if}

    <div class="grid gap-4 md:grid-cols-2">
        {#each discoveryList as discovery (discovery.id)}
            <div class="p-4 bg-gray-50 rounded-lg">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="font-medium">
                            {formatDiscoveryName(discovery.discovery_name)}
                        </div>
                        <div class="text-sm text-gray-500">Level {discovery.selected_level}</div>
                        {#if discovery.properties}
                            <div class="mt-2 text-sm">
                                {#each Object.entries(discovery.properties) as [key, value]}
                                    <div>{key}: {value}</div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                    <div class="flex gap-2">
                        <button
                            class="text-primary hover:text-primary-dark"
                            onclick={() => {
                                editingDiscovery = { ...discovery };
                                showAddModal = true;
                            }}
                        >
                            Edit
                        </button>
                        <button
                            class="text-red-600 hover:text-red-700"
                            onclick={() => deleteDiscovery(discovery)}
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
                {editingDiscovery?.id ? 'Edit' : 'Add'} Discovery
            </h3>
            
            <div class="space-y-4">
                <div>
                    <label 
                        for="discovery-name" 
                        class="block text-sm font-medium mb-1"
                    >
                        Discovery Name
                    </label>
                    <input
                        id="discovery-name"
                        type="text"
                        class="w-full p-2 border rounded"
                        value={editingDiscovery?.discovery_name ?? ''}
                        oninput={(e) => {
                            if (editingDiscovery) {
                                editingDiscovery.discovery_name = e.currentTarget.value;
                            }
                        }}
                        placeholder="Enter discovery name"
                    />
                </div>

                <div>
                    <label 
                        for="level-gained" 
                        class="block text-sm font-medium mb-1"
                    >
                        Level Gained
                    </label>
                    <input
                        id="level-gained"
                        type="number"
                        class="w-full p-2 border rounded"
                        value={editingDiscovery?.selected_level ?? character.level}
                        oninput={(e) => {
                            if (editingDiscovery) {
                                editingDiscovery.selected_level = Number(e.currentTarget.value);
                            }
                        }}
                        min="1"
                        max={character.level}
                    />
                </div>

                <div>
                    <label 
                        for="properties" 
                        class="block text-sm font-medium mb-1"
                    >
                        Properties (JSON)
                    </label>
                    <textarea
                        id="properties"
                        class="w-full p-2 border rounded"
                        rows="4"
                        value={editingDiscovery?.properties 
                            ? JSON.stringify(editingDiscovery.properties, null, 2) 
                            : ''}
                        oninput={(e) => {
                            if (editingDiscovery) {
                                try {
                                    editingDiscovery.properties = JSON.parse(e.currentTarget.value);
                                } catch {
                                    // Invalid JSON - leave properties as is
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
                            editingDiscovery = null;
                            showAddModal = false;
                        }}
                    >
                        Cancel
                    </button>
                    <button 
                        class="btn"
                        onclick={saveDiscovery}
                        disabled={updateState.status === 'syncing'}
                    >
                        {editingDiscovery?.id ? 'Save Changes' : 'Add Discovery'}
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}