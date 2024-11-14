<script lang="ts">
    let { label = '', total = 0, used = 0, onToggle } = $props<{
        label: string;
        total: number;
        used: number;
        onToggle: (remaining: number) => void;
    }>();

    let hoveredIndex = $state<number | null>(null);
    let available = $derived(total - used);
    
    // Initialize slots array
    let usedSlots = $state(Array(total).fill(false));

    // Watch for used prop changes
    $effect(() => {
        // Update slots when 'used' prop changes
        const newSlots = Array(total).fill(false);
        for (let i = 0; i < used; i++) {
            newSlots[i] = true;
        }
        usedSlots = newSlots;
    });

    function handleClick(index: number) {
        // Simply toggle the clicked slot
        const newUsedSlots = [...usedSlots];
        newUsedSlots[index] = !newUsedSlots[index];
        usedSlots = newUsedSlots;
        
        // Calculate and report remaining slots
        const newUsed = newUsedSlots.filter(Boolean).length;
        onToggle(total - newUsed);
    }

</script>

<div class="card space-y-2">
    <div class="flex justify-between items-center">
        {#if label}
            <span class="text-primary font-semibold">{label}</span>
            <span class="text-sm text-primary/80">{available} remaining</span>
        {/if}
    </div>
    
    <div class="flex flex-wrap gap-1">
        {#each usedSlots as isUsed, i}
            <button
                class="w-8 h-8 border-2 rounded-md transition-all duration-200 
                       focus:outline-none focus:ring-2 focus:ring-primary/50
                       {isUsed ? 'bg-primary border-primary' : 'border-primary hover:border-primary-dark'}
                       {hoveredIndex === i ? 'scale-110' : ''}
                       active:scale-95"
                onmouseenter={() => hoveredIndex = i}
                onmouseleave={() => hoveredIndex = null}
                onclick={() => handleClick(i)}
                aria-label={`Toggle spell slot ${i + 1} (currently ${isUsed ? 'used' : 'available'})`}
            ></button>
        {/each}
    </div>
</div>