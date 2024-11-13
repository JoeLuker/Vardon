<script lang="ts">
	import type { CharacterSkill } from '$lib/types/character';

	type SkillGrid = Record<string, boolean[]>;

	let { skills, pointsPerLevel = 9, classLevel = 5, onSave } = $props<{
		skills: CharacterSkill[];
		pointsPerLevel?: number;
		classLevel?: number;
		onSave: (skillRanks: Record<string, number>) => Promise<void>;
	}>();

	let skillGrid = $state<SkillGrid>({});
	let isSaving = $state(false);

	// Initialize the grid when skills change
	$effect(() => {
		skillGrid = skills.reduce((grid: SkillGrid, skill: CharacterSkill) => {
			grid[skill.skill_name] = Array(classLevel)
				.fill(false)
				.map((_, i) => i < skill.ranks);
			return grid;
		}, {});
	});

	// Calculate points used per level
	let pointsUsedByLevel = $derived.by(() => {
		return Array(classLevel)
			.fill(0)
			.map((_, level) => 
				Object.values(skillGrid).reduce((sum, skillLevels) => 
					sum + (skillLevels[level] ? 1 : 0), 0)
			);
	});

	let isLevelFull = $derived(pointsUsedByLevel.map(points => points >= pointsPerLevel));
	let totalPointsUsed = $derived(pointsUsedByLevel.reduce((sum, points) => sum + points, 0));

	function toggleSkill(skillName: string, level: number) {
		if (!skillGrid[skillName]) return;

		const currentValue = skillGrid[skillName][level];
		if (!currentValue && isLevelFull[level]) return;

		const newLevels = [...skillGrid[skillName]];
		newLevels[level] = !currentValue;
		skillGrid[skillName] = newLevels;
	}

	function getSkillDisplayName(name: string): string {
		return name
			.replace(/([A-Z])/g, ' $1')
			.split(' ')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	async function handleSave() {
		isSaving = true;
		try {
			const newRanks = Object.entries(skillGrid).reduce((acc, [skillName, levels]) => {
				acc[skillName] = levels.filter(Boolean).length;
				return acc;
			}, {} as Record<string, number>);

			await onSave(newRanks);
		} catch (error) {
			console.error('Failed to save skill ranks:', error);
		} finally {
			isSaving = false;
		}
	}
</script>

<div class="space-y-4">
	<div class="flex justify-between items-center border-b border-gray-200 pb-4">
		<h2 class="text-xl font-bold">Allocate Skill Points</h2>
		<div class="text-sm text-gray-600">
			Total Points Used: {totalPointsUsed} / {pointsPerLevel * classLevel}
		</div>
	</div>

	<div class="overflow-auto max-h-[60vh]">
		<table class="w-full border-collapse">
			<thead class="sticky top-0 bg-white z-10">
				<tr>
					<th class="text-left p-2">Skill</th>
					{#each Array(classLevel) as _, level}
						<th class="p-2 text-center">
							<div>Level {level + 1}</div>
							<div class="text-sm {pointsUsedByLevel[level] === pointsPerLevel ? 'text-red-500' : 'text-gray-600'}">
								{pointsUsedByLevel[level]}/{pointsPerLevel}
							</div>
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each skills as skill}
					{@const isClassSkill = skill.classSkill}
					<tr class:bg-primary={isClassSkill}>
						<td class="p-2">
							<div>{getSkillDisplayName(skill.name)}</div>
							<div class="text-xs space-x-2">
								<span class="text-gray-500">({skill.ability})</span>
								{#if isClassSkill}
									<span class="text-primary">Class Skill</span>
								{/if}
							</div>
						</td>
						{#each Array(classLevel) as _, level}
							{@const isSelected = skillGrid[skill.name]?.[level]}
							{@const isDisabled = !isSelected && isLevelFull[level]}
							<td class="p-2 text-center">
								<button
									type="button"
									class="w-6 h-6 rounded border-2 transition-colors {isSelected ? 'bg-primary border-primary' : 'border-primary'} {isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary-dark'}"
									onclick={() => toggleSkill(skill.name, level)}
									disabled={isDisabled}
									aria-label="{isSelected ? 'Remove' : 'Add'} rank at level {level + 1}"
								></button>
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<div class="flex justify-end gap-2 pt-4 border-t border-gray-200">
		<button class="btn btn-secondary" onclick={() => onSave({})}> Cancel </button>
		<button
			class="btn flex items-center gap-2"
			onclick={handleSave}
			disabled={isSaving}>
			{#if isSaving}
				<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
			{/if}
			Save Changes
		</button>
	</div>
</div>