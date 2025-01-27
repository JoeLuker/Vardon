<script lang="ts">
	import { Eye, EyeOff, Grid, Circle } from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import type { EnrichedCharacter, ValueWithBreakdown } from '$lib/domain/characterCalculations';
	import type { GameRulesData, SkillRow, AbilityRow } from '$lib/db';
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

	// Define the type for skillsWithRanks
	interface SkillRankData {
		skillId: number;
		ranksByLevel: number[];
	}

	let { 
		character, 
		rules, 
		onSelectValue = () => {},
		onUpdateDB = async (_changes: any) => {} 
	} = $props<{
		character?: EnrichedCharacter | null;
		rules?: GameRulesData | null;
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

	function processSkill(skillId: string, skillData: ValueWithBreakdown): ProcessedSkill | null {
		if (!rules || !('modifiers' in skillData)) return null;

		const baseSkill = rules.rules.skillRows.find((s: SkillRow) => s.id === parseInt(skillId));
		if (!baseSkill) return null;

		const ability = rules.rules.abilityRows.find((a: AbilityRow) => a.id === baseSkill.ability_id);
		const abilityName = skillData.overrides?.ability?.override ?? ability?.label ?? 'Unknown';

		const ranks = character?.skillRanks?.filter((sr: { base: { id: number } }) => sr.base.id === parseInt(skillId)).length ?? 0;
		
		const skillWithRanks = character?.skillsWithRanks?.find((s: SkillRankData) => s.skillId === parseInt(skillId));

		const overrides = skillData.overrides;

		const processed = {
			id: parseInt(skillId),
			name: baseSkill.name,
			label: baseSkill.label ?? baseSkill.name,
			ability: abilityName,
			total: skillData.total,
			ranks,
			trainedOnly: baseSkill.trained_only ?? false,
			isClassSkill: skillWithRanks?.isClassSkill ?? false,
			ranksByLevel: skillWithRanks?.ranksByLevel ?? [],
			overrides
		};

		return processed;
	}

	let skillsByAbility = $derived.by(() => {
		if (!character?.skills) return {};

		const result: Record<string, ProcessedSkill[]> = {};

		for (const [skillId, skillData] of Object.entries(character.skills)) {
			const processed = processSkill(skillId, skillData as ValueWithBreakdown);
			if (!processed) continue;

			const { ability } = processed;
			if (!result[ability]) result[ability] = [];
			result[ability].push(processed);
		}

		// Sort skills within each ability
		for (const skills of Object.values(result)) {
			skills.sort((a, b) => a.name.localeCompare(b.name));
		}

		return result;
	});

	let alphabeticalSkills = $derived.by(() => {
		return Object.values(skillsByAbility)
			.flat()
			.sort((a, b) => a.name.localeCompare(b.name));
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
		
		const skillData = character.skillsWithRanks?.find((s: SkillRankData) => s.skillId === skillId);
		const hasRank = skillData?.ranksByLevel.includes(level) ?? false;
		
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
			previousState: skillData ? skillData.ranksByLevel : []
		};

		try {
			operationInProgress = operation;
			applySkillUpdate(operation);
			await onUpdateDB(operation);
			operationInProgress = null;
			error = null;
		} catch (err) {
			if (skillData && operation.previousState) {
				skillData.ranksByLevel = operation.previousState;
			}
			console.error('Failed skill update:', err);
			error = 'Failed to update skill rank. Please try again.';
			setTimeout(() => error = null, 3000);
		} finally {
			operationInProgress = null;
		}
	}

	function applySkillUpdate(operation: UpdateOperation) {
		if (!character) return;

		const skillData = character.skillsWithRanks?.find((s: SkillRankData) => s.skillId === operation.skillId);
		if (!skillData) return;

		// Update the skill ranks optimistically
		if (operation.type === 'add') {
			skillData.ranksByLevel.push(operation.level);
			
			// Update remaining skill points
			if (character.skillPoints?.remaining) {
				character.skillPoints.remaining[operation.level]--;
			}
		} else {
			skillData.ranksByLevel = skillData.ranksByLevel.filter((l: number) => l !== operation.level);
			
			// Update remaining skill points
			if (character.skillPoints?.remaining) {
				character.skillPoints.remaining[operation.level]++;
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
							<div class="flex flex-col items-center px-2 py-1 rounded-md bg-muted/30">
								<span class="text-xs text-muted-foreground">Level {level}</span>
								<span class="font-medium text-primary">{character.skillPoints.remaining[level] ?? 0}/{character.skillPoints.total[level] ?? 0}</span>
							</div>
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
				<div class="ability-cards">
					{#each Object.entries(skillsByAbility) as [ability, skills]}
						<Card.Root>
							<Card.Header>
								<Card.Title>{ability.toUpperCase()}</Card.Title>
							</Card.Header>
							<Card.Content>
								<div class="skills-grid">
									{#each skills.filter(shouldShowSkill) as skill}
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
														{@const hasRank = skill.ranksByLevel.includes(level)}
														{@const canAdd = !hasRank && (character?.skillPoints?.remaining[level] ?? 0) > 0}
														<Button
															variant="outline"
															size="sm"
															class="h-8 w-8"
															disabled={!!operationInProgress || (!hasRank && !canAdd)}
															onclick={(e) => {
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
			{/if}
		</Tabs.Content>

		<Tabs.Content value="alphabetical">
			{#if !character}
				<div class="rounded-md border border-muted p-4">
					<p class="text-muted-foreground">Loading skills...</p>
				</div>
			{:else}
				<Card.Root>
					<Card.Content>
						<div class="skills-grid">
							{#each alphabeticalSkills.filter(shouldShowSkill) as skill}
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
												{@const hasRank = skill.ranksByLevel.includes(level)}
												{@const canAdd = !hasRank && (character?.skillPoints?.remaining[level] ?? 0) > 0}
												<Button
													variant="outline"
													size="sm"
													class="h-8 w-8"
													disabled={!!operationInProgress || (!hasRank && !canAdd)}
													onclick={(e) => {
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