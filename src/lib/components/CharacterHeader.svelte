<script lang="ts">
    import { character } from '$lib/state/character.svelte';

    let name = $derived(character.name);
    let race = $derived(character.race);
    let characterClass = $derived(character.class);
    let level = $derived(character.level);
</script>

<div class="rounded bg-white p-4 shadow">
    <h1 class="text-2xl font-bold">{name}</h1>
    <div class="text-gray-600">
        Level {level}
        {race}
        {characterClass}
    </div>
</div>