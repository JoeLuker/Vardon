<script lang="ts">
    import { getABPBonuses } from '$lib/types/abp';
    import type { ABPBonuses } from '$lib/types/abp';
    import { character } from '$lib/state/character.svelte';

    let level = $derived(character.level);
    let bonuses = $derived(getABPBonuses(level + 2));
    
    const bonusLabels: Record<keyof ABPBonuses, string> = {
        resistance: 'Resistance',
        armor: 'Armor',
        weapon: 'Weapon',
        deflection: 'Deflection',
        mental: 'Mental',
        physical: 'Physical',
        toughening: 'Toughening'
    };
</script>

<div class="card">
    <h2 class="mb-4 font-bold">Automatic Bonus Progression</h2>
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