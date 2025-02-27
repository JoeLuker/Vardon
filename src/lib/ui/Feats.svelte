<script lang="ts">
    import type { EnrichedCharacter } from '$lib/domain/characterCalculations';
    import type { GameCharacterFeat, Feat } from '$lib/db/gameRules.types';
    import * as Card from '$lib/components/ui/card';
    import { Badge } from '$lib/components/ui/badge';
    import { ScrollArea } from '$lib/components/ui/scroll-area';
    import * as Dialog from '$lib/components/ui/dialog';
    
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
    
    // Selected feat for dialog
    let selectedFeat = $state<{
        label: string;
        description: string;
    } | null>(null);
    let dialogOpen = $state(false);
    
    function showFeatDetail(feat: Feat) {
        selectedFeat = {
            label: feat.label || feat.name || 'Unnamed Feat',
            description: feat.description || 'No description available'
        };
        dialogOpen = true;
    }
</script>

<Card.Root>
    <Card.Header>
        <Card.Title>Feats</Card.Title>
        <Card.Description>
            Special abilities and talents your character has acquired
        </Card.Description>
    </Card.Header>
    <Card.Content>
        {#if !character}
            <div class="rounded-md border border-muted p-4">
                <p class="text-muted-foreground">Loading feats...</p>
            </div>
        {:else if levels().length === 0}
            <div class="rounded-md border border-muted p-4">
                <p class="text-muted-foreground">No feats selected</p>
            </div>
        {:else}
            <ScrollArea class="h-[calc(100vh-30rem)] min-h-[300px] max-h-[600px] pr-4">
                <div class="space-y-6">
                    {#each levels() as level}
                        <div class="feat-level-group">
                            <h3 class="text-base sm:text-lg font-semibold mb-3">
                                Level {level}
                                <Badge variant="outline" class="ml-2 text-xs">
                                    {featsByLevel()[level].length} {featsByLevel()[level].length === 1 ? 'feat' : 'feats'}
                                </Badge>
                            </h3>
                            <div class="grid gap-2 sm:gap-3 sm:grid-cols-1 md:grid-cols-2">
                                {#each featsByLevel()[level] as feat}
                                    <button 
                                        class="w-full text-left group"
                                        onclick={() => showFeatDetail(feat)}
                                    >
                                        <div class="rounded-lg border p-3 space-y-2 hover:bg-muted/50 transition-colors">
                                            <h4 class="text-sm font-medium">{feat.label || feat.name}</h4>
                                            {#if feat.description}
                                                <p class="text-xs text-muted-foreground line-clamp-2">{feat.description}</p>
                                            {/if}
                                        </div>
                                    </button>
                                {/each}
                            </div>
                        </div>
                    {/each}
                </div>
            </ScrollArea>
        {/if}
    </Card.Content>
</Card.Root>

<!-- Feat Detail Dialog -->
<Dialog.Root bind:open={dialogOpen}>
    <Dialog.Portal>
        <Dialog.Overlay class="animate-in fade-in-0" />
        <Dialog.Content 
            class="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[95vw] max-w-lg rounded-lg border bg-background shadow-lg overflow-hidden"
        >
            {#if selectedFeat}
                <Dialog.Header class="border-b bg-background p-6">
                    <Dialog.Title class="text-xl font-semibold leading-none">
                        {selectedFeat.label}
                    </Dialog.Title>
                </Dialog.Header>

                <div class="p-6 overflow-y-auto max-h-[60vh]">
                    <div class="prose prose-sm dark:prose-invert max-w-none">
                        <p class="whitespace-pre-wrap">{selectedFeat.description}</p>
                    </div>
                </div>

                <div class="border-t bg-background p-4">
                    <Dialog.Close class="w-full h-10 inline-flex items-center justify-center rounded-md bg-primary font-medium text-primary-foreground hover:bg-primary/90">
                        Close
                    </Dialog.Close>
                </div>
            {/if}
        </Dialog.Content>
    </Dialog.Portal>
</Dialog.Root> 