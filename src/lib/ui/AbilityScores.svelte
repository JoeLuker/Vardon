<script lang="ts">
	import type { AssembledCharacter, ValueWithBreakdown } from '$lib/ui/types/CharacterTypes';
	import type { CompleteCharacter, Ability } from '$lib/domain/exports';
	import { StretchHorizontal } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { OpenMode, ErrorCode } from '$lib/domain/kernel/types';
	import { onMount, onDestroy } from 'svelte';

	// Define interface for our processed ability score data
	interface AbilityScore {
		name: string;
		value: number;
		mod: number;
		path: string;
	}

	// The Unix way - everything is a file
	const ABILITY_PATHS = {
		DEVICE: '/v_dev/ability',
		PROC: '/v_proc',
		PROC_CHARACTER: '/v_proc/character'
	};

	// Request codes
	const ABILITY_REQUEST = {
		GET_SCORE: 1,
		GET_BREAKDOWN: 4,
		GET_ALL: 5
	};

	// Props with proper typing
	let {
		character,
		onSelectValue = () => {},
		kernel
	} = $props<{
		character?: AssembledCharacter | null;
		onSelectValue?: (val: ValueWithBreakdown) => void;
		kernel?: any;
	}>();

	// Local UI state
	let showModifierFirst = $state(false);
	let abilityScores = $state<AbilityScore[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);

	// Load abilities from character data
	async function loadAbilityScores() {
		if (!character) {
			return;
		}

		isLoading = true;
		error = null;

		// Define ability names
		const abilityNames = [
			{ key: 'strength', name: 'Strength' },
			{ key: 'dexterity', name: 'Dexterity' },
			{ key: 'constitution', name: 'Constitution' },
			{ key: 'intelligence', name: 'Intelligence' },
			{ key: 'wisdom', name: 'Wisdom' },
			{ key: 'charisma', name: 'Charisma' }
		];

		try {
			// Process ability scores from character data
			const newScores: AbilityScore[] = [];
			
			for (const ability of abilityNames) {
				// Find the ability in game_character_ability
				const charAbility = character.game_character_ability?.find(
					(a) => a.ability?.name?.toLowerCase() === ability.key.toLowerCase()
				);
				
				const baseValue = charAbility?.value || 10;
				
				// Calculate racial modifiers
				let racialMod = 0;
				const ancestry = character.game_character_ancestry?.[0]?.ancestry;
				if (ancestry?.name === 'tengu') {
					if (ability.key === 'dexterity' || ability.key === 'wisdom') racialMod = 2;
					if (ability.key === 'constitution') racialMod = -2;
				}
				
				// Check for ABP bonuses to this ability
				let abpBonus = 0;
				if (character.abpData?.appliedBonuses) {
					const abpMod = character.abpData.appliedBonuses.find(
						b => b.target === ability.key && b.type === 'inherent'
					);
					if (abpMod) {
						abpBonus = abpMod.value;
					}
				}
				
				const totalValue = baseValue + racialMod + abpBonus;
				const modifier = Math.floor((totalValue - 10) / 2);
				
				newScores.push({
					name: ability.name,
					value: totalValue,
					mod: modifier,
					path: `character/${character.id}/abilities/${ability.key}`
				});
			}

			abilityScores = newScores;
			isLoading = false;
		} catch (err) {
			error = `Failed to load ability scores: ${err instanceof Error ? err.message : String(err)}`;
			isLoading = false;
		}
	}

	// Load ability breakdown when selected
	function selectAbility(ability: AbilityScore) {
		if (!character) {
			return;
		}

		// Create breakdown for the selected ability
		const breakdown: ValueWithBreakdown = {
			label: ability.name,
			total: ability.value,
			modifiers: []
		};

		// Add base score
		const charAbility = character.game_character_ability?.find(
			(a) => a.ability?.name?.toLowerCase() === ability.name.toLowerCase()
		);
		const baseValue = charAbility?.value || 10;
		breakdown.modifiers.push({
			source: 'Base Score',
			value: baseValue,
			type: 'base'
		});

		// Add racial modifiers
		const ancestry = character.game_character_ancestry?.[0]?.ancestry;
		if (ancestry?.name === 'tengu') {
			const abilityKey = ability.name.toLowerCase();
			if (abilityKey === 'dexterity' || abilityKey === 'wisdom') {
				breakdown.modifiers.push({
					source: 'Tengu Ancestry',
					value: 2,
					type: 'racial'
				});
			} else if (abilityKey === 'constitution') {
				breakdown.modifiers.push({
					source: 'Tengu Ancestry',
					value: -2,
					type: 'racial'
				});
			}
		}
		
		// Add ABP bonuses
		if (character.abpData?.appliedBonuses) {
			const abpMod = character.abpData.appliedBonuses.find(
				b => b.target === ability.name.toLowerCase() && b.type === 'inherent'
			);
			if (abpMod) {
				breakdown.modifiers.push({
					source: `ABP - ${abpMod.source}`,
					value: abpMod.value,
					type: 'inherent'
				});
			}
		}

		// Call the parent handler
		onSelectValue(breakdown);
	}

	// Load data when component mounts or character changes
	$effect(() => {
		if (character) {
			loadAbilityScores();
		}
	});

	// Event handlers
	function toggleModifierFirst() {
		showModifierFirst = !showModifierFirst;
	}
</script>

{#if isLoading}
	<div class="card">
		<div class="flex items-center justify-center space-x-2 text-primary/70">
			<div
				class="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary"
			></div>
			<p>Loading attributes...</p>
		</div>
	</div>
{:else if error}
	<div class="card p-4">
		<div class="text-red-500">
			<p>Error loading ability scores: {error}</p>
		</div>
	</div>
{:else}
	<div class="card">
		<div class="flex flex-col gap-2">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-semibold">Ability Scores</h2>
				<Button
					variant="ghost"
					size="icon"
					class="opacity-50 transition-opacity hover:opacity-100"
					onclick={toggleModifierFirst}
				>
					<span class="sr-only">Toggle show modifier first</span>
					<StretchHorizontal
						class="h-4 w-4 transition-transform duration-200"
						style={showModifierFirst ? 'transform: rotate(180deg)' : ''}
					/>
				</Button>
			</div>
			<div class="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
				{#each abilityScores as ability}
					<button class="attribute-card" type="button" onclick={() => selectAbility(ability)}>
						<div class="card-inner">
							<div class="attribute-name">{ability.name}</div>

							{#if showModifierFirst}
								<div class="primary-value modifier">
									{ability.mod >= 0 ? '+' : ''}{ability.mod}
								</div>
								<div class="secondary-value score">
									{ability.value}
								</div>
							{:else}
								<div class="primary-value score">
									{ability.value}
								</div>
								<div class="secondary-value modifier">
									{ability.mod >= 0 ? '+' : ''}{ability.mod}
								</div>
							{/if}
						</div>
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}

<style lang="postcss">
	.attribute-card {
		@apply relative rounded-lg border bg-card shadow-sm transition-transform duration-200;
		border-color: hsl(var(--border) / 0.2);
		&:hover {
			@apply scale-105;
		}
	}

	.card-inner {
		@apply flex flex-col items-center space-y-2 p-4;
	}

	.attribute-name {
		@apply text-sm font-medium text-muted-foreground;
	}

	.primary-value {
		@apply text-2xl font-bold text-foreground;
	}

	.secondary-value {
		@apply text-sm text-muted-foreground;
	}
</style>
