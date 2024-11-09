<script lang="ts">
	const feats = [
		{ name: 'Tengu Wings', type: 'Racial' },
		{ name: 'Two Weapon Fighting', type: 'Combat' },
		{ name: 'Rapid Shot', type: 'Combat' },
		{ name: 'Deadly Aim', type: 'Combat', note: 'Free' },
		{ name: 'Extra Discovery', type: 'Class', count: 2 },
		{ name: 'Breadth of Knowledge', type: 'Free' }
	];
</script>

<div class="parchment-cell mt-6">
	<strong class="mb-2 block">Feats</strong>
	<ul class="ml-4 list-inside list-disc">
		{#each feats as feat}
			<li>
				{feat.name}
				{#if feat.count && feat.count > 1}
					x{feat.count}
				{/if}
				{#if feat.note}
					<span class="text-xs text-[#c19a6b]">({feat.note})</span>
				{/if}
				<span class="text-xs text-gray-600">({feat.type})</span>
			</li>
		{/each}
	</ul>
</div>
