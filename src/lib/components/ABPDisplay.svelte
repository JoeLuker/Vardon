<script lang="ts">
    import type { ABPBonuses } from '$lib/types/abp';
    import { getCalculatedStats } from '$lib/state/calculatedStats.svelte';

    let { characterId } = $props<{ characterId: number; }>();

    let stats = $derived(getCalculatedStats(characterId));
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