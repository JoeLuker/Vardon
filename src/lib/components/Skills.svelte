<!-- src/lib/components/<YourComponent>.svelte -->
    <script lang="ts">
        import { slide } from 'svelte/transition';
        import type { UpdateState } from '$lib/utils/updates';
        import SkillAllocator from './SkillAllocator.svelte';
        import { getCharacter, fetchSkillData } from '$lib/state/character.svelte';
        import { calculateCharacterStats, type CalculatedStats } from '$lib/utils/characterCalculations';
        import { onMount } from 'svelte';
        import { page } from '$app/stores';
    
        type SkillData = CalculatedStats['skills']['byName'][string];
    
        let { characterId } = $props<{
            characterId: number;
        }>();
    
        let showSkillAllocator = $state(false);
        let updateState = $state<UpdateState>({
            status: 'idle',
            error: null
        });
        let isLoading = $state(true);
    
        // Derive the character from state
        let character = $derived(getCharacter(characterId));
    
        // Derive stats by recalculating each time 'character' changes
        let stats = $derived.by(() => calculateCharacterStats(character));
    
        onMount(() => {
            // Load skill data
            fetchSkillData(characterId)
                .catch(error => {
                    console.error('Failed to load skill data:', error);
                    updateState.error = error instanceof Error ? error : new Error('Failed to load skills');
                })
                .finally(() => {
                    isLoading = false;
                });
        });
    </script>
    
    <section class="card" transition:slide>
        <div class="mb-6 flex items-center justify-between">
            <h2 class="text-xl font-bold">Skills</h2>
            <button 
                class="btn" 
                onclick={() => (showSkillAllocator = true)}
                type="button"
                disabled={updateState.status === 'syncing' || isLoading}
            >
                {#if updateState.status === 'syncing'}
                    <div class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                {/if}
                Manage Skills
            </button>
        </div>
    
        {#if isLoading}
            <div class="flex justify-center py-8">
                <div class="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>
        {:else}
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {#each Object.entries(stats.skills.byName) as [name, skill]}
                    {@const typedSkill = skill as SkillData}
                    <div
                        class="flex items-center justify-between rounded bg-gray-50 p-3 hover:bg-gray-100"
                        class:border-l-4={typedSkill.classSkill}
                        class:border-primary={typedSkill.classSkill}
                    >
                        <div>
                            <span class="font-medium">{name}</span>
                            <div class="space-x-1 text-xs">
                                <span class="text-gray-500">({typedSkill.ability})</span>
                                {#if typedSkill.classSkill}
                                    <span class="text-primary">Class Skill</span>
                                {/if}
                                {#if typedSkill.ranks.total > 0}
                                    <span class="text-gray-500">{typedSkill.ranks.total} ranks</span>
                                {/if}
                            </div>
                        </div>
                        <div class="text-lg font-bold">
                            {typedSkill.total >= 0 ? '+' : ''}{typedSkill.total}
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    
        {#if updateState.error}
            <div class="mt-4 rounded-md bg-accent/10 p-4 text-sm text-accent">
                Failed to update skills. Please try again.
            </div>
        {/if}
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
            <div class="card relative max-h-[90vh] w-full max-w-4xl overflow-hidden">
                <!-- Use characterId directly as before, assuming you have a page param -->
                <SkillAllocator 
                    characterId={parseInt($page.params.id)} 
                    onClose={() => showSkillAllocator = false} 
                />
            </div>
        </div>
    {/if}
    