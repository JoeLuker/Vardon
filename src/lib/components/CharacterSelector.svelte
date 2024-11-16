<script lang="ts">
    import { goto } from '$app/navigation';
    import type { Character } from '$lib/types/character';

    let { characters } = $props<{
        characters: Pick<Character, 'id' | 'name' | 'class' | 'ancestry' | 'level'>[]
    }>();

    function handleCharacterSelect(id: number) {
        goto(`/character/${id}`);
    }
</script>

<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {#each characters as character (character.id)}
        <button
            class="card hover:bg-gray-50 transition-colors p-6 text-left"
            onclick={() => handleCharacterSelect(character.id)}
        >
            <h2 class="text-xl font-bold text-primary mb-2">{character.name}</h2>
            <div class="text-gray-600">
                <div>Level {character.level}</div>
                <div>{character.ancestry} {character.class}</div>
            </div>
        </button>
    {/each}

    <a 
        href="/character/new" 
        class="card hover:bg-gray-50 transition-colors p-6 text-center flex flex-col items-center justify-center gap-2"
    >
        <div class="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span class="text-2xl text-primary">+</span>
        </div>
        <span class="text-primary font-medium">Create New Character</span>
    </a>
</div> 