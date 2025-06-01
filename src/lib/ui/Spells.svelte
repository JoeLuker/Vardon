<script lang="ts">
	import type { AssembledCharacter } from '$lib/ui/types/CharacterTypes';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Search } from 'lucide-svelte';
	import { Input } from '$lib/components/ui/input';
	// Unix architecture imports
	import { OpenMode } from '$lib/domain/kernel/types';
	import type { GameKernel } from '$lib/domain/kernel/GameKernel';
	import type { Entity } from '$lib/domain/kernel/types';

	// Props
	let { character, kernel } = $props<{
		character?: AssembledCharacter | null;
		kernel?: GameKernel | null;
	}>();

	// Local state
	let searchQuery = $state('');
	let selectedSpellLevel = $state('all');
	let selectedSpell = $state<{
		name: string;
		description: string;
		level?: number;
		school?: string;
		castingTime?: string;
		range?: string;
		duration?: string;
		components?: string[];
	} | null>(null);
	let dialogOpen = $state(false);

	// Spells data
	let characterSpells = $state<any[]>([]);
	let spellsByLevel = $state(new Map<number, any[]>());
	let filteredSpells = $state<any[]>([]);

	// Load spells using Unix file operations
	async function loadSpells() {
		if (!character?.id || !kernel) return;

		// Ensure /proc directory exists
		if (!kernel.exists('/v_proc')) {
			console.log('Creating /proc directory');
			const procResult = kernel.mkdir('/v_proc');
			if (!procResult.success) {
				console.error(
					`Failed to create /proc directory: ${procResult.errorMessage || 'Unknown error'}`
				);
				return;
			}
		}

		// Ensure /proc/character directory exists
		if (!kernel.exists('/v_proc/character')) {
			console.log('Creating /proc/character directory');
			const charDirResult = kernel.mkdir('/v_proc/character');
			if (!charDirResult.success) {
				console.error(
					`Failed to create /proc/character directory: ${charDirResult.errorMessage || 'Unknown error'}`
				);
				return;
			}
		}

		// Get the entity path
		const entityPath = `/v_proc/character/${character.id}`;

		if (!kernel.exists(entityPath)) {
			console.error(`Entity not found: ${entityPath}`);
			return;
		}

		// Open the entity file
		const fd = kernel.open(entityPath, OpenMode.READ);

		if (fd < 0) {
			console.error(`Failed to open entity: ${entityPath}`);
			return;
		}

		try {
			// Read the entity
			const entityBuffer: Entity = { id: entityPath, properties: {}, capabilities: {} };
			const [readResult] = kernel.read(fd, entityBuffer);

			if (readResult !== 0) {
				console.error(`Failed to read entity: ${readResult}`);
				return;
			}

			// Get spells from the entity
			const spells = entityBuffer.capabilities?.spellcasting?.game_character_spell || [];
			characterSpells = spells;

			// Group spells by level
			const grouped = new Map<number, any[]>();
			for (const spellData of spells) {
				if (!grouped.has(spellData.level)) {
					grouped.set(spellData.level, []);
				}
				const spellsAtLevel = grouped.get(spellData.level);
				if (spellsAtLevel) {
					spellsAtLevel.push(spellData);
				}
			}
			spellsByLevel = grouped;

			// Initialize filtered spells
			updateFilteredSpells();
		} finally {
			// Always close the file
			kernel.close(fd);
		}
	}

	// Update data when character changes
	$effect(() => {
		if (character?.id && kernel) {
			loadSpells();
		}
	});

	// Update filtered spells when search or level selection changes
	$effect(() => {
		updateFilteredSpells();
	});

	function updateFilteredSpells() {
		if (characterSpells.length === 0) {
			filteredSpells = [];
			return;
		}

		let result = [...characterSpells];

		// Filter by level if needed
		if (selectedSpellLevel !== 'all') {
			const level = parseInt(selectedSpellLevel);
			result = result.filter((spell) => spell.level === level);
		}

		// Filter by search query if present
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase().trim();
			result = result.filter(
				(spellData) =>
					spellData.spell?.label?.toLowerCase().includes(query) ||
					spellData.spell?.description?.toLowerCase().includes(query)
			);
		}

		filteredSpells = result;
	}

	// Helper function to get spell metadata safely
	function getSpellMetadata(spell: any) {
		if (!spell)
			return {
				school: 'Unknown',
				castingTime: 'Standard Action',
				range: 'Self',
				duration: 'Instantaneous',
				components: []
			};

		// Extract metadata from spell mappings safely
		const school = spell?.spell_school_mapping?.[0]?.spell_school?.label || 'Unknown School';
		const castingTime =
			spell?.spell_casting_time_mapping?.[0]?.spell_casting_time?.label || 'Standard Action';
		const range = spell?.spell_range_mapping?.[0]?.spell_range?.label || 'Self';
		const duration = spell?.spell_duration_mapping?.[0]?.spell_duration?.label || 'Instantaneous';

		// Extract components safely
		const components: string[] = [];
		if (spell?.spell_component_mapping) {
			for (const mapping of spell.spell_component_mapping) {
				const abbr = mapping?.spell_component?.type?.abbreviation;
				if (abbr) components.push(abbr);
			}
		}

		return { school, castingTime, range, duration, components };
	}

	function showSpellDetails(spellData: any) {
		if (!spellData.spell) return;

		const { school, castingTime, range, duration, components } = getSpellMetadata(spellData.spell);

		selectedSpell = {
			name: spellData.spell.label || 'Unknown Spell',
			description: spellData.spell.description || 'No description available',
			level: spellData.level,
			school,
			castingTime,
			range,
			duration,
			components
		};

		dialogOpen = true;
	}

	// Update spell prepared/used status using Unix file operations
	async function updateSpellStatus(
		spellId: number,
		prepared: number | null = null,
		used: number | null = null
	) {
		if (!character?.id || !kernel) return;

		// Ensure /proc directory exists
		if (!kernel.exists('/v_proc')) {
			console.log('Creating /proc directory');
			const procResult = kernel.mkdir('/v_proc');
			if (!procResult.success) {
				console.error(
					`Failed to create /proc directory: ${procResult.errorMessage || 'Unknown error'}`
				);
				return;
			}
		}

		// Ensure /proc/character directory exists
		if (!kernel.exists('/v_proc/character')) {
			console.log('Creating /proc/character directory');
			const charDirResult = kernel.mkdir('/v_proc/character');
			if (!charDirResult.success) {
				console.error(
					`Failed to create /proc/character directory: ${charDirResult.errorMessage || 'Unknown error'}`
				);
				return;
			}
		}

		// Get the entity path
		const entityPath = `/v_proc/character/${character.id}`;

		if (!kernel.exists(entityPath)) {
			console.error(`Entity not found: ${entityPath}`);
			return;
		}

		// Open the entity file for reading and writing
		const fd = kernel.open(entityPath, OpenMode.READ_WRITE);

		if (fd < 0) {
			console.error(`Failed to open entity: ${entityPath}`);
			return;
		}

		try {
			// Read the entity
			const entityBuffer: Entity = { id: entityPath, properties: {}, capabilities: {} };
			const [readResult] = kernel.read(fd, entityBuffer);

			if (readResult !== 0) {
				console.error(`Failed to read entity: ${readResult}`);
				return;
			}

			// Update the spell's prepared/used count
			const spells = entityBuffer.capabilities?.spellcasting?.game_character_spell || [];
			const spellIndex = spells.findIndex((s: any) => s.id === spellId);

			if (spellIndex >= 0) {
				// Update prepared count if provided
				if (prepared !== null) {
					spells[spellIndex].prepared = prepared;
				}

				// Update used count if provided
				if (used !== null) {
					spells[spellIndex].used = used;
				}

				// Write the updated entity
				const writeResult = kernel.write(fd, entityBuffer);

				if (writeResult !== 0) {
					console.error(`Failed to write entity: ${writeResult}`);
					return;
				}

				// Update local state
				const spell = characterSpells.find((s) => s.id === spellId);
				if (spell) {
					if (prepared !== null) {
						spell.prepared = prepared;
					}
					if (used !== null) {
						spell.used = used;
					}

					// Force reactivity update
					characterSpells = [...characterSpells];

					// Update filtered spells
					updateFilteredSpells();
				}
			}
		} finally {
			// Always close the file
			kernel.close(fd);
		}
	}

	function getPreparedStatusLabel(spell: any): string {
		if (!spell.prepared && !spell.used) return 'Not Prepared';

		const preparedCount = spell.prepared || 0;
		const usedCount = spell.used || 0;
		const available = preparedCount - usedCount;

		if (available <= 0 && preparedCount > 0) return 'Cast';
		if (available > 0) return `Prepared (${available}/${preparedCount})`;
		return 'Not Prepared';
	}

	function getStatusVariant(spell: any): 'default' | 'secondary' | 'destructive' | 'outline' {
		if (!spell.prepared && !spell.used) return 'outline';

		const preparedCount = spell.prepared || 0;
		const usedCount = spell.used || 0;
		const available = preparedCount - usedCount;

		if (available <= 0 && preparedCount > 0) return 'destructive';
		if (available > 0) return 'default';
		return 'outline';
	}

	// Handle badge click to toggle spell prepared/cast status
	function handleSpellStatusClick(spell: any, event: MouseEvent) {
		event.stopPropagation();

		const preparedCount = spell.prepared || 0;
		const usedCount = spell.used || 0;

		if (preparedCount === 0) {
			// If not prepared, prepare it
			updateSpellStatus(spell.id, 1, 0);
		} else if (usedCount < preparedCount) {
			// If prepared but not fully cast, mark one as used
			updateSpellStatus(spell.id, null, usedCount + 1);
		} else {
			// If fully cast, reset to not prepared
			updateSpellStatus(spell.id, 0, 0);
		}
	}
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Spells</Card.Title>
		<Card.Description>
			{#if character?.game_character_class?.[0]?.class.name === 'alchemist'}
				Your prepared extracts
			{:else}
				Your character's known and prepared spells
			{/if}
		</Card.Description>
	</Card.Header>

	<Card.Content>
		{#if !character || !kernel}
			<div class="rounded-md border border-muted p-4">
				<p class="text-muted-foreground">Loading spells...</p>
			</div>
		{:else if characterSpells.length === 0}
			<div class="rounded-md border border-muted p-4">
				<p class="text-muted-foreground">
					No spells found. Add spells from the character edit page.
				</p>
			</div>
		{:else}
			<!-- Search and filter controls -->
			<div class="mb-4 space-y-3">
				<div class="relative">
					<Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Search spells..."
						class="w-full pl-8"
						bind:value={searchQuery}
					/>
				</div>

				<Tabs.Root bind:value={selectedSpellLevel} class="w-full">
					<Tabs.List class="flex w-full space-x-1 overflow-x-auto pb-1">
						<Tabs.Trigger value="all" class="px-3 py-1.5 text-sm">All</Tabs.Trigger>
						{#each Array.from(spellsByLevel.keys()).sort((a, b) => a - b) as level}
							<Tabs.Trigger value={level.toString()} class="px-3 py-1.5 text-sm">
								Level {level}
							</Tabs.Trigger>
						{/each}
					</Tabs.List>
				</Tabs.Root>
			</div>

			<ScrollArea class="h-[calc(100vh-30rem)] max-h-[600px] min-h-[300px] pr-4">
				{#if filteredSpells.length === 0}
					<div class="rounded-md border border-muted p-4 text-center">
						<p class="text-muted-foreground">No spells match your search.</p>
					</div>
				{:else}
					<div class="space-y-4">
						{#each filteredSpells as spellData}
							{#if spellData.spell}
								<button
									class="spell-item w-full rounded-lg border p-3 text-left hover:bg-muted/50"
									onclick={() => showSpellDetails(spellData)}
								>
									<div class="flex flex-col gap-2">
										<div class="flex items-center justify-between gap-2">
											<div class="flex items-center gap-2">
												<h4 class="text-sm font-semibold sm:text-base">
													{spellData.spell.label || 'Unknown Spell'}
												</h4>
												<Badge variant="secondary">Level {spellData.level}</Badge>
											</div>
											<Badge
												variant={getStatusVariant(spellData)}
												class="cursor-pointer"
												onclick={(e) => handleSpellStatusClick(spellData, e)}
											>
												{getPreparedStatusLabel(spellData)}
											</Badge>
										</div>

										{#if spellData.spell.description}
											<p class="line-clamp-2 text-sm text-muted-foreground">
												{spellData.spell.description}
											</p>
										{/if}

										<div class="mt-1 flex flex-wrap gap-1">
											{#if spellData.spell.spell_school_mapping?.[0]?.spell_school?.label}
												<Badge variant="outline" class="text-xs">
													{spellData.spell.spell_school_mapping[0].spell_school.label}
												</Badge>
											{/if}

											{#if spellData.spell.spell_component_mapping?.length}
												<Badge variant="outline" class="text-xs">
													Components:
													{spellData.spell.spell_component_mapping
														.map((mapping: any) => mapping?.spell_component?.type?.abbreviation)
														.filter(Boolean)
														.join(', ')}
												</Badge>
											{/if}
										</div>
									</div>
								</button>
							{/if}
						{/each}
					</div>
				{/if}
			</ScrollArea>
		{/if}
	</Card.Content>
</Card.Root>

<!-- Spell Details Dialog -->
<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Portal>
		<Dialog.Overlay class="animate-in fade-in-0" />
		<Dialog.Content
			class="fixed left-[50%] top-[50%] w-[95vw] max-w-lg translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-lg border bg-background shadow-lg"
		>
			{#if selectedSpell}
				<Dialog.Header class="border-b bg-background p-6">
					<Dialog.Title class="text-xl font-semibold leading-none">
						{selectedSpell.name}
					</Dialog.Title>
					<Dialog.Description>
						Level {selectedSpell.level}
						{selectedSpell.school}
					</Dialog.Description>
				</Dialog.Header>

				<div class="max-h-[60vh] overflow-y-auto p-6">
					<div class="prose prose-sm dark:prose-invert max-w-none">
						<!-- Spell metadata -->
						<div class="mb-4 grid grid-cols-2 gap-y-2 text-sm">
							<div><strong>Casting Time:</strong> {selectedSpell.castingTime}</div>
							<div><strong>Range:</strong> {selectedSpell.range}</div>
							<div><strong>Duration:</strong> {selectedSpell.duration}</div>
							<div>
								<strong>Components:</strong>
								{selectedSpell.components?.join(', ') || 'None'}
							</div>
						</div>

						<!-- Spell description -->
						<div class="mt-4">
							<p class="whitespace-pre-wrap">{selectedSpell.description}</p>
						</div>
					</div>
				</div>

				<div class="border-t bg-background p-4">
					<Dialog.Close
						class="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary font-medium text-primary-foreground hover:bg-primary/90"
					>
						Close
					</Dialog.Close>
				</div>
			{/if}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<style lang="postcss">
	.spell-item {
		transition: all 0.2s ease-in-out;

		&:hover {
			transform: translateY(-1px);
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		}
	}
</style>
