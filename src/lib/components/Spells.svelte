<script>
    import { character } from '$lib/stores/character';
    import { slide } from 'svelte/transition';
    import SpellSlots from './SpellSlots.svelte';
    
    $: knownSpells = $character?.knownSpells || {
        1: ['Comprehend Languages', 'Detect Secret Doors', 'Endure Elements', 'Identify'],
        2: ['Cure Moderate Wounds', 'Delay Poison']
    };
</script>

<section id="spells">
    <h2 class="section-header w-full text-left">
        Spells
    </h2>
    
    <SpellSlots />
</section>