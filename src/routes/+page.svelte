<script lang="ts">
	import { browser } from '$app/environment';
	import { subscribeToCharacter, updateCharacterField } from '$lib/realtimeClient';
	import CharacterHeader from '$lib/components/CharacterHeader.svelte';
	import HPTracker from '$lib/components/HPTracker.svelte';
	import Stats from '$lib/components/Stats.svelte';
	import Skills from '$lib/components/Skills.svelte';
	import CombatStats from '$lib/components/CombatStats.svelte';
	import Consumables from '$lib/components/Consumables.svelte';
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

	// Update handlers - simplified to just make the API calls
	async function updateHP(newHP: number): Promise<void> {
		await updateCharacterField('characters', character.id, { current_hp: newHP });
	}

	async function updateAttribute(attr: AttributeKey, value: number): Promise<void> {
		await updateCharacterField('character_attributes', character.id, { [attr]: value });
	}

	async function updateSkills(skillRanks: Record<string, number>): Promise<void> {
		await Promise.all(
			Object.entries(skillRanks).map(([name, ranks]) =>
				updateCharacterField('character_skills', character.id, {
					skill_name: name,
					ranks
				})
			)
		);
	}

	async function updateConsumable(type: ConsumableKey, value: number): Promise<void> {
		await updateCharacterField('character_consumables', character.id, { [type]: value });
	}

	async function updateBombs(bombs: number): Promise<void> {
		await updateCharacterField('character_combat_stats', character.id, { bombs_left: bombs });
	}

	async function handleBuffToggle(buffName: string, active: boolean): Promise<void> {
		if (!isKnownBuff(buffName)) {
			console.error('Unknown buff type:', buffName);
			return;
		}

		await updateCharacterField('character_buffs', character.id, {
			buff_type: buffName,
			is_active: active
		});
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
			characterId: character.id,
			currentHP: character.current_hp,
			maxHP: character.max_hp,
			onUpdate: updateHP
		},
		combat: {
			characterId: character.id,
			bombsLeft: character.character_combat_stats[0]?.bombs_left ?? 0,
			bind: {
				bombsLeft: character.character_combat_stats[0]?.bombs_left ?? 0
			},
			baseAttackBonus: character.character_combat_stats[0]?.base_attack_bonus ?? 0,
			activeBuffs: componentBuffs,
			onUpdateBombs: updateBombs
		},
		consumables: {
			characterId: character.id,
			alchemist_fire: character.character_consumables[0]?.alchemist_fire ?? 0,
			acid: character.character_consumables[0]?.acid ?? 0,
			tanglefoot: character.character_consumables[0]?.tanglefoot ?? 0,
			bind: {
				alchemist_fire: character.character_consumables[0]?.alchemist_fire ?? 0,
				acid: character.character_consumables[0]?.acid ?? 0,
				tanglefoot: character.character_consumables[0]?.tanglefoot ?? 0
			},
			onUpdate: updateConsumable
		},
		stats: {
			characterId: character.id,
			...(character.character_attributes[0] ?? {
				str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10
			}),
			bind: {
				attributes: character.character_attributes[0] ?? {
					str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10
				}
			},
			activeBuffs: componentBuffs,
			onUpdateAttribute: updateAttribute
		},
		skills: {
			characterId: character.id,
			skills: componentSkills,
			onUpdateSkills: updateSkills
		},
		buffs: {
			characterId: character.id,
			activeBuffs: componentBuffs,
			onBuffToggle: handleBuffToggle
		}
	});
</script>

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