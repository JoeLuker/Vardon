<script lang="ts">
	import { Eye, EyeOff, Grid, Circle } from 'lucide-svelte';
	import { untrack } from 'svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import type { ValueWithBreakdown } from '$lib/ui/types/CharacterTypes';
	import type { GameKernel } from '$lib/domain/kernel/GameKernel';
	import { ErrorCode } from '$lib/domain/kernel/ErrorHandler';
	import { OpenMode } from '$lib/domain/kernel/types';

	// File paths and device constants
	const PATHS = {
		DEV_SKILL: '/v_dev/skill',
		PROC_CHARACTER: '/v_proc/character'
	};

	// Skill device IOCTL request codes
	const SKILL_REQUEST = {
		GET_SKILLS: 1001,
		GET_SKILL_RANKS: 1002,
		ADD_SKILL_RANK: 1003,
		REMOVE_SKILL_RANK: 1004
	};

	// Use the type from the GameRules namespace
	type GameCharacterSkillRank = {
		id: number;
		game_character_id: number;
		skill_id: number;
		applied_at_level: number;
	};

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

	// Accept parent-managed components
	let {
		character,
		kernel,
		onSelectValue = () => {},
		pendingOperations = null,
		operationErrors = null,
		optimisticRanks = null,
		optimisticPoints = null,
		isOperationPending = null
	} = $props<{
		character?: any | null;
		kernel?: GameKernel | null;
		onSelectValue?: (val: ValueWithBreakdown) => void;
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
	let isLoading = $state(false);

	// Track open file descriptors for cleanup
	let openFileDescriptors = $state<number[]>([]);

	// Function to toggle visibility with a forced refresh
	function toggleUnusableSkills() {
		showUnusableSkills = !showUnusableSkills;

		// Force reactivity by updating timestamp and clearing cache
		filterTimestamp = Date.now();
		skillCalculationCache = new Map();

		// Force recalculation of the filtered skills
		// Use updateSkillsData to avoid state_unsafe_mutation
		if (baseSkillsDataResolved) {
			// Create a new object reference to trigger reactivity
			const updatedData = { ...baseSkillsDataResolved };
			updateSkillsData(updatedData);
		}
	}

	// Helper function to get key for skill-level pair
	function getSkillLevelKey(skillId: number, level: number): string {
		return `${skillId}-${level}`;
	}

	let levelNumbers = $derived(Array.from({ length: character?.totalLevel ?? 0 }, (_, i) => i + 1));

	// Helper function to manage file descriptors
	function registerFd(fd: number) {
		if (fd > 0) {
			openFileDescriptors = [...openFileDescriptors, fd];
		}
		return fd;
	}

	// Helper to close a file descriptor and remove from tracking
	function closeFd(fd: number) {
		if (fd > 0 && kernel) {
			try {
				kernel.close(fd);
			} catch (e) {
				console.error(`Error closing fd ${fd}:`, e);
			}
			openFileDescriptors = openFileDescriptors.filter((openFd) => openFd !== fd);
		}
	}

	// Always close file descriptors when component is destroyed
	$effect(() => {
		// Return a cleanup function that will be called when the effect is destroyed
		return () => {
			openFileDescriptors.forEach((fd) => {
				if (kernel) {
					try {
						kernel.close(fd);
					} catch (e) {
						// Ignore errors during cleanup
					}
				}
			});
			openFileDescriptors = [];
		};
	});

	// Add a cache for skill calculations to prevent recalculating on every state change
	let skillCalculationCache = $state<Map<number, { total: number; ranks: number }>>(new Map());

	// Function to get skill data with caching
	function getSkillData(skillId: number): { total: number; ranks: number } | undefined {
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

	// Base skill data state
	let baseSkillsData = $state<{
		byAbility: Record<string, ProcessedSkill[]>;
		allSkills: ProcessedSkill[];
	} | null>(null);

	// Function to load skill data
	async function loadSkillsData() {
		if (!kernel || !character)
			return {
				byAbility: {},
				allSkills: []
			};

		isLoading = true;
		error = null;

		try {
			// Open the skill device
			const skillFd = registerFd(kernel.open(PATHS.DEV_SKILL, OpenMode.READ_WRITE));
			if (skillFd < 0) {
				throw new Error(`Failed to open skill device: ${ErrorCode[-skillFd]}`);
			}

			// Directory creation is now handled by the GameKernel

			const entityPath = `${PATHS.PROC_CHARACTER}/${character.id}`;

			try {
				// Get skills using ioctl
				const buffer: any = { entityPath };
				const result = kernel.ioctl(skillFd, SKILL_REQUEST.GET_SKILLS, buffer);

				if (result !== ErrorCode.SUCCESS) {
					throw new Error(`Failed to get skills: ${ErrorCode[result]}`);
				}

				const allSkills = buffer.skills || [];
				const skillsWithRanks = buffer.skillsWithRanks || [];

				// Process skills by ability
				const byAbility: Record<string, ProcessedSkill[]> = {};
				const processedSkills: ProcessedSkill[] = [];

				for (const baseSkill of allSkills) {
					const skillId = baseSkill.id;
					const skillData = character.skills[skillId];

					if (!skillData) continue;

					const baseAbility = baseSkill.ability;
					// Use override if it exists, otherwise use the base ability
					const abilityName = (
						skillData.overrides?.ability?.override ??
						baseAbility?.label ??
						'MISC'
					).toUpperCase();

					const skillWithRanks = skillsWithRanks.find((s: any) => s.skillId === baseSkill.id);

					const processed: ProcessedSkill = {
						id: baseSkill.id,
						name: baseSkill.name,
						label: baseSkill.label,
						ability: abilityName,
						total: skillData.total,
						ranks: getSkillRanksCount(baseSkill.id),
						trainedOnly: skillData.overrides?.trained_only ?? baseSkill.trained_only,
						isClassSkill: skillWithRanks?.isClassSkill ?? false,
						ranksByLevel:
							skillWithRanks?.skillRanks?.map((sr: { level: number; rank: number }) => sr.rank) ??
							[],
						overrides: skillData.overrides
					};

					if (!byAbility[abilityName]) byAbility[abilityName] = [];
					byAbility[abilityName].push(processed);
					processedSkills.push(processed);
				}

				isLoading = false;
				return {
					byAbility,
					allSkills: processedSkills
				};
			} finally {
				// Always close the file descriptor
				closeFd(skillFd);
			}
		} catch (err: any) {
			error = `Failed to load skills: ${err.message}`;
			isLoading = false;
			return {
				byAbility: {},
				allSkills: []
			};
		}
	}

	// Improved function to get skill ranks count considering optimistic state
	function getSkillRanksCount(skillId: number): number {
		if (!character) return 0;

		// Count from actual character data
		const baseCount =
			character.game_character_skill_rank?.filter(
				(rank: GameCharacterSkillRank) => rank.skill_id === skillId
			).length ?? 0;

		// Adjust for optimistic changes
		let delta = 0;
		if (optimisticRanks) {
			for (let level = 1; level <= (character.totalLevel ?? 0); level++) {
				const key = getSkillLevelKey(skillId, level);
				// Check if we have this rank in server data
				const serverHasRank =
					character.game_character_skill_rank?.some(
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
	let filteredSkillsByAbility = $derived(() => {
		if (!baseSkillsData) return {};
		
		const result: Record<string, ProcessedSkill[]> = {};

		// Include timestamp to force reactivity
		const timestamp = filterTimestamp;

		// Don't filter based on visibility - let the template handle that
		for (const [ability, skills] of Object.entries(baseSkillsData.byAbility)) {
			result[ability] = skills;
		}

		return result;
	});

	// Filtered and sorted skills for alphabetical view
	let filteredSkillsAlphabetical = $derived(() => {
		if (!baseSkillsData) return [];

		// Include timestamp to force reactivity
		const timestamp = filterTimestamp;

		// Don't filter based on visibility - let the template handle that
		return baseSkillsData.allSkills.sort((a, b) => a.name.localeCompare(b.name));
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

		// Use the optimistic value if it exists, otherwise fall back to the server value
		if (optimisticExists) {
			return optimisticValue!;
		}

		// Otherwise check if the rank exists in the character data
		return !!character?.game_character_skill_rank?.some(
			(rank: GameCharacterSkillRank) => rank.skill_id === skillId && rank.applied_at_level === level
		);
	}

	// Improved function to check if an operation is pending
	function isOperationPendingLocal(skillId: number, level: number): boolean {
		// Use parent function if available
		if (typeof isOperationPending === 'function') {
			return isOperationPending(skillId, level);
		}

		// Fall back to local check
		const skillLevelKey = getSkillLevelKey(skillId, level);
		return pendingOperations?.has(skillLevelKey) ?? false;
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
	let baseSkillsDataResolved = $state<{
		byAbility: Record<string, ProcessedSkill[]>;
		allSkills: ProcessedSkill[];
	} | null>(null);

	// Helper function to update state outside of derived contexts
	function updateSkillsData(data: {
		byAbility: Record<string, ProcessedSkill[]>;
		allSkills: ProcessedSkill[];
	}) {
		baseSkillsDataResolved = data;
	}

	// Use effect to load skills data
	$effect(() => {
		if (!kernel || !character) {
			baseSkillsData = null;
			return;
		}

		// Load skills data and update state
		loadSkillsData().then(resolved => {
			untrack(() => {
				baseSkillsData = resolved;
				baseSkillsDataResolved = resolved;
			});
		}).catch(error => {
			console.error('Error loading skills data:', error);
			untrack(() => {
				error = `Failed to load skills: ${error.message}`;
			});
		});
	});

	// Add or remove a skill rank using file-based operations
	async function updateSkillRank(
		characterId: number,
		skillId: number,
		level: number,
		isAdding: boolean
	): Promise<boolean> {
		if (!kernel) {
			error = 'Kernel not available';
			return false;
		}

		// Open the skill device
		const skillFd = registerFd(kernel.open(PATHS.DEV_SKILL, OpenMode.READ_WRITE));
		if (skillFd < 0) {
			error = `Failed to open skill device: ${ErrorCode[-skillFd]}`;
			return false;
		}

		try {
			// Directory creation is now handled by the GameKernel

			const entityPath = `${PATHS.PROC_CHARACTER}/${characterId}`;

			// Use ioctl to update skill rank
			const requestCode = isAdding ? SKILL_REQUEST.ADD_SKILL_RANK : SKILL_REQUEST.REMOVE_SKILL_RANK;
			const result = kernel.ioctl(skillFd, requestCode, {
				entityPath,
				skillId,
				level
			});

			if (result !== ErrorCode.SUCCESS) {
				error = `Failed to ${isAdding ? 'add' : 'remove'} skill rank: ${ErrorCode[result]}`;
				return false;
			}

			return true;
		} finally {
			// Always close the file descriptor
			closeFd(skillFd);
		}
	}

	// Improved function to handle skill rank cell clicks
	async function handleCellClick(skillId: number, level: number) {
		if (!character || !kernel) {
			error = 'Cannot update skill - character or kernel is missing';
			return;
		}

		// Check if the operation is already pending
		if (isOperationPendingLocal(skillId, level)) {
			return;
		}

		// Determine whether we're adding or removing a rank
		const isAdding = !hasSkillRank(skillId, level);

		// If adding a rank, check if the character has enough remaining skill points for this level
		if (isAdding) {
			const remainingPoints = getRemainingPoints(level);
			if (remainingPoints <= 0) {
				error = 'Not enough skill points remaining';
				return;
			}
		}

		// Update the local cache optimistically
		updateSkillInCache(skillId, isAdding);

		// Update using file-based operations
		try {
			const success = await updateSkillRank(character.id, skillId, level, isAdding);

			if (!success) {
				// Rollback the local cache update on error
				updateSkillInCache(skillId, !isAdding);
			} else {
				// Clear error on success
				error = null;

				// Clear cache to force recalculation
				skillCalculationCache = new Map();
			}
		} catch (err: any) {
			// Rollback the local cache update on error
			updateSkillInCache(skillId, !isAdding);
			error = `Error updating skill rank: ${err.message}`;
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

	<Tabs.Root
		value={viewMode}
		onValueChange={(v) => (viewMode = v as typeof viewMode)}
		class="w-full"
	>
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
					<Card.Description
						>Remaining skill points and allocated skills at each level</Card.Description
					>
				</Card.Header>
				<Card.Content class="py-3">
					<div class="skill-points-grid">
						{#each levelNumbers as level}
							{@const totalPoints = character?.skillPoints?.total[level]?.total ?? 0}
							{@const remainingPoints = getRemainingPoints(level)}
							{@const ranksAtLevel =
								character?.game_character_skill_rank?.filter(
									(rank: GameCharacterSkillRank) => rank.applied_at_level === level
								) ?? []}
							{@const usedPoints = totalPoints - remainingPoints}
							{@const percentUsed = totalPoints > 0 ? (usedPoints / totalPoints) * 100 : 0}

							<button
								class="flex flex-col rounded-md border border-muted p-3 transition-colors hover:bg-muted/50"
								onclick={() => onSelectValue?.(character?.skillPoints?.total[level])}
								type="button"
							>
								<div class="mb-1 flex items-center justify-between">
									<span class="font-medium">Level {level}</span>
									<Badge variant={remainingPoints > 0 ? 'outline' : 'secondary'}>
										{remainingPoints} point{remainingPoints !== 1 ? 's' : ''} left
									</Badge>
								</div>

								<div class="mb-1 h-2 w-full rounded-full bg-muted/30">
									<div class="h-2 rounded-full bg-primary" style="width: {percentUsed}%"></div>
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
			{#if isLoading}
				<div class="rounded-md border border-muted p-4">
					<p class="text-muted-foreground">Loading skills...</p>
				</div>
			{:else if !character || !kernel}
				<div class="rounded-md border border-muted p-4">
					<p class="text-muted-foreground">Character or kernel not available</p>
				</div>
			{:else}
				{#if Object.keys(filteredSkillsByAbility).length === 0}
					<div class="rounded-md border border-muted p-4">
						<p class="text-muted-foreground">Loading skills...</p>
					</div>
				{:else}
					{@const skills = filteredSkillsByAbility}
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
												{@const shouldBeVisible =
													!isUnusable || showUnusableSkills || showRankAllocation}
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
																		<span class="text-xs opacity-50"
																			>({skill.overrides.ability.source})</span
																		>
																	{/if}
																</Badge>
															{/if}
															<span class="modifier"
																>{formatModifier(getSkillDisplayTotal(skill.id))}</span
															>
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
																			class="h-8 w-8 {isPending ? 'pending' : ''} {error
																				? 'error'
																				: ''}"
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
				{:catch err}
					<div class="rounded-md border border-destructive p-4">
						<p class="text-destructive">Error loading skills: {err.message}</p>
					</div>
				{/await}
			{/if}
		</Tabs.Content>

		<Tabs.Content value="alphabetical">
			{#if isLoading}
				<div class="rounded-md border border-muted p-4">
					<p class="text-muted-foreground">Loading skills...</p>
				</div>
			{:else if !character || !kernel}
				<div class="rounded-md border border-muted p-4">
					<p class="text-muted-foreground">Character or kernel not available</p>
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
															<span class="text-xs opacity-50"
																>({skill.overrides.ability.source})</span
															>
														{:else}
															{skill.ability.slice(0, 3).toUpperCase()}
														{/if}
													</Badge>
												{/if}
												<span class="modifier"
													>{formatModifier(getSkillDisplayTotal(skill.id))}</span
												>
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
				{:catch err}
					<div class="rounded-md border border-destructive p-4">
						<p class="text-destructive">Error loading skills: {err.message}</p>
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

			&:hover {
				background-color: hsl(var(--muted) / 0.5);
				transform: none;
			}
		}
	}

	.skill-info {
		@apply flex w-full items-center justify-between p-4;
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
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 0.7;
		}
		50% {
			opacity: 0.4;
		}
	}

	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		20%,
		60% {
			transform: translateX(-2px);
		}
		40%,
		80% {
			transform: translateX(2px);
		}
	}
</style>
