<script lang="ts">
	import { browser } from '$app/environment';
	import { subscribeToCharacter, updateCharacterField } from '$lib/realtimeClient';
	import { debounce } from '$lib/utils/debounce';
	import CharacterHeader from '$lib/components/CharacterHeader.svelte';
	import HPTracker from '$lib/components/HPTracker.svelte';
	import Stats from '$lib/components/Stats.svelte';
	import Skills from '$lib/components/Skills.svelte';
	import CombatStats from '$lib/components/CombatStats.svelte';
	import Consumables from '$lib/components/Consumables.svelte';
	import LoadingOverlay from '$lib/components/LoadingOverlay.svelte';
	import BuffManager from '$lib/components/BuffManager.svelte';
	import type {
		Character,
		AttributeKey,
		ConsumableKey,
		DatabaseCharacterBuff,
		CharacterBuff,
		DatabaseCharacterSkill,
		CharacterSkill,
		KnownBuffType
	} from '$lib/types/character';
	import { KNOWN_BUFFS } from '$lib/types/character';
	import type { RealtimeStatus } from '$lib/realtimeClient';

	// Type guard for KnownBuffType
	function isKnownBuff(buff: string): buff is KnownBuffType {
		return KNOWN_BUFFS.includes(buff as KnownBuffType);
	}

	// Transform database buff to component buff
	function transformBuff(buff: DatabaseCharacterBuff): CharacterBuff | null {
		return isKnownBuff(buff.buff_type) 
			? { ...buff, buff_type: buff.buff_type as KnownBuffType }
			: null;
	}

	// Transform database skill to component skill
	function transformSkill(skill: DatabaseCharacterSkill): CharacterSkill {
		return {
			skill_name: skill.skill_name,
			ability: skill.ability,
			class_skill: skill.class_skill ?? false,
			ranks: skill.ranks
		};
	}

	let { data } = $props<{ data: { character: Character } }>();

	// Core state
	let character = $state(data.character);
	let isLoading = $state(false);
	let lastUpdateTime = $state(Date.now());
	let realtimeStatus = $state<RealtimeStatus>('disconnected');
	let unsubscribe = $state<(() => void) | undefined>(undefined);

	// Transform buffs for components
	let componentBuffs = $derived(
		(character.character_buffs ?? [])
			.map(transformBuff)
			.filter((buff: CharacterBuff | null): buff is CharacterBuff => buff !== null)
	);

	// Transform skills for components
	let componentSkills = $derived(
		((character.character_skills ?? []).map(transformSkill))
	);

	// Create debounced update function
	const debouncedUpdateField = debounce(updateCharacterField, 300);

	// Helper for optimistic updates
	async function optimisticUpdate(
		updateFn: () => Promise<unknown>,
		revertFn: () => void
	): Promise<void> {
		lastUpdateTime = Date.now();
		try {
			await updateFn();
		} catch (error) {
			revertFn();
			console.error('Update failed:', error);
		}
	}

	// Update handlers
	async function updateHP(newHP: number): Promise<void> {
		const previousHP = character.current_hp;
		character.current_hp = newHP;
		
		await optimisticUpdate(
			() => debouncedUpdateField('characters', character.id, { current_hp: newHP }),
			() => { character.current_hp = previousHP; }
		);
	}

	async function updateAttribute(attr: AttributeKey, value: number): Promise<void> {
		if (!character.character_attributes[0]) return;

		const previousValue = character.character_attributes[0][attr];
		character.character_attributes[0][attr] = value;

		await optimisticUpdate(
			() => debouncedUpdateField('character_attributes', character.id, { [attr]: value }),
			() => { character.character_attributes[0][attr] = previousValue; }
		);
	}

	async function updateSkills(skillRanks: Record<string, number>): Promise<void> {
		const previousSkills = [...(character.character_skills ?? [])];
		
		// Update with database fields
		character.character_skills = Object.entries(skillRanks).map(([name, ranks]) => ({
			id: previousSkills.find(s => s.skill_name === name)?.id ?? Date.now(),
			character_id: character.id,
			skill_name: name,
			ranks,
			class_skill: previousSkills.find(s => s.skill_name === name)?.class_skill ?? false,
				ability: previousSkills.find(s => s.skill_name === name)?.ability ?? 'str',
			sync_status: 'synced',
			updated_at: new Date().toISOString()
		}));

		await optimisticUpdate(
			() => Promise.all(
				Object.entries(skillRanks).map(([name, ranks]) =>
					debouncedUpdateField('character_skills', character.id, {
						skill_name: name,
						ranks
					})
				)
			),
			() => { character.character_skills = previousSkills; }
		);
	}

	async function updateConsumable(type: ConsumableKey, value: number): Promise<void> {
		if (!character.character_consumables[0]) return;

		const previousValue = character.character_consumables[0][type];
		character.character_consumables[0][type] = value;

		await optimisticUpdate(
			() => debouncedUpdateField('character_consumables', character.id, { [type]: value }),
			() => { character.character_consumables[0][type] = previousValue; }
		);
	}

	async function updateBombs(bombs: number): Promise<void> {
		if (!character.character_combat_stats[0]) return;

		const previousValue = character.character_combat_stats[0].bombs_left;
		character.character_combat_stats[0].bombs_left = bombs;

		await optimisticUpdate(
			() => debouncedUpdateField('character_combat_stats', character.id, { bombs_left: bombs }),
			() => { character.character_combat_stats[0].bombs_left = previousValue; }
		);
	}

	async function handleBuffToggle(buffName: string, active: boolean): Promise<void> {
		if (!isKnownBuff(buffName)) {
			console.error('Unknown buff type:', buffName);
			return;
		}

		const previousBuffs = [...character.character_buffs];
		
		const existingBuff = character.character_buffs.find((b: DatabaseCharacterBuff) => b.buff_type === buffName);
		if (existingBuff) {
			existingBuff.is_active = active;
		} else {
			character.character_buffs = [...character.character_buffs, {
				buff_type: buffName,
				is_active: active,
				character_id: character.id,
				id: Date.now(),
				updated_at: new Date().toISOString(),
				sync_status: 'synced'
			}];
		}

		await optimisticUpdate(
			() => updateCharacterField('character_buffs', character.id, {
				buff_type: buffName,
				is_active: active
			}),
			() => { character.character_buffs = previousBuffs; }
		);
	}

	// Realtime subscription setup
	$effect.pre(() => {
		if (!browser) return;

		unsubscribe = subscribeToCharacter(character.id, {
			character: (data) => {
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
			buffs: (data) => {
				if (Date.now() - lastUpdateTime > 1000) {
					character.character_buffs = character.character_buffs.map((buff: DatabaseCharacterBuff) => 
						buff.buff_type === data.buff_type 
							? { ...buff, is_active: data.is_active ?? false }
							: buff
					);
					
					if (!character.character_buffs.some((b: DatabaseCharacterBuff) => b.buff_type === data.buff_type)) {
						character.character_buffs = [...character.character_buffs, {
							...data,
							is_active: data.is_active ?? false,
							character_id: data.character_id ?? character.id,
							sync_status: (data.sync_status as "synced" | "pending" | "conflict" | null) ?? null
						}];
					}
				}
			},
			skills: (data) => {
				if (Date.now() - lastUpdateTime > 1000) {
					character.character_skills = character.character_skills.map((skill: DatabaseCharacterSkill) => 
						skill.skill_name === data[0].skill_name ? { ...skill, ...data[0] } : skill
					);
				}
			},
			status: (status) => {
				realtimeStatus = status;
			}
		});

		return () => {
			if (unsubscribe) unsubscribe();
		};
	});

	// Derived component props using transformed data
	let componentProps = $derived({
		header: {
			name: character.name,
			race: character.race,
			characterClass: character.class,
			level: character.level
		},
		hp: {
			currentHP: character.current_hp,
			maxHP: character.max_hp,
			onUpdate: updateHP
		},
		combat: {
			bombsLeft: character.character_combat_stats[0]?.bombs_left ?? 0,
			baseAttackBonus: character.character_combat_stats[0]?.base_attack_bonus ?? 0,
			activeBuffs: componentBuffs,
			onUpdateBombs: updateBombs
		},
		consumables: {
			alchemist_fire: character.character_consumables[0]?.alchemist_fire ?? 0,
			acid: character.character_consumables[0]?.acid ?? 0,
			tanglefoot: character.character_consumables[0]?.tanglefoot ?? 0,
			onUpdate: updateConsumable
		},
		stats: {
			attributes: character.character_attributes[0] ?? {
				str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10
			},
			activeBuffs: componentBuffs,
			onUpdateAttribute: updateAttribute
		},
		skills: {
			skills: componentSkills,
			characterId: character.id,
			onUpdateSkills: updateSkills
		},
		buffs: {
			activeBuffs: componentBuffs,
			onBuffToggle: handleBuffToggle
		}
	});
</script>

<LoadingOverlay {isLoading} showDelay={500} />

{#if realtimeStatus === 'disconnected'}
	<div class="fixed right-4 top-4 z-50 rounded border border-yellow-400 bg-yellow-100 px-4 py-3 text-yellow-700 shadow-lg">
		Offline Mode
	</div>
{/if}

<div class="mx-auto max-w-2xl space-y-4 p-4 sm:p-6 md:p-8">
	<div class="grid gap-4 sm:gap-6 md:gap-8">
		<CharacterHeader {...componentProps.header} />
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<div class="order-1 md:order-none">
				<HPTracker {...componentProps.hp} />
			</div>
			<div class="order-2 md:order-none">
				<CombatStats {...componentProps.combat} />
			</div>
		</div>
		<Stats {...componentProps.stats} />
		<Skills {...componentProps.skills} />
		<BuffManager {...componentProps.buffs} />
		<Consumables {...componentProps.consumables} />
	</div>
</div>