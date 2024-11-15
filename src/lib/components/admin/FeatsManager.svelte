<!-- src/lib/components/admin/FeatsManager.svelte -->
<script lang="ts">
    import { character } from '$lib/state/character.svelte';
    import type { UpdateState } from '$lib/utils/updates';
    import { supabase } from '$lib/supabaseClient';
    import type { DatabaseCharacterFeat } from '$lib/types/character';
    import type { Json } from '$lib/types/supabase';

    let updateState = $state<UpdateState>({
        status: 'idle',
        error: null
    });

    let showAddModal = $state(false);
    let editingFeat = $state<Partial<DatabaseCharacterFeat> | null>(null);

    // Replace featsByType with a simple sorted list
    let featList = $derived([...(character.character_feats ?? [])].sort((a, b) => a.selected_level - b.selected_level));

    // Keep featTypes for the dropdown
    const featTypes = [
        { value: 'combat', label: 'Combat' },
        { value: 'general', label: 'General' },
        { value: 'metamagic', label: 'Metamagic' },
        { value: 'racial', label: 'Racial' },
    ];

    async function saveFeat() {
        if (!editingFeat?.feat_name || !editingFeat.feat_type || !editingFeat.selected_level) {
            return;
        }

        const isNew = !editingFeat.id;
        const previousFeats = [...(character.character_feats ?? [])];

        try {
            if (isNew) {
                const insertData = {
                    feat_name: editingFeat.feat_name,
                    feat_type: editingFeat.feat_type,
                    selected_level: editingFeat.selected_level,
                    character_id: character.id,
                    properties: editingFeat.properties as Json
                };

                const { data, error } = await supabase
                    .from('character_feats')
                    .insert(insertData)
                    .select()
                    .single();

                if (error) throw error;
                const savedFeat = data as DatabaseCharacterFeat;
                character.character_feats?.push(savedFeat);
            } else {
                const updateData = {
                    feat_name: editingFeat.feat_name,
                    feat_type: editingFeat.feat_type,
                    selected_level: editingFeat.selected_level,
                    properties: editingFeat.properties as Json
                };

                const { data, error } = await supabase
                    .from('character_feats')
                    .update(updateData)
                    .eq('id', editingFeat.id!)
                    .select()
                    .single();

                if (error) throw error;
                const savedFeat = data as DatabaseCharacterFeat;
                const index = character.character_feats?.findIndex(f => f.id === savedFeat.id) ?? -1;
                if (index >= 0 && character.character_feats) {
                    character.character_feats[index] = savedFeat;
                }
            }

            editingFeat = null;
            showAddModal = false;
        } catch (err) {
            console.error('Failed to save feat:', err);
            character.character_feats = previousFeats;
            updateState.error = new Error('Failed to save feat');
        }
    }

    async function deleteFeat(feat: DatabaseCharacterFeat) {
        if (!confirm(`Are you sure you want to delete ${feat.feat_name}?`)) return;

        const previousFeats = [...(character.character_feats ?? [])];

        try {
            const { error } = await supabase
                .from('character_feats')
                .delete()
                .eq('id', feat.id);

            if (error) throw error;

            if (character.character_feats) {
                character.character_feats = character.character_feats.filter(f => f.id !== feat.id);
            }
        } catch (err) {
            console.error('Failed to delete feat:', err);
            character.character_feats = previousFeats;
            updateState.error = new Error('Failed to delete feat');
        }
    }

    function formatFeatType(type: string): string {
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
</script>

<div class="space-y-4">
    <div class="flex justify-between items-center">
        <h2 class="text-xl font-bold">Feats</h2>
        <button 
            class="btn"
            onclick={() => {
                editingFeat = { selected_level: character.level };
                showAddModal = true;
            }}
        >
            Add Feat
        </button>
    </div>

    {#if updateState.error}
        <div class="p-4 bg-red-100 text-red-700 rounded-lg">
            {updateState.error.message}
        </div>
    {/if}

    <div class="grid gap-4 md:grid-cols-2">
        {#each featList as feat (feat.id)}
            <div class="p-4 bg-gray-50 rounded-lg">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="font-medium text-lg">{feat.feat_name}</div>
                        <div class="text-sm text-gray-500">
                            Level {feat.selected_level} • {formatFeatType(feat.feat_type)}
                        </div>
                        {#if feat.properties}
                            <div class="mt-2 text-sm space-y-1">
                                {#each Object.entries(feat.properties) as [key, value]}
                                    <div>
                                        <span class="font-medium">{key}:</span> {value}
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                    <div class="flex gap-2">
                        <button
                            class="text-primary hover:text-primary-dark"
                            onclick={() => {
                                editingFeat = { ...feat };
                                showAddModal = true;
                            }}
                        >
                            Edit
                        </button>
                        <button
                            class="text-red-600 hover:text-red-700"
                            onclick={() => deleteFeat(feat)}
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
                {editingFeat?.id ? 'Edit' : 'Add'} Feat
            </h3>
            
            <div class="space-y-4">
                <div>
                    <label for="feat-name" class="block text-sm font-medium mb-1">
                        Feat Name
                    </label>
                    <input
                        id="feat-name"
                        type="text"
                        class="w-full p-2 border rounded"
                        value={editingFeat?.feat_name ?? ''}
                        oninput={(e) => {
                            if (editingFeat) {
                                editingFeat.feat_name = e.currentTarget.value;
                            }
                        }}
                        placeholder="Enter feat name"
                    />
                </div>

                <div>
                    <label for="feat-type" class="block text-sm font-medium mb-1">
                        Feat Type
                    </label>
                    <select
                        id="feat-type"
                        class="w-full p-2 border rounded"
                        value={editingFeat?.feat_type ?? ''}
                        onchange={(e) => {
                            if (editingFeat) {
                                editingFeat.feat_type = e.currentTarget.value;
                            }
                        }}
                    >
                        <option value="">Select type...</option>
                        {#each featTypes as type}
                            <option value={type.value}>{type.label}</option>
                        {/each}
                    </select>
                </div>

                <div>
                    <label for="feat-level" class="block text-sm font-medium mb-1">
                        Level Gained
                    </label>
                    <input
                        id="feat-level"
                        type="number"
                        class="w-full p-2 border rounded"
                        value={editingFeat?.selected_level ?? character.level}
                        oninput={(e) => {
                            if (editingFeat) {
                                editingFeat.selected_level = parseInt(e.currentTarget.value) || character.level;
                            }
                        }}
                        min="1"
                        max={character.level}
                    />
                </div>

                <div>
                    <label for="feat-properties" class="block text-sm font-medium mb-1">
                        Properties (JSON)
                    </label>
                    <textarea
                        id="feat-properties"
                        class="w-full p-2 border rounded"
                        rows="4"
                        value={editingFeat?.properties ? JSON.stringify(editingFeat.properties, null, 2) : ''}
                        oninput={(e) => {
                            if (editingFeat) {
                                try {
                                    editingFeat.properties = JSON.parse(e.currentTarget.value);
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
                            editingFeat = null;
                            showAddModal = false;
                        }}
                    >
                        Cancel
                    </button>
                    <button 
                        class="btn"
                        onclick={saveFeat}
                        disabled={updateState.status === 'syncing'}
                    >
                        {editingFeat?.id ? 'Save Changes' : 'Add Feat'}
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}