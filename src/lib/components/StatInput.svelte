<script>
    export let value;
    export let label = '';
    export let min = 0;
    export let max = undefined;
    export let className = '';
</script>

<div class="inline-flex items-center">
    {#if label}
        <span class="mr-2">{label}</span>
    {/if}
    <input
        type="number"
        {min}
        {max}
        bind:value
        class={`stat-input ${className}`}
    />
</div>