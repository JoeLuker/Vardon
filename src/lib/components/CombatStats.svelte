<script lang="ts">
    let { bombsLeft = $bindable(0), baseAttackBonus, onUpdateBombs } = $props<{
        bombsLeft: number;
        baseAttackBonus: number;
        onUpdateBombs: (bombs: number) => void;
    }>();

    let isEditing = $state(false);
    let inputValue = $state(bombsLeft);

    // Sync inputValue with bombsLeft
    $effect(() => {
        inputValue = bombsLeft;
    });

    // Configuration for quick update buttons
    const quickActions = $state.raw([
        { amount: -1, label: '-1', disabled: () => bombsLeft <= 0 },
        { amount: 1, label: '+1', disabled: () => false }
    ]);

    function handleQuickUpdate(amount: number) {
        const newValue = Math.max(0, bombsLeft + amount);
        if (newValue !== bombsLeft) {
            onUpdateBombs(newValue);
        }
    }

    function handleInputChange(value: string) {
        const parsed = parseInt(value) || 0;
        inputValue = Math.max(0, parsed);
    }

    function handleInputBlur() {
        if (inputValue !== bombsLeft) {
            onUpdateBombs(inputValue);
        }
        isEditing = false;
    }

    function focusInput(node: HTMLInputElement) {
        node.focus();
        node.select();
        return {
            destroy: () => {}
        };
    }

    // Derived stats display
    let statsDisplay = $derived.by(() => ({
        bombs: {
            label: 'Bombs Left',
            value: bombsLeft,
            editable: true
        },
        bab: {
            label: 'Base Attack Bonus',
            value: `+${baseAttackBonus}`,
            editable: false
        }
    }));
</script>
  
<div class="card">
    <h2 class="font-bold mb-4">Combat Stats</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Bombs Section -->
        <div class="bg-gray-50 rounded p-4">
            <div class="flex justify-between items-center mb-2">
                <label 
                    for="bombs-input" 
                    class="text-sm font-medium"
                >
                    {statsDisplay.bombs.label}
                </label>
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
                        value={inputValue}
                        min="0"
                        oninput={(e) => handleInputChange(e.currentTarget.value)}
                        onblur={handleInputBlur}
                        use:focusInput
                        aria-label="Number of bombs remaining"
                    />
                {:else}
                    <button 
                        class="text-2xl font-bold hover:bg-gray-200 rounded px-2 py-1
                               focus:outline-none focus:ring-2 focus:ring-primary/50"
                        onclick={() => isEditing = true}
                        aria-label="Edit number of bombs"
                    >
                        {bombsLeft}
                    </button>
                {/if}
            </div>
        </div>

        <!-- Base Attack Bonus Section -->
        <div class="bg-gray-50 rounded p-4">
            <label 
                for="bab-display" 
                class="block text-sm font-medium mb-2"
            >
                {statsDisplay.bab.label}
            </label>
            <span 
                id="bab-display" 
                class="text-2xl font-bold" 
                role="status"
            >
                {statsDisplay.bab.value}
            </span>
        </div>
    </div>
</div>