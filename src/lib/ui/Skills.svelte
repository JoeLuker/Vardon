<script lang="ts">
	import { Eye, EyeOff, Grid, Circle } from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import type { EnrichedCharacter, ValueWithBreakdown } from '$lib/domain/characterCalculations';
	import type { GameRulesAPI } from '$lib/db/gameRules.api';
	import type { GameCharacterSkillRank } from '$lib/db/gameRules.types';
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
		character?: EnrichedCharacter | null;
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
					(s: { skillId: number }) => s.skillId === baseSkill.id
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
						(sr: { rank: number }) => sr.rank
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

	// Function to get actual skill ranks count considering optimistic state
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
				const serverHasRank = character.game_character_skill_rank?.some(
					(rank: GameCharacterSkillRank) => rank.skill_id === skillId && rank.applied_at_level === level
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
		
		for (const [ability, skills] of Object.entries(baseData.byAbility)) {
			result[ability] = skills.filter(shouldShowSkill);
		}
		
		return result;
	});

	// Filtered and sorted skills for alphabetical view
	let filteredSkillsAlphabetical = $derived.by(async () => {
		const baseData = await baseSkillsData;
		return baseData.allSkills
			.filter(shouldShowSkill)
			.sort((a, b) => a.name.localeCompare(b.name));
	});

	function isSkillUnusable(skill: ProcessedSkill): boolean {
		const effectiveTrainedOnly = skill.overrides?.trained_only ?? skill.trainedOnly;
		return effectiveTrainedOnly && getSkillRanksCount(skill.id) === 0;
	}

	function shouldShowSkill(skill: ProcessedSkill): boolean {
		if (showRankAllocation) return true;
		return !isSkillUnusable(skill) || showUnusableSkills;
	}

	function formatModifier(mod: number): string {
		return mod >= 0 ? `+${mod}` : `${mod}`;
	}

	// Check if a skill has a rank at a specific level, considering optimistic state
	function hasSkillRank(skillId: number, level: number): boolean {
		// Check the optimistic value first
		const skillLevelKey = getSkillLevelKey(skillId, level);
		const optimisticExists = optimisticRanks?.has(skillLevelKey) ?? false;
		const optimisticValue = optimisticExists ? optimisticRanks.get(skillLevelKey) : null;
		
		// Only log for skill ID 30 (Bluff)
		if (skillId === 30) {
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

	/**
	 * Check if an operation is pending for this skill level
	 */
	function isOperationPendingLocal(skillId: number, level: number): boolean {
		const skillLevelKey = getSkillLevelKey(skillId, level);
		
		// Use parent function if available
		if (typeof isOperationPending === 'function') {
			const isPending = isOperationPending(skillId, level);
			if (skillId === 30) {
				console.log(`[${getTimestamp()}] [UI DEBUG] Checking pending operation from parent for Bluff ${skillLevelKey}:`, { isPending });
			}
			return isPending;
		}
		
		// Fall back to local check
		const isPending = pendingOperations?.has(skillLevelKey) ?? false;
		if (skillId === 30) {
			console.log(`[${getTimestamp()}] [UI DEBUG] Checking pending operation locally for Bluff ${skillLevelKey}:`, { isPending });
		}
		return isPending;
	}

	// Get error for operation if any
	function getOperationError(skillId: number, level: number): string | null {
		if (!operationErrors) return null;
		
		const key = getSkillLevelKey(skillId, level);
		const errorInfo = operationErrors.get(key);
		return errorInfo?.message ?? null;
	}

	// Get remaining points for a level, considering optimistic state
	function getRemainingPoints(level: number): number {
		if (!character?.skillPoints?.remaining) return 0;
		
		// If we have an optimistic value for this level, use it
		if (optimisticPoints?.has(level)) {
			return optimisticPoints.get(level) as number;
		}
		
		// Otherwise use actual data
		return character.skillPoints.remaining[level] ?? 0;
	}

	// Handle click on a skill rank cell
	async function handleCellClick(skillId: number, level: number) {
		if (!character) {
			return;
		}

		// Only log for skill ID 30 (Bluff)
		if (skillId === 30) {
			console.log(`[${getTimestamp()}] [UI DEBUG] Bluff cell clicked for ${getSkillLevelKey(skillId, level)}`, {
				skillId,
				level,
				hasSkillRank: hasSkillRank(skillId, level),
				isOperationPending: isOperationPendingLocal(skillId, level),
				optimisticRanks: optimisticRanks ? Object.fromEntries(optimisticRanks) : 'null'
			});

			// Check if the operation is already pending
			if (isOperationPendingLocal(skillId, level)) {
				console.log(`[${getTimestamp()}] [UI DEBUG] Operation already pending for Bluff ${getSkillLevelKey(skillId, level)}, ignoring click`);
				return;
			}

			// Determine whether we're adding or removing a rank
			const isAdding = !hasSkillRank(skillId, level);
			console.log(`[${getTimestamp()}] [UI DEBUG] Operation type for Bluff ${getSkillLevelKey(skillId, level)}:`, { 
				isAdding, 
				currentHasRank: hasSkillRank(skillId, level)
			});

			// If adding a rank, check if the character has enough remaining skill points for this level
			if (isAdding) {
				const remainingPoints = getRemainingPoints(level);
				console.log(`[${getTimestamp()}] [UI DEBUG] Checking remaining points for Bluff at level ${level}:`, { remainingPoints });
				
				if (remainingPoints <= 0) {
					console.log(`[${getTimestamp()}] [UI DEBUG] Not enough points to add Bluff rank at level ${level}`);
					return;
				}
			}

			// Call the provided onUpdateDB function if available
			if (typeof onUpdateDB === 'function') {
				console.log(`[${getTimestamp()}] [UI DEBUG] Calling onUpdateDB for Bluff ${getSkillLevelKey(skillId, level)}`, { isAdding });
				
				// Log optimistic ranks before update
				console.log(`[${getTimestamp()}] [UI DEBUG] OptimisticRanks before update for Bluff:`, optimisticRanks ? Object.fromEntries(optimisticRanks) : 'null');
				
				try {
					// Call parent update function 
					onUpdateDB(skillId, level, isAdding);
					
					// Log optimistic ranks after update
					console.log(`[${getTimestamp()}] [UI DEBUG] OptimisticRanks after update for Bluff:`, optimisticRanks ? Object.fromEntries(optimisticRanks) : 'null');
				} catch (error) {
					console.error(`[${getTimestamp()}] [UI DEBUG] Error calling onUpdateDB for Bluff:`, error);
				}
			} else {
				console.log(`[${getTimestamp()}] [UI DEBUG] onUpdateDB function not available for Bluff update`);
			}
		} else {
			// For non-Bluff skills, just call handleCellClick without logging
			if (isOperationPendingLocal(skillId, level)) {
				return;
			}

			const isAdding = !hasSkillRank(skillId, level);
			if (isAdding && getRemainingPoints(level) <= 0) {
				return;
			}

			if (typeof onUpdateDB === 'function') {
				try {
					onUpdateDB(skillId, level, isAdding);
				} catch (error) {
					// Silent error for non-Bluff skills
				}
			}
		}
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
					onclick={() => showUnusableSkills = !showUnusableSkills}
				>
					{#if showUnusableSkills}
						<Eye size={20} />
					{:else}
						<EyeOff size={20} />
					{/if}
				</Button>
			</Tabs.List>
		</div>

		{#if showRankAllocation && character?.skillPoints}
			<Card.Root class="mb-4">
				<Card.Content class="py-3">
					<div class="skill-points-grid">
						{#each levelNumbers as level}
							{@const totalPoints = character?.skillPoints?.total[level]?.total ?? 0}
							{@const remainingPoints = getRemainingPoints(level)}
							{@const ranksAtLevel = character?.game_character_skill_rank?.filter(
								(rank: GameCharacterSkillRank) => rank.applied_at_level === level
							) ?? []}
							
							<button 
								class="flex flex-col items-center px-2 py-1 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
								onclick={() => onSelectValue?.(character?.skillPoints?.total[level])}
								type="button"
							>
								<span class="text-xs text-muted-foreground">Level {level}</span>
								<span class="font-medium text-primary">
									{remainingPoints}/{totalPoints}
								</span>
								<span class="text-xs text-muted-foreground">
									{ranksAtLevel.length} skills
								</span>
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
												<button
													class="skill"
													class:is-class-skill={skill.isClassSkill}
													class:unusable={isSkillUnusable(skill)}
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
														<span class="modifier">{formatModifier(skill.total)}</span>
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
									<button
										class="skill"
										class:is-class-skill={skill.isClassSkill}
										class:unusable={isSkillUnusable(skill)}
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
											<span class="modifier">{formatModifier(skill.total)}</span>
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
		gap: 0.5rem;
		grid-template-columns: repeat(auto-fit, minmax(5rem, 1fr));
		grid-auto-flow: dense;
		grid-auto-columns: 1fr;
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