<script lang="ts">
    import { slide } from 'svelte/transition';
    import { updateQueue } from '$lib/utils/updateQueue.svelte';
    import SkillAllocator from './SkillAllocator.svelte';
    import { character, updateSkills } from '$lib/state/character.svelte';

    let showSkillAllocator = $state(false);
    let status = $state<'idle' | 'syncing'>('idle');

    // Local derivations
    let characterSkills = $derived(character.character_skills ?? []);

    let skillsList = $derived(
        characterSkills.map((skill) => ({
            ...skill,
            displayName: formatSkillName(skill.skill_name)
        }))
    );

    let characterId = $derived(character.id);

    // Helper function to format skill names
    function formatSkillName(name: string): string {
        return name
            .replace(/([A-Z])/g, ' $1')
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    async function handleSkillSave(newRanks: Record<string, number>) {
        // Store previous state for rollback
        const previousSkills = characterSkills.map(skill => ({ 
            ...skill 
        }));

        await updateQueue.enqueue({
            key: `skills-${character.id}`,
            execute: async () => {
                status = 'syncing';
                await updateSkills(newRanks);
                status = 'idle';
            },
            optimisticUpdate: () => {
                if (character.character_skills) {
                    // Update ranks for each skill
                    Object.entries(newRanks).forEach(([skillName, ranks]) => {
                        const skill = character.character_skills?.find(
                            s => s.skill_name === skillName
                        );
                        if (skill) {
                            skill.ranks = ranks;
                        }
                    });
                }
            },
            rollback: () => {
                // Restore previous skill states
                if (character.character_skills) {
                    character.character_skills = previousSkills;
                }
            }
        });

        showSkillAllocator = false;
    }
</script>

<section class="card" transition:slide>
    <div class="mb-6 flex items-center justify-between">
        <h2 class="text-xl font-bold">Skills</h2>
        <button 
            class="btn" 
            onclick={() => (showSkillAllocator = true)}
            type="button"
            disabled={status === 'syncing'}
        >
            Manage Skills
        </button>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {#each skillsList as skill (skill.skill_name)}
            <div
                class="flex items-center justify-between rounded bg-gray-50 p-3 hover:bg-gray-100"
                class:border-l-4={skill.class_skill}
                class:border-primary={skill.class_skill}
            >
                <div>
                    <span class="font-medium">{skill.displayName}</span>
                    <div class="space-x-1 text-xs">
                        <span class="text-gray-500">({skill.ability.toUpperCase()})</span>
                        {#if skill.class_skill}
                            <span class="text-primary">Class Skill</span>
                        {/if}
                        {#if skill.ranks > 0}
                            <span class="text-gray-500">{skill.ranks} ranks</span>
                        {/if}
                    </div>
                </div>
            </div>
        {/each}
    </div>
</section>

{#if showSkillAllocator}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        role="dialog"
        aria-labelledby="skill-allocator-title"
    >
        <button
            class="absolute inset-0 h-full w-full"
            onclick={() => (showSkillAllocator = false)}
            onkeydown={(e) => e.key === 'Escape' && (showSkillAllocator = false)}
            aria-label="Close skill allocator"
        ></button>
        <div
            class="card relative max-h-[90vh] w-full max-w-4xl overflow-hidden"
        >
            <SkillAllocator 
                {characterId}
                skills={characterSkills}
                onSave={handleSkillSave} 
            />
        </div>
    </div>
{/if}