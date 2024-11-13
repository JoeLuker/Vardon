<script lang="ts">
	let { name, race, characterClass, level } = $props<{
		name: string;
		race: string;
		characterClass: string;
		level: number;
	}>();
</script>

<div class="rounded bg-white p-4 shadow">
	<h1 class="text-2xl font-bold">{name}</h1>
	<div class="text-gray-600">
		Level {level}
		{race}
		{characterClass}
	</div>
</div>
