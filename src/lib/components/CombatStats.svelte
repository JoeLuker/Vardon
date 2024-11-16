<!-- src/lib/components/CombatStats.svelte -->
<script lang="ts">
    import { character, updateBombs } from '$lib/state/character.svelte';
    import { executeUpdate, type UpdateState } from '$lib/utils/updates';
    import { getCalculatedStats } from '$lib/state/calculatedStats.svelte';
    import type { CalculatedStats } from '$lib/utils/characterCalculations';
    import Tooltip from '$lib/components/Tooltip.svelte';
    
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

    // Update the saveThrows type definition
    type SaveType = 'Fortitude' | 'Reflex' | 'Will';

    // Update the saveThrows array with proper typing
    const saveThrows = $state.raw<Array<{ label: SaveType; value: () => number }>>([
        { label: 'Fortitude', value: () => defenses.saves.fortitude },
        { label: 'Reflex', value: () => defenses.saves.reflex },
        { label: 'Will', value: () => defenses.saves.will }
    ]);

    const armorClasses = $state.raw([
        { 
            label: 'Normal', 
            value: () => defenses.ac.normal,
            getTooltip: (stats: CalculatedStats) => getNormalACTooltip(stats)
        },
        { 
            label: 'Touch', 
            value: () => defenses.ac.touch,
            getTooltip: (stats: CalculatedStats) => getTouchACTooltip(stats)
        },
        { 
            label: 'Flat-Footed', 
            value: () => defenses.ac.flatFooted,
            getTooltip: (stats: CalculatedStats) => getFlatFootedACTooltip(stats)
        }
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

    function getSaveTooltip(save: 'Fortitude' | 'Reflex' | 'Will', stats: CalculatedStats): string {
        const baseBonus = Math.floor(stats.combat.baseAttackBonus/2);
        const parts = [];

        // Always show base
        parts.push(`Base (${baseBonus})`);

        // Add ability modifier based on save type
        const abilityMods = {
            'Fortitude': { mod: stats.attributes.modifiers.temporary.con, label: 'CON' },
            'Reflex': { mod: stats.attributes.modifiers.temporary.dex, label: 'DEX' },
            'Will': { mod: stats.attributes.modifiers.temporary.wis, label: 'WIS' }
        };
        
        const mod = abilityMods[save];
        if (mod.mod !== 0) {
            parts.push(`${mod.label} (${mod.mod >= 0 ? '+' : ''}${mod.mod})`);
        }

        return parts.join(' + ');
    }

    function getInitiativeTooltip(stats: CalculatedStats): string {
        const parts = [];
        const dexMod = stats.attributes.modifiers.temporary.dex;

        if (dexMod !== 0) {
            parts.push(`DEX (${dexMod >= 0 ? '+' : ''}${dexMod})`);
        }

        return parts.join(' + ') || '0';
    }

    function getNormalACTooltip(stats: CalculatedStats): string {
        const parts = ['10'];
        const dexMod = stats.attributes.modifiers.temporary.dex;
        const abpArmorBonus = stats.defenses.abpBonuses.armor;
        const equipmentArmorBonus = stats.defenses.equipmentBonuses?.armor ?? 0;
        const totalArmorBonus = abpArmorBonus + equipmentArmorBonus;
        const deflectionBonus = stats.defenses.abpBonuses.deflection;
        
        if (dexMod !== 0) {
            parts.push(`DEX (${dexMod >= 0 ? '+' : ''}${dexMod})`);
        }
        
        if (totalArmorBonus > 0) {
            const sources = [];
            if (abpArmorBonus > 0) sources.push(`ABP +${abpArmorBonus}`);
            if (equipmentArmorBonus > 0) sources.push(`Equipment +${equipmentArmorBonus}`);
            parts.push(`Armor (${sources.join(', ')})`);
        }
        
        if (stats.defenses.naturalArmorBonus) {
            parts.push(`Natural Armor (+${stats.defenses.naturalArmorBonus})`);
        }
        
        if (deflectionBonus > 0) {
            parts.push(`Deflection (+${deflectionBonus})`);
        }

        return parts.join(' + ');
    }

    function getTouchACTooltip(stats: CalculatedStats): string {
        const parts = ['10'];
        const dexMod = stats.attributes.modifiers.temporary.dex;
        const deflectionBonus = stats.defenses.abpBonuses.deflection;
        
        if (dexMod !== 0) {
            parts.push(`DEX (${dexMod >= 0 ? '+' : ''}${dexMod})`);
        }
        
        if (deflectionBonus > 0) {
            parts.push(`Deflection (+${deflectionBonus})`);
        }

        return parts.join(' + ');
    }

    function getFlatFootedACTooltip(stats: CalculatedStats): string {
        const parts = ['10'];
        const abpArmorBonus = stats.defenses.abpBonuses.armor;
        const equipmentArmorBonus = stats.defenses.equipmentBonuses?.armor ?? 0;
        const totalArmorBonus = abpArmorBonus + equipmentArmorBonus;
        const deflectionBonus = stats.defenses.abpBonuses.deflection;
        
        if (totalArmorBonus > 0) {
            const sources = [];
            if (abpArmorBonus > 0) sources.push(`ABP +${abpArmorBonus}`);
            if (equipmentArmorBonus > 0) sources.push(`Equipment +${equipmentArmorBonus}`);
            parts.push(`Armor (${sources.join(', ')})`);
        }
        
        if (stats.defenses.naturalArmorBonus) {
            parts.push(`Natural Armor (+${stats.defenses.naturalArmorBonus})`);
        }
        
        if (deflectionBonus > 0) {
            parts.push(`Deflection (+${deflectionBonus})`);
        }

        return parts.join(' + ');
    }

    function getCMBTooltip(stats: CalculatedStats): string {
        const parts = [];
        const bab = stats.combat.baseAttackBonus;
        const strMod = stats.attributes.modifiers.temporary.str;

        if (bab !== 0) {
            parts.push(`BAB (${bab >= 0 ? '+' : ''}${bab})`);
        }

        if (strMod !== 0) {
            parts.push(`STR (${strMod >= 0 ? '+' : ''}${strMod})`);
        }

        return parts.join(' + ') || '0';
    }

    function getCMDTooltip(stats: CalculatedStats): string {
        const parts = ['10'];
        const bab = stats.combat.baseAttackBonus;
        const strMod = stats.attributes.modifiers.temporary.str;
        const dexMod = stats.attributes.modifiers.temporary.dex;

        if (bab !== 0) {
            parts.push(`BAB (${bab >= 0 ? '+' : ''}${bab})`);
        }

        if (strMod !== 0) {
            parts.push(`STR (${strMod >= 0 ? '+' : ''}${strMod})`);
        }

        if (dexMod !== 0) {
            parts.push(`DEX (${dexMod >= 0 ? '+' : ''}${dexMod})`);
        }

        return parts.join(' + ');
    }

    function getBombDamageTooltip(stats: CalculatedStats): string {
        const parts = [`Base (${Math.ceil(stats.combat.baseAttackBonus/2)}d6)`];
        const intMod = stats.attributes.modifiers.temporary.int;

        if (intMod !== 0) {
            parts.push(`INT (${intMod >= 0 ? '+' : ''}${intMod})`);
        }

        return parts.join(' + ');
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
                    <div class="group relative">
                        <div>{resources.bombs.damage}</div>
                        <Tooltip text={getBombDamageTooltip(stats)} />
                    </div>
                    <div class="text-gray-600">+{resources.bombs.splash} splash</div>
                </div>
            </div>
        </div>

        <!-- Attack Section -->
        <div class="rounded bg-gray-50 p-4">
            <div>
                <h3 class="text-sm font-medium">Attacks</h3>
                <div class="mt-2 space-y-2">
                    <div class="group relative">
                        <span class="text-sm text-gray-600">Melee</span>
                        <div class="text-xl font-bold">{combat.attacks.melee.bonus}</div>
                        <Tooltip text={`BAB (${stats.combat.baseAttackBonus}) + STR (${stats.attributes.modifiers.temporary.str}) + Size + Weapon Focus + Other Modifiers`} />
                        {#if combat.attacks.melee.damage}
                            <div class="text-sm text-gray-600">
                                Damage {combat.attacks.melee.damage}
                            </div>
                        {/if}
                    </div>
                    
                    <div class="group relative">
                        <span class="text-sm text-gray-600">Ranged</span>
                        <div class="text-xl font-bold">{combat.attacks.ranged.bonus}</div>
                        <Tooltip text={`BAB (${stats.combat.baseAttackBonus}) + DEX (${stats.attributes.modifiers.temporary.dex}) + Size + Point Blank Shot + Other Modifiers`} />
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
                <div class="group relative">
                    <div class="text-xl font-bold">{combat.initiative >= 0 ? '+' : ''}{combat.initiative}</div>
                    <Tooltip text={getInitiativeTooltip(stats)} />
                </div>
            </div>

            <!-- Armor Class -->
            <div>
                <span class="text-sm font-medium">Armor Class</span>
                <div class="grid grid-cols-3 gap-2 text-center">
                    {#each armorClasses as { label, value, getTooltip }}
                        <div class="group relative">
                            <div class="text-xl font-bold">{value()}</div>
                            <div class="text-xs">{label}</div>
                            <Tooltip text={getTooltip(stats)} />
                        </div>
                    {/each}
                </div>
            </div>

            <!-- Saving Throws -->
            <div>
                <span class="text-sm font-medium">Saving Throws</span>
                <div class="grid grid-cols-3 gap-2 text-center">
                    {#each saveThrows as { label, value }}
                        <div class="group relative">
                            <div class="text-xl font-bold">{value() >= 0 ? '+' : ''}{value()}</div>
                            <div class="text-xs">{label}</div>
                            <Tooltip text={getSaveTooltip(label, stats)} />
                        </div>
                    {/each}
                </div>
            </div>

            <!-- CMB/CMD -->
            <div class="grid grid-cols-2 gap-2">
                {#each combatStats as { key, label, value }}
                    <div class="group relative">
                        <span class="text-sm font-medium">{label}</span>
                        <div class="text-xl font-bold">
                            {key === 'cmb' ? (value() >= 0 ? '+' : '') : ''}{value()}
                        </div>
                        <Tooltip text={key === 'cmb' ? getCMBTooltip(stats) : getCMDTooltip(stats)} />
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