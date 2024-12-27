<script lang="ts">
	import { getCharacter } from '$lib/state/character.svelte';

	let { characterId } = $props<{
		characterId: number;
	}>();

	let character = $derived(getCharacter(characterId));
	let name = $derived(character.name);
	let ancestry = $derived(character.ancestry);
	let characterClass = $derived(character.class);
	let level = $derived(character.level);
</script>

<div class="card animate-fade-in">
	<div class="flex items-start justify-between">
		<div class="space-y-2">
			<h1 class="text-3xl font-bold text-primary">{name}</h1>
			<div class="text-ink-light flex items-center gap-3">
				<span class="badge">Level {level}</span>
				<span class="text-sm">
					{ancestry}
					{characterClass}
				</span>
			</div>
		</div>

		<div class="flex flex-col items-end gap-2">
			<a href={'/admin/' + characterId} class="text-sm text-blue-600 underline"> Admin </a>
			<div class="rounded-full bg-primary/10 p-2">
				<div class="h-12 w-12 rounded-full bg-primary/20"></div>
			</div>
		</div>
	</div>
</div>
