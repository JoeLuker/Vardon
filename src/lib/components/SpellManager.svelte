<script lang="ts">
    import { slide } from 'svelte/transition';
    import { getCharacter, updateSpellSlot } from '$lib/state/character.svelte';
    import { executeUpdate, type UpdateState } from '$lib/utils/updates';
    import type { DatabaseCharacterSpellSlot, DatabaseCharacterKnownSpell } from '$lib/types/character';
    import ResourceTracker from '$lib/components/ResourceTracker.svelte';

    let { characterId } = $props<{ characterId: number }>();
    let character = $derived(getCharacter(characterId) ?? {
        id: characterId,
        level: 0,
        character_spell_slots: [],
        character_known_spells: []
    });

    let updateState = $state<UpdateState>({
        status: 'idle',
        error: null
    });

    // Get and validate spell data
    let spellSlots = $derived(character.character_spell_slots ?? []);
    let knownSpells = $derived(character.character_known_spells ?? []);

    // Group spells by level for easier display
    let spellsByLevel = $derived(() => {
        const grouped: Record<number, DatabaseCharacterKnownSpell[]> = {};
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
        const grouped: Record<number, DatabaseCharacterSpellSlot> = {};
        for (const slot of spellSlots) {
            grouped[slot.spell_level] = slot;
        }
        return grouped;
    });

    // Get unique sorted levels combining both spells and slots
    let allLevels = $derived(
        [...new Set([
            ...Object.keys(spellsByLevel()).map(Number),
            ...Object.keys(slotsByLevel()).map(Number)
        ])].sort((a, b) => a - b)
    );

    async function handleSlotUpdate(level: number, remaining: number) {
        const slots = slotsByLevel()[level];
        if (!slots || remaining === slots.remaining) return;

        const previousRemaining = slots.remaining;

        await executeUpdate({
            key: `spell-slot-${character.id}-${level}`,
            status: updateState,
            operation: () => updateSpellSlot(character.id, level, remaining),
            optimisticUpdate: () => {
                if (character.character_spell_slots) {
                    const slot = character.character_spell_slots.find(
                        s => s.spell_level === level
                    );
                    if (slot) {
                        slot.remaining = remaining;
                    }
                }
            },
            rollback: () => {
                if (character.character_spell_slots) {
                    const slot = character.character_spell_slots.find(
                        s => s.spell_level === level
                    );
                    if (slot) {
                        slot.remaining = previousRemaining;
                    }
                }
            }
        });
    }

    function getSpellLevelDisplay(level: number): string {
        return level === 0 ? 'Cantrips' : `Level ${level} Spells`;
    }
</script>

<div class="card">
    <div class="mb-6 flex items-center justify-between">
        <h2 class="text-xl font-bold">Spells</h2>
        <div class="flex items-center gap-2">
            <button 
                class="text-sm text-primary hover:text-primary-dark"
                disabled={updateState.status === 'syncing'}
            >
                Prepare Spells
            </button>
            <div class="h-4 w-px bg-gray-300"></div>
            <button 
                class="text-sm text-primary hover:text-primary-dark"
                disabled={updateState.status === 'syncing'}
            >
                Rest
            </button>
        </div>
    </div>

    {#if updateState.error}
        <div class="mb-4 rounded bg-red-100 p-2 text-sm text-red-700">
            {updateState.error}
        </div>
    {/if}

    <div class="divide-y divide-gray-100">
        {#each allLevels as level (level)}
            {@const spells = spellsByLevel()[level] || []}
            {@const slots = slotsByLevel()[level]}
            <div class="py-4 first:pt-0 last:pb-0">
                <div class="mb-4">
                    <h3 class="text-lg font-semibold text-primary">
                        {getSpellLevelDisplay(level)}
                    </h3>
                    {#if slots}
                        <div class="mt-2 flex flex-wrap gap-2" 
                             transition:slide|local={{ duration: 200 }}>
                            <ResourceTracker
                                label=""
                                total={slots.total}
                                used={slots.total - slots.remaining}
                                onToggle={(remaining) => handleSlotUpdate(level, remaining)}
                            />
                            <span class="ml-2 text-sm text-gray-600">
                                {slots.remaining}/{slots.total} remaining
                            </span>
                        </div>
                    {/if}
                </div>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {#each spells as spell (spell.spell_name)}
                        <div class="group relative rounded-lg bg-white/50 p-3 shadow-sm 
                                  transition-all hover:bg-white/75">
                            <div class="flex items-start justify-between">
                                <div>
                                    <h4 class="font-medium">{spell.spell_name}</h4>
                                    <p class="text-sm text-gray-600">School • Action</p>
                                </div>
                                <button 
                                    class="opacity-0 transition-opacity group-hover:opacity-100"
                                    disabled={updateState.status === 'syncing'}
                                    aria-label="Cast spell"
                                >
                                    <span class="rounded-full bg-primary/10 p-1 text-primary 
                                               hover:bg-primary/20">
                                        Cast
                                    </span>
                                </button>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {/each}
    </div>
</div>