<!-- FILE: src/lib/ui/HPTracker.svelte -->
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Progress } from '$lib/components/ui/progress';
	import { characterStore, updateHP } from '$lib/state/characterStore';

	let isSliding = $state(false);
	let sliderValue = $state<number>(0);
	let updateStatus = $state<'idle' | 'syncing' | 'error'>('idle');
	let errorMessage = $state<string | null>(null);

	let currentHp = $derived(Number($characterStore?.current_hp ?? 0));
	let maxHp = $derived(Number($characterStore?.max_hp ?? 0));
	let hpPercentage = $derived(maxHp === 0 ? 0 : Math.round((sliderValue / maxHp) * 100));

	$effect(() => {
		if (!isSliding) sliderValue = currentHp;
	});

	const quickActions = [
		{ amount: -5, label: '-5', variant: 'destructive' as const },
		{ amount: -1, label: '-1', variant: 'destructive' as const },
		{ amount: 1, label: '+1', variant: 'default' as const },
		{ amount: 5, label: '+5', variant: 'default' as const }
	];

	async function handleUpdate(newValue: number) {
		if (!$characterStore || newValue === currentHp) return;
		try {
			updateStatus = 'syncing';
			await updateHP($characterStore.id, Math.max(0, Math.min(maxHp, newValue)));
			updateStatus = 'idle';
		} catch (err) {
			console.error('Failed HP update:', err);
			updateStatus = 'error';
			errorMessage = 'Failed to update HP. Please try again.';
		}
	}
</script>

{#if $characterStore === null}
	<div class="card">
		<p class="text-muted-foreground">Loading HP data...</p>
	</div>
{:else}
	<div class="card space-y-6" class:border-destructive={updateStatus === 'error'}>
		<h2 class="section-title">Hit Points</h2>

		<div class="relative h-4">
			<Progress value={hpPercentage} class="h-full" />
			<input
				type="range"
				class="absolute inset-0 w-full cursor-pointer opacity-0"
				max={maxHp}
				min={0}
				value={sliderValue}
				disabled={updateStatus === 'syncing'}
				oninput={(e) => {
					sliderValue = +(e.target as HTMLInputElement).value;
					isSliding = true;
				}}
				onchange={(e) => {
					isSliding = false;
					handleUpdate(+(e.target as HTMLInputElement).value);
				}}
			/>
		</div>

		<div class="grid grid-cols-4 gap-3">
			{#each quickActions as { amount, label, variant }}
				<Button
					{variant}
					size="sm"
					disabled={updateStatus === 'syncing' ||
						(amount < 0 ? sliderValue <= 0 : sliderValue >= maxHp)}
					onclick={() => handleUpdate(currentHp + amount)}
				>
					{label}
				</Button>
			{/each}
		</div>

		<div class="flex items-baseline justify-center gap-2">
			<span class="text-4xl font-bold">{sliderValue}</span>
			<span class="text-xl text-muted-foreground">/ {maxHp}</span>
		</div>

		{#if updateStatus === 'error' && errorMessage}
			<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{errorMessage}</div>
		{/if}
	</div>
{/if}
