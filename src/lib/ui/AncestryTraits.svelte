<script lang="ts">
	import type { AssembledCharacter } from '$lib/ui/types/CharacterTypes';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';

	// Props
	let { character } = $props<{
		character?: AssembledCharacter | null;
	}>();

	// Computed properties
	let ancestry = $derived(getAncestry());
	let ancestryTraits = $derived(getAncestryTraits());

	// Helper functions
	function getAncestry() {
		if (!character?.game_character_ancestry?.length) return null;
		return character.game_character_ancestry[0].ancestry;
	}

	function getAncestryTraits() {
		// Include both standard and selected traits
		let traits = [];

		// Add standard traits from ancestry
		if (ancestry?.ancestry_trait) {
			const standardTraits = ancestry.ancestry_trait
				.filter((trait) => trait.is_standard)
				.map((trait) => ({
					id: trait.id,
					name: trait.name,
					label: trait.label || trait.name,
					description: trait.description,
					isStandard: true
				}));

			traits.push(...standardTraits);
		}

		// Add selected traits
		if (character?.game_character_ancestry_trait) {
			const selectedTraits = character.game_character_ancestry_trait
				.filter((charTrait) => charTrait.ancestry_trait)
				.map((charTrait) => ({
					id: charTrait.ancestry_trait.id,
					name: charTrait.ancestry_trait.name,
					label: charTrait.ancestry_trait.label || charTrait.ancestry_trait.name,
					description: charTrait.ancestry_trait.description,
					isStandard: false
				}));

			traits.push(...selectedTraits);
		}

		// Add any traits from the character state (may come from different sources)
		if (character?.ancestryTraits) {
			// Filter out traits already included
			const existingIds = traits.map((t) => t.id);
			const additionalTraits = character.ancestryTraits
				.filter((trait) => !existingIds.includes(trait.id))
				.map((trait) => ({
					id: trait.id,
					name: trait.name,
					label: trait.name, // No label in this data structure
					description: trait.description,
					isStandard: false
				}));

			traits.push(...additionalTraits);
		}

		return traits;
	}

	function getTraitBenefits(traitId: number) {
		// Find trait benefits
		const trait = ancestry?.ancestry_trait?.find((t) => t.id === traitId);
		if (!trait || !trait.ancestry_trait_benefit) return [];

		return trait.ancestry_trait_benefit.map((benefit) => ({
			description: benefit.description || 'No description available',
			bonuses: benefit.ancestry_trait_benefit_bonus || []
		}));
	}
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Ancestry Traits</Card.Title>
		<Card.Description>Racial traits and abilities</Card.Description>
	</Card.Header>
	<Card.Content>
		{#if !character}
			<div class="rounded-md border border-muted p-4">
				<p class="text-muted-foreground">Loading ancestry traits...</p>
			</div>
		{:else if !ancestry}
			<div class="rounded-md border border-muted p-4">
				<p class="text-muted-foreground">No ancestry information available.</p>
			</div>
		{:else}
			<div class="mb-4">
				<h3 class="text-lg font-semibold">
					{ancestry.label || ancestry.name}
				</h3>
				{#if ancestry.description}
					<p class="mt-1 text-sm text-muted-foreground">{ancestry.description}</p>
				{/if}
			</div>

			{#if ancestryTraits.length > 0}
				<div class="space-y-4">
					{#each ancestryTraits as trait}
						<div class="rounded-lg border p-4">
							<div class="mb-2 flex items-center justify-between">
								<h4 class="font-semibold">{trait.label}</h4>
								<Badge variant={trait.isStandard ? 'secondary' : 'outline'}>
									{trait.isStandard ? 'Standard' : 'Selected'}
								</Badge>
							</div>

							{#if trait.description}
								<p class="mb-3 text-sm">{trait.description}</p>
							{/if}

							{#if typeof trait.id === 'number'}
								{@const benefits = getTraitBenefits(trait.id)}
								{#if benefits.length > 0}
									<div class="mt-2">
										<h5 class="mb-1 text-sm font-medium">Benefits:</h5>
										<ul class="space-y-2 text-sm">
											{#each benefits as benefit}
												<li class="border-l-2 border-muted pl-3">
													<p>{benefit.description}</p>

													{#if benefit.bonuses.length > 0}
														<ul class="mt-1 pl-4 text-xs text-muted-foreground">
															{#each benefit.bonuses as bonus}
																<li>
																	{#if bonus.target_specifier}
																		+{bonus.value || 0}
																		{bonus.bonus_type?.name || 'untyped'} bonus to {bonus
																			.target_specifier.name}
																	{:else}
																		+{bonus.value || 0} {bonus.bonus_type?.name || 'untyped'} bonus
																	{/if}
																</li>
															{/each}
														</ul>
													{/if}
												</li>
											{/each}
										</ul>
									</div>
								{/if}
							{/if}
						</div>
					{/each}
				</div>
			{:else}
				<div class="rounded-md border border-muted p-4">
					<p class="text-muted-foreground">No traits available for this ancestry.</p>
				</div>
			{/if}
		{/if}
	</Card.Content>
</Card.Root>
