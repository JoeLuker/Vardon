<script lang="ts">
    import { character, toggleBuff } from '$lib/state/character.svelte';
    import { executeUpdate, type UpdateState } from '$lib/utils/updates';
    import type { AttributeKey } from '$lib/types/character';

    let updateState = $state<UpdateState>({
        status: 'idle',
        error: null
    });

    interface MutagenType {
        name: string;
        boost: AttributeKey;
        penalty: AttributeKey;
        buffType: 'str_mutagen' | 'dex_mutagen' | 'con_mutagen';
    }

    const mutagenTypes = $state.raw<MutagenType[]>([
        {
            name: 'Strength Mutagen',
            boost: 'str',
            penalty: 'int',
            buffType: 'str_mutagen'
        },
        {
            name: 'Dexterity Mutagen',
            boost: 'dex',
            penalty: 'wis',
            buffType: 'dex_mutagen'
        },
        {
            name: 'Constitution Mutagen',
            boost: 'con',
            penalty: 'cha',
            buffType: 'con_mutagen'
        }
    ]);

    let activeBuffs = $derived(
        new Set(
            (character.character_buffs ?? [])
                .filter(b => b.is_active)
                .map(b => b.buff_type)
        )
    );

    async function handleMutagenToggle(mutagen: MutagenType) {
        const isActive = activeBuffs.has(mutagen.buffType);
        const previousBuffs = new Map(
            character.character_buffs?.map(b => [b.buff_type, b.is_active]) ?? []
        );

        await executeUpdate({
            key: `mutagen-${character.id}-${mutagen.buffType}`,
            status: updateState,
            operation: async () => {
                // Deactivate other mutagens first
                for (const other of mutagenTypes) {
                    if (other.buffType !== mutagen.buffType && activeBuffs.has(other.buffType)) {
                        await toggleBuff(other.buffType, false);
                    }
                }
                await toggleBuff(mutagen.buffType, !isActive);
            },
            optimisticUpdate: () => {
                if (character.character_buffs) {
                    // Update the target buff
                    const targetBuff = character.character_buffs.find(
                        b => b.buff_type === mutagen.buffType
                    );
                    if (targetBuff) {
                        targetBuff.is_active = !isActive;
                    }

                    // Deactivate other mutagens
                    if (!isActive) {
                        character.character_buffs.forEach(buff => {
                            if (mutagenTypes.some(m => m.buffType === buff.buff_type 
                                && m.buffType !== mutagen.buffType)) {
                                buff.is_active = false;
                            }
                        });
                    }
                }
            },
            rollback: () => {
                if (character.character_buffs) {
                    character.character_buffs.forEach(buff => {
                        const previousState = previousBuffs.get(buff.buff_type);
                        if (previousState !== undefined) {
                            buff.is_active = previousState;
                        }
                    });
                }
            }
        });
    }
</script>

{#if updateState.error}
    <div class="rounded-md bg-accent/10 p-3 text-sm text-accent">
        Failed to toggle mutagen. Please try again.
    </div>
{/if}

<div class="card">
    <h2 class="mb-4 font-bold">Mutagen</h2>
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {#each mutagenTypes as mutagen}
            {@const isActive = activeBuffs.has(mutagen.buffType)}
            <button
                class="group w-full rounded-lg border-2 p-3 transition-all duration-200
                       focus:outline-none focus:ring-2 focus:ring-primary-300/50
                       {isActive
                    ? 'border-primary-300 bg-primary-300 text-white hover:bg-primary-400'
                    : 'border-primary-300 text-primary-300 hover:bg-primary-300/10'}"
                onclick={() => handleMutagenToggle(mutagen)}
                disabled={updateState.status === 'syncing'}
            >
                <div class="font-bold">{mutagen.name}</div>
                <div class="mt-2 space-y-1 text-sm">
                    <div>{mutagen.boost.toUpperCase()} +4</div>
                    <div>{mutagen.penalty.toUpperCase()} -2</div>
                </div>
            </button>
        {/each}
    </div>
</div>