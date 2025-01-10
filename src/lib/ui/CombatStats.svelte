<script lang="ts">
	import { characterStore } from '$lib/state/characterStore';
	import * as Card from '$lib/components/ui/card';
	import { Sword, Target, Bomb } from 'lucide-svelte';
	import type { ValueWithBreakdown } from '$lib/domain/characterCalculations';

	// Format modifier to always show + or -
	function formatModifier(mod: number): string {
		return mod >= 0 ? `+${mod}` : `${mod}`;
	}

	// Get the total level for bomb damage calculation using $derived
	let totalLevel = $derived(
		$characterStore?.classes.reduce((acc, c) => acc + (c.level || 1), 0) ?? 0
	);

	// Props using new $props rune
	let { onSelectValue = () => {} } = $props<{
		onSelectValue?: (breakdown: ValueWithBreakdown) => void;
	}>();
</script>

<Card.Root class="w-full">
	<Card.Content class="grid gap-4">
		<!-- Melee Attack -->
		<button
			class="grid w-full grid-cols-2 gap-4 rounded-md p-2 transition-colors hover:bg-accent"
			onclick={() => onSelectValue($characterStore?.attacks.melee)}
		>
			<div class="flex items-center gap-2">
				<Sword class="h-4 w-4" />
				<span class="font-semibold">Melee Attack</span>
			</div>
			<div class="text-right">
				{formatModifier($characterStore?.attacks.melee.total ?? 0)}
			</div>
		</button>

		<!-- Ranged Attack -->
		<button
			class="grid w-full grid-cols-2 gap-4 rounded-md p-2 transition-colors hover:bg-accent"
			onclick={() => onSelectValue($characterStore?.attacks.ranged)}
		>
			<div class="flex items-center gap-2">
				<Target class="h-4 w-4" />
				<span class="font-semibold">Ranged Attack</span>
			</div>
			<div class="text-right">
				{formatModifier($characterStore?.attacks.ranged.total ?? 0)}
			</div>
		</button>

		<!-- Bomb Attack -->
		<button
			class="grid w-full grid-cols-2 gap-4 rounded-md p-2 transition-colors hover:bg-accent"
			onclick={() => onSelectValue($characterStore?.attacks.bomb.attack)}
		>
			<div class="flex items-center gap-2">
				<Bomb class="h-4 w-4" />
				<span class="font-semibold">Bomb Attack</span>
			</div>
			<div class="text-right">
				{formatModifier($characterStore?.attacks.bomb.attack.total ?? 0)}
			</div>
		</button>

		<!-- Bomb Damage -->
		<button
			class="grid w-full grid-cols-2 gap-4 rounded-md p-2 pl-6 transition-colors hover:bg-accent"
			onclick={() => onSelectValue($characterStore?.attacks.bomb.damage)}
		>
			<div class="flex items-center gap-2">
				<span class="font-semibold">Bomb Damage</span>
			</div>
			<div class="text-right">
				{Math.floor((totalLevel + 1) / 2)}d6 {formatModifier(
					$characterStore?.attacks.bomb.damage.total ?? 0
				)}
			</div>
		</button>
	</Card.Content>
</Card.Root>
