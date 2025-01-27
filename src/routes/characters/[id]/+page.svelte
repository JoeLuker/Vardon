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
	import type { GameRulesData } from '$lib/db/getGameRulesData';
	import { getGameRulesData } from '$lib/db/getGameRulesData';

	// Child components
	import CharacterHeader from '$lib/ui/CharacterHeader.svelte';
	import HPTracker from '$lib/ui/HPTracker.svelte';
	import AbilityScores from '$lib/ui/AbilityScores.svelte';
	import Skills from '$lib/ui/Skills.svelte';
	import Saves from '$lib/ui/Saves.svelte';
	import CombatStats from '$lib/ui/CombatStats.svelte';
	import ACStats from '$lib/ui/ACStats.svelte';
	import SkillRankGrid from '$lib/ui/SkillRankGrid.svelte';

	import * as Tabs from '$lib/components/ui/tabs';
	import * as Sheet from '$lib/components/ui/sheet';

	// DB references
	import {
			gameCharacterApi,
			gameCharacterAbilityApi,
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
	let gameRules = $state<GameRulesData | null>(null);

	// Optional: reference maps if we want to fetch class/feat details
	let classMap = new Map<number, any>();
	let featMap = new Map<number, any>();

	// Watchers
	let watchersInitialized = false;
	let currentCharId: number | null = null;

	// Breakdown sheet
	let selectedStatBreakdown = $state<ValueWithBreakdown | null>(null);
	let breakdownSheetOpen = $state(false);

	let isUnmounting = $state(false);


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

			(async () => {
				if (isUnmounting) return;
				
				// Load gameRules first, then use it
				try {
					gameRules = await getGameRulesData();
					await initReferenceData();
					
					rawCharacter = data.rawCharacter ?? null;
					if (gameRules && rawCharacter) {
						character = enrichCharacterData(rawCharacter, gameRules);
					} else {
						console.error('Game rules not loaded');
					}

					if (!isUnmounting) {
						initWatchers();
					}
				} catch (err) {
					console.error('Failed to load game rules:', err);
					error = 'Failed to load game rules';
				}
			})();
		}

		return () => {
			isUnmounting = true;
			cleanupWatchers();
		};
	});

	// If the user navigates to a different ID without a full refresh
	afterNavigate(async () => {
		const newId = Number($page.params.id);
		if (newId !== currentCharId && !isUnmounting) {
			cleanupWatchers();
			currentCharId = newId;
			
			if (!gameRules) {
				gameRules = await getGameRulesData();
			}
			
			await loadCharacter(newId, gameRules);

			if (!isUnmounting) {
				initWatchers();
			}
		}
	});

	/**
	 * loadCharacter: fetch from DB and re-enrich
	 */
	async function loadCharacter(charId: number, rules: GameRulesData | null) {
		if (!rules) {
			error = 'Game rules not loaded';
			return;
		}
		
		try {
			isLoading = true;
			const fetched = await getCompleteCharacter(charId);
			rawCharacter = fetched;
			character = fetched ? enrichCharacterData(fetched, rules) : null;
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

		// Main character table watcher
		gameCharacterApi.startWatch(async (type, row) => {
			if (row?.id !== currentCharId) return;
			
			if (type === 'delete') {
				rawCharacter = null;
				character = null;
				return;
			}

			// For simple updates, patch the existing character
			if (type === 'update' && rawCharacter) {
				rawCharacter = {
					...rawCharacter,
					current_hp: row.current_hp,
					max_hp: row.max_hp,
					name: row.name,
					label: row.label
				};
				if (gameRules) {
					character = enrichCharacterData(rawCharacter, gameRules);
				}
				return;
			}
		});

		// For skill ranks and other bridging tables
		gameCharacterSkillRankApi.startWatch(async (_type, row) => {
			if (row?.game_character_id === currentCharId && currentCharId && rawCharacter) {
				// Only update the skills portion
				const updatedChar = await getCompleteCharacter(currentCharId);
				if (updatedChar) {
					rawCharacter = {
						...rawCharacter,
						skillRanks: updatedChar.skillRanks,
					};
					if (gameRules && rawCharacter) {
						character = enrichCharacterData(rawCharacter, gameRules);
					}
				}
			}
		});

		// For other bridging tables, use selective updates when possible
		const tables = [
			gameCharacterAbilityApi,
			gameCharacterClassApi,
			gameCharacterFeatApi,
			gameCharacterArchetypeApi,
			gameCharacterAncestryApi,
			gameCharacterClassFeatureApi,
			gameCharacterCorruptionApi,
			gameCharacterCorruptionManifestationApi,
			gameCharacterWildTalentApi,
			gameCharacterEquipmentApi,
			gameCharacterArmorApi,
			gameCharacterAbpChoiceApi
		];

		for (const table of tables) {
			table.startWatch(async (_type, row) => {
				if (row?.game_character_id === currentCharId && currentCharId) {
					// For these tables, we need to do a full refresh but without loading state
					const fetched = await getCompleteCharacter(currentCharId);
					if (fetched) {
						rawCharacter = fetched;
						character = enrichCharacterData(fetched, gameRules!);
					}
				}
			});
		}
	}

	/**
	 * cleanupWatchers: stop them
	 */
	function cleanupWatchers() {
		if (!watchersInitialized) return;

		try {
			gameCharacterApi.stopWatch();
			gameCharacterAbilityApi.stopWatch();
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
		} catch (err) {
			console.error('Error cleaning up watchers:', err);
		} finally {
			watchersInitialized = false;
		}
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
		<Tabs.Root value="abilityScores" class="w-full">
			<Tabs.List class="grid w-full grid-cols-3">
				<Tabs.Trigger value="abilityScores">Ability Scores</Tabs.Trigger>
				<Tabs.Trigger value="skills">Skills</Tabs.Trigger>
				<Tabs.Trigger value="combat">Combat</Tabs.Trigger>
			</Tabs.List>

			<!-- AbilityScores -->
			<Tabs.Content value="abilityScores">
				<div class="rounded-lg bg-secondary p-6">
					<AbilityScores
						character={character}
						onSelectValue={handleSelectValue}
					/>
				</div>
			</Tabs.Content>

			<!-- Skills -->
			<Tabs.Content value="skills">
				<div class="rounded-lg bg-secondary p-6">
					<SkillRankGrid
						character={character}
						onUpdateDB={async (changes) => {
							if (!character?.id) return;
							if (changes.type === 'add') {
								await gameCharacterSkillRankApi.createRow({
									game_character_id: character.id,
									skill_id: changes.skillId,
									applied_at_level: changes.level,
								});
							} else {
								const existingRanks = await gameCharacterSkillRankApi.getRowsByFilter({
									game_character_id: character.id,
									skill_id: changes.skillId,
									applied_at_level: changes.level,
								});
								if (existingRanks?.length) {
									await gameCharacterSkillRankApi.deleteRow(existingRanks[0].id);
								}
							}
						}}
					/>
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
