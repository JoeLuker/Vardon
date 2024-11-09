<script lang="ts">
	import { spells } from '$lib/stores/base/spells';
	import { totalSlots, spellDCs } from '$lib/stores/derived/spellCalculations';
	import ResourceTracker from './ResourceTracker.svelte';
	import { slide } from 'svelte/transition';
	import { rootStore } from '$lib/stores/base/root';
	import type { SpellSlot } from '$lib/types/character';
	
	$: characterId = $rootStore.character?.id;
	
	async function handleSpellSlotToggle(level: number, remaining: number) {
	  if (!characterId) return;
	  await spells.updateSpellSlot(characterId, level, remaining);
	}
  
	function getSpellLevelInfo(level: number, data: SpellSlot) {
	  return {
		base: data.total - (data.bonus || 0),
		bonus: data.bonus || 0,
		total: data.total,
		remaining: data.remaining,
		dc: $spellDCs[level] || (10 + level)
	  };
	}
  </script>
  
  <div class="parchment-cell" transition:slide>
	<strong class="mb-2 block">Spell Slots</strong>
	{#each Object.entries($totalSlots) as [level, data]}
	  {@const info = getSpellLevelInfo(parseInt(level), data)}
	  <div class="mb-6">
		<div class="mb-2 flex items-center justify-between">
		  <span class="text-lg font-semibold">
			Level {level} Spells (DC {info.dc})
		  </span>
		  <div class="text-sm text-gray-600">
			Base: {info.base} + Bonus: {info.bonus}
		  </div>
		</div>
  
		<ResourceTracker
		  label={`Level ${level}`}
		  total={info.total}
		  used={info.total - info.remaining}
		  onToggle={(remaining) => handleSpellSlotToggle(parseInt(level), remaining)}
		/>
  
		<div class="ml-2 text-sm text-gray-600">
		  {info.remaining} of {info.total} remaining
		</div>
	  </div>
	{/each}
  
	{#if $spells.knownSpells}
	  <div class="mt-6">
		<strong class="mb-2 block">Known Spells</strong>
		{#each Object.entries($spells.knownSpells) as [level, knownSpells]}
		  <div class="mb-2">
			<strong class="text-[#c19a6b]">Level {level}:</strong>
			<ul class="ml-4 list-inside list-disc">
			  {#each knownSpells as spell}
				<li>{spell}</li>
			  {/each}
			</ul>
		  </div>
		{/each}
	  </div>
	{/if}
  
	{#if $spells.errors?.length}
	  <div class="mt-4 rounded bg-red-100 p-2 text-red-700">
		{#each $spells.errors as error}
		  <p>{error}</p>
		{/each}
	  </div>
	{/if}
  </div>
  
  <style lang="postcss">
	.parchment-cell {
	  @apply bg-amber-50 rounded-lg p-6 shadow-lg;
	}
  </style>