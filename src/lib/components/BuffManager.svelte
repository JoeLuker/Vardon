<!-- src/lib/components/BuffManager.svelte -->
<script lang="ts">
    import { character, toggleBuff } from '$lib/state/character.svelte';
    import { executeUpdate, type UpdateState } from '$lib/utils/updates';
    import type { KnownBuffType } from '$lib/types/character';
    import type { Buff } from '$lib/types/buffs';
    import { BUFF_CONFIG } from '$lib/config/buffs';

    let updateState = $state<UpdateState>({
        status: 'idle',
        error: null
    });

    let activeBuffs = $derived(
        new Set(
            (character.character_buffs ?? [])
                .filter(b => b.is_active)
                .map(b => b.buff_type as KnownBuffType)
        )
    );

    function isBuffActive(buffName: KnownBuffType): boolean {
        return activeBuffs.has(buffName);
    }
    function hasActiveConflict(buff: Buff & { conflicts: KnownBuffType[], name: KnownBuffType }): boolean {
        return !isBuffActive(buff.name) && (buff.conflicts?.some((c: KnownBuffType) => isBuffActive(c)) ?? false);
    }

    async function handleBuffToggle(buffName: KnownBuffType) {
        const isCurrentlyActive = isBuffActive(buffName);
        const buff = BUFF_CONFIG.find((b) => b.name === buffName) as (Buff & { conflicts: KnownBuffType[], name: KnownBuffType });
        if (!buff) return;

        const previousBuffStates = new Map(
            character.character_buffs?.map(b => [b.buff_type, b.is_active]) ?? []
        );

        await executeUpdate({
            key: `buff-${character.id}-${buffName}`,
            status: updateState,
            operation: async () => {
                // Deactivate conflicting buffs first
                if (!isCurrentlyActive && buff.conflicts.length > 0) {
                    for (const conflict of buff.conflicts) {
                        if (isBuffActive(conflict)) {
                            await toggleBuff(conflict, false);
                        }
                    }
                }
                await toggleBuff(buffName, !isCurrentlyActive);
            },
            optimisticUpdate: () => {
                if (character.character_buffs) {
                    // Update the target buff
                    const targetBuff = character.character_buffs.find(
                        b => b.buff_type === buffName
                    );
                    if (targetBuff) {
                        targetBuff.is_active = !isCurrentlyActive;
                    }

                    // Update conflicting buffs
                    if (!isCurrentlyActive && buff.conflicts.length > 0) {
                        for (const conflict of buff.conflicts) {
                            const conflictBuff = character.character_buffs.find(
                                b => b.buff_type === conflict
                            );
                            if (conflictBuff?.is_active) {
                                conflictBuff.is_active = false;
                            }
                        }
                    }
                }
            },
            rollback: () => {
                if (character.character_buffs) {
                    character.character_buffs.forEach(buff => {
                        const previousState = previousBuffStates.get(buff.buff_type);
                        if (previousState !== undefined) {
                            buff.is_active = previousState;
                        }
                    });
                }
            }
        });
    }
</script>

<div class="card space-y-6">
    <div class="section-header">
        <h2>Active Effects</h2>
        {#if updateState.status === 'syncing'}
            <div class="text-sm text-ink-light">Updating...</div>
        {/if}
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {#each BUFF_CONFIG as buff (buff.name)}
            {@const isActive = isBuffActive(buff.name as KnownBuffType)}
            {@const buffWithConflicts = buff as Buff & { conflicts: KnownBuffType[], name: KnownBuffType }}
            <button
                class="group relative overflow-hidden rounded-lg border-2 p-4 text-left 
                       transition-all duration-300 focus:outline-none focus:ring-2
                       {isActive 
                           ? 'border-primary-300 bg-primary-300 text-white' 
                           : 'border-primary-300/20 hover:border-primary-300/50 bg-white'} 
                       {hasActiveConflict(buffWithConflicts) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-102'}"
                onclick={() => handleBuffToggle(buff.name as KnownBuffType)}
                disabled={updateState.status === 'syncing' || hasActiveConflict(buffWithConflicts)}
                aria-label="{isActive ? 'Deactivate' : 'Activate'} {buff.label}"
            >
                <div class="flex items-start gap-3">
                    <div class="flex-1">
                        <div class="font-bold">{buff.label}</div>
                        {#if buff.description}
                            <div class="mt-1 text-xs opacity-75">{buff.description}</div>
                        {/if}
                        {#if isActive && buff.effects.length > 0}
                            <div class="mt-3 space-y-1">
                                {#each buff.effects as effect}
                                    <div class="flex items-center gap-2 text-sm">
                                        <div class="rounded-full bg-white/20 px-2 py-0.5">
                                            {effect.description}
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                </div>
            </button>
        {/each}
    </div>

    {#if updateState.error}
        <div class="rounded-md bg-accent/10 p-4 text-sm text-accent">
            {updateState.error.message}
        </div>
    {/if}
</div>