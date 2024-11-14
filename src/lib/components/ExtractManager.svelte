<script lang="ts">
    import { character, updateExtract } from '$lib/state/character.svelte';
    import { executeUpdate, type UpdateState } from '$lib/utils/updates';
    import type { CharacterExtract } from '$lib/types/character';

    let showPrepareModal = $state(false);
    let updateState = $state<UpdateState>({
        status: 'idle',
        error: null
    });

    // Derived calculations
    let intModifier = $derived(
        Math.floor(((character.character_attributes?.[0]?.int ?? 10) - 10) / 2)
    );

    let extractsPerDay = $derived({
        1: character.level >= 1 ? 1 + intModifier : 0,
        2: character.level >= 4 ? 1 + intModifier : 0,
        3: character.level >= 7 ? 1 + intModifier : 0,
        4: character.level >= 10 ? 1 + intModifier : 0,
        5: character.level >= 13 ? 1 + intModifier : 0,
        6: character.level >= 16 ? 1 + intModifier : 0
    } as const);

    let extractsByLevel = $derived(() => {
        const grouped: Record<number, CharacterExtract[]> = {};
        
        (character.character_extracts ?? []).forEach((extract: CharacterExtract) => {
            const level = extract.extract_level;
            if (!grouped[level]) {
                grouped[level] = [];
            }
            grouped[level].push(extract);
        });
        
        return grouped;
    });

    let usedSlotsByLevel = $derived(() => {
        const used: Record<number, number> = {};
        Object.entries(extractsByLevel()).forEach(([levelStr, extracts]) => {
            const level = Number(levelStr);
            used[level] = extracts.filter((extract: CharacterExtract) => extract.prepared > 0 && extract.used > 0).length;
        });
        return used;
    });

    async function handleExtractUse(extract: CharacterExtract) {
        if (!(extract.prepared > 0) || extract.used > 0) return;

        const previousState = extract.used;

        await executeUpdate({
            key: `extract-${character.id}-${extract.id}`,
            status: updateState,
            operation: () => updateExtract(extract.id, { used: 1 }),
            optimisticUpdate: () => {
                if (character.character_extracts) {
                    const target = character.character_extracts.find(e => e.id === extract.id);
                    if (target) {
                        target.used = 1;
                    }
                }
            },
            rollback: () => {
                if (character.character_extracts) {
                    const target = character.character_extracts.find(e => e.id === extract.id);
                    if (target) {
                        target.used = previousState;
                    }
                }
            }
        });
    }

    async function handleExtractPrepare(extract: CharacterExtract) {
        if (extract.prepared > 0) return;

        const level = extract.extract_level as keyof typeof extractsPerDay;
        const maxSlotsForLevel = extractsPerDay[level] ?? 0;
        const preparedCount = extractsByLevel()[level]?.filter(e => e.prepared > 0).length ?? 0;
        
        if (preparedCount >= maxSlotsForLevel) return;

        const previousState = extract.prepared;

        await executeUpdate({
            key: `extract-prepare-${character.id}-${extract.id}`,
            status: updateState,
            operation: () => updateExtract(extract.id, { prepared: 1, used: 0 }),
            optimisticUpdate: () => {
                if (character.character_extracts) {
                    const target = character.character_extracts.find(e => e.id === extract.id);
                    if (target) {
                        target.prepared = 1;
                        target.used = 0;
                    }
                }
            },
            rollback: () => {
                if (character.character_extracts) {
                    const target = character.character_extracts.find(e => e.id === extract.id);
                    if (target) {
                        target.prepared = previousState;
                    }
                }
            }
        });
    }

    function getExtractLevelDisplay(level: number): string {
        return level === 0 ? 'Cantrips' : `Level ${level}`;
    }
</script>

{#if updateState.error}
    <div class="rounded-md bg-accent/10 p-3 text-sm text-accent">
        Failed to update extract. Please try again.
    </div>
{/if}

<div class="card">
    <div class="mb-6 flex items-center justify-between">
        <h2 class="text-xl font-bold">Extracts</h2>
        <div class="flex items-center gap-2">
            <button 
                class="btn"
                onclick={() => showPrepareModal = true}
                disabled={updateState.status === 'syncing'}
            >
                Prepare Extracts
            </button>
            <div class="h-4 w-px bg-gray-300"></div>
            <button 
                class="text-sm text-primary hover:text-primary-dark"
                onclick={() => {/* Implement rest functionality */}}
                disabled={updateState.status === 'syncing'}
            >
                Rest
            </button>
        </div>
    </div>

    <div class="divide-y divide-gray-100">
        {#each Object.entries(extractsByLevel()) as [level, extracts] (level)}
            {@const levelNum = Number(level) as keyof typeof extractsPerDay}
            {@const maxSlots = extractsPerDay[levelNum] ?? 0}
            {@const usedSlots = usedSlotsByLevel()[levelNum] ?? 0}
            
            <div class="py-4 first:pt-0 last:pb-0">
                <div class="mb-4">
                    <h3 class="text-lg font-semibold text-primary">
                        {getExtractLevelDisplay(Number(level))}
                    </h3>
                    <div class="mt-1 text-sm text-gray-600">
                        {maxSlots - usedSlots} of {maxSlots} extracts remaining
                    </div>
                </div>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {#each extracts as extract (extract.id)}
                        <div class="group relative rounded-lg bg-white/50 p-3 shadow-sm 
                                  transition-all hover:bg-white/75">
                            <div class="flex items-start justify-between">
                                <div>
                                    <h4 class="font-medium">{extract.extract_name}</h4>
                                    <div class="flex gap-2 text-sm">
                                        {#if extract.prepared > 0}
                                            <span class="text-primary">
                                                {extract.used > 0 ? 'Used' : 'Prepared'}
                                            </span>
                                        {:else}
                                            <span class="text-gray-500">Not Prepared</span>
                                        {/if}
                                    </div>
                                </div>
                                <div class="flex gap-2">
                                    {#if extract.prepared > 0 && extract.used === 0}
                                        <button 
                                            class="opacity-0 transition-opacity group-hover:opacity-100"
                                            onclick={() => handleExtractUse(extract)}
                                            disabled={updateState.status === 'syncing'}
                                        >
                                            <span class="rounded-full bg-primary/10 p-1 text-primary 
                                                       hover:bg-primary/20">
                                                Use
                                            </span>
                                        </button>
                                    {:else if extract.prepared === 0}
                                        <button 
                                            class="opacity-0 transition-opacity group-hover:opacity-100"
                                            onclick={() => handleExtractPrepare(extract)}
                                            disabled={updateState.status === 'syncing'}
                                        >
                                            <span class="rounded-full bg-primary/10 p-1 text-primary 
                                                       hover:bg-primary/20">
                                                Prepare
                                            </span>
                                        </button>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {/each}
    </div>
</div>

<!-- Prepare Modal -->
{#if showPrepareModal}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        role="dialog"
        aria-labelledby="prepare-extracts-title"
    >
        <div class="card relative max-h-[90vh] w-full max-w-2xl overflow-auto">
            <h2 id="prepare-extracts-title" class="mb-4 text-xl font-bold">
                Prepare Extracts
            </h2>
            <!-- Add extract preparation UI here -->
            <div class="mt-4 flex justify-end gap-2">
                <button 
                    class="btn btn-secondary"
                    onclick={() => showPrepareModal = false}
                >
                    Cancel
                </button>
                <button 
                    class="btn"
                    disabled={updateState.status === 'syncing'}
                >
                    Prepare
                </button>
            </div>
        </div>
    </div>
{/if}
