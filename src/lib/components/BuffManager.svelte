<script lang="ts">
	import type { AttributeKey, CharacterBuff } from '$lib/types/character';

	type BuffEffect = {
		attribute: AttributeKey;
		modifier: number;
	};

	type Buff = {
		name: string;
		label: string;
		effects: BuffEffect[];
		conflicts: string[];
	};

	let { activeBuffs, onBuffToggle } = $props<{
		activeBuffs: CharacterBuff[];
		onBuffToggle: (buffName: string, active: boolean) => Promise<void>;
	}>();

	// Core buff definitions with their stat modifications
	const buffConfig = $state.raw<Buff[]>([
		{
			name: 'cognatogen',
			label: 'Intelligence Cognatogen',
			effects: [
				{ attribute: 'int', modifier: 4 },
				{ attribute: 'str', modifier: -2 }
			],
			conflicts: ['dex_mutagen']
		},
		{
			name: 'dex_mutagen',
			label: 'Dexterity Mutagen',
			effects: [
				{ attribute: 'dex', modifier: 4 },
				{ attribute: 'wis', modifier: -2 }
			],
			conflicts: ['cognatogen']
		},
		{
			name: 'deadly_aim',
			label: 'Deadly Aim',
			effects: [],
			conflicts: []
		},
		{
			name: 'rapid_shot',
			label: 'Rapid Shot',
			effects: [],
			conflicts: []
		},
		{
			name: 'two_weapon_fighting',
			label: 'Two-Weapon Fighting',
			effects: [],
			conflicts: []
		}
	]);

	// Handle buff activation/deactivation with optimistic updates
	async function toggleBuff(buffName: string) {
		const isCurrentlyActive = activeBuffs.some(
			(b: CharacterBuff) => b.buff_type === buffName && b.is_active
		);
		const buff = buffConfig.find((b: Buff) => b.name === buffName);
		if (!buff) return;

		// Store previous state for rollback
		const previousBuffs = activeBuffs.map((b: CharacterBuff) => ({ ...b }));

		// Optimistically update local state
		const buffIndex = activeBuffs.findIndex((b: CharacterBuff) => b.buff_type === buffName);
		if (buffIndex >= 0) {
			activeBuffs[buffIndex].is_active = !isCurrentlyActive;
		} else {
			activeBuffs = [
				...activeBuffs,
				{
					buff_type: buffName,
					is_active: true,
					character_id: null,
					id: Date.now(),
					updated_at: new Date().toISOString(),
					sync_status: 'synced'
				}
			];
		}

		try {
			// Deactivate conflicting buffs if activating
			if (!isCurrentlyActive && buff.conflicts.length > 0) {
				for (const conflict of buff.conflicts) {
					if (activeBuffs.some((b: CharacterBuff) => b.buff_type === conflict && b.is_active)) {
						await onBuffToggle(conflict, false);
					}
				}
			}

			await onBuffToggle(buffName, !isCurrentlyActive);
		} catch (error) {
			// Revert on failure
			activeBuffs = previousBuffs;
			console.error('Failed to toggle buff:', error);
		}
	}

	// Derived values for UI
	function isBuffActive(buffName: string): boolean {
		return activeBuffs.some((b: CharacterBuff) => b.buff_type === buffName && b.is_active);
	}
</script>

<div class="card space-y-4">
	<h2 class="font-bold">Active Effects</h2>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each buffConfig as buff (buff.name)}
			<div class="relative">
				<button
					class="w-full rounded-lg border-2 p-3 transition-all duration-200
                           focus:outline-none focus:ring-2 focus:ring-primary/50
                           {isBuffActive(buff.name)
						? 'border-primary bg-primary text-white hover:bg-primary-dark'
						: 'border-primary text-primary hover:bg-primary/10'}"
					onclick={() => toggleBuff(buff.name)}
					disabled={!isBuffActive(buff.name) && buff.conflicts.some((c) => isBuffActive(c))}
				>
					<div class="font-bold">{buff.label}</div>
					{#if isBuffActive(buff.name) && buff.effects.length > 0}
						<div class="mt-1 space-y-1 text-sm">
							{#each buff.effects as effect}
								<div>
									{effect.attribute.toUpperCase()}: {effect.modifier >= 0 ? '+' : ''}{effect.modifier}
								</div>
							{/each}
						</div>
					{/if}
				</button>

				{#if !isBuffActive(buff.name) && buff.conflicts.some((c) => isBuffActive(c))}
					<div class="absolute -right-2 -top-2 rounded-full bg-red-500 px-2 py-1 text-xs text-white">
						Conflicts
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>