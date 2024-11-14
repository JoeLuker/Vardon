<script lang="ts">
    import '../app.css';
    import NetworkStatusIndicator from '$lib/components/NetworkStatusIndicator.svelte';
    import type { Snippet } from 'svelte';

    let { children } = $props<{
        children?: Snippet | undefined;
    }>();
</script>

<div class="woodgrain-bg min-h-screen text-gray-800">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {@render children?.()}
    </div>
    <NetworkStatusIndicator />
</div>

<style lang="postcss">
    @property --grain-alpha {
        syntax: '<number>';
        initial-value: 0;
        inherits: false;
    }

    @property --wood-mix {
        syntax: '<percentage>';
        initial-value: 0%;
        inherits: false;
    }

    :global(body) {
        @apply antialiased font-serif;
    }

    :global(:root) {
        @apply text-gray-800;
    }

    :global(.woodgrain-bg) {
        background-color: theme(colors.primary.light);
        @apply relative;
        
        &::before {
            content: "";
            @apply absolute inset-0 pointer-events-none;
            background-image: 
                repeating-linear-gradient(
                    85deg,
                    rgba(0,0,0,0.03) 0px,
                    transparent 4px,
                    rgba(0,0,0,0.03) 8px
                ),
                repeating-linear-gradient(
                    175deg,
                    rgba(0,0,0,0.02) 0px,
                    transparent 4px,
                    rgba(0,0,0,0.02) 8px
                );
            opacity: 0.6;
        }
    }

    :global(.card) {
        @apply backdrop-blur-md bg-white/90;
    }
</style>