<!-- FILE: src/lib/ui/AncestryDisplay.svelte -->
<script lang="ts">
	import { getCharacter } from '$lib/state/characterStore';

	let { characterId } = $props<{ characterId: number }>();

	// Derive the character from your store
	let character = $derived(getCharacter(characterId));

	/**
	 * Derive the single 'primary' ancestry, if any.
	 * Using $derived.by(...) so we can do multi-line logic
	 * plus a known return type of DatabaseCharacterAncestry | undefined.
	 */
	let primaryAncestry: DatabaseCharacterAncestry | undefined = $derived.by(() => {
		return (character.character_ancestries ?? []).find((a) => a.is_primary);
	});

	/**
	 * Gather the relevant ancestral traits for that ancestry.
	 * Similarly using $derived.by(...) and providing the type explicitly.
	 */
	let ancestralTraits: DatabaseCharacterAncestralTrait[] = $derived.by(() => {
		// If we have no traits or no primary ancestry, return an empty array
		if (!character.character_ancestral_traits || !primaryAncestry) {
			return [];
		}
		// Filter only those matching the same 'character_id'
		return character.character_ancestral_traits.filter(
			(t) =>
				t.character_id === primaryAncestry.character_id &&
				t.ancestral_trait_id != null
		);
	});

	/**
	 * Helper to pretty-print ability modifiers like { STR: +2, DEX: +1 }
	 */
	function formatAbilityModifiers(modifiers: Record<string, number> | null): string {
		if (!modifiers) return '';
		return Object.entries(modifiers)
			.map(([ability, value]) => `${ability.toUpperCase()}: ${value >= 0 ? '+' : ''}${value}`)
			.join(', ');
	}
</script>

<div class="card">
	<h2 class="mb-2 font-bold">Ancestry</h2>

	{#if primaryAncestry?.ancestry}
		<!-- If we have a primary ancestry with an .ancestry object -->
		<div class="space-y-3">
			<!-- Basic info: Name, Size, Speed -->
			<div>
				<div class="text-lg font-medium text-primary">
					{primaryAncestry.ancestry.name}
				</div>
				<div class="text-sm text-gray-600">
					{primaryAncestry.ancestry.size} • Speed: {primaryAncestry.ancestry.base_speed}ft
				</div>
			</div>

			<!-- If ancestry has ability_modifiers, display them -->
			{#if primaryAncestry.ancestry.ability_modifiers}
				<div>
					<div class="text-sm font-medium">Ability Modifiers</div>
					<div class="text-sm text-gray-600">
						{formatAbilityModifiers(primaryAncestry.ancestry.ability_modifiers)}
					</div>
				</div>
			{/if}

			<!-- If ancestry has a description -->
			{#if primaryAncestry.ancestry.description}
				<div>
					<div class="text-sm font-medium">Description</div>
					<div class="text-sm text-gray-600">
						{primaryAncestry.ancestry.description}
					</div>
				</div>
			{/if}

			<!-- Display derived ancestralTraits (if any) -->
			{#if ancestralTraits.length > 0}
				<div>
					<div class="text-sm font-medium">Ancestral Traits</div>
					<ul class="mt-1 space-y-2">
						{#each ancestralTraits as trait (trait.id)}
							<li class="text-sm">
								<span class="font-medium">Trait ID #{trait.ancestral_trait_id}</span>
								{#if trait.sync_status}
									<div class="text-gray-600">Sync status: {trait.sync_status}</div>
								{/if}
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	{:else}
		<!-- If no ancestry is found -->
		<div class="text-gray-500">No ancestry selected</div>
	{/if}
</div>
