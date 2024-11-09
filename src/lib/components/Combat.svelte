<script lang="ts">
	import { combat, buffs } from '$lib/stores';
	import { slide } from 'svelte/transition';
	import ResourceTracker from './ResourceTracker.svelte';
	import StatInput from './StatInput.svelte';
	import { rootStore } from '$lib/stores/base/root';
	import type { BuffName } from '$lib/types/character';
  
	$: characterId = $rootStore.character?.id;
	$: stats = $combat;
	$: hp = stats?.currentHP ?? 0;
	$: maxHP = 45; // This could be calculated based on level and constitution
  
	async function handleHPChange(event: Event) {
	  if (!characterId) return;
	  const input = event.target as HTMLInputElement;
	  const value = parseInt(input.value) || 0;
	  await combat.updateHP(characterId, value);
	}
  
	async function handleBombToggle(remaining: number) {
	  if (!characterId) return;
	  await combat.updateBombs(characterId, remaining);
	}
  
	async function toggleBuff(name: BuffName) {
	  await buffs.toggle(name);
	}
  </script>
  
  <section id="def-off">
	<h2 class="section-header w-full text-left">Defense & Offense</h2>
  
	<div class="parchment-cell" transition:slide>
	  <strong class="mb-2 block">Defense</strong>
	  <div class="flex flex-wrap items-center gap-4">
		<div class="flex-grow">
		  <StatInput
			value={hp}
			label="HP"
			max={maxHP}
			on:input={handleHPChange}
		  /> / {maxHP}
		</div>
	  </div>
	</div>
  
	<div class="parchment-cell" transition:slide>
	  <strong class="mb-2 block">Combat Options</strong>
	  <div class="mb-4 flex flex-wrap gap-2">
		<button
		  class="mutagen-button"
		  class:active={$buffs.deadly_aim}
		  on:click={() => toggleBuff('deadly_aim')}
		>
		  Deadly Aim (-2/+4)
		</button>
  
		<button
		  class="mutagen-button"
		  class:active={$buffs.two_weapon_fighting}
		  on:click={() => toggleBuff('two_weapon_fighting')}
		>
		  Two-Weapon (-2)
		</button>
  
		<button
		  class="mutagen-button"
		  class:active={$buffs.rapid_shot}
		  on:click={() => toggleBuff('rapid_shot')}
		>
		  Rapid Shot (-2)
		</button>
	  </div>
  
	  <ResourceTracker
		label="Bombs"
		total={stats?.bombsLeft ?? 0}
		used={0}
		onToggle={handleBombToggle}
	  />
	</div>
  </section>