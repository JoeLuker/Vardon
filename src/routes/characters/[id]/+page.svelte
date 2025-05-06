<script lang="ts">
	// Core imports
	import { onMount } from 'svelte';
	
	// Types
	import type { PageData } from './$types';
	import type { AssembledCharacter } from '$lib/domain/character/characterTypes';
	
	// Character Loader and Adapters
	import CharacterLoader from '$lib/ui/CharacterLoader.svelte';
	import { UIAdapter } from '$lib/ui/adapters/UIAdapter';
	
	// Game API
	import { GameRulesAPI } from '$lib/db/gameRules.api';
	import { supabase } from '$lib/db/supabaseClient';
	
	// UI Components
	import CharacterHeader from '$lib/ui/CharacterHeader.svelte';
	import HPTracker from '$lib/ui/HPTracker.svelte';
	import AbilityScores from '$lib/ui/AbilityScores.svelte';
	import Skills from '$lib/ui/Skills.svelte';
	import Saves from '$lib/ui/Saves.svelte';
	import CombatStats from '$lib/ui/CombatStats.svelte';
	import ACStats from '$lib/ui/ACStats.svelte';
	import ClassFeatures from '$lib/ui/ClassFeatures.svelte';
	import Feats from '$lib/ui/Feats.svelte';
	import Spells from '$lib/ui/Spells.svelte';
	import SpellSlots from '$lib/ui/SpellSlots.svelte';
	import Corruptions from '$lib/ui/Corruptions.svelte';
	import Archetypes from '$lib/ui/Archetypes.svelte';
	import Discoveries from '$lib/ui/Discoveries.svelte';
	import WildTalents from '$lib/ui/WildTalents.svelte';
	import KiPowers from '$lib/ui/KiPowers.svelte';
	import Bloodlines from '$lib/ui/Bloodlines.svelte';
	import Enhancements from '$lib/ui/Enhancements.svelte';
	import AncestryTraits from '$lib/ui/AncestryTraits.svelte';
	import Prerequisites from '$lib/ui/Prerequisites.svelte';
	
	// UI Framework Components
	import * as Tabs from '$lib/components/ui/tabs';
		
	// Props from the load function
	let { data } = $props<{ data: PageData }>();
	
	// State
	let character = $state<AssembledCharacter | null>(null);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	
	// Helper function for timestamps in logs
	function getTimestamp() {
		const now = new Date();
		return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
	}
	
	// Handle character loading events
	function handleCharacterLoaded(event: CustomEvent<AssembledCharacter>) {
		character = event.detail;
		isLoading = false;
		error = null;
		
		console.log(`${getTimestamp()} - Character loaded successfully:`, {
			id: character.id,
			name: character.name,
			classes: character.game_character_class?.map(c => c.class?.name) || [],
			ancestry: character.game_character_ancestry?.[0]?.ancestry?.name,
			level: character.totalLevel
		});
	}
	
	function handleCharacterError(event: CustomEvent<string>) {
		error = event.detail;
		isLoading = false;
		console.error(`${getTimestamp()} - Error loading character:`, error);
	}
	
	// Handle HP update
	async function handleHPUpdate(event: CustomEvent<number>) {
		if (!character) return;
		
		try {
			console.log(`${getTimestamp()} - Updating HP to: ${event.detail}`);
			
			// Get the UI adapter
			const uiAdapter = UIAdapter.getInstance();
			
			// Update character HP
			const newHP = event.detail;
			await uiAdapter.updateCharacterProperty(character.id, 'current_hp', newHP);
			
			// Update local state
			character.current_hp = newHP;
			
			console.log(`${getTimestamp()} - HP updated successfully`);
		} catch (error) {
			console.error(`${getTimestamp()} - Failed to update HP:`, error);
			// Could show a notification here
		}
	}
	
	// Handle feature activation
	async function handleFeatureActivation(event: CustomEvent<{ featureId: string, options: any }>) {
		if (!character) return;
		
		try {
			console.log(`${getTimestamp()} - Applying feature: ${event.detail.featureId}`);
			
			// Get the UI adapter
			const uiAdapter = UIAdapter.getInstance();
			
			// Apply feature
			const result = await uiAdapter.applyFeature(
				character.id,
				event.detail.featureId,
				event.detail.options
			);
			
			// Reload character to reflect changes
			character = await uiAdapter.loadCharacter(character.id, true);
			
			console.log(`${getTimestamp()} - Feature applied successfully:`, result);
		} catch (error) {
			console.error(`${getTimestamp()} - Failed to apply feature:`, error);
			// Could show a notification here
		}
	}
	
	// Value selection callback for stats
	function handleSelectValue(e: CustomEvent<{ path: string, value: any }>) {
		console.log(`Selected value: ${e.detail.path} = ${e.detail.value}`);
	}
</script>

<CharacterLoader {data} 
	on:loaded={handleCharacterLoaded}
	on:error={handleCharacterError}
>
	{#if character}
		<div class="p-4 space-y-4">
			<div class="grid gap-4 md:grid-cols-2">
				<CharacterHeader 
					name={character.name} 
					race={character.game_character_ancestry?.[0]?.ancestry?.name} 
					class={character.game_character_class?.[0]?.class?.name}
					level={character.totalLevel}
				/>
				<HPTracker 
					maxHP={character.max_hp} 
					currentHP={character.current_hp}
					on:update={handleHPUpdate}
				/>
			</div>
			
			<Tabs.Root value="stats" class="w-full">
				<Tabs.List class="w-full">
					<Tabs.Trigger value="stats">Stats</Tabs.Trigger>
					<Tabs.Trigger value="skills">Skills</Tabs.Trigger>
					<Tabs.Trigger value="combat">Combat</Tabs.Trigger>
					<Tabs.Trigger value="feats">Feats & Features</Tabs.Trigger>
					<Tabs.Trigger value="spells">Spells</Tabs.Trigger>
					<Tabs.Trigger value="items">Items</Tabs.Trigger>
				</Tabs.List>
				
				<div class="mt-4">
					<Tabs.Content value="stats" class="space-y-4">
						<div class="grid gap-4 md:grid-cols-2">
							<AbilityScores {character} onSelectValue={handleSelectValue} />
							<Saves {character} onSelectValue={handleSelectValue} />
						</div>
					</Tabs.Content>
					
					<Tabs.Content value="skills">
						<Skills {character} />
					</Tabs.Content>
					
					<Tabs.Content value="combat" class="space-y-4">
						<div class="grid gap-4 md:grid-cols-2">
							<ACStats {character} onSelectValue={handleSelectValue} />
							<CombatStats {character} onSelectValue={handleSelectValue} />
						</div>
					</Tabs.Content>
					
					<Tabs.Content value="feats" class="space-y-4">
						<AncestryTraits {character} />
						<ClassFeatures 
							{character} 
							on:activateFeature={handleFeatureActivation}
						/>
						<Archetypes {character} />
						<Discoveries {character} />
						<WildTalents {character} />
						<KiPowers {character} />
						<Bloodlines {character} />
						<Feats 
							{character} 
							on:activateFeature={handleFeatureActivation}
						/>
						<Corruptions 
							{character} 
							on:activateFeature={handleFeatureActivation}
						/>
						<!-- Prerequisites component temporarily disabled -->
						<!-- <Prerequisites {character} /> -->
					</Tabs.Content>
					
					<Tabs.Content value="spells" class="space-y-4">
						<SpellSlots {character} />
						<Spells {character} />
					</Tabs.Content>
					
					<Tabs.Content value="items" class="space-y-4">
						<Enhancements {character} />
						<p>Additional item management coming soon</p>
					</Tabs.Content>
				</div>
			</Tabs.Root>
		</div>
	{/if}
</CharacterLoader>