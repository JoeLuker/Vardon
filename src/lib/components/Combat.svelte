<script>
    import { character } from '$lib/stores/character';
    import { slide } from 'svelte/transition';
    import ResourceTracker from './ResourceTracker.svelte';
    
    // Only keep the non-attribute affecting combat options
    let deadlyAimActive = false;
    let twoWeaponFightingActive = false;
    let rapidShotActive = false;
    
    function formatModifier(num) {
        if (num === undefined || num === null) return "+0";
        return num >= 0 ? `+${num}` : num.toString();
    }

    $: stats = $character || {};
    $: currentAttributes = stats.currentAttributes || {};
    $: combat = stats.combat || {};
    $: baseStats = stats.baseStats || {};
    
    $: intModifier = character.calculateModifier(currentAttributes?.int ?? 10);
    $: dexModifier = character.calculateModifier(currentAttributes?.dex ?? 10);
    
    $: characterLevel = stats.characterLevel ?? 5;
    $: bombDC = 10 + Math.floor(characterLevel / 2) + intModifier;
    
    $: bombAttackBonus = (combat.bab ?? 0) + dexModifier + 
        (deadlyAimActive ? -2 : 0) +
        (rapidShotActive ? -2 : 0) +
        (twoWeaponFightingActive ? -2 : 0);
    
    $: bombDamageBonus = intModifier + 
        (deadlyAimActive ? 4 : 0);
    
    $: saves = character.calculateSaves($character);
    $: ac = character.calculateAC(currentAttributes, $character);
    $: maxHP = character.getMaxHP($character);
    $: totalBombs = character.getBombsPerDay($character);
</script>

<section id="def-off">
    <h2 class="section-header w-full text-left">
        Defense & Offense
    </h2>

    <div class="parchment-cell" transition:slide>
        <strong class="block mb-2">Defense</strong>
        <div class="flex flex-wrap gap-4 items-center">
            <div class="flex-grow">
                HP: <input 
                    type="number" 
                    class="stat-input"
                    value={$character.currentHP}
                    on:input={(e) => character.updateHP(parseInt(e.target.value))}
                /> / {maxHP}
            </div>
            <div>
                AC: {ac.normal}<br>
                Touch: {ac.touch}<br>
                Flat-Footed: {ac.flatFooted}
            </div>
            <div>
                Fort: {formatModifier(saves.fort)}<br>
                Ref: {formatModifier(saves.ref)}<br>
                Will: {formatModifier(saves.will)}
            </div>
        </div>
    </div>
        
    <div class="parchment-cell" transition:slide>
        <strong class="block mb-2">Combat Options</strong>
        <div class="flex flex-wrap gap-2 mb-4">
            <button 
                class="mutagen-button"
                class:active={deadlyAimActive}
                on:click={() => deadlyAimActive = !deadlyAimActive}
            >
                Deadly Aim (-2/+4)
            </button>
            
            <button 
                class="mutagen-button"
                class:active={twoWeaponFightingActive}
                on:click={() => twoWeaponFightingActive = !twoWeaponFightingActive}
            >
                Two-Weapon (-2)
            </button>
            
            <button 
                class="mutagen-button"
                class:active={rapidShotActive}
                on:click={() => rapidShotActive = !rapidShotActive}
            >
                Rapid Shot (-2)
            </button>
        </div>

        <div class="mb-4">
            Speed: 30 ft.<br>
            Ranged: Bomb {formatModifier(bombAttackBonus)} 
            {#if rapidShotActive}
                /{formatModifier(bombAttackBonus)} 
            {/if}
            {#if twoWeaponFightingActive}
                /{formatModifier(bombAttackBonus)} 
            {/if}
            ({baseStats.bombDamage || '1d6'}{formatModifier(bombDamageBonus)} fire, DC {bombDC})
        </div>
            
        <ResourceTracker
            label="Bombs"
            total={totalBombs}
            used={totalBombs - (combat.bombsLeft ?? 0)}
            onToggle={(remaining) => {
                character.updateBombs(remaining);
            }}
        />
    </div>
</section>