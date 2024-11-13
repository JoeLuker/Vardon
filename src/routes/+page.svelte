<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { subscribeToCharacter, updateCharacterField } from '$lib/realtimeClient';
	import { debounce } from '$lib/utils/debounce';
	import CharacterHeader from '$lib/components/CharacterHeader.svelte';
	import HPTracker from '$lib/components/HPTracker.svelte';
	import Stats from '$lib/components/Stats.svelte';
	import CombatStats from '$lib/components/CombatStats.svelte';
	import Consumables from '$lib/components/Consumables.svelte';
	import LoadingOverlay from '$lib/components/LoadingOverlay.svelte';
	import type { Character, AttributeKey, ConsumableKey } from '$lib/types/character';
	import type { RealtimeStatus } from '$lib/realtimeClient';

	let { data } = $props<{ data: { character: Character } }>();

	// State
	let character = $state<Character>(data.character);
	let isLoading = $state(false);
	let lastUpdateTime = $state(Date.now());
	let realtimeStatus = $state<RealtimeStatus>('disconnected');
	let unsubscribe: (() => void) | undefined;

	// Create debounced update functions
	const debouncedUpdateField = debounce(updateCharacterField, 300);

	// Handle updates
	async function updateHP(newHP: number) {
		try {
			isLoading = true;
			await debouncedUpdateField('characters', character.id, { current_hp: newHP });
			character.current_hp = newHP;
			lastUpdateTime = Date.now();
		} catch (error) {
			console.error('Failed to update HP:', error);
		} finally {
			isLoading = false;
		}
	}

	async function updateAttribute(attr: AttributeKey, value: number) {
		try {
			isLoading = true;
			await debouncedUpdateField('character_attributes', character.id, { [attr]: value });
			if (character.character_attributes[0]) {
				character.character_attributes[0][attr] = value;
			}
			lastUpdateTime = Date.now();
		} catch (error) {
			console.error('Failed to update attribute:', error);
		} finally {
			isLoading = false;
		}
	}

	async function updateConsumable(type: ConsumableKey, value: number) {
		try {
			isLoading = true;
			await debouncedUpdateField('character_consumables', character.id, { [type]: value });
			if (character.character_consumables[0]) {
				character.character_consumables[0][type] = value;
			}
			lastUpdateTime = Date.now();
		} catch (error) {
			console.error('Failed to update consumable:', error);
		} finally {
			isLoading = false;
		}
	}

	async function updateBombs(bombs: number) {
		try {
			isLoading = true;
			await debouncedUpdateField('character_combat_stats', character.id, { bombs_left: bombs });
			if (character.character_combat_stats[0]) {
				character.character_combat_stats[0].bombs_left = bombs;
			}
			lastUpdateTime = Date.now();
		} catch (error) {
			console.error('Failed to update bombs:', error);
		} finally {
			isLoading = false;
		}
	}

	// Set up realtime subscription
	onMount(() => {
		if (browser) {
			unsubscribe = subscribeToCharacter(character.id, {
				character: (data) => {
					// Only update if the change came from another client
					if (Date.now() - lastUpdateTime > 1000) {
						character = { ...character, ...data };
					}
				},
				attributes: (data) => {
					if (Date.now() - lastUpdateTime > 1000 && character.character_attributes[0]) {
						character.character_attributes[0] = {
							...character.character_attributes[0],
							...data
						};
					}
				},
				combatStats: (data) => {
					if (Date.now() - lastUpdateTime > 1000 && character.character_combat_stats[0]) {
						character.character_combat_stats[0] = {
							...character.character_combat_stats[0],
							...data
						};
					}
				},
				consumables: (data) => {
					if (Date.now() - lastUpdateTime > 1000 && character.character_consumables[0]) {
						character.character_consumables[0] = {
							...character.character_consumables[0],
							...data
						};
					}
				},
				status: (status) => {
					realtimeStatus = status;
				}
			});
		}
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});

	// Derived props
	let headerProps = $derived({
		name: character.name,
		race: character.race,
		characterClass: character.class,
		level: character.level
	});

	let hpProps = $derived({
		currentHP: character.current_hp,
		maxHP: character.max_hp,
		onUpdate: updateHP
	});

	let combatProps = $derived({
		bombsLeft: character.character_combat_stats[0]?.bombs_left ?? 0,
		baseAttackBonus: character.character_combat_stats[0]?.base_attack_bonus ?? 0,
		onUpdateBombs: updateBombs
	});

	let consumableProps = $derived({
		alchemist_fire: character.character_consumables[0]?.alchemist_fire ?? 0,
		acid: character.character_consumables[0]?.acid ?? 0,
		tanglefoot: character.character_consumables[0]?.tanglefoot ?? 0,
		onUpdate: updateConsumable
	});

	let statsProps = $derived({
		attributes: character.character_attributes[0] ?? {
			str: 10,
			dex: 10,
			con: 10,
			int: 10,
			wis: 10,
			cha: 10
		},
		onUpdateAttribute: updateAttribute
	});
</script>

<LoadingOverlay {isLoading} showDelay={500} />

{#if realtimeStatus === 'disconnected'}
	<div
		class="fixed right-4 top-4 z-50 rounded border border-yellow-400 bg-yellow-100 px-4 py-3 text-yellow-700 shadow-lg"
	>
		Offline Mode
	</div>
{/if}

<div class="mx-auto max-w-2xl space-y-4 p-4 sm:p-6 md:p-8">
	<div class="grid gap-4 sm:gap-6 md:gap-8">
		<CharacterHeader {...headerProps} />
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<div class="order-1 md:order-none">
				<HPTracker {...hpProps} />
			</div>
			<div class="order-2 md:order-none">
				<CombatStats {...combatProps} />
			</div>
		</div>
		<Stats {...statsProps} />
		<Consumables {...consumableProps} />
	</div>
</div>
