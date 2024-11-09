<script lang="ts">
	import { totalSlots } from '$lib/stores/derived/spellCalculations';
	import { slide } from 'svelte/transition';

	let showTables = true;
  
	const baseStats = {
	  bab: 3,
	  fort: 4,
	  ref: 4,
	  will: 1,
	  bombDamage: '3d6',
	  special: [
		'Alchemy',
		'Bomb 3d6',
		'Cognatogen',
		'Throw Anything',
		'Perfect Recall',
		'Discovery',
		'Swift Alchemy'
	  ]
	};
  </script>
  
  <section id="class-features">
	<h2 class="section-header w-full text-left">Class Features & Spells Per Day</h2>
  
	{#if showTables}
	  <div class="parchment-cell" transition:slide>
		<h3 class="mb-2 text-lg font-bold">Spells Per Day</h3>
		<div class="overflow-x-auto">
		  <table class="min-w-full border border-[#c19a6b]">
			<thead>
			  <tr>
				<th class="table-header">Level</th>
				<th class="table-header">Base</th>
				<th class="table-header">Bonus</th>
				<th class="table-header">Total</th>
				<th class="table-header">DC</th>
			  </tr>
			</thead>
			<tbody>
			  {#each Object.entries($totalSlots) as [level, data]}
				<tr>
				  <td class="table-cell">{level}</td>
				  <td class="table-cell">{data.total - data.bonus}</td>
				  <td class="table-cell">{data.bonus}</td>
				  <td class="table-cell">{data.total}</td>
				  <td class="table-cell">{data.dc}</td>
				</tr>
			  {/each}
			</tbody>
		  </table>
		</div>
  
		<h3 class="mb-2 mt-6 text-lg font-bold">Class Features</h3>
		<div class="space-y-2">
		  {#each baseStats.special as feature}
			<div class="parchment-cell">
			  {feature}
			</div>
		  {/each}
		</div>
	  </div>
	{/if}
  </section>
  
  <style lang="postcss">
	.table-header {
	  @apply border border-[#c19a6b] bg-[#f3e5ab] px-4 py-2 text-center font-bold;
	}
  
	.table-cell {
	  @apply border border-[#c19a6b] px-4 py-2 text-center;
	}
  </style>