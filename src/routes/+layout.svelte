<script lang="ts">
	import '../app.css';
	import { cn } from '$lib/utils';
	import { Menu, X } from 'lucide-svelte';
	import ThemeToggle from '$lib/components/ui/theme-toggle.svelte';
	import { Button } from "$lib/components/ui/button";
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
		class="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 transition-opacity duration-200"
		onclick={handleOutsideClick}
		onkeydown={handleOutsideClick}
		role="button"
		tabindex="0"
	></div>
{/if}

<div class="min-h-screen bg-background text-foreground relative overflow-hidden">
	<!-- Header -->
	<header class="h-16 border-b bg-background/95 backdrop-blur">
		<div class="container h-full flex items-center justify-between">
			<!-- Left side: Nav button -->
			<Button 
				variant="ghost"
				size="icon"
				onclick={() => isSidebarOpen = !isSidebarOpen}
			>
				<Menu class="h-4 w-4" />
			</Button>

			<!-- Right side: Theme toggle -->
			<ThemeToggle />
		</div>
	</header>

	<!-- Sidebar -->
	<aside class={cn(
		"fixed top-0 left-0 w-64 h-screen bg-sidebar border-r",
		"transform transition-all duration-300 ease-in-out z-40",
		isSidebarOpen ? "translate-x-0 shadow-xl" : "-translate-x-full"
	)}>
		<!-- Add sidebar header -->
		<div class="h-16 border-b flex items-center justify-between px-4">
			<span class="font-semibold">Navigation</span>
			<Button 
				variant="ghost" 
				size="icon"
				onclick={() => isSidebarOpen = false}
			>
				<X class="h-4 w-4" />
			</Button>
		</div>

		<nav class="p-4 space-y-2">
			{#if isLoading}
				<p class="px-4 py-2 text-muted-foreground">Loading characters...</p>
			{:else if $multiCharStore?.length}
				{#each $multiCharStore as character}
					<button 
						class="block w-full text-left px-4 py-2 rounded-md hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground"
						onclick={() => handleCharacterClick(character.id)}
					>
						{character.name}
						<div class="text-xs text-muted-foreground">
							{character.classes
								.map(rpgClass => 
									`${rpgClass?.archetype ?? ''} ${rpgClass?.name ?? ''} ${rpgClass?.level ?? ''}`
								)
								.join(', ')}
						</div>
					</button>
				{/each}
			{:else}
				<p class="px-4 py-2 text-muted-foreground">No characters found...</p>
			{/if}
		</nav>
	</aside>

	<!-- Main content -->
	<div class="relative z-10">
		<main class={cn(
			"mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8",
			"prose dark:prose-invert max-w-none",
			"prose-headings:font-display prose-headings:text-foreground prose-headings:mt-0",
			"prose-p:text-foreground prose-p:mt-2 prose-strong:text-foreground",
			"prose-a:text-accent hover:prose-a:text-accent-foreground"
		)}>
			<slot />
		</main>
	</div>
</div>
