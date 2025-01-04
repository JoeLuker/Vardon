<!-- FILE: src/lib/ui/CharacterHeader.svelte -->

<script lang="ts">
	import { characterStore } from '$lib/state/characterStore';
	import { Badge } from "$lib/components/ui/badge";
	import { Skeleton } from "$lib/components/ui/skeleton";
</script>

{#if $characterStore}
	<div class="card p-6">
		<div class="flex flex-col gap-2">
			<h1 class="text-3xl font-bold tracking-tight">
				{$characterStore.name}
			</h1>

			<div class="flex items-center gap-2">
				<Badge variant="secondary">Level {$characterStore.classes[0].level}</Badge>
				
				<span class="text-muted-foreground">
					{$characterStore.ancestry?.name ?? '???'}
					{#if $characterStore.classes?.length}
						{':'} 
						{$characterStore.classes
							.map((c) => c.name ?? '???')
							.join(', ')}
					{/if}
				</span>
			</div>
		</div>
	</div>
{:else}
	<div class="card p-6">
		<div class="flex flex-col gap-2">
			<Skeleton class="h-8 w-[250px]" />
			<div class="flex items-center gap-2">
				<Skeleton class="h-5 w-[100px]" />
				<Skeleton class="h-5 w-[200px]" />
			</div>
		</div>
	</div>
{/if}

