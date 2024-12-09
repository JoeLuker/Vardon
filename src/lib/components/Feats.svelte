<script lang="ts">
    import { getCharacter } from '$lib/state/character.svelte';
    import type { DatabaseCharacterFeat } from '$lib/types/character';

    let { characterId } = $props<{
        characterId: number;
    }>();

    let character = $derived(getCharacter(characterId));

    interface TransformedFeat extends DatabaseCharacterFeat {
        displayName: string;
    }

    // Transform feats for display
    let featsList = $derived(
        (character.character_feats ?? []).map((feat: DatabaseCharacterFeat): TransformedFeat => ({
            ...feat,
            displayName: feat.feat_name
                .replace(/([A-Z])/g, ' $1')
                .split(' ')
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')
        }))
    );

    // Group feats by type
    let featsByType = $derived(
        featsList.reduce((acc: Record<string, TransformedFeat[]>, feat: TransformedFeat) => {
            if (!acc[feat.feat_type]) {
                acc[feat.feat_type] = [];
            }
            acc[feat.feat_type].push(feat);
            return acc;
        }, {})
    );

    // Format type name for display
    function formatFeatType(type: string): string {
        return type.charAt(0).toUpperCase() + type.slice(1) + ' Feats';
    }
</script>

<div class="card">
    <h2 class="mb-2 font-bold">Feats</h2>
    {#each Object.entries(featsByType) as [type, typeFeats]}
        <div class="mb-4 last:mb-0">
            <h3 class="mb-1 text-base font-semibold text-primary">
                {formatFeatType(type)}
            </h3>
            <div class="grid grid-cols-1 gap-2 md:grid-cols-2">
                {#each typeFeats as feat (feat.feat_name)}
                    <div class="rounded bg-gray-50 p-2 hover:bg-gray-100">
                        <div class="font-medium leading-tight">{feat.displayName}</div>
                        <div class="text-xs text-gray-500">
                            Level {feat.selected_level}
                        </div>
                        {#if feat.properties}
                            <div class="text-xs text-gray-600">
                                {#each Object.entries(feat.properties) as [key, value]}
                                    <div>{key}: {value}</div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>
    {/each}
</div>