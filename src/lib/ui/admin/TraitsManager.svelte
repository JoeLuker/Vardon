<script lang="ts">
    import { supabase } from '$lib/db/supabaseClient';
    import type { DatabaseBaseTrait } from '$lib/domain/types/character';
    import { executeUpdate, type UpdateState } from '$lib/utils/updates';
    import { onMount } from 'svelte';
    
    let traits = $state<DatabaseBaseTrait[]>([]);
    let newTrait = $state<Omit<DatabaseBaseTrait, 'id' | 'created_at' | 'updated_at'>>({
        name: '',
        trait_type: '',
        description: '',
        benefits: null
    });
    
    let updateState = $state<UpdateState>({ 
        status: 'idle',
        error: null
    });

    let successMessage = $state<string | null>(null);

    onMount(async () => {
        await loadTraits();
    });

    async function loadTraits() {
        const { data, error: loadError } = await supabase
            .from('base_traits')
            .select('*')
            .order('name');

        if (loadError) {
            updateState.error = new Error(loadError.message);
            return;
        }

        traits = data ?? [];
    }

    async function saveTrait(trait: Omit<DatabaseBaseTrait, 'id' | 'created_at' | 'updated_at'>) {
        const isNew = !('id' in trait);
        const previousTraits = [...traits];

        await executeUpdate({
            key: `save-trait-${isNew ? 'new' : (trait as DatabaseBaseTrait).id}`,
            status: updateState,
            operation: async () => {
                if (isNew) {
                    const { error: saveError } = await supabase
                        .from('base_traits')
                        .insert(trait);
                    if (saveError) throw saveError;
                    successMessage = 'Trait created successfully';
                } else {
                    const typedTrait = trait as DatabaseBaseTrait;
                    const { error: saveError } = await supabase
                        .from('base_traits')
                        .update({
                            name: typedTrait.name,
                            trait_type: typedTrait.trait_type,
                            description: typedTrait.description,
                            benefits: typedTrait.benefits
                        })
                        .eq('id', typedTrait.id);
                    if (saveError) throw saveError;
                    successMessage = 'Trait updated successfully';
                }
            },
            optimisticUpdate: () => {
                if (isNew) {
                    // Don't update traits list until we get the new ID
                } else {
                    const typedTrait = trait as DatabaseBaseTrait;
                    const index = traits.findIndex(t => t.id === typedTrait.id);
                    if (index >= 0) {
                        traits[index] = {
                            ...traits[index],
                            name: typedTrait.name,
                            trait_type: typedTrait.trait_type,
                            description: typedTrait.description,
                            benefits: typedTrait.benefits
                        };
                    }
                }
            },
            rollback: () => {
                traits = previousTraits;
                successMessage = null;
            }
        });

        await loadTraits();
        if (isNew) {
            newTrait = {
                name: '',
                trait_type: '',
                description: '',
                benefits: null
            };
        }
    }

    async function deleteTrait(id: number) {
        if (!confirm('Are you sure you want to delete this trait?')) return;

        const previousTraits = [...traits];

        await executeUpdate({
            key: `delete-trait-${id}`,
            status: updateState,
            operation: async () => {
                const { error: deleteError } = await supabase
                    .from('base_traits')
                    .delete()
                    .eq('id', id);
                if (deleteError) throw deleteError;
                successMessage = 'Trait deleted successfully';
            },
            optimisticUpdate: () => {
                traits = traits.filter(t => t.id !== id);
            },
            rollback: () => {
                traits = previousTraits;
                successMessage = null;
            }
        });

        await loadTraits();
    }
</script>

<div class="traits-manager">
    <h3>Trait Manager</h3>

    {#if updateState.error}
        <div class="error">{updateState.error.message}</div>
    {/if}
    {#if successMessage}
        <div class="success">{successMessage}</div>
    {/if}

    <div class="new-trait-form">
        <h4>Add New Trait</h4>
        <input 
            type="text" 
            bind:value={newTrait.name} 
            placeholder="Trait Name"
        />
        <input 
            type="text" 
            bind:value={newTrait.trait_type} 
            placeholder="Trait Type"
        />
        <textarea 
            bind:value={newTrait.description} 
            placeholder="Description"
        ></textarea>
        <textarea 
            bind:value={newTrait.benefits} 
            placeholder="Benefits (JSON)"
        ></textarea>
        <button onclick={() => saveTrait(newTrait)}>Add Trait</button>
    </div>

    <div class="traits-list">
        <h3>Existing Traits</h3>
        {#each traits as trait}
            <div class="trait-item">
                <input 
                    type="text" 
                    bind:value={trait.name}
                />
                <input 
                    type="text" 
                    bind:value={trait.trait_type}
                />
                <textarea 
                    bind:value={trait.description}
                ></textarea>
                <textarea 
                    bind:value={trait.benefits}
                ></textarea>
                <div class="actions">
                    <button onclick={() => saveTrait(trait)}>Save</button>
                    <button onclick={() => deleteTrait(trait.id)}>Delete</button>
                </div>
            </div>
        {/each}
    </div>
</div>

<style>
    .traits-manager {
        padding: 1rem;
    }

    .error {
        color: red;
        margin: 1rem 0;
    }

    .success {
        color: green;
        margin: 1rem 0;
    }

    .new-trait-form, .trait-item {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin: 1rem 0;
        padding: 1rem;
        border: 1px solid #ccc;
        border-radius: 4px;
    }

    input, textarea {
        padding: 0.5rem;
    }

    textarea {
        min-height: 100px;
    }

    .actions {
        display: flex;
        gap: 0.5rem;
    }

    button {
        padding: 0.5rem 1rem;
        cursor: pointer;
    }
</style> 