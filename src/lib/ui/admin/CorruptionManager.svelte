<script lang="ts">
    import { getCharacter } from '$lib/state/character.svelte';
    import { type UpdateState } from '$lib/state/updates.svelte';
    import { supabase } from '$lib/db/supabaseClient';
    import type { DatabaseCharacterCorruption } from '$lib/domain/types/character';

    let { characterId } = $props<{ characterId: number; }>();

    let character = $derived(getCharacter(characterId));

    let updateState = $state<UpdateState>({
        status: 'idle',
        error: null
    });

    let showAddModal = $state(false);
    let editingCorruption = $state<Partial<DatabaseCharacterCorruption> | null>(null);

    let corruptionList = $derived(
        [...(character.character_corruptions ?? [])].sort(
            (a, b) => (a.corruption_stage ?? 0) - (b.corruption_stage ?? 0)
        )
    );

    interface VampireManifestationProperties {
        lastFeedDate?: string;
        constitutionDamageDealt?: number;
        requiresDailyFeeding?: boolean;
        hasSpiderClimb?: boolean;
        invitedDwellings?: string[];  // List of places invited into
    }

    async function saveCorruption() {
        if (!editingCorruption?.corruption_type || !editingCorruption.corruption_stage) {
            return;
        }

        const isNew = !editingCorruption.id;
        const previousCorruptions = [...(character.character_corruptions ?? [])];

        try {
            const saveData = {
                corruption_type: editingCorruption.corruption_type,
                corruption_stage: editingCorruption.corruption_stage,
                character_id: character.id,
                blood_consumed: editingCorruption.blood_consumed ?? 0,
                blood_required: editingCorruption.blood_required ?? 0,
                sync_status: editingCorruption.sync_status ?? 'pending',
                properties: {
                    lastFeedDate: new Date().toISOString(),
                    constitutionDamageDealt: 0,
                    requiresDailyFeeding: editingCorruption.corruption_type === 'Fangs',
                    hasSpiderClimb: editingCorruption.corruption_type === 'Vampiric Grace' && 
                                   (editingCorruption.corruption_stage >= 6),
                    invitedDwellings: []
                } as VampireManifestationProperties
            };

            const { data, error } = await (isNew 
                ? supabase
                    .from('character_corruptions')
                    .insert(saveData)
                    .select()
                    .single()
                : supabase
                    .from('character_corruptions')
                    .update(saveData)
                    .eq('id', editingCorruption.id!)
                    .select()
                    .single()
            );

            if (error) throw error;

            const savedCorruption = data as DatabaseCharacterCorruption;

            if (character.character_corruptions) {
                if (isNew) {
                    character.character_corruptions.push(savedCorruption);
                } else {
                    const index = character.character_corruptions.findIndex(c => c.id === savedCorruption.id);
                    if (index >= 0) {
                        character.character_corruptions[index] = savedCorruption;
                    }
                }
            }

            editingCorruption = null;
            showAddModal = false;
        } catch (err) {
            console.error('Failed to save corruption:', err);
            character.character_corruptions = previousCorruptions;
            updateState.error = new Error('Failed to save corruption');
        }
    }

    async function deleteCorruption(corruption: DatabaseCharacterCorruption) {
        if (!confirm(`Are you sure you want to delete this corruption?`)) return;

        const previousCorruptions = [...(character.character_corruptions ?? [])];

        try {
            const { error } = await supabase
                .from('character_corruptions')
                .delete()
                .eq('id', corruption.id);

            if (error) throw error;

            if (character.character_corruptions) {
                character.character_corruptions = character.character_corruptions.filter(
                    c => c.id !== corruption.id
                );
            }
        } catch (err) {
            console.error('Failed to delete corruption:', err);
            character.character_corruptions = previousCorruptions;
            updateState.error = new Error('Failed to delete corruption');
        }
    }
</script>

<div class="space-y-4">
    <div class="flex justify-between items-center">
        <h2 class="text-xl font-bold">Corruptions</h2>
        <button 
            class="btn"
            onclick={() => {
                editingCorruption = { 
                    corruption_stage: 0,
                    blood_consumed: 0,
                    blood_required: 0,
                    sync_status: 'pending'
                };
                showAddModal = true;
            }}
        >
            Add Corruption
        </button>
    </div>

    {#if updateState.error}
        <div class="p-4 bg-red-100 text-red-700 rounded-lg">
            {updateState.error.message}
        </div>
    {/if}

    <div class="grid gap-4 md:grid-cols-2">
        {#each corruptionList as corruption (corruption.id)}
            <div class="p-4 bg-gray-50 rounded-lg">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="font-medium">{corruption.corruption_type}</div>
                        <div class="text-sm text-gray-500">
                            Stage {corruption.corruption_stage ?? 0}
                        </div>
                        <div class="mt-2 text-sm space-y-1">
                            <div>Blood Consumed: {corruption.blood_consumed ?? 0}</div>
                            <div>Blood Required: {corruption.blood_required ?? 0}</div>
                            <div>Status: {corruption.sync_status}</div>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button
                            class="text-primary hover:text-primary-dark"
                            onclick={() => {
                                editingCorruption = { ...corruption };
                                showAddModal = true;
                            }}
                        >
                            Edit
                        </button>
                        <button
                            class="text-red-600 hover:text-red-700"
                            onclick={() => deleteCorruption(corruption)}
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
                {editingCorruption?.id ? 'Edit' : 'Add'} Corruption
            </h3>
            
            <div class="space-y-4">
                <div>
                    <label for="corruption-type" class="block text-sm font-medium mb-1">
                        Corruption Type
                    </label>
                    <input
                        id="corruption-type"
                        type="text"
                        class="w-full p-2 border rounded"
                        bind:value={editingCorruption!.corruption_type}
                        placeholder="Enter corruption type"
                    />
                </div>

                <div>
                    <label for="corruption-stage" class="block text-sm font-medium mb-1">
                        Corruption Stage
                    </label>
                    <input
                        id="corruption-stage"
                        type="number"
                        class="w-full p-2 border rounded"
                        bind:value={editingCorruption!.corruption_stage}
                        min="0"
                    />
                </div>

                <div>
                    <label for="blood-consumed" class="block text-sm font-medium mb-1">
                        Blood Consumed
                    </label>
                    <input
                        id="blood-consumed"
                        type="number"
                        class="w-full p-2 border rounded"
                        bind:value={editingCorruption!.blood_consumed}
                        min="0"
                    />
                </div>

                <div>
                    <label for="blood-required" class="block text-sm font-medium mb-1">
                        Blood Required
                    </label>
                    <input
                        id="blood-required"
                        type="number"
                        class="w-full p-2 border rounded"
                        bind:value={editingCorruption!.blood_required}
                        min="0"
                    />
                </div>

                <div class="flex justify-end gap-2">
                    <button 
                        class="btn btn-secondary"
                        onclick={() => {
                            editingCorruption = null;
                            showAddModal = false;
                        }}
                    >
                        Cancel
                    </button>
                    <button 
                        class="btn btn-primary"
                        disabled={!editingCorruption?.corruption_type}
                        onclick={saveCorruption}
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if} 