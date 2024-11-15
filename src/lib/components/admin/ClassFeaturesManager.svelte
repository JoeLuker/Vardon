<!-- src/lib/components/admin/ClassFeaturesManager.svelte -->
<script lang="ts">
    import { character } from '$lib/state/character.svelte';
    import { type UpdateState } from '$lib/utils/updates';
    import { supabase } from '$lib/supabaseClient';
    import type { DatabaseCharacterClassFeature } from '$lib/types/character';
    import type { Json } from '$lib/types/supabase';

    let updateState = $state<UpdateState>({
        status: 'idle',
        error: null
    });

    let showAddModal = $state(false);
    let editingFeature = $state<Partial<DatabaseCharacterClassFeature> | null>(null);

    let featureList = $derived([...(character.character_class_features ?? [])].sort((a, b) => a.feature_level - b.feature_level));

    async function saveFeature() {
        if (!editingFeature?.feature_name || !editingFeature.feature_level) {
            return;
        }

        const isNew = !editingFeature.id;
        const previousFeatures = [...(character.character_class_features ?? [])];

        try {
            const saveData = {
                feature_name: editingFeature.feature_name,
                feature_level: editingFeature.feature_level,
                character_id: character.id,
                properties: editingFeature.properties as Json,
                active: editingFeature.active ?? true
            };

            const { data, error } = await (isNew 
                ? supabase
                    .from('character_class_features')
                    .insert(saveData)
                    .select()
                    .single()
                : supabase
                    .from('character_class_features')
                    .update(saveData)
                    .eq('id', editingFeature.id!)
                    .select()
                    .single()
            );

            if (error) throw error;

            const savedFeature = data as DatabaseCharacterClassFeature;

            if (character.character_class_features) {
                if (isNew) {
                    character.character_class_features.push(savedFeature);
                } else {
                    const index = character.character_class_features.findIndex((f: DatabaseCharacterClassFeature) => f.id === savedFeature.id);
                    if (index >= 0) {
                        character.character_class_features[index] = savedFeature;
                    }
                }
            }

            editingFeature = null;
            showAddModal = false;
        } catch (err) {
            console.error('Failed to save feature:', err);
            character.character_class_features = previousFeatures;
            updateState.error = new Error('Failed to save feature');
        }
    }

    async function deleteFeature(feature: DatabaseCharacterClassFeature) {
        if (!confirm(`Are you sure you want to delete ${feature.feature_name}?`)) return;

        const previousFeatures = [...(character.character_class_features ?? [])];

        try {
            const { error } = await supabase
                .from('character_class_features')
                .delete()
                .eq('id', feature.id);

            if (error) throw error;

            if (character.character_class_features) {
                character.character_class_features = character.character_class_features.filter(
                    (f: DatabaseCharacterClassFeature) => f.id !== feature.id
                );
            }
        } catch (err) {
            console.error('Failed to delete feature:', err);
            character.character_class_features = previousFeatures;
            updateState.error = new Error('Failed to delete feature');
        }
    }
</script>

<div class="space-y-4">
    <div class="flex justify-between items-center">
        <h2 class="text-xl font-bold">Class Features</h2>
        <button 
            class="btn"
            onclick={() => {
                editingFeature = { feature_level: 1, active: true };
                showAddModal = true;
            }}
        >
            Add Feature
        </button>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
        {#each featureList as feature (feature.id)}
            <div class="p-4 bg-gray-50 rounded-lg {!feature.active ? 'opacity-60' : ''}">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="font-medium">{feature.feature_name}</div>
                        <div class="text-sm text-gray-500">Level {feature.feature_level}</div>
                        {#if feature.properties}
                            <div class="mt-2 text-sm">
                                {#each Object.entries(feature.properties ?? {}) as [key, value]}
                                    <div>{key}: {value}</div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                    <div class="flex gap-2">
                        <button
                            class="text-primary hover:text-primary-dark"
                            onclick={() => {
                                editingFeature = { ...feature };
                                showAddModal = true;
                            }}
                        >
                            Edit
                        </button>
                        <button
                            class="text-red-600 hover:text-red-700"
                            onclick={() => deleteFeature(feature)}
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
                {editingFeature?.id ? 'Edit' : 'Add'} Class Feature
            </h3>
            
            <div class="space-y-4">
                <div>
                    <label for="feature-name" class="block text-sm font-medium mb-1">
                        Feature Name
                    </label>
                    <input
                        id="feature-name"
                        type="text"
                        class="w-full p-2 border rounded"
                        value={editingFeature?.feature_name ?? ''}
                        oninput={(e) => {
                            if (editingFeature) {
                                editingFeature.feature_name = e.currentTarget.value;
                            }
                        }}
                        placeholder="Enter feature name"
                    />
                </div>

                <div>
                    <label for="feature-level" class="block text-sm font-medium mb-1">
                        Level
                    </label>
                    <input
                        id="feature-level"
                        type="number"
                        class="w-full p-2 border rounded"
                        value={editingFeature?.feature_level ?? 1}
                        oninput={(e) => {
                            if (editingFeature) {
                                editingFeature.feature_level = parseInt(e.currentTarget.value);
                            }
                        }}
                        min="1"
                        max="20"
                    />
                </div>

                <div class="flex items-center gap-2">
                    <input
                        id="feature-active"
                        type="checkbox"
                        class="rounded"
                        checked={editingFeature?.active ?? true}
                        oninput={(e) => {
                            if (editingFeature) {
                                editingFeature.active = e.currentTarget.checked;
                            }
                        }}
                    />
                    <label for="feature-active" class="text-sm font-medium">Active</label>
                </div>

                <div>
                    <label for="feature-properties" class="block text-sm font-medium mb-1">
                        Properties (JSON)
                    </label>
                    <textarea
                        id="feature-properties"
                        class="w-full p-2 border rounded"
                        rows="4"
                        value={editingFeature?.properties ? JSON.stringify(editingFeature.properties, null, 2) : ''}
                        oninput={(e) => {
                            if (editingFeature) {
                                try {
                                    editingFeature.properties = JSON.parse(e.currentTarget.value) as Json;
                                } catch (err) {
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
                            editingFeature = null;
                            showAddModal = false;
                        }}
                    >
                        Cancel
                    </button>
                    <button 
                        class="btn"
                        onclick={saveFeature}
                        disabled={updateState.status === 'syncing'}
                    >
                        {editingFeature?.id ? 'Save Changes' : 'Add Feature'}
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}