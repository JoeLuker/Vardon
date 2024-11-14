<script lang="ts">
    import { character } from '$lib/state/character.svelte';
    import type { CharacterDiscovery } from '$lib/types/character';

    interface TransformedDiscovery extends CharacterDiscovery {
        displayName: string;
    }

    // Transform discoveries for display
    let discoveryList = $derived(
        (character.character_discoveries ?? []).map((discovery: CharacterDiscovery): TransformedDiscovery => ({
            ...discovery,
            displayName: discovery.discovery_name
                .replace(/([A-Z])/g, ' $1')
                .split(' ')
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')
        }))
    );
</script>

<div class="card">
    <h2 class="mb-4 font-bold">Discoveries</h2>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        {#each discoveryList as discovery (discovery.discovery_name)}
            <div class="rounded bg-gray-50 p-3 hover:bg-gray-100">
                <div class="font-medium">{discovery.displayName}</div>
                <div class="text-xs text-gray-500">
                    Selected at level {discovery.selected_level}
                </div>
                {#if discovery.properties}
                    <div class="mt-1 text-sm text-gray-600">
                        {#each Object.entries(discovery.properties) as [key, value]}
                            <div>{key}: {value}</div>
                        {/each}
                    </div>
                {/if}
            </div>
        {/each}
    </div>
</div>