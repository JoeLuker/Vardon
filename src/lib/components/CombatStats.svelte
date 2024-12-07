<!-- src/lib/components/CombatStats.svelte -->
<script lang="ts">
    import { 
        getCharacter, 
        updateBombs, 
        optimisticUpdateBombs, 
        rollbackUpdateBombs 
    } from '$lib/state/character.svelte';
    import { executeUpdate, type UpdateState } from '$lib/utils/updates';
    import { calculateCharacterStats, type CalculatedStats } from '$lib/utils/characterCalculations';
    import Tooltip from '$lib/components/Tooltip.svelte';

    let { characterId } = $props<{ characterId: number }>();

    let character = $derived(getCharacter(characterId));
    let stats = $derived.by(() => calculateCharacterStats(character));

    let updateState = $state<UpdateState>({ status: 'idle', error: null });
    let isEditing = $state(false);
    let inputValue = $state(0);

    let resources = $derived.by(() => stats.resources);
    let combat = $derived.by(() => stats.combat);
    let defenses = $derived.by(() => stats.defenses);

    type SaveType = 'Fortitude' | 'Reflex' | 'Will';

    let saveThrows = $state<Array<{ label: SaveType; value: () => number }>>([
        { label: 'Fortitude', value: () => defenses.saves.fortitude },
        { label: 'Reflex', value: () => defenses.saves.reflex },
        { label: 'Will', value: () => defenses.saves.will }
    ]);

    let armorClasses = $state([
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

    let combatStats = $state([
        { key: 'cmb', label: 'CMB', value: () => combat.combatManeuver.bonus },
        { key: 'cmd', label: 'CMD', value: () => combat.combatManeuver.defense }
    ]);

    let quickActions = $state([
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
        const newValue = Math.max(0, Math.min(resources.bombs.perDay, resources.bombs.remaining + amount));
        if (newValue === resources.bombs.remaining) return;

        const previousValue = resources.bombs.remaining;

        await executeUpdate({
            key: `bombs-${character.id}`,
            status: updateState,
            operation: () => updateBombs(character.id, newValue),
            optimisticUpdate: () => optimisticUpdateBombs(character.id, newValue),
            rollback: () => rollbackUpdateBombs(character.id, previousValue)
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
            operation: () => updateBombs(character.id, inputValue),
            optimisticUpdate: () => optimisticUpdateBombs(character.id, inputValue),
            rollback: () => rollbackUpdateBombs(character.id, previousValue)
        });
    }

    function focusInput(node: HTMLInputElement) {
        node.focus();
        return {};
    }

    function getSaveTooltip(save: 'Fortitude' | 'Reflex' | 'Will', stats: CalculatedStats): string {
        const baseBonus = Math.floor(stats.combat.baseAttackBonus / 2);
        const parts: string[] = [`Base (${baseBonus})`];
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
        const dexMod = stats.attributes.modifiers.temporary.dex;
        return dexMod !== 0 ? `DEX (${dexMod >= 0 ? '+' : ''}${dexMod})` : '0';
    }

    function getNormalACTooltip(stats: CalculatedStats): string {
        const parts = ['10'];
        const dexMod = stats.attributes.modifiers.temporary.dex;
        const abpArmorBonus = stats.defenses.abpBonuses.armor;
        const equipmentArmorBonus = stats.defenses.equipmentBonuses?.armor ?? 0;
        const deflectionBonus = stats.defenses.abpBonuses.deflection;
        const totalArmorBonus = abpArmorBonus + equipmentArmorBonus;

        if (dexMod !== 0) parts.push(`DEX (${dexMod >= 0 ? '+' : ''}${dexMod})`);
        if (totalArmorBonus > 0) {
            const sources: string[] = [];
            if (abpArmorBonus > 0) sources.push(`ABP +${abpArmorBonus}`);
            if (equipmentArmorBonus > 0) sources.push(`Equipment +${equipmentArmorBonus}`);
            parts.push(`Armor (${sources.join(', ')})`);
        }
        if (stats.defenses.naturalArmorBonus) parts.push(`Natural Armor (+${stats.defenses.naturalArmorBonus})`);
        if (deflectionBonus > 0) parts.push(`Deflection (+${deflectionBonus})`);

        return parts.join(' + ');
    }

    function getTouchACTooltip(stats: CalculatedStats): string {
        const parts = ['10'];
        const dexMod = stats.attributes.modifiers.temporary.dex;
        const deflectionBonus = stats.defenses.abpBonuses.deflection;
        
        if (dexMod !== 0) parts.push(`DEX (${dexMod >= 0 ? '+' : ''}${dexMod})`);
        if (deflectionBonus > 0) parts.push(`Deflection (+${deflectionBonus})`);

        return parts.join(' + ');
    }

    function getFlatFootedACTooltip(stats: CalculatedStats): string {
        const parts = ['10'];
        const abpArmorBonus = stats.defenses.abpBonuses.armor;
        const equipmentArmorBonus = stats.defenses.equipmentBonuses?.armor ?? 0;
        const deflectionBonus = stats.defenses.abpBonuses.deflection;
        const totalArmorBonus = abpArmorBonus + equipmentArmorBonus;

        if (totalArmorBonus > 0) {
            const sources: string[] = [];
            if (abpArmorBonus > 0) sources.push(`ABP +${abpArmorBonus}`);
            if (equipmentArmorBonus > 0) sources.push(`Equipment +${equipmentArmorBonus}`);
            parts.push(`Armor (${sources.join(', ')})`);
        }
        if (stats.defenses.naturalArmorBonus) parts.push(`Natural Armor (+${stats.defenses.naturalArmorBonus})`);
        if (deflectionBonus > 0) parts.push(`Deflection (+${deflectionBonus})`);

        return parts.join(' + ');
    }

    function getCMBTooltip(stats: CalculatedStats): string {
        const parts: string[] = [];
        const bab = stats.combat.baseAttackBonus;
        const strMod = stats.attributes.modifiers.temporary.str;

        if (bab !== 0) parts.push(`BAB (${bab >= 0 ? '+' : ''}${bab})`);
        if (strMod !== 0) parts.push(`STR (${strMod >= 0 ? '+' : ''}${strMod})`);

        return parts.join(' + ') || '0';
    }

    function getCMDTooltip(stats: CalculatedStats): string {
        const parts = ['10'];
        const bab = stats.combat.baseAttackBonus;
        const strMod = stats.attributes.modifiers.temporary.str;
        const dexMod = stats.attributes.modifiers.temporary.dex;

        if (bab !== 0) parts.push(`BAB (${bab >= 0 ? '+' : ''}${bab})`);
        if (strMod !== 0) parts.push(`STR (${strMod >= 0 ? '+' : ''}${strMod})`);
        if (dexMod !== 0) parts.push(`DEX (${dexMod >= 0 ? '+' : ''}${dexMod})`);

        return parts.join(' + ');
    }

    function getBombDamageTooltip(stats: CalculatedStats): string {
        const parts = [`Base (${Math.ceil(stats.combat.baseAttackBonus/2)}d6)`];
        const intMod = stats.attributes.modifiers.temporary.int;
        if (intMod !== 0) parts.push(`INT (${intMod >= 0 ? '+' : ''}${intMod})`);

        return parts.join(' + ');
    }
</script>

<!-- Dense, mobile-friendly layout -->
<div class="p-4 space-y-3 bg-white rounded border border-gray-200 text-sm">
    {#if updateState.status === 'syncing'}
        <div class="text-xs text-gray-500">Updating...</div>
    {/if}

    <!-- Bombs -->
    <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
            <span class="font-medium">Bombs</span>
            {#if isEditing}
                <input
                    type="number"
                    class="w-16 border border-gray-300 rounded px-1 text-center text-sm"
                    value={inputValue}
                    min="0"
                    max={resources.bombs.perDay}
                    oninput={handleInputChange}
                    onblur={handleInputBlur}
                    use:focusInput
                />
            {:else}
                <button
                    class="text-xl font-bold px-2 py-1 hover:bg-gray-100 rounded"
                    onclick={() => {
                        isEditing = true;
                        inputValue = resources.bombs.remaining;
                    }}
                    disabled={updateState.status === 'syncing'}
                >
                    {resources.bombs.remaining}
                </button>
            {/if}
            <span>/ {resources.bombs.perDay}</span>
        </div>
        <div class="flex gap-1">
            {#each quickActions as { amount, label, disabled }}
                <button
                    class="px-1 py-0.5 border rounded text-xs hover:bg-gray-100 disabled:opacity-50"
                    onclick={() => handleQuickUpdate(amount)}
                    disabled={disabled()}
                >
                    {label}
                </button>
            {/each}
        </div>
    </div>
    <div class="flex items-center justify-between">
        <div class="flex items-center gap-1 text-gray-700">
            <span class="font-medium">Damage:</span>
            <div class="group relative inline-block">
                {resources.bombs.damage}
                <Tooltip text={getBombDamageTooltip(stats)} />
            </div>
            <span class="text-gray-500">+{resources.bombs.splash} splash</span>
        </div>
    </div>

    <!-- Attacks -->
    <div class="space-y-1">
        <div class="font-medium">Attacks</div>
        <div class="flex justify-between items-center">
            <span class="text-gray-600">Melee</span>
            <!-- combat.attacks.melee.bonus is already formatted with sign in calculateCharacterStats -->
            <div class="group relative font-bold text-lg">
                {combat.attacks.melee.bonus}
                <Tooltip text={`BAB (${stats.combat.baseAttackBonus}) + STR (${stats.attributes.modifiers.temporary.str}) + Other Mods`} />
            </div>
        </div>
        {#if combat.attacks.melee.damage}
            <div class="text-xs text-gray-500 text-right">Damage {combat.attacks.melee.damage}</div>
        {/if}

        <div class="flex justify-between items-center">
            <span class="text-gray-600">Ranged</span>
            <!-- combat.attacks.ranged.bonus also already includes the sign -->
            <div class="group relative font-bold text-lg">
                {combat.attacks.ranged.bonus}
                <Tooltip text={`BAB (${stats.combat.baseAttackBonus}) + DEX (${stats.attributes.modifiers.temporary.dex}) + Other Mods`} />
            </div>
        </div>
        {#if combat.attacks.ranged.damage}
            <div class="text-xs text-gray-500 text-right">Damage {combat.attacks.ranged.damage}</div>
        {/if}
    </div>

    <!-- Initiative -->
    <div class="flex items-center justify-between">
        <span class="font-medium">Initiative</span>
        <!-- Initiative is a raw number, add sign if positive -->
        <div class="group relative font-bold text-lg">
            {combat.initiative > 0 ? '+' : ''}{combat.initiative}
            <Tooltip text={getInitiativeTooltip(stats)} />
        </div>
    </div>

    <!-- Armor Class -->
    <div class="space-y-1">
        <div class="font-medium">Armor Class</div>
        <div class="flex items-center justify-between text-center text-sm">
            {#each armorClasses as { label, value, getTooltip }}
                <div class="group relative flex-1">
                    <!-- AC values are pure numbers, add plus sign only if needed (AC won't need +) -->
                    <div class="font-bold text-lg">{value()}</div>
                    <div class="text-xs text-gray-500">{label}</div>
                    <Tooltip text={getTooltip(stats)} />
                </div>
            {/each}
        </div>
    </div>

    <!-- Saving Throws -->
    <div class="space-y-1">
        <div class="font-medium">Saving Throws</div>
        <div class="flex items-center justify-between text-center text-sm">
            {#each saveThrows as { label, value }}
                <div class="group relative flex-1">
                    <!-- Save values are numbers, add sign if positive -->
                    <div class="font-bold text-lg">{value() > 0 ? '+' : ''}{value()}</div>
                    <div class="text-xs text-gray-500">{label}</div>
                    <Tooltip text={getSaveTooltip(label, stats)} />
                </div>
            {/each}
        </div>
    </div>

    <!-- CMB/CMD -->
    <div class="space-y-1">
        <div class="font-medium">CMB / CMD</div>
        <div class="flex items-center justify-between text-center text-sm">
            {#each combatStats as { key, label, value }}
                <div class="group relative flex-1">
                    <!-- For CMB (a number), add sign if positive. CMD is just a number. -->
                    <div class="font-bold text-lg">
                        {key === 'cmb' && value() > 0 ? '+' : ''}{value()}
                    </div>
                    <div class="text-xs text-gray-500">{label}</div>
                    <Tooltip text={key === 'cmb' ? getCMBTooltip(stats) : getCMDTooltip(stats)} />
                </div>
            {/each}
        </div>
    </div>

    {#if updateState.error}
        <div class="rounded bg-red-50 p-2 text-xs text-red-700">
            {updateState.error.message}
        </div>
    {/if}
</div>
