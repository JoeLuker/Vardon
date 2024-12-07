<!-- src/lib/components/BuffManager.svelte -->
<script lang="ts">
    import { getCharacter, toggleBuff } from '$lib/state/character.svelte';
    import { executeUpdate, type UpdateState } from '$lib/utils/updates';
    import { BUFF_CONFIG, doBuffsConflict } from '$lib/state/buffs.svelte';
    import type { KnownBuffType } from '$lib/types/character';

    let { characterId } = $props<{ characterId: number }>();

    let updateState = $state<UpdateState>({
        status: 'idle',
        error: null
    });

    // Get character and derive active buffs
    let character = $derived(getCharacter(characterId));
    let activeBuffs = $derived(() => {
        const buffs = new Set<KnownBuffType>();
        for (const buff of character.character_buffs ?? []) {
            if (buff.is_active && buff.buff_type) {
                buffs.add(buff.buff_type as KnownBuffType);
            }
        }
        return buffs;
    });

    // Helper functions with proper typing
    function isBuffActive(buffName: KnownBuffType): boolean {
        return activeBuffs().has(buffName);
    }

    function hasActiveConflict(buffName: KnownBuffType): boolean {
        return !isBuffActive(buffName) && 
            Array.from(activeBuffs()).some((active: KnownBuffType) => 
                doBuffsConflict(active, buffName)
            );
    }

    // Handle toggling buffs
    async function handleBuffToggle(buffName: KnownBuffType) {
        const isCurrentlyActive = isBuffActive(buffName);
        
        await executeUpdate({
            key: `buff-${character.id}-${buffName}`,
            status: updateState,
            operation: () => toggleBuff(character.id, buffName, !isCurrentlyActive),
            optimisticUpdate: () => {
                character.character_buffs = (character.character_buffs ?? [])
                    .map(buff => ({
                        ...buff,
                        is_active: buff.buff_type === buffName ? !isCurrentlyActive : buff.is_active
                    }));
            },
            rollback: () => {
                character.character_buffs = (character.character_buffs ?? [])
                    .map(buff => buff.buff_type === buffName 
                        ? { ...buff, is_active: isCurrentlyActive }
                        : buff
                    );
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
            {@const hasConflict = hasActiveConflict(buff.name as KnownBuffType)}
            
            <button
                class="group relative overflow-hidden rounded-lg border-2 p-4 text-left 
                       transition-all duration-300 focus:outline-none focus:ring-2
                       {isActive 
                           ? 'border-primary-300 bg-primary-300 text-white' 
                           : 'border-primary-300/20 hover:border-primary-300/50 bg-white'} 
                       {hasConflict ? 'opacity-50 cursor-not-allowed' : 'hover:scale-102'}"
                onclick={() => handleBuffToggle(buff.name as KnownBuffType)}
                disabled={updateState.status === 'syncing' || hasConflict}
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
                        {#if hasConflict}
                            <div class="mt-2 text-xs text-red-500">
                                Conflicts with active buff
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
