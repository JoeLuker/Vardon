<script lang="ts">
    import CharacterHeader from '$lib/ui/CharacterHeader.svelte';
    import HPTracker from '$lib/ui/HPTracker.svelte';
    import Attributes from '$lib/ui/Attributes.svelte';
    import Skills from '$lib/ui/Skills.svelte';
    import CombatStats from '$lib/ui/CombatStats.svelte';
    import Consumables from '$lib/ui/Consumables.svelte';
    import BuffManager from '$lib/ui/BuffManager.svelte';
    import SpellManager from '$lib/ui/SpellManager.svelte';
    import ClassFeatures from '$lib/ui/ClassFeatures.svelte';
    import Discoveries from '$lib/ui/Discoveries.svelte';
    import Feats from '$lib/ui/Feats.svelte';
    import ABPDisplay from '$lib/ui/ABPDisplay.svelte';
    import Traits from '$lib/ui/Traits.svelte';
    import { initializeCharacter } from '$lib/state/character.svelte';
    import AncestryDisplay from '$lib/ui/AncestryDisplay.svelte';
    import Equipment from '$lib/ui/Equipment.svelte';
    import CorruptionViewer from '$lib/ui/CorruptionViewer.svelte';
    import type { PageData } from './$types';

    let { data } = $props<{ data: PageData }>();
    let characterId = data.character?.id;

    let initialized = $state(false);

        $effect(() => {
        if (data.character) {
            try {
                initializeCharacter(data.character); // sets the global $state
                initialized = true;
            } catch (error) {
                console.error('❌ Failed to initialize character:', error);
            }
        }
    });

</script>

{#if characterId && initialized}
    <div class="mx-auto max-w-7xl p-2 sm:p-4">
        <div class="grid gap-3">
            <CharacterHeader characterId={characterId} />
            <HPTracker 
                characterId={characterId}
            />
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div class="lg:col-span-1">
                    <Attributes characterId={characterId} />
                </div>
                <div class="lg:col-span-2">
                    <Skills characterId={characterId} />
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <CombatStats characterId={characterId}/>
                <BuffManager characterId={characterId} />
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div class="grid grid-cols-1 gap-3">
                    <SpellManager characterId={characterId}/>
                    <Consumables characterId={characterId}/>
                </div>
                <div class="grid grid-cols-1 gap-3">
                    <ClassFeatures characterId={characterId}/>
                    <Discoveries characterId={characterId} />
                    <Feats characterId={characterId}/>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <ABPDisplay characterId={characterId}/>
                <AncestryDisplay characterId={characterId}/>
                <Traits characterId={characterId}/>
                <CorruptionViewer characterId={characterId}/>
                <Equipment characterId={characterId}/>
            </div>
        </div>
    </div>
{:else}
    <div class="flex items-center justify-center h-screen">
        <p>Loading character data...</p>
    </div>
{/if}