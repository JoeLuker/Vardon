<script lang="ts">
    import { updateQueue } from '$lib/utils/updateQueue.svelte';
    import { character, updateSpellSlot } from '$lib/state/character.svelte';
    import type { SpellSlot, KnownSpell } from '$lib/types/character';
    import ResourceTracker from './ResourceTracker.svelte';


    // Type guard for spell slots
    function isValidSpellSlot(slot: SpellSlot | null): slot is SpellSlot {
        return (
            slot !== null &&
            typeof slot.character_id === 'number' &&
            typeof slot.spell_level === 'number' &&
            typeof slot.total === 'number' &&
            typeof slot.remaining === 'number'
        );
    }

    // Type guard for known spells
    function isValidKnownSpell(spell: KnownSpell | null): spell is KnownSpell {
        return (
            spell !== null &&
            typeof spell.character_id === 'number' &&
            typeof spell.spell_level === 'number' &&
            typeof spell.spell_name === 'string'
        );
    }

    // Filter and validate spell slots
    let spellSlots = $derived(
        (character.character_spell_slots?.filter(isValidSpellSlot) ?? [])
    );
    
    // Filter and validate known spells
    let knownSpells = $derived(
        (character.character_known_spells?.filter(isValidKnownSpell) ?? [])
    );

    // Group spells by level
    let spellsByLevel = $derived(() => {
        const grouped: Record<number, KnownSpell[]> = {};
        for (const spell of knownSpells) {
            const level = spell.spell_level;
            if (!grouped[level]) {
                grouped[level] = [];
            }
            grouped[level].push(spell);
        }
        return grouped;
    });

    // Transform slots for display
    let slotsByLevel = $derived(() => {
        const grouped: Record<number, SpellSlot> = {};
        for (const slot of spellSlots) {
            grouped[slot.spell_level] = slot;
        }
        return grouped;
    });

    async function handleSpellSlotToggle(level: number, used: number) {
        const slots = slotsByLevel();
        const slot = slots[level];
        if (!slot) return;

        const remaining = Math.max(0, slot.total - used);
        if (remaining === slot.remaining) return;

        await updateQueue.enqueue({
            key: `spell-slot-${character.id}-${level}`,
            execute: async () => {
                status = 'syncing';
                await updateSpellSlot(level, remaining);
                status = 'idle';
            },
            optimisticUpdate: () => {
                // State update handled in shared state
            },
            rollback: () => {
                // State rollback handled in shared state
            }
        });
    }

    // Format level string for display
    function getSpellLevelDisplay(level: number): string {
        return level === 0 ? 'Cantrips' : `Level ${level} Spells`;
    }
</script>

<div class="card">
    <h2 class="mb-4 font-bold">Spells</h2>
    {#each Object.entries(spellsByLevel()) as [levelStr, spells] (levelStr)}
        {#if spells.length > 0}
            {@const level = Number(levelStr)}
            {@const slots = slotsByLevel()}
            {@const slot = slots[level]}
            <div class="mb-6 last:mb-0">
                <div class="mb-2">
                    <h3 class="text-lg font-semibold text-primary">
                        {getSpellLevelDisplay(level)}
                    </h3>
                    {#if slot}
                        <ResourceTracker
                            label={`Level ${level} Slots`}
                            total={slot.total}
                            used={slot.total - slot.remaining}
                            onToggle={(used) => handleSpellSlotToggle(level, used)}
                        />
                    {/if}
                </div>
                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {#each spells as spell (spell.spell_name)}
                        <div class="rounded bg-gray-50 p-3 hover:bg-gray-100">
                            <div class="font-medium">{spell.spell_name}</div>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    {/each}
</div>