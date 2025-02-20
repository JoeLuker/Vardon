<script lang="ts">
	import type { EnrichedCharacter } from '$lib/domain/characterCalculations';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Search } from 'lucide-svelte';
	import { Input } from '$lib/components/ui/input';

	// Props
	let { character } = $props<{
		character?: EnrichedCharacter | null;
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

	// Access character spells safely
	let spellsByLevel = $state(new Map<number, any[]>());
	let filteredSpells = $state<any[]>([]);

	// Update data when character changes
	$effect(() => {
		if (!character) return;
		
		// Group spells by level
		const grouped = new Map<number, any[]>();
		if (character.game_character_spell) {
			for (const spellData of character.game_character_spell) {
				if (!grouped.has(spellData.level)) {
					grouped.set(spellData.level, []);
				}
				const spellsAtLevel = grouped.get(spellData.level);
				if (spellsAtLevel) {
					spellsAtLevel.push(spellData);
				}
			}
		}
		spellsByLevel = grouped;
		
		// Initialize filtered spells
		updateFilteredSpells();
	});

	// Update filtered spells when search or level selection changes
	$effect(() => {
		updateFilteredSpells();
	});

	function updateFilteredSpells() {
		if (!character?.game_character_spell) {
			filteredSpells = [];
			return;
		}
		
		let result = [...character.game_character_spell];
		
		// Filter by level if needed
		if (selectedSpellLevel !== 'all') {
			const level = parseInt(selectedSpellLevel);
			result = result.filter(spell => spell.level === level);
		}
		
		// Filter by search query if present
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase().trim();
			result = result.filter(spellData => 
				spellData.spell?.label?.toLowerCase().includes(query) ||
				spellData.spell?.description?.toLowerCase().includes(query)
			);
		}
		
		filteredSpells = result;
	}

	// Helper function to get spell metadata safely
	function getSpellMetadata(spell: any) {
		if (!spell) return {
			school: 'Unknown',
			castingTime: 'Standard Action',
			range: 'Self',
			duration: 'Instantaneous',
			components: []
		};
		
		// Extract metadata from spell mappings safely
		const school = spell?.spell_school_mapping?.[0]?.spell_school?.label || 'Unknown School';
		const castingTime = spell?.spell_casting_time_mapping?.[0]?.spell_casting_time?.label || 'Standard Action';
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

	function getPreparedStatusLabel(spell: any): string {
		if (!spell.prepared && !spell.used) return 'Not Prepared';
		
		const preparedCount = spell.prepared || 0;
		const usedCount = spell.used || 0;
		const available = preparedCount - usedCount;
		
		if (available <= 0 && preparedCount > 0) return 'Cast';
		if (available > 0) return `Prepared (${available}/${preparedCount})`;
		return 'Not Prepared';
	}

	function getStatusVariant(spell: any): "default" | "secondary" | "destructive" | "outline" {
		if (!spell.prepared && !spell.used) return 'outline';
		
		const preparedCount = spell.prepared || 0;
		const usedCount = spell.used || 0;
		const available = preparedCount - usedCount;
		
		if (available <= 0 && preparedCount > 0) return 'destructive';
		if (available > 0) return 'default';
		return 'outline';
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
		{#if !character}
			<div class="rounded-md border border-muted p-4">
				<p class="text-muted-foreground">Loading spells...</p>
			</div>
		{:else if !character.game_character_spell || character.game_character_spell.length === 0}
			<div class="rounded-md border border-muted p-4">
				<p class="text-muted-foreground">No spells found. Add spells from the character edit page.</p>
			</div>
		{:else}
			<!-- Search and filter controls -->
			<div class="mb-4 space-y-3">
				<div class="relative">
					<Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Search spells..."
						class="pl-8 w-full"
						bind:value={searchQuery}
					/>
				</div>
				
				<Tabs.Root bind:value={selectedSpellLevel} class="w-full">
					<Tabs.List class="w-full overflow-x-auto flex space-x-1 pb-1">
						<Tabs.Trigger value="all" class="px-3 py-1.5 text-sm">All</Tabs.Trigger>
						{#each Array.from(spellsByLevel.keys()).sort((a, b) => a - b) as level}
							<Tabs.Trigger value={level.toString()} class="px-3 py-1.5 text-sm">
								Level {level}
							</Tabs.Trigger>
						{/each}
					</Tabs.List>
				</Tabs.Root>
			</div>
			
			<ScrollArea class="h-[calc(100vh-30rem)] min-h-[300px] max-h-[600px] pr-4">
				{#if filteredSpells.length === 0}
					<div class="rounded-md border border-muted p-4 text-center">
						<p class="text-muted-foreground">No spells match your search.</p>
					</div>
				{:else}
					<div class="space-y-4">
						{#each filteredSpells as spellData}
							{#if spellData.spell}
								<button 
									class="spell-item w-full text-left hover:bg-muted/50 p-3 rounded-lg border"
									onclick={() => showSpellDetails(spellData)}
								>
									<div class="flex flex-col gap-2">
										<div class="flex items-center justify-between gap-2">
											<div class="flex items-center gap-2">
												<h4 class="text-sm sm:text-base font-semibold">
													{spellData.spell.label || 'Unknown Spell'}
												</h4>
												<Badge variant="secondary">Level {spellData.level}</Badge>
											</div>
											<Badge variant={getStatusVariant(spellData)}>
												{getPreparedStatusLabel(spellData)}
											</Badge>
										</div>
										
										{#if spellData.spell.description}
											<p class="text-sm text-muted-foreground line-clamp-2">
												{spellData.spell.description}
											</p>
										{/if}
										
										<div class="flex flex-wrap gap-1 mt-1">
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
			class="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[95vw] max-w-lg rounded-lg border bg-background shadow-lg overflow-hidden"
		>
			{#if selectedSpell}
				<Dialog.Header class="border-b bg-background p-6">
					<Dialog.Title class="text-xl font-semibold leading-none">
						{selectedSpell.name}
					</Dialog.Title>
					<Dialog.Description>
						Level {selectedSpell.level} {selectedSpell.school}
					</Dialog.Description>
				</Dialog.Header>

				<div class="p-6 overflow-y-auto max-h-[60vh]">
					<div class="prose prose-sm dark:prose-invert max-w-none">
						<!-- Spell metadata -->
						<div class="mb-4 grid grid-cols-2 gap-y-2 text-sm">
							<div><strong>Casting Time:</strong> {selectedSpell.castingTime}</div>
							<div><strong>Range:</strong> {selectedSpell.range}</div>
							<div><strong>Duration:</strong> {selectedSpell.duration}</div>
							<div>
								<strong>Components:</strong> {selectedSpell.components?.join(', ') || 'None'}
							</div>
						</div>
						
						<!-- Spell description -->
						<div class="mt-4">
							<p class="whitespace-pre-wrap">{selectedSpell.description}</p>
						</div>
					</div>
				</div>

				<div class="border-t bg-background p-4">
					<Dialog.Close class="w-full h-10 inline-flex items-center justify-center rounded-md bg-primary font-medium text-primary-foreground hover:bg-primary/90">
						Close
					</Dialog.Close>
				</div>
			{/if}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>