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
    import { initializeCharacter } from '$lib/state/character.svelte';
    import type { Character } from '$lib/types/character';

    let { data } = $props<{ data: { character: Character } }>();

    try {
        initializeCharacter(data.character);
    } catch (error) {
        console.error('Failed to initialize character:', error);
    }
</script>

<div class="mx-auto max-w-7xl p-2 sm:p-4">
    <div class="grid gap-3">
        <CharacterHeader />
        <HPTracker />
        
        <!-- Combat Section -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
            <CombatStats />
            <BuffManager />
        </div>

        <!-- Attributes & Skills -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Attributes />
            <Skills />
        </div>

        <!-- Alchemy Section -->
        <div class="grid grid-cols-1 lg:grid-cols-1 gap-3">
            <Consumables />
        </div>

        <SpellManager />

        <!-- Character Features -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <ClassFeatures />
            <div class="grid grid-cols-1 gap-3">
                <Discoveries />
                <Feats />
                <ABPDisplay />
            </div>
        </div>
    </div>
</div>