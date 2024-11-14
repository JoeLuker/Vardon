<!-- src/lib/components/Stats.svelte -->
<script lang="ts">
    import { updateQueue } from '$lib/utils/updateQueue.svelte';
    import type { AttributeKey } from '$lib/types/character';
    import { character, updateAttribute } from '$lib/state/character.svelte';

    let editingAttribute = $state<AttributeKey | null>(null);
    let inputValue = $state<number>(0);
    let status = $state<'idle' | 'syncing'>('idle');

    // Get base attributes from shared state
    let baseAttributes = $derived(character.character_attributes?.[0] ?? {
        str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10
    });

    // Calculate active buffs
    let activeBuffs = $derived(
        (character.character_buffs ?? [])
            .filter(b => b.is_active)
            .map(b => b.buff_type)
    );

    // Calculate modified attributes with buffs
    let modifiedAttributes = $derived(() => {
        const attrs = { ...baseAttributes };

        activeBuffs.forEach(buff => {
            switch (buff) {
                case 'cognatogen':
                    attrs.int += 4;
                    attrs.str -= 2;
                    break;
                case 'dex_mutagen':
                    attrs.dex += 4;
                    attrs.wis -= 2;
                    break;
            }
        });

        return attrs;
    });

    let attributesList = $derived([
        { key: 'str' as const, label: 'Strength', value: modifiedAttributes().str, base: baseAttributes.str },
        { key: 'dex' as const, label: 'Dexterity', value: modifiedAttributes().dex, base: baseAttributes.dex },
        { key: 'con' as const, label: 'Constitution', value: modifiedAttributes().con, base: baseAttributes.con },
        { key: 'int' as const, label: 'Intelligence', value: modifiedAttributes().int, base: baseAttributes.int },
        { key: 'wis' as const, label: 'Wisdom', value: modifiedAttributes().wis, base: baseAttributes.wis },
        { key: 'cha' as const, label: 'Charisma', value: modifiedAttributes().cha, base: baseAttributes.cha }
    ]);

    let modifiers = $derived(
        attributesList.reduce(
            (acc, { key, value }) => ({
                ...acc,
                [key]: Math.floor((value - 10) / 2)
            }),
            {} as Record<AttributeKey, number>
        )
    );

    function startEditing(attr: AttributeKey) {
        editingAttribute = attr;
        inputValue = baseAttributes[attr];
    }

    async function handleQuickUpdate(attr: AttributeKey, amount: number) {
        const newValue = Math.max(1, Math.min(30, baseAttributes[attr] + amount));
        if (newValue === baseAttributes[attr]) return;

        const previousValue = baseAttributes[attr];

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
        if (!editingAttribute || inputValue === baseAttributes[editingAttribute]) {
            editingAttribute = null;
            return;
        }

        const attr = editingAttribute;
        const previousValue = baseAttributes[attr];
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
        {#each attributesList as { key, label, value, base }}
            <div class="rounded bg-gray-50 p-4 transition-colors hover:bg-gray-100">
                <div class="mb-2 flex items-center justify-between">
                    <label for={`${key}-input`} class="text-sm font-medium text-gray-700">
                        {label}
                    </label>
                    <div class="flex gap-1">
                        <button
                            class="btn btn-secondary px-2 py-1 text-xs"
                            onclick={() => handleQuickUpdate(key, -1)}
                            disabled={base <= 1 || status === 'syncing'}
                        >
                            -1
                        </button>
                        <button
                            class="btn btn-secondary px-2 py-1 text-xs"
                            onclick={() => handleQuickUpdate(key, 1)}
                            disabled={base >= 30 || status === 'syncing'}
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
                                {base}
                            </button>
                            {#if value !== base}
                                <span class="text-sm text-gray-500">
                                    → {value}
                                </span>
                            {/if}
                        </div>
                    {/if}
                    <span class="min-w-[3rem] text-lg text-gray-600">
                        {formatModifier(modifiers[key])}
                    </span>
                </div>
            </div>
        {/each}
    </div>
</section>