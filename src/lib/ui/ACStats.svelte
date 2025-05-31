<!-- FILE: src/lib/ui/ACStats.svelte -->
<script lang="ts">
	import type { GameKernel } from '$lib/domain/kernel/GameKernel';
	import { ErrorCode } from '$lib/domain/kernel/ErrorHandler';
	import { Shield } from 'lucide-svelte';

	// Constants for file paths and ioctl requests
	const PATHS = {
		DEV_COMBAT: '/dev/combat',
		PROC_COMBAT: '/proc/character'
	};

	const COMBAT_REQUEST = {
		GET_AC: 0x3001,
		GET_TOUCH_AC: 0x3002,
		GET_FLAT_FOOTED_AC: 0x3003,
		GET_CMB: 0x3004,
		GET_CMD: 0x3005,
		GET_INITIATIVE: 0x3006,
		GET_ALL_COMBAT_STATS: 0x3007
	};

	// File operations
	const OpenMode = {
		READ: 0x01,
		WRITE: 0x02,
		READ_WRITE: 0x03
	};

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
	 * Unix-style file operation to load all combat stats
	 */
	async function loadCombatStats() {
		isLoading = true;
		error = null;

		// Ensure /proc directory exists
		if (!kernel.exists('/proc')) {
			console.log('Creating /proc directory');
			const procResult = kernel.mkdir('/proc');
			if (!procResult.success) {
				error = `Failed to create /proc directory: ${procResult.errorMessage || 'Unknown error'}`;
				isLoading = false;
				return;
			}
		}

		// Ensure /proc/character directory exists
		if (!kernel.exists('/proc/character')) {
			console.log('Creating /proc/character directory');
			const charDirResult = kernel.mkdir('/proc/character');
			if (!charDirResult.success) {
				error = `Failed to create /proc/character directory: ${charDirResult.errorMessage || 'Unknown error'}`;
				isLoading = false;
				return;
			}
		}

		// Get entity path for current character
		const entityPath = `/proc/character/${character.id}`;

		// Open combat device
		const fd = kernel.open(PATHS.DEV_COMBAT, OpenMode.READ);
		if (fd < 0) {
			error = `Failed to open combat device: error ${fd}`;
			isLoading = false;
			return;
		}

		try {
			// Get all combat stats
			const statsResult = kernel.ioctl(fd, COMBAT_REQUEST.GET_ALL_COMBAT_STATS, {
				entityPath
			});

			if (statsResult.errorCode !== ErrorCode.SUCCESS) {
				error = `Failed to get combat stats: ${statsResult.errorMessage}`;
				isLoading = false;
				return;
			}

			// Update local state
			combatStats = statsResult.data;
		} finally {
			// Always close the file descriptor
			if (fd > 0) kernel.close(fd);
			isLoading = false;
		}
	}

	/**
	 * Unix-style file operation to get a specific combat stat with full breakdown
	 */
	function getCombatStatBreakdown(statType: keyof typeof combatStats): ValueWithModifiers | null {
		if (!kernel || !character) {
			return null;
		}

		// Ensure /proc directory exists
		if (!kernel.exists('/proc')) {
			console.log('Creating /proc directory');
			const procResult = kernel.mkdir('/proc');
			if (!procResult.success) {
				console.error(
					`Failed to create /proc directory: ${procResult.errorMessage || 'Unknown error'}`
				);
				return null;
			}
		}

		// Ensure /proc/character directory exists
		if (!kernel.exists('/proc/character')) {
			console.log('Creating /proc/character directory');
			const charDirResult = kernel.mkdir('/proc/character');
			if (!charDirResult.success) {
				console.error(
					`Failed to create /proc/character directory: ${charDirResult.errorMessage || 'Unknown error'}`
				);
				return null;
			}
		}

		const entityPath = `/proc/character/${character.id}`;

		// Map stat type to ioctl request
		const requestMap = {
			ac: COMBAT_REQUEST.GET_AC,
			touch_ac: COMBAT_REQUEST.GET_TOUCH_AC,
			flat_footed_ac: COMBAT_REQUEST.GET_FLAT_FOOTED_AC,
			cmb: COMBAT_REQUEST.GET_CMB,
			cmd: COMBAT_REQUEST.GET_CMD,
			initiative: COMBAT_REQUEST.GET_INITIATIVE
		};

		const requestCode = requestMap[statType];
		if (!requestCode) {
			console.error(`Unknown stat type: ${statType}`);
			return null;
		}

		// Open combat device
		const fd = kernel.open(PATHS.DEV_COMBAT, OpenMode.READ);
		if (fd < 0) {
			console.error(`Failed to open combat device: error ${fd}`);
			return null;
		}

		try {
			// Get specific stat
			const statResult = kernel.ioctl(fd, requestCode, {
				entityPath
			});

			if (statResult.errorCode !== ErrorCode.SUCCESS) {
				console.error(`Failed to get stat breakdown: ${statResult.errorMessage}`);
				return null;
			}

			return statResult.data;
		} finally {
			// Always close the file descriptor
			if (fd > 0) kernel.close(fd);
		}
	}

	/**
	 * Handle selecting a combat stat to show breakdown
	 */
	function handleSelectStat(statType: keyof typeof combatStats) {
		if (kernel && character) {
			const breakdown = getCombatStatBreakdown(statType);
			if (breakdown) {
				onSelectValue(breakdown);
				return;
			}
		}

		// Use local data if available
		if (combatStats[statType]) {
			onSelectValue(combatStats[statType]);
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
