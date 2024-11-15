<script lang="ts">
    import { character } from '$lib/state/character.svelte';
    import type { DatabaseCharacterClassFeature } from '$lib/types/character';

    interface TransformedFeature extends DatabaseCharacterClassFeature {
        displayName: string;
    }

    // Transform features for display
    let featuresList = $derived(
        (character.character_class_features ?? []).map((feature: DatabaseCharacterClassFeature): TransformedFeature => ({
            ...feature,
            displayName: feature.feature_name
                .replace(/([A-Z])/g, ' $1')
                .split(' ')
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')
        }))
    );

    // Group features by level
    let featuresByLevel = $derived(
        featuresList.reduce((acc: Record<number, TransformedFeature[]>, feature: TransformedFeature) => {
            if (!acc[feature.feature_level]) {
                acc[feature.feature_level] = [];
            }
            acc[feature.feature_level].push(feature);
            return acc;
        }, {})
    );
</script>

<div class="card">
    <h2 class="mb-4 font-bold">Class Features</h2>
    {#each Object.entries(featuresByLevel) as [level, features] (level)}
        {@const typedFeatures = features as TransformedFeature[]}
        <div class="mb-6 last:mb-0">
            <h3 class="mb-2 text-lg font-semibold text-primary">
                Level {level}
            </h3>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                {#each typedFeatures as feature (feature.feature_name)}
                    <div class="rounded bg-gray-50 p-3 hover:bg-gray-100">
                        <div class="font-medium">{feature.displayName}</div>
                        {#if feature.properties}
                            <div class="mt-1 text-sm text-gray-600">
                                {#each Object.entries(feature.properties ?? {}) as [key, value]}
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