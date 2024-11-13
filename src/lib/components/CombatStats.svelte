<script lang="ts">
    let { bombsLeft, baseAttackBonus, onUpdateBombs } = $props<{
        bombsLeft: number;
        baseAttackBonus: number;
        onUpdateBombs: (bombs: number) => void;
    }>();

    let isEditing = $state(false);
    let inputValue = $state(bombsLeft);

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
        return {};
    }
</script>
  
<div class="card">
    <h2 class="font-bold mb-4">Combat Stats</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="bg-gray-50 rounded p-4">
            <div class="flex justify-between items-center mb-2">
                <label class="text-sm font-medium">Bombs Left</label>
                <div class="flex gap-1">
                    <button 
                        class="btn btn-secondary px-2 py-1 text-xs"
                        onclick={() => handleQuickUpdate(-1)}
                        disabled={bombsLeft === 0}
                    >
                        -1
                    </button>
                    <button 
                        class="btn btn-secondary px-2 py-1 text-xs"
                        onclick={() => handleQuickUpdate(1)}
                    >
                        +1
                    </button>
                </div>
            </div>

            <div class="flex items-center gap-2">
                {#if isEditing}
                    <input 
                        type="number"
                        class="input w-20 text-center"
                        value={inputValue}
                        min="0"
                        oninput={(e) => handleInputChange(e.currentTarget.value)}
                        onblur={handleInputBlur}
                        use:focusInput
                    />
                {:else}
                    <button 
                        class="text-2xl font-bold hover:bg-gray-200 rounded px-2 py-1
                               focus:outline-none focus:ring-2 focus:ring-primary/50"
                        onclick={() => isEditing = true}
                    >
                        {bombsLeft}
                    </button>
                {/if}
            </div>
        </div>

        <div class="bg-gray-50 rounded p-4">
            <label class="block text-sm font-medium mb-2">Base Attack Bonus</label>
            <span class="text-2xl font-bold">+{baseAttackBonus}</span>
        </div>
    </div>
</div>