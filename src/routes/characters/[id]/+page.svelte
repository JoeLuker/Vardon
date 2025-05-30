<script lang="ts">
	// Core imports
	import { onMount } from 'svelte';
	
	// Types
	import type { PageData } from './$types';
	
	// Character Page Component
	import CharacterPage from '$lib/ui/CharacterPage.svelte';
	
	// Props from the load function
	let { data } = $props<{ data: PageData }>();
</script>

<CharacterPage {data} />