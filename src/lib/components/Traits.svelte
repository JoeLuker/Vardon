<script lang="ts">
    import { getCharacter } from '$lib/state/character.svelte';
    import type { CharacterTraitWithBase } from '$lib/types/character';

    let { characterId } = $props<{ characterId: number }>();
    let character = $derived(getCharacter(characterId) ?? {
        id: characterId,
        level: 0,
        character_traits: []
    });

    // Group traits by type for display
    let traitsByType = $derived(
        (character.character_traits ?? []).reduce((acc: Record<string, CharacterTraitWithBase[]>, trait) => {
            if (!trait.base_traits) return acc;
            
            const type = trait.base_traits.trait_type;
            if (!acc[type]) {
                acc[type] = [];
            }
            acc[type].push(trait);
            return acc;
        }, {})
    );

    // Format type name for display
    function formatTraitType(type: string): string {
        return type.charAt(0).toUpperCase() + type.slice(1) + ' Traits';
    }
</script>

<div class="traits-component card">
    <h3>Character Traits</h3>

    {#if !character.character_traits?.length}
        <p class="text-gray-500">No character_traits found</p>
    {/if}

    {#each Object.entries(traitsByType) as [type, traits]}
        <div class="trait-section">
            <h4>{formatTraitType(type)}</h4>
            <div class="traits-grid">
                {#each traits as trait}
                    <div class="trait-card">
                        <h5>{trait.base_traits?.name}</h5>
                        <p class="description">{trait.base_traits?.description}</p>
                    </div>
                {/each}
            </div>
        </div>
    {/each}

    {#if Object.keys(traitsByType).length === 0}
        <p class="empty-state">No traits selected</p>
    {/if}
</div>

<style>
    .traits-component {
        padding: 1rem;
    }

    .trait-section {
        margin: 1rem 0;
    }

    .traits-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1rem;
        margin-top: 0.5rem;
    }

    .trait-card {
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 1rem;
    }

    .description {
        margin: 0.5rem 0;
        color: #666;
    }

    .empty-state {
        color: #666;
        font-style: italic;
        text-align: center;
        margin: 2rem 0;
    }

    h4 {
        margin-bottom: 0.5rem;
        color: #444;
    }

    h5 {
        margin: 0;
        color: #222;
    }
</style> 