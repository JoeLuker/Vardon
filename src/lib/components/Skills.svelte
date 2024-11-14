<script lang="ts">
    import { slide } from 'svelte/transition';
    import { updateQueue } from '$lib/utils/updateQueue.svelte';
    import SkillAllocator from './SkillAllocator.svelte';
    import { character, updateSkillRank } from '$lib/state/character.svelte';
    import type { BaseSkill } from '$lib/types/character';

    let showSkillAllocator = $state(false);
    let status = $state<'idle' | 'syncing'>('idle');

    // Local derivations
    let baseSkills = $derived(character.base_skills ?? []);
    let skillRanks = $derived(character.character_skill_ranks ?? []);
    let classSkillRelations = $derived(character.class_skill_relations ?? []);

    $effect(() => {
        console.log('Skills data:', {
            baseSkills,
            skillRanks,
            classSkillRelations
        });
    });

    interface EnhancedSkill extends BaseSkill {
        ranks: number;
        isClassSkill: boolean;
    }

    let skillsList = $derived<EnhancedSkill[]>(
        baseSkills.map((baseSkill) => ({
            ...baseSkill,
            ranks: skillRanks.find(rank => rank.skill_id === baseSkill.id)?.ranks ?? 0,
            isClassSkill: classSkillRelations.some(
                relation => relation.skill_id === baseSkill.id
            )
        }))
    );

    let characterId = $derived(character.id);

    async function handleSkillSave(updates: Record<number, number>) {
        // Store previous state for rollback
        const previousRanks = [...skillRanks];

        await updateQueue.enqueue({
            key: `skills-${character.id}`,
            execute: async () => {
                status = 'syncing';
                // Update each skill rank
                for (const [skillId, ranks] of Object.entries(updates)) {
                    await updateSkillRank(Number(skillId), ranks);
                }
                status = 'idle';
            },
            optimisticUpdate: () => {
                if (character.character_skill_ranks) {
                    // Update ranks for each skill
                    Object.entries(updates).forEach(([skillId, ranks]) => {
                        const rankEntry = character.character_skill_ranks?.find(
                            r => r.skill_id === Number(skillId)
                        );
                        if (rankEntry) {
                            rankEntry.ranks = ranks;
                        } else {
                            // Create new rank entry if it doesn't exist
                            character.character_skill_ranks?.push({
                                character_id: character.id,
                                skill_id: Number(skillId),
                                ranks,
                                id: -1, // Temporary ID
                                updated_at: new Date().toISOString(),
                                sync_status: 'pending'
                            });
                        }
                    });
                }
            },
            rollback: () => {
                // Restore previous skill states
                if (character.character_skill_ranks) {
                    character.character_skill_ranks = previousRanks;
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
        {#each skillsList as skill (skill.id)}
            <div
                class="flex items-center justify-between rounded bg-gray-50 p-3 hover:bg-gray-100"
                class:border-l-4={skill.isClassSkill}
                class:border-primary={skill.isClassSkill}
            >
                <div>
                    <span class="font-medium">{skill.name}</span>
                    <div class="space-x-1 text-xs">
                        <span class="text-gray-500">({skill.ability.toUpperCase()})</span>
                        {#if skill.isClassSkill}
                            <span class="text-primary">Class Skill</span>
                        {/if}
                        {#if skill.trained_only}
                            <span class="text-warning">Trained Only</span>
                        {/if}
                        {#if skill.armor_check_penalty}
                            <span class="text-error">Armor Check</span>
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
                skills={skillsList}
                onSave={handleSkillSave} 
            />
        </div>
    </div>
{/if}