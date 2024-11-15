<!-- src/routes/admin/+page.svelte -->
<script lang="ts">
    import { character, initializeCharacter } from '$lib/state/character.svelte';
    import AttributesManager from '$lib/components/admin/AttributesManager.svelte';
    import FeatsManager from '$lib/components/admin/FeatsManager.svelte';
    import DiscoveriesManager from '$lib/components/admin/DiscoveriesManager.svelte';
    import ClassFeaturesManager from '$lib/components/admin/ClassFeaturesManager.svelte';
    import type { PageData } from './$types';

    
    let { data } = $props<{ data: PageData }>();
    let activeTab = $state('attributes');

    // Initialize character data
    $effect(() => {
        if (data.character) {
            initializeCharacter(data.character);
        }
    });

    const tabs = [
        { id: 'attributes', label: 'Attributes' },
        { id: 'features', label: 'Class Features' },
        { id: 'feats', label: 'Feats' },
        { id: 'discoveries', label: 'Discoveries' },
        { id: 'skills', label: 'Skills & Abilities' },
        { id: 'equipment', label: 'Equipment' },
        { id: 'spells', label: 'Spells & Extracts' }
    ];
</script>

<div class="p-4 max-w-7xl mx-auto">
    <div class="card mb-6">
        <h1 class="text-2xl font-bold">Character Administration</h1>
        <p class="text-gray-600">
            Manage {character.name}'s attributes, features, and abilities
        </p>
    </div>

    <div class="flex gap-2 mb-6" role="tablist">
        {#each tabs as tab}
            <button
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                id={`tab-${tab.id}`}
                class="px-4 py-2 rounded-lg {activeTab === tab.id ? 
                    'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'}"
                onclick={() => activeTab = tab.id}
            >
                {tab.label}
            </button>
        {/each}
    </div>

    <div class="card">
        {#if activeTab === 'attributes'}
            <div 
                role="tabpanel"
                id="panel-attributes"
                aria-labelledby="tab-attributes"
            >
                <AttributesManager />
            </div>
        {:else if activeTab === 'features'}
            <div 
                role="tabpanel"
                id="panel-features"
                aria-labelledby="tab-features"
            >
                <ClassFeaturesManager />
            </div>
        {:else if activeTab === 'feats'}
            <div 
                role="tabpanel"
                id="panel-feats"
                aria-labelledby="tab-feats"
            >
                <FeatsManager />
            </div>
        {:else if activeTab === 'discoveries'}
            <div 
                role="tabpanel"
                id="panel-discoveries"
                aria-labelledby="tab-discoveries"
            >
                <DiscoveriesManager />
            </div>
        {:else}
            <div 
                role="tabpanel"
                id="panel-{activeTab}"
                aria-labelledby="tab-{activeTab}"
            >
                <div class="p-4">
                    Content for {activeTab} tab coming soon...
                </div>
            </div>
        {/if}
    </div>
</div>