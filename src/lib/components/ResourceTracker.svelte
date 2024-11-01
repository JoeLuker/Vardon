<script>
    export let label = '';
    export let total = 0;
    export let used = 0;
    export let onToggle = (index) => {};
    
    $: available = total - used;
    $: squares = [...Array(total)];
</script>

<div class="resource-tracker">
    <div class="flex justify-between items-center mb-1">
        <span class="text-[#c19a6b] font-semibold">{label}</span>
        <span class="text-sm text-[#c19a6b]">{available} remaining</span>
    </div>
    <div class="flex flex-wrap gap-1">
        {#each squares as _, i}
            <button
                class="w-8 h-8 border-2 border-[#c19a6b] rounded transition-colors"
                class:bg-[#c19a6b]={i < used}
                on:click={() => onToggle(total - i - 1)}
                aria-label={i < used ? 'Used' : 'Available'}
            >
            </button>
        {/each}
    </div>
</div>

<style>
    .resource-tracker {
        @apply p-2 bg-[#fffef0] rounded-lg shadow-sm mb-4;
    }
    
    button {
        @apply hover:border-[#8b6d4b] active:scale-95 disabled:opacity-50;
    }
    
    @media (max-width: 640px) {
        button {
            @apply w-6 h-6;
        }
    }
</style>