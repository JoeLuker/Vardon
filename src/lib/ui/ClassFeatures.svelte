<script lang="ts">
	import type { EnrichedCharacter } from '$lib/domain/characterCalculations';
	import type { ProcessedFeature } from '$lib/domain/characterCalculations';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import * as Dialog from '$lib/components/ui/dialog';

	let { character } = $props<{
		character?: EnrichedCharacter | null;
	}>();

	let featuresByLevel = $derived(() => {
		if (!character?.processedClassFeatures) return new Map();
		
		// Group features by their feature_level (when they were gained)
		const grouped = new Map<number, ProcessedFeature[]>();
		
		// Process each feature and add it to the corresponding level group
		for (const feature of character.processedClassFeatures) {
			// Look through the game_character_class_feature array to find the actual feature_level
			let featureLevel = feature.level; // Default to current level
			
			// First check if this is a class feature with a defined feature_level in class_feature_benefit
			if (feature.class_feature_benefit && feature.class_feature_benefit.length > 0) {
				for (const benefit of feature.class_feature_benefit) {
					if (benefit.feature_level !== null) {
						featureLevel = benefit.feature_level;
						break;
					}
				}
			} 
			// If not in benefit, try to find it in the original class definition
			else if (character.game_character_class_feature) {
				const matchingFeature = character.game_character_class_feature.find(
					(cf: any) => cf.class_feature && cf.class_feature.name === feature.name
				);
				
				if (matchingFeature?.class_feature?.feature_level) {
					featureLevel = matchingFeature.class_feature.feature_level;
				}
			}
			
			if (!grouped.has(featureLevel)) {
				grouped.set(featureLevel, []);
			}
			grouped.get(featureLevel)?.push(feature);
		}
		
		// Sort features within each level group by name for consistent display
		grouped.forEach(features => {
			features.sort((a, b) => a.label.localeCompare(b.label));
		});
		
		return grouped;
	});

	let selectedFeature = $state<{ label: string; description: string } | null>(null);
	let dialogOpen = $state(false);

	function showFeatureDescription(feature: { label: string; description: string }) {
		// console.log('Opening dialog with feature:', feature);
		selectedFeature = feature;
		dialogOpen = true;
	}

	$effect(() => {
		if (character) {
			// Debug logging to examine all properties in a feature
			console.log('First feature complete object:', JSON.stringify(character.processedClassFeatures[0], null, 2));
			
			// Debug logging to check feature levels
			console.log('Features with levels:', character.processedClassFeatures.map((f: ProcessedFeature) => ({
				label: f.label,
				level: f.level,
				type: typeof f.level
			})));
			
			// Convert Map to a plain object for better console logging
			const groupedForLogging = Object.fromEntries(featuresByLevel());
			console.log('Grouped Features:', groupedForLogging);
		}
	});
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Class Features</Card.Title>
		{#if character?.game_character_class[0]?.class?.description}
			<button 
				class="text-left hover:text-muted-foreground"
				onclick={() => showFeatureDescription({ 
					label: character.game_character_class[0].class.label ?? 'Class Description',
					description: character.game_character_class[0].class.description ?? ''
				})}
			>
				<Card.Description class="line-clamp-2">
					{character.game_character_class[0].class.description}
				</Card.Description>
			</button>
		{/if}
	</Card.Header>
	<Card.Content>
		{#if !character}
			<div class="rounded-md border border-muted p-4">
				<p class="text-muted-foreground">Loading class features...</p>
			</div>
		{:else if character.processedClassFeatures.length === 0}
			<div class="rounded-md border border-muted p-4">
				<p class="text-muted-foreground">No class features found.</p>
			</div>
		{:else}
			<ScrollArea class="h-[calc(100vh-24rem)] min-h-[400px] max-h-[800px] pr-4">
				<div class="space-y-4 sm:space-y-6">
					{#each Array.from(featuresByLevel().entries()).sort((a, b) => a[0] - b[0]) as [level, features]}
						<div class="feature-level-group">
							<h3 class="text-base sm:text-lg font-semibold mb-2">Level {level}</h3>
							<div class="space-y-2 sm:space-y-4">
								{#each features as feature}
									<button 
										class="feature w-full text-left hover:bg-muted/50 p-2 sm:p-3 rounded-lg"
										onclick={() => showFeatureDescription({ 
											label: feature.label,
											description: feature.description || 'No description available'
										})}
									>
										<div class="flex flex-col gap-2">
											<div class="flex items-center gap-2">
												<h4 class="text-sm sm:text-base font-semibold">
													{feature.label}
												</h4>
												{#if feature.type}
													<Badge variant="outline">{feature.type}</Badge>
												{/if}
												{#if feature.is_archetype}
													<Badge variant="secondary">Archetype</Badge>
												{/if}
												{#if feature.alterations && feature.alterations.length > 0}
													<Badge variant="destructive">Altered</Badge>
												{/if}
											</div>
											{#if feature.description}
												<p class="text-sm text-muted-foreground line-clamp-2">
													{feature.description}
												</p>
											{/if}
										</div>
									</button>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</ScrollArea>
		{/if}
	</Card.Content>
</Card.Root>

<!-- Feature Description Dialog -->
<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Portal>
		<Dialog.Overlay class="animate-in fade-in-0" />
		<Dialog.Content 
			class="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[95vw] max-w-lg rounded-lg border bg-background shadow-lg overflow-hidden"
		>
			{#if selectedFeature}
				<Dialog.Header class="border-b bg-background p-6">
					<Dialog.Title class="text-xl font-semibold leading-none">{selectedFeature.label}</Dialog.Title>
				</Dialog.Header>

				<div class="p-6 overflow-y-auto max-h-[60vh]">
					<div class="prose prose-sm dark:prose-invert max-w-none">
						<p class="whitespace-pre-wrap">{selectedFeature.description}</p>
					</div>
				</div>

				<div class="border-t bg-background p-4">
					<Dialog.Close class="w-full h-10 inline-flex items-center justify-center rounded-md bg-primary font-medium text-primary-foreground hover:bg-primary/90">
						Close
					</Dialog.Close>
				</div>
			{/if}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<style lang="postcss">

</style> 