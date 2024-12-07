<!-- src/lib/components/ABPDisplay.svelte -->
<script lang="ts">
    import type { ABPBonuses } from '$lib/types/abp';
    import { getCharacter } from '$lib/state/character.svelte';
    import { calculateCharacterStats } from '$lib/utils/characterCalculations';

    // Destructure props using $props and add TypeScript typing
    let { characterId }: { characterId: number } = $props();

    // Derive the character from state
    let character = $derived.by(() => getCharacter(characterId));

    // Derive stats by recalculating each time 'character' changes
    let stats = $derived.by(() => calculateCharacterStats(character));

    // Extract ABP bonuses from the recalculated stats
    let bonuses = $derived(stats.defenses.abpBonuses);

    const bonusLabels: Record<keyof ABPBonuses, string> = {
        resistance: 'Resistance',
        armor: 'Armor',
        weapon: 'Weapon',
        deflection: 'Deflection',
        mental_prowess: 'Mental Prowess',
        physical_prowess: 'Physical Prowess',
        toughening: 'Toughening'
    };

</script>

<div class="card space-y-6">
    <div class="section-header">
        <h2>Automatic Bonus Progression</h2>
    </div>

    <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {#each Object.entries(bonuses) as [type, value]}
            {#if value > 0}
                <div class="rounded bg-gray-50 p-3">
                    <div class="text-sm font-medium">{bonusLabels[type as keyof ABPBonuses]}</div>
                    <div class="text-xl font-bold text-primary">+{value}</div>
                </div>
            {/if}
        {/each}
    </div>
</div>
