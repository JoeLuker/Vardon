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
    let wildTalents = $derived(getWildTalents());
    let groupedTalents = $derived(groupWildTalentsByType());

    // Helper function to get wild talents
    function getWildTalents() {
        if (!character?.wildTalents) return [];
        return character.wildTalents;
    }
    
    // Helper function to group wild talents by type
    function groupWildTalentsByType() {
        if (!wildTalents.length) return new Map();
        
        const grouped = new Map<string, any[]>();
        
        for (const talent of wildTalents) {
            const typeKey = talent.type || 'other';
            if (!grouped.has(typeKey)) {
                grouped.set(typeKey, []);
            }
            grouped.get(typeKey)?.push(talent);
        }
        
        return grouped;
    }
</script>

<Card.Root>
    <Card.Header>
        <Card.Title>Wild Talents</Card.Title>
        <Card.Description>
            Kineticist powers and infusions
        </Card.Description>
    </Card.Header>
    <Card.Content>
        {#if !character}
            <div class="rounded-md border border-muted p-4">
                <p class="text-muted-foreground">Loading wild talents...</p>
            </div>
        {:else if !wildTalents || wildTalents.length === 0}
            <div class="rounded-md border border-muted p-4">
                <p class="text-muted-foreground">No wild talents selected.</p>
            </div>
        {:else}
            <div class="space-y-6">
                {#each [...groupedTalents.entries()] as [type, talents]}
                    <div>
                        <h3 class="text-lg font-semibold mb-2">
                            {talents[0].typeLabel || (type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' '))}
                        </h3>
                        <div class="space-y-3">
                            {#each talents as talent}
                                <div class="p-4 border rounded-md">
                                    <div class="flex items-center justify-between mb-2">
                                        <h4 class="font-medium">{talent.label || talent.name}</h4>
                                        <div class="flex gap-2">
                                            <Badge variant="secondary">Level {talent.levelObtained}</Badge>
                                            {#if talent.burn > 0}
                                                <Badge variant="destructive">Burn {talent.burn}</Badge>
                                            {/if}
                                        </div>
                                    </div>
                                    
                                    {#if talent.description}
                                        <p class="text-sm text-muted-foreground">{talent.description}</p>
                                    {/if}
                                    
                                    {#if talent.associatedBlasts || talent.savingThrow}
                                        <div class="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                                            {#if talent.associatedBlasts}
                                                <div>
                                                    <span class="font-semibold">Blasts:</span> {talent.associatedBlasts}
                                                </div>
                                            {/if}
                                            
                                            {#if talent.savingThrow && talent.savingThrow !== 'none'}
                                                <div>
                                                    <span class="font-semibold">Save:</span> {talent.savingThrow}
                                                </div>
                                            {/if}
                                        </div>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </Card.Content>
</Card.Root>