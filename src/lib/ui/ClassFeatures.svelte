<script lang="ts">
	import type { EnrichedCharacter } from '$lib/domain/characterCalculations';
	import type { GameCharacterClass, GameCharacterClassFeature, Class, ClassFeature } from '$lib/db/gameRules.api';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
    
	interface ProcessedFeature {
		id: number;
		name: string;
		label: string;
		description: string | null;
		type: string | null;
		level: number;
		className: string;
	}

	let { character } = $props<{
		character?: EnrichedCharacter | null;
	}>();

	// Process class features into a flat array sorted by level
	let processedFeatures = $derived(() => {
		if (!character?.classes) return [];

		const features: ProcessedFeature[] = [];
		
		(character.classes as Array<GameCharacterClass & { 
			features?: Array<GameCharacterClassFeature & {
				base: ClassFeature;
			}>;
			base: Class;
		}>).forEach((characterClass) => {
			characterClass.features?.forEach((feature) => {
				features.push({
					id: feature.base.id,
					name: feature.base.name,
					label: feature.base.label ?? feature.base.name,
					description: feature.base.description,
					type: feature.base.type,
					level: feature.level_obtained,
					className: characterClass.base.label ?? characterClass.base.name
				});
			});
		});

		return features.sort((a, b) => a.level - b.level);
	});

	// Group features by level
	let featuresByLevel = $derived(() => {
		const grouped = new Map<number, ProcessedFeature[]>();
		
		processedFeatures().forEach(feature => {
			if (!grouped.has(feature.level)) {
				grouped.set(feature.level, []);
			}
			grouped.get(feature.level)?.push(feature);
		});
		
		return grouped;
	});
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Class Features</Card.Title>
	</Card.Header>
	<Card.Content>
		{#if !character}
			<div class="rounded-md border border-muted p-4">
				<p class="text-muted-foreground">Loading class features...</p>
			</div>
		{:else if processedFeatures().length === 0}
			<div class="rounded-md border border-muted p-4">
				<p class="text-muted-foreground">No class features found.</p>
			</div>
		{:else}
			<ScrollArea class="h-[400px] pr-4">
				<div class="space-y-6">
					{#each [...featuresByLevel().entries()].sort(([a], [b]) => a - b) as [level, features]}
						<div class="feature-level-group">
							<h3 class="text-lg font-semibold mb-2">
								Level {level}
							</h3>
							<div class="space-y-4">
								{#each features as feature}
									<div class="feature-card">
										<div class="feature-header">
											<h4 class="text-base font-medium">
												{feature.label}
											</h4>
											<div class="flex gap-2 items-center">
												<Badge variant="outline">
													{feature.className}
												</Badge>
												{#if feature.type}
													<Badge variant="secondary">
														{feature.type}
													</Badge>
												{/if}
											</div>
										</div>
										{#if feature.description}
											<p class="text-sm text-muted-foreground mt-2">
												{feature.description}
											</p>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</ScrollArea>
		{/if}
	</Card.Content>
</Card.Root>

<style lang="postcss">
	.feature-card {
		@apply rounded-lg border p-4 transition-colors;
		border-color: hsl(var(--border) / 0.2);
		background-color: hsl(var(--background));

		&:hover {
			background-color: hsl(var(--accent) / 0.3);
		}
	}

	.feature-header {
		@apply flex flex-wrap justify-between items-start gap-2;
	}
</style> 