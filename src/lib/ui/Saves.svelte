<!-- FILE: src/lib/ui/Saves.svelte -->
<script lang="ts">
	import type { ValueWithBreakdown } from '$lib/ui/types/CharacterTypes';
	import type { GameKernel } from '$lib/domain/kernel/GameKernel';
	import { ErrorCode } from '$lib/domain/kernel/ErrorHandler';

	// Constants for file paths and ioctl requests
	const PATHS = {
		DEV_COMBAT: '/dev/combat',
		PROC_SAVES: '/proc/character'
	};

	const COMBAT_REQUEST = {
		GET_ALL_SAVES: 0x2001,
		GET_SAVE: 0x2002
	};

	// File operations
	const OpenMode = {
		READ: 0x01,
		WRITE: 0x02,
		READ_WRITE: 0x03
	};

	// Save types
	type SaveType = 'fortitude' | 'reflex' | 'will';

	/**
	 * Props:
	 * - character: Character object (can be simple ID reference)
	 * - kernel: GameKernel instance
	 * - onSelectValue: callback that receives the breakdown of the selected save
	 */
	let {
		character = null,
		kernel = null,
		onSelectValue = () => {}
	} = $props<{
		character: any;
		kernel: GameKernel | null;
		onSelectValue?: (val: ValueWithBreakdown) => void;
	}>();

	// Local state
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let saves = $state<Record<SaveType, ValueWithBreakdown | null>>({
		fortitude: null,
		reflex: null,
		will: null
	});

	// We'll list the keys and labels for each save
	let saveKeys = $derived(['fortitude', 'reflex', 'will'] as const);
	let saveLabels = $derived({
		fortitude: 'Fortitude',
		reflex: 'Reflex',
		will: 'Will'
	});

	// Load saves when component mounts
	$effect(() => {
		if (kernel && character) {
			loadSavesData();
		}
	});

	/**
	 * Unix-style file operation to load save data
	 */
	async function loadSavesData() {
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
			// Get all saves
			const savesResult = kernel.ioctl(fd, COMBAT_REQUEST.GET_ALL_SAVES, {
				entityPath
			});

			if (savesResult.errorCode !== ErrorCode.SUCCESS) {
				error = `Failed to get saves: ${savesResult.errorMessage}`;
				isLoading = false;
				return;
			}

			// Update local state
			saves = savesResult.data;
		} finally {
			// Always close the file descriptor
			if (fd > 0) kernel.close(fd);
			isLoading = false;
		}
	}

	/**
	 * Unix-style file operation to get a specific save's breakdown
	 */
	function getSaveBreakdown(saveType: SaveType): ValueWithBreakdown | null {
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

		// Open combat device
		const fd = kernel.open(PATHS.DEV_COMBAT, OpenMode.READ);
		if (fd < 0) {
			console.error(`Failed to open combat device: error ${fd}`);
			return null;
		}

		try {
			// Get specific save
			const saveResult = kernel.ioctl(fd, COMBAT_REQUEST.GET_SAVE, {
				entityPath,
				saveType
			});

			if (saveResult.errorCode !== ErrorCode.SUCCESS) {
				console.error(`Failed to get save breakdown: ${saveResult.errorMessage}`);
				return null;
			}

			return saveResult.data;
		} finally {
			// Always close the file descriptor
			if (fd > 0) kernel.close(fd);
		}
	}

	/**
	 * Handle selecting a save to show breakdown
	 */
	function handleSelectSave(saveType: SaveType) {
		if (kernel && character) {
			const breakdown = getSaveBreakdown(saveType);
			if (breakdown) {
				onSelectValue(breakdown);
				return;
			}
		}

		// Use local data if available
		if (saves[saveType]) {
			onSelectValue(saves[saveType]);
		}
	}

	// Helper to format a numeric bonus with +/-
	function formatBonus(bonus: number): string {
		return bonus >= 0 ? `+${bonus}` : `${bonus}`;
	}
</script>

{#if isLoading}
	<div class="card">
		<div class="flex items-center justify-center space-x-2 p-4 text-primary/70">
			<div
				class="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary"
			></div>
			<p>Loading saves...</p>
		</div>
	</div>
{:else if error}
	<div class="card space-y-6 border-destructive">
		<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
			{error}
		</div>
		<button class="text-sm text-primary hover:underline" onclick={loadSavesData}> Retry </button>
	</div>
{:else}
	<div class="card space-y-6">
		<div class="grid grid-cols-3 gap-6">
			{#each saveKeys as key}
				{#if saves[key]}
					<button class="save-card" type="button" onclick={() => handleSelectSave(key)}>
						<div class="card-inner">
							<div class="save-name">{saveLabels[key]}</div>
							<div class="primary-value">
								{formatBonus(saves[key]?.total ?? 0)}
							</div>
						</div>
					</button>
				{:else}
					<div class="save-card-placeholder">
						<div class="card-inner">
							<div class="save-name">{saveLabels[key]}</div>
							<div class="primary-value">--</div>
						</div>
					</div>
				{/if}
			{/each}
		</div>
	</div>
{/if}

<style lang="postcss">
	.save-card {
		@apply relative w-full rounded-lg border bg-card text-left shadow-sm transition-transform duration-200;
		border-color: hsl(var(--border) / 0.2);

		&:hover {
			@apply scale-105;
		}
	}

	.save-card-placeholder {
		@apply relative w-full rounded-lg border bg-card text-left opacity-70 shadow-sm;
		border-color: hsl(var(--border) / 0.2);
	}

	.card-inner {
		@apply flex flex-col items-center space-y-2 p-4;
	}

	.save-name {
		@apply text-sm font-medium text-muted-foreground;
	}

	.primary-value {
		@apply text-2xl font-bold text-foreground;
	}
</style>
