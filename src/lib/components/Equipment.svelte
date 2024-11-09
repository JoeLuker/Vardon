<script lang="ts">
	import { equipment, rootStore } from '$lib/stores';
	import { slide } from 'svelte/transition';
	import ResourceTracker from './ResourceTracker.svelte';
	import type { Consumables } from '$lib/types/character';
	
	$: characterId = $rootStore.character?.id;
	
	const consumableDisplayNames: Record<keyof Consumables, string> = {
	  alchemistFire: "Alchemist's Fire",
	  acid: 'Acid',
	  tanglefoot: 'Tanglefoot Bag'
	};
	
	$: errors = $equipment.errors || [];
	$: consumables = $equipment.consumables || {};
	$: hasConsumables = Object.values(consumables).some(v => v > 0);
	
	async function handleConsumableChange(type: keyof Consumables, remaining: number) {
	  if (!characterId) return;
	  await equipment.updateConsumable(characterId, type, remaining);
	}
	
	async function handleConsumableUpdate(type: keyof Consumables, event: Event) {
	  if (!characterId) return;
	  const input = event.target as HTMLInputElement;
	  const amount = parseInt(input.value) || 0;
	  await equipment.updateConsumable(characterId, type, amount);
	}
	
	async function handleReset() {
	  if (!characterId) return;
	  await equipment.reset(characterId);
	}
  </script>
  
  <section id="equipment">
	<h2 class="section-header w-full text-left">Equipment</h2>
  
	<div class="parchment-cell" transition:slide>
	  <strong class="mb-2 block">Consumables:</strong>
	  <div class="space-y-4">
		{#each Object.entries(consumableDisplayNames) as [type, displayName]}
		  <div class="mb-4">
			<ResourceTracker
			  label={displayName}
			  total={consumables[type as keyof Consumables] || 0}
			  used={0}
			  onToggle={(remaining) => handleConsumableChange(type as keyof Consumables, remaining)}
			/>
			<div class="flex justify-end space-x-2">
			  <input
				type="number"
				class="consumable-input"
				value={consumables[type as keyof Consumables] || 0}
				on:input={(e) => handleConsumableUpdate(type as keyof Consumables, e)}
			  />
			</div>
		  </div>
		{/each}
	  </div>
  
	  <div class="mt-4 text-sm text-gray-600">
		Total Consumables: {Object.values(consumables).reduce((sum, val) => sum + val, 0)}
		{#if hasConsumables}
		  <button 
			class="ml-2 text-[#c19a6b] hover:text-[#a67b4b]" 
			on:click={handleReset}
		  >
			Reset All
		  </button>
		{/if}
	  </div>
  
	  {#if errors.length > 0}
		<div class="mt-4 rounded bg-red-100 p-2 text-red-700">
		  {#each errors as error}
			<p>{error}</p>
		  {/each}
		</div>
	  {/if}
	</div>
  </section>
  
  <style lang="postcss">
	.consumable-input {
	  @apply w-16 rounded border border-yellow-300 bg-yellow-100 p-1 text-center;
	}
  
	.consumable-input:focus {
	  @apply border-yellow-400 outline-none ring-2 ring-yellow-300 ring-offset-2;
	}
  </style>