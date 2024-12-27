<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Character } from '$lib/domain/types/character';

	let { characters } = $props<{
		characters: Pick<Character, 'id' | 'name' | 'class' | 'ancestry' | 'level'>[];
	}>();

	function handleCharacterSelect(id: number) {
		goto(`/character/${id}`);
	}
</script>

<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
	{#each characters as character (character.id)}
		<button
			class="card p-6 text-left transition-colors hover:bg-gray-50"
			onclick={() => handleCharacterSelect(character.id)}
		>
			<h2 class="mb-2 text-xl font-bold text-primary">{character.name}</h2>
			<div class="text-gray-600">
				<div>Level {character.level}</div>
				<div>{character.ancestry} {character.class}</div>
			</div>
		</button>
	{/each}

	<a
		href="/character/new"
		class="card flex flex-col items-center justify-center gap-2 p-6 text-center transition-colors hover:bg-gray-50"
	>
		<div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
			<span class="text-2xl text-primary">+</span>
		</div>
		<span class="font-medium text-primary">Create New Character</span>
	</a>
</div>
