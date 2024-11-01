<!-- src/routes/+page.svelte -->
<script>
    import { character } from '$lib/stores/character';
    import Nav from '$lib/components/Nav.svelte';
    import Stats from '$lib/components/Stats.svelte';
    import Combat from '$lib/components/Combat.svelte';
    import Equipment from '$lib/components/Equipment.svelte';
    import Spells from '$lib/components/Spells.svelte';
    import ClassTable from '$lib/components/ClassTable.svelte';
    import Discoveries from '$lib/components/Discoveries.svelte';
    import Feats from '$lib/components/Feats.svelte';

    let mobileMenuOpen = false;
</script>

<svelte:head>
    <title>Vardon Salvador | Character Sheet</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="pt-20">
    <Nav bind:mobileMenuOpen />
    
    <main class="content-container">
        <header class="text-center mb-8">
            <h1 class="text-4xl text-[#c19a6b]">Vardon Salvador</h1>
            <p class="text-[#c19a6b] text-xl mt-2">Magaambayan Mindchemist</p>
            <p class="text-[#c19a6b] mt-1">Level 5 Alchemist | Tengu </p>
            <p class="text-[#c19a6b] mt-2"><strong>Player:</strong> Aaron</p>
        </header>

        <Stats />
        <Combat />
        <Equipment />
        <Spells />
        <Discoveries />
        <Feats />

        <button 
            class="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            on:click={() => {
                if (confirm('Are you sure you want to reset all values?')) {
                    character.reset();
                }
            }}
        >
            Reset Sheet
        </button>
    </main>
</div>