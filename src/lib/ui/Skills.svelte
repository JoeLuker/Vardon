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

	interface UpdateOperation {
		skillId: number;
		level: number;
		type: 'add' | 'remove';
		previousState?: Array<number>;
	}


	let { 
		character, 
		rules, 
		onSelectValue = () => {},
		onUpdateDB = async (_changes: any) => {},
	} = $props<{
		character?: EnrichedCharacter | null;
		rules?: GameRulesAPI | null;
		onSelectValue?: (val: ValueWithBreakdown) => void;
		onUpdateDB?: (changes: any) => Promise<void>;
	}>();

	let showUnusableSkills = $state(false);
	let showRankAllocation = $state(false);
	let previousShowUnusableSkills = $state(false);
	let viewMode = $state<'ability' | 'alphabetical'>('ability');
	let error = $state<string | null>(null);
	let operationInProgress = $state<UpdateOperation | null>(null);

	let levelNumbers = $derived(
		Array.from({ length: character?.totalLevel ?? 0 }, (_, i) => i + 1)
	);

	let optimisticSkillRanks = $state<GameCharacterSkillRank[]>([]);
	let optimisticRemainingPoints = $state<Record<number, number>>({});

	let currentSkillRanks = $derived(
		optimisticSkillRanks.length > 0 
			? optimisticSkillRanks 
			: character?.game_character_skill_rank ?? []
	);

	let skillsByAbilityPromise = $derived.by(async () => {
		if (!rules || !character) return {};

		try {
			const allSkills = await rules.getAllSkill();
			const result: Record<string, ProcessedSkill[]> = {};

	

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
					ranks: currentSkillRanks.filter(
						(sr: GameCharacterSkillRank) => sr.skill_id === baseSkill.id
					).length ?? 0,
					trainedOnly: skillData.overrides?.trained_only ?? baseSkill.trained_only,
					isClassSkill: skillWithRanks?.isClassSkill ?? false,
					ranksByLevel: skillWithRanks?.skillRanks?.map(
						(sr: { rank: number }) => sr.rank
					) ?? [],
					overrides: skillData.overrides
				};

				if (!result[abilityName]) result[abilityName] = [];
				result[abilityName].push(processed);
			}

			return result;
		} catch (error) {
			console.error('Failed to load skills:', error);
			throw new Error('Failed to load skills. Please try again.');
		}
	});


	function isSkillUnusable(skill: ProcessedSkill): boolean {
		const effectiveTrainedOnly = skill.overrides?.trained_only ?? skill.trainedOnly;
		return effectiveTrainedOnly && skill.ranks === 0;
	}

	function shouldShowSkill(skill: ProcessedSkill): boolean {
		if (showRankAllocation) return true;
		return !isSkillUnusable(skill) || showUnusableSkills;
	}

	function formatModifier(mod: number): string {
		return mod >= 0 ? `+${mod}` : `${mod}`;
	}

	// Add state to track operations in progress
	let operationsInProgress = $state(new Set<string>());

	async function handleCellClick(skillId: number, level: number) {
		const operationKey = `${skillId}-${level}`;
		
		if (operationsInProgress.has(operationKey)) return;
		if (!character) return;
		
		const hasRank = currentSkillRanks.some(
			(rank: GameCharacterSkillRank) => rank.skill_id === skillId && rank.applied_at_level === level
		);
		
		// Validate the operation
		if (!hasRank) {
			const remaining = optimisticRemainingPoints[level] ?? character.skillPoints?.remaining[level] ?? 0;
			if (remaining <= 0) {
				error = "No skill points remaining for this level";
				setTimeout(() => error = null, 3000);
				return;
			}
		}

		try {
			operationsInProgress.add(operationKey);

			// Apply optimistic update
			const newOptimisticRanks = hasRank 
				? currentSkillRanks.filter((rank: { skill_id: number; applied_at_level: number; }) => 
					!(rank.skill_id === skillId && rank.applied_at_level === level))
				: [...currentSkillRanks, { 
					skill_id: skillId, 
					applied_at_level: level,
				}];

			const newRemainingPoints = { ...optimisticRemainingPoints };
			newRemainingPoints[level] = (newRemainingPoints[level] ?? character.skillPoints?.remaining[level] ?? 0) + 
				(hasRank ? 1 : -1);

			optimisticSkillRanks = newOptimisticRanks;
			optimisticRemainingPoints = newRemainingPoints;

			// Let parent handle the DB update
			await onUpdateDB({
				skillId,
				level,
				type: hasRank ? 'remove' : 'add'
			});
			
			error = null;
		} catch (err) {
			console.error('Failed skill update:', err);
			optimisticSkillRanks = [];
			optimisticRemainingPoints = {};
			error = 'Failed to update skill rank. Please try again.';
			setTimeout(() => error = null, 3000);
		} finally {
			operationsInProgress.delete(operationKey);
		}
	}

	let getRemainingPoints = $derived((level: number) => 
		optimisticRemainingPoints[level] ?? character?.skillPoints?.remaining[level] ?? 0
	);

	let hasSkillRank = $derived((skillId: number, level: number) => 
		currentSkillRanks.some((rank: GameCharacterSkillRank) => 
			rank.skill_id === skillId && 
			rank.applied_at_level === level
		)
	);
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
				{#await skillsByAbilityPromise}
					<div class="rounded-md border border-muted p-4">
						<p class="text-muted-foreground">Loading skills...</p>
					</div>
				{:then skills}
					<div class="ability-cards">
						{#each Object.entries(skills) as [ability, skillList]}
							<Card.Root>
								<Card.Header>
									<Card.Title>{ability.toUpperCase()}</Card.Title>
								</Card.Header>
								<Card.Content>
									<div class="skills-grid">
										{#each skillList.filter(shouldShowSkill) as skill}
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
															<Button
																variant="outline"
																size="sm"
																class="h-8 w-8"
																disabled={!!operationInProgress || (!hasRank && !canAdd)}
																onclick={(e: MouseEvent) => {
																	e.stopPropagation();
																	handleCellClick(skill.id, level);
																}}
															>
																{#if hasRank}
																	<Circle class="fill-primary stroke-primary" size={16} />
																{:else}
																	<Circle size={16} />
																{/if}
															</Button>
														{/each}
													</div>
												{/if}
											</button>
										{/each}
									</div>
								</Card.Content>
							</Card.Root>
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
				{#await skillsByAbilityPromise}
					<div class="rounded-md border border-muted p-4">
						<p class="text-muted-foreground">Loading skills...</p>
					</div>
				{:then skills}
					<Card.Root>
						<Card.Content>
							<div class="skills-grid">
								{#each Object.values(skills).flat().sort((a, b) => a.name.localeCompare(b.name)).filter(shouldShowSkill) as skill}
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
													<Button
														variant="outline"
														size="sm"
														class="h-8 w-8"
														disabled={!!operationInProgress || (!hasRank && !canAdd)}
														onclick={(e: MouseEvent) => {
															e.stopPropagation();
															handleCellClick(skill.id, level);
														}}
													>
														{#if hasRank}
															<Circle class="fill-primary stroke-primary" size={16} />
														{:else}
															<Circle size={16} />
														{/if}
													</Button>
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

</style>