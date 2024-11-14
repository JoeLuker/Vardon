<script lang="ts">
    import { updateQueue } from '$lib/utils/updateQueue.svelte';
    import { character, updateHP } from '$lib/state/character.svelte';

    // Track update status
    let status = $state<'idle' | 'syncing' | 'error'>('idle');
    let error = $state<Error | null>(null);

    // Get values from shared state
    let currentHP = $derived(character.current_hp);
    let maxHP = $derived(character.max_hp);

    async function handleUpdate(newValue: number) {
        await updateQueue.enqueue({
            key: `hp-${character.id}`,
            execute: async () => {
                status = 'syncing';
                await updateHP(newValue);
                status = 'idle';
                error = null;
            },
            optimisticUpdate: () => {
                // State update handled in shared state
            },
            rollback: () => {
                error = new Error('Failed to update HP');
                status = 'error';
            }
        });
    }

    // Quick actions config
    const quickActions = $state.raw([
        { amount: -5, label: '-5' },
        { amount: -1, label: '-1' },
        { amount: 1, label: '+1' },
        { amount: 5, label: '+5' }
    ]);
</script>

<div class="card">
    <h2 class="mb-2 font-bold">Hit Points</h2>

    <!-- Quick action buttons -->
    <div class="mb-4 grid grid-cols-4 gap-2">
        {#each quickActions as { amount, label }}
            <button
                class="btn btn-secondary px-3 py-1 text-sm"
                onclick={() => {
                    handleUpdate(Math.max(0, Math.min(maxHP, currentHP + amount)));
                }}
                disabled={status === 'syncing' || 
                         (amount < 0 ? currentHP <= 0 : currentHP >= maxHP)}
            >
                {label}
            </button>
        {/each}
    </div>

    <!-- HP display -->
    <div class="flex items-center gap-2">
        <div class="text-2xl font-bold">{currentHP}</div>
        <span class="text-gray-600">/ {maxHP}</span>
    </div>
</div>