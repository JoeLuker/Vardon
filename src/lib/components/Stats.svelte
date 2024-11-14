<!-- src/lib/components/Stats.svelte -->
<script lang="ts">
    import { updateQueue } from '$lib/utils/updateQueue.svelte';
    import type { AttributeKey } from '$lib/types/character';
    import { character, updateAttribute } from '$lib/state/character.svelte';
    import { calculateCharacterStats } from '$lib/utils/characterCalculations';
    import { getABPBonuses } from '$lib/types/abp';

    let editingAttribute = $state<AttributeKey | null>(null);
    let inputValue = $state<number>(0);
    let status = $state<'idle' | 'syncing'>('idle');

    // Calculate all stats
    let stats = $derived(calculateCharacterStats(
        character,
        getABPBonuses(character.level)
    ));

    // Update the attributes list to access the correct property structure
    let attributesList = $derived([
        { 
            key: 'str' as const, 
            label: 'Strength', 
            value: {
                base: stats.attributes.base.str,
                permanent: stats.attributes.permanent.str,
                temporary: stats.attributes.temporary.str,
                modifier: {
                    permanent: stats.attributes.modifiers.permanent.str,
                    temporary: stats.attributes.modifiers.temporary.str
                }
            }
        },
        { 
            key: 'dex' as const, 
            label: 'Dexterity', 
            value: {
                base: stats.attributes.base.dex,
                permanent: stats.attributes.permanent.dex,
                temporary: stats.attributes.temporary.dex,
                modifier: {
                    permanent: stats.attributes.modifiers.permanent.dex,
                    temporary: stats.attributes.modifiers.temporary.dex
                }
            }
        },
        { 
            key: 'con' as const, 
            label: 'Constitution', 
            value: {
                base: stats.attributes.base.con,
                permanent: stats.attributes.permanent.con,
                temporary: stats.attributes.temporary.con,
                modifier: {
                    permanent: stats.attributes.modifiers.permanent.con,
                    temporary: stats.attributes.modifiers.temporary.con
                }
            }
        },
        { 
            key: 'int' as const, 
            label: 'Intelligence', 
            value: {
                base: stats.attributes.base.int,
                permanent: stats.attributes.permanent.int,
                temporary: stats.attributes.temporary.int,
                modifier: {
                    permanent: stats.attributes.modifiers.permanent.int,
                    temporary: stats.attributes.modifiers.temporary.int
                }
            }
        },
        { 
            key: 'wis' as const, 
            label: 'Wisdom', 
            value: {
                base: stats.attributes.base.wis,
                permanent: stats.attributes.permanent.wis,
                temporary: stats.attributes.temporary.wis,
                modifier: {
                    permanent: stats.attributes.modifiers.permanent.wis,
                    temporary: stats.attributes.modifiers.temporary.wis
                }
            }
        },
        { 
            key: 'cha' as const, 
            label: 'Charisma', 
            value: {
                base: stats.attributes.base.cha,
                permanent: stats.attributes.permanent.cha,
                temporary: stats.attributes.temporary.cha,
                modifier: {
                    permanent: stats.attributes.modifiers.permanent.cha,
                    temporary: stats.attributes.modifiers.temporary.cha
                }
            }
        }
    ]);

    function startEditing(attr: AttributeKey) {
        editingAttribute = attr;
        inputValue = stats.attributes.base[attr];
    }

    async function handleQuickUpdate(attr: AttributeKey, amount: number) {
        const newValue = Math.max(1, Math.min(30, stats.attributes.base[attr] + amount));
        if (newValue === stats.attributes.base[attr]) return;

        const previousValue = stats.attributes.base[attr];

        await updateQueue.enqueue({
            key: `attribute-${character.id}-${attr}`,
            execute: async () => {
                status = 'syncing';
                await updateAttribute(attr, newValue);
                status = 'idle';
            },
            optimisticUpdate: () => {
                if (character.character_attributes?.[0]) {
                    character.character_attributes[0][attr] = newValue;
                }
            },
            rollback: () => {
                if (character.character_attributes?.[0]) {
                    character.character_attributes[0][attr] = previousValue;
                }
            }
        });
    }

    function handleInputChange(value: string) {
        const parsed = parseInt(value) || 0;
        inputValue = Math.max(1, Math.min(30, parsed));
    }

    async function handleInputBlur() {
        if (!editingAttribute || inputValue === stats.attributes.base[editingAttribute]) {
            editingAttribute = null;
            return;
        }

        const attr = editingAttribute;
        const previousValue = stats.attributes.base[attr];
        editingAttribute = null;

        await updateQueue.enqueue({
            key: `attribute-${character.id}-${attr}`,
            execute: async () => {
                status = 'syncing';
                await updateAttribute(attr, inputValue);
                status = 'idle';
            },
            optimisticUpdate: () => {
                if (character.character_attributes?.[0]) {
                    character.character_attributes[0][attr] = inputValue;
                }
            },
            rollback: () => {
                if (character.character_attributes?.[0]) {
                    character.character_attributes[0][attr] = previousValue;
                }
            }
        });
    }

    function formatModifier(num: number): string {
        return num >= 0 ? `+${num}` : num.toString();
    }

    function focusInput(node: HTMLInputElement) {
        node.focus();
        node.select();
        return {};
    }
</script>

<section class="card">
    <h2 class="mb-4 text-xl font-bold">Attributes</h2>

    <div class="grid grid-cols-2 gap-4 md:grid-cols-3">
        {#each attributesList as { key, label, value }}
            <div class="rounded bg-gray-50 p-4 transition-colors hover:bg-gray-100">
                <div class="mb-2 flex items-center justify-between">
                    <label for={`${key}-input`} class="text-sm font-medium text-gray-700">
                        {label}
                    </label>
                    <div class="flex gap-1">
                        <button
                            class="btn btn-secondary px-2 py-1 text-xs"
                            onclick={() => handleQuickUpdate(key, -1)}
                            disabled={value.base <= 1 || status === 'syncing'}
                        >
                            -1
                        </button>
                        <button
                            class="btn btn-secondary px-2 py-1 text-xs"
                            onclick={() => handleQuickUpdate(key, 1)}
                            disabled={value.base >= 30 || status === 'syncing'}
                        >
                            +1
                        </button>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    {#if editingAttribute === key}
                        <input
                            id={`${key}-input`}
                            type="number"
                            class="input w-20 text-center"
                            value={inputValue}
                            min="1"
                            max="30"
                            oninput={(e) => handleInputChange(e.currentTarget.value)}
                            onblur={handleInputBlur}
                            use:focusInput
                        />
                    {:else}
                        <div class="flex items-center gap-2">
                            <button
                                class="min-w-[3rem] rounded px-2 py-1 text-center text-2xl font-bold hover:bg-gray-200
                                       focus:outline-none focus:ring-2 focus:ring-primary/50"
                                onclick={() => startEditing(key)}
                                disabled={status === 'syncing'}
                            >
                                {value.base}
                            </button>
                            {#if value.permanent !== value.base}
                                <span class="text-sm text-primary">
                                    → {value.permanent}
                                </span>
                            {/if}
                            {#if value.temporary !== value.permanent}
                                <span class="text-sm text-gray-500">
                                    → {value.temporary}
                                </span>
                            {/if}
                        </div>
                    {/if}
                    <span class="min-w-[3rem] text-lg text-gray-600">
                        {formatModifier(value.modifier.temporary)}
                        {#if value.modifier.temporary !== value.modifier.permanent}
                            <span class="text-xs text-gray-500">
                                ({formatModifier(value.modifier.permanent)} base)
                            </span>
                        {/if}
                    </span>
                </div>
            </div>
        {/each}
    </div>
</section>