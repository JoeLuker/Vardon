<!-- src/lib/components/CombatStats.svelte -->
<script lang="ts">
    import { character, updateBombs } from '$lib/state/character.svelte';
    import { executeUpdate, type UpdateState } from '$lib/utils/updates';
    import { getCalculatedStats } from '$lib/state/calculatedStats.svelte';
    
    // Component state
    let isEditing = $state(false);
    let inputValue = $state(0);
    let updateState = $state<UpdateState>({
        status: 'idle',
        error: null
    });

    // Calculate all stats
    let stats = $derived(getCalculatedStats());

    let resources = $derived(stats.resources);
    let combat = $derived(stats.combat);
    let defenses = $derived(stats.defenses);

    // Display configurations
    const saveThrows = $state.raw([
        { label: 'Fortitude', value: () => defenses.saves.fortitude },
        { label: 'Reflex', value: () => defenses.saves.reflex },
        { label: 'Will', value: () => defenses.saves.will }
    ]);

    const armorClasses = $state.raw([
        { label: 'Normal', value: () => defenses.ac.normal },
        { label: 'Touch', value: () => defenses.ac.touch },
        { label: 'Flat-Footed', value: () => defenses.ac.flatFooted }
    ]);

    const combatStats = $state.raw([
        { key: 'cmb', label: 'CMB', value: () => combat.combatManeuver.bonus },
        { key: 'cmd', label: 'CMD', value: () => combat.combatManeuver.defense }
    ]);

    const quickActions = $state.raw([
        { 
            amount: -1, 
            label: '-1', 
            disabled: () => resources.bombs.remaining <= 0 || updateState.status === 'syncing' 
        },
        { 
            amount: 1, 
            label: '+1', 
            disabled: () => resources.bombs.remaining >= resources.bombs.perDay || updateState.status === 'syncing' 
        }
    ]);

    async function handleQuickUpdate(amount: number) {
        const newValue = Math.max(0, Math.min(
            resources.bombs.perDay,
            resources.bombs.remaining + amount
        ));
        
        if (newValue === resources.bombs.remaining) return;

        const previousValue = resources.bombs.remaining;

        await executeUpdate({
            key: `bombs-${character.id}`,
            status: updateState,
            operation: () => updateBombs(newValue),
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
        inputValue = Math.max(0, Math.min(resources.bombs.perDay, parsed));
    }

    async function handleInputBlur() {
        if (inputValue === resources.bombs.remaining) {
            isEditing = false;
            return;
        }

        const previousValue = resources.bombs.remaining;
        isEditing = false;

        await executeUpdate({
            key: `bombs-${character.id}`,
            status: updateState,
            operation: () => updateBombs(inputValue),
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

    // Add the missing focusInput action
    function focusInput(node: HTMLInputElement) {
        node.focus();
        return {};
    }
</script>

<div class="card">
    <h2 class="mb-4 font-bold">Combat Stats</h2>
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <!-- Bombs Section -->
        <div class="rounded bg-gray-50 p-4">
            <div class="mb-2 flex items-center justify-between">
                <label for="bombs-input" class="text-sm font-medium">Bombs</label>
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

            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    {#if isEditing}
                        <input
                            id="bombs-input"
                            type="number"
                            class="input w-20 text-center"
                            value={inputValue}
                            min="0"
                            max={resources.bombs.perDay}
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
                                inputValue = resources.bombs.remaining;
                            }}
                            disabled={updateState.status === 'syncing'}
                            aria-label="Edit number of bombs"
                        >
                            {resources.bombs.remaining}
                        </button>
                    {/if}
                    <span class="text-sm text-gray-600">/ {resources.bombs.perDay}</span>
                </div>
                <div class="text-right text-sm">
                    <div>{resources.bombs.damage}</div>
                    <div class="text-gray-600">+{resources.bombs.splash} splash</div>
                </div>
            </div>
        </div>

        <!-- Attack Section -->
        <div class="rounded bg-gray-50 p-4">
            <div>
                <h3 class="text-sm font-medium">Attacks</h3>
                <div class="mt-2 space-y-2">
                    <div>
                        <span class="text-sm text-gray-600">Melee</span>
                        <div class="text-xl font-bold">{combat.attacks.melee.bonus}</div>
                        {#if combat.attacks.melee.damage}
                            <div class="text-sm text-gray-600">
                                Damage {combat.attacks.melee.damage}
                            </div>
                        {/if}
                    </div>
                    <div>
                        <span class="text-sm text-gray-600">Ranged</span>
                        <div class="text-xl font-bold">{combat.attacks.ranged.bonus}</div>
                        {#if combat.attacks.ranged.damage}
                            <div class="text-sm text-gray-600">
                                Damage {combat.attacks.ranged.damage}
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        </div>

        <!-- General Combat Stats -->
        <div class="rounded bg-gray-50 p-4 space-y-4">
            <!-- Initiative -->
            <div>
                <span class="text-sm font-medium">Initiative</span>
                <div class="text-xl font-bold">{combat.initiative >= 0 ? '+' : ''}{combat.initiative}</div>
            </div>

            <!-- Armor Class -->
            <div>
                <span class="text-sm font-medium">Armor Class</span>
                <div class="grid grid-cols-3 gap-2 text-center">
                    {#each armorClasses as { label, value }}
                        <div>
                            <div class="text-xl font-bold">{value()}</div>
                            <div class="text-xs">{label}</div>
                        </div>
                    {/each}
                </div>
            </div>

            <!-- Saving Throws -->
            <div>
                <span class="text-sm font-medium">Saving Throws</span>
                <div class="grid grid-cols-3 gap-2 text-center">
                    {#each saveThrows as { label, value }}
                        <div>
                            <div class="text-xl font-bold">{value() >= 0 ? '+' : ''}{value()}</div>
                            <div class="text-xs">{label}</div>
                        </div>
                    {/each}
                </div>
            </div>

            <!-- CMB/CMD -->
            <div class="grid grid-cols-2 gap-2">
                {#each combatStats as { key, label, value }}
                    <div>
                        <span class="text-sm font-medium">{label}</span>
                        <div class="text-xl font-bold">
                            {key === 'cmb' ? (value() >= 0 ? '+' : '') : ''}{value()}
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    </div>

    {#if updateState.error}
        <div class="mt-4 rounded bg-red-100 p-3 text-sm text-red-700">
            Failed to update bombs. Please try again.
        </div>
    {/if}
</div>