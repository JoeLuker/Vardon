<script lang="ts">
	import type { AssembledCharacter } from '$lib/domain/character/characterTypes';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import * as Dialog from '$lib/components/ui/dialog';
	// Unix architecture imports
	import { OpenMode } from '$lib/domain/kernel/types';
	import type { GameKernel } from '$lib/domain/kernel/GameKernel';
	import type { Entity } from '$lib/domain/kernel/types';

	interface ProcessedClassFeature {
		id: number;
		name: string;
		label: string;
		description: string;
		type: string;
		level: number;
		class_name: string;
		is_archetype: boolean;
		replaced_feature_ids: number[];
		alterations: {
			alteringFeature: {
				id: number;
				name: string;
				label: string;
			};
		}[];
		class_feature_benefit: {
			id: number;
			name: string;
			label: string | null;
			feature_level: number | null;
			class_feature_benefit_bonus: {
				id: number;
				value: number;
				bonus_type: {
					name: string;
				};
				target_specifier: {
					name: string;
				};
			}[];
		}[];
	}

	let { character, kernel } = $props<{
		character?: AssembledCharacter | null;
		kernel?: GameKernel | null;
	}>();

	// Get class features using direct file operations
	let featuresByLevel = $derived.by(async () => {
		if (!character?.id || !kernel) return new Map<number, ProcessedClassFeature[]>();

		console.log('Processing features for grouping by level');

		// Get the entity ID
		const entityId = `character-${character.id}`;
		const entityPath = `/entity/${entityId}`;

		if (!kernel.exists(entityPath)) {
			console.error(`Entity not found: ${entityPath}`);
			return new Map<number, ProcessedClassFeature[]>();
		}

		// Get the character entity
		const fd = kernel.open(entityPath, OpenMode.READ);

		if (fd < 0) {
			console.error(`Failed to open entity: ${entityPath}`);
			return new Map<number, ProcessedClassFeature[]>();
		}

		try {
			// Read the entity
			const entityBuffer: Entity = { id: entityId, properties: {}, capabilities: {} };
			const [readResult] = kernel.read(fd, entityBuffer);

			if (readResult !== 0) {
				console.error(`Failed to read entity: ${readResult}`);
				return new Map<number, ProcessedClassFeature[]>();
			}

			// Get class features from the entity's classes capability
			const processedFeatures =
				(entityBuffer.capabilities?.classes?.processedClassFeatures as ProcessedClassFeature[]) ||
				[];

			// Group features by their level
			const grouped = new Map<number, ProcessedClassFeature[]>();

			// Check if features all have the same level (suggests incorrect data)
			const allLevels = [...new Set(processedFeatures.map((f: ProcessedClassFeature) => f.level))];
			const allSameLevel = allLevels.length === 1 && processedFeatures.length > 1;
			const maxCharLevel = Math.max(
				...(entityBuffer.capabilities?.classes?.characterClasses || []).map(
					(c: any) => c.level || 0
				)
			);

			console.log(`Feature levels detected: ${allLevels.join(', ')}`);
			console.log(
				`All features have same level: ${allSameLevel}, Max character level: ${maxCharLevel}`
			);

			// If all features have the same level and it's the character's max level,
			// we need to apply a fallback strategy
			const needLevelFallback = allSameLevel && allLevels[0] === maxCharLevel && maxCharLevel > 1;

			// Process each feature and add it to the corresponding level group
			for (const feature of processedFeatures) {
				// Default to the feature's level
				let featureLevel = feature.level;

				// If we suspect level data is wrong, try harder to get correct levels
				if (needLevelFallback) {
					console.log(`Applying fallback level detection for feature: ${feature.name}`);

					// First check feature_level in class_feature_benefit
					if (feature.class_feature_benefit && feature.class_feature_benefit.length > 0) {
						for (const benefit of feature.class_feature_benefit) {
							if (benefit.feature_level !== null && benefit.feature_level > 0) {
								featureLevel = benefit.feature_level;
								console.log(`Found level ${featureLevel} in benefit for ${feature.name}`);
								break;
							}
						}
					}

					// If still at max level, use default levels for common features
					if (featureLevel === maxCharLevel) {
						// Apply some known default levels
						const defaultLevels: Record<string, number> = {
							'Weapon and Armor Proficiency': 1,
							Alchemy: 1,
							Bomb: 1,
							Mutagen: 1,
							'Throw Anything': 1,
							'Poison Resistance': 2,
							'Poison Use': 2,
							'Swift Alchemy': 3,
							'Swift Poisoning': 6,
							'Instant Alchemy': 4,
							'Persistent Mutagen': 10
							// Add any others you know about
						};

						if (defaultLevels[feature.name]) {
							featureLevel = defaultLevels[feature.name];
							console.log(`Using default level ${featureLevel} for ${feature.name}`);
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
			grouped.forEach((features) => {
				features.sort((a, b) => a.label.localeCompare(b.label));
			});

			console.log(`Grouped features into ${grouped.size} different levels`);
			return grouped;
		} finally {
			// Always close the file descriptor
			kernel.close(fd);
		}
	});

	let selectedFeature = $state<{ label: string; description: string } | null>(null);
	let dialogOpen = $state(false);

	function showFeatureDescription(feature: { label: string; description: string }) {
		selectedFeature = feature;
		dialogOpen = true;
	}
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Class Features</Card.Title>
		{#if character?.game_character_class[0]?.class?.description}
			<button
				class="text-left hover:text-muted-foreground"
				onclick={() =>
					showFeatureDescription({
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
		{#if !character || !kernel}
			<div class="rounded-md border border-muted p-4">
				<p class="text-muted-foreground">Loading class features...</p>
			</div>
		{:else}
			{#await featuresByLevel}
				<div class="rounded-md border border-muted p-4">
					<p class="text-muted-foreground">Loading class features...</p>
				</div>
			{:then groupedFeatures}
				{#if groupedFeatures.size === 0}
					<div class="rounded-md border border-muted p-4">
						<p class="text-muted-foreground">No class features found.</p>
					</div>
				{:else}
					<ScrollArea class="h-[calc(100vh-24rem)] max-h-[800px] min-h-[400px] pr-4">
						<div class="space-y-4 sm:space-y-6">
							{#each Array.from(groupedFeatures.entries()).sort((a, b) => a[0] - b[0]) as [level, features]}
								<div class="feature-level-group">
									<h3 class="mb-2 text-base font-semibold sm:text-lg">Level {level}</h3>
									<div class="space-y-2 sm:space-y-4">
										{#each features as feature}
											<button
												class="feature w-full rounded-lg p-2 text-left hover:bg-muted/50 sm:p-3"
												onclick={() =>
													showFeatureDescription({
														label: feature.label,
														description: feature.description || 'No description available'
													})}
											>
												<div class="flex flex-col gap-2">
													<div class="flex items-center gap-2">
														<h4 class="text-sm font-semibold sm:text-base">
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
														<p class="line-clamp-2 text-sm text-muted-foreground">
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
			{:catch error}
				<div class="rounded-md border border-destructive p-4">
					<p class="text-destructive">Error loading class features: {error.message}</p>
				</div>
			{/await}
		{/if}
	</Card.Content>
</Card.Root>

<!-- Feature Description Dialog -->
<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Portal>
		<Dialog.Overlay class="animate-in fade-in-0" />
		<Dialog.Content
			class="fixed left-[50%] top-[50%] w-[95vw] max-w-lg translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-lg border bg-background shadow-lg"
		>
			{#if selectedFeature}
				<Dialog.Header class="border-b bg-background p-6">
					<Dialog.Title class="text-xl font-semibold leading-none"
						>{selectedFeature.label}</Dialog.Title
					>
				</Dialog.Header>

				<div class="max-h-[60vh] overflow-y-auto p-6">
					<div class="prose prose-sm dark:prose-invert max-w-none">
						<p class="whitespace-pre-wrap">{selectedFeature.description}</p>
					</div>
				</div>

				<div class="border-t bg-background p-4">
					<Dialog.Close
						class="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary font-medium text-primary-foreground hover:bg-primary/90"
					>
						Close
					</Dialog.Close>
				</div>
			{/if}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<style lang="postcss">
	.feature {
		border: 1px solid hsl(var(--border) / 0.2);
		transition: all 0.2s ease;

		&:hover {
			background-color: hsl(var(--muted) / 0.5);
			border-color: hsl(var(--border) / 0.5);
		}
	}
</style>
