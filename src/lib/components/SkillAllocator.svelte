<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { skills, rootStore } from '$lib/stores';
	import { SKILL_ABILITIES, CLASS_SKILLS } from '$lib/stores/constants';
	import type { Ability, SkillName } from '$lib/types/character';
  
	const dispatch = createEventDispatcher();
  
	export let showAllocator = false;
  
	$: characterId = $rootStore.character?.id;
	$: skillsData = $skills.skills || {};
	$: skillPoints = calculateSkillPoints();
  
	interface SkillPoint {
	  total: number;
	  used: number;
	  remaining: number;
	}
  
	function calculateSkillPoints(): SkillPoint[] {
	  const pointsPerLevel = getPointsPerLevel();
	  const usedPointsByLevel = Array(5).fill(0); // 5 levels
  
	  // Calculate used points per level based on ranks
	  Object.values(skillsData).forEach(skill => {
		const ranks = skill.ranks || 0;
		for (let i = 0; i < ranks; i++) {
		  if (usedPointsByLevel[i] !== undefined) {
			usedPointsByLevel[i]++;
		  }
		}
	  });
  
	  // Format points per level
	  return usedPointsByLevel.map(used => ({
		total: pointsPerLevel,
		used,
		remaining: pointsPerLevel - used
	  }));
	}
  
	function getPointsPerLevel(): number {
	  const basePoints = 4; // Base for Mindchemist
	  const intModifier = 5; // INT 20 gives +5
	  const favoredClassBonus = 1; // fcb
	  return basePoints + intModifier + favoredClassBonus;
	}
  
	async function handleToggleSkill(level: number, skillName: SkillName) {
	  if (!characterId) return;
  
	  const currentLevel = skillPoints[level];
	  if (!currentLevel) return;
  
	  // Check if this level already has a point allocated
	  const isSelected = skills.hasPointAtLevel(level, skillName);
  
	  // Don't allow adding if we're out of points
	  if (!isSelected && currentLevel.remaining <= 0) return;
  
	  // Toggle the point at this level
	  await skills.toggleSkillPoint(characterId, level, skillName);
	}
  
	function getSkillDisplayName(skillName: string): string {
	  return skillName
		.replace(/([A-Z])/g, ' $1')
		.trim()
		.split(' ')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
	}
  
	function isClassSkill(skillName: string): boolean {
	  return CLASS_SKILLS[skillName as keyof typeof CLASS_SKILLS] || false;
	}
  
	function getSkillAbility(skillName: string): Ability {
	  return SKILL_ABILITIES[skillName as keyof typeof SKILL_ABILITIES] || 'int';
	}
  
	function handleClose() {
	  dispatch('close');
	}
  </script>
  
  {#if showAllocator}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
	  <div class="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-[#fffef0] shadow-xl">
		<!-- Header -->
		<div class="border-b border-[#c19a6b] p-4">
		  <h2 class="text-xl font-bold text-[#c19a6b]">Allocate Skill Points</h2>
		  {#if skillPoints.length > 0}
			<p class="mt-1 text-sm text-gray-600">
			  Points per level: {skillPoints[0].total}
			</p>
		  {/if}
		</div>
  
		<!-- Content -->
		<div class="max-h-[calc(90vh-10rem)] overflow-auto p-4">
		  <table class="w-full border-collapse">
			<thead class="sticky top-0 z-10 bg-[#fffef0]">
			  <tr>
				<th class="p-2 text-left">Skill</th>
				{#each skillPoints as points, level}
				  <th class="p-2 text-center">
					Level {level + 1}<br />
					<span class="text-sm {points.remaining === 0 ? 'text-red-500' : 'text-gray-600'}">
					  {points.used}/{points.total}
					</span>
				  </th>
				{/each}
			  </tr>
			</thead>
			<tbody>
			  {#each Object.entries(skillsData) as [skillName]}
				<tr class:bg-yellow-50={isClassSkill(skillName)}>
				  <td class="p-2">
					{getSkillDisplayName(skillName)}
					{#if isClassSkill(skillName)}
					  <span class="ml-1 text-xs text-[#c19a6b]">(class)</span>
					{/if}
					<span class="ml-1 text-xs text-gray-500">
					  ({getSkillAbility(skillName).toUpperCase()})
					</span>
				  </td>
				  {#each skillPoints as points, level}
					{@const isSelected = skills.hasPointAtLevel(level, skillName as SkillName)}
					{@const isDisabled = !isSelected && points.remaining === 0}
					<td class="p-2 text-center">
					  <button
						type="button"
						class="h-6 w-6 rounded border-2 transition-colors"
						class:bg-[#c19a6b]={isSelected}
						class:border-[#c19a6b]={!isSelected}
						class:cursor-not-allowed={isDisabled}
						on:click={() => handleToggleSkill(level, skillName as SkillName)}
						disabled={isDisabled}
						aria-label={isSelected
						  ? `Remove skill point from ${skillName} at level ${level + 1}`
						  : `Add skill point to ${skillName} at level ${level + 1}`}
					  ></button>
					</td>
				  {/each}
				</tr>
			  {/each}
			</tbody>
		  </table>
		</div>
  
		<!-- Footer -->
		<div class="flex justify-end gap-2 border-t border-[#c19a6b] p-4">
		  <button
			type="button"
			class="rounded bg-[#c19a6b] px-4 py-2 text-white transition-colors hover:bg-[#a67b4b]"
			on:click={handleClose}
		  >
			Done
		  </button>
		</div>
	  </div>
	</div>
  {/if}
  
  <style lang="postcss">
	button:disabled {
	  opacity: 0.5;
	  cursor: not-allowed;
	}
  
	button:not(:disabled):hover {
	  transform: scale(1.05);
	}
  
	button:focus {
	  outline: none;
	  --tw-ring-color: #c19a6b;
	  --tw-ring-offset-width: 2px;
	  --tw-ring-width: 2px;
	  box-shadow: 0 0 0 var(--tw-ring-offset-width) white,
		0 0 0 calc(var(--tw-ring-offset-width) + var(--tw-ring-width)) var(--tw-ring-color);
	}
  </style>