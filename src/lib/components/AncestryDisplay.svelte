<script lang="ts">
    import { character } from '$lib/state/character.svelte';
    import type { DatabaseCharacterAncestry } from '$lib/types/character';

    // Get primary ancestry and its traits
    let primaryAncestry = $derived(
        character.character_ancestries?.find((a: DatabaseCharacterAncestry) => a.is_primary)
    );

    let ancestralTraits = $derived(
        character.character_ancestral_traits?.map((trait) => {
            const baseTraitData = (character as any).base_ancestral_traits?.find(
                (baseTrait: { id: number }) => baseTrait.id === trait.ancestral_trait_id
            );
            return { ...trait, ...baseTraitData };
        }).filter((trait) => trait.ancestry_id === primaryAncestry?.ancestry_id) ?? []
    );

    // Format ability modifiers for display
    function formatAbilityModifiers(modifiers: Record<string, number> | null): string {
        if (!modifiers) return '';
        
        return Object.entries(modifiers)
            .map(([ability, value]) => `${ability.toUpperCase()}: ${value >= 0 ? '+' : ''}${value}`)
            .join(', ');
    }
</script>

<div class="card">
    <h2 class="mb-2 font-bold">Ancestry</h2>
    
    {#if primaryAncestry?.ancestry}
        <div class="space-y-3">
            <div>
                <div class="text-lg font-medium text-primary">
                    {primaryAncestry.ancestry.name}
                </div>
                <div class="text-sm text-gray-600">
                    {primaryAncestry.ancestry.size} • Speed: {primaryAncestry.ancestry.base_speed}ft
                </div>
            </div>

            {#if primaryAncestry.ancestry.ability_modifiers}
                <div>
                    <div class="text-sm font-medium">Ability Modifiers</div>
                    <div class="text-sm text-gray-600">
                        {formatAbilityModifiers(primaryAncestry.ancestry.ability_modifiers)}
                    </div>
                </div>
            {/if}

            {#if primaryAncestry.ancestry.description}
                <div>
                    <div class="text-sm font-medium">Description</div>
                    <div class="text-sm text-gray-600">
                        {primaryAncestry.ancestry.description}
                    </div>
                </div>
            {/if}

            {#if ancestralTraits.length > 0}
                <div>
                    <div class="text-sm font-medium">Ancestral Traits</div>
                    <ul class="mt-1 space-y-2">
                        {#each ancestralTraits as trait}
                            <li class="text-sm">
                                <span class="font-medium">{trait.name}</span>
                                {#if trait.is_optional}
                                    <span class="text-gray-500 text-xs">(Optional)</span>
                                {/if}
                                {#if trait.description}
                                    <div class="text-gray-600">{trait.description}</div>
                                {/if}
                            </li>
                        {/each}
                    </ul>
                </div>
            {/if}
        </div>
    {:else}
        <div class="text-gray-500">No ancestry selected</div>
    {/if}
</div> 