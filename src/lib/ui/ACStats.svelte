<script lang="ts">
	/**
	 * Props:
	 *  - character: an EnrichedCharacter or null
	 *  - onSelectValue: callback for clicking an AC breakdown
	 */
	import type { EnrichedCharacter } from '$lib/domain/characterCalculations';
	import { Shield } from 'lucide-svelte';

	export let character: EnrichedCharacter | undefined = undefined;
	export let onSelectValue: (value: { label: string; modifiers: Array<{ source: string; value: number }>; total: number }) => void;

	// Helper function to format numbers with sign
	const formatModifier = (num: number) => (num >= 0 ? `+${num}` : `${num}`);
</script>

<!-- Example styling borrowed from your existing components -->
<div class="space-y-2 w-full">
	<!-- Initiative -->
	<button
		type="button"
		class="flex w-full justify-between items-center p-2 rounded-md hover:bg-accent transition bg-accent/20 border border-accent/40"
		onclick={() => {
			if (character?.initiative) onSelectValue(character.initiative);
		}}
	>
		<div class="font-bold">Initiative</div>
		<div>{character?.initiative ? formatModifier(character.initiative.total) : '+0'}</div>
	</button>

	<!-- AC Layout -->
	<div class="flex justify-center items-end relative h-24">
		<!-- Normal AC -->
		<button
			type="button"
			class="absolute z-20 hover:bg-accent/10 rounded-full transition"
			onclick={() => {
				if (character?.ac) onSelectValue(character.ac);
			}}
		>
			<div class="relative w-20 h-20">
				<Shield class="w-full h-full" />
				<div class="absolute inset-0 flex items-center justify-center font-bold text-xl">
					{character?.ac?.total ?? 10}
				</div>
			</div>
		</button>

		<!-- Touch AC -->
		<button
			type="button"
			class="absolute left-12 bottom-0 z-10 hover:bg-accent/10 rounded-full transition"
			onclick={() => {
				if (character?.touch_ac) onSelectValue(character.touch_ac);
			}}
		>
			<div class="flex flex-col items-center">
				<div class="text-xs font-medium text-blue-400 mb-1">Touch</div>
				<div class="relative w-10 h-10">
					<Shield class="w-full h-full text-blue-400" />
					<div class="absolute inset-0 flex items-center justify-center font-bold text-sm">
						{character?.touch_ac?.total ?? 10}
					</div>
				</div>
			</div>
		</button>

		<!-- Flat-Footed AC -->
		<button
			type="button"
			class="absolute right-12 bottom-0 z-10 hover:bg-accent/10 rounded-full transition"
			onclick={() => {
				if (character?.flat_footed_ac) onSelectValue(character.flat_footed_ac);
			}}
		>
			<div class="flex flex-col items-center">
				<div class="text-xs font-medium text-amber-400 mb-1">Flat-Footed</div>
				<div class="relative w-10 h-10">
					<Shield class="w-full h-full text-amber-400" />
					<div class="absolute inset-0 flex items-center justify-center font-bold text-sm">
						{character?.flat_footed_ac?.total ?? 10}
					</div>
				</div>
			</div>
		</button>
	</div>

	<!-- Combat Maneuvers Row -->
	<div class="grid grid-cols-2 gap-2">
		<!-- CMB -->
		<button
			type="button"
			class="flex justify-between items-center p-2 rounded-md hover:bg-accent transition"
			onclick={() => {
				if (character?.cmb) onSelectValue(character.cmb);
			}}
		>
			<div class="font-semibold">CMB</div>
			<div>{character?.cmb ? formatModifier(character.cmb.total) : '+0'}</div>
		</button>

		<!-- CMD -->
		<button
			type="button"
			class="flex justify-between items-center p-2 rounded-md hover:bg-accent transition"
			onclick={() => {
				if (character?.cmd) onSelectValue(character.cmd);
			}}
		>
			<div class="font-semibold">CMD</div>
			<div>{character?.cmd?.total ?? 10}</div>
		</button>
	</div>
</div>
