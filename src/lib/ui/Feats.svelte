<script lang="ts">
    import type { EnrichedCharacter } from '$lib/domain/characterCalculations';
    import type { GameCharacterFeat, Feat } from '$lib/db/gameRules.types';
    
    let { character } = $props<{ character: EnrichedCharacter }>();

    // Group feats by level
    let featsByLevel = $derived(() => {
        if (!character?.game_character_feat) return {};
        
        return character.game_character_feat.reduce((acc: Record<number, Feat[]>, featEntry: GameCharacterFeat & { feat: Feat }) => {
            const level = featEntry.level_obtained || 1;
            if (!acc[level]) {
                acc[level] = [];
            }
            acc[level].push(featEntry.feat);
            return acc;
        }, {});
    });

    // Get sorted levels
    let levels = $derived(() => {
        return Object.keys(featsByLevel())
            .map(Number)
            .sort((a, b) => a - b);
    });
</script>

<div class="space-y-4">
    <h3 class="text-lg font-semibold">Feats</h3>
    
    {#if levels().length === 0}
        <p class="text-muted-foreground text-sm">No feats selected</p>
    {:else}
        {#each levels() as level}
            <div class="space-y-2">
                <h4 class="text-sm font-medium">Level {level}</h4>
                <div class="grid gap-2 sm:grid-cols-2">
                    {#each featsByLevel()[level] as feat}
                        <div class="rounded-lg border p-3 space-y-1">
                            <div class="font-medium">{feat.label}</div>
                            {#if feat.description}
                                <p class="text-sm text-muted-foreground">{feat.description}</p>
                            {/if}
                        </div>
                    {/each}
                </div>
            </div>
        {/each}
    {/if}
</div> 