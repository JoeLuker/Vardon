<script lang="ts">
	import { getCharacter } from '$lib/state/characterStore';

	interface TransformedDiscovery extends DatabaseCharacterDiscovery {
		displayName: string;
	}

	let { characterId } = $props<{ characterId: number }>();

	let character = $derived(getCharacter(characterId));

	// Transform discoveries for display
	let discoveryList = $derived(
		(character.character_discoveries ?? []).map(
			(discovery: DatabaseCharacterDiscovery): TransformedDiscovery => ({
				...discovery,
				displayName: discovery.discovery_name
					.replace(/([A-Z])/g, ' $1')
					.split(' ')
					.map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
					.join(' ')
			})
		)
	);
</script>

<div class="card">
	<h2 class="mb-2 font-bold">Discoveries</h2>
	<div class="grid grid-cols-1 gap-2 md:grid-cols-2">
		{#each discoveryList as discovery (discovery.discovery_name)}
			<div class="rounded bg-gray-50 p-2 hover:bg-gray-100">
				<div class="flex items-center justify-between">
					<div class="font-medium">{discovery.displayName}</div>
					<div class="text-xs text-gray-500">Lvl {discovery.selected_level}</div>
				</div>
				{#if discovery.properties}
					<div class="mt-0.5 text-xs text-gray-600">
						{#each Object.entries(discovery.properties) as [key, value]}
							<div>{key}: {value}</div>
						{/each}
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>
