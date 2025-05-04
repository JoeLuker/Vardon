<script lang="ts">
	import { Eye, EyeOff, Grid, Circle } from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import type { AssembledCharacter, ValueWithBreakdown } from '$lib/ui/types/CharacterTypes';
	import type { SkillWithRanks } from '$lib/domain/character/characterTypes';
	import type { GameRules, GameRulesAPI } from '$lib/db/gameRules.api';
	// Use the type from the GameRules namespace
	type GameCharacterSkillRank = GameRules.Base.Row<'game_character_skill_rank'>;
	import _ from 'lodash';

	interface ProcessedSkill {	
		id: number;
		name: string;
		label: string;
		ability: string;
		total: number;
		ranks: number;
		trainedOnly: boolean;
		isClassSkill: boolean;
		ranksByLevel: Array<number>;
		overrides?: {
			trained_only?: boolean;
			ability?: {
				original: string;
				override: string;
				source: string;
			};
		};
	}

	// Accept parent-managed pending operations and errors
	let { 
		character, 
		rules, 
		onSelectValue = () => {},
		onUpdateDB = async () => {},
		pendingOperations = null,
		operationErrors = null,
		optimisticRanks = null,
		optimisticPoints = null,
		isOperationPending = null,
	} = $props<{
		character?: AssembledCharacter | null;
		rules?: GameRulesAPI | null;
		onSelectValue?: (val: ValueWithBreakdown) => void;
		onUpdateDB?: (
			skillId: number,
			level: number,
			isAdding: boolean
		) => Promise<void>;
		pendingOperations?: Map<string, { type: string; timestamp: number }> | null;
		operationErrors?: Map<string, { message: string; expiresAt: number }> | null;
		optimisticRanks?: Map<string, boolean> | null;
		optimisticPoints?: Map<number, number> | null;
		isOperationPending?: (skillId: number, level: number) => boolean;
	}>();

	let showUnusableSkills = $state(false);
	let showRankAllocation = $state(false);
	let previousShowUnusableSkills = $state(false);
	let viewMode = $state<'ability' | 'alphabetical'>('ability');
	let error = $state<string | null>(null);
	let filterTimestamp = $state(Date.now());
	
	// Function to toggle visibility with a forced refresh
	function toggleUnusableSkills() {
		console.log('Toggle unusable skills called, before change:', showUnusableSkills);
		
		// Set directly to force state change
		showUnusableSkills = !showUnusableSkills;
		
		// Force reactivity by updating timestamp and clearing cache
		filterTimestamp = Date.now();
		skillCalculationCache = new Map();
		
		// Force recalculation of the filtered skills
		if (baseSkillsDataResolved) {
			console.log('Manually rebuilding filtered skills list with showUnusableSkills =', showUnusableSkills);
			// This will trigger a UI update since we're assigning to a variable used in the template
			baseSkillsDataResolved = {...baseSkillsDataResolved};
		}
		
		console.log('Toggle complete, new value:', showUnusableSkills, 'timestamp:', filterTimestamp);
	}

	// Helper function to get key for skill-level pair
	function getSkillLevelKey(skillId: number, level: number): string {
		return `${skillId}-${level}`;
	}

	let levelNumbers = $derived(
		Array.from({ length: character?.totalLevel ?? 0 }, (_, i) => i + 1)
	);

	// Add this helper function near the top of the script section
	function getTimestamp() {
		const now = new Date();
		return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
	}

	// Add a cache for skill calculations to prevent recalculating on every state change
	let skillCalculationCache = $state<Map<number, { total: number, ranks: number }>>(new Map());
	
	// Function to get skill data with caching
	function getSkillData(skillId: number): { total: number, ranks: number } | undefined {
		// Return from cache if available and not invalidated
		if (skillCalculationCache.has(skillId)) {
			return skillCalculationCache.get(skillId);
		}
		
		// Calculate if not in cache
		if (character?.skills?.[skillId]) {
			const skillData = character.skills[skillId];
			const ranks = getSkillRanksCount(skillId);
			
			// Store in cache
			skillCalculationCache.set(skillId, {
				total: skillData.total,
				ranks: ranks
			});
			
			return skillCalculationCache.get(skillId);
		}
		
		return undefined;
	}
	
	// Function to update a skill in the local cache without full recalculation
	function updateSkillInCache(skillId: number, isAdding: boolean): void {
		if (!character?.skills?.[skillId]) return;
		
		// Get current cached data or calculate
		const currentData = getSkillData(skillId);
		if (!currentData) return;
		
		// Apply the change
		const rankChange = isAdding ? 1 : -1;
		const newRanks = currentData.ranks + rankChange;
		const newTotal = currentData.total + rankChange;
		
		// Update the cache
		skillCalculationCache.set(skillId, {
			total: newTotal,
			ranks: newRanks
		});
	}
	
	// Base skill data - only recomputed when character/rules change
	let baseSkillsData = $derived.by(async () => {
		if (!rules || !character) return {
			byAbility: {},
			allSkills: []
		};

		try {
			const allSkills = await rules.getAllSkill();
			const byAbility: Record<string, ProcessedSkill[]> = {};
			const processedSkills: ProcessedSkill[] = [];

			for (const baseSkill of allSkills) {
				const skillId = baseSkill.id;
				const skillData = character.skills[skillId];
				
				if (!skillData) continue;

				const baseAbility = baseSkill.ability;
				// Use override if it exists, otherwise use the base ability
				const abilityName = (skillData.overrides?.ability?.override ?? 
					baseAbility?.label ?? 
					'MISC').toUpperCase();

				const skillWithRanks = character.skillsWithRanks?.find(
					(s: SkillWithRanks) => s.skillId === baseSkill.id
				);

				const processed: ProcessedSkill = {
					id: baseSkill.id,
					name: baseSkill.name,
					label: baseSkill.label,
					ability: abilityName,
					total: skillData.total,
					ranks: getSkillRanksCount(baseSkill.id),
					trainedOnly: skillData.overrides?.trained_only ?? baseSkill.trained_only,
					isClassSkill: skillWithRanks?.isClassSkill ?? false,
					ranksByLevel: skillWithRanks?.skillRanks?.map(
						(sr: { level: number; rank: number }) => sr.rank
					) ?? [],
					overrides: skillData.overrides
				};

				if (!byAbility[abilityName]) byAbility[abilityName] = [];
				byAbility[abilityName].push(processed);
				processedSkills.push(processed);
			}

			return {
				byAbility,
				allSkills: processedSkills
			};
		} catch (error) {
			console.error('Failed to load skills:', error);
			throw new Error('Failed to load skills. Please try again.');
		}
	});

	// Improved function to get skill ranks count considering optimistic state
	function getSkillRanksCount(skillId: number): number {
		if (!character) return 0;
		
		// Count from actual character data
		const baseCount = character.game_character_skill_rank?.filter(
			(rank: GameCharacterSkillRank) => rank.skill_id === skillId
		).length ?? 0;
		
		// Adjust for optimistic changes
		let delta = 0;
		if (optimisticRanks) {
			for (let level = 1; level <= (character.totalLevel ?? 0); level++) {
				const key = getSkillLevelKey(skillId, level);
				// Check if we have this rank in server data
				const serverHasRank = character.game_character_skill_rank?.some(
					(rank: GameCharacterSkillRank) => 
						rank.skill_id === skillId && rank.applied_at_level === level
				) ?? false;
				
				// Check if we have an optimistic update for this key
				if (optimisticRanks.has(key)) {
					const optimisticValue = optimisticRanks.get(key);
					
					if (optimisticValue && !serverHasRank) {
						// We want a rank that server doesn't have
						delta++;
					} else if (!optimisticValue && serverHasRank) {
						// We don't want a rank that server has
						delta--;
					}
				}
			}
		}
		
		return baseCount + delta;
	}

	// Filtered skills for current view - recalculated when toggle state changes
	let filteredSkillsByAbility = $derived.by(async () => {
		const baseData = await baseSkillsData;
		const result: Record<string, ProcessedSkill[]> = {};
		
		// Include timestamp to force reactivity
		const timestamp = filterTimestamp;
		console.log(`[${timestamp}] Recalculating filteredSkillsByAbility with showUnusableSkills=${showUnusableSkills}`);
		
		// Don't filter based on visibility - let the template handle that
		for (const [ability, skills] of Object.entries(baseData.byAbility)) {
			result[ability] = skills;
		}
		
		return result;
	});

	// Filtered and sorted skills for alphabetical view
	let filteredSkillsAlphabetical = $derived.by(async () => {
		const baseData = await baseSkillsData;
		
		// Include timestamp to force reactivity
		const timestamp = filterTimestamp;
		console.log(`[${timestamp}] Recalculating filteredSkillsAlphabetical with showUnusableSkills=${showUnusableSkills}`);
		
		// Don't filter based on visibility - let the template handle that
		return baseData.allSkills
			.sort((a, b) => a.name.localeCompare(b.name));
	});

	function isSkillUnusable(skill: ProcessedSkill): boolean {
		const effectiveTrainedOnly = skill.overrides?.trained_only ?? skill.trainedOnly;
		return effectiveTrainedOnly && getSkillRanksCount(skill.id) === 0;
	}

	function formatModifier(mod: number): string {
		return mod >= 0 ? `+${mod}` : `${mod}`;
	}

	// Enhanced function to check if a skill has a rank, considering optimistic state
	function hasSkillRank(skillId: number, level: number): boolean {
		if (!character) return false;
		
		// Check the optimistic value first
		const skillLevelKey = getSkillLevelKey(skillId, level);
		const optimisticExists = optimisticRanks?.has(skillLevelKey) ?? false;
		const optimisticValue = optimisticExists ? optimisticRanks.get(skillLevelKey) : null;
		
		// Debug logging for tracking Bluff skill
		if (skillId === 30 && isDebugMode) {
			console.log(`[${getTimestamp()}] [UI DEBUG] Checking rank for Bluff ${skillLevelKey}:`, {
				optimisticExists,
				optimisticValue,
				serverHasRank: !!(character?.game_character_skill_rank?.some(
					(rank: GameCharacterSkillRank) => rank.skill_id === skillId && rank.applied_at_level === level
				)),
				pendingOperations: pendingOperations ? Object.fromEntries(pendingOperations) : 'null',
				isPending: isOperationPendingLocal(skillId, level),
				returnValue: optimisticExists 
					? optimisticValue 
					: !!(character?.game_character_skill_rank?.some(
						(rank: GameCharacterSkillRank) => rank.skill_id === skillId && rank.applied_at_level === level
					))
			});
		}
		
		// Use the optimistic value if it exists, otherwise fall back to the server value
		if (optimisticExists) {
			return optimisticValue!;
		}

		// Otherwise check if the rank exists in the character data
		return !!(character?.game_character_skill_rank?.some(
			(rank: GameCharacterSkillRank) => rank.skill_id === skillId && rank.applied_at_level === level
		));
	}

	// Add debug mode flag that can be turned on/off
	const isDebugMode = false;
	
	// Improved function to check if an operation is pending
	function isOperationPendingLocal(skillId: number, level: number): boolean {
		const skillLevelKey = getSkillLevelKey(skillId, level);
		
		// Use parent function if available
		if (typeof isOperationPending === 'function') {
			const isPending = isOperationPending(skillId, level);
			if (skillId === 30 && isDebugMode) {
				console.log(`[${getTimestamp()}] [UI DEBUG] Checking pending operation from parent for Bluff ${skillLevelKey}:`, { isPending });
			}
			return isPending;
		}
		
		// Fall back to local check
		const isPending = pendingOperations?.has(skillLevelKey) ?? false;
		if (skillId === 30 && isDebugMode) {
			console.log(`[${getTimestamp()}] [UI DEBUG] Checking pending operation locally for Bluff ${skillLevelKey}:`, { isPending });
		}
		return isPending;
	}

	// Function to get remaining points for a level, considering optimistic state
	function getRemainingPoints(level: number): number {
		if (!character?.skillPoints?.remaining) return 0;
		
		// If we have an optimistic value for this level, use it
		if (optimisticPoints?.has(level)) {
			return optimisticPoints.get(level) as number;
		}
		
		// Otherwise use actual data
		return character.skillPoints.remaining[level] ?? 0;
	}

	// Get error for operation if any
	function getOperationError(skillId: number, level: number): string | null {
		if (!operationErrors) return null;
		
		const key = getSkillLevelKey(skillId, level);
		const errorInfo = operationErrors.get(key);
		return errorInfo?.message ?? null;
	}

	// Override the baseSkillsData derived calculation to use the cache for optimizations
	let baseSkillsDataResolved: { byAbility: Record<string, ProcessedSkill[]>; allSkills: ProcessedSkill[] } | null = null;
	
	$effect(() => {
		if (!rules || !character) return;
		
		// Set up the async processing in a self-executing async function
		(async () => {
			try {
				// Wait for baseSkillsData to be resolved
				const resolved = await baseSkillsData;
				baseSkillsDataResolved = resolved;
				
				// Only recalculate everything if we don't have data yet
				if (!resolved || !resolved.allSkills || resolved.allSkills.length === 0) {
					// Let the derived calculation handle it
				} else {
					// Update just the changed skills - called whenever optimisticRanks changes
					// This is a performance optimization to avoid full recalculation
				}
			} catch (error) {
				console.error('Error in skills effect:', error);
			}
		})();
	});

	// Improved function to handle skill rank cell clicks with efficient updates and local caching
	async function handleCellClick(skillId: number, level: number) {
		if (!character) {
			console.error(`[${getTimestamp()}] [UI DEBUG] Cannot update skill - character is null`);
			return;
		}

		// Only log for skill ID 30 (Bluff) if debug mode is on
		const isBluff = skillId === 30 && isDebugMode;
		const skillLevelKey = getSkillLevelKey(skillId, level);
		
		if (isBluff) {
			console.log(`[${getTimestamp()}] [UI DEBUG] Bluff cell clicked for ${skillLevelKey}`, {
				skillId,
				level,
				hasSkillRank: hasSkillRank(skillId, level),
				isOperationPending: isOperationPendingLocal(skillId, level),
				optimisticRanks: optimisticRanks ? Object.fromEntries(optimisticRanks) : 'null'
			});
		}

		// Check if the operation is already pending
		if (isOperationPendingLocal(skillId, level)) {
			if (isBluff) {
				console.log(`[${getTimestamp()}] [UI DEBUG] Operation already pending for Bluff ${skillLevelKey}, ignoring click`);
			}
			return;
		}

		// Determine whether we're adding or removing a rank
		const isAdding = !hasSkillRank(skillId, level);
		
		if (isBluff) {
			console.log(`[${getTimestamp()}] [UI DEBUG] Operation type for Bluff ${skillLevelKey}:`, { 
				isAdding, 
				currentHasRank: hasSkillRank(skillId, level)
			});
		}

		// If adding a rank, check if the character has enough remaining skill points for this level
		if (isAdding) {
			const remainingPoints = getRemainingPoints(level);
			
			if (isBluff) {
				console.log(`[${getTimestamp()}] [UI DEBUG] Checking remaining points for Bluff at level ${level}:`, { remainingPoints });
			}
			
			if (remainingPoints <= 0) {
				if (isBluff) {
					console.log(`[${getTimestamp()}] [UI DEBUG] Not enough points to add Bluff rank at level ${level}`);
				}
				return;
			}
		}

		// Update the local cache optimistically
		updateSkillInCache(skillId, isAdding);

		// Call the provided onUpdateDB function if available
		if (typeof onUpdateDB === 'function') {
			if (isBluff) {
				console.log(`[${getTimestamp()}] [UI DEBUG] Calling onUpdateDB for Bluff ${skillLevelKey}`, { isAdding });
			}
			
			try {
				// Call parent update function and properly await it
				await onUpdateDB(skillId, level, isAdding);
				
				if (isBluff) {
					console.log(`[${getTimestamp()}] [UI DEBUG] OptimisticRanks after update for Bluff:`, optimisticRanks ? Object.fromEntries(optimisticRanks) : 'null');
				}
			} catch (error) {
				if (isBluff) {
					console.error(`[${getTimestamp()}] [UI DEBUG] Error calling onUpdateDB for Bluff:`, error);
				}
				// Rollback the local cache update on error
				updateSkillInCache(skillId, !isAdding);
			}
		} else if (isBluff) {
			console.log(`[${getTimestamp()}] [UI DEBUG] onUpdateDB function not available for Bluff update`);
		}
	}
	
	// Listen for character changes to refresh the cache
	$effect(() => {
		if (character) {
			// Clear the entire cache when character data changes
			skillCalculationCache = new Map();
		}
	});
	
	// Function to get display total for a skill, using cache
	function getSkillDisplayTotal(skillId: number): number {
		const cached = getSkillData(skillId);
		if (cached) {
			return cached.total;
		}
		return character?.skills?.[skillId]?.total ?? 0;
	}
</script>

<div class="skills-container">
	{#if error}
		<Alert variant="destructive" class="mb-4">
			<AlertDescription>{error}</AlertDescription>
		</Alert>
	{/if}

	<Tabs.Root value={viewMode} onValueChange={(v) => viewMode = v as typeof viewMode} class="w-full">
		<div class="tabs-header">
			<Tabs.List class="grid h-12 w-full grid-cols-[1fr_1fr_2px_auto_auto]">
				<Tabs.Trigger value="ability">By Ability</Tabs.Trigger>
				<Tabs.Trigger value="alphabetical">Alphabetical</Tabs.Trigger>
				<div class="pill-divider"></div>	
				<Button
					variant="secondary"
					size="icon"
					class="h-full"
					onclick={() => {
						if (!showRankAllocation) {
							previousShowUnusableSkills = showUnusableSkills;
							showUnusableSkills = true;
						} else {
							showUnusableSkills = previousShowUnusableSkills;
						}
						showRankAllocation = !showRankAllocation;
					}}
				>
					<Grid size={20} />
				</Button>
				<Button
					variant="secondary"
					size="icon"
					class="toggle-unusable h-full"
					onclick={toggleUnusableSkills}
				>
					{#if showUnusableSkills}
						<Eye size={20} />
					{:else}
						<EyeOff size={20} />
					{/if}
				</Button>
			</Tabs.List>
		</div>

		{#if showRankAllocation}
			<Card.Root class="mb-4">
				<Card.Header>
					<Card.Title>Skill Points Per Level</Card.Title>
					<Card.Description>Remaining skill points and allocated skills at each level</Card.Description>
				</Card.Header>
				<Card.Content class="py-3">
					<div class="skill-points-grid">
						{#each levelNumbers as level}
							{@const totalPoints = character?.skillPoints?.total[level]?.total ?? 0}
							{@const remainingPoints = getRemainingPoints(level)}
							{@const ranksAtLevel = character?.game_character_skill_rank?.filter(
								(rank: GameCharacterSkillRank) => rank.applied_at_level === level
							) ?? []}
							{@const usedPoints = totalPoints - remainingPoints}
							{@const percentUsed = totalPoints > 0 ? (usedPoints / totalPoints) * 100 : 0}
							
							<button 
								class="flex flex-col p-3 rounded-md border border-muted hover:bg-muted/50 transition-colors"
								onclick={() => onSelectValue?.(character?.skillPoints?.total[level])}
								type="button"
							>
								<div class="flex justify-between items-center mb-1">
									<span class="font-medium">Level {level}</span>
									<Badge variant={remainingPoints > 0 ? "outline" : "secondary"}>
										{remainingPoints} point{remainingPoints !== 1 ? 's' : ''} left
									</Badge>
								</div>
								
								<div class="w-full bg-muted/30 rounded-full h-2 mb-1">
									<div 
										class="bg-primary h-2 rounded-full" 
										style="width: {percentUsed}%"
									></div>
								</div>
								
								<div class="flex justify-between text-xs text-muted-foreground">
									<span>{usedPoints}/{totalPoints} used</span>
									<span>{ranksAtLevel.length} skills</span>
								</div>
							</button>
						{/each}
					</div>
				</Card.Content>
			</Card.Root>
		{/if}

		<Tabs.Content value="ability">
			{#if !character}
				<div class="rounded-md border border-muted p-4">
					<p class="text-muted-foreground">Loading skills...</p>
				</div>
			{:else}
				{#await filteredSkillsByAbility}
					<div class="rounded-md border border-muted p-4">
						<p class="text-muted-foreground">Loading skills...</p>
					</div>
				{:then skills}
					<div class="ability-cards">
						{#each Object.entries(skills) as [ability, skillList]}
							{#if skillList.length > 0}
								<Card.Root>
									<Card.Header>
										<Card.Title>{ability.toUpperCase()}</Card.Title>
									</Card.Header>
									<Card.Content>
										<div class="skills-grid">
											{#each skillList as skill}
												<!-- Check visibility within the template -->
												{@const isUnusable = isSkillUnusable(skill)}
												{@const shouldBeVisible = !isUnusable || showUnusableSkills || showRankAllocation}
												{#if shouldBeVisible}
													<button
														class="skill"
														class:is-class-skill={skill.isClassSkill}
														class:unusable={isUnusable}
														onclick={() => onSelectValue?.(character?.skills?.[skill.id])}
														type="button"
													>
														<div class="skill-info">
															<span class="skill-name">{skill.label}</span>
															{#if viewMode === 'alphabetical' || skill.overrides?.ability}
																<Badge variant="secondary" class="ability-badge">
																	{#if skill.overrides?.ability}
																		<span class="text-xs opacity-50">({skill.overrides.ability.source})</span>
																	{/if}
																</Badge>
															{/if}
															<span class="modifier">{formatModifier(getSkillDisplayTotal(skill.id))}</span>
														</div>
														
														{#if showRankAllocation}
															<div class="rank-grid">
																{#each levelNumbers as level}
																	{@const hasRank = hasSkillRank(skill.id, level)}
																	{@const canAdd = !hasRank && getRemainingPoints(level) > 0}
																	{@const isPending = isOperationPendingLocal(skill.id, level)}
																	{@const error = getOperationError(skill.id, level)}
																	
																	<div class="button-container">
																		<Button
																			variant="outline"
																			size="sm"
																			class="h-8 w-8 {isPending ? 'pending' : ''} {error ? 'error' : ''}"
																			title={isPending ? 'Operation in progress...' : error || ''}
																			disabled={isPending}
																			onclick={(e: MouseEvent) => {
																				e.stopPropagation();
																				if (!isPending && (hasRank || canAdd)) {
																					handleCellClick(skill.id, level);
																				}
																			}}
																		>
																			{#if isPending}
																				<div class="loading-spinner"></div>
																			{:else if hasRank}
																				<Circle class="fill-primary stroke-primary" size={16} />
																			{:else}
																				<Circle size={16} />
																			{/if}
																		</Button>
																	</div>
																{/each}
															</div>
														{/if}
													</button>
												{/if}
											{/each}
										</div>
									</Card.Content>
								</Card.Root>
							{/if}
						{/each}
					</div>
				{:catch error}
					<div class="rounded-md border border-destructive p-4">
						<p class="text-destructive">Error loading skills: {error.message}</p>
					</div>
				{/await}
			{/if}
		</Tabs.Content>

		<Tabs.Content value="alphabetical">
			{#if !character}
				<div class="rounded-md border border-muted p-4">
					<p class="text-muted-foreground">Loading skills...</p>
				</div>
			{:else}
				{#await filteredSkillsAlphabetical}
					<div class="rounded-md border border-muted p-4">
						<p class="text-muted-foreground">Loading skills...</p>
					</div>
				{:then skills}
					<Card.Root>
						<Card.Content>
							<div class="skills-grid">
								{#each skills as skill}
									<!-- Check visibility within the template -->
									{@const isUnusable = isSkillUnusable(skill)}
									{@const shouldBeVisible = !isUnusable || showUnusableSkills || showRankAllocation}
									{#if shouldBeVisible}
										<button
											class="skill"
											class:is-class-skill={skill.isClassSkill}
											class:unusable={isUnusable}
											onclick={() => onSelectValue?.(character?.skills?.[skill.id])}
											type="button"
										>
											<div class="skill-info">
												<span class="skill-name">{skill.label}</span>
												{#if viewMode === 'alphabetical' || skill.overrides?.ability}
													<Badge variant="secondary" class="ability-badge">
														{#if skill.overrides?.ability}
															{skill.overrides.ability.override.slice(0, 3).toUpperCase()}
															<span class="text-xs opacity-50">({skill.overrides.ability.source})</span>
														{:else}
															{skill.ability.slice(0, 3).toUpperCase()}
														{/if}
													</Badge>
												{/if}
												<span class="modifier">{formatModifier(getSkillDisplayTotal(skill.id))}</span>
											</div>
											
											{#if showRankAllocation}
												<div class="rank-grid">
													{#each levelNumbers as level}
														{@const hasRank = hasSkillRank(skill.id, level)}
														{@const canAdd = !hasRank && getRemainingPoints(level) > 0}
														{@const isPending = isOperationPendingLocal(skill.id, level)}
														{@const error = getOperationError(skill.id, level)}
														
														<div class="button-container">
															<Button
																variant="outline"
																size="sm"
																class="h-8 w-8 {isPending ? 'pending' : ''} {error ? 'error' : ''}"
																title={isPending ? 'Operation in progress...' : error || ''}
																disabled={isPending}
																onclick={(e: MouseEvent) => {
																	e.stopPropagation();
																	if (!isPending && (hasRank || canAdd)) {
																		handleCellClick(skill.id, level);
																	}
																}}
															>
																{#if isPending}
																	<div class="loading-spinner"></div>
																{:else if hasRank}
																	<Circle class="fill-primary stroke-primary" size={16} />
																{:else}
																	<Circle size={16} />
																{/if}
															</Button>
														</div>
													{/each}
												</div>
											{/if}
										</button>
									{/if}
								{/each}
							</div>
						</Card.Content>
					</Card.Root>
				{:catch error}
					<div class="rounded-md border border-destructive p-4">
						<p class="text-destructive">Error loading skills: {error.message}</p>
					</div>
				{/await}
			{/if}
		</Tabs.Content>
	</Tabs.Root>
</div>

<style lang="postcss">
	.skills-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.ability-cards {
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		max-width: 1200px;
		margin: 0 auto;
		width: 100%;
	}

	.skills-grid {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.skill {
		@apply w-full cursor-pointer rounded border border-transparent transition-all;
		background-color: hsl(var(--background));
		border-color: hsl(var(--border) / 0.2);

		&:hover {
			background-color: hsl(var(--accent));
			border-color: hsl(var(--border));
			transform: translateX(2px);
		}

		&.is-class-skill {
			background-color: hsl(var(--primary) / 0.1);
			border-color: hsl(var(--primary) / 0.2);

			&.unusable {
				background-color: hsl(var(--muted) / 0.7);
				border-color: hsl(var(--muted-foreground) / 0.2);
			}
		}

		&.unusable {
			opacity: 0.8;
			cursor: not-allowed;
			background-color: hsl(var(--muted) / 0.5);
			border-color: hsl(var(--border) / 0.1);
			transform: none;
			/* Don't hide by default - let shouldShowSkill control this */
			/* display: none; */

			&:hover {
				background-color: hsl(var(--muted) / 0.5);
				transform: none;
			}
		}
	}

	.skill-info {
		@apply flex items-center justify-between w-full p-4;
	}

	.skill-name {
		margin-right: 0.5rem;
		flex: 1;
		text-align: left;
	}

	.modifier {
		font-size: 1.25rem;
		font-weight: 600;
		color: hsl(var(--primary));
		min-width: 3rem;
		text-align: right;
	}

	.tabs-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0 0.5rem;
	}

	.pill-divider {
		width: 2px;
		height: 24px;
		background-color: hsl(var(--muted-foreground) / 0.2);
		border-radius: 9999px;
		margin: auto 0;
	}

	.rank-grid {
		@apply grid gap-1 px-4 pb-4;
		grid-template-columns: repeat(auto-fit, minmax(2rem, 1fr));
	}

	.skill-points-grid {
		display: grid;
		gap: 0.75rem;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
	}

	.button-container {
		position: relative;
	}

	.pending {
		opacity: 0.7;
		pointer-events: none;
		animation: pulse 1.5s infinite ease-in-out;
	}

	.error {
		border-color: hsl(var(--destructive));
		animation: shake 0.5s;
	}

	.loading-spinner {
		width: 12px;
		height: 12px;
		border: 2px solid hsl(var(--primary) / 0.3);
		border-top: 2px solid hsl(var(--primary));
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	@keyframes pulse {
		0%, 100% { opacity: 0.7; }
		50% { opacity: 0.4; }
	}

	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		20%, 60% { transform: translateX(-2px); }
		40%, 80% { transform: translateX(2px); }
	}
</style>