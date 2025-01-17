<!-- FILE: src/lib/ui/Skills.svelte -->
<script lang="ts">
	import { Eye, EyeOff } from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Tabs from '$lib/components/ui/tabs';

	import type { EnrichedCharacter, ValueWithBreakdown } from '$lib/domain/characterCalculations';

	// The local type that we'll use internally
	interface Skill {
		id: number;
		name: string;
		label: string;
		ability: string;
		ranks: number;
		trained_only: boolean;
		armor_check_penalty?: boolean;
	}

	// Props
	let { character, onSelectValue = () => {} } = $props<{
		character?: EnrichedCharacter | null;
		onSelectValue?: (val: ValueWithBreakdown) => void;
	}>();

	/**
	 * Local runes state:
	 * - showUnusableSkills: toggles whether we show trained-only skills with 0 ranks
	 * - viewMode: 'ability' or 'alphabetical'
	 */
	let showUnusableSkills = $state(false);
	let viewMode = $state<'ability' | 'alphabetical'>('ability');

	/**
	 * Derive `classSkills` from the first class in `character.classes` if available.
	 */
	let classSkills = $derived.by(() => {
		if (!character?.classes?.length) return [];
		return character.classes[0].class_skills ?? [];
	});

	/**
	 * Build a map from ability -> array of Skills,
	 * reading from `character.baseSkills` and `character.skillsWithRanks`.
	 */
	let skillsByAbility = $derived.by(() => {
		if (!character?.baseSkills) return {};

		// We'll reduce them into a map like { str: Skill[], dex: Skill[], ... }
		const result: Record<string, Skill[]> = {};

		for (const base of character.baseSkills) {
			const ability = base.ability.toLowerCase();

			if (!result[ability]) {
				result[ability] = [];
			}

			// find ranks
			const rankInfo = character.skillsWithRanks?.find((s: { skillId: number }) => s.skillId === base.id);
			const totalRanks = rankInfo?.totalRanks ?? 0;

			result[ability].push({
				id: base.id,
				name: base.name,
				label: base.label,
				ability: base.ability,
				ranks: totalRanks,
				trained_only: base.trained_only ?? false,
				armor_check_penalty: base.armor_check_penalty ?? false
			});
		}
		return result;
	});

	/**
	 * Also create an alphabetical list for 'alphabetical' view mode.
	 */
	let alphabeticalSkills = $derived.by(() => {
		const allAbilities = Object.values(skillsByAbility);
		const allSkills: Skill[] = allAbilities.flat();
		return allSkills.sort((a, b) => a.name.localeCompare(b.name));
	});

	/**
	 * formatModifier: add a plus sign if >= 0
	 */
	function formatModifier(mod: number): string {
		return mod >= 0 ? `+${mod}` : `${mod}`;
	}
</script>

<div class="skills-container">
	<!-- Switch between 'ability' or 'alphabetical' in a Tab -->
	<Tabs.Root
		value={viewMode}
		onValueChange={(value) => {
			if (value === 'ability' || value === 'alphabetical') {
				viewMode = value;
			}
		}}
		class="w-full"
	>
		<!-- Tabs header row -->
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

		<!-- By Ability View -->
		<Tabs.Content value="ability">
			<!-- If no character, show fallback -->
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
										<!-- Hide if trained_only && no ranks -->
										{#if showUnusableSkills || !(skill.trained_only && skill.ranks === 0)}
											{@const isClassSkill = classSkills.includes(skill.id)}
											{@const isUnusable = skill.trained_only && skill.ranks === 0}

											<button
												class="skill"
												class:is-class-skill={isClassSkill}
												class:unusable={isUnusable}
												onclick={() => {
													const breakdown = character.skills?.[skill.id];
													onSelectValue?.(breakdown);
												}}
												type="button"
											>
												<span class="skill-name">{skill.label}</span>
												<span class="modifier">
													{formatModifier(character.skills?.[skill.id]?.total ?? 0)}
												</span>
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

		<!-- Alphabetical View -->
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
								<!-- Hide if trained_only && no ranks -->
								{#if showUnusableSkills || !(skill.trained_only && skill.ranks === 0)}
									{@const isClassSkill = classSkills.includes(skill.id)}
									{@const isUnusable = skill.trained_only && skill.ranks === 0}

									<button
										class="skill"
										class:is-class-skill={isClassSkill}
										class:unusable={isUnusable}
										onclick={() => {
											const breakdown = character.skills?.[skill.id];
											onSelectValue?.(breakdown);
										}}
										type="button"
									>
										<span class="skill-name">{skill.label}</span>
										<span class="modifier">
											{formatModifier(character.skills?.[skill.id]?.total ?? 0)}
										</span>
										<Badge variant="secondary" class="ability-badge">
											{skill.ability.toUpperCase()}
										</Badge>
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
	/* (same styles as your snippet, minus the store references) */

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
