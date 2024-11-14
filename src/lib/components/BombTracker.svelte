<script lang="ts">
    import { character, updateBombs } from '$lib/state/character.svelte';
    import { executeUpdate, type UpdateState } from '$lib/utils/updates';

    let sliderValue = $state(0);
    let isEditing = $state(false);
    let updateState = $state<UpdateState>({
        status: 'idle',
        error: null
    });

    let bombsLeft = $derived(character.character_combat_stats?.[0]?.bombs_left ?? 0);
    let intModifier = $derived(Math.floor((character.character_attributes?.[0]?.int ?? 10 - 10) / 2));
    let level = $derived(character.level);
    let maxBombs = $derived(level + intModifier);
    let bombDamage = $derived(`${Math.ceil(level/2)}d6 + ${intModifier}`);

    async function handleQuickUpdate(amount: number) {
        const newValue = Math.max(0, Math.min(maxBombs, bombsLeft + amount));
        if (newValue === bombsLeft) return;

        const previousValue = bombsLeft;

        await executeUpdate({
            key: `bombs-${character.id}`,
            status: updateState,
            operation: () => updateBombs(newValue),
            optimisticUpdate: () => {
                if (character.character_combat_stats?.[0]) {
                    character.character_combat_stats[0].bombs_left = newValue;
                }
            },
            rollback: () => {
                if (character.character_combat_stats?.[0]) {
                    character.character_combat_stats[0].bombs_left = previousValue;
                }
            }
        });
    }

    function handleInputChange(event: Event) {
        const value = (event.target as HTMLInputElement).value;
        const parsed = parseInt(value) || 0;
        sliderValue = Math.max(0, Math.min(maxBombs, parsed));
    }

    async function handleInputBlur() {
        if (sliderValue === bombsLeft) {
            isEditing = false;
            return;
        }

        const previousValue = bombsLeft;
        isEditing = false;

        await executeUpdate({
            key: `bombs-${character.id}`,
            status: updateState,
            operation: () => updateBombs(sliderValue),
            optimisticUpdate: () => {
                if (character.character_combat_stats?.[0]) {
                    character.character_combat_stats[0].bombs_left = sliderValue;
                }
            },
            rollback: () => {
                if (character.character_combat_stats?.[0]) {
                    character.character_combat_stats[0].bombs_left = previousValue;
                }
            }
        });
    }

    const quickActions = $state.raw([
        { amount: -1, label: '-1', disabled: () => bombsLeft <= 0 || updateState.status === 'syncing' },
        { amount: 1, label: '+1', disabled: () => bombsLeft >= maxBombs || updateState.status === 'syncing' }
    ]);
</script>

<div class="card">
    <h2 class="mb-4 font-bold">Bombs</h2>
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="rounded bg-gray-50 p-4">
            <div class="mb-2 flex items-center justify-between">
                <label for="bombs-input" class="text-sm font-medium">Bombs Remaining</label>
                <div class="flex gap-1">
                    {#each quickActions as { amount, label, disabled }}
                        <button
                            class="btn btn-secondary px-2 py-1 text-xs"
                            onclick={() => handleQuickUpdate(amount)}
                            disabled={disabled()}
                        >
                            {label}
                        </button>
                    {/each}
                </div>
            </div>

            <div class="flex items-center gap-2">
                {#if isEditing}
                    <input
                        id="bombs-input"
                        type="number"
                        class="input w-20 text-center"
                        value={sliderValue}
                        min="0"
                        max={maxBombs}
                        oninput={handleInputChange}
                        onblur={handleInputBlur}
                    />
                {:else}
                    <button
                        class="rounded px-2 py-1 text-2xl font-bold hover:bg-gray-200
                               focus:outline-none focus:ring-2 focus:ring-primary/50"
                        onclick={() => {
                            isEditing = true;
                            sliderValue = bombsLeft;
                        }}
                        disabled={updateState.status === 'syncing'}
                    >
                        {bombsLeft}
                    </button>
                {/if}
                <span class="text-sm text-gray-600">/ {maxBombs} per day</span>
            </div>
        </div>

        <div class="rounded bg-gray-50 p-4">
            <div class="space-y-2">
                <div class="text-sm font-medium">Bomb Damage</div>
                <div class="text-2xl font-bold">{bombDamage}</div>
                <div class="text-xs text-gray-500">
                    Splash damage: {intModifier} (minimum damage)
                </div>
            </div>
        </div>
    </div>
</div>