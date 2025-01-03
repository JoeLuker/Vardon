<!-- FILE: src/lib/ui/CharacterHeader.svelte -->

<script lang="ts">
	import { characterStore } from '$lib/state/characterStore';

	/**
	 * We accept `characterId` as a prop if you need it 
	 * (for example, linking to "/admin/{characterId}").
	 */
	 const { characterId } = $props<{ characterId: number }>();
</script>

{#if $characterStore}
	<div class="card animate-fade-in">
		<div class="flex items-start justify-between">
			<div class="space-y-2">
				<h1 class="text-3xl font-bold text-primary">
					{$characterStore.character.name}
				</h1>

				<div class="text-ink-light flex items-center gap-3">
					<!-- Example "badge" for level -->
					<span class="badge">Level {$characterStore.classes[0].level}</span>
					
					<!-- Example ancestry + class display -->
					<span class="text-sm">
						{$characterStore.ancestry?.name ?? '???'}
						<!-- 
						  If you just want the first class:
						  {$characterStore.classes[0]?.name ?? '???'}
						  Or join multiple classes:
						-->
						{#if $characterStore.classes?.length}
							<!-- e.g. join by ',' if multiple classes -->
							{':'} 
							{$characterStore.classes
								.map((c) => c.name ?? '???')
								.join(', ')}
						{/if}
					</span>
				</div>
			</div>

			<div class="flex flex-col items-end gap-2">
				<!-- Link to some admin route if you want -->
				<a href={'/admin/' + characterId} class="text-sm text-blue-600 underline">
					Admin
				</a>
				<div class="rounded-full bg-primary/10 p-2">
					<div class="h-12 w-12 rounded-full bg-primary/20"></div>
				</div>
			</div>
		</div>
	</div>
{:else}
	<!-- If the character is not loaded yet -->
	<div class="card">
		<h2>Loading character data...</h2>
	</div>
{/if}
