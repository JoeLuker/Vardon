<script>
    export let mobileMenuOpen = false;
    
    const navItems = [
        { href: '#def-off', text: 'Defense & Offense' },
        { href: '#equipment', text: 'Equipment' },
        { href: '#spells', text: 'Spells' },
        { href: '#statistics', text: 'Statistics' },
        { href: '#class-features', text: 'Class Features' }
    ];
</script>

<nav class="fixed top-0 left-0 w-full flex items-center justify-between flex-wrap bg-yellow-700 p-4 rounded-b-lg shadow-md z-50">
    <div class="flex items-center flex-shrink-0 text-white mr-6">
        <span class="font-semibold text-xl tracking-tight">PC Sheet</span>
    </div>
    
    <button 
        on:click={() => mobileMenuOpen = !mobileMenuOpen}
        class="block lg:hidden text-yellow-200 hover:text-white focus:outline-none"
    >
        <svg class="fill-current h-3 w-3" viewBox="0 0 20 20">
            <title>Menu</title>
            <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z"/>
        </svg>
    </button>
    
    <div class="w-full block flex-grow lg:flex lg:items-center lg:w-auto" class:hidden={!mobileMenuOpen}>
        <div class="text-sm lg:flex-grow">
            {#each navItems as {href, text}}
                <a {href} 
                   class="block mt-4 lg:inline-block lg:mt-0 text-yellow-200 hover:text-white mr-4"
                   on:click={() => mobileMenuOpen = false}
                >
                    {text}
                </a>
            {/each}
        </div>
    </div>
</nav>