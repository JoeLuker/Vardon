<!-- src/routes/+page.svelte -->
<script lang="ts">
    import CharacterHeader from '$lib/components/CharacterHeader.svelte';
    import HPTracker from '$lib/components/HPTracker.svelte';
    import Attributes from '$lib/components/Attributes.svelte';
    import Skills from '$lib/components/Skills.svelte';
    import CombatStats from '$lib/components/CombatStats.svelte';
    import Consumables from '$lib/components/Consumables.svelte';
    import BuffManager from '$lib/components/BuffManager.svelte';
    import SpellManager from '$lib/components/SpellManager.svelte';
    import ClassFeatures from '$lib/components/ClassFeatures.svelte';
    import Discoveries from '$lib/components/Discoveries.svelte';
    import Feats from '$lib/components/Feats.svelte';
    import ABPDisplay from '$lib/components/ABPDisplay.svelte';
    import Traits from '$lib/components/Traits.svelte';
    import { initializeCharacter } from '$lib/state/character.svelte';
    import type { Character } from '$lib/types/character';
    import AncestryDisplay from '$lib/components/AncestryDisplay.svelte';
    import Equipment from '$lib/components/Equipment.svelte';
    import CorruptionViewer from '$lib/components/CorruptionViewer.svelte';

    let { data } = $props<{ data: { character: Character } }>();

    try {
        initializeCharacter(data.character);
    } catch (error) {
        console.error('Failed to initialize character:', error);
    }
</script>

<div class="mx-auto max-w-7xl p-2 sm:p-4">
    <div class="grid gap-3">
        <!-- Character Overview -->
        <CharacterHeader />
        <HPTracker />
        
        <!-- Core Stats Section -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div class="lg:col-span-1">
                <Attributes />
                <Equipment />
            </div>
            <div class="lg:col-span-2">
                <Skills />
            </div>
        </div>

        <!-- Combat & Active Effects -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <CombatStats />
            <BuffManager />
        </div>

        <!-- Character Abilities -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div class="grid grid-cols-1 gap-3">
                <SpellManager />
                <Consumables />
            </div>
            <div class="grid grid-cols-1 gap-3">
                <ClassFeatures />
                <Discoveries />
                <Feats />
            </div>
        </div>

        <!-- Character Details -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <ABPDisplay />
            <AncestryDisplay />
            <Traits />
            <CorruptionViewer />
        </div>
    </div>
</div>