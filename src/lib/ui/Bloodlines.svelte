<script lang="ts">
	import type { AssembledCharacter } from '$lib/ui/types/CharacterTypes';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { ScrollArea } from '$lib/components/ui/scroll-area';

	// Props
	let { character } = $props<{
		character?: AssembledCharacter | null;
	}>();

	// Computed properties
	let bloodlines = $derived(getBloodlines());
	let hasSorcererClass = $derived(isSorcerer());

	// Helper function to get bloodlines
	function getBloodlines() {
		if (!character?.bloodlines) return [];
		return character.bloodlines;
	}

	// Helper function to check if character is a sorcerer
	function isSorcerer() {
		return (
			character?.game_character_class?.some((gc) =>
				gc.class?.name?.toLowerCase().includes('sorcerer')
			) || false
		);
	}

	// Helper function to get sorcerer level
	function getSorcererLevel() {
		const sorcererClass = character?.game_character_class?.find((gc) =>
			gc.class?.name?.toLowerCase().includes('sorcerer')
		);
		return sorcererClass?.level || 0;
	}
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Bloodlines</Card.Title>
		<Card.Description>Sorcerer bloodline powers and spells</Card.Description>
	</Card.Header>
	<Card.Content>
		{#if !character}
			<div class="rounded-md border border-muted p-4">
				<p class="text-muted-foreground">Loading bloodlines...</p>
			</div>
		{:else if !hasSorcererClass}
			<div class="rounded-md border border-muted p-4">
				<p class="text-muted-foreground">Bloodlines are only available to sorcerers.</p>
			</div>
		{:else if !bloodlines || bloodlines.length === 0}
			<div class="rounded-md border border-muted p-4">
				<p class="text-muted-foreground">No bloodlines available.</p>
			</div>
		{:else}
			<div class="space-y-6">
				{#each bloodlines as bloodline}
					<div class="rounded-lg border p-4">
						<div class="mb-3 flex items-center justify-between">
							<h3 class="text-lg font-semibold">{bloodline.label || bloodline.name}</h3>
							<Badge variant="secondary">Sorcerer {getSorcererLevel()}</Badge>
						</div>

						{#if bloodline.description}
							<p class="mb-4 text-sm text-muted-foreground">{bloodline.description}</p>
						{/if}

						{#if bloodline.spells && bloodline.spells.length > 0}
							<h4 class="mb-2 text-sm font-medium">Bloodline Spells</h4>
							<div class="grid gap-2">
								{#each bloodline.spells as spell}
									<div class="flex items-center justify-between rounded-md bg-muted/50 p-2">
										<span class="text-sm">{spell.label || spell.name}</span>
										<Badge variant="outline">Level {spell.level}</Badge>
									</div>
								{/each}
							</div>
						{/if}

						<div class="mt-4 text-xs text-muted-foreground">
							<p>Sorcerers with this bloodline have access to additional spells and powers.</p>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</Card.Content>
</Card.Root>
