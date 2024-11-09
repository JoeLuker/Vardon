<script lang="ts">
	import { spells } from '$lib/stores/base/spells';
	import { totalSlots, spellDCs } from '$lib/stores/derived/spellCalculations';
	import { rootStore } from '$lib/stores/base/root';
	import { slide } from 'svelte/transition';
	import ResourceTracker from './ResourceTracker.svelte';
  
	let newSpellInputs: Record<string, string> = {};
	$: characterId = $rootStore.character?.id;
  
	async function handleSpellSlotToggle(level: string, remaining: number) {
	  if (!characterId) return;
	  await spells.updateSpellSlot(characterId, parseInt(level), remaining);
	}
  
	async function handleAddSpell(level: string) {
	  if (!characterId) return;
	  const spellName = newSpellInputs[level]?.trim();
	  if (!spellName) return;
  
	  try {
		await spells.updateKnownSpells(characterId, parseInt(level), [
		  ...($spells.knownSpells[level] || []),
		  spellName
		]);
		newSpellInputs[level] = '';
	  } catch (error) {
		console.error('Failed to add spell:', error);
	  }
	}
  
	async function handleRemoveSpell(level: string, spellName: string) {
	  if (!characterId) return;
	  try {
		const updatedSpells = ($spells.knownSpells[level] || []).filter(
		  spell => spell !== spellName
		);
		await spells.updateKnownSpells(characterId, parseInt(level), updatedSpells);
	  } catch (error) {
		console.error('Failed to remove spell:', error);
	  }
	}
  
	async function handleRestoreAll() {
	  if (!characterId) return;
	  try {
		for (const [level, data] of Object.entries($totalSlots)) {
		  await spells.updateSpellSlot(characterId, parseInt(level), data.total);
		}
	  } catch (error) {
		console.error('Failed to restore spell slots:', error);
	  }
	}
  
	function formatOrdinal(num: number): string {
	  const suffixes = ['th', 'st', 'nd', 'rd'];
	  const v = num % 100;
	  return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
	}
  </script>
  
  <section id="spells">
	<h2 class="section-header w-full text-left">Spells</h2>
  
	<div class="parchment-cell" transition:slide>
	  <div class="mb-4 flex items-center justify-between">
		<strong class="text-lg">Spell Slots</strong>
		<button 
		  class="text-sm text-[#c19a6b] hover:text-[#a67b4b]" 
		  on:click={handleRestoreAll}
		>
		  Restore All
		</button>
	  </div>
  
	  {#each Object.entries($totalSlots) as [level, data]}
		<div class="mb-6">
		  <div class="mb-2 flex items-center justify-between">
			<span class="text-lg font-semibold">
			  {formatOrdinal(parseInt(level))} Level (DC {$spellDCs[parseInt(level)]})
			</span>
			<div class="text-sm text-gray-600">
			  Base: {data.total - data.bonus} + Bonus: {data.bonus}
			</div>
		  </div>
  
		  <ResourceTracker
			label={`Level ${level}`}
			total={data.total}
			used={data.total - data.remaining}
			onToggle={(remaining) => handleSpellSlotToggle(level, remaining)}
		  />
  
		  <div class="ml-4 mt-4">
			<strong class="text-[#c19a6b]">Known Spells:</strong>
			<ul class="mt-2 list-inside list-disc space-y-1">
			  {#each $spells.knownSpells[level] || [] as spell}
				<li class="flex items-center justify-between">
				  <span>{spell}</span>
				  <button
					class="text-xs text-red-500 hover:text-red-700"
					on:click={() => handleRemoveSpell(level, spell)}
				  >
					Remove
				  </button>
				</li>
			  {/each}
			</ul>
		  </div>
  
		  <div class="mt-2 flex items-center space-x-2">
			<input
			  type="text"
			  placeholder="New spell name..."
			  bind:value={newSpellInputs[level]}
			  class="flex-grow rounded border border-yellow-300 bg-yellow-100 p-1"
			/>
			<button
			  class="rounded border border-[#c19a6b] px-3 py-1 text-sm text-[#c19a6b] hover:text-[#a67b4b]"
			  on:click={() => handleAddSpell(level)}
			>
			  Add
			</button>
		  </div>
		</div>
	  {/each}
  
	  {#if $spells.errors?.length}
		<div class="mt-4 rounded bg-red-100 p-2 text-red-700">
		  {#each $spells.errors as error}
			<p>{error}</p>
		  {/each}
		</div>
	  {/if}
	</div>
  </section>