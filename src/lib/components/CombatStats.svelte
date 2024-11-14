<!-- src/lib/components/CombatStats.svelte -->
<script lang="ts">
    import { updateQueue } from '$lib/utils/updateQueue.svelte';
    import { character, updateBombs } from '$lib/state/character.svelte';
    import { calculateCombatMods, formatAttackBonus, formatDamageBonus } from '$lib/utils/combatCalculations';
    import type { KnownBuffType } from '$lib/types/character';

    // Component state
    let isEditing = $state(false);
    let inputValue = $state(0);
    let status = $state<'idle' | 'syncing'>('idle');

    // Local derivations
    let activeBuffs = $derived(
        (character.character_buffs ?? [])
            .filter(b => b.is_active)
            .map(b => b.buff_type as KnownBuffType)
    );

    let bombsLeft = $derived(character.character_combat_stats?.[0]?.bombs_left ?? 0);
    let baseAttackBonus = $derived(character.character_combat_stats?.[0]?.base_attack_bonus ?? 0);

    // Combat calculations using utilities
    let mods = $derived(calculateCombatMods(activeBuffs));
    let attackDisplay = $derived(formatAttackBonus(baseAttackBonus, mods));
    let damageDisplay = $derived(formatDamageBonus(mods));

    async function handleQuickUpdate(amount: number) {
        const newValue = Math.max(0, bombsLeft + amount);
        if (newValue === bombsLeft) return;

        const previousValue = bombsLeft;

        await updateQueue.enqueue({
            key: `bombs-${character.id}`,
            execute: async () => {
                try {
                    status = 'syncing';
                    await updateBombs(newValue);
                    status = 'idle';
                } catch (e) {
                    throw new Error('Failed to update bombs');
                }
            },
            optimisticUpdate: () => {
                if (character.character_combat_stats?.[0]) {
                    character.character_combat_stats[0].bombs_left = newValue;
                }
            },
            rollback: () => {
                if (character.character_combat_stats?.[0]) {
                    character.character_combat_stats[0].bombs_left = previousValue;
                }
            }
        });
    }

    function handleInputChange(event: Event) {
        const value = (event.target as HTMLInputElement).value;
        const parsed = parseInt(value) || 0;
        inputValue = Math.max(0, parsed);
    }

    async function handleInputBlur() {
        if (inputValue === bombsLeft) {
            isEditing = false;
            return;
        }

        const previousValue = bombsLeft;
        isEditing = false;

        await updateQueue.enqueue({
            key: `bombs-${character.id}`,
            execute: async () => {
                try {
                    status = 'syncing';
                    await updateBombs(inputValue);
                    status = 'idle';
                } catch (e) {
                    throw new Error('Failed to update bombs');
                }
            },
            optimisticUpdate: () => {
                if (character.character_combat_stats?.[0]) {
                    character.character_combat_stats[0].bombs_left = inputValue;
                }
            },
            rollback: () => {
                if (character.character_combat_stats?.[0]) {
                    character.character_combat_stats[0].bombs_left = previousValue;
                }
            }
        });
    }

    const quickActions = $state.raw([
        { amount: -1, label: '-1', disabled: () => bombsLeft <= 0 || status === 'syncing' },
        { amount: 1, label: '+1', disabled: () => status === 'syncing' }
    ]);

    function focusInput(node: HTMLInputElement) {
        node.focus();
        node.select();
        return {
            destroy: () => {}
        };
    }
</script>

<div class="card">
    <h2 class="mb-4 font-bold">Combat Stats</h2>
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <!-- Bombs Section -->
        <div class="rounded bg-gray-50 p-4">
            <div class="mb-2 flex items-center justify-between">
                <label for="bombs-input" class="text-sm font-medium">Bombs Left</label>
                <div class="flex gap-1">
                    {#each quickActions as { amount, label, disabled }}
                        <button
                            class="btn btn-secondary px-2 py-1 text-xs"
                            onclick={() => handleQuickUpdate(amount)}
                            disabled={disabled()}
                            aria-label="{label} bombs"
                        >
                            {label}
                        </button>
                    {/each}
                </div>
            </div>

            <div class="flex items-center gap-2">
                {#if isEditing}
                    <input
                        id="bombs-input"
                        type="number"
                        class="input w-20 text-center"
                        value={inputValue}
                        min="0"
                        oninput={handleInputChange}
                        onblur={handleInputBlur}
                        use:focusInput
                        aria-label="Number of bombs remaining"
                    />
                {:else}
                    <button
                        class="rounded px-2 py-1 text-2xl font-bold hover:bg-gray-200
                               focus:outline-none focus:ring-2 focus:ring-primary/50"
                        onclick={() => {
                            isEditing = true;
                            inputValue = bombsLeft;
                        }}
                        disabled={status === 'syncing'}
                        aria-label="Edit number of bombs"
                    >
                        {bombsLeft}
                    </button>
                {/if}
            </div>
        </div>

        <!-- Attack Bonus Section -->
        <div class="rounded bg-gray-50 p-4">
            <div class="space-y-2">
                <div class="group relative">
                    <div class="mb-1 flex items-center gap-2">
                        <span class="text-sm font-medium">Attack Bonus</span>
                        {#if mods.extraAttacks > 0}
                            <span class="rounded bg-primary/10 px-1 py-0.5 text-xs text-primary">
                                {mods.extraAttacks} extra {mods.extraAttacks === 1 ? 'attack' : 'attacks'}
                            </span>
                        {/if}
                    </div>
                    <div class="text-2xl font-bold">{attackDisplay}</div>
                    {#if mods.attack !== 0}
                        <div class="text-xs text-gray-500">
                            Base {baseAttackBonus >= 0 ? '+' : ''}{baseAttackBonus}
                            {#if mods.attack}
                                <span class="text-primary">
                                    ({mods.attack >= 0 ? '+' : ''}{mods.attack} from effects)
                                </span>
                            {/if}
                        </div>
                    {/if}
                </div>

                {#if damageDisplay}
                    <div class="border-t border-gray-200 pt-2">
                        <div class="mb-1 text-sm font-medium">Damage Modifier</div>
                        <span class="text-xl font-bold">{damageDisplay}</span>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>