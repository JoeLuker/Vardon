<script lang="ts">
	import '../app.css';
	import { cn } from '$lib/utils';
	import ThemeToggle from '$lib/components/ui/theme-toggle.svelte';
</script>

<div class="min-h-screen bg-background text-foreground relative overflow-hidden">
	<div class="container flex h-14 justify-end items-center absolute top-10 right-10 z-50">
			<ThemeToggle />
	</div>

	<!-- Main content -->
	<div class="relative z-10">
			<main class={cn(
				"mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8",
				"prose dark:prose-invert max-w-none",
				"prose-headings:font-display prose-headings:text-foreground prose-headings:mt-0",
				"prose-p:text-muted-foreground prose-p:mt-2 prose-strong:text-foreground",
				"prose-a:text-accent hover:prose-a:text-accent-foreground"
			)}>
				<slot />
			</main>
	</div>
</div>
