<script lang="ts">
    import * as Card from '$lib/components/ui/card';
    import { Button } from '$lib/components/ui/button';
    import type { AssembledCharacter } from '$lib/ui/types/CharacterTypes';
    // Unix architecture imports
    import { OpenMode } from '$lib/domain/kernel/types';
    import type { GameKernel } from '$lib/domain/kernel/GameKernel';
    import type { Entity } from '$lib/domain/kernel/types';

    // Props
    let { character, kernel } = $props<{
        character?: AssembledCharacter;
        kernel?: GameKernel;
    }>();

    // State
    let combinedSlots = $state(new Map<number, { total: number; remaining: number }>());

    type SpellSlotData = {
        base: number;
        bonus: number;
        total: number;
    };

    // Function to get spell slots from the character entity
    async function getSpellSlots(characterId: number): Promise<Record<string, SpellSlotData>> {
        if (!kernel) return {};
        
        // Check if /proc directory exists and create if needed
        if (!kernel.exists('/proc')) {
            console.log('Creating /proc directory');
            const procResult = kernel.mkdir('/proc');
            if (!procResult.success) {
                console.error(`Failed to create /proc directory: ${procResult.errorMessage || 'unknown error'}`);
                return {};
            }
        }
        
        // Check if /proc/character directory exists and create if needed
        if (!kernel.exists('/proc/character')) {
            console.log('Creating /proc/character directory');
            const charDirResult = kernel.mkdir('/proc/character');
            if (!charDirResult.success) {
                console.error(`Failed to create /proc/character directory: ${charDirResult.errorMessage || 'unknown error'}`);
                return {};
            }
        }
        
        // Get the entity path
        const entityPath = `/proc/character/${characterId}`;
        
        if (!kernel.exists(entityPath)) {
            console.error(`Entity not found: ${entityPath}`);
            return {};
        }
        
        // Open the entity file
        const fd = kernel.open(entityPath, OpenMode.READ);
        
        if (fd < 0) {
            console.error(`Failed to open entity: ${entityPath}`);
            return {};
        }
        
        try {
            // Read the entity
            const entityBuffer: Entity = { id: entityPath, properties: {}, capabilities: {} };
            const [readResult] = kernel.read(fd, entityBuffer);
            
            if (readResult !== 0) {
                console.error(`Failed to read entity: ${readResult}`);
                return {};
            }
            
            // Get spell slots from the entity
            return entityBuffer.capabilities?.spellcasting?.spellSlots || {};
        } finally {
            // Always close the file
            kernel.close(fd);
        }
    }

    // Initialize spell slots when character changes
    $effect(() => {
        if (!character?.id || !kernel) return;
        
        // Self-executing async function
        (async () => {
            try {
                const spellSlots = await getSpellSlots(character.id);
                const newCombinedSlots = new Map<number, { total: number; remaining: number }>();
                
                // Process each spell slot level
                Object.entries(spellSlots).forEach((_classLevel) => {
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
                
                combinedSlots = newCombinedSlots;
            } catch (error) {
                console.error("Error loading spell slots:", error);
            }
        })();
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
        
        // Persist the change to the character entity
        updateSpellSlotInEntity(level, newRemaining);
    }
    
    // Update spell slot in the character entity
    async function updateSpellSlotInEntity(level: number, remaining: number) {
        if (!character?.id || !kernel) return;
        
        // Check if /proc directory exists and create if needed
        if (!kernel.exists('/proc')) {
            console.log('Creating /proc directory');
            const procResult = kernel.mkdir('/proc');
            if (!procResult.success) {
                console.error(`Failed to create /proc directory: ${procResult.errorMessage || 'unknown error'}`);
                return;
            }
        }
        
        // Check if /proc/character directory exists and create if needed
        if (!kernel.exists('/proc/character')) {
            console.log('Creating /proc/character directory');
            const charDirResult = kernel.mkdir('/proc/character');
            if (!charDirResult.success) {
                console.error(`Failed to create /proc/character directory: ${charDirResult.errorMessage || 'unknown error'}`);
                return;
            }
        }
        
        // Get the entity path
        const entityPath = `/proc/character/${character.id}`;
        
        if (!kernel.exists(entityPath)) {
            console.error(`Entity not found: ${entityPath}`);
            return;
        }
        
        // Open the entity file for reading and writing
        const fd = kernel.open(entityPath, OpenMode.READ_WRITE);
        
        if (fd < 0) {
            console.error(`Failed to open entity: ${entityPath}`);
            return;
        }
        
        try {
            // Read the entity
            const entityBuffer: Entity = { id: entityPath, properties: {}, capabilities: {} };
            const [readResult] = kernel.read(fd, entityBuffer);
            
            if (readResult !== 0) {
                console.error(`Failed to read entity: ${readResult}`);
                return;
            }
            
            // Update the spell slot remaining count
            if (!entityBuffer.properties) {
                entityBuffer.properties = {};
            }
            
            if (!entityBuffer.properties.spellSlotUsage) {
                entityBuffer.properties.spellSlotUsage = {};
            }
            
            entityBuffer.properties.spellSlotUsage[level] = remaining;
            
            // Write the updated entity
            const writeResult = kernel.write(fd, entityBuffer);
            
            if (writeResult !== 0) {
                console.error(`Failed to write entity: ${writeResult}`);
            }
        } finally {
            // Always close the file
            kernel.close(fd);
        }
    }
</script>

<Card.Root>
    <Card.Header>
        <Card.Title>Spell Slots</Card.Title>
    </Card.Header>
    <Card.Content>
        {#if !character?.spellSlots || !kernel}
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