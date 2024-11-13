<script lang="ts">
    import type { ConsumableKey } from '$lib/types/character';
    
    let { alchemist_fire, acid, tanglefoot, onUpdate } = $props<{
        alchemist_fire: number;
        acid: number;
        tanglefoot: number;
        onUpdate: (type: ConsumableKey, value: number) => Promise<void>;
    }>();

    let editingType = $state<ConsumableKey | null>(null);
    let inputValue = $state<number>(0);

    let consumables = $derived([
        { 
            type: 'alchemist_fire' as const,
            label: "Alchemist's Fire",
            value: alchemist_fire,
            effect: '1d6 fire + 1d6 for 2 rounds',
            maxStock: 10
        },
        { 
            type: 'acid' as const,
            label: 'Acid',
            value: acid,
            effect: '1d6 acid',
            maxStock: 10
        },
        { 
            type: 'tanglefoot' as const,
            label: 'Tanglefoot',
            value: tanglefoot,
            effect: 'Target is entangled (Reflex DC 15)',
            maxStock: 10
        }
    ]);

    function startEditing(type: ConsumableKey) {
        editingType = type;
        inputValue = type === 'alchemist_fire' ? alchemist_fire :
                    type === 'acid' ? acid : tanglefoot;
    }

    function handleQuickUpdate(type: ConsumableKey, amount: number) {
        const currentValue = type === 'alchemist_fire' ? alchemist_fire :
                           type === 'acid' ? acid : tanglefoot;
        const maxStock = 10; // Could be made configurable per type
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
            const currentValue = editingType === 'alchemist_fire' ? alchemist_fire :
                               editingType === 'acid' ? acid : tanglefoot;
            if (inputValue !== currentValue) {
                onUpdate(editingType, inputValue);
            }
        }
        editingType = null;
    }

    function focusInput(node: HTMLInputElement) {
        node.focus();
        node.select();
        return {};
    }

    function useConsumable(type: ConsumableKey) {
        handleQuickUpdate(type, -1);
    }
</script>

<div class="card">
    <h2 class="font-bold mb-4">Consumables</h2>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {#each consumables as { type, label, value, effect, maxStock }}
            <div class="bg-gray-50 rounded p-4 hover:bg-gray-100 transition-colors">
                <div class="flex justify-between items-center mb-2">
                    <label class="text-sm font-medium">{label}</label>
                    <div class="flex gap-1">
                        <button 
                            class="btn btn-secondary px-2 py-1 text-xs"
                            onclick={() => handleQuickUpdate(type, -1)}
                            disabled={value === 0}
                        >
                            -1
                        </button>
                        <button 
                            class="btn btn-secondary px-2 py-1 text-xs"
                            onclick={() => handleQuickUpdate(type, 1)}
                            disabled={value >= maxStock}
                        >
                            +1
                        </button>
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
                        />
                    {:else}
                        <button 
                            class="text-2xl font-bold hover:bg-gray-200 rounded px-2 py-1
                                   focus:outline-none focus:ring-2 focus:ring-primary/50
                                   min-w-[3rem] text-center"
                            onclick={() => startEditing(type)}
                        >
                            {value}
                        </button>
                    {/if}
                    <span class="text-sm text-gray-600">/ {maxStock}</span>
                </div>

                <p class="text-xs text-gray-600 mb-2">{effect}</p>

                <button 
                    class="w-full btn btn-secondary py-1 text-sm"
                    onclick={() => useConsumable(type)}
                    disabled={value === 0}
                >
                    Use {label}
                </button>
            </div>
        {/each}
    </div>
</div>