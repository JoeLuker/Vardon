<!-- FILE: src/routes/characters/[id]/+page.svelte -->
<script lang="ts">
	// Svelte 5
	import { onMount } from 'svelte';
	// If your build requires explicit imports:
	// import { state as $state } from 'svelte/reactivity';

	// Type imports
	import type { PageData } from './$types';
	import type { ValueWithBreakdown } from '$lib/domain/characterCalculations';
	import type { EnrichedCharacter } from '$lib/domain/characterCalculations';

	// Child components
	import CharacterHeader from '$lib/ui/CharacterHeader.svelte';
	import HPTracker from '$lib/ui/HPTracker.svelte';
	import Attributes from '$lib/ui/Attributes.svelte';
	import Skills from '$lib/ui/Skills.svelte';
	import Saves from '$lib/ui/Saves.svelte';
	import CombatStats from '$lib/ui/CombatStats.svelte';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Sheet from '$lib/components/ui/sheet';

	// DB and domain logic
	import {
		gameCharacterApi,
		gameCharacterAttributeApi,
		gameCharacterClassApi,
		gameCharacterFeatApi,
		gameCharacterSkillRankApi,
		gameCharacterArchetypeApi,
		gameCharacterAncestryApi,
		gameCharacterClassFeatureApi,
		gameCharacterCorruptionApi,
		gameCharacterCorruptionManifestationApi,
		gameCharacterWildTalentApi,
		gameCharacterAbpBonusApi,
		gameCharacterEquipmentApi,
		gameCharacterArmorApi
	} from '$lib/db/references';
	import { getCompleteCharacter } from '$lib/db/getCompleteCharacter';
	import { enrichCharacterData } from '$lib/domain/characterCalculations';

	import { page } from '$app/stores';
	import { afterNavigate } from '$app/navigation';

	// Props from the load function
	let { data } = $props<{ data: PageData }>();

	// State
	let character = $state<EnrichedCharacter | null>(
		data.rawCharacter ? enrichCharacterData(data.rawCharacter) : null
	);
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	// For watchers
	let watchersInitialized = false;
	let currentCharId: number | null = null;

	// Breakdown sheet state
	let selectedStatBreakdown = $state<ValueWithBreakdown | null>(null);
	let breakdownSheetOpen = $state(false);

	// Initialize watchers on mount
	onMount(() => {
		if (data.id !== null) {
			currentCharId = data.id;
			initWatchers();
		}
		
		return () => {
			cleanupWatchers();
		};
	});

	// Handle route changes
	afterNavigate(async () => {
		const newId = Number($page.params.id);
		if (newId !== currentCharId) {
			// Clean up old watchers
			cleanupWatchers();
			
			// Set up for new character
			currentCharId = newId;
			await loadCharacter(newId);
			initWatchers();
		}
	});

	/**
	 * Simplified loadCharacter that always uses fresh DB data
	 */
	async function loadCharacter(charId: number) {
		try {
			isLoading = true;
			const fetched = await getCompleteCharacter(charId);
			// Direct assignment - no merging with local state
			character = fetched ? enrichCharacterData(fetched) : null;
			isLoading = false;
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
			isLoading = false;
			character = null;
		}
	}

	/**
	 * initWatchers: attach DB watchers to reload data on changes
	 */
	function initWatchers() {
		if (watchersInitialized || !currentCharId) return;
		watchersInitialized = true;

		// Main table
		gameCharacterApi.startWatch(handleCharacterTableChange);

		// Bridging tables
		gameCharacterAttributeApi.startWatch(handleBridgingChange);
		gameCharacterClassApi.startWatch(handleBridgingChange);
		gameCharacterFeatApi.startWatch(handleBridgingChange);
		gameCharacterSkillRankApi.startWatch(handleBridgingChange);
		gameCharacterArchetypeApi.startWatch(handleBridgingChange);
		gameCharacterAncestryApi.startWatch(handleBridgingChange);
		gameCharacterClassFeatureApi.startWatch(handleBridgingChange);
		gameCharacterCorruptionApi.startWatch(handleBridgingChange);
		gameCharacterCorruptionManifestationApi.startWatch(handleBridgingChange);
		gameCharacterWildTalentApi.startWatch(handleBridgingChange);
		gameCharacterAbpBonusApi.startWatch(handleBridgingChange);
		gameCharacterEquipmentApi.startWatch(handleBridgingChange);
		gameCharacterArmorApi.startWatch(handleBridgingChange);
	}

	/**
	 * cleanupWatchers: stop DB watchers
	 */
	function cleanupWatchers() {
		if (!watchersInitialized) return;
		watchersInitialized = false;

		// main table
		gameCharacterApi.stopWatch();

		// bridging tables
		gameCharacterAttributeApi.stopWatch();
		gameCharacterClassApi.stopWatch();
		gameCharacterFeatApi.stopWatch();
		gameCharacterSkillRankApi.stopWatch();
		gameCharacterArchetypeApi.stopWatch();
		gameCharacterAncestryApi.stopWatch();
		gameCharacterClassFeatureApi.stopWatch();
		gameCharacterCorruptionApi.stopWatch();
		gameCharacterCorruptionManifestationApi.stopWatch();
		gameCharacterWildTalentApi.stopWatch();
		gameCharacterAbpBonusApi.stopWatch();
		gameCharacterEquipmentApi.stopWatch();
		gameCharacterArmorApi.stopWatch();
	}

	/**
	 * Simplified watcher handler - always reload on changes
	 */
	async function handleCharacterTableChange(type: 'insert' | 'update' | 'delete', row: any) {
		if (row?.id !== currentCharId) return;
		
		if (type === 'delete') {
			character = null;
		} else {
			// Always reload from DB on changes
			await loadCharacter(currentCharId!);
		}
	}

	/**
	 * Simplified bridging change handler
	 */
	async function handleBridgingChange(_type: 'insert' | 'update' | 'delete', row: any) {
		if (row?.game_character_id !== currentCharId) return;
		// Always reload from DB on any bridging table changes
		await loadCharacter(currentCharId!);
	}

	/**
	 * handleSelectValue: let children show a breakdown sheet
	 */
	function handleSelectValue(breakdown: ValueWithBreakdown) {
		selectedStatBreakdown = breakdown;
		breakdownSheetOpen = true;
	}
</script>

<!-- Template -->

<!-- Loading -->
{#if isLoading}
	<div class="flex min-h-[200px] items-center justify-center">
		<div class="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent"></div>
	</div>

<!-- Error -->
{:else if error}
	<div class="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
		{error}
	</div>

<!-- No Character Found -->
{:else if !character}
	<div class="rounded-md border border-muted p-4">
		<p class="text-muted-foreground">No character data found</p>
	</div>

<!-- Normal content -->
{:else}
	<div class="space-y-2">
		<!-- Some custom UI / Header -->
		<CharacterHeader character={character} />

		<!-- Tab container for different character sections -->
		<Tabs.Root value="attributes" class="w-full">
			<Tabs.List class="grid w-full grid-cols-3">
				<Tabs.Trigger value="attributes">Attributes</Tabs.Trigger>
				<Tabs.Trigger value="skills">Skills</Tabs.Trigger>
				<Tabs.Trigger value="combat">Combat</Tabs.Trigger>
			</Tabs.List>

			<!-- Attributes Section -->
			<Tabs.Content value="attributes">
				<div class="rounded-lg bg-secondary p-6">
					<!-- Pass the plain object, not a store -->
					<Attributes
					character={character}
						onSelectValue={handleSelectValue}
					/>
				</div>
			</Tabs.Content>

			<!-- Skills Section -->
			<Tabs.Content value="skills">
				<div class="rounded-lg bg-secondary p-6">
					<Skills character={character} onSelectValue={handleSelectValue} />
				</div>
			</Tabs.Content>

			<!-- Combat Section -->
			<Tabs.Content value="combat">
				<div class="space-y-6 rounded-lg bg-secondary p-6">
					<HPTracker
						character={character}
						onUpdateDB={async (changes) => {
							if (!character?.id) return;
							await gameCharacterApi.updateRow({
								id: character.id,
								...changes
							});
						}}
					/>
					<Saves character={character} onSelectValue={handleSelectValue} />
					<CombatStats character={character} onSelectValue={handleSelectValue} />
				</div>
			</Tabs.Content>
		</Tabs.Root>
	</div>

	<!-- Slide-up breakdown sheet -->
	<Sheet.Root bind:open={breakdownSheetOpen}>
		<Sheet.Content side="bottom">
			{#if selectedStatBreakdown}
				<Sheet.Header>
					<Sheet.Title>{selectedStatBreakdown.label} Breakdown</Sheet.Title>
					<Sheet.Description>
						A detailed breakdown of how 
						{selectedStatBreakdown.label} is calculated.
					</Sheet.Description>
				</Sheet.Header>

				<div class="space-y-3 p-4">
					<!-- List each modifier and value -->
					<ul class="space-y-1 text-sm">
						{#each selectedStatBreakdown.modifiers as m}
							<li>
								<span class="font-medium">{m.source}:</span>
								<span>{m.value >= 0 ? '+' : ''}{m.value}</span>
							</li>
						{/each}
					</ul>

					<p class="text-lg font-semibold">
						Total: {selectedStatBreakdown.total >= 0 ? '+' : ''}{selectedStatBreakdown.total}
					</p>
				</div>
			{/if}
		</Sheet.Content>
	</Sheet.Root>
{/if}
