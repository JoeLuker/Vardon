<script>
    import { character } from '$lib/stores/character';
    import ResourceTracker from './ResourceTracker.svelte';
    import { slide } from 'svelte/transition';
    
    $: stats = $character || {};
    $: currentAttributes = stats.currentAttributes || {};
    $: baseStats = stats.baseStats || {};
    $: spellSlots = getSpellSlotsDisplay($character);
    $: spellDCs = getSpellDCs($character);

    console.log('baseStats', baseStats);
    
    function getSpellSlotsDisplay() {
        if (!stats.baseStats?.baseSpells) return {};
        
        // Get calculated slots including bonuses
        const slots = character.getSpellSlots(stats);
        
        // Convert to display format
        return Object.entries(slots).reduce((acc, [level, slotInfo]) => {
            acc[level] = {
                total: slotInfo.max,
                remaining: slotInfo.remaining,
                base: baseStats.baseSpells[level] || 0,
                bonus: slotInfo.max - (baseStats.baseSpells[level] || 0)
            };
            return acc;
        }, {});
    }
    
    function getSpellDCs() {
        return Object.keys(baseStats.baseSpells || {}).reduce((acc, level) => {
            acc[level] = character.getSpellDC(parseInt(level), stats);
            return acc;
        }, {});
    }
</script>

<div class="parchment-cell" transition:slide>
    <strong class="block mb-2">Spell Slots</strong>
    {#each Object.entries(spellSlots) as [level, data]}
        <div class="mb-6">
            <div class="flex justify-between items-center mb-2">
                <span class="text-lg font-semibold">
                    Level {level} Spells (DC {spellDCs[level]})
                </span>
                <div class="text-sm text-gray-600">
                    Base: {data.base} + Bonus: {data.bonus}
                </div>
            </div>
            
            <ResourceTracker
                label={`Level ${level}`}
                total={data.total}
                used={data.total - data.remaining}
                onToggle={(remaining) => {
                    character.useSpellSlot(parseInt(level), remaining);
                }}
            />
            
            <div class="text-sm text-gray-600 ml-2">
                {data.remaining} of {data.total} remaining
            </div>
        </div>
    {/each}
    
    {#if stats.knownSpells}
        <div class="mt-6">
            <strong class="block mb-2">Known Spells</strong>
            {#each Object.entries(stats.knownSpells) as [level, spells]}
                <div class="mb-2">
                    <strong class="text-[#c19a6b]">Level {level}:</strong>
                    <ul class="list-disc list-inside ml-4">
                        {#each spells as spell}
                            <li>{spell}</li>
                        {/each}
                    </ul>
                </div>
            {/each}
        </div>
    {/if}
</div>