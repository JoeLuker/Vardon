<script lang="ts">
    import type { AssembledCharacter } from '$lib/ui/types/CharacterTypes';
    import * as Card from '$lib/components/ui/card';
    import { Badge } from '$lib/components/ui/badge';
    import { ScrollArea } from '$lib/components/ui/scroll-area';

    // Props
    let { character } = $props<{
        character?: AssembledCharacter | null;
    }>();

    // Computed properties
    let discoveries = $derived(getDiscoveries());

    // Helper function to get discoveries
    function getDiscoveries() {
        if (!character?.discoveries) return [];
        return character.discoveries;
    }
</script>

<Card.Root>
    <Card.Header>
        <Card.Title>Alchemist Discoveries</Card.Title>
        <Card.Description>
            Special abilities and techniques
        </Card.Description>
    </Card.Header>
    <Card.Content>
        {#if !character}
            <div class="rounded-md border border-muted p-4">
                <p class="text-muted-foreground">Loading discoveries...</p>
            </div>
        {:else if !discoveries || discoveries.length === 0}
            <div class="rounded-md border border-muted p-4">
                <p class="text-muted-foreground">No discoveries selected.</p>
            </div>
        {:else}
            <div class="space-y-4">
                {#each discoveries as discovery}
                    <div class="p-4 border rounded-md">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="font-medium text-lg">{discovery.label || discovery.name}</h3>
                            <Badge variant="secondary">Level {discovery.levelObtained}</Badge>
                        </div>
                        
                        {#if discovery.description}
                            <p class="text-sm text-muted-foreground">{discovery.description}</p>
                        {/if}
                    </div>
                {/each}
            </div>
        {/if}
    </Card.Content>
</Card.Root>