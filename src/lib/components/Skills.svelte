<script lang="ts">
    import { skills } from '$lib/stores';
    import { slide } from 'svelte/transition';
    import SkillAllocator from './SkillAllocator.svelte';
    import type { SkillName } from '$lib/types/character';
    import { SKILL_ABILITIES, CLASS_SKILLS } from '$lib/stores/constants';
    import { derived } from 'svelte/store';

    let showSkillAllocator = false;
    let skillSearchQuery = '';

    $: skillsData = $skills.skills || {};
    $: skillErrors = $skills.errors || [];

    // Derive skill bonuses from skills store
    const skillBonuses = derived(skills, ($skills) => {
        const bonuses: Record<string, {
            total: number;
            ranks: number;
            abilityMod: number;
            classSkillBonus: number;
            breadthOfKnowledgeBonus: number;
        }> = {};

        Object.entries($skills.skills || {}).forEach(([name, skill]) => {
            const ranks = skill.ranks || 0;
            const classSkillBonus = (skill.classSkill && ranks > 0) ? 3 : 0;
            const breadthOfKnowledgeBonus = ranks > 0 ? 2 : 0; // Assuming Breadth of Knowledge feat
            const abilityMod = 0; // This should be calculated from attributes store

            bonuses[name] = {
                ranks,
                abilityMod,
                classSkillBonus,
                breadthOfKnowledgeBonus,
                total: ranks + abilityMod + classSkillBonus + breadthOfKnowledgeBonus
            };
        });

        return bonuses;
    });

    $: filteredSkills = Object.entries(skillsData).filter(([name]) => 
        name.toLowerCase().includes(skillSearchQuery.toLowerCase())
    );

    function formatModifier(num: number): string {
        return num >= 0 ? `+${num}` : num.toString();
    }

    function getSkillTooltip(skillName: string, skillData: typeof $skillBonuses[string]): string {
        if (!skillData) return '';
        
        const parts = [
            `Ranks: ${skillData.ranks}`,
            `Ability (${SKILL_ABILITIES[skillName as SkillName].toUpperCase()}): ${formatModifier(skillData.abilityMod)}`
        ];

        if (skillData.classSkillBonus) parts.push(`Class Skill: +${skillData.classSkillBonus}`);
        if (skillData.breadthOfKnowledgeBonus) parts.push(`Breadth of Knowledge: +${skillData.breadthOfKnowledgeBonus}`);

        return parts.join('\n');
    }

    function closeSkillAllocator() {
        showSkillAllocator = false;
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            closeSkillAllocator();
        }
    }
</script>

<section id="skills" class="mb-8">
    <h2 class="section-header w-full text-left">Skills</h2>

    <div class="stats-container">
        <div class="flex items-center justify-between mb-4">
            <input
                type="text"
                placeholder="Search skills..."
                bind:value={skillSearchQuery}
                class="search-input"
            />
            <button
                class="text-sm text-[#c19a6b] hover:text-[#a67b4b] ml-4"
                on:click={() => (showSkillAllocator = true)}
            >
                Allocate Skills
            </button>
        </div>

        {#if skillErrors.length > 0}
            <div class="mb-4 p-2 bg-red-100 text-red-700 rounded">
                {#each skillErrors as error}
                    <p>{error}</p>
                {/each}
            </div>
        {/if}

        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            {#each filteredSkills as [skillName, skill]}
                {@const skillBonus = $skillBonuses[skillName]}
                <div class="skill-row group relative" transition:slide>
                    <span class="capitalize flex-1">
                        {skillName.replace(/([A-Z])/g, ' $1').trim()}
                        {#if skill.classSkill}
                            <span class="class-skill-badge">class</span>
                        {/if}
                        {#if skill.ability}
                            <span class="ability-badge">({skill.ability.toUpperCase()})</span>
                        {/if}
                    </span>
                    <span class="font-mono ml-2">
                        {formatModifier(skillBonus?.total || 0)}
                        {#if skillBonus?.ranks > 0}
                            <span class="rank-badge">({skillBonus.ranks} ranks)</span>
                        {/if}
                    </span>
                    <div class="tooltip-content">
                        {getSkillTooltip(skillName, skillBonus)}
                    </div>
                </div>
            {/each}
        </div>
    </div>

    {#if showSkillAllocator}
        <div 
            class="modal-backdrop"
            on:click|self={closeSkillAllocator}
            on:keydown={handleKeydown}
            role="dialog"
            aria-modal="true"
            aria-labelledby="skill-allocator-title"
        >
            <SkillAllocator 
                showAllocator={true} 
                on:close={closeSkillAllocator} 
            />
        </div>
    {/if}
</section>

<style lang="postcss">
    .stats-container {
        @apply bg-amber-50 rounded-lg p-6 shadow-lg;
    }

    .search-input {
        @apply px-3 py-1 rounded border border-gray-300 focus:border-[#c19a6b] 
        focus:ring-1 focus:ring-[#c19a6b] outline-none;
    }

    .skill-row {
        @apply flex items-center justify-between p-2 rounded hover:bg-gray-50 flex-wrap gap-1;
    }

    .class-skill-badge {
        @apply text-xs text-[#c19a6b] ml-1 px-1.5 py-0.5 rounded-full border border-[#c19a6b] inline-block;
    }

    .ability-badge {
        @apply text-xs text-gray-500 ml-1;
    }

    .rank-badge {
        @apply text-xs text-gray-500 ml-1;
    }

    .tooltip-content {
        @apply invisible group-hover:visible absolute z-10 bg-gray-800 text-white
        rounded p-2 text-sm whitespace-pre-line top-full left-0 mt-1;
    }

    .modal-backdrop {
        @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
    }
</style>