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
    let archetypes = $derived(getArchetypes());

    // Helper function to get archetypes
    function getArchetypes() {
        if (!character?.archetypes) return [];
        return character.archetypes;
    }
    
    // Helper function to get the class associated with the archetype
    function getArchetypeClass(archetype: any) {
        // Look through character's classes for matching archetype features
        if (character?.game_character_class) {
            for (const charClass of character.game_character_class) {
                if (charClass.class?.class_feature?.some(
                    feature => feature.is_archetype && feature.archetype_id === archetype.id
                )) {
                    return charClass.class.name;
                }
            }
        }
        
        // Look at direct archetype relationships
        if (character?.game_character_archetype) {
            const archetypeClass = character.game_character_archetype.find(
                a => a.archetype_id === archetype.id
            )?.class;
            
            if (archetypeClass) {
                return archetypeClass.name;
            }
        }
        
        return "Unknown Class";
    }
</script>

<Card.Root>
    <Card.Header>
        <Card.Title>Archetypes</Card.Title>
        <Card.Description>
            Class customization with specialized options
        </Card.Description>
    </Card.Header>
    <Card.Content>
        {#if !character}
            <div class="rounded-md border border-muted p-4">
                <p class="text-muted-foreground">Loading archetypes...</p>
            </div>
        {:else if !archetypes || archetypes.length === 0}
            <div class="rounded-md border border-muted p-4">
                <p class="text-muted-foreground">No archetypes selected.</p>
            </div>
        {:else}
            <div class="space-y-4">
                {#each archetypes as archetype}
                    <div class="p-4 border rounded-md">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="font-medium text-lg">{archetype.label || archetype.name}</h3>
                            <Badge variant="secondary">{getArchetypeClass(archetype)}</Badge>
                        </div>
                        
                        {#if archetype.description}
                            <p class="text-sm text-muted-foreground">{archetype.description}</p>
                        {/if}
                        
                        {#if character.archetypeFeatures?.length}
                            <h4 class="font-medium mt-3 mb-2">Features</h4>
                            <ul class="pl-5 list-disc space-y-1 text-sm">
                                {#each character.archetypeFeatures.filter(f => f.id.includes(archetype.name.toLowerCase())) as feature}
                                    <li>
                                        <span class="font-medium">{feature.name}</span>
                                        {#if feature.description}
                                            <p class="text-xs text-muted-foreground">{feature.description}</p>
                                        {/if}
                                    </li>
                                {/each}
                            </ul>
                        {/if}
                    </div>
                {/each}
            </div>
        {/if}
    </Card.Content>
</Card.Root>
