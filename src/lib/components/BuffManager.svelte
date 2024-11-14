<!-- src/lib/components/BuffManager.svelte -->
<script lang="ts">
    import { character, toggleBuff } from '$lib/state/character.svelte';
    import { executeUpdate, type UpdateState } from '$lib/utils/updates';
    import type { AttributeKey, KnownBuffType } from '$lib/types/character';

    interface BuffEffect {
        attribute?: AttributeKey;
        modifier?: number;
        attack?: number;
        damage?: number;
        extraAttacks?: number;
        description?: string;
    }

    interface Buff {
        name: KnownBuffType;
        label: string;
        effects: BuffEffect[];
        conflicts: KnownBuffType[];
        description?: string;
    }

    let updateState = $state<UpdateState>({
        status: 'idle',
        error: null
    });

    const buffConfig = $state.raw<Buff[]>([
        {
            name: 'cognatogen',
            label: 'Intelligence Cognatogen',
            effects: [
                { attribute: 'int', modifier: 4, description: 'Intelligence +4' },
                { attribute: 'str', modifier: -2, description: 'Strength -2' }
            ],
            conflicts: ['dex_mutagen'],
            description: 'Enhances mental acuity at the cost of physical strength'
        },
        {
            name: 'dex_mutagen',
            label: 'Dexterity Mutagen',
            effects: [
                { attribute: 'dex', modifier: 4, description: 'Dexterity +4' },
                { attribute: 'wis', modifier: -2, description: 'Wisdom -2' }
            ],
            conflicts: ['cognatogen'],
            description: 'Enhances agility at the cost of perception'
        },
        {
            name: 'deadly_aim',
            label: 'Deadly Aim',
            effects: [
                { attack: -2, description: 'Attack -2' },
                { damage: 4, description: 'Damage +4' }
            ],
            conflicts: [],
            description: 'Trade accuracy for damage with ranged attacks'
        },
        {
            name: 'rapid_shot',
            label: 'Rapid Shot',
            effects: [
                { attack: -2, description: 'Attack -2' },
                { extraAttacks: 1, description: 'Extra Attack' }
            ],
            conflicts: [],
            description: 'Make an additional ranged attack at a penalty'
        },
        {
            name: 'two_weapon_fighting',
            label: 'Two-Weapon Fighting',
            effects: [
                { attack: -2, description: 'Attack -2' },
                { extraAttacks: 1, description: 'Extra Attack' }
            ],
            conflicts: [],
            description: 'Fight effectively with a weapon in each hand'
        }
    ]);

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

    function hasActiveConflict(buff: Buff): boolean {
        return !isBuffActive(buff.name) && buff.conflicts.some(c => isBuffActive(c));
    }

    async function handleBuffToggle(buffName: KnownBuffType) {
        const isCurrentlyActive = isBuffActive(buffName);
        const buff = buffConfig.find((b) => b.name === buffName);
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
        {#each buffConfig as buff (buff.name)}
            {@const isActive = isBuffActive(buff.name)}
            <button
                class="group relative overflow-hidden rounded-lg border-2 p-4 text-left 
                       transition-all duration-300 focus:outline-none focus:ring-2
                       {isActive 
                           ? 'border-primary bg-primary text-white' 
                           : 'border-primary/20 hover:border-primary/50'} 
                       {hasActiveConflict(buff) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-102'}"
                onclick={() => handleBuffToggle(buff.name)}
                disabled={updateState.status === 'syncing' || hasActiveConflict(buff)}
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