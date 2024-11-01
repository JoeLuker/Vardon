<script>
    import { character } from '$lib/stores/character';
    import { slide } from 'svelte/transition';
    
    let showTables = true;
    
    $: stats = $character || {};
    $: currentAttributes = stats.currentAttributes || {};
    $: baseStats = stats.baseStats || {};
    $: spellSlots = $character ? calculateSpellSlots() : {};
    
    function calculateSpellSlots() {
        const intModifier = character.calculateModifier(currentAttributes.int);
        return Object.entries(baseStats.baseSpells || {}).reduce((acc, [level, base]) => {
            const numLevel = parseInt(level);
            let bonus = 0;
            if (intModifier >= numLevel) {
                bonus = Math.floor((intModifier - numLevel) / 4) + 1;
            }
            acc[level] = {
                base,
                bonus,
                total: base + bonus,
                used: stats.spellSlots?.[level]?.used ?? 0
            };
            return acc;
        }, {});
    }
</script>

<section id="class-features">
    <h2 class="section-header w-full text-left">
        Class Features & Spells Per Day
    </h2>
    
    {#if showTables}
        <div class="parchment-cell" transition:slide>
            <h3 class="font-bold text-lg mb-2">Spells Per Day</h3>
            <div class="overflow-x-auto">
                <table class="min-w-full border border-[#c19a6b]">
                    <!-- Rest of the table code remains the same -->
                </table>
            </div>
        </div>
    {/if}
</section>