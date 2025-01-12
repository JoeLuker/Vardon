<script lang="ts">
	/**
	 * Props:
	 *  - character: an EnrichedCharacter or null
	 *  - onSelectValue: callback for clicking an AC breakdown
	 */
	import type { EnrichedCharacter, ValueWithBreakdown } from '$lib/domain/characterCalculations';

	let { character, onSelectValue = () => {} } = $props<{
		character?: EnrichedCharacter | null;
		onSelectValue?: (val: ValueWithBreakdown) => void;
	}>();

	/**
	 * Optional helper to format a numeric modifier with + or - sign.
	 * Not strictly necessary here, but can be handy if we want to
	 * show something like '+12' or '-1' somewhere in the future.
	 */
	function formatModifier(mod: number): string {
		return mod >= 0 ? `+${mod}` : `${mod}`;
	}
</script>

<!-- Example styling borrowed from your existing components -->
<div class="space-y-2 w-full">
	<!-- Normal AC -->
	<button
		type="button"
		class="flex w-full justify-between items-center p-2 rounded-md hover:bg-accent transition"
		onclick={() => {
			if (character?.ac) onSelectValue(character.ac);
		}}
	>
		<div class="font-semibold">AC</div>
		<div>{formatModifier(character?.ac?.total ?? 10)}</div>
	</button>

	<!-- Touch AC -->
	<button
		type="button"
		class="flex w-full justify-between items-center p-2 rounded-md hover:bg-accent transition"
		onclick={() => {
			if (character?.touch_ac) onSelectValue(character.touch_ac);
		}}
	>
		<div class="font-semibold">Touch AC</div>
		<div>{formatModifier(character?.touch_ac?.total ?? 10)  }</div>
	</button>

	<!-- Flat-Footed AC -->
	<button
		type="button"
		class="flex w-full justify-between items-center p-2 rounded-md hover:bg-accent transition"
		onclick={() => {
			if (character?.flat_footed_ac) onSelectValue(character.flat_footed_ac);
		}}
	>
		<div class="font-semibold">Flat-Footed AC</div>
		<div>{formatModifier(character?.flat_footed_ac?.total ?? 10)}</div>
	</button>
</div>
