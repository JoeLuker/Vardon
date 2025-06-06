<!-- FILE: src/lib/ui/ABPChoiceDialog.svelte -->
<script lang="ts">
	import type { AssembledCharacter } from './types/CharacterTypes';
	import type { GameKernel } from '$lib/domain/kernel/GameKernel';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogDescription
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { logger } from '$lib/utils/Logger';
	import { createEventDispatcher } from 'svelte';

	interface Props {
		character: AssembledCharacter;
		kernel?: GameKernel;
		open?: boolean;
	}

	let { character, kernel, open = $bindable(false) }: Props = $props();

	const dispatch = createEventDispatcher();

	// ABP choices by level
	const abpChoicesByLevel = {
		6: {
			title: 'Mental Prowess',
			description: 'Choose a mental ability score to receive a +2 inherent bonus',
			options: [
				{ id: 'mental_int', label: 'Intelligence', value: 'intelligence' },
				{ id: 'mental_wis', label: 'Wisdom', value: 'wisdom' },
				{ id: 'mental_cha', label: 'Charisma', value: 'charisma' }
			]
		},
		7: {
			title: 'Physical Prowess',
			description: 'Choose a physical ability score to receive a +2 inherent bonus',
			options: [
				{ id: 'physical_str', label: 'Strength', value: 'strength' },
				{ id: 'physical_dex', label: 'Dexterity', value: 'dexterity' },
				{ id: 'physical_con', label: 'Constitution', value: 'constitution' }
			]
		},
		14: {
			title: 'Enhanced Attunement',
			description: 'Choose how to distribute your enhancement bonuses',
			options: [
				{
					id: 'split_bonus',
					label: 'Split Bonus',
					value: 'split',
					description: '+2 to both armor and weapons'
				},
				{
					id: 'single_bonus',
					label: 'Focused Bonus',
					value: 'single',
					description: '+3 to either armor or weapons'
				}
			]
		},
		19: {
			title: 'Legendary Gift',
			description: 'Choose a legendary ability',
			options: [
				{
					id: 'legendary_ability',
					label: 'Legendary Ability',
					value: 'ability',
					description: '+1 to all ability scores'
				},
				{
					id: 'legendary_defense',
					label: 'Legendary Defense',
					value: 'defense',
					description: '+5 natural armor'
				},
				{
					id: 'legendary_magic',
					label: 'Legendary Magic',
					value: 'magic',
					description: 'SR 21 + character level'
				}
			]
		}
	};

	// Check which choices are available
	let availableChoices = $derived(() => {
		if (!character) return [];

		const level = character.totalLevel || 1;
		const existingChoices = new Set(character.abpData?.nodes?.map((node) => node.name) || []);

		return Object.entries(abpChoicesByLevel)
			.filter(([lvl, _]) => parseInt(lvl) <= level)
			.filter(([_, choice]) => {
				// Check if this choice hasn't been made yet
				return !choice.options.some((opt) => existingChoices.has(opt.id));
			})
			.map(([level, choice]) => ({ level: parseInt(level), ...choice }));
	});

	// Selected choice state
	let selectedLevel = $state<number | null>(null);
	let selectedOption = $state<string | null>(null);
	let isSubmitting = $state(false);

	// Handle choice selection
	function selectChoice(level: number, optionId: string) {
		selectedLevel = level;
		selectedOption = optionId;
	}

	// Submit choice
	async function submitChoice() {
		if (!selectedLevel || !selectedOption || !character || !kernel) {
			return;
		}

		isSubmitting = true;

		try {
			logger.info('ABPChoiceDialog', 'submitChoice', 'Submitting ABP choice', {
				characterId: character.id,
				level: selectedLevel,
				option: selectedOption
			});

			// Here you would save the choice to the database
			// For now, we'll just log it and close the dialog

			// TODO: Implement actual save logic
			// const result = await kernel.ioctl(fd, REQUEST.SAVE_ABP_CHOICE, {
			//   characterId: character.id,
			//   nodeId: selectedOption
			// });

			dispatch('choice', { level: selectedLevel, option: selectedOption });
			open = false;

			// Reset selection
			selectedLevel = null;
			selectedOption = null;
		} catch (error) {
			logger.error('ABPChoiceDialog', 'submitChoice', 'Failed to save ABP choice', { error });
		} finally {
			isSubmitting = false;
		}
	}

	// Close dialog
	function closeDialog() {
		open = false;
		selectedLevel = null;
		selectedOption = null;
	}
</script>

<Dialog bind:open>
	<DialogContent class="max-w-2xl">
		<DialogHeader>
			<DialogTitle>Automatic Bonus Progression Choices</DialogTitle>
			<DialogDescription>
				Select your progression bonuses for level {character?.totalLevel || 1}
			</DialogDescription>
		</DialogHeader>

		<div class="space-y-4">
			{#if availableChoices.length === 0}
				<p class="text-muted-foreground">
					No ABP choices are currently available. Choices become available at levels 6, 7, 14, and
					19.
				</p>
			{:else}
				{#each availableChoices as choice}
					<Card>
						<CardHeader>
							<div class="flex items-center justify-between">
								<CardTitle class="text-lg">
									Level {choice.level}: {choice.title}
								</CardTitle>
								{#if selectedLevel === choice.level}
									<Badge>Selected</Badge>
								{/if}
							</div>
							<CardDescription>{choice.description}</CardDescription>
						</CardHeader>
						<CardContent>
							<div class="grid gap-2">
								{#each choice.options as option}
									<button
										class="rounded-md border p-3 text-left transition-colors
											{selectedLevel === choice.level && selectedOption === option.id
											? 'bg-primary text-primary-foreground'
											: 'hover:bg-muted'}"
										onclick={() => selectChoice(choice.level, option.id)}
										disabled={isSubmitting}
									>
										<div class="font-medium">{option.label}</div>
										{#if option.description}
											<div class="text-sm opacity-80">{option.description}</div>
										{/if}
									</button>
								{/each}
							</div>
						</CardContent>
					</Card>
				{/each}
			{/if}

			<div class="flex justify-end gap-2 pt-4">
				<Button variant="outline" onclick={closeDialog} disabled={isSubmitting}>Cancel</Button>
				{#if selectedOption}
					<Button onclick={submitChoice} disabled={isSubmitting}>
						{#if isSubmitting}
							Saving...
						{:else}
							Confirm Choice
						{/if}
					</Button>
				{/if}
			</div>
		</div>
	</DialogContent>
</Dialog>
