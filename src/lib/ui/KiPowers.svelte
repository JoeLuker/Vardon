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
    let kiPowers = $derived(getKiPowers());
    let hasMonkClass = $derived(isMonk());

    // Helper function to get ki powers
    function getKiPowers() {
        if (!character?.kiPowers) return [];
        return character.kiPowers;
    }
    
    // Helper function to check if character is a monk
    function isMonk() {
        return character?.game_character_class?.some(
            gc => gc.class?.name?.toLowerCase().includes('monk')
        ) || false;
    }
    
    // Helper function to get monk level
    function getMonkLevel() {
        const monkClass = character?.game_character_class?.find(
            gc => gc.class?.name?.toLowerCase().includes('monk')
        );
        return monkClass?.level || 0;
    }
    
    // Helper function to get ki pool size
    function getKiPoolSize() {
        const monkLevel = getMonkLevel();
        const wisdomMod = character?.wisMod || 0;
        // Typically, ki pool is 1/2 monk level + wisdom modifier
        return Math.floor(monkLevel / 2) + wisdomMod;
    }
</script>

<Card.Root>
    <Card.Header>
        <Card.Title>Ki Powers</Card.Title>
        <Card.Description>
            Monk supernatural abilities
        </Card.Description>
    </Card.Header>
    <Card.Content>
        {#if !character}
            <div class="rounded-md border border-muted p-4">
                <p class="text-muted-foreground">Loading ki powers...</p>
            </div>
        {:else if !hasMonkClass}
            <div class="rounded-md border border-muted p-4">
                <p class="text-muted-foreground">Ki powers are only available to monks.</p>
            </div>
        {:else if !kiPowers || kiPowers.length === 0}
            <div class="rounded-md border border-muted p-4">
                <p class="text-muted-foreground">No ki powers available.</p>
            </div>
        {:else}
            <div class="mb-4 p-3 bg-muted rounded-md">
                <div class="flex justify-between items-center">
                    <h3 class="font-medium">Ki Pool</h3>
                    <Badge variant="secondary">{getKiPoolSize()} points</Badge>
                </div>
                <p class="text-sm text-muted-foreground mt-1">
                    Your ki pool allows you to activate various ki powers and abilities.
                </p>
            </div>
            
            <div class="space-y-3">
                {#each kiPowers as power}
                    <div class="p-4 border rounded-md">
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center gap-2">
                                <h4 class="font-medium">{power.label || power.name}</h4>
                                <Badge variant="outline">{power.type || 'Su'}</Badge>
                            </div>
                            {#if power.kiCost > 0}
                                <Badge>{power.kiCost} Ki</Badge>
                            {/if}
                        </div>
                        
                        {#if power.description}
                            <p class="text-sm text-muted-foreground">{power.description}</p>
                        {/if}
                        
                        <div class="flex items-center mt-2 text-xs text-muted-foreground">
                            <span>Min Level: {power.minLevel}</span>
                            {#if power.powerTypeLabel}
                                <span class="ml-3">{power.powerTypeLabel}</span>
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </Card.Content>
</Card.Root>