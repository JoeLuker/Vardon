<!-- FILE: src/routes/characters/[id]/+page.svelte -->
<script lang="ts">
	// SvelteKit & Svelte 5
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/stores';

	// Types
	import type { PageData } from './$types';
	import type { ValueWithBreakdown, EnrichedCharacter } from '$lib/domain/characterCalculations';
	import type { CompleteCharacter } from '$lib/db/getCompleteCharacter';

	// Child components
	import CharacterHeader from '$lib/ui/CharacterHeader.svelte';
	import HPTracker from '$lib/ui/HPTracker.svelte';
	import Attributes from '$lib/ui/Attributes.svelte';
	import Skills from '$lib/ui/Skills.svelte';
	import Saves from '$lib/ui/Saves.svelte';
	import CombatStats from '$lib/ui/CombatStats.svelte';
	import ACStats from '$lib/ui/ACStats.svelte';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Sheet from '$lib/components/ui/sheet';

	// DB references
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
			gameCharacterEquipmentApi,
			gameCharacterArmorApi,
			classApi,
			featApi,
			gameCharacterAbpChoiceApi
	} from '$lib/db/references';

	import { getCompleteCharacter } from '$lib/db/getCompleteCharacter';
	import { enrichCharacterData } from '$lib/domain/characterCalculations';

	// Props from the load function
	let { data } = $props<{ data: PageData }>();

	// Svelte 5 runic state for reactivity
	let rawCharacter = $state<CompleteCharacter | null>(null);
	let character = $state<EnrichedCharacter | null>(null);
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	// Optional: reference maps if we want to fetch class/feat details
	let classMap = new Map<number, any>();
	let featMap = new Map<number, any>();

	// Watchers
	let watchersInitialized = false;
	let currentCharId: number | null = null;

	// Breakdown sheet
	let selectedStatBreakdown = $state<ValueWithBreakdown | null>(null);
	let breakdownSheetOpen = $state(false);

	/**
	 * initReferenceData: optional function to fetch classes/feats, store them in classMap/featMap
	 */
	async function initReferenceData(): Promise<void> {
		try {
			const [classes, feats] = await Promise.all([
				classApi.getAllRows(),
				featApi.getAllRows()
			]);
			classes.forEach((c) => classMap.set(c.id, c));
			feats.forEach((f) => featMap.set(f.id, f));
		} catch (err) {
			console.error('Failed to load reference data:', err);
			error = 'Failed to load reference data';
		}
	}

	// Setup onMount
	onMount(() => {
		if (data.id !== null) {
			currentCharId = data.id;

			// Do async work in an IIFE
			(async () => {
				// 1) (Optional) Load reference data
				await initReferenceData();

				// 2) Use the server-provided rawCharacter
				rawCharacter = data.rawCharacter ?? null;
				if (rawCharacter) {
					character = enrichCharacterData(rawCharacter);
					console.log('Character:', JSON.stringify(character, null, 2));
				}

				// 3) Initialize watchers
				initWatchers();
			})();
		}

		// Return a synchronous cleanup function
		return () => {
			cleanupWatchers();
		};
	});

	// If the user navigates to a different ID without a full refresh
	afterNavigate(async () => {
		const newId = Number($page.params.id);
		if (newId !== currentCharId) {
			// Clean up watchers from the old char
			cleanupWatchers();

			// Load the new char
			currentCharId = newId;
			await loadCharacter(newId);

			// Re-init watchers
			initWatchers();
		}
	});

	/**
	 * loadCharacter: fetch from DB and re-enrich
	 */
	async function loadCharacter(charId: number) {
		try {
			isLoading = true;
			const fetched = await getCompleteCharacter(charId);
			rawCharacter = fetched;
			character = fetched ? enrichCharacterData(fetched) : null;
			isLoading = false;
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
			isLoading = false;
			character = null;
		}
	}

	/**
	 * initWatchers: attach supabase watchers (only once)
	 */
	function initWatchers() {
		if (watchersInitialized) return;
		watchersInitialized = true;

		// Main table
		gameCharacterApi.startWatch(handleCharacterTableChange);

		// Bridging
		gameCharacterClassApi.startWatch((type, row) =>
			handleBridgingChange(type, row, 'game_character_class')
		);
		gameCharacterFeatApi.startWatch((type, row) =>
			handleBridgingChange(type, row, 'game_character_feat')
		);
		gameCharacterSkillRankApi.startWatch((type, row) =>
			handleBridgingChange(type, row, 'game_character_skill_rank')
		);

		gameCharacterArchetypeApi.startWatch((type, row) =>
			handleBridgingChange(type, row, 'game_character_archetype')
		);
		gameCharacterAncestryApi.startWatch((type, row) =>
			handleBridgingChange(type, row, 'game_character_ancestry')
		);
		gameCharacterClassFeatureApi.startWatch((type, row) =>
			handleBridgingChange(type, row, 'game_character_class_feature')
		);

		gameCharacterCorruptionApi.startWatch((type, row) =>
			handleBridgingChange(type, row, 'game_character_corruption')
		);
		gameCharacterCorruptionManifestationApi.startWatch((type, row) =>
			handleBridgingChange(type, row, 'game_character_corruption_manifestation')
		);

		gameCharacterWildTalentApi.startWatch((type, row) =>
			handleBridgingChange(type, row, 'game_character_wild_talent')
		);
		gameCharacterEquipmentApi.startWatch((type, row) =>
			handleBridgingChange(type, row, 'game_character_equipment')
		);
		gameCharacterArmorApi.startWatch((type, row) =>
			handleBridgingChange(type, row, 'game_character_armor')
		);
		gameCharacterAbpChoiceApi.startWatch((type, row) =>
			handleBridgingChange(type, row, 'game_character_abp_choice')
		);
	}

	/**
	 * cleanupWatchers: stop them
	 */
	function cleanupWatchers() {
		if (!watchersInitialized) return;

		gameCharacterApi.stopWatch();
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
		gameCharacterEquipmentApi.stopWatch();
		gameCharacterArmorApi.stopWatch();
		gameCharacterAbpChoiceApi.stopWatch();

		watchersInitialized = false;
	}

	/**
	 * handleCharacterTableChange: partial updates for main table
	 */
	async function handleCharacterTableChange(
		type: 'insert' | 'update' | 'delete',
		row: any
	) {
		if (row?.id !== currentCharId) return;

		if (type === 'delete') {
			rawCharacter = null;
			character = null;
			return;
		}
		if (!rawCharacter) return;

		rawCharacter = {
			...rawCharacter,
			current_hp: row.current_hp,
			max_hp: row.max_hp,
			name: row.name,
			label: row.label
		};
		character = enrichCharacterData(rawCharacter);
	}

	/**
	 * handleBridgingChange: partial update bridging tables
	 */
	async function handleBridgingChange(
		type: 'insert' | 'update' | 'delete',
		row: any,
		tableName: string
	) {
		if (!rawCharacter || row?.game_character_id !== currentCharId) return;

		switch (tableName) {
			case 'game_character_class':
				if (type === 'insert') {
					const classData = classMap.get(row.class_id);
					if (classData) {
						rawCharacter.classes.push({
							base: classData,
							level: row.level,
							class_skills: [] // required by your type
						});
					}
				} else if (type === 'update') {
					const idx = rawCharacter.classes.findIndex(
						(c: any) => c.base.id === row.class_id
					);
					if (idx >= 0) {
						rawCharacter.classes[idx].level = row.level;
					}
				} else if (type === 'delete') {
					rawCharacter.classes = rawCharacter.classes.filter(
						(c: any) => c.base.id !== row.class_id
					);
				}
				break;

			case 'game_character_abp_choice':
				if (type === 'insert') {
					rawCharacter.abpChoices ||= [];
					rawCharacter.abpChoices.push({
						group: {
							id: row.group_id,
							// Add other required group properties with placeholder values
							created_at: null,
							label: null,
							level: 0,
							name: '',
							requires_choice: true,
							updated_at: null
						},
						node: {
							id: row.node_id,
							// Add other required node properties with placeholder values
							created_at: null,
							name: '',
							bonuses: [],
							updated_at: null,
							description: null,
							group_id: 0,
							label: null,
							requires_choice: false
						}
					});
				} else if (type === 'update') {
					const idx = rawCharacter.abpChoices?.findIndex(
						(c: any) => c.group.id === row.group_id
					);
					if (idx >= 0) {
						rawCharacter.abpChoices[idx].node.id = row.node_id;
					}
				} else if (type === 'delete') {
					rawCharacter.abpChoices = rawCharacter.abpChoices?.filter(
						(c: any) => !(c.group.id === row.group_id)
					);
				}
				break;

			// add similar bridging logic for other tables
		}

		// Re-enrich after bridging update
		character = enrichCharacterData(rawCharacter);
	}

	/**
	 * handleSelectValue: show breakdown in the sheet
	 */
	function handleSelectValue(breakdown: ValueWithBreakdown) {
		selectedStatBreakdown = breakdown;
		breakdownSheetOpen = true;
	}
</script>

<!-- Template -->
{#if isLoading}
	<!-- Loading spinner -->
	<div class="flex min-h-[200px] items-center justify-center">
		<div class="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent"></div>
	</div>
{:else if error}
	<!-- Error message -->
	<div class="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
		{error}
	</div>
{:else if !character}
	<!-- If no character loaded -->
	<div class="rounded-md border border-muted p-4">
		<p class="text-muted-foreground">No character data found</p>
	</div>
{:else}
	<!-- Normal content -->
	<div class="space-y-2">
		<!-- Header -->
		<CharacterHeader character={character} />

		<!-- Tabs -->
		<Tabs.Root value="attributes" class="w-full">
			<Tabs.List class="grid w-full grid-cols-3">
				<Tabs.Trigger value="attributes">Attributes</Tabs.Trigger>
				<Tabs.Trigger value="skills">Skills</Tabs.Trigger>
				<Tabs.Trigger value="combat">Combat</Tabs.Trigger>
			</Tabs.List>

			<!-- Attributes -->
			<Tabs.Content value="attributes">
				<div class="rounded-lg bg-secondary p-6">
					<Attributes
						character={character}
						onSelectValue={handleSelectValue}
					/>
				</div>
			</Tabs.Content>

			<!-- Skills -->
			<Tabs.Content value="skills">
				<div class="rounded-lg bg-secondary p-6">
					<Skills
						character={character}
						onSelectValue={handleSelectValue}
					/>
				</div>
			</Tabs.Content>

			<!-- Combat -->
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
					<Saves
						character={character}
						onSelectValue={handleSelectValue}
					/>
					<ACStats
						character={character}
						onSelectValue={handleSelectValue}
					/>
					<CombatStats
						character={character}
						onSelectValue={handleSelectValue}
					/>
				</div>
			</Tabs.Content>
		</Tabs.Root>
	</div>

	<!-- Bottom sheet for breakdown -->
	<Sheet.Root bind:open={breakdownSheetOpen}>
		<Sheet.Content side="bottom">
			{#if selectedStatBreakdown}
				<Sheet.Header>
					<Sheet.Title>{selectedStatBreakdown.label} Breakdown</Sheet.Title>
					<Sheet.Description>
						A detailed breakdown of how {selectedStatBreakdown.label} is calculated.
					</Sheet.Description>
				</Sheet.Header>
				<div class="space-y-3 p-4">
					<!-- Show each modifier -->
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
