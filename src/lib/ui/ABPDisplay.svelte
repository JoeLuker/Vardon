<!-- FILE: src/lib/ui/ABPDisplay.svelte -->
<script lang="ts">
	import type { AssembledCharacter } from './types/CharacterTypes';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Sparkles } from 'lucide-svelte';
	import { logger } from '$lib/utils/Logger';

	interface Props {
		character: AssembledCharacter;
	}

	let { character }: Props = $props();

	// Group ABP bonuses by type for display
	let groupedBonuses = $derived(() => {
		if (!character?.abpData?.appliedBonuses) {
			return new Map<string, typeof character.abpData.appliedBonuses>();
		}

		const groups = new Map<string, typeof character.abpData.appliedBonuses>();
		
		for (const bonus of character.abpData.appliedBonuses) {
			const type = bonus.type || 'untyped';
			if (!groups.has(type)) {
				groups.set(type, []);
			}
			groups.get(type)!.push(bonus);
		}
		
		return groups;
	});

	// Get active ABP nodes (choices the character has made)
	let activeNodes = $derived(() => {
		if (!character?.abpData?.nodes) {
			return [];
		}
		return character.abpData.nodes;
	});

	// Format bonus value with sign
	function formatBonus(value: number): string {
		return value >= 0 ? `+${value}` : `${value}`;
	}

	// Get badge variant based on bonus type
	function getBadgeVariant(type: string): "default" | "secondary" | "destructive" | "outline" {
		switch (type.toLowerCase()) {
			case 'enhancement': return 'default';
			case 'resistance': return 'secondary';
			case 'deflection': return 'outline';
			default: return 'default';
		}
	}

	$effect(() => {
		if (character?.abpData) {
			logger.debug('ABPDisplay', 'render', 'ABP data loaded', {
				nodeCount: character.abpData.nodes?.length || 0,
				bonusCount: character.abpData.appliedBonuses?.length || 0
			});
		}
	});
</script>

<Card>
	<CardHeader>
		<CardTitle class="flex items-center gap-2">
			<Sparkles class="h-5 w-5" />
			Automatic Bonus Progression
		</CardTitle>
	</CardHeader>
	<CardContent>
		{#if activeNodes.length === 0}
			<p class="text-sm text-muted-foreground">
				No ABP bonuses active yet. ABP bonuses begin at level 3.
			</p>
		{:else}
			<!-- Active Nodes -->
			<div class="space-y-4">
				<div>
					<h4 class="text-sm font-semibold mb-2">Active Progressions</h4>
					<div class="flex flex-wrap gap-2">
						{#each activeNodes as node}
							<Badge variant="outline" class="text-xs">
								{node.label || node.name}
							</Badge>
						{/each}
					</div>
				</div>

				<!-- Bonuses by Type -->
				{#if groupedBonuses().size > 0}
					<div>
						<h4 class="text-sm font-semibold mb-2">Applied Bonuses</h4>
						<div class="space-y-2">
							{#each [...groupedBonuses().entries()] as [type, bonuses]}
								<div class="flex items-center justify-between text-sm">
									<span class="capitalize">{type} Bonuses:</span>
									<div class="flex gap-2">
										{#each bonuses as bonus}
											<Badge variant={getBadgeVariant(type)}>
												{bonus.target}: {formatBonus(bonus.value)}
												{#if bonus.source}
													<span class="text-xs opacity-75 ml-1">({bonus.source})</span>
												{/if}
											</Badge>
										{/each}
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Level-based Summary -->
				<div class="text-xs text-muted-foreground border-t pt-2">
					<p>Character Level: {character.level || 1}</p>
					{#if character.level < 3}
						<p>ABP bonuses begin at level 3</p>
					{:else if character.level < 19}
						<p>Next ABP bonus at level {getNextABPLevel(character.level)}</p>
					{:else}
						<p>Maximum ABP progression reached!</p>
					{/if}
				</div>
			</div>
		{/if}
	</CardContent>
</Card>

<script context="module" lang="ts">
	function getNextABPLevel(currentLevel: number): number {
		const abpLevels = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 18, 19];
		const nextLevel = abpLevels.find(l => l > currentLevel);
		return nextLevel || 20;
	}
</script>