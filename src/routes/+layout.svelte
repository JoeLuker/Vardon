<script lang="ts">
	import '../app.css';
	import { cn } from '$lib/utils';
	import { Menu, X } from 'lucide-svelte';
	import ThemeToggle from '$lib/components/ui/theme-toggle.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import {
		characterList as multiCharStore,
		initMultiCharWatchers,
		loadAllCharacters,
		cleanupMultiCharWatchers
	} from '$lib/state/multiCharacterStore';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	// State for sidebar visibility
	let isSidebarOpen = false;

	// Add loading state
	let isLoading = true;

	// Close sidebar when clicking outside
	function handleOutsideClick(event: MouseEvent | KeyboardEvent) {
		const sidebar = document.querySelector('aside');
		if (isSidebarOpen && sidebar && !sidebar.contains(event.target as Node)) {
			isSidebarOpen = false;
		}
	}

	function handleCharacterClick(characterId: number) {
		isSidebarOpen = false;
		goto(`/characters/${characterId.toString()}`);
	}

	// Initialize character list on mount
	onMount(() => {
		initMultiCharWatchers();

		// Load characters and update loading state
		loadAllCharacters()
			.then(() => {
				isLoading = false;
			})
			.catch((err) => {
				console.error('Failed to load characters:', err);
				isLoading = false;
			});

		return () => {
			cleanupMultiCharWatchers();
		};
	});
</script>

<!-- Add backdrop overlay -->
{#if isSidebarOpen}
	<div
		class="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
		onclick={handleOutsideClick}
		onkeydown={handleOutsideClick}
		role="button"
		tabindex="0"
	></div>
{/if}

<div class="relative min-h-screen overflow-hidden bg-background text-foreground">
	<!-- Header -->
	<header class="h-16 border-b bg-background/95 backdrop-blur">
		<div class="container flex h-full items-center justify-between">
			<!-- Left side: Nav button -->
			<Button variant="ghost" size="icon" onclick={() => (isSidebarOpen = !isSidebarOpen)}>
				<Menu class="h-4 w-4" />
			</Button>

			<!-- Right side: Theme toggle -->
			<ThemeToggle />
		</div>
	</header>

	<!-- Sidebar -->
	<aside
		class={cn(
			'fixed left-0 top-0 h-screen w-64 border-r bg-sidebar',
			'z-40 transform transition-all duration-300 ease-in-out',
			isSidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'
		)}
	>
		<!-- Add sidebar header -->
		<div class="flex h-16 items-center justify-between border-b px-4">
			<span class="font-semibold">Navigation</span>
			<Button variant="ghost" size="icon" onclick={() => (isSidebarOpen = false)}>
				<X class="h-4 w-4" />
			</Button>
		</div>

		<nav class="space-y-2 p-4">
			{#if isLoading}
				<p class="px-4 py-2 text-muted-foreground">Loading characters...</p>
			{:else if $multiCharStore?.length}
				{#each $multiCharStore as character}
					<button
						class="block w-full rounded-md px-4 py-2 text-left text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
						onclick={() => handleCharacterClick(character.id)}
					>
						{character.label}
						<Badge variant="secondary" class="ml-2 text-xs">
							{character.classes
								.map(
									(rpgClass) =>
										`${rpgClass?.base?.label ?? ''} ${rpgClass?.level ?? ''}`
								)
								.join(', ')}
						</Badge>
					</button>
				{/each}
			{:else}
				<p class="px-4 py-2 text-muted-foreground">No characters found...</p>
			{/if}
		</nav>
	</aside>

	<!-- Main content -->
	<div class="relative z-10">
		<main
			class={cn(
				'mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8',
				'prose dark:prose-invert max-w-none',
				'prose-headings:font-display prose-headings:text-foreground prose-headings:mt-0',
				'prose-p:text-foreground prose-p:mt-2 prose-strong:text-foreground',
				'prose-a:text-accent hover:prose-a:text-accent-foreground'
			)}
		>
			<slot />
		</main>
	</div>
</div>
