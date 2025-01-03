<script lang="ts">
	import type { PageData } from './$types';
	import { initializeCharacter } from '$lib/state/characterStore';

	// Admin UI components
	import AttributesManager from '$lib/ui/admin/AttributesManager.svelte';
	import FeatsManager from '$lib/ui/admin/FeatsManager.svelte';
	import DiscoveriesManager from '$lib/ui/admin/DiscoveriesManager.svelte';
	import ClassFeaturesManager from '$lib/ui/admin/ClassFeaturesManager.svelte';
	import SkillsManager from '$lib/ui/admin/SkillsManager.svelte';
	import FavoredClassBonusesManager from '$lib/ui/admin/FavoredClassBonusesManager.svelte';
	import TraitsManager from '$lib/ui/admin/TraitsManager.svelte';
	import AncestryManager from '$lib/ui/admin/AncestryManager.svelte';
	import EquipmentManager from '$lib/ui/admin/EquipmentManager.svelte';
	import CorruptionManager from '$lib/ui/admin/CorruptionManager.svelte';

	let { data } = $props<{ data: PageData }>();
	console.log('Admin data:', data);

	let initialized = $state(false);
	let character = data.character;

	$effect(() => {
		if (character) {
			try {
				initializeCharacter(character);
				initialized = true;
			} catch (err) {
				console.error('Failed to init:', err);
			}
		}
	});

	const tabs = [
		{ id: 'attributes', label: 'Attributes' },
		{ id: 'features', label: 'Class Features' },
		{ id: 'feats', label: 'Feats' },
		{ id: 'discoveries', label: 'Discoveries' },
		{ id: 'skills', label: 'Skills & Abilities' },
		{ id: 'equipment', label: 'Equipment' },
		{ id: 'spells', label: 'Spells & Extracts' },
		{ id: 'fcb', label: 'Favored Class Bonuses' },
		{ id: 'traits', label: 'Traits' },
		{ id: 'ancestries', label: 'Ancestries' },
		{ id: 'corruption', label: 'Corruption' }
	];

	let activeTab = $state('attributes');
</script>

{#if character && initialized}
	<div class="mx-auto max-w-7xl p-4">
		<h1 class="mb-4 text-2xl font-bold">Admin for {character.name}</h1>

		<div class="mb-6 flex gap-2" role="tablist">
			{#each tabs as tab}
				<button
					role="tab"
					aria-selected={activeTab === tab.id}
					aria-controls={`panel-${tab.id}`}
					id={`tab-${tab.id}`}
					class="rounded-lg px-4 py-2 {activeTab === tab.id
						? 'bg-primary text-white'
						: 'bg-gray-100 hover:bg-gray-200'}"
					onclick={() => (activeTab = tab.id)}
				>
					{tab.label}
				</button>
			{/each}
		</div>

		<div class="card">
			{#if activeTab === 'attributes'}
				<AttributesManager characterId={character.id} />
			{:else if activeTab === 'features'}
				<ClassFeaturesManager characterId={character.id} />
			{:else if activeTab === 'feats'}
				<FeatsManager characterId={character.id} />
			{:else if activeTab === 'discoveries'}
				<DiscoveriesManager characterId={character.id} />
			{:else if activeTab === 'skills'}
				<SkillsManager characterId={character.id} />
			{:else if activeTab === 'fcb'}
				<FavoredClassBonusesManager characterId={character.id} />
			{:else if activeTab === 'traits'}
				<TraitsManager />
			{:else if activeTab === 'ancestries'}
				<AncestryManager />
			{:else if activeTab === 'equipment'}
				<EquipmentManager characterId={character.id} />
			{:else if activeTab === 'corruption'}
				<CorruptionManager characterId={character.id} />
			{:else}
				<div class="p-4">
					Content for {activeTab} tab coming soon...
				</div>
			{/if}
		</div>
	</div>
{:else}
	<div class="flex h-screen items-center justify-center">
		<p>Loading or no data found</p>
	</div>
{/if}
