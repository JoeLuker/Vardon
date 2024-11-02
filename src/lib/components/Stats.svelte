<!-- src/lib/components/Stats.svelte -->
<script>
    import { character } from '$lib/stores/character';
    import SkillAllocator from './SkillAllocator.svelte';
    
    let showSkillAllocator = false;
    
    function formatModifier(num) {
        if (typeof num !== 'number') return '+0';
        return num >= 0 ? `+${num}` : num.toString();
    }
    
    $: stats = $character || {};
</script>

<section id="statistics">
    <h2 class="text-2xl text-[#c19a6b] border-b-2 border-[#c19a6b] pb-1 mb-4">
        Statistics
    </h2>
    
    <div class="parchment-cell">
        <div class="flex justify-between items-center mb-4">
            <button 
                class="mutagen-button" 
                class:active={stats.cognatogenActive}
                on:click={() => character.toggleCognatogen()}
            >
                Intelligence Cognatogen
            </button>
            <button 
                class="mutagen-button" 
                class:active={stats.dexMutagenActive}
                on:click={() => character.toggleDexMutagen()}
            >
                Dexterity Mutagen
            </button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {#each Object.entries(stats.currentAttributes || {}) as [attr, value]}
                <div>
                    <strong>{attr.toUpperCase()}</strong>: {value} 
                    ({formatModifier(character.calculateModifier(value))})
                </div>
            {/each}
        </div>
        
        <div class="mt-4">
            <strong>Skills</strong>
            <ul class="skill-list mt-2">
                {#each Object.entries(stats.skills || {}) as [skillName, skill]}
                    <li class="mb-1">
                        <span class="capitalize">
                            {skillName.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <span class="font-mono">
                            {formatModifier(character.calculateSkillBonus(skillName, stats))}
                        </span>
                        {#if skill.classSkill}
                            <span class="text-xs text-[#c19a6b] ml-1">(class)</span>
                        {/if}
                    </li>
                {/each}
            </ul>
        </div>
        <button 
        class="px-4 py-2 rounded bg-[#c19a6b] text-white hover:bg-[#a67b4b] transition-colors"
        on:click={() => showSkillAllocator = true}
    >
        Allocate Skills
    </button>
    </div>

    
    <SkillAllocator bind:showAllocator={showSkillAllocator} />
</section>