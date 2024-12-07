<script lang="ts">
    import type { ConsumableKey } from '$lib/types/character';
    import { getCharacter, updateConsumable } from '$lib/state/character.svelte';
    import { executeUpdate, type UpdateState } from '$lib/utils/updates';

    let { characterId } = $props<{ characterId: number; }>();

    let character = $derived(getCharacter(characterId));
    let editingType = $state<ConsumableKey | null>(null);
    let inputValue = $state(0);
    let updateState = $state<UpdateState>({
        status: 'idle',
        error: null
    });

    let consumableValues = $derived({
        alchemist_fire: character.character_consumables?.[0]?.alchemist_fire ?? 0,
        acid: character.character_consumables?.[0]?.acid ?? 0,
        tanglefoot: character.character_consumables?.[0]?.tanglefoot ?? 0
    });

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
        const currentValue = consumableValues[type];
        const newValue = Math.max(0, Math.min(10, currentValue + amount));
        if (newValue === currentValue) return;

        let previousValue = $state(currentValue);

        await executeUpdate({
            key: `consumable-${character.id}-${type}`,
            status: updateState,
            operation: () => updateConsumable(character.id, type, newValue),
            optimisticUpdate: () => {
                previousValue = currentValue;
                if (character.character_consumables?.[0]) {
                    character.character_consumables[0][type] = newValue;
                }
            },
            rollback: () => {
                if (character.character_consumables?.[0]) {
                    character.character_consumables[0][type] = previousValue;
                }
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
        let previousValue = $state(consumableValues[type]);
        editingType = null;

        await executeUpdate({
            key: `consumable-${character.id}-${type}`,
            status: updateState,
            operation: () => updateConsumable(character.id, type, inputValue),
            optimisticUpdate: () => {
                previousValue = consumableValues[type];
                if (character.character_consumables?.[0]) {
                    character.character_consumables[0][type] = inputValue;
                }
            },
            rollback: () => {
                if (character.character_consumables?.[0]) {
                    character.character_consumables[0][type] = previousValue;
                }
            }
        });
    }

    function focusInput(node: HTMLInputElement) {
        node.focus();
        node.select();
        return {};
    }

    const quickActions = $state.raw([
        { amount: -1, label: '-1', getDisabled: (value: number) => value <= 0 || updateState.status === 'syncing' },
        { amount: 1, label: '+1', getDisabled: (value: number) => value >= 10 || updateState.status === 'syncing' }
    ]);
</script>

<!-- Dense, mobile-friendly layout -->
<div class="p-4 space-y-3 bg-white rounded border border-gray-200 text-sm">
    {#if updateState.status === 'syncing'}
        <div class="text-xs text-gray-500">Updating...</div>
    {/if}

    <h2 class="text-lg font-bold">Consumables</h2>
    <!-- A vertical list instead of a grid -->
    <div class="space-y-2">
        {#each consumables as { type, label, value, effect, maxStock }}
            <div
                class="rounded bg-gray-50 p-2 text-sm hover:bg-gray-100 transition-colors"
                role="group"
                aria-labelledby={`${type}-label`}
            >
                <div class="flex items-center justify-between mb-1">
                    <span id={`${type}-label`} class="font-medium">{label}</span>
                    <div class="flex gap-1">
                        {#each quickActions as { amount, label, getDisabled }}
                            <button
                                class="px-1 py-0.5 border rounded text-xs hover:bg-gray-200 disabled:opacity-50"
                                onclick={() => handleQuickUpdate(type, amount)}
                                disabled={getDisabled(value)}
                                aria-label={`${label} ${label}`}
                            >
                                {label}
                            </button>
                        {/each}
                    </div>
                </div>

                <div class="flex items-center mb-1">
                    {#if editingType === type}
                        <input
                            type="number"
                            class="w-12 border border-gray-300 rounded px-1 text-center text-sm"
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
                            class="w-12 text-xl font-bold py-1 text-center rounded hover:bg-gray-200 
                                   focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                            onclick={() => startEditing(type)}
                            aria-label={`Edit ${label} quantity`}
                            disabled={updateState.status === 'syncing'}
                        >
                            {value}
                        </button>
                    {/if}
                    <span class="text-xs text-gray-600 ml-1">/ {maxStock}</span>
                </div>

                <div class="mb-1 text-xs text-gray-600">{effect}</div>

                <button
                    class="w-full py-1 text-xs text-center border rounded hover:bg-gray-200 disabled:opacity-50"
                    onclick={() => handleQuickUpdate(type, -1)}
                    disabled={value === 0 || updateState.status === 'syncing'}
                >
                    Use {label}
                </button>
            </div>
        {/each}
    </div>

    {#if updateState.error}
        <div class="rounded bg-red-50 p-2 text-xs text-red-700">
            {updateState.error.message}
        </div>
    {/if}
</div>
