<!-- FILE: src/lib/ui/CharacterHeader.svelte -->
<script lang="ts">
	import { Card, CardHeader } from '$lib/components/ui/card';
	import type { AssembledCharacter } from '$lib/ui/types/CharacterTypes';

	// UI components
	import { Badge } from '$lib/components/ui/badge';
	import { Skeleton } from '$lib/components/ui/skeleton';

	/**
	 * Props:
	 * character: The AssembledCharacter object or null/undefined if loading.
	 */
	let { character } = $props<{
		character?: AssembledCharacter | null;
	}>();
</script>

<Card>
	<CardHeader class="pb-6">
		{#if character}
			<div class="space-y-1.5">
				<h1 class="text-3xl font-bold tracking-tight">
					{character.label ?? character.name}
				</h1>
				<div class="flex items-center space-x-2">
					{#if character.classes?.length}
						<Badge variant="secondary">
							Level {character.classes[0].level}
						</Badge>
					{/if}

					<span class="text-muted-foreground">
						{character.game_character_ancestry?.[0]?.ancestry?.label ?? '???'}
						{#if character.game_character_class?.length}
							{': '}
							{character.game_character_class
								.map((c: { class: { label: string } }) => {
									const archetype = character.game_character_archetype?.[0]?.archetype?.label;
									const className = c.class?.label ?? '???';
									return `${archetype ? `${archetype} ` : ''}${className}`;
								})
								.join(', ')}
						{/if}
					</span>
				</div>
			</div>
		{:else}
			<!-- Show skeleton if character is null (loading/fetching) -->
			<div class="space-y-1.5">
				<Skeleton class="h-8 w-[250px]" />
				<div class="flex items-center space-x-2">
					<Skeleton class="h-5 w-[100px]" />
					<Skeleton class="h-5 w-[200px]" />
				</div>
			</div>
		{/if}
	</CardHeader>
</Card>
