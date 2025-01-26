<script lang="ts">
	import { Eye, EyeOff } from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Tabs from '$lib/components/ui/tabs';

	import type { EnrichedCharacter, ValueWithBreakdown } from '$lib/domain/characterCalculations';

	// Local interfaces that match our data structure
	interface BaseSkill {
		id: number;
		name: string;
		label: string;
		ability_id: number;
		trained_only: boolean;
		armor_check_penalty?: boolean;
	}

	interface ProcessedSkill {
		id: number;
		name: string;
		label: string;
		ability: string;
		abilityMod: number;
		ranks: number;
		trained_only: boolean;
		armor_check_penalty?: boolean;
		total: number;
		isClassSkill: boolean;
	}

	interface AbilityDetails {
		abilityName: string;
		abilityLabel: string;
		abilityMod: number;
	}

	// Props
	let { character, onSelectValue = () => {} } = $props<{
		character?: EnrichedCharacter | null;
		onSelectValue?: (val: ValueWithBreakdown) => void;
	}>();

	let showUnusableSkills = $state(false);
	let viewMode = $state<'ability' | 'alphabetical'>('ability');

	// Helper function to get ability modifier from a given skill
	function getAbilityDetailsFromSkill(skill: BaseSkill): AbilityDetails {
		if (!character?.abilities) {
			return { abilityName: '', abilityLabel: '', abilityMod: 0 };
		}

		const ability = character.abilities.find((ability: { base: { id: number; }; }) => ability.base.id === skill.ability_id);
		if (!ability) {
			return { abilityName: '', abilityLabel: '', abilityMod: 0 };
		}

		// Get the modifier based on the ability name
		const abilityName = ability.base.name.replace('ability_', '').toLowerCase();
		const modifierMap: Record<string, keyof EnrichedCharacter> = {
			'strength': 'strMod',
			'dexterity': 'dexMod',
			'constitution': 'conMod',
			'intelligence': 'intMod',
			'wisdom': 'wisMod',
			'charisma': 'chaMod'
		};

		const modKey = modifierMap[abilityName];
		const abilityMod = modKey ? (character[modKey] as number) : 0;

		return {
			abilityName: abilityName.toUpperCase(),
			abilityLabel: ability.base.label,
			abilityMod
		};
	}

	// Store class skills as a Set of skill names
	let classSkills = $derived.by(() => {
		if (!character?.classes?.length || !character.baseSkills) {
			return new Set<string>();
		}
		
		const classSkillIds = character.classes[0].class_skills ?? [];
		return new Set(
			character.baseSkills
				.filter((skill: BaseSkill) => classSkillIds.includes(skill.id))
				.map((skill: BaseSkill) => skill.name)
		);
	});

	// Process skills and group by ability
	let skillsByAbility = $derived.by(() => {
		if (!character?.baseSkills) {
			return {} as Record<string, ProcessedSkill[]>;
		}

		const result: Record<string, ProcessedSkill[]> = {};

		for (const baseSkill of character.baseSkills) {
			// Get ability details
			const { abilityName, abilityMod } = getAbilityDetailsFromSkill(baseSkill);
			const abilityAbbreviation = abilityName.slice(0, 3);
			const ability = abilityName.toLowerCase();

			// Initialize ability group if needed
			if (!result[ability]) {
				result[ability] = [];
			}

			// Find skill ranks from the enriched character data
			const skillInfo = character.skillsWithRanks?.find((s: { name: string }) => s.name === baseSkill.name);
			const totalRanks = skillInfo?.totalRanks ?? 0;
			
			// Determine class skill status
			const isClassSkill = classSkills.has(baseSkill.name);
			
			// Calculate total skill bonus
			const classSkillBonus = (isClassSkill && totalRanks > 0) ? 3 : 0;
			const total = totalRanks + abilityMod + classSkillBonus;

			result[ability].push({
				id: baseSkill.id,
				name: baseSkill.name,
				label: baseSkill.label,
				ability: abilityAbbreviation,
				abilityMod,
				ranks: totalRanks,
				trained_only: baseSkill.trained_only,
				armor_check_penalty: baseSkill.armor_check_penalty,
				total,
				isClassSkill
			});
		}

		return result;
	});

	let alphabeticalSkills = $derived.by(() => {
		return Object.values(skillsByAbility)
			.flat()
			.sort((a: ProcessedSkill, b: ProcessedSkill) => a.label.localeCompare(b.label));
	});

	function formatModifier(mod: number): string {
		return mod >= 0 ? `+${mod}` : `${mod}`;
	}
</script>

<!-- Rest of the template remains the same -->
<div class="skills-container">
	<Tabs.Root
		value={viewMode}
		onValueChange={(value) => {
			if (value === 'ability' || value === 'alphabetical') {
				viewMode = value;
			}
		}}
		class="w-full"
	>
		<div class="tabs-header">
			<Tabs.List class="grid h-12 w-full grid-cols-[1fr_1fr_2px_auto]">
				<Tabs.Trigger value="ability" class="h-full">By Ability</Tabs.Trigger>
				<Tabs.Trigger value="alphabetical" class="h-full">Alphabetical</Tabs.Trigger>
				<div class="pill-divider"></div>

				<Button
					variant="secondary"
					size="icon"
					class="toggle-unusable h-full"
					onclick={() => (showUnusableSkills = !showUnusableSkills)}
				>
					{#if showUnusableSkills}
						<Eye size={20} />
					{:else}
						<EyeOff size={20} />
					{/if}
				</Button>
			</Tabs.List>
		</div>

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
									{#each skills as skill}
										{#if showUnusableSkills || !(skill.trained_only && skill.ranks === 0)}
											<button
												class="skill"
												class:is-class-skill={skill.isClassSkill}
												class:unusable={skill.trained_only && skill.ranks === 0}
												onclick={() => {
													const breakdown = character.skills?.[skill.id];
													onSelectValue?.(breakdown);
												}}
												type="button"
											>
												<span class="skill-name">
													{skill.label}
												</span>
												<span class="modifier">{formatModifier(skill.total)}</span>
											</button>
										{/if}
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
							{#each alphabeticalSkills as skill}
								{#if showUnusableSkills || !(skill.trained_only && skill.ranks === 0)}
									<button
										class="skill"
										class:is-class-skill={skill.isClassSkill}
										class:unusable={skill.trained_only && skill.ranks === 0}
										onclick={() => {
											const breakdown = character.skills?.[skill.id];
											onSelectValue?.(breakdown);
										}}
										type="button"
									>
										<span class="skill-name">
											{skill.label}
										</span>
										<Badge variant="secondary" class="ability-badge">
											{skill.ability}
										</Badge>
										<span class="modifier">{formatModifier(skill.total)}</span>
									</button>
								{/if}
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
		padding: 1rem;
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
		@apply flex items-center justify-between w-full min-h-[48px]
			px-4 py-2 cursor-pointer rounded border border-transparent transition-all;

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
		}

		&.unusable {
			opacity: 0.6;
			cursor: not-allowed;
			background-color: hsl(var(--muted));
			transform: none;
		}
	}

	.skill-name {
		margin-right: 0.5rem;
		flex: 1;
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
</style>