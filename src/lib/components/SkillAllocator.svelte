<script>
    import { character } from '$lib/stores/character';
    
    export let showAllocator = false;
    
    let skillPointsByLevel = [];
    const availablePointsPerLevel = character.getAvailableSkillPoints();
    
    $: stats = $character || {};
    $: characterLevel = stats.characterLevel || 5;
    $: skillList = Object.entries(stats.skills || {}).sort((a, b) => a[0].localeCompare(b[0]));
    
    // Initialize the grid
    $: {
        // Create a new array with characterLevel number of objects
        skillPointsByLevel = Array(characterLevel).fill().map(() => {
            // Create an object with all skills set to false
            const levelSkills = {};
            Object.keys(stats.skills || {}).forEach(skillName => {
                levelSkills[skillName] = false;
            });
            return levelSkills;
        });
        
        // Fill in existing skills from store
        if (stats.skills) {
            Object.entries(stats.skills).forEach(([skillName, skill]) => {
                const ranks = skill.ranks || 0;
                for (let i = 0; i < ranks && i < characterLevel; i++) {
                    skillPointsByLevel[i][skillName] = true;
                }
            });
        }
    }
    
    function countSelectedSkills(level) {
        return Object.values(skillPointsByLevel[level] || {}).filter(Boolean).length;
    }
    
    function toggleSkill(level, skillName) {
        const currentValue = skillPointsByLevel[level][skillName];
        const currentCount = countSelectedSkills(level);
        
        // Allow deselecting or selecting if we haven't reached the limit
        if (currentValue || (!currentValue && currentCount < availablePointsPerLevel)) {
            skillPointsByLevel[level][skillName] = !currentValue;
            skillPointsByLevel = [...skillPointsByLevel]; // Trigger reactivity
        }
    }
    
    function getSkillDisplayName(skillName) {
        return skillName
            .replace(/([A-Z])/g, ' $1')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    
    function saveSkillPoints() {
        // Calculate total ranks for each skill
        const newSkills = {};
        Object.entries(stats.skills).forEach(([skillName, skillInfo]) => {
            let ranks = 0;
            skillPointsByLevel.forEach(level => {
                if (level[skillName]) ranks++;
            });
            newSkills[skillName] = {
                ...skillInfo,
                ranks
            };
        });
        
        // Update the store
        character.updateSkills(newSkills);
        showAllocator = false;
    }

    function calculateTotalRanks() {
        let total = 0;
        skillPointsByLevel.forEach((level, index) => {
            total += countSelectedSkills(index);
        });
        return total;
    }
</script>

{#if showAllocator}
    <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div class="bg-[#fffef0] rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div class="p-4 border-b border-[#c19a6b]">
                <h2 class="text-xl font-bold text-[#c19a6b]">Allocate Skill Points</h2>
                <p class="text-sm text-gray-600 mt-1">
                    Each level you can allocate {availablePointsPerLevel} skill points
                    (Total Points Used: {calculateTotalRanks()})
                </p>
            </div>
            
            <div class="overflow-auto max-h-[calc(90vh-10rem)] p-4">
                <table class="w-full border-collapse">
                    <thead class="sticky top-0 bg-[#fffef0] z-10">
                        <tr>
                            <th class="text-left p-2">Skill</th>
                            {#each Array(characterLevel) as _, level}
                                <th class="p-2 text-center">
                                    Level {level + 1}<br>
                                    <span class="text-sm {countSelectedSkills(level) === availablePointsPerLevel ? 'text-red-500' : 'text-gray-600'}">
                                        {countSelectedSkills(level)}/{availablePointsPerLevel}
                                    </span>
                                </th>
                            {/each}
                        </tr>
                    </thead>
                    <tbody>
                        {#each skillList as [skillName, skill]}
                            <tr class:bg-yellow-50={skill.classSkill}>
                                <td class="p-2">
                                    {getSkillDisplayName(skillName)}
                                    {#if skill.classSkill}
                                        <span class="text-xs text-[#c19a6b] ml-1">(class)</span>
                                    {/if}
                                    <span class="text-xs text-gray-500 ml-1">({skill.ability.toUpperCase()})</span>
                                </td>
                                {#each Array(characterLevel) as _, level}
                                    {@const isSelected = skillPointsByLevel[level]?.[skillName]}
                                    {@const isDisabled = !isSelected && countSelectedSkills(level) >= availablePointsPerLevel}
                                    <td class="p-2 text-center">
                                        <button
                                            type="button"
                                            class="w-6 h-6 rounded border-2 transition-colors"
                                            class:bg-[#c19a6b]={isSelected}
                                            class:border-[#c19a6b]={!isSelected}
                                            class:cursor-not-allowed={isDisabled}
                                            on:click={() => toggleSkill(level, skillName)}
                                            disabled={isDisabled}
                                        />
                                    </td>
                                {/each}
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
            
            <div class="p-4 border-t border-[#c19a6b] flex justify-end gap-2">
                <button 
                    type="button"
                    class="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition-colors"
                    on:click={() => showAllocator = false}
                >
                    Cancel
                </button>
                <button 
                    type="button"
                    class="px-4 py-2 rounded bg-[#c19a6b] text-white hover:bg-[#a67b4b] transition-colors"
                    on:click={saveSkillPoints}
                >
                    Save Changes
                </button>
            </div>
        </div>
    </div>
{/if}