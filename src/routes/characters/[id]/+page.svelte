<!-- FILE: src/routes/characters/[id]/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import {
		characterStore,
		loadCharacter,
		initCharacterWatchers,
		cleanupCharacterWatchers
	} from '$lib/state/characterStore';
	import type { PageData } from './$types';

	// Child components
	import CharacterHeader from '$lib/ui/CharacterHeader.svelte';
	import HPTracker from '$lib/ui/HPTracker.svelte';
	import Attributes from '$lib/ui/Attributes.svelte';
	import Skills from '$lib/ui/Skills.svelte';
	import Saves from '$lib/ui/Saves.svelte';
	import CombatStats from '$lib/ui/CombatStats.svelte';
	// UI components
	import * as Sheet from '$lib/components/ui/sheet';
	import type { ValueWithBreakdown } from '$lib/domain/characterCalculations';
	import * as Tabs from '$lib/components/ui/tabs';

	// Props using new $props rune
	let { data } = $props<{ data: PageData }>();

	// State using new $state rune
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let selectedStatBreakdown = $state<ValueWithBreakdown | null>(null);
	let breakdownSheetOpen = $state(false);

	// Initialize watchers once on mount
	onMount(() => {
		initCharacterWatchers();
		return () => cleanupCharacterWatchers();
	});

	// Watch for changes to data.id and reload character
	$effect(() => {
		isLoading = true;
		error = null;

		loadCharacter(data.id)
			.then(() => {
				isLoading = false;
				console.log(JSON.stringify($characterStore, null, 2));
			})
			.catch((err) => {
				console.error('Failed to load character:', err);
				error = 'Failed to load character data';
				isLoading = false;
			});
	});

	// Handler for opening breakdown sheet
	function handleSelectValue(breakdown: ValueWithBreakdown) {
		selectedStatBreakdown = breakdown;
		breakdownSheetOpen = true;
	}
</script>

{#if isLoading}
	<div class="flex min-h-[200px] items-center justify-center">
		<div
			class="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent"
		></div>
	</div>
{:else if error}
	<div class="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
		{error}
	</div>
{:else if $characterStore === null}
	<div class="rounded-md border border-muted p-4">
		<p class="text-muted-foreground">No character data found</p>
	</div>
{:else}
	<div class="space-y-2">
		<CharacterHeader />
		<Tabs.Root value="attributes" class="w-full">
			<Tabs.List class="grid w-full grid-cols-3">
				<Tabs.Trigger value="attributes">Attributes</Tabs.Trigger>
				<Tabs.Trigger value="skills">Skills</Tabs.Trigger>
				<Tabs.Trigger value="combat">Combat</Tabs.Trigger>
			</Tabs.List>

			<Tabs.Content value="attributes">
				<div class="rounded-lg bg-secondary p-6">
					<Attributes onSelectValue={handleSelectValue} />
				</div>
			</Tabs.Content>

			<Tabs.Content value="saves">
				<div class="rounded-lg bg-secondary p-6"></div>
			</Tabs.Content>

			<Tabs.Content value="skills">
				<div class="rounded-lg bg-secondary p-6">
					<Skills onSelectValue={handleSelectValue} />
				</div>
			</Tabs.Content>

			<Tabs.Content value="combat">
				<div class="space-y-6 rounded-lg bg-secondary p-6">
					<HPTracker />
					<Saves onSelectValue={handleSelectValue} />
					<CombatStats onSelectValue={handleSelectValue} />
				</div>
			</Tabs.Content>
		</Tabs.Root>
	</div>

	<Sheet.Root bind:open={breakdownSheetOpen}>
		<Sheet.Content side="bottom">
			{#if selectedStatBreakdown}
				<Sheet.Header>
					<Sheet.Title>{selectedStatBreakdown.label} Breakdown</Sheet.Title>
					<Sheet.Description>
						A detailed breakdown of how {selectedStatBreakdown.label} is calculated.
					</Sheet.Description>
				</Sheet.Header>
				<div class="space-y-3 p-4">
					<ul class="space-y-1 text-sm">
						{#each selectedStatBreakdown.modifiers as m}
							<li>
								<span class="font-medium">
									{m.source}:
								</span>
								<span>
									{m.value >= 0 ? '+' : ''}{m.value}
								</span>
							</li>
						{/each}
					</ul>

					<p class="text-lg font-semibold">
						Total: {selectedStatBreakdown.total >= 0 ? '+' : ''}{selectedStatBreakdown.total}
					</p>
				</div>
			{/if}
		</Sheet.Content>
	</Sheet.Root>
{/if}
