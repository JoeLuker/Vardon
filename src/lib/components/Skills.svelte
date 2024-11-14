<script lang="ts">
	import { slide } from 'svelte/transition';
	import { updateQueue } from '$lib/utils/updateQueue.svelte';
	import type { CharacterSkill } from '$lib/types/character';
	import SkillAllocator from './SkillAllocator.svelte';

	let { characterId, skills = [], onUpdateSkills } = $props<{
		characterId: number;
		skills: CharacterSkill[];
		onUpdateSkills: (skillRanks: Record<string, number>) => Promise<void>;
	}>();
	let showSkillAllocator = $state(false);

	let skillsList = $derived.by(() =>
		skills.map((skill: CharacterSkill) => ({
			...skill,
			displayName: skill.skill_name
				.replace(/([A-Z])/g, ' $1')
				.split(' ')
				.map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
				.join(' ')
		}))
	);

	async function handleSkillSave(newRanks: Record<string, number>) {
		const previousSkills = [...skills];

		await updateQueue.enqueue({
			key: `skills-${characterId}`,
			execute: async () => {
				await onUpdateSkills(newRanks);
			},
			optimisticUpdate: () => {
				skills = skills.map((skill: CharacterSkill) => ({
					...skill,
					ranks: newRanks[skill.skill_name] ?? skill.ranks
				}));
			},
			rollback: () => {
				skills = previousSkills;
			}
		});

		showSkillAllocator = false;
	}
</script>

<section class="card" transition:slide>
	<div class="mb-6 flex items-center justify-between">
		<h2 class="text-xl font-bold">Skills</h2>
		<button 
			class="btn" 
			onclick={() => (showSkillAllocator = true)}
			type="button"
		>
			Manage Skills
		</button>
	</div>

	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each skillsList as skill (skill.skill_name)}
			<div
				class="flex items-center justify-between rounded bg-gray-50 p-3 hover:bg-gray-100"
				class:border-l-4={skill.class_skill}
				class:border-primary={skill.class_skill}
			>
				<div>
					<span class="font-medium">{skill.displayName}</span>
					<div class="space-x-1 text-xs">
						<span class="text-gray-500">({skill.ability.toUpperCase()})</span>
						{#if skill.class_skill}
							<span class="text-primary">Class Skill</span>
						{/if}
						{#if skill.ranks > 0}
							<span class="text-gray-500">{skill.ranks} ranks</span>
						{/if}
					</div>
				</div>
			</div>
		{/each}
	</div>
</section>

{#if showSkillAllocator}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		role="dialog"
		aria-labelledby="skill-allocator-title"
	>
		<button
			class="absolute inset-0 h-full w-full"
			onclick={() => (showSkillAllocator = false)}
			onkeydown={(e) => e.key === 'Escape' && (showSkillAllocator = false)}
			aria-label="Close skill allocator"
		></button>
		<div
			class="card relative max-h-[90vh] w-full max-w-4xl overflow-hidden"
		>
			<SkillAllocator {characterId} {skills} onSave={handleSkillSave} />
		</div>
	</div>
{/if}