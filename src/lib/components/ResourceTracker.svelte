<script lang="ts">
    let { label = '', total = 0, used = 0, onToggle } = $props<{
        label: string;
        total: number;
        used: number;
        onToggle: (remaining: number) => void;
    }>();

    let hoveredIndex = $state<number | null>(null);
    let available = $derived(total - used);
    let squares = $derived(Array(total).fill(null));

    function handleClick(index: number) {
        const remaining = total - index - 1;
        onToggle(remaining);
    }
</script>

<div class="card space-y-2">
    <div class="flex justify-between items-center">
        <span class="text-primary font-semibold">{label}</span>
        <span class="text-sm text-primary/80">{available} remaining</span>
    </div>
    
    <div class="flex flex-wrap gap-1">
        {#each squares as _, i}
            <button
                class="w-8 h-8 border-2 rounded-md transition-all duration-200 
                       focus:outline-none focus:ring-2 focus:ring-primary/50
                       {i < used ? 'bg-primary border-primary' : 'border-primary hover:border-primary-dark'}
                       {hoveredIndex === i ? 'scale-110' : ''}
                       active:scale-95"
                onmouseenter={() => hoveredIndex = i}
                onmouseleave={() => hoveredIndex = null}
                onclick={() => handleClick(i)}
                aria-label={i < used ? 'Mark as unused' : 'Mark as used'}
            ></button>
        {/each}
    </div>
</div>