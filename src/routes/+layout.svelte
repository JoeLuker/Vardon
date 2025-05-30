<script lang="ts">
	import '../app.css';
	import { cn } from '$lib/utils';
	import { Menu, X } from 'lucide-svelte';
	import ThemeToggle from '$lib/components/ui/theme-toggle.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { GameRulesAPI } from '$lib/db';
	import type { CompleteCharacter } from '$lib/db/gameRules.api';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	// Get children prop for layout content
	let { children } = $props();

	// State for sidebar visibility
	let isSidebarOpen = $state(false);

	// State for character data
	let characters = $state<CompleteCharacter[]>([]);
	let isLoading = $state(true);

	// Initialize GameRulesAPI without direct Supabase client
	const gameRules = new GameRulesAPI();

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

	// Helper function for logging with timestamps
	function getTimestamp() {
		const now = new Date();
		return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
	}
	
	// Load all characters
	async function loadCharacters() {
		try {
			isLoading = true;
			
			// Get basic character list
			console.log(`[${getTimestamp()}] [Layout] Fetching character list`);
			const basicCharacters = await gameRules.getAllGameCharacter();
			
			if (!basicCharacters || basicCharacters.length === 0) {
				console.log(`[${getTimestamp()}] [Layout] No characters found`);
				characters = [];
				isLoading = false;
				return;
			}
			
			// Get detailed character data
			console.log(`[${getTimestamp()}] [Layout] Fetching detailed data for ${basicCharacters.length} characters`);
			const characterIds = basicCharacters.map(char => char.id);
			const detailedCharacters = await Promise.all(
				characterIds.map(id => gameRules.getCompleteCharacterData(id))
			);
			
			// Filter out null results
			characters = detailedCharacters.filter((char): char is CompleteCharacter => char !== null);
			console.log(`[${getTimestamp()}] [Layout] Successfully loaded ${characters.length} characters`);
		} catch (err) {
			console.error(`[${getTimestamp()}] [Layout] Error loading characters:`, err);
		} finally {
			isLoading = false;
		}
	}

	// Initialize character list on mount
	onMount(async () => {
		// Create required filesystem directories and characters
		try {
			const kernel = gameRules.getKernel();
			if (kernel) {
				// Create base directories first
				if (!kernel.exists('/proc')) {
					kernel.mkdir('/proc');
				}
				if (!kernel.exists('/proc/character')) {
					kernel.mkdir('/proc/character');
				}
				
				console.log(`[${getTimestamp()}] [Layout] Created base directories`);
				
				// Get basic character list
				const basicChars = await gameRules.getAllGameCharacter();
				
				// Create character files immediately
				if (basicChars && basicChars.length > 0) {
					console.log(`[${getTimestamp()}] [Layout] Initializing ${basicChars.length} character files`);
					
					for (const char of basicChars) {
						const charPath = `/proc/character/${char.id}`;
						const charData = await gameRules.getCompleteCharacterData(char.id);
						
						if (!kernel.exists(charPath) && charData) {
							console.log(`[${getTimestamp()}] [Layout] Creating character file: ${charPath}`);
							kernel.create(charPath, charData);
						}
					}
				}
			}
		} catch (err) {
			console.error(`[${getTimestamp()}] [Layout] Error initializing filesystem:`, err);
		}
		
		// Now load characters after files are created
		loadCharacters();
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
			{:else if characters?.length}
				{#each characters as character}
					<button
						class="block w-full rounded-md px-4 py-2 text-left text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
						onclick={() => handleCharacterClick(character.id)}
					>
						{character.label}
						<Badge variant="secondary" class="ml-2 text-xs">
							{#if character.game_character_ancestry?.[0]?.ancestry?.label}
								{character.game_character_ancestry[0].ancestry.label}
								{#if character.game_character_class?.[0]}
									{' • '}
									{character.game_character_archetype?.[0]?.archetype?.label}
									{' '}
									{character.game_character_class[0].class?.label}
									{' '}
									{character.game_character_class[0].level}
								{/if}
							{/if}
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
			{@render children()}
		</main>
	</div>
</div>
