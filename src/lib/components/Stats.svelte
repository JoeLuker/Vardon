<!-- src/lib/components/Stats.svelte -->
<script lang="ts">
    import { updateQueue } from '$lib/utils/updateQueue.svelte';
    import type { AttributeKey, CharacterBuff } from '$lib/types/character';

    let { characterId, str = $bindable(0), dex = $bindable(0), con = $bindable(0), int = $bindable(0), wis = $bindable(0), cha = $bindable(0), activeBuffs, onUpdateAttribute } = $props<{
        characterId: number;
        str: number;
        dex: number;
        con: number;
        int: number;
        wis: number;
        cha: number;
        activeBuffs: CharacterBuff[];
        onUpdateAttribute: (attr: AttributeKey, value: number) => Promise<void>;
    }>();

    let editingAttribute = $state<AttributeKey | null>(null);
    let inputValue = $state<number>(0);

    // Add local state for attributes
    let localAttributes = $state({
        str: str,
        dex: dex,
        con: con,
        int: int,
        wis: wis,
        cha: cha
    });

    // Update the effect to sync with prop changes
    $effect(() => {
        localAttributes = {
            str: str,
            dex: dex,
            con: con,
            int: int,
            wis: wis,
            cha: cha
        };
    });

    // Calculate modified attributes based on active buffs
    let modifiedAttributes = $derived.by(() => {
        const mods: Record<AttributeKey, number> = {
            str: 0,
            dex: 0,
            con: 0,
            int: 0,
            wis: 0,
            cha: 0
        };

        // Apply buff modifiers
        activeBuffs.forEach((buff: CharacterBuff) => {
            if (!buff.is_active) return;

            switch (buff.buff_type) {
                case 'cognatogen':
                    mods.int += 4;
                    mods.str -= 2;
                    break;
                case 'dex_mutagen':
                    mods.dex += 4;
                    mods.wis -= 2;
                    break;
            }
        });

        // Apply modifiers to base attributes
        return {
            str: localAttributes.str + mods.str,
            dex: localAttributes.dex + mods.dex,
            con: localAttributes.con + mods.con,
            int: localAttributes.int + mods.int,
            wis: localAttributes.wis + mods.wis,
            cha: localAttributes.cha + mods.cha
        };
    });

    let attributesList = $derived.by(() => [
        { key: 'str' as const, label: 'Strength', value: modifiedAttributes.str, base: localAttributes.str },
        { key: 'dex' as const, label: 'Dexterity', value: modifiedAttributes.dex, base: localAttributes.dex },
        { key: 'con' as const, label: 'Constitution', value: modifiedAttributes.con, base: localAttributes.con },
        { key: 'int' as const, label: 'Intelligence', value: modifiedAttributes.int, base: localAttributes.int },
        { key: 'wis' as const, label: 'Wisdom', value: modifiedAttributes.wis, base: localAttributes.wis },
        { key: 'cha' as const, label: 'Charisma', value: modifiedAttributes.cha, base: localAttributes.cha }
    ]);

    let modifiers = $derived.by(() =>
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
        inputValue = localAttributes[attr];
    }

    async function handleQuickUpdate(attr: AttributeKey, amount: number) {
        const newValue = Math.max(1, Math.min(30, localAttributes[attr] + amount));
        if (newValue === localAttributes[attr]) return;

        await updateQueue.enqueue({
            key: `attribute-${characterId}-${attr}`,
            execute: async () => {
                await onUpdateAttribute(attr, newValue);
            },
            optimisticUpdate: () => {
                localAttributes[attr] = newValue;
            },
            rollback: () => {
                localAttributes[attr] = {
                    str: str,
                    dex: dex,
                    con: con,
                    int: int,
                    wis: wis,
                    cha: cha
                }[attr];
            }
        });
    }

    function handleInputChange(value: string) {
        const parsed = parseInt(value) || 0;
        inputValue = Math.max(1, Math.min(30, parsed));
    }

    async function handleInputBlur() {
        if (!editingAttribute || inputValue === localAttributes[editingAttribute]) {
            editingAttribute = null;
            return;
        }

        const attr = editingAttribute;
        editingAttribute = null;

        await updateQueue.enqueue({
            key: `attribute-${characterId}-${attr}`,
            execute: async () => {
                await onUpdateAttribute(attr, inputValue);
            },
            optimisticUpdate: () => {
                localAttributes[attr] = inputValue;
            },
            rollback: () => {
                localAttributes[attr] = {
                    str: str,
                    dex: dex,
                    con: con,
                    int: int,
                    wis: wis,
                    cha: cha
                }[attr];
            }
        });
    }

    let formatModifier = $derived.by(() => (num: number): string => 
        num >= 0 ? `+${num}` : num.toString()
    );

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
                            disabled={base <= 1}
                        >
                            -1
                        </button>
                        <button
                            class="btn btn-secondary px-2 py-1 text-xs"
                            onclick={() => handleQuickUpdate(key, 1)}
                            disabled={base >= 30}
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