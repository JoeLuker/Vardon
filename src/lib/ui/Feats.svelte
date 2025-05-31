<script lang="ts">
	import type { AssembledCharacter } from '$lib/ui/types/CharacterTypes';
	import type { GameRules } from '$lib/db/gameRules.api';
	import { createEventDispatcher } from 'svelte';

	// Use the types from the GameRules namespace
	type Feat = GameRules.Base.Row<'feat'>;
	type GameCharacterFeat = GameRules.Base.Row<'game_character_feat'> & { feat: Feat };
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import * as Dialog from '$lib/components/ui/dialog';

	let { character } = $props<{ character: AssembledCharacter }>();

	// Create event dispatcher for feature activation
	const dispatch = createEventDispatcher<{
		activateFeature: { featureId: string; options: any };
	}>();

	// Group feats by level
	let featsByLevel = $derived(() => {
		if (!character?.game_character_feat) return {};

		return character.game_character_feat.reduce(
			(acc: Record<number, Feat[]>, featEntry: GameCharacterFeat & { feat: Feat }) => {
				const level = featEntry.level_obtained || 1;
				if (!acc[level]) {
					acc[level] = [];
				}
				acc[level].push(featEntry.feat);
				return acc;
			},
			{}
		);
	});

	// Get sorted levels
	let levels = $derived(() => {
		return Object.keys(featsByLevel())
			.map(Number)
			.sort((a, b) => a - b);
	});

	// Selected feat for dialog
	let selectedFeat = $state<{
		id: string;
		label: string;
		description: string;
		active?: boolean;
	} | null>(null);
	let dialogOpen = $state(false);

	function showFeatDetail(feat: Feat) {
		selectedFeat = {
			id: feat.id.toString(),
			label: feat.label || feat.name || 'Unnamed Feat',
			description: feat.description || 'No description available',
			active: feat.active
		};
		dialogOpen = true;
	}

	// Handle activating a feat
	function activateFeat(featId: string, options: any = {}) {
		// Convert to feature ID format (feat.name)
		const featureId = `feat.${featId}`;
		dispatch('activateFeature', { featureId, options });
	}
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Feats</Card.Title>
		<Card.Description>Special abilities and talents your character has acquired</Card.Description>
	</Card.Header>
	<Card.Content>
		{#if !character}
			<div class="rounded-md border border-muted p-4">
				<p class="text-muted-foreground">Loading feats...</p>
			</div>
		{:else if levels().length === 0}
			<div class="rounded-md border border-muted p-4">
				<p class="text-muted-foreground">No feats selected</p>
			</div>
		{:else}
			<ScrollArea class="h-[calc(100vh-30rem)] max-h-[600px] min-h-[300px] pr-4">
				<div class="space-y-6">
					{#each levels() as level}
						<div class="feat-level-group">
							<h3 class="mb-3 text-base font-semibold sm:text-lg">
								Level {level}
								<Badge variant="outline" class="ml-2 text-xs">
									{featsByLevel()[level].length}
									{featsByLevel()[level].length === 1 ? 'feat' : 'feats'}
								</Badge>
							</h3>
							<div class="grid gap-2 sm:grid-cols-1 sm:gap-3 md:grid-cols-2">
								{#each featsByLevel()[level] as feat}
									<button class="group w-full text-left" onclick={() => showFeatDetail(feat)}>
										<div
											class="space-y-2 rounded-lg border p-3 transition-colors hover:bg-muted/50"
										>
											<h4 class="text-sm font-medium">{feat.label || feat.name}</h4>
											{#if feat.description}
												<p class="line-clamp-2 text-xs text-muted-foreground">{feat.description}</p>
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

<!-- Feat Detail Dialog -->
<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Portal>
		<Dialog.Overlay class="animate-in fade-in-0" />
		<Dialog.Content
			class="fixed left-[50%] top-[50%] w-[95vw] max-w-lg translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-lg border bg-background shadow-lg"
		>
			{#if selectedFeat}
				<Dialog.Header class="border-b bg-background p-6">
					<Dialog.Title class="flex items-center text-xl font-semibold leading-none">
						{selectedFeat.label}
						{#if selectedFeat.active}
							<Badge variant="default" class="ml-2">Active</Badge>
						{/if}
					</Dialog.Title>
				</Dialog.Header>

				<div class="max-h-[60vh] overflow-y-auto p-6">
					<div class="prose prose-sm dark:prose-invert max-w-none">
						<p class="whitespace-pre-wrap">{selectedFeat.description}</p>
					</div>
				</div>

				<div class="flex flex-col space-y-2 border-t bg-background p-4">
					{#if selectedFeat.id && !selectedFeat.active}
						<button
							class="inline-flex h-10 w-full items-center justify-center rounded-md bg-green-600 font-medium text-white hover:bg-green-700"
							onclick={() => activateFeat(selectedFeat.id)}
						>
							Activate Feat
						</button>
					{/if}
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
