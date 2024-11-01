<script>
    import { character } from '$lib/stores/character';
    import { slide } from 'svelte/transition';
    import ResourceTracker from './ResourceTracker.svelte';
    
    $: consumables = $character?.consumables || {};
</script>

<section id="equipment">
    <h2 class="section-header w-full text-left">
        Equipment
    </h2>
        
    <div class="parchment-cell" transition:slide>
        <div class="mb-4">
            <strong>Equipment:</strong>
            <ul class="list-disc list-inside space-y-2 mt-2">
                <li>Mithral Chainshirt</li>
                <li>Masterwork Dagger</li>
                <li>Alchemist's Kit</li>
            </ul>
        </div>
        
        <div>
            <strong>Consumables:</strong>
            <div class="mt-2 space-y-2">
                {#each Object.entries(consumables) as [type, amount]}
                    <ResourceTracker
                        label={type.replace(/([A-Z])/g, ' $1').trim()}
                        total={amount}
                        used={0}
                        onToggle={() => {
                            character.updateConsumable(type, Math.max(0, amount - 1));
                        }}
                    />
                {/each}
            </div>
        </div>
    </div>
</section>