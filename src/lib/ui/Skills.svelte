<script lang="ts">
	import { Eye, EyeOff, Grid, Circle } from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import type { EnrichedCharacter, ValueWithBreakdown } from '$lib/domain/characterCalculations';
	import type { GameRulesAPI } from '$lib/db/gameRules.api';
	import type { GameCharacterSkillRank } from '$lib/db/gameRules.api';
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
		onUpdateDB = async (_changes: any) => {} 
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


	let skillsByAbilityPromise = $derived.by(async () => {
		if (!rules || !character) return {};

		const result: Record<string, ProcessedSkill[]> = {};
		const allSkills = await rules.getAllSkill();
		
		for (const baseSkill of allSkills) {
			try {
				const skillId = baseSkill.id;
				const skillData = character.skills[skillId];  // Use the pre-calculated skill data
				
				if (!skillData) continue;  // Skip if no skill data exists

				const ability = await rules.getAbilityById(baseSkill.ability_id);
				const abilityName = skillData.overrides?.ability?.override ?? 
					ability?.label ?? 'Unknown';

				const skillWithRanks = character.skillsWithRanks?.find(
					(s: { skillId: number; }) => s.skillId === baseSkill.id
				);

				const processed: ProcessedSkill = {
					id: baseSkill.id,
					name: baseSkill.name,
					label: baseSkill.label,
					ability: abilityName,
					total: skillData.total,
					ranks: character.game_character_skill_rank?.filter(
						(sr: GameCharacterSkillRank) => sr.skill_id === baseSkill.id
					).length ?? 0,
					trainedOnly: skillData.overrides?.trained_only ?? baseSkill.trained_only,
					isClassSkill: skillWithRanks?.isClassSkill ?? false,
					ranksByLevel: skillWithRanks?.skillRanks?.map((sr: { rank: any; }) => sr.rank) ?? [],
					overrides: skillData.overrides
				};

				if (!result[abilityName]) result[abilityName] = [];
				result[abilityName].push(processed);
			} catch (error) {
				console.error(`Error processing skill ${baseSkill.id}:`, error);
				continue;
			}
		}

		// Sort skills within each ability
		for (const skills of Object.values(result)) {
			skills.sort((a, b) => a.name.localeCompare(b.name));
		}

		return result;
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

	async function handleCellClick(skillId: number, level: number) {
		if (operationInProgress) return;
		if (!character) return;
		
		const hasRank = character.game_character_skill_rank?.some(
			(rank: GameCharacterSkillRank) => rank.skill_id === skillId && rank.applied_at_level === level
		) ?? false;
		
		// Validate the operation
		if (!hasRank) {
			const remaining = character.skillPoints?.remaining[level] ?? 0;
			if (remaining <= 0) {
				error = "No skill points remaining for this level";
				setTimeout(() => error = null, 3000);
				return;
			}
		}

		// Create operation
		const operation: UpdateOperation = {
			skillId,
			level,
			type: hasRank ? 'remove' : 'add',
			previousState: character.game_character_skill_rank
				?.filter((rank: GameCharacterSkillRank) => rank.skill_id === skillId)
				?.map((rank: GameCharacterSkillRank) => rank.applied_at_level) ?? []
		};

		try {
			operationInProgress = operation;
			await onUpdateDB(operation);
			operationInProgress = null;
			error = null;
		} catch (err) {
			console.error('Failed skill update:', err);
			error = 'Failed to update skill rank. Please try again.';
			setTimeout(() => error = null, 3000);
		} finally {
			operationInProgress = null;
		}
	}

	$effect(() => {
		console.log('Skill Points:', {
			total: Object.fromEntries(Object.entries(character?.skillPoints?.total ?? {})),
			remaining: Object.fromEntries(Object.entries(character?.skillPoints?.remaining ?? {})),
			levelNumbers,
			ranksByLevel: levelNumbers.map(level => ({
				level,
				ranks: character?.game_character_skill_rank?.filter(
					(rank: GameCharacterSkillRank) => rank.applied_at_level === level
				)
			}))
		});
	});
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
							{@const remainingPoints = character?.skillPoints?.remaining[level] ?? 0}
							{@const ranksAtLevel = character?.game_character_skill_rank?.filter(
								(rank: GameCharacterSkillRank) => rank.applied_at_level === level
							) ?? []}
							
							<button 
								class="flex flex-col items-center px-2 py-1 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
								onclick={() => onSelectValue?.({
									level,
									total: totalPoints,
									remaining: remainingPoints,
									ranks: ranksAtLevel
								})}
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
															{@const hasRank = character?.game_character_skill_rank?.some(
																(rank: GameCharacterSkillRank) => rank.skill_id === skill.id && rank.applied_at_level === level
															) ?? false}
															{@const canAdd = !hasRank && (character?.skillPoints?.remaining[level] ?? 0) > 0}
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
													{@const hasRank = character?.game_character_skill_rank?.some(
														(rank: GameCharacterSkillRank) => rank.skill_id === skill.id && rank.applied_at_level === level
													) ?? false}
													{@const canAdd = !hasRank && (character?.skillPoints?.remaining[level] ?? 0) > 0}
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

	.rank-distribution-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
		gap: 1rem;
		width: 100%;
	}

	.level-points {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.5rem;
		background-color: hsl(var(--muted));
		border-radius: 0.5rem;
	}

	.level-label {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
	}

	.points-remaining {
		font-size: 1.125rem;
		font-weight: 600;
		color: hsl(var(--primary));
	}

	.skill-points-grid {
		display: grid;
		gap: 0.5rem;
		/* This will create 4-5 columns depending on container width */
		grid-template-columns: repeat(auto-fit, minmax(5rem, 1fr));
		/* Forces items to fill rows from left to right */
		grid-auto-flow: dense;
		/* Ensures consistent width across columns */
		grid-auto-columns: 1fr;
	}

	.ability-badge {
		display: flex;
		gap: 0.25rem;
		align-items: center;
		font-size: 0.75rem;
	}
</style>