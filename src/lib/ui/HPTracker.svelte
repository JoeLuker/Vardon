<!-- FILE: src/lib/ui/HPTracker.svelte -->
<script lang="ts">
	
	import { characterStore, updateHP } from '$lib/state/characterStore';

	const { characterId } = $props<{ characterId: number }>();
	
	/**
	 * Locally, we define some Svelte 5 style state/derived runes for managing the slider,
	 * quick actions, etc. 
	 */
	
	// local reactive variables
	let isSliding = $state(false);
	let sliderValue = $state<number>(0);
	
	// If your store might be null while loading, we guard with `$characterStore?.character`
	let currentHp = $derived(Number($characterStore?.character?.current_hp ?? 0));
	let maxHp = $derived(Number($characterStore?.character?.max_hp ?? 0));
	
	/**
	 * If the user isn't currently dragging the slider,
	 * keep local sliderValue in sync with the store's currentHp.
	 */
	$effect(() => {
	  if (!isSliding) {
		sliderValue = currentHp;
	  }
	});
	
	/** 
	 * We can compute the HP bar percentage from sliderValue and maxHp 
	 */
	let hpPercentage = $derived(maxHp === 0 
	  ? 0 
	  : Math.round((sliderValue / maxHp) * 100));
	
	/** Quick actions, same as your original example */
	let quickActions = $state([
	  { amount: -5, label: '-5', class: 'text-accent hover:bg-accent/10' },
	  { amount: -1, label: '-1', class: 'text-accent hover:bg-accent/10' },
	  { amount: 1, label: '+1', class: 'text-green-600 hover:bg-green-50' },
	  { amount: 5, label: '+5', class: 'text-green-600 hover:bg-green-50' }
	]);
	
	function getHPColor(percentage: number): string {
	  if (percentage <= 20) return 'bg-red-500';
	  if (percentage <= 40) return 'bg-orange-500';
	  if (percentage <= 60) return 'bg-yellow-500';
	  if (percentage <= 80) return 'bg-emerald-500';
	  return 'bg-green-500';
	}
	
	/** Minimal "update state" approach; 
	 * or you can define a more robust pattern if you wish.
	 */
	let updateStatus = $state<'idle'|'syncing'|'error'>('idle');
	let errorMessage = $state<string | null>(null);
	
	/** 
	 * If your store expects an "optimistic" approach, 
	 * you can do that inside updateHP or define a separate function. 
	 * For simplicity, let's assume updateHP does the real DB update and 
	 * watchers will update the store. 
	 */
	async function handleQuickUpdate(amount: number) {
	  if (!$characterStore) return;
	
	  // new HP clamped
	  const newValue = Math.max(0, Math.min(maxHp, currentHp + amount));
	  if (newValue === currentHp) return;
	
	  try {
		updateStatus = 'syncing';
		await updateHP(characterId, newValue);
		// watchers in characterStore will auto-reflect new HP
		updateStatus = 'idle';
	  } catch (err) {
		console.error('Failed quick HP update:', err);
		updateStatus = 'error';
		errorMessage = 'Failed to update HP. Please try again.';
	  }
	}
	
	async function handleSliderUpdate(newValue: number) {
	  if (!$characterStore) return;
	  if (newValue === currentHp) return;
	
	  try {
		updateStatus = 'syncing';
		await updateHP(characterId, newValue);
		updateStatus = 'idle';
	  } catch (err) {
		console.error('Failed slider HP update:', err);
		updateStatus = 'error';
		errorMessage = 'Failed to update HP. Please try again.';
	  }
	}
	</script>
	
	<!-- Template: 
		 1) If store is null => show loading
		 2) Otherwise, show HP bar + quick actions
	-->
	{#if $characterStore === null}
	  <div class="card">
		<p>Loading HP data...</p>
	  </div>
	{:else}
	  <div 
		class="card space-y-6" 
		class:shadow-accent-20={updateStatus === 'error'}
	  >
		<div class="flex items-center justify-between">
		  <h2 class="text-xl font-bold text-primary">Hit Points</h2>
		  <div class="text-ink-light text-sm">Maximum: {maxHp}</div>
		</div>
	
		<!-- HP Bar and Slider Container -->
		<div class="relative h-4">
		  <div class="absolute inset-0 rounded-full bg-gray-100">
			<div 
			  class="h-full rounded-full {getHPColor(hpPercentage)}" 
			  style="width: {hpPercentage}%" 
			></div>
		</div>
	
		  <input
			type="range"
			min="0"
			max={maxHp}
			value={sliderValue}
			class="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0"
			oninput={(e) => {
			  sliderValue = parseInt(e.currentTarget.value);
			  isSliding = true;
			}}
			onchange={() => {
			  isSliding = false;
			  handleSliderUpdate(sliderValue);
			}}
			disabled={updateStatus === 'syncing'}
		  />
		</div>
	
		<!-- Quick Actions -->
		<div class="grid grid-cols-4 gap-3">
		  {#each quickActions as { amount, label, class: buttonClass }}
			{@const isDisabled =
			  updateStatus === 'syncing' 
			  || (amount < 0 ? Number(sliderValue) <= 0 : Number(sliderValue) >= Number(maxHp))}
	
			<button
			  class="interactive focus-ring rounded-lg border-2 border-transparent
					 bg-white/50 py-3 font-medium shadow-sm backdrop-blur-sm
					 {buttonClass} {isDisabled ? 'cursor-not-allowed opacity-50' : ''}"
			  onclick={() => handleQuickUpdate(amount)}
			  disabled={isDisabled}
			>
			  {label}
			</button>
		  {/each}
		</div>
	
		<!-- Current HP Display -->
		<div class="flex items-baseline justify-center gap-2">
		  <div class="text-4xl font-bold text-primary">{sliderValue}</div>
		  <div class="text-ink-light text-xl">/ {maxHp}</div>
		</div>
	
		{#if updateStatus === 'error' && errorMessage}
		  <div class="bg-accent/10 text-accent rounded-md p-3 text-sm">
			{errorMessage}
		  </div>
		{/if}
	  </div>
	{/if}
	