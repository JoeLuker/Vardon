<script lang="ts">
	const discoveries = ['Infusion', 'Precise Bombs', 'Mutagen', 'Explosive Bomb'];
</script>

<div class="parchment-cell mt-6">
	<strong class="mb-2 block">Discoveries</strong>
	<ul class="ml-4 list-inside list-disc">
		{#each discoveries as discovery}
			<li>{discovery}</li>
		{/each}
	</ul>
</div>
