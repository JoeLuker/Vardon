<!-- FILE: src/lib/ui/ACStats.svelte -->
<script lang="ts">
	import type { GameKernel } from '$lib/domain/kernel/GameKernel';
	import { Shield } from 'lucide-svelte';

	// Value with modifiers type
	type ValueWithModifiers = {
		label: string;
		modifiers: Array<{ source: string; value: number }>;
		total: number;
	};

	/**
	 * Props:
	 * - character: Character object (can be simple ID reference)
	 * - kernel: GameKernel instance
	 * - onSelectValue: callback for clicking an AC breakdown
	 */
	let {
		character = null,
		kernel = null,
		onSelectValue = () => {}
	} = $props<{
		character: any;
		kernel: GameKernel | null;
		onSelectValue: (value: ValueWithModifiers) => void;
	}>();

	// Local state
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let combatStats = $state<{
		ac: ValueWithModifiers | null;
		touch_ac: ValueWithModifiers | null;
		flat_footed_ac: ValueWithModifiers | null;
		cmb: ValueWithModifiers | null;
		cmd: ValueWithModifiers | null;
		initiative: ValueWithModifiers | null;
	}>({
		ac: null,
		touch_ac: null,
		flat_footed_ac: null,
		cmb: null,
		cmd: null,
		initiative: null
	});

	// Load combat stats when component mounts
	$effect(() => {
		if (kernel && character) {
			loadCombatStats();
		}
	});

	/**
	 * Load combat stats from character data
	 */
	async function loadCombatStats() {
		isLoading = true;
		error = null;

		try {
			// Get ability modifiers
			const dexAbility = character.game_character_ability?.find(
				(a) => a.ability?.name?.toLowerCase() === 'dexterity'
			);
			let baseDex = dexAbility?.value || 10;
			
			// Check for ABP ability bonuses
			if (character.abpData?.appliedBonuses) {
				const dexABP = character.abpData.appliedBonuses.find(
					b => b.target === 'dexterity' && b.type === 'inherent'
				);
				if (dexABP) baseDex += dexABP.value;
			}
			
			const dexMod = Math.floor((baseDex - 10) / 2);

			const strAbility = character.game_character_ability?.find(
				(a) => a.ability?.name?.toLowerCase() === 'strength'
			);
			let baseStr = strAbility?.value || 10;
			
			// Check for ABP ability bonuses
			if (character.abpData?.appliedBonuses) {
				const strABP = character.abpData.appliedBonuses.find(
					b => b.target === 'strength' && b.type === 'inherent'
				);
				if (strABP) baseStr += strABP.value;
			}
			
			const strMod = Math.floor((baseStr - 10) / 2);

			// Get character level and size
			const characterLevel = character.totalLevel || 1;
			const bab = character.base_attack_bonus || 0;
			
			// Calculate AC values
			const baseAC = 10;
			const armorBonus = character.armor_bonus || 0;
			const shieldBonus = character.shield_bonus || 0;
			let naturalArmor = character.natural_armor || 0;
			
			// Get ABP bonuses
			let deflectionBonus = 0;
			let abpNaturalArmor = 0;
			
			if (character.abpData?.appliedBonuses) {
				// Deflection bonus
				const deflectionABP = character.abpData.appliedBonuses.find(
					b => b.target === 'ac' && b.type === 'deflection'
				);
				if (deflectionABP) deflectionBonus = deflectionABP.value;
				
				// Natural armor bonus (toughening)
				const naturalABP = character.abpData.appliedBonuses.find(
					b => b.target === 'ac' && b.type === 'natural'
				);
				if (naturalABP) abpNaturalArmor = naturalABP.value;
			}
			
			// Add ABP natural armor to total
			naturalArmor += abpNaturalArmor;
			
			// Build combat stats
			combatStats = {
				ac: {
					label: 'Armor Class',
					total: baseAC + dexMod + armorBonus + shieldBonus + naturalArmor + deflectionBonus,
					modifiers: [
						{ source: 'Base', value: baseAC },
						{ source: 'DEX Modifier', value: dexMod },
						{ source: 'Armor', value: armorBonus },
						{ source: 'Shield', value: shieldBonus },
						{ source: 'Natural Armor', value: naturalArmor },
						...(deflectionBonus ? [{ source: 'Deflection (ABP)', value: deflectionBonus }] : [])
					]
				},
				touch_ac: {
					label: 'Touch AC',
					total: baseAC + dexMod + deflectionBonus,
					modifiers: [
						{ source: 'Base', value: baseAC },
						{ source: 'DEX Modifier', value: dexMod },
						...(deflectionBonus ? [{ source: 'Deflection (ABP)', value: deflectionBonus }] : [])
					]
				},
				flat_footed_ac: {
					label: 'Flat-Footed AC',
					total: baseAC + armorBonus + shieldBonus + naturalArmor + deflectionBonus,
					modifiers: [
						{ source: 'Base', value: baseAC },
						{ source: 'Armor', value: armorBonus },
						{ source: 'Shield', value: shieldBonus },
						{ source: 'Natural Armor', value: naturalArmor },
						...(deflectionBonus ? [{ source: 'Deflection (ABP)', value: deflectionBonus }] : [])
					]
				},
				cmb: {
					label: 'Combat Maneuver Bonus',
					total: bab + strMod,
					modifiers: [
						{ source: 'BAB', value: bab },
						{ source: 'STR Modifier', value: strMod }
					]
				},
				cmd: {
					label: 'Combat Maneuver Defense',
					total: 10 + bab + strMod + dexMod,
					modifiers: [
						{ source: 'Base', value: 10 },
						{ source: 'BAB', value: bab },
						{ source: 'STR Modifier', value: strMod },
						{ source: 'DEX Modifier', value: dexMod }
					]
				},
				initiative: {
					label: 'Initiative',
					total: dexMod,
					modifiers: [
						{ source: 'DEX Modifier', value: dexMod }
					]
				}
			};

			isLoading = false;
		} catch (err) {
			error = `Failed to load combat stats: ${err instanceof Error ? err.message : String(err)}`;
			isLoading = false;
		}
	}

	/**
	 * Get a specific combat stat with full breakdown
	 */
	async function getCombatStatBreakdown(statType: keyof typeof combatStats): Promise<ValueWithModifiers | null> {
		if (!character) {
			return null;
		}

		// Return the stat data we already have
		return combatStats[statType];
	}

	/**
	 * Handle selecting a combat stat to show breakdown
	 */
	async function handleSelectStat(statType: keyof typeof combatStats) {
		const breakdown = await getCombatStatBreakdown(statType);
		if (breakdown) {
			onSelectValue(breakdown);
		}
	}

	// Helper function to format numbers with sign
	const formatModifier = (num: number) => (num >= 0 ? `+${num}` : `${num}`);
</script>

{#if isLoading}
	<div class="w-full animate-pulse space-y-2">
		<div class="h-10 rounded-md bg-muted"></div>
		<div class="flex h-24 items-center justify-center">
			<div class="h-20 w-20 rounded-full bg-muted"></div>
		</div>
		<div class="grid grid-cols-2 gap-2">
			<div class="h-10 rounded-md bg-muted"></div>
			<div class="h-10 rounded-md bg-muted"></div>
		</div>
	</div>
{:else if error}
	<div class="w-full space-y-2">
		<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
			{error}
		</div>
		<button class="text-sm text-primary hover:underline" onclick={loadCombatStats}> Retry </button>
	</div>
{:else}
	<div class="w-full space-y-2">
		<!-- Initiative -->
		<button
			type="button"
			class="flex w-full items-center justify-between rounded-md border border-accent/40 bg-accent/20 p-2 transition hover:bg-accent"
			onclick={() => handleSelectStat('initiative')}
		>
			<div class="font-bold">Initiative</div>
			<div>{combatStats.initiative ? formatModifier(combatStats.initiative.total) : '+0'}</div>
		</button>

		<!-- AC Layout -->
		<div class="relative flex h-24 items-end justify-center">
			<!-- Normal AC -->
			<button
				type="button"
				class="absolute z-20 rounded-full transition hover:bg-accent/10"
				onclick={() => handleSelectStat('ac')}
			>
				<div class="relative h-20 w-20">
					<Shield class="h-full w-full" />
					<div class="absolute inset-0 flex items-center justify-center text-xl font-bold">
						{combatStats.ac?.total ?? 10}
					</div>
				</div>
			</button>

			<!-- Touch AC -->
			<button
				type="button"
				class="absolute bottom-0 left-12 z-10 rounded-full transition hover:bg-accent/10"
				onclick={() => handleSelectStat('touch_ac')}
			>
				<div class="flex flex-col items-center">
					<div class="mb-1 text-xs font-medium text-blue-400">Touch</div>
					<div class="relative h-10 w-10">
						<Shield class="h-full w-full text-blue-400" />
						<div class="absolute inset-0 flex items-center justify-center text-sm font-bold">
							{combatStats.touch_ac?.total ?? 10}
						</div>
					</div>
				</div>
			</button>

			<!-- Flat-Footed AC -->
			<button
				type="button"
				class="absolute bottom-0 right-12 z-10 rounded-full transition hover:bg-accent/10"
				onclick={() => handleSelectStat('flat_footed_ac')}
			>
				<div class="flex flex-col items-center">
					<div class="mb-1 text-xs font-medium text-amber-400">Flat-Footed</div>
					<div class="relative h-10 w-10">
						<Shield class="h-full w-full text-amber-400" />
						<div class="absolute inset-0 flex items-center justify-center text-sm font-bold">
							{combatStats.flat_footed_ac?.total ?? 10}
						</div>
					</div>
				</div>
			</button>
		</div>

		<!-- Combat Maneuvers Row -->
		<div class="grid grid-cols-2 gap-2">
			<!-- CMB -->
			<button
				type="button"
				class="flex items-center justify-between rounded-md p-2 transition hover:bg-accent"
				onclick={() => handleSelectStat('cmb')}
			>
				<div class="font-semibold">CMB</div>
				<div>{combatStats.cmb ? formatModifier(combatStats.cmb.total) : '+0'}</div>
			</button>

			<!-- CMD -->
			<button
				type="button"
				class="flex items-center justify-between rounded-md p-2 transition hover:bg-accent"
				onclick={() => handleSelectStat('cmd')}
			>
				<div class="font-semibold">CMD</div>
				<div>{combatStats.cmd?.total ?? 10}</div>
			</button>
		</div>
	</div>
{/if}
