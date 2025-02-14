<!-- FILE: src/routes/characters/[id]/+page.svelte -->
<script lang="ts">
	// SvelteKit & Svelte 5
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/stores';

	// Types
	import type { PageData } from './$types';
	import type { ValueWithBreakdown, EnrichedCharacter } from '$lib/domain/characterCalculations';
	import type { CompleteCharacter } from '$lib/db/gameRules.api';

	// Child components
	import CharacterHeader from '$lib/ui/CharacterHeader.svelte';
	import HPTracker from '$lib/ui/HPTracker.svelte';
	import AbilityScores from '$lib/ui/AbilityScores.svelte';
	import Skills from '$lib/ui/Skills.svelte';
	import Saves from '$lib/ui/Saves.svelte';
	import CombatStats from '$lib/ui/CombatStats.svelte';
	import ACStats from '$lib/ui/ACStats.svelte';
	import ClassFeatures from '$lib/ui/ClassFeatures.svelte';

	import * as Tabs from '$lib/components/ui/tabs';
	import * as Sheet from '$lib/components/ui/sheet';

	// Game Rules API
	import { GameRulesAPI, supabase } from '$lib/db';

	// Props from the load function
	let { data } = $props<{ data: PageData }>();

	// Create GameRules instance
	const gameRules = new GameRulesAPI(supabase);

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

	let isUnmounting = $state(false);

	// Import enrichCharacterData
	import { enrichCharacterData } from '$lib/domain/characterCalculations';

	/**
	 * Remove timestamp fields recursively from an object
	 */
	function removeTimestamps<T>(obj: T): T {
		if (!obj || typeof obj !== 'object') return obj;
		
		if (Array.isArray(obj)) {
			return obj.map(removeTimestamps) as T;
		}
		
		const newObj = { ...obj } as any;
		delete newObj.created_at;
		delete newObj.updated_at;
		
		for (const key in newObj) {
			if (typeof newObj[key] === 'object') {
				newObj[key] = removeTimestamps(newObj[key]);
			}
		}
		
		return newObj;
	}

	/**
	 * initReferenceData: optional function to fetch classes/feats
	 */
	async function initReferenceData(): Promise<void> {
		try {
			const [classes, feats] = await Promise.all([
				gameRules.getAllClass(),
				gameRules.getAllFeat()
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
				
				try {
					await initReferenceData();
					
					rawCharacter = data.rawCharacter ?? null;
					if (rawCharacter) {
						console.log('Raw character before enrichment:', JSON.stringify(removeTimestamps(rawCharacter), null, 2));
						(async () => {
							character = await enrichCharacterData(rawCharacter, gameRules);
							console.log('Enriched character (mount):', JSON.stringify(removeTimestamps(character), null, 2));
						})();
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
			
			await loadCharacter(newId, gameRules);

			if (!isUnmounting) {
				initWatchers();
			}
		}
	});

	/**
	 * loadCharacter: fetch from DB and re-enrich
	 */
	async function loadCharacter(charId: number, rules: GameRulesAPI | null) {
		if (!rules) {
			error = 'Game rules not loaded';
			return;
		}
		
		try {
			isLoading = true;
			const fetched = await rules.getCompleteCharacterData(charId);
			rawCharacter = fetched;
			character = fetched ? await enrichCharacterData(fetched, rules) : null;
			console.log('Enriched character (load):', removeTimestamps(character));
			isLoading = false;
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
			isLoading = false;
			character = null;
		}
	}

	/**
	 * initWatchers: attach supabase watchers
	 */
	function initWatchers() {
		if (watchersInitialized) return;
		watchersInitialized = true;

		// Main character table watcher
		gameRules.watchGameCharacter((type, row) => {
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
					(async () => {
						character = await enrichCharacterData(rawCharacter, gameRules);
					})();
				}
				return;
			}
		});

		// For skill ranks and other bridging tables
		gameRules.watchGameCharacterSkillRank(async (_type, row) => {
			if (row?.game_character_id === currentCharId && currentCharId && rawCharacter) {
				// Only update the skills portion
				const updatedChar = await gameRules.getCompleteCharacterData(currentCharId);
				if (updatedChar) {
					rawCharacter = updatedChar;
					if (gameRules) {
						(async () => {
							character = await enrichCharacterData(updatedChar, gameRules);
						})();
					}
				}
			}
		});

		// Watch all other character-related tables
		const watchFunctions = [
			'watchGameCharacterAbility',
			'watchGameCharacterClass',
			'watchGameCharacterFeat',
			'watchGameCharacterArchetype',
			'watchGameCharacterAncestry',
			'watchGameCharacterClassFeature',
			'watchGameCharacterCorruption',
			'watchGameCharacterCorruptionManifestation',
			'watchGameCharacterWildTalent',
			'watchGameCharacterEquipment',
			'watchGameCharacterArmor',
			'watchGameCharacterAbpChoice'
		] as const;

		for (const watchFn of watchFunctions) {
			gameRules[watchFn](async (_row: any) => {
				if (_row?.game_character_id === currentCharId && currentCharId) {
					const fetched = await gameRules.getCompleteCharacterData(currentCharId);
					if (fetched) {
						rawCharacter = fetched;
						if (gameRules) {
							(async () => {
								character = await enrichCharacterData(fetched, gameRules);
							})();
						}
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
			gameRules.stopAllWatchers();
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
			<Tabs.List class="grid w-full grid-cols-4">
				<Tabs.Trigger value="abilityScores">Ability Scores</Tabs.Trigger>
				<Tabs.Trigger value="skills">Skills</Tabs.Trigger>
				<Tabs.Trigger value="combat">Combat</Tabs.Trigger>
				<Tabs.Trigger value="features">Features</Tabs.Trigger>
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
					<Skills
						character={character}
						rules={gameRules}
						onSelectValue={handleSelectValue}
						onUpdateDB={async (changes) => {
							if (!character?.id) return;
							if (changes.type === 'add') {
								await gameRules.createGameCharacterSkillRank({
									game_character_id: character.id,
									skill_id: changes.skillId,
									applied_at_level: changes.level,
								});
							} else {
								const existingRank = await gameRules.getGameCharacterSkillRankById(changes.skillId);
								if (existingRank) {
									await gameRules.deleteGameCharacterSkillRank(existingRank.id);
								}
							}
						}}
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
							await gameRules.updateGameCharacter({
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

			<!-- Features -->
			<Tabs.Content value="features">
				<div class="rounded-lg bg-secondary p-6">
					<ClassFeatures
						character={character}
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
