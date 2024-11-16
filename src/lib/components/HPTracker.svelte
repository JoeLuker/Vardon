<script lang="ts">
    import { character, updateHP } from '$lib/state/character.svelte';
    import { executeUpdate, type UpdateState } from '$lib/utils/updates';

    let { currentHp, maxHp } = $props<{
        currentHp: number;
        maxHp: number;
    }>();

    let sliderValue = $state(currentHp);
    let isSliding = $state(false);
    let updateState = $state<UpdateState>({
        status: 'idle',
        error: null
    });

    let displayHP = $derived(isSliding ? sliderValue : currentHp);
    let hpPercentage = $derived(Math.round((displayHP / maxHp) * 100));

    // Quick actions with improved visual feedback
    let quickActions = $state([
        { amount: -5, label: '-5', class: 'text-accent hover:bg-accent/10' },
        { amount: -1, label: '-1', class: 'text-accent hover:bg-accent/10' },
        { amount: 1, label: '+1', class: 'text-green-600 hover:bg-green-50' },
        { amount: 5, label: '+5', class: 'text-green-600 hover:bg-green-50' }
    ]);

    function getHPColor(percentage: number): string {
        if (percentage <= 20) return 'bg-red-500';
        if (percentage <= 40) return 'bg-orange-500';
        if (percentage <= 60) return 'bg-yellow-500';
        if (percentage <= 80) return 'bg-emerald-500';
        return 'bg-green-500';
    }

    async function handleQuickUpdate(amount: number) {
        const newValue = Math.max(0, Math.min(maxHp, currentHp + amount));
        if (newValue === currentHp) return;

        const previousValue = currentHp;

        await executeUpdate({
            key: `hp-${character.id}`,
            status: updateState,
            operation: () => updateHP(newValue),
            optimisticUpdate: () => {
                character.current_hp = newValue;
            },
            rollback: () => {
                character.current_hp = previousValue;
            }
        });
    }

    async function handleSliderUpdate(newValue: number) {
        if (newValue === currentHp) return;

        await executeUpdate({
            key: `hp-${character.id}`,
            status: updateState,
            operation: () => updateHP(newValue),
            optimisticUpdate: () => {
                character.current_hp = newValue;
            },
            rollback: () => {
                character.current_hp = currentHp;
            }
        });
    }
</script>

<div class="card space-y-6" class:shadow-accent-20={updateState.status === 'error'}>
    <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold text-primary">Hit Points</h2>
        <div class="text-sm text-ink-light">
            Maximum: {maxHp}
        </div>
    </div>

    <!-- HP Bar and Slider Container -->
    <div class="relative h-4">
        <!-- Background Track -->
        <div class="absolute inset-0 rounded-full bg-gray-100">
            <!-- HP Bar -->
            <div
                class="h-full rounded-full {getHPColor(hpPercentage)}"
                style="width: {hpPercentage}%"
            ></div>
        </div>

        <!-- Slider -->
        <input
            type="range"
            min="0"
            max={maxHp}
            value={sliderValue}
            class="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent"
            style="-webkit-appearance: none;"
            oninput={(e) => {
                sliderValue = parseInt(e.currentTarget.value);
                isSliding = true;
            }}
            onchange={() => {
                isSliding = false;
                handleSliderUpdate(sliderValue);
            }}
            disabled={updateState.status === 'syncing'}
        />
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-4 gap-3">
        {#each quickActions as { amount, label, class: buttonClass }}
            {@const isDisabled = updateState.status === 'syncing' || 
                (amount < 0 ? displayHP <= 0 : displayHP >= maxHp)}
            <button
                class="interactive focus-ring rounded-lg border-2 border-transparent 
                       bg-white/50 py-3 font-medium shadow-sm backdrop-blur-sm
                       {buttonClass} {isDisabled ? 'opacity-50 cursor-not-allowed' : ''}"
                onclick={() => handleQuickUpdate(amount)}
                disabled={isDisabled}
            >
                {label}
            </button>
        {/each}
    </div>

    <!-- Current HP Display -->
    <div class="flex items-baseline justify-center gap-2">
        <div class="text-4xl font-bold text-primary">{displayHP}</div>
        <div class="text-xl text-ink-light">/ {maxHp}</div>
    </div>

    {#if updateState.status === 'error'}
        <div class="rounded-md bg-accent/10 p-3 text-sm text-accent">
            Failed to update HP. Please try again.
        </div>
    {/if}
</div>

<style>
    input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 16px;
        height: 16px;
        opacity: 0;
    }

    input[type="range"]::-moz-range-thumb {
        width: 16px;
        height: 16px;
        opacity: 0;
        border: 0;
    }
    
    input[type="range"]::-ms-thumb {
        width: 16px;
        height: 16px;
        opacity: 0;
    }
</style>