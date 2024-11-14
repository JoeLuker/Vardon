<script lang="ts">
	import CharacterHeader from '$lib/components/CharacterHeader.svelte';
	import HPTracker from '$lib/components/HPTracker.svelte';
	import Stats from '$lib/components/Stats.svelte';
	import Skills from '$lib/components/Skills.svelte';
	import CombatStats from '$lib/components/CombatStats.svelte';
	import Consumables from '$lib/components/Consumables.svelte';
	import BuffManager from '$lib/components/BuffManager.svelte';
	import SpellManager from '$lib/components/SpellManager.svelte';
	import ClassFeatures from '$lib/components/ClassFeatures.svelte';
	import Discoveries from '$lib/components/Discoveries.svelte';
	import Feats from '$lib/components/Feats.svelte';
	import ABPDisplay from '$lib/components/ABPDisplay.svelte';
	import { initializeCharacter } from '$lib/state/character.svelte';
	import type { Character } from '$lib/types/character';

	let { data } = $props<{ data: { character: Character } }>();

	// Initialize character state with error handling
	try {
		initializeCharacter(data.character);
	} catch (error) {
		console.error('Failed to initialize character:', error);
		// You could also use your ErrorBoundary component here
	}
</script>

<div class="mx-auto max-w-2xl space-y-4 p-4 sm:p-6 md:p-8">
	<div class="grid gap-4 sm:gap-6 md:gap-8">
		<div class="grid gap-4">
			<CharacterHeader />
			<ABPDisplay />
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div class="order-1 md:order-none">
					<HPTracker />
				</div>
				<div class="order-2 md:order-none">
					<CombatStats />
				</div>
			</div>
			<Stats />
			<Skills />
			<BuffManager />
			<Consumables />
			<SpellManager />
			<ClassFeatures />
			<Discoveries />
			<Feats />
		</div>
	</div>
</div>