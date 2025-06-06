<!-- 
	ABPDisplay Component - Uses Domain Layer
	All ABP calculations are handled by the domain ABPService
-->
<script lang="ts">
	import type { GameKernel } from '$lib/domain/kernel/GameKernel';
	import type { Entity } from '$lib/domain/kernel/types';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Sparkles } from 'lucide-svelte';
	import { ABPService } from '$lib/domain/services/ABPService';
	import type { ABPData, ABPBonus, ABPNode } from '$lib/domain/services/ABPService';

	/**
	 * Props:
	 * - character: Character entity
	 * - kernel: GameKernel instance
	 */
	let {
		character = null,
		kernel = null
	} = $props<{
		character: Entity | null;
		kernel: GameKernel | null;
	}>();

	// Local state
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let abpData = $state<ABPData | null>(null);
	let groupedBonuses = $state<Map<string, ABPBonus[]>>(new Map());

	// Domain service
	let abpService: ABPService | null = null;

	// Load ABP data when component mounts
	$effect(() => {
		if (kernel && character) {
			loadABPData();
		}
	});

	/**
	 * Load ABP data using domain service
	 */
	async function loadABPData() {
		isLoading = true;
		error = null;

		try {
			// Initialize service if needed
			if (!abpService) {
				abpService = new ABPService();
			}

			// Character is passed directly as AssembledCharacter, not wrapped in Entity
			const characterData = character;
			if (!characterData) {
				throw new Error('Character data not available');
			}

			// Get ABP data from service
			const data = abpService.getABPData(characterData);
			abpData = data;

			// Group bonuses by type
			groupedBonuses = abpService.groupBonusesByType(data.appliedBonuses);

			isLoading = false;
		} catch (err) {
			error = `Failed to load ABP data: ${err instanceof Error ? err.message : String(err)}`;
			isLoading = false;
		}
	}

	// Format bonus value with sign
	function formatBonus(value: number): string {
		return value >= 0 ? `+${value}` : `${value}`;
	}

	// Get badge variant based on bonus type
	function getBadgeVariant(type: string): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (type.toLowerCase()) {
			case 'enhancement':
				return 'default';
			case 'resistance':
				return 'secondary';
			case 'deflection':
				return 'outline';
			default:
				return 'default';
		}
	}
</script>

<Card>
	<CardHeader>
		<CardTitle class="flex items-center gap-2">
			<Sparkles class="h-5 w-5" />
			Automatic Bonus Progression
		</CardTitle>
	</CardHeader>
	<CardContent>
		{#if isLoading}
			<div class="flex items-center justify-center space-x-2 p-4 text-primary/70">
				<div class="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary"></div>
				<p>Loading ABP data...</p>
			</div>
		{:else if error}
			<div class="space-y-6 border-destructive">
				<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
					{error}
				</div>
				<button class="text-sm text-primary hover:underline" onclick={loadABPData}>
					Retry
				</button>
			</div>
		{:else if !abpData || abpData.nodes.length === 0}
			<p class="text-sm text-muted-foreground">
				No ABP bonuses active yet. ABP bonuses begin at level 3.
			</p>
		{:else}
			<!-- Active Nodes -->
			<div class="space-y-4">
				<div>
					<h4 class="mb-2 text-sm font-semibold">Active Progressions</h4>
					<div class="flex flex-wrap gap-2">
						{#each abpData.nodes as node}
							<Badge variant="outline" class="text-xs">
								{node.label || node.name}
							</Badge>
						{/each}
					</div>
				</div>

				<!-- Bonuses by Type -->
				{#if groupedBonuses.size > 0}
					<div>
						<h4 class="mb-2 text-sm font-semibold">Applied Bonuses</h4>
						<div class="space-y-2">
							{#each [...groupedBonuses.entries()] as [type, bonuses]}
								<div class="flex items-center justify-between text-sm">
									<span class="capitalize">{type} Bonuses:</span>
									<div class="flex gap-2">
										{#each bonuses as bonus}
											<Badge variant={getBadgeVariant(type)}>
												{bonus.target}: {formatBonus(bonus.value)}
												{#if bonus.source}
													<span class="ml-1 text-xs opacity-75">({bonus.source})</span>
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
				{#if abpData}
					<div class="border-t pt-2 text-xs text-muted-foreground">
						<p>Character Level: {abpData.currentLevel}</p>
						{#if character?.game_character_class?.length}
							<p class="text-xs">
								Classes: {character.game_character_class
									.map((c) => `${c.class?.name || 'Unknown'} ${c.level}`)
									.join(', ')}
							</p>
						{/if}
						{#if abpData.currentLevel < 3}
							<p>ABP bonuses begin at level 3</p>
						{:else if abpData.currentLevel < 19}
							<p>Next ABP bonus at level {abpData.nextLevel}</p>
						{:else}
							<p>Maximum ABP progression reached!</p>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</CardContent>
</Card>
