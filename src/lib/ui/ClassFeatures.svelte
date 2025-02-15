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
		
		const grouped = new Map<number, ProcessedFeature[]>();
		for (const feature of character.processedClassFeatures) {
			if (!grouped.has(feature.level)) {
				grouped.set(feature.level, []);
			}
			grouped.get(feature.level)?.push(feature);
		}
		return grouped;
	});

	let selectedFeature = $state<{ label: string; description: string } | null>(null);
	let dialogOpen = $state(false);

	function showFeatureDescription(feature: { label: string; description: string }) {
		console.log('Opening dialog with feature:', feature);
		selectedFeature = feature;
		dialogOpen = true;
	}

	$effect(() => {
		if (character) {
			// Convert Map to a plain object for better console logging
			const groupedForLogging = Object.fromEntries(featuresByLevel());
			console.log('Character:', character);
			console.log('Processed Features:', character.processedClassFeatures);
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
					{#each Array.from(featuresByLevel() as unknown as Map<number, ProcessedFeature[]>).sort((a, b) => a[0] - b[0]) as [level, features]}
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
												{#if feature.isArchetype}
													<Badge variant="secondary">Archetype</Badge>
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
	.feature-card {
		@apply rounded-lg border p-3 sm:p-4 transition-colors;
		border-color: hsl(var(--border) / 0.2);
		background-color: hsl(var(--background));

		&:hover {
			background-color: hsl(var(--accent) / 0.3);
		}
	}

	.feature-header {
		@apply flex flex-col sm:flex-row sm:flex-wrap justify-between items-start gap-2;
	}
</style> 