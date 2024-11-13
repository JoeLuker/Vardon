<script lang="ts">
    import type { AttributeKey, CharacterAttributes } from '$lib/types/character';

    let { attributes, onUpdateAttribute } = $props<{
        attributes: CharacterAttributes;
        onUpdateAttribute: (attr: AttributeKey, value: number) => Promise<void>;
    }>();
    
    let editingAttribute = $state<AttributeKey | null>(null);
    let inputValue = $state<number>(0);

    // Derived data
    let attributesList = $derived([
        { key: 'str' as const, label: 'Strength', value: attributes.str },
        { key: 'dex' as const, label: 'Dexterity', value: attributes.dex },
        { key: 'con' as const, label: 'Constitution', value: attributes.con },
        { key: 'int' as const, label: 'Intelligence', value: attributes.int },
        { key: 'wis' as const, label: 'Wisdom', value: attributes.wis },
        { key: 'cha' as const, label: 'Charisma', value: attributes.cha }
    ]);

    let modifiers = $derived(
        attributesList.reduce((acc, { key, value }) => ({
            ...acc,
            [key]: Math.floor((value - 10) / 2)
        }), {} as Record<AttributeKey, number>)
    );

    function startEditing(attr: AttributeKey) {
        editingAttribute = attr;
        inputValue = attributes[attr];
    }

    function handleQuickUpdate(attr: AttributeKey, amount: number) {
        const newValue = Math.max(1, Math.min(30, attributes[attr] + amount));
        if (newValue !== attributes[attr]) {
            onUpdateAttribute(attr, newValue);
        }
    }

    function handleInputChange(value: string) {
        const parsed = parseInt(value) || 0;
        inputValue = Math.max(1, Math.min(30, parsed));
    }

    function handleInputBlur() {
        if (editingAttribute && inputValue !== attributes[editingAttribute]) {
            onUpdateAttribute(editingAttribute, inputValue);
        }
        editingAttribute = null;
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
    <h2 class="text-xl font-bold mb-4">Attributes</h2>

    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        {#each attributesList as { key, label, value }}
            <div class="p-4 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                <div class="flex justify-between items-center mb-2">
                    <label class="text-sm font-medium text-gray-700">
                        {label}
                    </label>
                    <div class="flex gap-1">
                        <button 
                            class="btn btn-secondary px-2 py-1 text-xs"
                            onclick={() => handleQuickUpdate(key, -1)}
                            disabled={value <= 1}
                        >
                            -1
                        </button>
                        <button 
                            class="btn btn-secondary px-2 py-1 text-xs"
                            onclick={() => handleQuickUpdate(key, 1)}
                            disabled={value >= 30}
                        >
                            +1
                        </button>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    {#if editingAttribute === key}
                        <input
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
                        <button 
                            class="text-2xl font-bold hover:bg-gray-200 rounded px-2 py-1
                                   focus:outline-none focus:ring-2 focus:ring-primary/50
                                   min-w-[3rem] text-center"
                            onclick={() => startEditing(key)}
                        >
                            {value}
                        </button>
                    {/if}
                    <span class="text-lg text-gray-600 min-w-[3rem]">
                        {formatModifier(modifiers[key])}
                    </span>
                </div>
            </div>
        {/each}
    </div>
</section>