<script>
	import QueryDatabase from '$lib/ui/QueryDatabase.svelte';
</script>

<div class="container mx-auto p-4">
	<h1 class="mb-6 text-3xl font-bold">Database Query Tool</h1>
	<p class="mb-4">
		This page directly queries the Supabase database to show what data is available.
	</p>
	<QueryDatabase />
</div>
