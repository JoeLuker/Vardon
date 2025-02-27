<script lang="ts">
    import type { EnrichedCharacter } from '$lib/domain/characterCalculations';    
    import * as Card from '$lib/components/ui/card';
    import { Badge } from '$lib/components/ui/badge';
    import { ScrollArea } from '$lib/components/ui/scroll-area';
    import * as Dialog from '$lib/components/ui/dialog';
    
    let { character } = $props<{ character: EnrichedCharacter }>();
    
    // Helper function to safely access manifestation
    function getManifestationFromEntry(entry: any): any {
        return entry.manifestation;
    }
    
    // Function to check if a manifestation is available at the current manifestation level
    function isManifestationAvailable(manifestation: any, currentLevel: number): boolean {
        return manifestation?.min_manifestation_level <= currentLevel;
    }
    
    // Format description text with Gift and Stain sections
    function formatDescription(description: string | null): { gift: string, stain: string } {
        if (!description) return { gift: '', stain: '' };
        
        const giftMatch = description.match(/Gift:(.*?)(?=Stain:|$)/s);
        const stainMatch = description.match(/Stain:(.*?)$/s);
        
        return {
            gift: giftMatch ? giftMatch[1].trim() : '',
            stain: stainMatch ? stainMatch[1].trim() : ''
        };
    }
    
    // Process the data without using complex derived state
    function getCorruptionData() {
        const corruptions = character?.game_character_corruption || [];
        const manifestations = character?.game_character_corruption_manifestation || [];
        
        return corruptions.map((corruption: any) => {
            const corruptionInfo = corruption.corruption;
            const corruptionManifestations = manifestations.filter(
                (m: any) => {
                    // Access the corruption_id through a type-safe approach
                    const manifestationObj = m as unknown as { manifestation: { corruption_id: number } };
                    return manifestationObj.manifestation?.corruption_id === corruptionInfo.id;
                }
            );
            
            return {
                corruption: corruptionInfo,
                manifestations: corruptionManifestations
            };
        });
    }
    
    let corruptionData = $derived(getCorruptionData());
    let selectedManifestationDetail = $state<{
        name: string;
        label: string;
        description: string;
        gift: string;
        stain: string;
        active: boolean;
        min_level: number;
    } | null>(null);
    let dialogOpen = $state(false);
    
    function showManifestationDetail(manifestationEntry: any) {
        const manifestation = getManifestationFromEntry(manifestationEntry);
        const descriptionParts = formatDescription(manifestation?.description);
        
        selectedManifestationDetail = {
            name: manifestation?.name || '',
            label: manifestation?.label || manifestation?.name || 'Unknown Manifestation',
            description: manifestation?.description || '',
            gift: descriptionParts.gift,
            stain: descriptionParts.stain,
            active: manifestationEntry.active,
            min_level: manifestation?.min_manifestation_level || 1
        };
        
        dialogOpen = true;
    }
</script>

<Card.Root>
    <Card.Header>
        <Card.Title>Corruptions</Card.Title>
        <Card.Description>
            Corruptions and their manifestations that affect your character
        </Card.Description>
    </Card.Header>
    <Card.Content>
        {#if !character}
            <div class="rounded-md border border-muted p-4">
                <p class="text-muted-foreground">Loading corruptions...</p>
            </div>
        {:else if corruptionData.length === 0}
            <div class="rounded-md border border-muted p-4">
                <p class="text-muted-foreground">This character has no corruptions.</p>
            </div>
        {:else}
            <ScrollArea class="h-[calc(100vh-30rem)] min-h-[300px] max-h-[600px] pr-4">
                <div class="space-y-6">
                    {#each corruptionData as { corruption, manifestations }}
                        <div class="corruption-group">
                            <div class="flex items-center justify-between gap-4 mb-3">
                                <h3 class="text-base sm:text-lg font-semibold">
                                    {corruption.label || corruption.name}
                                </h3>
                                <div class="flex gap-2">
                                    <Badge variant="outline">Stage: {corruption.corruption_stage || 0}</Badge>
                                    <Badge>Level: {corruption.manifestation_level || 0}</Badge>
                                </div>
                            </div>
                            
                            {#if corruption.description}
                                <p class="text-sm text-muted-foreground mb-3">{corruption.description}</p>
                            {/if}
                            
                            {#if manifestations.length > 0}
                                <div class="grid gap-2 sm:gap-3 sm:grid-cols-1 md:grid-cols-2">
                                    {#each manifestations as manifestationEntry}
                                        {@const manifestation = getManifestationFromEntry(manifestationEntry)}
                                        {@const descriptionParts = formatDescription(manifestation?.description)}
                                        {@const available = isManifestationAvailable(manifestation, corruption.manifestation_level || 0)}
                                        
                                        <button 
                                            class="w-full text-left group"
                                            onclick={() => showManifestationDetail(manifestationEntry)}
                                        >
                                            <div class="rounded-lg border p-3 space-y-2 hover:bg-muted/50 transition-colors relative overflow-hidden"
                                                class:border-l-success={manifestationEntry.active}
                                                class:border-l-4={manifestationEntry.active}
                                                class:opacity-70={!available}>
                                                
                                                <div class="flex flex-wrap gap-2 items-center">
                                                    <h4 class="text-sm font-medium">
                                                        {manifestation?.label || manifestation?.name || 'Unknown Manifestation'}
                                                    </h4>
                                                    
                                                    <div class="flex gap-1 flex-wrap">
                                                        <Badge variant="outline" class="text-xs">
                                                            Min Level: {manifestation?.min_manifestation_level || 1}
                                                        </Badge>
                                                        
                                                        {#if !manifestationEntry.active}
                                                            <Badge variant="secondary" class="text-xs">Inactive</Badge>
                                                        {:else}
                                                            <Badge variant="default" class="text-xs">Active</Badge>
                                                        {/if}
                                                        
                                                        <!-- {#if !available}
                                                            <Badge variant="destructive" class="text-xs">Unavailable</Badge>
                                                        {/if} -->
                                                    </div>
                                                </div>
                                                
                                                {#if descriptionParts.gift || descriptionParts.stain}
                                                    <div class="text-xs text-muted-foreground line-clamp-2">
                                                        {#if descriptionParts.gift}
                                                            <span class="text-success">Gift:</span> {descriptionParts.gift}
                                                        {/if}
                                                        {#if descriptionParts.gift && descriptionParts.stain}
                                                            <br />
                                                        {/if}
                                                        {#if descriptionParts.stain}
                                                            <span class="text-destructive">Stain:</span> {descriptionParts.stain}
                                                        {/if}
                                                    </div>
                                                {/if}
                                            </div>
                                        </button>
                                    {/each}
                                </div>
                            {:else}
                                <div class="rounded-md border border-muted p-4">
                                    <p class="text-muted-foreground text-center text-sm">No manifestations selected.</p>
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            </ScrollArea>
        {/if}
    </Card.Content>
</Card.Root>

<!-- Manifestation Detail Dialog -->
<Dialog.Root bind:open={dialogOpen}>
    <Dialog.Portal>
        <Dialog.Overlay class="animate-in fade-in-0" />
        <Dialog.Content 
            class="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[95vw] max-w-lg rounded-lg border bg-background shadow-lg overflow-hidden"
        >
            {#if selectedManifestationDetail}
                <Dialog.Header class="border-b bg-background p-6">
                    <Dialog.Title class="text-xl font-semibold leading-none">
                        {selectedManifestationDetail.label}
                        {#if selectedManifestationDetail.active}
                            <Badge variant="default" class="ml-2">Active</Badge>
                        {:else}
                            <Badge variant="secondary" class="ml-2">Inactive</Badge>
                        {/if}
                    </Dialog.Title>
                    <Dialog.Description>
                        Minimum Level: {selectedManifestationDetail.min_level}
                    </Dialog.Description>
                </Dialog.Header>

                <div class="p-6 overflow-y-auto max-h-[60vh]">
                    <div class="prose prose-sm dark:prose-invert max-w-none space-y-4">
                        {#if selectedManifestationDetail.gift}
                            <div>
                                <h3 class="text-success text-base font-medium">Gift</h3>
                                <p class="whitespace-pre-wrap">{selectedManifestationDetail.gift}</p>
                            </div>
                        {/if}
                        
                        {#if selectedManifestationDetail.stain}
                            <div>
                                <h3 class="text-destructive text-base font-medium">Stain</h3>
                                <p class="whitespace-pre-wrap">{selectedManifestationDetail.stain}</p>
                            </div>
                        {/if}
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

<style lang="postcss">
    /* Using Tailwind CSS classes for styling */
</style>