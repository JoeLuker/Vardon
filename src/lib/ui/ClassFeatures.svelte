<script lang="ts">
	import type { AssembledCharacter } from '$lib/domain/character/characterTypes';
	import type { ProcessedClassFeature } from '$lib/db/gameRules.api';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import * as Dialog from '$lib/components/ui/dialog';

	let { character } = $props<{
		character?: AssembledCharacter | null;
	}>();

	let featuresByLevel = $derived(() => {
		if (!character?.processedClassFeatures) return new Map();
		
		console.log('Processing features for grouping by level');
		
		// Group features by their feature_level (when they were gained)
		const grouped = new Map<number, ProcessedClassFeature[]>();
		
		// Check if features all have the same level (suggests incorrect data)
		const allLevels = [...new Set(character.processedClassFeatures.map((f: ProcessedClassFeature) => f.level))];
		const allSameLevel = allLevels.length === 1 && character.processedClassFeatures.length > 1;
		const maxCharLevel = Math.max(...(character.game_character_class || []).map((c: any) => c.level || 0));
		
		console.log(`Feature levels detected: ${allLevels.join(', ')}`);
		console.log(`All features have same level: ${allSameLevel}, Max character level: ${maxCharLevel}`);
		
		// If all features have the same level and it's the character's max level,
		// we need to apply a fallback strategy
		const needLevelFallback = allSameLevel && allLevels[0] === maxCharLevel && maxCharLevel > 1;
		
		// Process each feature and add it to the corresponding level group
		for (const feature of character.processedClassFeatures) {
			// Look through the game_character_class_feature array to find the actual feature_level
			let featureLevel = feature.level; // Default to current level
			
			// If we suspect level data is wrong, try harder to get correct levels
			if (needLevelFallback) {
				console.log(`Applying fallback level detection for feature: ${feature.name}`);
				
				// First check if this is a class feature with a defined feature_level in class_feature_benefit
				if (feature.class_feature_benefit && feature.class_feature_benefit.length > 0) {
					for (const benefit of feature.class_feature_benefit) {
						if (benefit.feature_level !== null && benefit.feature_level > 0) {
							featureLevel = benefit.feature_level;
							console.log(`Found level ${featureLevel} in benefit for ${feature.name}`);
							break;
						}
					}
				} 
				// If not in benefit, try to find it in the original class definition
				if (featureLevel === maxCharLevel && character.game_character_class_feature) {
					const matchingFeature = character.game_character_class_feature.find(
						(cf: any) => cf.class_feature && cf.class_feature.name === feature.name
					);
					
					if (matchingFeature?.class_feature?.feature_level) {
						featureLevel = matchingFeature.class_feature.feature_level;
						console.log(`Found level ${featureLevel} in class feature for ${feature.name}`);
					}
					
					// Also check level_obtained as fallback
					else if (matchingFeature?.level_obtained) {
						featureLevel = matchingFeature.level_obtained;
						console.log(`Found level ${featureLevel} in level_obtained for ${feature.name}`);
					}
					
					// If still at max level, use default levels for common features
					else if (featureLevel === maxCharLevel) {
						// Apply some known default levels
						const defaultLevels: Record<string, number> = {
							'Weapon and Armor Proficiency': 1,
							'Alchemy': 1,
							'Bomb': 1,
							'Mutagen': 1,
							'Throw Anything': 1,
							'Poison Resistance': 2,
							'Poison Use': 2,
							'Swift Alchemy': 3,
							'Swift Poisoning': 6,
							'Instant Alchemy': 4,
							'Persistent Mutagen': 10,
							// Add any others you know about
						};
						
						if (defaultLevels[feature.name]) {
							featureLevel = defaultLevels[feature.name];
							console.log(`Using default level ${featureLevel} for ${feature.name}`);
						}
					}
				}
			}
			
			// Ensure feature level is a number and at least 1
			featureLevel = Number(featureLevel) || 1;
			
			// Add to appropriate level group
			if (!grouped.has(featureLevel)) {
				grouped.set(featureLevel, []);
			}
			grouped.get(featureLevel)?.push(feature);
		}
		
		// Sort features within each level group by name for consistent display
		grouped.forEach(features => {
			features.sort((a, b) => a.label.localeCompare(b.label));
		});
		
		console.log(`Grouped features into ${grouped.size} different levels`);
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
			console.log('Features with levels:', character.processedClassFeatures.map((f: ProcessedClassFeature) => ({
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