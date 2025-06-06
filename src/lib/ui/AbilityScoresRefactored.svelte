<!-- 
	AbilityScores Component - Refactored to use Domain Layer
	
	This is an example of how AbilityScores.svelte should be refactored
	to properly use the domain layer instead of implementing business logic
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import type { GameKernel } from '$lib/domain/kernel/GameKernel';
	import type { Entity } from '$lib/domain/kernel/types';
	import { OpenMode, ErrorCode } from '$lib/domain/kernel/types';
	import { AbilityService } from '$lib/domain/services/AbilityService';
	import type { AbilityScore } from '$lib/domain/services/AbilityService';
	import type { ValueWithBreakdown } from '$lib/ui/types/CharacterTypes';

	// Accept kernel and character from parent
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

	// File descriptors for cleanup
	let openFds: number[] = [];

	// Load ability scores using domain layer
	async function loadAbilityScores() {
		if (!character || !kernel) {
			error = 'Character or kernel not available';
			return;
		}

		isLoading = true;
		error = null;

		try {
			// Option 1: Use AbilityService (simpler, recommended)
			if (!abilityService) {
				abilityService = new AbilityService();
			}

			// Get all ability scores from the service
			const scores = abilityService.getAllScores(character.properties.rawData);
			abilityScores = Object.values(scores);

			// Option 2: Use kernel file operations (more Unix-like)
			// This would be the pure Unix way, reading from virtual files
			/*
			const abilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
			const scores: AbilityScore[] = [];

			for (const ability of abilities) {
				const path = `/v_entity/${character.id}/abilities/${ability}`;
				const fd = kernel.open(path, OpenMode.READ);
				
				if (fd < 0) {
					console.error(`Failed to open ${path}`);
					continue;
				}

				openFds.push(fd);

				try {
					const [result, data] = kernel.read(fd);
					if (result === ErrorCode.SUCCESS && data) {
						scores.push(data as AbilityScore);
					}
				} finally {
					kernel.close(fd);
					openFds = openFds.filter(f => f !== fd);
				}
			}

			abilityScores = scores;
			*/
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
			label: ability.name,
			total: ability.total,
			modifiers: ability.modifiers.map(mod => ({
				source: mod.source,
				value: mod.value,
				type: mod.type
			}))
		};

		onSelectValue(breakdown);
	}

	// React to character changes
	$effect(() => {
		if (character) {
			loadAbilityScores();
		}
	});

	// Cleanup on destroy
	$effect(() => {
		return () => {
			// Close any open file descriptors
			openFds.forEach(fd => {
				if (kernel) {
					try {
						kernel.close(fd);
					} catch (e) {
						// Ignore errors during cleanup
					}
				}
			});
		};
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
					class="ability-card p-4 border rounded-lg hover:bg-accent transition-colors"
					onclick={() => selectAbility(ability)}
				>
					<div class="font-semibold text-lg">{ability.name}</div>
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

	.ability-card {
		@apply text-center cursor-pointer;
	}

	.ability-card:hover {
		@apply shadow-md;
	}
</style>