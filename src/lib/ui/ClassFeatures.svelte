<script lang="ts">
	import { getCharacter } from '$lib/state/character.svelte';
	import type { DatabaseCharacterClassFeature } from '$lib/domain/types/character';

	let { characterId } = $props<{ characterId: number }>();

	let character = $derived(getCharacter(characterId));

	interface TransformedFeature extends DatabaseCharacterClassFeature {
		displayName: string;
	}

	// Transform features for display
	let featuresList = $derived(
		(character.character_class_features ?? []).map(
			(feature: DatabaseCharacterClassFeature): TransformedFeature => ({
				...feature,
				displayName: feature.feature_name
					.replace(/([A-Z])/g, ' $1')
					.split(' ')
					.map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
					.join(' ')
			})
		)
	);

	// Group features by level
	let featuresByLevel = $derived(
		featuresList.reduce(
			(acc: Record<number, TransformedFeature[]>, feature: TransformedFeature) => {
				if (!acc[feature.feature_level]) {
					acc[feature.feature_level] = [];
				}
				acc[feature.feature_level].push(feature);
				return acc;
			},
			{}
		)
	);
</script>

<div class="space-y-3 rounded border border-gray-200 bg-white p-4 text-sm">
	<h2 class="text-lg font-bold">Class Features</h2>
	{#each Object.entries(featuresByLevel) as [level, features] (level)}
		{@const typedFeatures = features as TransformedFeature[]}
		<div class="space-y-1">
			<div class="font-medium text-primary">
				Level {level}
			</div>
			<!-- A simple vertical list, no grids -->
			{#each typedFeatures as feature (feature.feature_name)}
				<div class="rounded bg-gray-50 p-2 text-sm hover:bg-gray-100">
					<div class="font-medium">{feature.displayName}</div>
					{#if feature.properties}
						<div class="mt-1 space-y-0.5 text-xs text-gray-600">
							{#each Object.entries(feature.properties ?? {}) as [key, value]}
								<div>{key}: {value}</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/each}
</div>
