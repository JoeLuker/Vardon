<script lang="ts">
    import * as Card from '$lib/components/ui/card';
    import { Button } from '$lib/components/ui/button';
    import type { AssembledCharacter } from '$lib/ui/types/CharacterTypes';

    // Props
    let { character } = $props<{
        character?: AssembledCharacter;
    }>();

    // State
    let combinedSlots = $state(new Map<number, { total: number; remaining: number }>());

    type SpellSlotData = {
        base: number;
        bonus: number;
        total: number;
    };

    // Initialize spell slots when character changes
    $effect(() => {
        // console.log('Character data:', character);
        // console.log('Character spell slots:', character?.spellSlots);
        
        // if (!character?.spellSlots) {
        //     console.log('No spell slots found');
        //     return;
        // }
        
        const newCombinedSlots = new Map<number, { total: number; remaining: number }>();
        
        // Process each spell slot level
        Object.entries(character.spellSlots).forEach((_classLevel) => {
            const levels = _classLevel[1] as Record<string, SpellSlotData>;
            Object.entries(levels).forEach(([spellLevel, slotData]) => {
                const level = parseInt(spellLevel);
                const existing = newCombinedSlots.get(level) || { total: 0, remaining: slotData.total };
                newCombinedSlots.set(level, {
                    total: slotData.total,
                    remaining: existing.remaining
                });
            });
        });
        
        // console.log('New combined slots:', newCombinedSlots);
        combinedSlots = newCombinedSlots;
    });

    // Helper function to get sorted spell levels
    function getSortedLevels() {
        return Array.from(combinedSlots.keys()).sort((a, b) => a - b);
    }

    // Update spell slot usage
    function updateSlot(level: number, increment: boolean) {
        const slot = combinedSlots.get(level);
        if (!slot) return;

        const newRemaining = increment 
            ? Math.min(slot.remaining + 1, slot.total)
            : Math.max(slot.remaining - 1, 0);

        combinedSlots.set(level, { ...slot, remaining: newRemaining });
        combinedSlots = new Map(combinedSlots); // Force reactivity update
    }
</script>

<Card.Root>
    <Card.Header>
        <Card.Title>Spell Slots</Card.Title>
    </Card.Header>
    <Card.Content>
        {#if !character?.spellSlots}
            <div class="text-sm text-muted-foreground">No spell slots available</div>
        {:else}
            <div class="grid gap-4">
                {#each getSortedLevels() as level}
                    {@const slot = combinedSlots.get(level)}
                    {#if slot && slot.total > 0}
                        <div class="flex items-center justify-between">
                            <div class="flex-1">
                                <div class="text-sm font-medium">
                                    Level {level === 0 ? 'Cantrips' : level}
                                </div>
                                <div class="text-sm text-muted-foreground">
                                    {slot.remaining} / {slot.total}
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <Button 
                                    variant="outline" 
                                    size="icon"
                                    disabled={slot.remaining <= 0}
                                    onclick={() => updateSlot(level, false)}
                                >
                                    -
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="icon"
                                    disabled={slot.remaining >= slot.total}
                                    onclick={() => updateSlot(level, true)}
                                >
                                    +
                                </Button>
                            </div>
                        </div>
                    {/if}
                {/each}
            </div>
        {/if}
    </Card.Content>
</Card.Root> 