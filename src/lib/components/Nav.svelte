<script lang="ts">
	export let mobileMenuOpen = false;

	const navItems = [
		{ href: '#def-off', text: 'Defense & Offense' },
		{ href: '#equipment', text: 'Equipment' },
		{ href: '#spells', text: 'Spells' },
		{ href: '#statistics', text: 'Statistics' },
		{ href: '#class-features', text: 'Class Features' }
	];
</script>

<nav
	class="fixed left-0 top-0 z-50 flex w-full flex-wrap items-center justify-between rounded-b-lg bg-yellow-700 p-4 shadow-md"
>
	<div class="mr-6 flex flex-shrink-0 items-center text-white">
		<span class="text-xl font-semibold tracking-tight">Vardon Salvador</span>
	</div>

	<button
		on:click={() => (mobileMenuOpen = !mobileMenuOpen)}
		class="block text-yellow-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-yellow-200 lg:hidden"
		aria-expanded={mobileMenuOpen}
		aria-label="Toggle navigation menu"
	>
		<svg class="h-6 w-6 fill-current" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
			{#if mobileMenuOpen}
				<path
					d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
				/>
			{:else}
				<path
					d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
				/>
			{/if}
		</svg>
	</button>

	<div
		class="block w-full flex-grow lg:flex lg:w-auto lg:items-center"
		class:hidden={!mobileMenuOpen}
	>
		<div class="text-sm lg:flex-grow">
			{#each navItems as { href, text }}
				<a
					{href}
					class="mr-4 mt-4 block text-yellow-200 transition-colors duration-200 hover:text-white lg:mt-0 lg:inline-block"
					on:click={() => (mobileMenuOpen = false)}
				>
					{text}
				</a>
			{/each}
		</div>
	</div>
</nav>

<style lang="postcss">
	.hidden {
		@apply transition-all duration-300 ease-in-out;
	}

	a {
		@apply rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-yellow-200 focus:ring-opacity-50;
	}

	@media (max-width: 1024px) {
		a {
			@apply py-2;
		}
	}
</style>
