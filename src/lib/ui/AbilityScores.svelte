<!-- 
	AbilityScores Component - Uses Domain Layer
	All business logic is handled by the domain services
-->
<script lang="ts">
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import type { GameKernel } from '$lib/domain/kernel/GameKernel';
	import type { Entity } from '$lib/domain/kernel/types';
	import { AbilityService } from '$lib/domain/services/AbilityService';
	import type { AbilityScore } from '$lib/domain/services/AbilityService';
	import type { ValueWithBreakdown } from '$lib/ui/types/CharacterTypes';

	// Accept parent-managed components
	let {
		character = null,
		kernel = null,
		onSelectValue = () => {}
	} = $props<{
		character?: Entity | null;
		kernel?: GameKernel | null;
		onSelectValue?: (val: ValueWithBreakdown) => void;
	}>();

	// Component state
	let abilityScores = $state<AbilityScore[]>([]);
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	// Domain service
	let abilityService: AbilityService | null = null;

	// Load ability scores using domain layer
	async function loadAbilityScores() {
		if (!character || !kernel) {
			error = 'Character or kernel not available';
			return;
		}

		isLoading = true;
		error = null;

		try {
			// Initialize service if needed
			if (!abilityService) {
				abilityService = new AbilityService();
			}

			// Character is passed directly as AssembledCharacter, not wrapped in Entity
			const characterData = character;
			if (!characterData) {
				throw new Error('Character data not available');
			}

			// Get all ability scores from the service
			const scores = abilityService.getAllScores(characterData);
			
			// Convert to array and sort by standard order
			const standardOrder = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
			abilityScores = standardOrder.map(name => scores[name]).filter(Boolean);

		} catch (err) {
			error = `Failed to load ability scores: ${err instanceof Error ? err.message : String(err)}`;
		} finally {
			isLoading = false;
		}
	}

	// Handle ability selection
	function selectAbility(ability: AbilityScore) {
		// Convert to ValueWithBreakdown format expected by parent
		const breakdown: ValueWithBreakdown = {
			label: ability.name.charAt(0).toUpperCase() + ability.name.slice(1),
			total: ability.total,
			modifiers: ability.modifiers.map(mod => ({
				source: mod.source,
				value: mod.value,
				type: mod.type
			}))
		};

		onSelectValue(breakdown);
	}

	// Format ability name for display
	function formatAbilityName(name: string): string {
		return name.charAt(0).toUpperCase() + name.slice(1);
	}

	// React to character changes
	$effect(() => {
		if (character) {
			loadAbilityScores();
		}
	});
</script>

<div class="ability-scores">
	{#if error}
		<Alert variant="destructive">
			<AlertDescription>{error}</AlertDescription>
		</Alert>
	{/if}

	{#if isLoading}
		<div class="text-center py-4">
			<div class="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent mx-auto"></div>
		</div>
	{:else}
		<div class="grid grid-cols-2 md:grid-cols-3 gap-4">
			{#each abilityScores as ability}
				<button
					class="ability-card p-4 border rounded-lg hover:bg-accent transition-colors text-center cursor-pointer"
					onclick={() => selectAbility(ability)}
					type="button"
				>
					<div class="font-semibold text-lg">{formatAbilityName(ability.name)}</div>
					<div class="text-2xl font-bold">{ability.total}</div>
					<div class="text-sm text-muted-foreground">
						Modifier: {ability.modifier >= 0 ? '+' : ''}{ability.modifier}
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.ability-scores {
		@apply space-y-4;
	}

	.ability-card:hover {
		@apply shadow-md;
	}
</style>