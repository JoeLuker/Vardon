// /src/lib/components/Stats.svelte
<script lang="ts">
  import { attributes, baseModifiers, currentModifiers } from '$lib/stores';
  import { buffs } from '$lib/stores';
  import type { Attributes, BuffName } from '$lib/types';
  import { slide } from 'svelte/transition';
  
  $: attributeValues = $attributes.current;
  $: baseModifierValues = $baseModifiers;
  $: currentModifierValues = $currentModifiers;

  let expandedSections = {
    attributes: true,
    mutagens: true
  };

  function formatModifier(num: number): string {
    return num >= 0 ? `+${num}` : num.toString();
  }
  
  async function handleBuffToggle(buffName: BuffName) {
    await buffs.toggle(buffName);
  }

  function getAttributeTooltip(attrName: keyof Attributes): string {
    const base = attributeValues[attrName];
    const buffsList = [];
    
    if ($buffs.cognatogen) {
      if (attrName === 'int') buffsList.push('+4 from Cognatogen');
      if (attrName === 'str') buffsList.push('-2 from Cognatogen');
    }
    if ($buffs.dex_mutagen) {
      if (attrName === 'dex') buffsList.push('+4 from Mutagen');
      if (attrName === 'wis') buffsList.push('-2 from Mutagen');
    }
    
    return `Base: ${base}\n${buffsList.length ? 'Active Buffs:\n' + buffsList.join('\n') : ''}`;
  }
</script>

<section id="statistics">
  <h2 class="section-header">Statistics</h2>
  
  <div class="stats-container">
    <!-- Mutagens Section -->
    <div class="section-container">
      <button 
        class="section-header-button"
        on:click={() => expandedSections.mutagens = !expandedSections.mutagens}
      >
        <h3 class="font-bold">Active Effects</h3>
        <span class="expand-arrow" class:rotate-180={!expandedSections.mutagens}>▼</span>
      </button>
      
      {#if expandedSections.mutagens}
      <div transition:slide class="mutagen-grid">
        <button
          class="mutagen-button relative group"
          class:active={$buffs.cognatogen}
          on:click={() => handleBuffToggle('cognatogen')}
        >
          <span>Intelligence Cognatogen</span>
          <div class="effect-tooltip">INT +4, STR -2, Natural Armor +2</div>
        </button>
        <button
          class="mutagen-button relative group"
          class:active={$buffs.dex_mutagen}
          on:click={() => handleBuffToggle('dex_mutagen')}
        >
          <span>Dexterity Mutagen</span>
          <div class="effect-tooltip">DEX +4, WIS -2, Natural Armor +2</div>
        </button>
      </div>
      {/if}
    </div>

    <!-- Attributes Section -->
    <div class="section-container">
      <button 
        class="section-header-button"
        on:click={() => expandedSections.attributes = !expandedSections.attributes}
      >
        <h3 class="font-bold">Attributes</h3>
        <span class="expand-arrow" class:rotate-180={!expandedSections.attributes}>▼</span>
      </button>
      
      {#if expandedSections.attributes}
      <div transition:slide class="attributes-grid">
        {#each Object.entries(attributeValues) as [attrName, value]}
          <div class="relative group attribute-display">
            <div class="attribute-container">
              <span class="attribute-label">{attrName.toUpperCase()}</span>
              <span class="attribute-value">{value}</span>
              <span 
                class="attribute-modifier" 
                class:modified={baseModifierValues[attrName as keyof Attributes] !== currentModifierValues[attrName as keyof Attributes]}
              >
                {formatModifier(currentModifierValues[attrName as keyof Attributes])}
              </span>
            </div>
            <div class="attribute-tooltip">
              {getAttributeTooltip(attrName as keyof Attributes)}
            </div>
          </div>
        {/each}
      </div>
      {/if}
    </div>
  </div>
</section>

<style lang="postcss">
  .stats-container {
    @apply bg-amber-50 rounded-lg p-6 shadow-lg;
  }

  .section-container {
    @apply mb-8 last:mb-0 border-b border-amber-900/20 last:border-0 pb-6 last:pb-0;
  }

  .section-header-button {
    @apply flex w-full justify-between items-center py-3 px-4 rounded-lg
    hover:bg-amber-900/5 transition-colors;
  }

  .expand-arrow {
    @apply transform transition-transform text-amber-900/60;
  }

  .mutagen-grid {
    @apply grid gap-4 mt-4 md:grid-cols-2;
  }

  .mutagen-button {
    @apply rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600
    px-4 py-3 text-white transition-all duration-200 text-center relative
    hover:from-emerald-600 hover:to-emerald-700 shadow-md hover:shadow-lg
    active:shadow-sm active:translate-y-0.5;
  }
  
  .mutagen-button.active {
    @apply from-red-500 to-red-600 hover:from-red-600 hover:to-red-700;
  }

  .effect-tooltip {
    @apply invisible group-hover:visible absolute left-1/2 transform -translate-x-1/2 
    bg-gray-900 text-white text-sm rounded-lg p-3 whitespace-normal z-10 w-48 text-center
    shadow-xl bottom-[calc(100%+0.75rem)];
  }

  .attributes-grid {
    @apply grid gap-4 mt-4 md:grid-cols-2;
  }

  .attribute-display {
    @apply p-4 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100/50
    hover:from-amber-100 hover:to-amber-200/50 transition-colors shadow-sm;
  }

  .attribute-container {
    @apply flex items-center gap-4;
  }

  .attribute-modifier.modified {
    @apply text-emerald-600 font-bold;
  }
</style>