<script lang="ts">
    import type { ConsumableKey } from '$lib/types/character';
    
    let { 
        alchemist_fire = $bindable(0), 
        acid = $bindable(0), 
        tanglefoot = $bindable(0), 
        onUpdate 
    } = $props<{
        alchemist_fire: number;
        acid: number;
        tanglefoot: number;
        onUpdate: (type: ConsumableKey, value: number) => Promise<void>;
    }>();

    let editingType = $state<ConsumableKey | null>(null);
    let inputValue = $state<number>(0);

    // Configuration for all consumables
    const consumableConfig = $state.raw([
        { 
            type: 'alchemist_fire' as const,
            label: "Alchemist's Fire",
            getValue: () => alchemist_fire,
            effect: '1d6 fire + 1d6 for 2 rounds',
            maxStock: 10
        },
        { 
            type: 'acid' as const,
            label: 'Acid',
            getValue: () => acid,
            effect: '1d6 acid',
            maxStock: 10
        },
        { 
            type: 'tanglefoot' as const,
            label: 'Tanglefoot',
            getValue: () => tanglefoot,
            effect: 'Target is entangled (Reflex DC 15)',
            maxStock: 10
        }
    ]);

    // Derived consumable data with current values
    let consumables = $derived.by(() => 
        consumableConfig.map(config => ({
            ...config,
            value: config.getValue()
        }))
    );

    function startEditing(type: ConsumableKey) {
        editingType = type;
        const currentValue = type === 'alchemist_fire' ? alchemist_fire :
                           type === 'acid' ? acid : tanglefoot;
        inputValue = currentValue;
    }

    function getCurrentValue(type: ConsumableKey): number {
        return type === 'alchemist_fire' ? alchemist_fire :
               type === 'acid' ? acid : tanglefoot;
    }

    function handleQuickUpdate(type: ConsumableKey, amount: number) {
        const currentValue = getCurrentValue(type);
        const maxStock = 10;
        const newValue = Math.max(0, Math.min(maxStock, currentValue + amount));
        if (newValue !== currentValue) {
            onUpdate(type, newValue);
        }
    }

    function handleInputChange(value: string) {
        const parsed = parseInt(value) || 0;
        inputValue = Math.max(0, Math.min(10, parsed));
    }

    function handleInputBlur() {
        if (editingType) {
            const currentValue = getCurrentValue(editingType);
            if (inputValue !== currentValue) {
                onUpdate(editingType, inputValue);
            }
        }
        editingType = null;
    }

    function focusInput(node: HTMLInputElement) {
        node.focus();
        node.select();
        return {
            destroy: () => {}
        };
    }

    const quickActions = $state.raw([
        { amount: -1, label: '-1', getDisabled: (value: number) => value <= 0 },
        { amount: 1, label: '+1', getDisabled: (value: number) => value >= 10 }
    ]);
</script>

<div class="card">
    <h2 class="font-bold mb-4">Consumables</h2>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {#each consumables as { type, label, value, effect, maxStock }}
            <div class="bg-gray-50 rounded p-4 hover:bg-gray-100 transition-colors"
                 role="group"
                 aria-labelledby={`${type}-label`}>
                <div class="flex justify-between items-center mb-2">
                    <span id={`${type}-label`} class="text-sm font-medium">{label}</span>
                    <div class="flex gap-1">
                        {#each quickActions as { amount, label, getDisabled }}
                            <button 
                                class="btn btn-secondary px-2 py-1 text-xs"
                                onclick={() => handleQuickUpdate(type, amount)}
                                disabled={getDisabled(value)}
                                aria-label={`${label} ${label}`}
                            >
                                {label}
                            </button>
                        {/each}
                    </div>
                </div>

                <div class="flex items-center gap-2 mb-2">
                    {#if editingType === type}
                        <input
                            type="number"
                            class="input w-20 text-center"
                            value={inputValue}
                            min="0"
                            max={maxStock}
                            oninput={(e) => handleInputChange(e.currentTarget.value)}
                            onblur={handleInputBlur}
                            use:focusInput
                            aria-label={`Edit ${label} quantity`}
                        />
                    {:else}
                        <button 
                            class="text-2xl font-bold hover:bg-gray-200 rounded px-2 py-1
                                   focus:outline-none focus:ring-2 focus:ring-primary/50
                                   min-w-[3rem] text-center"
                            onclick={() => startEditing(type)}
                            aria-label={`Edit ${label} quantity`}
                        >
                            {value}
                        </button>
                    {/if}
                    <span class="text-sm text-gray-600" aria-label="Maximum quantity">
                        / {maxStock}
                    </span>
                </div>

                <p class="text-xs text-gray-600 mb-2" role="note">
                    {effect}
                </p>

                <button 
                    class="w-full btn btn-secondary py-1 text-sm"
                    onclick={() => handleQuickUpdate(type, -1)}
                    disabled={value === 0}
                >
                    Use {label}
                </button>
            </div>
        {/each}
    </div>
</div>