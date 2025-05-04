<!-- FILE: src/lib/ui/CombatStats.svelte (or whatever you call it) -->
<script lang="ts">
	// UI imports
	import * as Card from '$lib/components/ui/card';
	import { Sword, Target, Bomb } from 'lucide-svelte';

	// Domain
	import type { ValueWithBreakdown, AssembledCharacter } from '$lib/ui/types/CharacterTypes';
	import type { GameRules } from '$lib/db/gameRules.api';
	// Use the type from the GameRules namespace
	type ClassFeature = GameRules.Base.Row<'class_feature'>;

	/**
	 * Props:
	 *  - character: a plain AssembledCharacter or null
	 *  - onSelectValue: callback for clicking an attack or damage breakdown
	 */
	let { character, onSelectValue = () => {} } = $props<{
		character?: AssembledCharacter | null;
		onSelectValue?: (val: ValueWithBreakdown) => void;
	}>();

	// A helper to format a numeric modifier with + or - sign
	function formatModifier(mod: number): string {
		return mod >= 0 ? `+${mod}` : `${mod}`;
	}

	// Check if character has the bomb class feature
	let hasBombFeature = $derived.by(() => {
		return character?.processedClassFeatures?.some(
			(feature: ClassFeature) => feature.name === 'bomb'
		) ?? false;
	});
</script>

<Card.Root class="w-full">
	<Card.Content class="grid gap-4">
		<!-- Melee Attack -->
		<button
			class="grid w-full grid-cols-2 gap-4 rounded-md p-2 transition-colors hover:bg-accent"
			onclick={() => {
				onSelectValue?.(character?.attacks.melee);
			}}
		>
			<div class="flex items-center gap-2">
				<Sword class="h-4 w-4" />
				<span class="font-semibold">Melee Attack</span>
			</div>
			<div class="text-right">
				{formatModifier(character?.attacks.melee.total ?? 0)}
			</div>
		</button>

		<!-- Ranged Attack -->
		<button
			class="grid w-full grid-cols-2 gap-4 rounded-md p-2 transition-colors hover:bg-accent"
			onclick={() => {
				onSelectValue?.(character?.attacks.ranged);
			}}
		>
			<div class="flex items-center gap-2">
				<Target class="h-4 w-4" />
				<span class="font-semibold">Ranged Attack</span>
			</div>
			<div class="text-right">
				{formatModifier(character?.attacks.ranged.total ?? 0)}
			</div>
		</button>

		{#if hasBombFeature}
			<!-- Bomb Attack -->
			<button
				class="grid w-full grid-cols-2 gap-4 rounded-md p-2 transition-colors hover:bg-accent"
				onclick={() => {
					onSelectValue?.(character?.attacks.bomb.attack);
				}}
			>
				<div class="flex items-center gap-2">
					<Bomb class="h-4 w-4" />
					<span class="font-semibold">Bomb Attack</span>
				</div>
				<div class="text-right">
					{formatModifier(character?.attacks.bomb.attack.total ?? 0)}
				</div>
			</button>

			<!-- Bomb Damage -->
			<button
				class="grid w-full grid-cols-2 gap-4 rounded-md p-2 pl-6 transition-colors hover:bg-accent"
				onclick={() => {
					onSelectValue?.(character?.attacks.bomb.damage);
				}}
			>
				<div class="flex items-center gap-2">
					<span class="font-semibold">Bomb Damage</span>
				</div>
				<div class="text-right">
					{character?.attacks.bomb.bombDice}d6{" "}
					{formatModifier(character?.attacks.bomb.damage.total ?? 0)}
				</div>
			</button>
		{/if}
	</Card.Content>
</Card.Root>
