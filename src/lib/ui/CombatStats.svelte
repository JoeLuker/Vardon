<!-- FILE: src/lib/ui/CombatStats.svelte (or whatever you call it) -->
<script lang="ts">
	// UI imports
	import * as Card from '$lib/components/ui/card';
	import { Sword, Target, Bomb } from 'lucide-svelte';

	// Domain
	import type { ValueWithBreakdown } from '$lib/domain/characterCalculations';
	import type { EnrichedCharacter } from '$lib/domain/characterCalculations';

	/**
	 * Props:
	 *  - character: a plain EnrichedCharacter or null
	 *  - onSelectValue: callback for clicking an attack or damage breakdown
	 */
	let { character, onSelectValue = () => {} } = $props<{
		character?: EnrichedCharacter | null;
		onSelectValue?: (val: ValueWithBreakdown) => void;
	}>();

	// A helper to format a numeric modifier with + or - sign
	function formatModifier(mod: number): string {
		return mod >= 0 ? `+${mod}` : `${mod}`;
	}

	/**
	 * totalLevel as a runes-based derived variable
	 * If there's no character or classes, default to 0.
	 */
	let totalLevel = $derived.by(() => {
		if (!character?.classes) return 0;
		return character.classes.reduce((acc: number, cls: { level?: number }) => 
			acc + (cls.level || 1), 0);
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
				{Math.floor((totalLevel + 1) / 2)}d6{" "}
				{formatModifier(character?.attacks.bomb.damage.total ?? 0)}
			</div>
		</button>
	</Card.Content>
</Card.Root>
