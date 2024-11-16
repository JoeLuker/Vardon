<script lang="ts">
    import type { PageData } from './$types';
    
    let { data } = $props<{ data: PageData }>();
</script>

<div class="space-y-6 py-8">
    <h1 class="text-3xl font-bold text-parchment-100">Character Selection</h1>
    
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {#each data.characters as character}
            <a 
                href="/characters/{character.id}" 
                class="card hover:bg-parchment-300/95 transition-colors"
            >
                <div class="space-y-2">
                    <h2 class="text-xl font-bold">{character.name}</h2>
                    <div class="text-sm text-ink/80">
                        <span>Level {character.level}</span>
                        <span class="mx-2">•</span>
                        <span>{character.ancestry} {character.class}</span>
                    </div>
                </div>
            </a>
        {/each}
    </div>
</div>
