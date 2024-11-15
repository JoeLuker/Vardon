<script lang="ts">
    import '../app.css';
    import NetworkStatusIndicator from '$lib/components/NetworkStatusIndicator.svelte';
    import type { Snippet } from 'svelte';

    let { children } = $props<{
        children?: Snippet | undefined;
    }>();
</script>

<div class="min-h-screen bg-woodgrain text-ink">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {@render children?.()}
    </div>
    <NetworkStatusIndicator />
</div>

<style lang="postcss">
    /* Base styles */
    :global(body) {
        @apply antialiased font-serif bg-[#4a1f10];
    }

    /* Card styles */
    :global(.card) {
        @apply relative rounded-lg border border-primary-300/10 
               bg-parchment-200/95 p-4 shadow-lg;
    }
</style>