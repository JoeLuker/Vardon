<script lang="ts">
    import { updateQueue } from '$lib/utils/updateQueue.svelte';
    import { supabase } from '$lib/supabaseClient';
    import { browser } from '$app/environment';

    let { characterId, currentHP = $bindable(0), maxHP } = $props<{
        characterId: number;
        currentHP: number;
        maxHP: number;
    }>();

    // Track update status
    let status = $state<'idle' | 'syncing' | 'error'>('idle');
    let error = $state<Error | null>(null);

    // Subscribe to realtime updates
    $effect(() => {
        if (!browser) return;

        const channel = supabase
            .channel(`hp-${characterId}`)
            .on(
                'postgres_changes' as 'system',
                {
                    event: '*',
                    schema: 'public',
                    table: 'characters',
                    filter: `id=eq.${characterId}`
                },
                (payload: { new: { current_hp: number } }) => {
                    if (status !== 'syncing') {
                        currentHP = payload.new.current_hp;
                    }
                }
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    });

    async function handleUpdate(newValue: number) {
        await updateQueue.enqueue({
            // Use a key to prevent duplicate updates
            key: `hp-${characterId}`,
            
            // Function that performs the actual update
            execute: async () => {
                status = 'syncing';
                const { error: dbError } = await supabase
                    .from('characters')
                    .update({ current_hp: newValue })
                    .eq('id', characterId);

                if (dbError) throw dbError;
                status = 'idle';
                error = null;
            },
            
            // Optimistic update
            optimisticUpdate: () => {
                currentHP = newValue;
            },
            
            // Rollback if the update fails
            rollback: () => {
                currentHP = currentHP;
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
    <!-- Status indicator -->
    {#if status !== 'idle'}
        <div class="absolute right-2 top-2">
            {#if status === 'syncing'}
                <div class="text-xs text-gray-500">Syncing...</div>
            {:else if status === 'error'}
                <div class="text-xs text-red-500">{error?.message}</div>
            {/if}
        </div>
    {/if}

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