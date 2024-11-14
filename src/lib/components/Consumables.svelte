<!-- src/lib/components/Consumables.svelte -->
<script lang="ts">
    import { updateQueue } from '$lib/utils/updateQueue.svelte';
    import type { ConsumableKey } from '$lib/types/character';
    import { character, updateConsumable } from '$lib/state/character.svelte';

    let editingType = $state<ConsumableKey | null>(null);
    let inputValue = $state<number>(0);

    // Get consumables from shared state
    let consumableValues = $derived({
        alchemist_fire: character.character_consumables?.[0]?.alchemist_fire ?? 0,
        acid: character.character_consumables?.[0]?.acid ?? 0,
        tanglefoot: character.character_consumables?.[0]?.tanglefoot ?? 0
    });

    // Configuration for all consumables
    const consumableConfig = $state([
        {
            type: 'alchemist_fire' as const,
            label: "Alchemist's Fire",
            effect: '1d6 fire + 1d6 for 2 rounds',
            maxStock: 10
        },
        {
            type: 'acid' as const,
            label: 'Acid',
            effect: '1d6 acid',
            maxStock: 10
        },
        {
            type: 'tanglefoot' as const,
            label: 'Tanglefoot',
            effect: 'Target is entangled (Reflex DC 15)',
            maxStock: 10
        }
    ]);

    // Derived consumable data with current values
    let consumables = $derived(
        consumableConfig.map((config) => ({
            ...config,
            value: consumableValues[config.type]
        }))
    );

    function startEditing(type: ConsumableKey) {
        editingType = type;
        inputValue = consumableValues[type];
    }

    async function handleQuickUpdate(type: ConsumableKey, amount: number) {
        const config = consumableConfig.find((c) => c.type === type);
        if (!config) return;

        const currentValue = consumableValues[type];
        const newValue = Math.max(0, Math.min(config.maxStock, currentValue + amount));
        if (newValue === currentValue) return;

        await updateQueue.enqueue({
            key: `consumable-${character.id}-${type}`,
            execute: async () => {
                status = 'syncing';
                await updateConsumable(type, newValue);
                status = 'idle';
            },
            optimisticUpdate: () => {
                // State update handled in shared state
            },
            rollback: () => {
                // State rollback handled in shared state
            }
        });
    }

    function handleInputChange(value: string) {
        const parsed = parseInt(value) || 0;
        inputValue = Math.max(0, Math.min(10, parsed));
    }

    async function handleInputBlur() {
        if (!editingType) return;

        const config = consumableConfig.find((c) => c.type === editingType);
        if (!config || inputValue === consumableValues[editingType]) {
            editingType = null;
            return;
        }

        const type = editingType;
        editingType = null;

        await updateQueue.enqueue({
            key: `consumable-${character.id}-${type}`,
            execute: async () => {
                status = 'syncing';
                await updateConsumable(type, inputValue);
                status = 'idle';
            },
            optimisticUpdate: () => {
                // State update handled in shared state
            },
            rollback: () => {
                // State rollback handled in shared state
            }
        });
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
    <h2 class="mb-4 font-bold">Consumables</h2>
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {#each consumables as { type, label, value, effect, maxStock }}
            <div
                class="rounded bg-gray-50 p-4 transition-colors hover:bg-gray-100"
                role="group"
                aria-labelledby={`${type}-label`}
            >
                <div class="mb-2 flex items-center justify-between">
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

                <div class="mb-2 flex items-center gap-2">
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
                            class="min-w-[3rem] rounded px-2 py-1 text-center text-2xl font-bold hover:bg-gray-200
                                   focus:outline-none focus:ring-2 focus:ring-primary/50"
                            onclick={() => startEditing(type)}
                            aria-label={`Edit ${label} quantity`}
                        >
                            {value}
                        </button>
                    {/if}
                    <span class="text-sm text-gray-600" aria-label="Maximum quantity"> / {maxStock} </span>
                </div>

                <p class="mb-2 text-xs text-gray-600" role="note">
                    {effect}
                </p>

                <button
                    class="btn btn-secondary w-full py-1 text-sm"
                    onclick={() => handleQuickUpdate(type, -1)}
                    disabled={value === 0}
                >
                    Use {label}
                </button>
            </div>
        {/each}
    </div>
</div>