<script lang="ts">
	import type { AssembledCharacter, ValueWithBreakdown } from '$lib/ui/types/CharacterTypes';
	import type { CompleteCharacter, Ability } from '$lib/domain/exports';
	import { StretchHorizontal } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { OpenMode, ErrorCode } from '$lib/domain/kernel/types';
	import { onMount, onDestroy } from 'svelte';

	// Define interface for our processed ability score data
	interface AbilityScore {
		name: string;
		value: number;
		mod: number;
		path: string;
	}

	// The Unix way - everything is a file
	const ABILITY_PATHS = {
		DEVICE: '/dev/ability',
		PROC: '/proc',
		PROC_CHARACTER: '/proc/character'
	};

	// Request codes
	const ABILITY_REQUEST = {
		GET_SCORE: 1,
		GET_BREAKDOWN: 4,
		GET_ALL: 5
	};

	// Props with proper typing
	let {
		character,
		onSelectValue = () => {},
		kernel
	} = $props<{
		character?: AssembledCharacter | null;
		onSelectValue?: (val: ValueWithBreakdown) => void;
		kernel?: any;
	}>();

	// Local UI state
	let showModifierFirst = $state(false);
	let abilityScores = $state<AbilityScore[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);

	// Load abilities from device
	async function loadAbilityScores() {
		if (!kernel || !character) {
			return;
		}

		isLoading = true;
		error = null;

		// Check if /proc exists and create if needed
		if (!kernel.exists(ABILITY_PATHS.PROC)) {
			console.log(`Creating ${ABILITY_PATHS.PROC} directory`);
			const procResult = kernel.mkdir(ABILITY_PATHS.PROC);
			if (!procResult.success) {
				error = `Failed to create ${ABILITY_PATHS.PROC} directory: ${procResult.errorMessage || 'Unknown error'}`;
				isLoading = false;
				return;
			}
		}

		// Check if /proc/character exists and create if needed
		if (!kernel.exists(ABILITY_PATHS.PROC_CHARACTER)) {
			console.log(`Creating ${ABILITY_PATHS.PROC_CHARACTER} directory`);
			const charDirResult = kernel.mkdir(ABILITY_PATHS.PROC_CHARACTER);
			if (!charDirResult.success) {
				error = `Failed to create ${ABILITY_PATHS.PROC_CHARACTER} directory: ${charDirResult.errorMessage || 'Unknown error'}`;
				isLoading = false;
				return;
			}
		}

		// Path to character in filesystem
		const entityPath = `${ABILITY_PATHS.PROC_CHARACTER}/${character.id}`;

		// Check if entity exists
		if (!kernel.exists(entityPath)) {
			error = `Character entity not found: ${entityPath}`;
			isLoading = false;
			return;
		}

		// Define ability names
		const abilityNames = [
			{ key: 'strength', name: 'Strength' },
			{ key: 'dexterity', name: 'Dexterity' },
			{ key: 'constitution', name: 'Constitution' },
			{ key: 'intelligence', name: 'Intelligence' },
			{ key: 'wisdom', name: 'Wisdom' },
			{ key: 'charisma', name: 'Charisma' }
		];

		// Try to read abilities using device file
		if (kernel.exists(ABILITY_PATHS.DEVICE)) {
			// Open ability device
			const fd = kernel.open(ABILITY_PATHS.DEVICE, OpenMode.READ_WRITE);
			if (fd < 0) {
				error = `Failed to open ability device: ${fd}`;
				isLoading = false;
				return;
			}

			try {
				// Ensure entity exists at entityPath
				if (!kernel.exists(entityPath)) {
					// Create entity file with basic data if it doesn't exist
					console.log(`Creating entity file at ${entityPath}`);
					kernel.create(entityPath, {
						id: character.id,
						type: 'character',
						name: character.name || 'Unknown Character',
						properties: {
							abilities: {}
						},
						metadata: {
							createdAt: Date.now(),
							updatedAt: Date.now()
						}
					});
				}

				// Call ioctl to get all ability scores
				const ioctlResult = kernel.ioctl(fd, ABILITY_REQUEST.GET_ALL, {
					operation: 'getBreakdown',
					entityPath,
					ability: 'all'
				});

				if (ioctlResult !== ErrorCode.SUCCESS) {
					error = `Failed to request ability scores: ${ioctlResult}`;
					isLoading = false;
					return;
				}

				// Read response
				const buffer = {};
				const readResult = kernel.read(fd, buffer);

				if (readResult !== ErrorCode.SUCCESS) {
					error = `Failed to read ability scores: ${readResult}`;
					isLoading = false;
					return;
				}

				// Process ability scores
				const newScores: AbilityScore[] = [];
				for (const ability of abilityNames) {
					const abilityData = buffer[ability.key];
					if (abilityData) {
						newScores.push({
							name: ability.name,
							value: abilityData.total || 10,
							mod: Math.floor((abilityData.total - 10) / 2),
							path: `${entityPath}/abilities/${ability.key}`
						});
					} else {
						// Fallback to character if device doesn't have the data
						const charAbility = character[ability.key as keyof AssembledCharacter];
						newScores.push({
							name: ability.name,
							value: charAbility?.total || 10,
							mod:
								(character[
									`${ability.key.substring(0, 3)}Mod` as keyof AssembledCharacter
								] as number) || 0,
							path: `${entityPath}/abilities/${ability.key}`
						});
					}
				}

				// Update state
				abilityScores = newScores;
			} finally {
				// Always close the file descriptor
				kernel.close(fd);
			}
		} else {
			// Fallback to character props if device not available
			const newScores: AbilityScore[] = abilityNames.map((ability) => {
				const charAbility = character[ability.key as keyof AssembledCharacter];
				return {
					name: ability.name,
					value: charAbility?.total || 10,
					mod:
						(character[
							`${ability.key.substring(0, 3)}Mod` as keyof AssembledCharacter
						] as number) || 0,
					path: `${entityPath}/abilities/${ability.key}`
				};
			});

			// Update state
			abilityScores = newScores;
		}

		isLoading = false;
	}

	// Load ability breakdown when selected
	function selectAbility(ability: AbilityScore) {
		if (!kernel || !character) {
			return;
		}

		// Check if /proc exists and create if needed
		if (!kernel.exists(ABILITY_PATHS.PROC)) {
			console.log(`Creating ${ABILITY_PATHS.PROC} directory`);
			const procResult = kernel.mkdir(ABILITY_PATHS.PROC);
			if (!procResult.success) {
				console.error(
					`Failed to create ${ABILITY_PATHS.PROC} directory: ${procResult.errorMessage || 'Unknown error'}`
				);
				return;
			}
		}

		// Check if /proc/character exists and create if needed
		if (!kernel.exists(ABILITY_PATHS.PROC_CHARACTER)) {
			console.log(`Creating ${ABILITY_PATHS.PROC_CHARACTER} directory`);
			const charDirResult = kernel.mkdir(ABILITY_PATHS.PROC_CHARACTER);
			if (!charDirResult.success) {
				console.error(
					`Failed to create ${ABILITY_PATHS.PROC_CHARACTER} directory: ${charDirResult.errorMessage || 'Unknown error'}`
				);
				return;
			}
		}

		// Open ability device
		const fd = kernel.open(ABILITY_PATHS.DEVICE, OpenMode.READ_WRITE);
		if (fd < 0) {
			console.error(`Failed to open ability device: ${fd}`);
			return;
		}

		try {
			// Path to character in filesystem
			const entityPath = `${ABILITY_PATHS.PROC_CHARACTER}/${character.id}`;

			// Ensure entity exists at entityPath
			if (!kernel.exists(entityPath)) {
				// Create entity file with basic data if it doesn't exist
				console.log(`Creating entity file at ${entityPath}`);
				kernel.create(entityPath, {
					id: character.id,
					type: 'character',
					name: character.name || 'Unknown Character',
					properties: {
						abilities: {}
					},
					metadata: {
						createdAt: Date.now(),
						updatedAt: Date.now()
					}
				});
			}

			// Request the ability breakdown
			const abilityKey = ability.name.toLowerCase();
			const ioctlResult = kernel.ioctl(fd, ABILITY_REQUEST.GET_BREAKDOWN, {
				operation: 'getBreakdown',
				entityPath,
				ability: abilityKey
			});

			if (ioctlResult !== ErrorCode.SUCCESS) {
				console.error(`Failed to request ability breakdown: ${ioctlResult}`);
				return;
			}

			// Read the breakdown
			const buffer = {};
			const readResult = kernel.read(fd, buffer);

			if (readResult !== ErrorCode.SUCCESS) {
				console.error(`Failed to read ability breakdown: ${readResult}`);
				return;
			}

			// Convert to ValueWithBreakdown format
			const breakdown: ValueWithBreakdown = {
				label: ability.name,
				total: buffer.total || ability.value,
				modifiers: (buffer.bonuses?.components || []).map((c: any) => ({
					source: c.source,
					value: c.value
				}))
			};

			// Call the onSelectValue callback
			onSelectValue(breakdown);
		} finally {
			// Always close the file descriptor
			kernel.close(fd);
		}
	}

	// Load data when component mounts or character changes
	$effect(() => {
		if (character && kernel) {
			loadAbilityScores();
		}
	});

	// Event handlers
	function toggleModifierFirst() {
		showModifierFirst = !showModifierFirst;
	}
</script>

{#if isLoading}
	<div class="card">
		<div class="flex items-center justify-center space-x-2 text-primary/70">
			<div
				class="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary"
			></div>
			<p>Loading attributes...</p>
		</div>
	</div>
{:else if error}
	<div class="card p-4">
		<div class="text-red-500">
			<p>Error loading ability scores: {error}</p>
		</div>
	</div>
{:else}
	<div class="card">
		<div class="flex flex-col gap-2">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-semibold">Ability Scores</h2>
				<Button
					variant="ghost"
					size="icon"
					class="opacity-50 transition-opacity hover:opacity-100"
					onclick={toggleModifierFirst}
				>
					<span class="sr-only">Toggle show modifier first</span>
					<StretchHorizontal
						class="h-4 w-4 transition-transform duration-200"
						style={showModifierFirst ? 'transform: rotate(180deg)' : ''}
					/>
				</Button>
			</div>
			<div class="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
				{#each abilityScores as ability}
					<button class="attribute-card" type="button" onclick={() => selectAbility(ability)}>
						<div class="card-inner">
							<div class="attribute-name">{ability.name}</div>

							{#if showModifierFirst}
								<div class="primary-value modifier">
									{ability.mod >= 0 ? '+' : ''}{ability.mod}
								</div>
								<div class="secondary-value score">
									{ability.value}
								</div>
							{:else}
								<div class="primary-value score">
									{ability.value}
								</div>
								<div class="secondary-value modifier">
									{ability.mod >= 0 ? '+' : ''}{ability.mod}
								</div>
							{/if}
						</div>
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}

<style lang="postcss">
	.attribute-card {
		@apply relative rounded-lg border bg-card shadow-sm transition-transform duration-200;
		border-color: hsl(var(--border) / 0.2);
		&:hover {
			@apply scale-105;
		}
	}

	.card-inner {
		@apply flex flex-col items-center space-y-2 p-4;
	}

	.attribute-name {
		@apply text-sm font-medium text-muted-foreground;
	}

	.primary-value {
		@apply text-2xl font-bold text-foreground;
	}

	.secondary-value {
		@apply text-sm text-muted-foreground;
	}
</style>
